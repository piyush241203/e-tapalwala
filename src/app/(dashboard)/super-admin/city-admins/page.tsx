'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, KeyRound, Search, UserCog } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { ActiveBadge } from '@/components/ui/StatusBadge';
import { PageLoader, EmptyState } from '@/components/ui/Spinner';
import { formatDateShort, getErrorMessage } from '@/lib/utils';

interface CityAdmin {
  id: string;
  email: string;
  username: string;
  fullName: string;
  phone?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  city?: { id: string; name: string; code: string };
  office?: { id: string; name: string; code: string };
}

function CityAdminForm({ initial, onSubmit, isLoading, cities }: {
  initial?: Partial<CityAdmin>; onSubmit: (d: any) => void;
  isLoading: boolean; cities: any[];
}) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    email: initial?.email || '',
    username: initial?.username || '',
    password: '',
    fullName: initial?.fullName || '',
    phone: initial?.phone || '',
    cityId: initial?.city?.id || '',
    officeId: initial?.office?.id || '',
    isActive: initial?.isActive ?? true,
  });
  const s = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  // Query offices dynamically when cityId changes
  const { data: officesData, isLoading: isLoadingOffices } = useQuery({
    queryKey: ['offices-dropdown-list', form.cityId],
    queryFn: () => api.get('/super-admin/offices', { params: { cityId: form.cityId, limit: 100 } }).then(r => r.data),
    enabled: !!form.cityId,
  });
  const offices = officesData?.data || [];

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="form-group">
          <label className="label">Full Name *</label>
          <input className="input" value={form.fullName} onChange={e => s('fullName', e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="label">Username *</label>
          <input className="input" value={form.username} onChange={e => s('username', e.target.value)} required disabled={isEdit} />
        </div>
      </div>
      <div className="form-group">
        <label className="label">Email *</label>
        <input className="input" type="email" value={form.email} onChange={e => s('email', e.target.value)} required disabled={isEdit} />
      </div>
      {!isEdit && (
        <div className="form-group">
          <label className="label">Password *</label>
          <input className="input" type="password" placeholder="Min 8 characters" value={form.password}
            onChange={e => s('password', e.target.value)} required minLength={8} />
        </div>
      )}
      <div className="form-group">
        <label className="label">Phone</label>
        <input className="input" placeholder="+91..." value={form.phone} onChange={e => s('phone', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="form-group">
          <label className="label">Assign City *</label>
          <select className="select input w-full" value={form.cityId} onChange={e => { s('cityId', e.target.value); s('officeId', ''); }} required>
            <option value="">Select city...</option>
            {cities.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="label">Assign Office *</label>
          <select className="select input w-full" value={form.officeId} onChange={e => s('officeId', e.target.value)} required disabled={!form.cityId || isLoadingOffices}>
            <option value="">{isLoadingOffices ? 'Loading offices...' : 'Select office...'}</option>
            {offices.map((o: any) => <option key={o.id} value={o.id}>{o.name} ({o.code})</option>)}
          </select>
        </div>
      </div>
      {isEdit && (
        <div className="flex items-center gap-2">
          <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => s('isActive', e.target.checked)} />
          <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
        </div>
      )}
      <button type="submit" className="btn-primary w-full" disabled={isLoading}>
        {isLoading ? 'Saving...' : (isEdit ? 'Update Office Admin' : 'Create Office Admin')}
      </button>
    </form>
  );
}

export default function CityAdminsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | 'reset' | null>(null);
  const [selected, setSelected] = useState<CityAdmin | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['city-admins', page],
    queryFn: () => api.get('/super-admin/city-admins', { params: { page } }).then(r => r.data),
  });

  const { data: citiesData } = useQuery({
    queryKey: ['all-cities'],
    queryFn: () => api.get('/super-admin/cities', { params: { limit: 100 } }).then(r => r.data),
  });

  const cities = citiesData?.data || [];

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/super-admin/city-admins', body),
    onSuccess: () => { toast.success('Office Admin created'); qc.invalidateQueries({ queryKey: ['city-admins'] }); setModal(null); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: (body: any) => api.put(`/super-admin/city-admins/${selected?.id}`, body),
    onSuccess: () => { toast.success('Office Admin updated'); qc.invalidateQueries({ queryKey: ['city-admins'] }); setModal(null); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const resetPwMutation = useMutation({
    mutationFn: () => api.patch(`/super-admin/city-admins/${selected?.id}/reset-password`, { newPassword }),
    onSuccess: () => { toast.success('Password reset successfully'); setModal(null); setNewPassword(''); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const admins: CityAdmin[] = data?.data || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Office Admins</h1>
          <p className="page-subtitle">Manage localized administrators for each office branch</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('create')}>
          <Plus size={16} /> Add Office Admin
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9 max-w-xs" placeholder="Search admins..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? <PageLoader /> : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>City / Office</th><th>Last Login</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {admins.length === 0 ? (
                <tr><td colSpan={6} className="py-0">
                  <EmptyState icon={<UserCog size={24} />} title="No office admins yet" description="Create an office admin to get started" />
                </td></tr>
              ) : admins.map(admin => (
                <tr key={admin.id}>
                  <td>
                    <div>
                      <p className="font-medium text-gray-900">{admin.fullName}</p>
                      <p className="text-xs text-gray-400">@{admin.username}</p>
                    </div>
                  </td>
                  <td className="text-gray-600">{admin.email}</td>
                  <td>
                    {admin.office ? (
                      <div>
                        <p className="text-sm font-semibold text-primary-700">{admin.office.name}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">{admin.city?.name}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="text-sm text-gray-500">{admin.lastLoginAt ? formatDateShort(admin.lastLoginAt) : 'Never'}</td>
                  <td><ActiveBadge isActive={admin.isActive} /></td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setSelected(admin); setModal('edit'); }}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => { setSelected(admin); setModal('reset'); }}
                        className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded" title="Reset Password">
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

      <Modal isOpen={modal === 'create'} onClose={() => setModal(null)} title="Add Office Admin">
        <CityAdminForm cities={cities} onSubmit={createMutation.mutate} isLoading={createMutation.isPending} />
      </Modal>

      <Modal isOpen={modal === 'edit'} onClose={() => setModal(null)} title={`Edit — ${selected?.fullName}`}>
        {selected && <CityAdminForm initial={selected} cities={cities} onSubmit={updateMutation.mutate} isLoading={updateMutation.isPending} />}
      </Modal>

      <Modal isOpen={modal === 'reset'} onClose={() => setModal(null)} title={`Reset Password — ${selected?.fullName}`}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Enter a new password for <strong>{selected?.fullName}</strong>.</p>
          <div className="form-group">
            <label className="label">New Password</label>
            <input className="input" type="password" placeholder="Min 8 characters"
              value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={8} />
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={() => resetPwMutation.mutate()} disabled={newPassword.length < 8 || resetPwMutation.isPending}>
              {resetPwMutation.isPending ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
