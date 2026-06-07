require('dotenv').config()

const bcrypt = require('bcryptjs')
const { randomUUID } = require('crypto')

const { query, initDatabase } = require('./config/db')

const demoPassword = 'Admin@123'

const organisations = [
  {
    id: randomUUID(),
    name: 'Acme Corporation',
    email: 'admin@acme.com',
    industry: 'Technology',
  },
]

const users = [
  {
    id: randomUUID(),
    name: 'Ava Morgan',
    email: 'admin@acme.com',
    password: demoPassword,
    role: 'admin',
    organisation_id: organisations[0].id,
  },
]

const employees = [
  {
    id: randomUUID(),
    first_name: 'John',
    last_name: 'Carter',
    email: 'john.carter@acme.com',
    phone: '555-0101',
    position: 'Frontend Engineer',
    department: 'Engineering',
    status: 'active',
    salary: 78000,
    hire_date: '2023-04-12',
    date_of_birth: '1994-08-18',
    organisation_id: organisations[0].id,
  },
  {
    id: randomUUID(),
    first_name: 'Maya',
    last_name: 'Singh',
    email: 'maya.singh@acme.com',
    phone: '555-0102',
    position: 'HR Manager',
    department: 'Human Resources',
    status: 'active',
    salary: 88000,
    hire_date: '2022-09-05',
    date_of_birth: '1991-02-11',
    organisation_id: organisations[0].id,
  },
  {
    id: randomUUID(),
    first_name: 'Ethan',
    last_name: 'Wright',
    email: 'ethan.wright@acme.com',
    phone: '555-0103',
    position: 'QA Analyst',
    department: 'Engineering',
    status: 'on_leave',
    salary: 68000,
    hire_date: '2021-12-01',
    date_of_birth: '1996-06-27',
    organisation_id: organisations[0].id,
  },
]

const teams = [
  {
    id: randomUUID(),
    name: 'Platform',
    department: 'Engineering',
    description: 'Builds the core product and shared services.',
    organisation_id: organisations[0].id,
  },
  {
    id: randomUUID(),
    name: 'People Ops',
    department: 'Human Resources',
    description: 'Handles hiring, onboarding, and employee support.',
    organisation_id: organisations[0].id,
  },
]

const teamEmployees = [
  { team_id: teams[0].id, employee_id: employees[0].id, role: 'Member' },
  { team_id: teams[0].id, employee_id: employees[2].id, role: 'Member' },
  { team_id: teams[1].id, employee_id: employees[1].id, role: 'Lead' },
]

const seed = async () => {
  await initDatabase()

  await query('DELETE FROM audit_logs')
  await query('DELETE FROM team_employees')
  await query('DELETE FROM teams')
  await query('DELETE FROM employees')
  await query('DELETE FROM users')
  await query('DELETE FROM organisations')

  const hashedPassword = await bcrypt.hash(demoPassword, 10)

  await query(
    `INSERT INTO organisations (id, name, email, industry)
     VALUES ($1, $2, $3, $4)`,
    [organisations[0].id, organisations[0].name, organisations[0].email, organisations[0].industry]
  )

  await query(
    `INSERT INTO users (id, name, email, password, role, organisation_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [users[0].id, users[0].name, users[0].email, hashedPassword, users[0].role, users[0].organisation_id]
  )

  for (const employee of employees) {
    await query(
      `INSERT INTO employees (
         id, first_name, last_name, email, phone, position, department, status, salary, hire_date, date_of_birth, organisation_id
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        employee.id,
        employee.first_name,
        employee.last_name,
        employee.email,
        employee.phone,
        employee.position,
        employee.department,
        employee.status,
        employee.salary,
        employee.hire_date,
        employee.date_of_birth,
        employee.organisation_id,
      ]
    )
  }

  for (const team of teams) {
    await query(
      `INSERT INTO teams (id, name, department, description, organisation_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [team.id, team.name, team.department, team.description, team.organisation_id]
    )
  }

  for (const membership of teamEmployees) {
    await query(
      `INSERT INTO team_employees (team_id, employee_id, role)
       VALUES ($1, $2, $3)`,
      [membership.team_id, membership.employee_id, membership.role]
    )
  }

  const logEntries = [
    {
      action: 'ORG_REGISTER',
      description: 'Organisation Acme Corporation created',
      user_id: users[0].id,
      organisation_id: organisations[0].id,
    },
    {
      action: 'EMPLOYEE_CREATE',
      description: `User ${users[0].email} added employee ${employees[0].id}`,
      user_id: users[0].id,
      organisation_id: organisations[0].id,
      meta: { employeeId: employees[0].id },
    },
    {
      action: 'TEAM_CREATE',
      description: `User ${users[0].email} created team ${teams[0].id}`,
      user_id: users[0].id,
      organisation_id: organisations[0].id,
    },
    {
      action: 'TEAM_ASSIGN',
      description: `User ${users[0].email} assigned employee ${employees[0].id} to team ${teams[0].id}`,
      user_id: users[0].id,
      organisation_id: organisations[0].id,
      meta: { role: 'Member' },
    },
  ]

  for (const entry of logEntries) {
    await query(
      `INSERT INTO audit_logs (id, action, description, user_id, organisation_id, meta)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        randomUUID(),
        entry.action,
        entry.description,
        entry.user_id,
        entry.organisation_id,
        entry.meta ? JSON.stringify(entry.meta) : null,
      ]
    )
  }

  console.log('Seeded demo data for Acme Corporation')
  console.log(`Demo login: admin@acme.com / ${demoPassword}`)
}

seed().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
