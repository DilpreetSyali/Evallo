import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftIcon, PencilIcon, TrashIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline'
import { teamAPI, employeeAPI } from '../services/api'
import TeamModal from '../components/teams/TeamModal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import toast from 'react-hot-toast'

export default function TeamDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState('')

  const { data } = useQuery({ queryKey: ['team', id], queryFn: () => teamAPI.getOne(id) })
  const { data: employeesData } = useQuery({ queryKey: ['employees-all'], queryFn: () => employeeAPI.getAll({ limit: 200 }) })

  const team = data?.data?.data
  const employees = employeesData?.data?.data || []
  const assignedIds = new Set(team?.employees?.map((emp) => emp.id))
  const availableEmployees = employees.filter((emp) => !assignedIds.has(emp.id))

  const assignMutation = useMutation({
    mutationFn: () => employeeAPI.assignTeam(selectedEmployee, { teamId: id, role: 'Member' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team', id] })
      qc.invalidateQueries({ queryKey: ['teams'] })
      qc.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Employee assigned')
      setSelectedEmployee('')
    },
  })

  const removeMutation = useMutation({
    mutationFn: (employeeId) => employeeAPI.removeFromTeam(employeeId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team', id] })
      qc.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Employee removed')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => teamAPI.delete(id),
    onSuccess: () => {
      toast.success('Team deleted')
      navigate('/teams')
    },
  })

  if (!team) {
    return <div className="text-center py-20 text-gray-500">Team not found</div>
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <Link to="/teams" className="btn-ghost text-gray-600">
          <ArrowLeftIcon className="w-4 h-4" /> Back to Teams
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

      <div className="card p-6">
        <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
        <p className="text-gray-600 mt-1">{team.department || 'General department'}</p>
        <p className="text-sm text-gray-500 mt-4">{team.description || 'No description available.'}</p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Team Members ({team.employees?.length || 0})</h2>
          {availableEmployees.length > 0 && (
            <div className="flex items-center gap-2">
              <select className="input w-64" value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}>
                <option value="">Assign existing employee</option>
                {availableEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
              <button className="btn-primary" disabled={!selectedEmployee || assignMutation.isPending} onClick={() => assignMutation.mutate()}>
                <PlusIcon className="w-4 h-4" /> Add
              </button>
            </div>
          )}
        </div>
        <div className="divide-y divide-gray-100">
          {team.employees?.length ? team.employees.map((emp) => (
            <div key={emp.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <Link to={`/employees/${emp.id}`} className="font-medium text-gray-900 hover:text-primary-600">
                  {emp.first_name} {emp.last_name}
                </Link>
                <div className="text-xs text-gray-500">{emp.position || emp.department || 'Employee'}</div>
              </div>
              <button className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500" onClick={() => removeMutation.mutate(emp.id)}>
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          )) : <p className="text-center text-gray-400 text-sm py-8">No employees assigned</p>}
        </div>
      </div>

      {editing && <TeamModal team={team} onClose={() => setEditing(false)} />}
      {deleting && (
        <ConfirmDialog
          title="Delete Team"
          message={`Delete ${team.name}?`}
          confirmLabel="Delete"
          danger
          loading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate()}
          onCancel={() => setDeleting(false)}
        />
      )}
    </div>
  )
}
