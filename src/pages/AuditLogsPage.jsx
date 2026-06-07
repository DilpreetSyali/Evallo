import { useQuery } from '@tanstack/react-query'
import { auditAPI } from '../services/api'
import { format } from 'date-fns'

export default function AuditLogsPage() {
  const { data } = useQuery({ queryKey: ['audit-logs'], queryFn: () => auditAPI.getAll({ limit: 100 }) })
  const logs = data?.data?.data || []

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500 mt-0.5">Backend activity and security trail</p>
      </div>
      <div className="card divide-y divide-gray-100">
        {logs.map((log) => (
          <div key={log.id} className="px-5 py-4">
            <p className="text-sm text-gray-800">{log.description}</p>
            <p className="text-xs text-gray-500 mt-1">
              {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
              {log.user ? ` • ${log.user.name}` : ''}
            </p>
          </div>
        ))}
        {logs.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No logs yet</p>}
      </div>
    </div>
  )
}
