import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { employeeAPI, teamAPI } from '../../services/api'

export default function EmployeeModal({ employee, onClose }) {
  const qc = useQueryClient()
  const isEdit = !!employee

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      status: 'active',
      salary: '',
      hire_date: '',
      date_of_birth: '',
    },
  })

  const { data: teamsData } = useQuery({
    queryKey: ['teams-modal'],
    queryFn: () => teamAPI.getAll(),
  })

  useEffect(() => {
    if (employee) {
      reset({
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        position: employee.position || '',
        department: employee.department || '',
        status: employee.status || 'active',
        salary: employee.salary || '',
        hire_date: employee.hire_date || '',
        date_of_birth: employee.date_of_birth || '',
      })
    }
  }, [employee, reset])

  const saveMutation = useMutation({
    mutationFn: (payload) => (isEdit ? employeeAPI.update(employee.id, payload) : employeeAPI.create(payload)),
    onSuccess: async (res) => {
      const saved = res?.data?.data
      if (saved?.id) {
        const selectedTeams = Array.from(document.querySelectorAll('[data-team-select]:checked')).map((el) => el.value)
        await Promise.all(selectedTeams.map((teamId) => employeeAPI.assignTeam(saved.id, { teamId, role: 'Member' })))
      }
      toast.success(isEdit ? 'Employee updated' : 'Employee created')
      qc.invalidateQueries({ queryKey: ['employees'] })
      qc.invalidateQueries({ queryKey: ['employees-all'] })
      qc.invalidateQueries({ queryKey: ['employee'] })
      onClose()
    },
  })

  const onSubmit = (values) => {
    saveMutation.mutate(values)
  }

  const teams = teamsData?.data?.data || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{isEdit ? 'Edit Employee' : 'Add Employee'}</h2>
            <p className="text-sm text-gray-500 mt-1">Manage the employee profile and team memberships.</p>
          </div>
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            ['first_name', 'First Name'],
            ['last_name', 'Last Name'],
            ['email', 'Email', 'email'],
            ['phone', 'Phone'],
            ['position', 'Position'],
            ['department', 'Department'],
            ['salary', 'Salary', 'number'],
            ['hire_date', 'Hire Date', 'date'],
            ['date_of_birth', 'Date of Birth', 'date'],
          ].map(([name, label, type = 'text']) => (
            <div key={name} className={name === 'position' || name === 'department' ? 'sm:col-span-1' : ''}>
              <label className="label">{label}</label>
              <input className="input" type={type} {...register(name, { required: name === 'first_name' || name === 'last_name' || name === 'email' })} />
            </div>
          ))}

          <div>
            <label className="label">Status</label>
            <select className="input" {...register('status')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="label">Assign to teams</label>
            <div className="grid sm:grid-cols-2 gap-2 border border-gray-200 rounded-lg p-3">
              {teams.map((team) => (
                <label key={team.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" value={team.id} data-team-select />
                  {team.name}
                </label>
              ))}
              {teams.length === 0 && <p className="text-sm text-gray-400">Create teams first to assign members.</p>}
            </div>
          </div>

          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting || saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
