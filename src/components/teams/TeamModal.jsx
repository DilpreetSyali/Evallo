import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { teamAPI } from '../../services/api'

export default function TeamModal({ team, onClose }) {
  const qc = useQueryClient()
  const isEdit = !!team
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { name: '', department: '', description: '' },
  })

  useEffect(() => {
    if (team) reset(team)
  }, [team, reset])

  const mutation = useMutation({
    mutationFn: (payload) => (isEdit ? teamAPI.update(team.id, payload) : teamAPI.create(payload)),
    onSuccess: () => {
      toast.success(isEdit ? 'Team updated' : 'Team created')
      qc.invalidateQueries({ queryKey: ['teams'] })
      qc.invalidateQueries({ queryKey: ['teams-all'] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
      <div className="card w-full max-w-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900">{isEdit ? 'Edit Team' : 'Add Team'}</h2>
        <form className="mt-5 space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
          <div>
            <label className="label">Team Name</label>
            <input className="input" {...register('name', { required: true })} />
          </div>
          <div>
            <label className="label">Department</label>
            <input className="input" {...register('department')} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-28" {...register('description')} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
