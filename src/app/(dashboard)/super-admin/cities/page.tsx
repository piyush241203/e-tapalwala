'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, ToggleLeft, ToggleRight, Trash2, Search, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { ActiveBadge } from '@/components/ui/StatusBadge';
import { PageLoader, EmptyState } from '@/components/ui/Spinner';
import { formatDateShort, getErrorMessage } from '@/lib/utils';

interface City {
  id: string; name: string; code: string; state: string;
  district?: string; isActive: boolean; createdAt: string;
  _count?: { users: number; messageLogs: number };
  createdBy?: { fullName: string };
}

function CityForm({
  initial, onSubmit, isLoading,
}: {
  initial?: Partial<City>;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    code: initial?.code || '',
    state: initial?.state || '',
    district: initial?.district || '',
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="form-group">
        <label className="label">City Name *</label>
        <input className="input" placeholder="e.g. Nanded" value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="form-group">
          <label className="label">City Code *</label>
          <input className="input uppercase" placeholder="NND" maxLength={10} value={form.code}
            onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required />
        </div>
        <div className="form-group">
          <label className="label">State *</label>
          <input className="input" placeholder="Maharashtra" value={form.state}
            onChange={e => setForm(f => ({ ...f, state: e.target.value }))} required />
        </div>
      </div>
      <div className="form-group">
        <label className="label">District (optional)</label>
        <input className="input" placeholder="Nanded" value={form.district}
          onChange={e => setForm(f => ({ ...f, district: e.target.value }))} />
      </div>
      <button type="submit" className="btn-primary w-full" disabled={isLoading}>
        {isLoading ? 'Saving...' : (initial?.id ? 'Update City' : 'Create City')}
      </button>
    </form>
  );
}

export default function CitiesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<City | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['cities', page, search],
    queryFn: () => api.get('/super-admin/cities', { params: { page, search } }).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/super-admin/cities', body),
    onSuccess: () => { toast.success('City created'); qc.invalidateQueries({ queryKey: ['cities'] }); setModal(null); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: (body: any) => api.put(`/super-admin/cities/${selected?.id}`, body),
    onSuccess: () => { toast.success('City updated'); qc.invalidateQueries({ queryKey: ['cities'] }); setModal(null); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/super-admin/cities/${id}/toggle`),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['cities'] }); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/super-admin/cities/${id}`),
    onSuccess: () => { toast.success('City removed'); qc.invalidateQueries({ queryKey: ['cities'] }); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const cities: City[] = data?.data || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Cities</h1>
          <p className="page-subtitle">Manage all registered cities on the platform</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('create')}>
          <Plus size={16} /> Add City
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9 max-w-xs" placeholder="Search cities..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {/* Table */}
      {isLoading ? <PageLoader /> : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>City</th><th>Code</th><th>State</th><th>Users</th>
                <th>Messages</th><th>Status</th><th>Created</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cities.length === 0 ? (
                <tr><td colSpan={8} className="py-0">
                  <EmptyState icon={<Building2 size={24} />} title="No cities yet" description="Add your first city to get started" />
                </td></tr>
              ) : cities.map(city => (
                <tr key={city.id}>
                  <td><span className="font-medium text-gray-900">{city.name}</span></td>
                  <td><code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{city.code}</code></td>
                  <td>{city.state}</td>
                  <td>{city._count?.users ?? 0}</td>
                  <td>{city._count?.messageLogs ?? 0}</td>
                  <td><ActiveBadge isActive={city.isActive} /></td>
                  <td>{formatDateShort(city.createdAt)}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setSelected(city); setModal('edit'); }}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => toggleMutation.mutate(city.id)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded">
                        {city.isActive ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} />}
                      </button>
                      <button onClick={() => {
                        if (confirm('Delete this city? If it has history, it will be deactivated.'))
                          deleteMutation.mutate(city.id);
                      }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                        <Trash2 size={14} />
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

      {/* Create Modal */}
      <Modal isOpen={modal === 'create'} onClose={() => setModal(null)} title="Add New City">
        <CityForm onSubmit={createMutation.mutate} isLoading={createMutation.isPending} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={modal === 'edit'} onClose={() => setModal(null)} title={`Edit — ${selected?.name}`}>
        {selected && (
          <CityForm initial={selected} onSubmit={updateMutation.mutate} isLoading={updateMutation.isPending} />
        )}
      </Modal>
    </div>
  );
}
