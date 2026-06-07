const { query } = require('../config/db')
const { auditLogFromRow } = require('../utils/sqlSerializers')

exports.getAll = async (req, res) => {
  const limit = Number(req.query.limit || 20)

  const { rows } = await query(
    `SELECT
       a.id,
       a.action,
       a.description,
       a.user_id,
       a.organisation_id,
       a.meta,
       a.created_at,
       u.name AS user_name,
       u.email AS user_email
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.user_id
     WHERE a.organisation_id = $1
     ORDER BY a.created_at DESC
     LIMIT $2`,
    [req.user.organisation.id, limit]
  )

  res.json({ success: true, data: rows.map((row) => auditLogFromRow(row)) })
}
