const { newDb } = require('pg-mem')
const { Pool: NativePool } = require('pg')

const schemaSql = `
CREATE TABLE IF NOT EXISTS organisations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  industry TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'user')),
  organisation_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  position TEXT,
  department TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'terminated')),
  salary NUMERIC,
  hire_date TEXT,
  date_of_birth TEXT,
  organisation_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT,
  description TEXT,
  organisation_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_employees (
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'Member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (team_id, employee_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  organisation_id TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`

let pool = null
let initPromise = null

const createPool = () => {
  if (process.env.DATABASE_URL) {
    return new NativePool({ connectionString: process.env.DATABASE_URL })
  }

  const database = newDb({ autoCreateForeignKeyIndices: true })
  const { Pool } = database.adapters.createPg()
  return new Pool()
}

const initDatabase = async () => {
  if (!initPromise) {
    initPromise = (async () => {
      pool = createPool()
      await pool.query(schemaSql)
      return pool
    })()
  }

  return initPromise
}

const query = async (text, params = []) => {
  await initDatabase()
  return pool.query(text, params)
}

const withTransaction = async (handler) => {
  await initDatabase()
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    const result = await handler(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

module.exports = {
  initDatabase,
  query,
  withTransaction,
}
