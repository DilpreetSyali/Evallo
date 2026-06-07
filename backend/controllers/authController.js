const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { randomUUID } = require('crypto')

const { query, withTransaction } = require('../config/db')
const { signAccessToken, signRefreshToken } = require('../utils/tokens')
const { logAction } = require('../utils/audit')
const { organisationFromRow, userFromRow } = require('../utils/sqlSerializers')

const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: false }

const buildAuthPayload = async (userRow, organisationRow = null) => {
  const organisation =
    organisationRow ||
    organisationFromRow({
      id: userRow.organisation_id,
      name: userRow.organisation_name,
      email: userRow.organisation_email,
      industry: userRow.organisation_industry,
      created_at: userRow.organisation_created_at,
    })

  const user = userFromRow(userRow, organisation)

  return {
    user,
    organisation,
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
  }
}

exports.register = async (req, res) => {
  const { orgName, orgEmail, orgIndustry, name, email, password } = req.body

  if (!orgName || !orgEmail || !name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Missing required fields' })
  }

  const normalizedOrgEmail = orgEmail.toLowerCase()
  const normalizedEmail = email.toLowerCase()

  const { rows: existingUsers } = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail])
  if (existingUsers[0]) {
    return res.status(409).json({ success: false, message: 'Email already in use' })
  }

  const { rows: existingOrgs } = await query('SELECT id FROM organisations WHERE email = $1', [normalizedOrgEmail])
  if (existingOrgs[0]) {
    return res.status(409).json({ success: false, message: 'Organisation email already in use' })
  }

  const organisationId = randomUUID()
  const userId = randomUUID()
  const hashedPassword = await bcrypt.hash(password, 10)

  const payload = await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO organisations (id, name, email, industry)
       VALUES ($1, $2, $3, $4)`,
      [organisationId, orgName, normalizedOrgEmail, orgIndustry || null]
    )

    const { rows: userRows } = await client.query(
      `INSERT INTO users (id, name, email, password, role, organisation_id)
       VALUES ($1, $2, $3, $4, 'admin', $5)
       RETURNING id, name, email, role, organisation_id`,
      [userId, name, normalizedEmail, hashedPassword, organisationId]
    )

    const { rows: organisationRows } = await client.query(
      `SELECT id, name, email, industry, created_at
       FROM organisations
       WHERE id = $1`,
      [organisationId]
    )

    const authPayload = await buildAuthPayload(
      {
        ...userRows[0],
        organisation_name: organisationRows[0].name,
        organisation_email: organisationRows[0].email,
        organisation_industry: organisationRows[0].industry,
        organisation_created_at: organisationRows[0].created_at,
      },
      organisationRows[0]
    )

    return authPayload
  })

  await logAction({
    action: 'ORG_REGISTER',
    description: `Organisation ${payload.organisation.name} created`,
    user: payload.user,
    organisation: payload.organisation.id,
  })

  res.cookie('refreshToken', payload.refreshToken, cookieOptions)
  res.status(201).json({ success: true, data: payload })
}

exports.login = async (req, res) => {
  const { email, password } = req.body
  const normalizedEmail = email?.toLowerCase()

  const { rows } = await query(
    `SELECT
       u.id,
       u.name,
       u.email,
       u.password,
       u.role,
       u.organisation_id,
       o.name AS organisation_name,
       o.email AS organisation_email,
       o.industry AS organisation_industry,
       o.created_at AS organisation_created_at
     FROM users u
     JOIN organisations o ON o.id = u.organisation_id
     WHERE u.email = $1`,
    [normalizedEmail]
  )

  const row = rows[0]
  if (!row) return res.status(401).json({ success: false, message: 'Invalid credentials' })

  const matched = await bcrypt.compare(password, row.password)
  if (!matched) return res.status(401).json({ success: false, message: 'Invalid credentials' })

  const payload = await buildAuthPayload(row)
  res.cookie('refreshToken', payload.refreshToken, cookieOptions)

  await logAction({
    action: 'LOGIN',
    description: `User ${payload.user.email} logged in`,
    user: payload.user,
    organisation: payload.organisation.id,
  })

  res.json({ success: true, data: payload })
}

exports.logout = async (req, res) => {
  if (req.user) {
    await logAction({
      action: 'LOGOUT',
      description: `User ${req.user.email} logged out`,
      user: req.user,
      organisation: req.user.organisation.id,
    })
  }

  res.clearCookie('refreshToken', cookieOptions)
  res.json({ success: true, message: 'Logged out' })
}

exports.me = async (req, res) => {
  res.json({
    success: true,
    data: {
      user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role },
      organisation: req.user.organisation,
    },
  })
}

exports.refresh = async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token required' })

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    const { rows } = await query(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.password,
         u.role,
         u.organisation_id,
         o.name AS organisation_name,
         o.email AS organisation_email,
         o.industry AS organisation_industry,
         o.created_at AS organisation_created_at
       FROM users u
       JOIN organisations o ON o.id = u.organisation_id
       WHERE u.id = $1`,
      [payload.userId]
    )

    const row = rows[0]
    if (!row) return res.status(401).json({ success: false, message: 'Invalid refresh token' })

    const authPayload = await buildAuthPayload(row)
    res.json({
      success: true,
      data: {
        accessToken: authPayload.accessToken,
        refreshToken: authPayload.refreshToken,
      },
    })
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' })
  }
}
