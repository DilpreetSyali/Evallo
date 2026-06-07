const parseMeta = (meta) => {
  if (!meta) return null
  if (typeof meta === 'object') return meta

  try {
    return JSON.parse(meta)
  } catch (error) {
    return meta
  }
}

const organisationFromRow = (row) => {
  if (!row) return null

  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    email: row.email,
    industry: row.industry ?? null,
    created_at: row.created_at ?? null,
    createdAt: row.created_at ?? null,
  }
}

const userFromRow = (row, organisation = null) => {
  if (!row) return null

  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    organisation: organisation || organisationFromRow({
      id: row.organisation_id,
      name: row.organisation_name,
      email: row.organisation_email,
      industry: row.organisation_industry,
      created_at: row.organisation_created_at,
    }),
  }
}

const employeeFromRow = (row, teams = []) => {
  if (!row) return null

  return {
    ...row,
    id: row.id,
    _id: row.id,
    organisation: row.organisation_id,
    teams,
  }
}

const teamFromRow = (row, employees = []) => {
  if (!row) return null

  return {
    ...row,
    id: row.id,
    _id: row.id,
    organisation: row.organisation_id,
    employees,
  }
}

const auditLogFromRow = (row) => {
  if (!row) return null

  return {
    ...row,
    id: row.id,
    _id: row.id,
    created_at: row.created_at,
    createdAt: row.created_at,
    meta: parseMeta(row.meta),
    user: row.user_id
      ? {
          id: row.user_id,
          _id: row.user_id,
          name: row.user_name,
          email: row.user_email,
        }
      : null,
  }
}

module.exports = {
  auditLogFromRow,
  employeeFromRow,
  organisationFromRow,
  parseMeta,
  teamFromRow,
  userFromRow,
}
