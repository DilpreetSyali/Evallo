const { randomUUID } = require('crypto')

const { query } = require('../config/db')
const { logAction } = require('../utils/audit')
const { employeeFromRow } = require('../utils/sqlSerializers')

const buildFilter = (req, params) => {
  const clauses = [`organisation_id = $${params.push(req.user.organisation.id)}`]

  if (req.query.status) {
    clauses.push(`status = $${params.push(req.query.status)}`)
  }

  if (req.query.search) {
    const search = `%${req.query.search}%`
    const index = params.push(search)
    clauses.push(
      `(
        first_name ILIKE $${index}
        OR last_name ILIKE $${index}
        OR email ILIKE $${index}
        OR position ILIKE $${index}
      )`
    )
  }

  return clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
}

const getTeamMap = async (organisationId) => {
  const { rows } = await query(
    `SELECT te.employee_id, t.id, t.name, t.department
     FROM team_employees te
     JOIN teams t ON t.id = te.team_id
     WHERE t.organisation_id = $1`,
    [organisationId]
  )

  const employeeTeamMap = new Map()
  rows.forEach((row) => {
    if (!employeeTeamMap.has(row.employee_id)) {
      employeeTeamMap.set(row.employee_id, [])
    }

    employeeTeamMap.get(row.employee_id).push({
      id: row.id,
      _id: row.id,
      name: row.name,
      department: row.department,
    })
  })

  return employeeTeamMap
}

exports.getAll = async (req, res) => {
  const page = Number(req.query.page || 1)
  const limit = Number(req.query.limit || 15)
  const params = []
  const whereClause = buildFilter(req, params)

  const [{ rows: employeeRows }, { rows: countRows }] = await Promise.all([
    query(
      `SELECT *
       FROM employees
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.push(limit)} OFFSET $${params.push((page - 1) * limit)}`,
      params
    ),
    query(`SELECT COUNT(*)::int AS total FROM employees ${whereClause}`, params.slice(0, params.length - 2)),
  ])

  const employeeTeamMap = await getTeamMap(req.user.organisation.id)
  const data = employeeRows.map((employee) =>
    employeeFromRow(employee, employeeTeamMap.get(employee.id) || [])
  )

  const total = countRows[0]?.total || 0
  res.json({
    success: true,
    data,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}

exports.getOne = async (req, res) => {
  const { rows } = await query(
    `SELECT *
     FROM employees
     WHERE id = $1 AND organisation_id = $2`,
    [req.params.id, req.user.organisation.id]
  )

  const employee = rows[0]
  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' })

  const { rows: teamRows } = await query(
    `SELECT t.id, t.name, t.department
     FROM teams t
     JOIN team_employees te ON te.team_id = t.id
     WHERE t.organisation_id = $1 AND te.employee_id = $2`,
    [req.user.organisation.id, employee.id]
  )

  res.json({
    success: true,
    data: {
      ...employeeFromRow(employee),
      teams: teamRows.map((team) => ({
        id: team.id,
        _id: team.id,
        name: team.name,
        department: team.department,
        EmployeeTeam: { role: 'Member' },
      })),
    },
  })
}

exports.create = async (req, res) => {
  const employeeId = randomUUID()
  const fields = {
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    email: req.body.email?.toLowerCase(),
    phone: req.body.phone || null,
    position: req.body.position || null,
    department: req.body.department || null,
    status: req.body.status || 'active',
    salary: req.body.salary ?? null,
    hire_date: req.body.hire_date || null,
    date_of_birth: req.body.date_of_birth || null,
  }

  await query(
    `INSERT INTO employees (
       id, first_name, last_name, email, phone, position, department, status, salary, hire_date, date_of_birth, organisation_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      employeeId,
      fields.first_name,
      fields.last_name,
      fields.email,
      fields.phone,
      fields.position,
      fields.department,
      fields.status,
      fields.salary,
      fields.hire_date,
      fields.date_of_birth,
      req.user.organisation.id,
    ]
  )

  const { rows } = await query('SELECT * FROM employees WHERE id = $1', [employeeId])
  const employee = rows[0]

  await logAction({
    action: 'EMPLOYEE_CREATE',
    description: `User ${req.user.email} added employee ${employee.id}`,
    user: req.user,
    organisation: req.user.organisation.id,
    meta: { employeeId: employee.id },
  })

  res.status(201).json({ success: true, data: { ...employeeFromRow(employee), id: employee.id } })
}

exports.update = async (req, res) => {
  const allowedFields = [
    'first_name',
    'last_name',
    'email',
    'phone',
    'position',
    'department',
    'status',
    'salary',
    'hire_date',
    'date_of_birth',
  ]

  const updates = []
  const params = []

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = $${params.push(field === 'email' ? req.body[field].toLowerCase() : req.body[field])}`)
    }
  })

  if (updates.length === 0) {
    return res.status(400).json({ success: false, message: 'No valid fields provided' })
  }

  params.push(req.params.id, req.user.organisation.id)

  const { rows } = await query(
    `UPDATE employees
     SET ${updates.join(', ')}
     WHERE id = $${params.length - 1} AND organisation_id = $${params.length}
     RETURNING *`,
    params
  )

  const employee = rows[0]
  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' })

  await logAction({
    action: 'EMPLOYEE_UPDATE',
    description: `User ${req.user.email} updated employee ${employee.id}`,
    user: req.user,
    organisation: req.user.organisation.id,
  })

  res.json({ success: true, data: { ...employeeFromRow(employee), id: employee.id } })
}

exports.remove = async (req, res) => {
  const { rows } = await query(
    `DELETE FROM employees
     WHERE id = $1 AND organisation_id = $2
     RETURNING *`,
    [req.params.id, req.user.organisation.id]
  )

  const employee = rows[0]
  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' })

  await logAction({
    action: 'EMPLOYEE_DELETE',
    description: `User ${req.user.email} deleted employee ${employee.id}`,
    user: req.user,
    organisation: req.user.organisation.id,
  })

  res.json({ success: true, message: 'Employee deleted' })
}

exports.assignTeam = async (req, res) => {
  const { teamId, role } = req.body

  const { rows: teamRows } = await query(
    `SELECT id, name, department
     FROM teams
     WHERE id = $1 AND organisation_id = $2`,
    [teamId, req.user.organisation.id]
  )

  const { rows: employeeRows } = await query(
    `SELECT id
     FROM employees
     WHERE id = $1 AND organisation_id = $2`,
    [req.params.id, req.user.organisation.id]
  )

  const team = teamRows[0]
  const employee = employeeRows[0]

  if (!team || !employee) {
    return res.status(404).json({ success: false, message: 'Employee or team not found' })
  }

  await query(
    `INSERT INTO team_employees (team_id, employee_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (team_id, employee_id) DO UPDATE SET role = EXCLUDED.role`,
    [team.id, employee.id, role || 'Member']
  )

  await logAction({
    action: 'TEAM_ASSIGN',
    description: `User ${req.user.email} assigned employee ${employee.id} to team ${team.id}`,
    user: req.user,
    organisation: req.user.organisation.id,
    meta: { role: role || 'Member' },
  })

  res.json({ success: true, message: 'Team assigned' })
}

exports.removeFromTeam = async (req, res) => {
  const { rows: teamRows } = await query(
    `SELECT id
     FROM teams
     WHERE id = $1 AND organisation_id = $2`,
    [req.params.teamId, req.user.organisation.id]
  )

  const team = teamRows[0]
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' })

  await query(
    `DELETE FROM team_employees
     WHERE team_id = $1 AND employee_id = $2`,
    [team.id, req.params.id]
  )

  await logAction({
    action: 'TEAM_UNASSIGN',
    description: `User ${req.user.email} removed employee ${req.params.id} from team ${team.id}`,
    user: req.user,
    organisation: req.user.organisation.id,
  })

  res.json({ success: true, message: 'Removed from team' })
}
