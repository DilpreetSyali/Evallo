import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { UsersIcon, UserGroupIcon, ChartBarIcon, ClockIcon } from '@heroicons/react/24/outline'
import { employeeAPI, teamAPI, auditAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import { format } from 'date-fns'

const StatCard = ({ label, value, icon: Icon, color, to }) => (
  <Link to={to} className="card p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
      </div>
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </Link>
)

const statusColor = { active: 'badge-green', inactive: 'badge-gray', on_leave: 'badge-yellow', terminated: 'badge-red' }

export default function DashboardPage() {
  const { user, organisation } = useAuthStore()

  const { data: empData }   = useQuery({ queryKey: ['employees-all'], queryFn: () => employeeAPI.getAll({ limit: 100 }) })
  const { data: teamData }  = useQuery({ queryKey: ['teams-all'],     queryFn: () => teamAPI.getAll() })
  const { data: auditData } = useQuery({ queryKey: ['audit-recent'],  queryFn: () => auditAPI.getAll({ limit: 8 }) })

  const employees = empData?.data?.data || []
  const teams     = teamData?.data?.data || []
  const logs      = auditData?.data?.data || []

  const activeCount = employees.filter(e => e.status === 'active').length
  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good morning, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">{organisation?.name} · {format(new Date(), 'EEEE, MMMM d yyyy')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value={employees.length} icon={UsersIcon}     color="bg-primary-600" to="/employees" />
        <StatCard label="Active"          value={activeCount}      icon={ChartBarIcon}   color="bg-green-500"   to="/employees?status=active" />
        <StatCard label="Teams"           value={teams.length}     icon={UserGroupIcon}  color="bg-purple-500"  to="/teams" />
        <StatCard label="Departments"     value={departments.length} icon={ChartBarIcon} color="bg-orange-500"  to="/employees" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent employees */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Employees</h2>
            <Link to="/employees" className="text-sm text-primary-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {employees.slice(0, 5).map(emp => (
              <Link key={emp.id} to={`/employees/${emp.id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0">
                  {emp.first_name[0]}{emp.last_name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {emp.first_name} {emp.last_name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{emp.position || emp.department}</div>
                </div>
                <span className={statusColor[emp.status] || 'badge-gray'}>{emp.status}</span>
              </Link>
            ))}
            {employees.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">No employees yet</p>
            )}
          </div>
        </div>

        {/* Audit log */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Activity</h2>
            {user?.role === 'admin' && (
              <Link to="/audit-logs" className="text-sm text-primary-600 hover:underline">View all</Link>
            )}
          </div>
          <div className="divide-y divide-gray-50">
            {logs.map(log => (
              <div key={log.id} className="px-5 py-3">
                <p className="text-sm text-gray-800 leading-snug">{log.description}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {format(new Date(log.created_at), 'MMM d, HH:mm')}
                  {log.user && ` · ${log.user.name}`}
                </p>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">No activity yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Teams overview */}
      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Teams Overview</h2>
          <Link to="/teams" className="text-sm text-primary-600 hover:underline">Manage teams</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
          {teams.map(team => (
            <Link key={team.id} to={`/teams/${team.id}`}
              className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:bg-primary-50/40 transition-colors">
              <div className="font-medium text-gray-900">{team.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">{team.department}</div>
              <div className="text-sm text-gray-600 mt-2">
                {team.employees?.length || 0} member{team.employees?.length !== 1 ? 's' : ''}
              </div>
            </Link>
          ))}
          {teams.length === 0 && (
            <p className="text-gray-400 text-sm col-span-3 text-center py-4">No teams yet</p>
          )}
        </div>
      </div>
    </div>
  )
}