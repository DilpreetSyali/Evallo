import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline'
import { employeeAPI } from '../services/api'
import EmployeeModal from '../components/employees/EmployeeModal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import toast from 'react-hot-toast'

const statusColor  = { active: 'badge-green', inactive: 'badge-gray', on_leave: 'badge-yellow', terminated: 'badge-red' }
const statusLabels = { active: 'Active', inactive: 'Inactive', on_leave: 'On Leave', terminated: 'Terminated' }

export default function EmployeesPage() {
  const qc = useQueryClient()
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatus] = useState('')
  const [page, setPage]           = useState(1)
  const [modal, setModal]         = useState(null)   // null | 'create' | employee obj
  const [deleteTarget, setDelete] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['employees', search, statusFilter, page],
    queryFn: () => employeeAPI.getAll({ search, status: statusFilter, page, limit: 15 }),
    keepPreviousData: true,
  })

  const employees  = data?.data?.data || []
  const pagination = data?.data?.pagination || {}

  const deleteMut = useMutation({
    mutationFn: (id) => employeeAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries(['employees'])
      toast.success('Employee deleted')
      setDelete(null)
    },
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pagination.total || 0} total employees</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('create')}>
          <PlusIcon className="w-4 h-4" /> Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search name, email, position…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select className="input w-40" value={statusFilter}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All statuses</option>
          {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Employee', 'Position', 'Department', 'Teams', 'Status', 'Hired', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading…</td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No employees found</td></tr>
              ) : employees.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-xs flex-shrink-0">
                        {emp.first_name[0]}{emp.last_name[0]}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{emp.first_name} {emp.last_name}</div>
                        <div className="text-xs text-gray-500">{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{emp.position || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{emp.department || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {emp.teams?.slice(0, 2).map(t => (
                        <span key={t.id} className="badge-blue">{t.name}</span>
                      ))}
                      {emp.teams?.length > 2 && <span className="badge-gray">+{emp.teams.length - 2}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusColor[emp.status] || 'badge-gray'}>
                      {statusLabels[emp.status] || emp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{emp.hire_date || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link to={`/employees/${emp.id}`} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-primary-600">
                        <EyeIcon className="w-4 h-4" />
                      </Link>
                      <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-primary-600"
                        onClick={() => setModal(emp)}>
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600"
                        onClick={() => setDelete(emp)}>
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <button className="btn-secondary py-1 px-3 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
              <button className="btn-secondary py-1 px-3 text-xs" disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal && (
        <EmployeeModal
          employee={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Employee"
          message={`Are you sure you want to delete ${deleteTarget.first_name} ${deleteTarget.last_name}? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => deleteMut.mutate(deleteTarget.id)}
          onCancel={() => setDelete(null)}
          loading={deleteMut.isPending}
        />
      )}
    </div>
  )
}