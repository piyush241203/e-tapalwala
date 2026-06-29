'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Search, Building2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/Spinner';
import { getErrorMessage } from '@/lib/utils';

function DepartmentForm({ initial, onSubmit, isLoading }: {
  initial?: any; onSubmit: (d: any) => void; isLoading: boolean;
}) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    name: initial?.name || '',
    code: initial?.code || '',
    headOfDepartmentId: initial?.headOfDepartmentId || '',
  });

  const { data: operatorsData } = useQuery({
    queryKey: ['operators-list-for-dept'],
    queryFn: () => api.get('/city-admin/operators', { params: { limit: 100 } }).then(r => r.data),
  });

  const operators = operatorsData?.data || [];
  const s = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="form-group">
        <label className="label">Department Name *</label>
        <input className="input" value={form.name} onChange={e => s('name', e.target.value)} placeholder="e.g. Revenue Department" required />
      </div>
      <div className="form-group">
        <label className="label">Department Code (Short Code) *</label>
        <input className="input" value={form.code} onChange={e => s('code', e.target.value)} placeholder="e.g. REVENUE" required disabled={isEdit} />
      </div>
      {isEdit && (
        <div className="form-group">
          <label className="label">Head of Department</label>
          <select className="select input w-full" value={form.headOfDepartmentId || ''} onChange={e => s('headOfDepartmentId', e.target.value || null)}>
            <option value="">No Head Assigned</option>
            {operators.map((op: any) => (
              <option key={op.id} value={op.id}>{op.fullName} (@{op.username})</option>
            ))}
          </select>
        </div>
      )}
      <button type="submit" className="btn-primary w-full mt-2" disabled={isLoading}>
        {isLoading ? 'Saving…' : (isEdit ? 'Update Department' : 'Create Department')}
      </button>
    </form>
  );
}

export default function DepartmentsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<any>(null);

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/departments').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/departments', body),
    onSuccess: () => { toast.success('Department created'); qc.invalidateQueries({ queryKey: ['departments'] }); setModal(null); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: (body: any) => api.put(`/departments/${selected?.id}`, body),
    onSuccess: () => { toast.success('Updated successfully'); qc.invalidateQueries({ queryKey: ['departments'] }); setModal(null); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/departments/${selected?.id}`),
    onSuccess: () => { toast.success('Department deleted'); qc.invalidateQueries({ queryKey: ['departments'] }); setModal(null); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Departments</h1>
          <p className="page-subtitle">Manage internal office departments and head assignments</p>
        </div>
        <button className="btn-primary self-start sm:self-auto" onClick={() => setModal('create')}>
          <Plus size={16} /> Add Department
        </button>
      </div>

      {/* Table / Skeleton */}
      {isLoading ? (
        <TableSkeleton rows={4} cols={5} />
      ) : departments.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Building2 size={28} />} title="No departments found" description="Create your first internal department" />
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Short Code</th>
                <th>Head of Department</th>
                <th>Active Staff Count</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept: any) => (
                <tr key={dept.id} className="group">
                  <td className="font-semibold text-gray-900">{dept.name}</td>
                  <td><span className="badge badge-gray font-mono">{dept.code}</span></td>
                  <td>
                    {dept.headOfDepartment ? (
                      <div>
                        <p className="text-sm text-gray-800 font-medium">{dept.headOfDepartment.fullName}</p>
                        <p className="text-xs text-gray-400">{dept.headOfDepartment.email}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Unassigned</span>
                    )}
                  </td>
                  <td><span className="badge badge-info">{dept._count?.users ?? 0}</span></td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => { setSelected(dept); setModal('edit'); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => { setSelected(dept); setModal('delete'); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={modal === 'create'} onClose={() => setModal(null)} title="Add Department">
        <DepartmentForm onSubmit={createMutation.mutate} isLoading={createMutation.isPending} />
      </Modal>
      <Modal isOpen={modal === 'edit'} onClose={() => setModal(null)} title={`Edit Department — ${selected?.name}`}>
        {selected && <DepartmentForm initial={selected} onSubmit={updateMutation.mutate} isLoading={updateMutation.isPending} />}
      </Modal>
      <Modal isOpen={modal === 'delete'} onClose={() => setModal(null)} title="Delete Department">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-red-600">
            <ShieldAlert size={28} />
            <h3 className="font-bold text-gray-900 text-lg">Are you sure?</h3>
          </div>
          <p className="text-sm text-gray-600">This will permanently delete the department <strong>{selected?.name}</strong>. This action cannot be undone.</p>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary !bg-red-600 hover:!bg-red-700 text-white flex-1" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting…' : 'Delete Department'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
