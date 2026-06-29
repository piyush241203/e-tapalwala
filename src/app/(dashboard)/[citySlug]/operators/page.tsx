'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Plus, Edit2, KeyRound, Search, User, UserCheck, UserX, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { ActiveBadge } from '@/components/ui/StatusBadge';
import { TableSkeleton } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/Spinner';
import { formatDateShort, getErrorMessage } from '@/lib/utils';

// ─── Operator Create/Edit form ────────────────────────────────────────────────
function OperatorForm({ initial, onSubmit, isLoading }: {
  initial?: any; onSubmit: (d: any) => void; isLoading: boolean;
}) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    email: initial?.email || '', username: initial?.username || '',
    password: '', fullName: initial?.fullName || '',
    phone: initial?.phone || '', isActive: initial?.isActive ?? true,
    role: initial?.role || 'Clerk',
    departmentId: initial?.departmentId || '',
    deskName: initial?.deskName || '',
  });
  const s = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/departments').then(r => r.data),
  });

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="form-group mb-0">
          <label className="label">Full Name *</label>
          <input className="input" value={form.fullName} onChange={e => s('fullName', e.target.value)} placeholder="John Doe" required />
        </div>
        <div className="form-group mb-0">
          <label className="label">Username *</label>
          <input className="input" value={form.username} onChange={e => s('username', e.target.value)} placeholder="johndoe" required disabled={isEdit} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="form-group mb-0">
          <label className="label">Email *</label>
          <input className="input" type="email" value={form.email} onChange={e => s('email', e.target.value)} placeholder="john@example.com" required disabled={isEdit} />
        </div>
        <div className="form-group mb-0">
          <label className="label">Phone</label>
          <input className="input" placeholder="+91 98765 43210" value={form.phone} onChange={e => s('phone', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="form-group mb-0">
          <label className="label">Role *</label>
          <select className="select input w-full" value={form.role} onChange={e => s('role', e.target.value)} required>
            <option value="Clerk">Clerk</option>
            <option value="Superintendent">Superintendent</option>
            <option value="Officer">Officer</option>
            <option value="Admin">Admin</option>
            <option value="OPERATOR">Operator (Legacy)</option>
          </select>
        </div>
        <div className="form-group mb-0">
          <label className="label">Department *</label>
          <select className="select input w-full" value={form.departmentId} onChange={e => s('departmentId', e.target.value)} required>
            <option value="">Select Department</option>
            {departments.map((d: any) => (
              <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-group mb-0">
        <label className="label">Desk Name *</label>
        <input className="input" placeholder="e.g. Desk-2 (Revenue Inward)" value={form.deskName} onChange={e => s('deskName', e.target.value)} required />
      </div>
      {!isEdit && (
        <div className="form-group mb-0">
          <label className="label">Password *</label>
          <input className="input" type="password" placeholder="Min 8 characters"
            value={form.password} onChange={e => s('password', e.target.value)} required minLength={8} />
        </div>
      )}
      {isEdit && (
        <label className="flex items-center gap-3 cursor-pointer">
          <div className={`w-11 h-6 rounded-full transition-colors relative ${form.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}
               onClick={() => s('isActive', !form.isActive)}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-sm font-medium text-gray-700">{form.isActive ? 'Active' : 'Inactive'}</span>
        </label>
      )}
      <button type="submit" className="btn-primary w-full mt-2" disabled={isLoading}>
        {isLoading ? 'Saving…' : (isEdit ? 'Update Operator' : 'Create Operator')}
      </button>
    </form>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function OperatorsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | 'reset' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search — 350ms delay to avoid firing on every keystroke
  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(v);
      setPage(1);
    }, 350);
  }, []);

  useEffect(() => () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); }, []);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['operators', page, debouncedSearch],
    queryFn: () => api.get('/city-admin/operators', { params: { page, search: debouncedSearch } }).then(r => r.data),
    placeholderData: keepPreviousData, // smooth pagination — no blank flash
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/city-admin/operators', body),
    onSuccess: () => { toast.success('Operator created'); qc.invalidateQueries({ queryKey: ['operators'] }); setModal(null); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: (body: any) => api.put(`/city-admin/operators/${selected?.id}`, body),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['operators'] }); setModal(null); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const resetPwMutation = useMutation({
    mutationFn: () => api.patch(`/city-admin/operators/${selected?.id}/reset-password`, { newPassword }),
    onSuccess: () => { toast.success('Password reset'); setModal(null); setNewPassword(''); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const operators = data?.data || [];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Operators</h1>
          <p className="page-subtitle">
            Manage operators in your city
            {data?.total != null && (
              <span className="ml-2 badge badge-gray">{data.total} total</span>
            )}
          </p>
        </div>
        <button className="btn-primary self-start sm:self-auto" onClick={() => setModal('create')}>
          <Plus size={16} /> Add Operator
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9 pr-9"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
          />
          {isFetching && !isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>

      {/* Table / Skeleton */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : operators.length === 0 ? (
        <div className="card">
          <EmptyState icon={<User size={28} />} title="No operators found" description={debouncedSearch ? `No results for "${debouncedSearch}"` : 'Create your first operator'} />
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Operator</th>
                <th className="hidden md:table-cell">Email</th>
                <th className="hidden sm:table-cell">Phone</th>
                <th className="hidden sm:table-cell">Messages</th>
                <th className="hidden lg:table-cell">Last Login</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {operators.map((op: any) => (
                <tr key={op.id} className="group">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm">
                        {op.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{op.fullName}</p>
                        <p className="text-xs text-gray-400">@{op.username} • {op.role}</p>
                        {op.department && (
                          <p className="text-[11px] text-gray-500 font-medium mt-0.5">{op.department.name} ({op.deskName || 'No Desk'})</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell">
                    <span className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Mail size={12} className="text-gray-400 flex-shrink-0" />{op.email}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell">
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                      {op.phone ? <><Phone size={12} className="text-gray-400 flex-shrink-0" />{op.phone}</> : '—'}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell">
                    <span className="badge badge-info font-semibold">{op._count?.messageLogs ?? 0}</span>
                  </td>
                  <td className="hidden lg:table-cell text-xs text-gray-500">
                    {op.lastLoginAt ? formatDateShort(op.lastLoginAt) : <span className="text-gray-300">Never</span>}
                  </td>
                  <td><ActiveBadge isActive={op.isActive} /></td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => { setSelected(op); setModal('edit'); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => { setSelected(op); setModal('reset'); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                        title="Reset password"
                      >
                        <KeyRound size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} pages={data?.pages || 1} total={data?.total || 0} limit={20} onPageChange={setPage} />
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={modal === 'create'} onClose={() => setModal(null)} title="Add Operator">
        <OperatorForm onSubmit={createMutation.mutate} isLoading={createMutation.isPending} />
      </Modal>
      <Modal isOpen={modal === 'edit'} onClose={() => setModal(null)} title={`Edit — ${selected?.fullName}`}>
        {selected && <OperatorForm initial={selected} onSubmit={updateMutation.mutate} isLoading={updateMutation.isPending} />}
      </Modal>
      <Modal isOpen={modal === 'reset'} onClose={() => setModal(null)} title="Reset Password">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Set a new password for <strong>{selected?.fullName}</strong></p>
          <div className="form-group mb-0">
            <label className="label">New Password</label>
            <input className="input" type="password" placeholder="Min 8 characters"
              value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={8} />
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={() => resetPwMutation.mutate()}
              disabled={newPassword.length < 8 || resetPwMutation.isPending}>
              {resetPwMutation.isPending ? 'Resetting…' : 'Reset Password'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
