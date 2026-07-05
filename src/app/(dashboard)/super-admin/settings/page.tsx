'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Save, Shield, Database, ToggleLeft, ToggleRight, FileDown, Settings2, BarChart3, Edit3, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { PageLoader } from '@/components/ui/Spinner';
import { getErrorMessage } from '@/lib/utils';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import CityLimitsCard from './CityLimitsCard';

function SecretInput({ label, name, value, onChange, placeholder }: {
  label: string; name: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="form-group">
      <label className="label">{label}</label>
      <div className="relative">
        <input
          className="input pr-9"
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || '••••••••'}
        />
        <button type="button" onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'credentials' | 'limits'>('credentials');
  const [selectedCityForTrend, setSelectedCityForTrend] = useState<string | null>(null);
  const [editingCity, setEditingCity] = useState<any>(null);
  const [editForm, setEditForm] = useState({ 
    monthlyLimit: 0, 
    isMonthlyUnlimited: false 
  });

  // 1. Messaging Settings Query
  const { data: credentialsData, isLoading: credentialsLoading } = useQuery({
    queryKey: ['messaging-settings'],
    queryFn: () => api.get('/super-admin/settings/messaging').then(r => r.data),
  });

  // 2. WhatsApp Cities Query
  const { data: citiesData, isLoading: citiesLoading } = useQuery({
    queryKey: ['whatsapp-cities'],
    queryFn: () => api.get('/super-admin/settings/whatsapp/cities').then(r => r.data),
    enabled: activeTab === 'limits',
  });

  // 3. WhatsApp Offices Query
  const { data: officesData, isLoading: officesLoading } = useQuery({
    queryKey: ['whatsapp-offices'],
    queryFn: () => api.get('/super-admin/settings/whatsapp/offices').then(r => r.data),
    enabled: activeTab === 'limits',
  });

  const [form, setForm] = useState<Record<string, any>>({});
  const [initialized, setInitialized] = useState(false);

  if (credentialsData && !initialized) {
    setForm({
      metaAccessToken: '',
      metaPhoneNumberId: credentialsData?.metaPhoneNumberId || '',
      metaApiVersion: credentialsData?.metaApiVersion || 'v19.0',
      preferredProvider: credentialsData?.preferredProvider || 'META',
    });
    setInitialized(true);
  }

  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  // Mutation for Credentials
  const credentialsMutation = useMutation({
    mutationFn: () => {
      const payload = { ...form };
      if (!payload.metaAccessToken) delete payload.metaAccessToken;
      return api.put('/super-admin/settings/messaging', payload);
    },
    onSuccess: () => toast.success('Credentials updated successfully'),
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  // Mutation for City Limits
  const cityMutation = useMutation({
    mutationFn: ({ cityId, data }: { cityId: string; data: any }) =>
      api.put(`/super-admin/settings/whatsapp/cities/${cityId}`, data),
    onSuccess: () => {
      toast.success('City quotas updated');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-cities'] });
      setEditingCity(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  // Mutation for Office Toggle
  const officeToggleMutation = useMutation({
    mutationFn: (officeId: string) =>
      api.patch(`/super-admin/settings/whatsapp/offices/${officeId}/toggle`),
    onSuccess: () => {
      toast.success('Office status updated');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-offices'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  // PDF Download Helper
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  const downloadPdf = async (officeId: string, officeCode: string) => {
    setDownloadingPdf(officeId);
    try {
      const response = await api.get(`/super-admin/settings/whatsapp/offices/${officeId}/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `WhatsApp_Report_${officeCode}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report downloaded');
    } catch (err) {
      toast.error('Failed to download PDF report');
    } finally {
      setDownloadingPdf(null);
    }
  };

  const handleEditCityClick = (city: any) => {
    setEditingCity(city);
    setEditForm({
      monthlyLimit: city.whatsappMonthlyLimit,
      isMonthlyUnlimited: city.whatsappMonthlyLimit === 0,
    });
  };

  if (credentialsLoading) return <PageLoader />;

  // Find active city trend data
  const activeCityTrend = citiesData?.find((c: any) => c.id === selectedCityForTrend) || citiesData?.[0];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="page-header">
        <h1 className="page-title">WhatsApp API settings</h1>
        <p className="page-subtitle">Configure credentials, quotas, per-city limits, and per-office toggles</p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('credentials')}
          className={`flex items-center gap-2 py-3 px-6 font-medium text-sm border-b-2 transition-colors -mb-[2px] ${
            activeTab === 'credentials'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Settings2 size={16} />
          API Credentials
        </button>
        <button
          onClick={() => setActiveTab('limits')}
          className={`flex items-center gap-2 py-3 px-6 font-medium text-sm border-b-2 transition-colors -mb-[2px] ${
            activeTab === 'limits'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <BarChart3 size={16} />
          City & Office Limits
        </button>
      </div>

      {/* API Credentials Tab */}
      {activeTab === 'credentials' && (
        <div className="space-y-6 max-w-2xl">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <span className="text-green-700 font-bold text-xs">WA</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-800">Meta WhatsApp Cloud API Configuration</h3>
            </div>
            <div className="space-y-3">
              <SecretInput label="Access Token" name="metaAccessToken" value={form.metaAccessToken || ''}
                onChange={v => f('metaAccessToken', v)} placeholder="Leave blank to keep existing" />
              <div className="form-group">
                <label className="label">Phone Number ID</label>
                <input className="input" value={form.metaPhoneNumberId || ''}
                  onChange={e => f('metaPhoneNumberId', e.target.value)} placeholder="1234567890" />
              </div>
              <div className="form-group">
                <label className="label">API Version</label>
                <input className="input" value={form.metaApiVersion || 'v19.0'}
                  onChange={e => f('metaApiVersion', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Preferences</h3>
            <div className="form-group">
              <label className="label">Preferred Provider</label>
              <select className="select w-48" value={form.preferredProvider || 'META'}
                onChange={e => f('preferredProvider', e.target.value)}>
                <option value="META">Meta WhatsApp</option>
              </select>
            </div>
          </div>

          <button className="btn-primary" onClick={() => credentialsMutation.mutate()} disabled={credentialsMutation.isPending}>
            <Save size={16} />
            {credentialsMutation.isPending ? 'Saving...' : 'Save Credentials'}
          </button>
        </div>
      )}

      {/* City & Office Limits Tab */}
      {activeTab === 'limits' && (
        <div className="space-y-6">
          {citiesLoading || officesLoading ? (
            <PageLoader />
          ) : (
            <>
              {/* Trend Graph */}
              {activeCityTrend && (
                <div className="card">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">Message Volume Trend</h3>
                      <p className="text-xs text-gray-500">Monthly message volume for {activeCityTrend.name}</p>
                    </div>
                    <select
                      className="select select-sm w-48"
                      value={selectedCityForTrend || activeCityTrend.id}
                      onChange={e => setSelectedCityForTrend(e.target.value)}
                    >
                      {citiesData?.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="h-64">
                    {activeCityTrend.trends && activeCityTrend.trends.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={activeCityTrend.trends}>
                          <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCount)" name="Messages Sent" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                        <Database size={24} className="mb-2" />
                        No message logs found for this city.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* City Limits Cards */}
              <div className="space-y-6 mt-8">
                {citiesData?.map((city: any) => {
                  const cityOffices = officesData?.filter((o: any) => o.cityId === city.id) || [];
                  return (
                    <CityLimitsCard
                      key={city.id}
                      city={city}
                      offices={cityOffices}
                      onEditCity={handleEditCityClick}
                      officeToggleMutation={officeToggleMutation}
                      downloadPdf={downloadPdf}
                      downloadingPdf={downloadingPdf}
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Edit Quotas Modal */}
      {editingCity && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-semibold text-gray-800">Edit Limits — {editingCity.name}</h3>
              <button onClick={() => setEditingCity(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="form-group">
                <div className="flex justify-between items-center mb-1">
                  <label className="label mb-0">Monthly WhatsApp Message Limit</label>
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300"
                      checked={editForm.isMonthlyUnlimited}
                      onChange={e => setEditForm(p => ({ ...p, isMonthlyUnlimited: e.target.checked, monthlyLimit: e.target.checked ? 0 : p.monthlyLimit }))}
                    />
                    Unlimited
                  </label>
                </div>
                <input
                  type="number"
                  className="input disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  value={editForm.monthlyLimit}
                  onChange={e => setEditForm(p => ({ ...p, monthlyLimit: parseInt(e.target.value) || 0 }))}
                  min={0}
                  disabled={editForm.isMonthlyUnlimited}
                />
                <p className="text-[11px] text-gray-400 mt-1">Maximum allowed messages per calendar month.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <button onClick={() => setEditingCity(null)} className="btn-secondary text-sm">Cancel</button>
              <button
                onClick={() => cityMutation.mutate({
                  cityId: editingCity.id,
                  data: {
                    whatsappMonthlyLimit: editForm.isMonthlyUnlimited ? 0 : editForm.monthlyLimit,
                  }
                })}
                className="btn-primary text-sm"
                disabled={cityMutation.isPending}
              >
                Save Limits
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
