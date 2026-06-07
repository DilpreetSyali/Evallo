import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline'
import { teamAPI } from '../services/api'
import ConfirmDialog from '../components/common/ConfirmDialog'
import TeamModal from '../components/teams/TeamModal'
import toast from 'react-hot-toast'

export default function TeamsPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data } = useQuery({ queryKey: ['teams'], queryFn: () => teamAPI.getAll() })
  const teams = data?.data?.data || []

  const deleteMutation = useMutation({
    mutationFn: (id) => teamAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] })
      qc.invalidateQueries({ queryKey: ['teams-all'] })
      toast.success('Team deleted')
      setDeleteTarget(null)
    },
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="text-sm text-gray-500 mt-0.5">{teams.length} total teams</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('create')}>
          <PlusIcon className="w-4 h-4" /> Add Team
        </button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {teams.map((team) => (
          <div key={team.id} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-900">{team.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{team.department || 'General'}</p>
              </div>
              <span className="badge-blue">{team.employees?.length || 0} members</span>
            </div>
            <p className="text-sm text-gray-600 mt-4 line-clamp-3">{team.description || 'No description added.'}</p>
            <div className="mt-5 flex items-center gap-2">
              <Link to={`/teams/${team.id}`} className="btn-secondary py-1.5 px-3 text-xs">
                <EyeIcon className="w-4 h-4" /> View
              </Link>
              <button className="btn-secondary py-1.5 px-3 text-xs" onClick={() => setModal(team)}>
                <PencilIcon className="w-4 h-4" /> Edit
              </button>
              <button className="btn-danger py-1.5 px-3 text-xs" onClick={() => setDeleteTarget(team)}>
                <TrashIcon className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        ))}
        {teams.length === 0 && <p className="text-gray-400 text-sm">No teams created yet.</p>}
      </div>

      {modal && <TeamModal team={modal === 'create' ? null : modal} onClose={() => setModal(null)} />}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Team"
          message={`Delete ${deleteTarget.name}? This will remove its member links.`}
          confirmLabel="Delete"
          danger
          loading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
