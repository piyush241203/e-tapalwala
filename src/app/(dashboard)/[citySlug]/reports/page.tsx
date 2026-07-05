'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';
import {
  Download, MessageSquare, Users, Send, AlertTriangle,
  TrendingUp, FileText, Layers, ChevronDown,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

// ─── Colour palette ───────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  SENT: '#22c55e', DELIVERED: '#3b82f6', READ: '#8b5cf6',
  QUEUED: '#f59e0b', PROCESSING: '#06b6d4', FAILED: '#ef4444',
  CANCELLED: '#94a3b8', DRAFT: '#cbd5e1', COMPLETED: '#16a34a',
};
const CHANNEL_COLORS = ['#16a34a', '#2563eb', '#9333ea', '#ea580c'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('en-IN');

function StatCard({
  icon, label, value, sub, color = 'emerald',
}: {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; color?: 'emerald' | 'blue' | 'red' | 'amber' | 'violet';
}) {
  const palettes: Record<string, string> = {
    emerald: 'from-emerald-500 to-green-600 shadow-emerald-200',
    blue: 'from-blue-500 to-blue-600 shadow-blue-200',
    red: 'from-red-500 to-rose-600 shadow-red-200',
    amber: 'from-amber-500 to-orange-500 shadow-amber-200',
    violet: 'from-violet-500 to-purple-600 shadow-violet-200',
  };
  return (
    <div className="card flex items-center gap-4 py-4 px-5">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${palettes[color]} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 leading-tight">{typeof value === 'number' ? fmt(value) : value}</p>
        <p className="text-sm font-medium text-gray-600 truncate">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-xl shadow-xl border border-gray-700">
      {label && <p className="font-semibold mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || p.fill }}>{p.name}: <strong>{fmt(p.value)}</strong></p>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CityAdminReportsPage() {
  const { accessToken } = useAuthStore();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportType, setExportType] = useState<'all' | 'single' | 'bulk'>('all');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['city-reports', startDate, endDate],
    queryFn: () =>
      api.get('/city-admin/reports', { params: { startDate, endDate } }).then(r => r.data),
  });

  // ── Chart data ──────────────────────────────────────────────────────────────
  const singleByStatus = (data?.single?.byStatus || []).map((i: any) => ({
    name: i.status, value: i.count, fill: STATUS_COLORS[i.status] ?? '#94a3b8',
  }));
  const singleByChannel = (data?.single?.byChannel || []).map((i: any, idx: number) => ({
    name: i.channel, value: i.count, fill: CHANNEL_COLORS[idx % CHANNEL_COLORS.length],
  }));
  const bulkByStatus = (data?.bulk?.byStatus || []).map((i: any) => ({
    name: i.status, value: i.count, fill: STATUS_COLORS[i.status] ?? '#94a3b8',
  }));

  const combined = data?.combined ?? { totalMessages: 0, totalSent: 0, totalFailed: 0 };
  const single = data?.single ?? { total: 0 };
  const bulk = data?.bulk ?? { totalOperations: 0, totalRecipients: 0, totalSent: 0, totalFailed: 0 };
  const operatorStats: any[] = data?.operatorStats ?? [];

  // ── Export handler ──────────────────────────────────────────────────────────
  const handleExport = async (type: 'all' | 'single' | 'bulk') => {
    setExportMenuOpen(false);
    setIsExporting(true);
    try {
      const params = new URLSearchParams({ type, ...(startDate && { startDate }), ...(endDate && { endDate }) });
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const url = `${API_URL}/city-admin/reports/export?${params}`;
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!resp.ok) throw new Error('Export failed');
      const blob = await resp.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `report_${type}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">City Reports</h1>
          <p className="page-subtitle">Combined single &amp; bulk message statistics</p>
        </div>

        <div className="flex items-end gap-2 flex-wrap">
          <div>
            <label className="label text-xs">From</label>
            <input type="date" className="input w-36 text-sm" value={startDate}
              onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="label text-xs">To</label>
            <input type="date" className="input w-36 text-sm" value={endDate}
              onChange={e => setEndDate(e.target.value)} />
          </div>

          {/* Export dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(o => !o)}
              disabled={isExporting}
              className="btn-primary flex items-center gap-2"
            >
              <Download size={15} />
              {isExporting ? 'Exporting…' : 'Export CSV'}
              <ChevronDown size={13} />
            </button>
            {exportMenuOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden">
                {(['all', 'single', 'bulk'] as const).map(t => (
                  <button key={t} onClick={() => handleExport(t)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 capitalize font-medium text-gray-700">
                    {t === 'all' ? 'All Messages' : t === 'single' ? 'Single Only' : 'Bulk Only'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Combined Summary Cards ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<MessageSquare size={22} />} label="Total Messages" value={combined.totalMessages} sub="Single + Bulk recipients" color="emerald" />
          <StatCard icon={<Send size={22} />} label="Total Sent" value={combined.totalSent} sub="Delivered + Read included" color="blue" />
          <StatCard icon={<AlertTriangle size={22} />} label="Total Failed" value={combined.totalFailed} sub="Single + Bulk failures" color="red" />
          <StatCard icon={<Layers size={22} />} label="Bulk Operations" value={bulk.totalOperations} sub={`${fmt(bulk.totalRecipients)} recipients total`} color="violet" />
        </div>
      )}

      {/* ── Two section panels: Single | Bulk ── */}
      {!isLoading && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* ─ Single Messages ─ */}
          <div className="card space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                <MessageSquare size={14} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Single Messages</h3>
                <p className="text-xs text-gray-400">{fmt(single.total)} total dispatched</p>
              </div>
            </div>

            {singleByStatus.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No single messages in period</p>
            ) : (
              <>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">By Status</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={singleByStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={72}
                        paddingAngle={3} dataKey="value">
                        {singleByStatus.map((e: any, i: number) => (
                          <Cell key={i} fill={e.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">By Channel</p>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={singleByChannel} barSize={32}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Messages" radius={[6, 6, 0, 0]}>
                        {singleByChannel.map((e: any, i: number) => (
                          <Cell key={i} fill={e.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>

          {/* ─ Bulk Operations ─ */}
          <div className="card space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                <Layers size={14} className="text-violet-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Bulk Operations</h3>
                <p className="text-xs text-gray-400">{fmt(bulk.totalOperations)} operations · {fmt(bulk.totalRecipients)} recipients</p>
              </div>
            </div>

            {bulkByStatus.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No bulk operations in period</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Sent', value: bulk.totalSent, color: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Failed', value: bulk.totalFailed, color: 'text-red-600 bg-red-50' },
                    { label: 'Recipients', value: bulk.totalRecipients, color: 'text-violet-600 bg-violet-50' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className={`rounded-xl px-3 py-3 ${color}`}>
                      <p className="text-lg font-bold">{fmt(value)}</p>
                      <p className="text-xs font-medium opacity-75">{label}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Operations by Status</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={bulkByStatus} barSize={36} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Operations" radius={[0, 6, 6, 0]}>
                        {bulkByStatus.map((e: any, i: number) => (
                          <Cell key={i} fill={e.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Per-Operator Breakdown ── */}
      {!isLoading && operatorStats.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users size={14} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Per-Operator Breakdown</h3>
              <p className="text-xs text-gray-400">Single messages + bulk operations per operator</p>
            </div>
          </div>

          <div className="table-container">
            <table className="table text-sm">
              <thead>
                <tr>
                  <th>Operator</th>
                  <th className="text-center">Single Total</th>
                  <th className="text-center">Single Sent</th>
                  <th className="text-center">Single Failed</th>
                  <th className="text-center hidden sm:table-cell">Bulk Ops</th>
                  <th className="text-center hidden sm:table-cell">Bulk Recipients</th>
                  <th className="text-center hidden md:table-cell">Bulk Sent</th>
                  <th className="text-center hidden md:table-cell">Bulk Failed</th>
                </tr>
              </thead>
              <tbody>
                {operatorStats.map((op: any) => {
                  const singleSuccessRate = op.singleTotal > 0
                    ? Math.round((op.singleSent / op.singleTotal) * 100) : null;
                  return (
                    <tr key={op.id} className="group">
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                            {op.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{op.fullName}</p>
                            <p className="text-xs text-gray-400">@{op.username} · {op.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="font-semibold">{fmt(op.singleTotal)}</span>
                      </td>
                      <td className="text-center">
                        <span className="inline-flex items-center gap-1">
                          <span className="text-emerald-600 font-semibold">{fmt(op.singleSent)}</span>
                          {singleSuccessRate !== null && (
                            <span className="text-xs text-gray-400">({singleSuccessRate}%)</span>
                          )}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`font-semibold ${op.singleFailed > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                          {fmt(op.singleFailed)}
                        </span>
                      </td>
                      <td className="text-center hidden sm:table-cell">
                        <span className="badge badge-info">{op.bulkOperations}</span>
                      </td>
                      <td className="text-center hidden sm:table-cell font-semibold">
                        {fmt(op.bulkRecipients)}
                      </td>
                      <td className="text-center hidden md:table-cell text-emerald-600 font-semibold">
                        {fmt(op.bulkSent)}
                      </td>
                      <td className="text-center hidden md:table-cell">
                        <span className={`font-semibold ${op.bulkFailed > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                          {fmt(op.bulkFailed)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Totals row */}
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold text-gray-800">
                  <td className="py-3 px-4 text-sm">City Total</td>
                  <td className="text-center py-3 px-4">{fmt(operatorStats.reduce((a: number, o: any) => a + o.singleTotal, 0))}</td>
                  <td className="text-center py-3 px-4 text-emerald-600">{fmt(operatorStats.reduce((a: number, o: any) => a + o.singleSent, 0))}</td>
                  <td className="text-center py-3 px-4 text-red-500">{fmt(operatorStats.reduce((a: number, o: any) => a + o.singleFailed, 0))}</td>
                  <td className="text-center py-3 px-4 hidden sm:table-cell">{fmt(operatorStats.reduce((a: number, o: any) => a + o.bulkOperations, 0))}</td>
                  <td className="text-center py-3 px-4 hidden sm:table-cell">{fmt(operatorStats.reduce((a: number, o: any) => a + o.bulkRecipients, 0))}</td>
                  <td className="text-center py-3 px-4 hidden md:table-cell text-emerald-600">{fmt(operatorStats.reduce((a: number, o: any) => a + o.bulkSent, 0))}</td>
                  <td className="text-center py-3 px-4 hidden md:table-cell text-red-500">{fmt(operatorStats.reduce((a: number, o: any) => a + o.bulkFailed, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
