import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftIcon, PencilIcon, TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { employeeAPI, teamAPI } from '../services/api'
import EmployeeModal from '../components/employees/EmployeeModal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import toast from 'react-hot-toast'

const statusColor = { active: 'badge-green', inactive: 'badge-gray', on_leave: 'badge-yellow', terminated: 'badge-red' }

export default function EmployeeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [editing, setEditing]     = useState(false)
  const [deleting, setDeleting]   = useState(false)
  const [addTeam, setAddTeam]     = useState(false)
  const [selectedTeam, setSelTeam] = useState('')
  const [teamRole, setTeamRole]   = useState('Member')

  const { data, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeAPI.getOne(id),
  })
  const { data: teamsData } = useQuery({
    queryKey: ['teams-all'],
    queryFn: () => teamAPI.getAll(),
  })

  const emp    = data?.data?.data
  const teams  = teamsData?.data?.data || []
  const empTeamIds = emp?.teams?.map(t => t.id) || []
  const availableTeams = teams.filter(t => !empTeamIds.includes(t.id))

  const assignMut = useMutation({
    mutationFn: () => employeeAPI.assignTeam(id, { teamId: selectedTeam, role: teamRole }),
    onSuccess: () => { qc.invalidateQueries(['employee', id]); setAddTeam(false); toast.success('Team assigned') },
  })

  const removeMut = useMutation({
    mutationFn: (teamId) => employeeAPI.removeFromTeam(id, teamId),
    onSuccess: () => { qc.invalidateQueries(['employee', id]); toast.success('Removed from team') },
  })

  const deleteMut = useMutation({
    mutationFn: () => employeeAPI.delete(id),
    onSuccess: () => { toast.success('Employee deleted'); navigate('/employees') },
  })

  if (isLoading) return <div className="text-center py-20 text-gray-400">Loading…</div>
  if (!emp) return <div className="text-center py-20 text-gray-500">Employee not found</div>

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Link to="/employees" className="btn-ghost text-gray-600">
          <ArrowLeftIcon className="w-4 h-4" /> Back to Employees
        </Link>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setEditing(true)}>
            <PencilIcon className="w-4 h-4" /> Edit
          </button>
          <button className="btn-danger" onClick={() => setDeleting(true)}>
            <TrashIcon className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* Profile card */}
      <div className="card p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-700 font-bold text-xl flex-shrink-0">
            {emp.first_name[0]}{emp.last_name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{emp.first_name} {emp.last_name}</h1>
              <span className={statusColor[emp.status] || 'badge-gray'}>{emp.status}</span>
            </div>
            <p className="text-gray-600 mt-0.5">{emp.position}{emp.department ? ` · ${emp.department}` : ''}</p>
          </div>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          {[
            ['Email', emp.email],
            ['Phone', emp.phone || '—'],
            ['Department', emp.department || '—'],
            ['Salary', emp.salary ? `$${Number(emp.salary).toLocaleString()}` : '—'],
            ['Hire Date', emp.hire_date || '—'],
            ['Date of Birth', emp.date_of_birth || '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
              <p className="font-medium text-gray-900 mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Teams */}
      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Team Memberships ({emp.teams?.length || 0})</h2>
          {availableTeams.length > 0 && (
            <button className="btn-primary" onClick={() => setAddTeam(!addTeam)}>
              <PlusIcon className="w-4 h-4" /> Assign Team
            </button>
          )}
        </div>

        {/* Add team form */}
        {addTeam && (
          <div className="p-5 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="label">Team</label>
              <select className="input" value={selectedTeam} onChange={e => setSelTeam(e.target.value)}>
                <option value="">Select a team…</option>
                {availableTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Role</label>
              <input className="input w-32" value={teamRole} onChange={e => setTeamRole(e.target.value)} placeholder="Member" />
            </div>
            <button className="btn-primary" disabled={!selectedTeam || assignMut.isPending}
              onClick={() => assignMut.mutate()}>
              Assign
            </button>
            <button className="btn-ghost" onClick={() => setAddTeam(false)}>Cancel</button>
          </div>
        )}

        <div className="divide-y divide-gray-100">
          {emp.teams?.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">Not assigned to any team</p>
          )}
          {emp.teams?.map(team => (
            <div key={team.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <Link to={`/teams/${team.id}`} className="font-medium text-gray-900 hover:text-primary-600">
                  {team.name}
                </Link>
                <div className="text-xs text-gray-500 mt-0.5">
                  {team.department && <span>{team.department} · </span>}
                  Role: <span className="font-medium">{team.EmployeeTeam?.role || 'Member'}</span>
                </div>
              </div>
              <button className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                onClick={() => removeMut.mutate(team.id)}>
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {editing && <EmployeeModal employee={emp} onClose={() => setEditing(false)} />}
      {deleting && (
        <ConfirmDialog
          title="Delete Employee"
          message={`Delete ${emp.first_name} ${emp.last_name}? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => deleteMut.mutate()}
          onCancel={() => setDeleting(false)}
          loading={deleteMut.isPending}
        />
      )}
    </div>
  )
}