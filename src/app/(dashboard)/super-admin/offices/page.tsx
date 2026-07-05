'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Search, Building2, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { PageLoader, EmptyState } from '@/components/ui/Spinner';
import { getErrorMessage } from '@/lib/utils';

interface Office {
  id: string;
  name: string;
  code: string;
  cityId: string;
  city: { name: string; code: string };
  _count: { users: number; departments: number; tapals: number };
}

function OfficeForm({
  initial,
  onSubmit,
  isLoading,
  cities = [],
}: {
  initial?: Partial<Office>;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  cities: any[];
}) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    code: initial?.code || '',
    cityId: initial?.cityId || '',
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="form-group">
        <label className="label">Office Name *</label>
        <input className="input" placeholder="e.g. Zilla Parishad Office" value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="form-group">
          <label className="label">Office Code *</label>
          <input className="input uppercase" placeholder="ZP_NGP" value={form.code}
            onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required disabled={!!initial?.id} />
        </div>
        <div className="form-group">
          <label className="label">Belongs to City *</label>
          <select className="select input w-full" value={form.cityId}
            onChange={e => setForm(f => ({ ...f, cityId: e.target.value }))} required>
            <option value="">Select City</option>
            {cities.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
            ))}
          </select>
        </div>
      </div>
      <button type="submit" className="btn-primary w-full" disabled={isLoading}>
        {isLoading ? 'Saving...' : (initial?.id ? 'Update Office' : 'Create Office')}
      </button>
    </form>
  );
}

export default function OfficesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Office | null>(null);

  // Fetch Cities for dropdown
  const { data: citiesData } = useQuery({
    queryKey: ['cities-list-for-offices'],
    queryFn: () => api.get('/super-admin/cities', { params: { limit: 100 } }).then(r => r.data),
  });
  const cities = citiesData?.data || [];

  // Fetch Offices
  const { data, isLoading } = useQuery({
    queryKey: ['offices', page, search, cityFilter],
    queryFn: () => api.get('/super-admin/offices', { params: { page, search, cityId: cityFilter || undefined } }).then(r => r.data),
  });
  const offices = data?.data || [];

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/super-admin/offices', body),
    onSuccess: () => { toast.success('Office created'); qc.invalidateQueries({ queryKey: ['offices'] }); setModal(null); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: (body: any) => api.put(`/super-admin/offices/${selected?.id}`, body),
    onSuccess: () => { toast.success('Office updated'); qc.invalidateQueries({ queryKey: ['offices'] }); setModal(null); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/super-admin/offices/${id}`),
    onSuccess: () => { toast.success('Office deleted'); qc.invalidateQueries({ queryKey: ['offices'] }); setModal(null); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Offices</h1>
          <p className="page-subtitle">Manage government branch offices in different cities</p>
        </div>
        <button className="btn-primary self-start sm:self-auto" onClick={() => setModal('create')}>
          <Plus size={16} /> Add Office
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search offices..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select input max-w-xs" value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
          <option value="">All Cities Filter</option>
          {cities.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {offices.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Building2 size={28} />} title="No offices found" description="Register a new office branch in Nagpur or other cities" />
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Office Name</th>
                <th>Code</th>
                <th>City</th>
                <th>Staff Count</th>
                <th>Departments</th>
                <th>Tapals</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {offices.map((o: Office) => (
                <tr key={o.id} className="group">
                  <td className="font-semibold text-gray-900">{o.name}</td>
                  <td><span className="badge badge-gray font-mono">{o.code}</span></td>
                  <td>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                      <Globe size={13} className="text-gray-400" />
                      {o.city?.name}
                    </span>
                  </td>
                  <td><span className="badge badge-info">{o._count.users}</span></td>
                  <td><span className="badge badge-gray">{o._count.departments}</span></td>
                  <td><span className="badge badge-gray">{o._count.tapals}</span></td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => { setSelected(o); setModal('edit'); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => { setSelected(o); setModal('delete'); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
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

      {/* Modals */}
      <Modal isOpen={modal === 'create'} onClose={() => setModal(null)} title="Create New Office">
        <OfficeForm cities={cities} onSubmit={createMutation.mutate} isLoading={createMutation.isPending} />
      </Modal>

      <Modal isOpen={modal === 'edit'} onClose={() => setModal(null)} title={`Edit — ${selected?.name}`}>
        {selected && (
          <OfficeForm initial={selected} cities={cities} onSubmit={updateMutation.mutate} isLoading={updateMutation.isPending} />
        )}
      </Modal>

      <Modal isOpen={modal === 'delete'} onClose={() => setModal(null)} title="Delete Office">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to permanently delete the office <strong>{selected?.name}</strong>?
          </p>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary !bg-red-600 hover:!bg-red-700 text-white flex-1"
              onClick={() => deleteMutation.mutate(selected!.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Office'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
