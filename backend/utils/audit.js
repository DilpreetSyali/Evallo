const { randomUUID } = require('crypto')
const { query } = require('../config/db')

const logAction = async ({ action, description, user, organisation, meta }) => {
  const userId = user?._id || user?.id || user || null
  const organisationId = organisation?._id || organisation?.id || organisation

  await query(
    `INSERT INTO audit_logs (id, action, description, user_id, organisation_id, meta)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [randomUUID(), action, description, userId, organisationId, meta ? JSON.stringify(meta) : null]
  )
}

module.exports = { logAction }
