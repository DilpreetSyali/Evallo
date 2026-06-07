const { randomUUID } = require('crypto')

const { query } = require('../config/db')
const { logAction } = require('../utils/audit')
const { teamFromRow } = require('../utils/sqlSerializers')

const buildUpdateClause = (body, allowedFields) => {
  const params = []
  const sets = []

  allowedFields.forEach((field) => {
    if (body[field] !== undefined) {
      sets.push(`${field} = $${params.push(body[field])}`)
    }
  })

  return { params, sets }
}

const getEmployeesForTeam = async (teamId, organisationId) => {
  const { rows } = await query(
    `SELECT e.*
     FROM employees e
     JOIN team_employees te ON te.employee_id = e.id
     WHERE te.team_id = $1 AND e.organisation_id = $2`,
    [teamId, organisationId]
  )

  return rows.map((employee) => ({
    ...employee,
    id: employee.id,
    _id: employee.id,
  }))
}

exports.getAll = async (req, res) => {
  const { rows } = await query(
    `SELECT *
     FROM teams
     WHERE organisation_id = $1
     ORDER BY created_at DESC`,
    [req.user.organisation.id]
  )

  const data = await Promise.all(
    rows.map(async (team) => {
      const employees = await getEmployeesForTeam(team.id, req.user.organisation.id)
      return { ...teamFromRow(team, employees), employees }
    })
  )

  res.json({ success: true, data })
}

exports.getOne = async (req, res) => {
  const { rows } = await query(
    `SELECT *
     FROM teams
     WHERE id = $1 AND organisation_id = $2`,
    [req.params.id, req.user.organisation.id]
  )

  const team = rows[0]
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' })

  const employees = await getEmployeesForTeam(team.id, req.user.organisation.id)
  res.json({ success: true, data: { ...teamFromRow(team, employees), employees } })
}

exports.create = async (req, res) => {
  const teamId = randomUUID()
  const { name, department, description } = req.body

  await query(
    `INSERT INTO teams (id, name, department, description, organisation_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [teamId, name, department || null, description || null, req.user.organisation.id]
  )

  const { rows } = await query('SELECT * FROM teams WHERE id = $1', [teamId])
  const team = rows[0]

  await logAction({
    action: 'TEAM_CREATE',
    description: `User ${req.user.email} created team ${team.id}`,
    user: req.user,
    organisation: req.user.organisation.id,
  })

  res.status(201).json({ success: true, data: { ...teamFromRow(team), id: team.id } })
}

exports.update = async (req, res) => {
  const allowedFields = ['name', 'department', 'description']
  const { params: values, sets } = buildUpdateClause(req.body, allowedFields)

  if (sets.length === 0) {
    return res.status(400).json({ success: false, message: 'No valid fields provided' })
  }

  values.push(req.params.id, req.user.organisation.id)

  const { rows } = await query(
    `UPDATE teams
     SET ${sets.join(', ')}
     WHERE id = $${values.length - 1} AND organisation_id = $${values.length}
     RETURNING *`,
    values
  )

  const team = rows[0]
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' })

  await logAction({
    action: 'TEAM_UPDATE',
    description: `User ${req.user.email} updated team ${team.id}`,
    user: req.user,
    organisation: req.user.organisation.id,
  })

  res.json({ success: true, data: { ...teamFromRow(team), id: team.id } })
}

exports.remove = async (req, res) => {
  const { rows } = await query(
    `DELETE FROM teams
     WHERE id = $1 AND organisation_id = $2
     RETURNING *`,
    [req.params.id, req.user.organisation.id]
  )

  const team = rows[0]
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' })

  await logAction({
    action: 'TEAM_DELETE',
    description: `User ${req.user.email} deleted team ${team.id}`,
    user: req.user,
    organisation: req.user.organisation.id,
  })

  res.json({ success: true, message: 'Team deleted' })
}
