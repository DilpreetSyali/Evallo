const jwt = require('jsonwebtoken')
const { query } = require('../config/db')
const { organisationFromRow, userFromRow } = require('../utils/sqlSerializers')

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' })
    }

    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET)

    const { rows } = await query(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.password,
         u.role,
         u.organisation_id,
         o.id AS organisation_row_id,
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
    if (!row) {
      return res.status(401).json({ success: false, message: 'Invalid token' })
    }

    const organisation = organisationFromRow({
      id: row.organisation_row_id,
      name: row.organisation_name,
      email: row.organisation_email,
      industry: row.organisation_industry,
      created_at: row.organisation_created_at,
    })

    req.user = {
      ...userFromRow(row, organisation),
      password: row.password,
      organisation,
    }

    next()
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

module.exports = authMiddleware
