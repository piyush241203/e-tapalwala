'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, MessageSquare, CheckCircle2, XCircle, Clock, Activity, TrendingUp, Plus, FileText, BarChart3 } from 'lucide-react';
import api from '@/lib/api';
import { DashboardStatsSkeleton, ChartSkeleton, CardSkeleton } from '@/components/ui/SkeletonLoader';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from 'recharts';

const STAT_CONFIG = [
  {
    key: 'operatorsCount',
    label: 'Total Operators',
    icon: Users,
    gradient: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    glow: 'shadow-violet-100',
  },
  {
    key: 'messagesToday',
    label: 'Sent Today',
    icon: MessageSquare,
    gradient: 'from-blue-500 to-cyan-600',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    glow: 'shadow-blue-100',
  },
  {
    key: 'pendingMessages',
    label: 'Pending',
    icon: Clock,
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    glow: 'shadow-amber-100',
  },
  {
    key: 'failedMessages',
    label: 'Failed',
    icon: XCircle,
    gradient: 'from-red-500 to-rose-600',
    bg: 'bg-red-50',
    text: 'text-red-700',
    glow: 'shadow-red-100',
  },
  {
    key: 'deliveredMessages',
    label: 'Delivered',
    icon: CheckCircle2,
    gradient: 'from-emerald-500 to-green-600',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    glow: 'shadow-emerald-100',
  },
  {
    key: 'readMessages',
    label: 'Read',
    icon: Activity,
    gradient: 'from-teal-500 to-cyan-600',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    glow: 'shadow-teal-100',
  },
];

// Custom tooltip for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 rounded-xl px-4 py-3 shadow-xl border border-gray-700 text-white text-xs">
        <p className="font-semibold mb-2 text-gray-300 truncate max-w-[140px]">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill }} />
            <span className="text-gray-400">{p.name}:</span>
            <span className="font-bold">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function CityAdminDashboard() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['city-admin-dashboard'],
    queryFn: () => api.get('/city-admin/dashboard').then(r => r.data),
    refetchInterval: 60000, // Poll every 60s (was 30s)
  });

  const stats = data?.stats || {};
  const operatorStats = data?.operatorStats || [];

  // Delivery rate calculation
  const totalDelivered = (stats.deliveredMessages ?? 0) + (stats.readMessages ?? 0);
  const totalSent = stats.messagesToday ?? 0;
  const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / (totalSent + totalDelivered + (stats.failedMessages ?? 0))) * 100) : 0;

  const quickLinks = [
    { label: 'Add Operator',     href: `/${user?.citySlug}/operators`,  icon: Plus,      cls: 'btn-primary' },
    { label: 'Message Logs',     href: `/${user?.citySlug}/messages`,   icon: FileText,  cls: 'btn-secondary' },
    { label: 'Export Reports',   href: `/${user?.citySlug}/reports`,    icon: BarChart3, cls: 'btn-secondary' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="dashboard-header">
          <div className="skeleton-pulse h-8 w-56 rounded-lg" />
          <div className="skeleton-pulse h-4 w-72 rounded mt-2" />
        </div>
        <DashboardStatsSkeleton count={6} />
        <ChartSkeleton />
        <CardSkeleton lines={2} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="dashboard-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <span>City Admin Dashboard</span>
              <span className="live-badge">● LIVE</span>
            </h1>
            <p className="page-subtitle">Monitor operators and message activity in your city</p>
          </div>
          {deliveryRate > 0 && (
            <div className="kpi-pill">
              <TrendingUp size={14} className="text-emerald-500" />
              <span className="text-sm font-semibold text-emerald-700">{deliveryRate}% delivery rate</span>
            </div>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {STAT_CONFIG.map(({ key, label, icon: Icon, gradient, bg, text, glow }) => {
          const value = stats[key] ?? 0;
          return (
            <div key={key} className={`stat-card-premium ${glow}`}>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
                <Icon size={19} className="text-white" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-gray-900 tabular-nums">{value.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Operator Performance Chart */}
      {operatorStats.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Operator Performance</h3>
              <p className="text-xs text-gray-400 mt-0.5">Message delivery breakdown per operator</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"/> Sent</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"/> Delivered</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"/> Failed</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={operatorStats} barSize={18} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="fullName"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
              <Bar dataKey="sent"      name="Sent"      fill="#3b82f6" radius={[4,4,0,0]} />
              <Bar dataKey="delivered" name="Delivered" fill="#22c55e" radius={[4,4,0,0]} />
              <Bar dataKey="failed"    name="Failed"    fill="#f87171" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Operator stats table (bonus — visible on desktop) */}
      {operatorStats.length > 0 && (
        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Operator Summary</h3>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Operator</th>
                  <th className="text-center">Sent</th>
                  <th className="text-center">Delivered</th>
                  <th className="text-center">Failed</th>
                  <th className="text-center">Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {operatorStats.map((op: any) => {
                  const total = (op.sent || 0) + (op.delivered || 0) + (op.failed || 0);
                  const rate = total > 0 ? Math.round(((op.delivered || 0) / total) * 100) : 0;
                  return (
                    <tr key={op.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                            {op.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{op.fullName}</p>
                            <p className="text-xs text-gray-400">@{op.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center text-sm font-medium text-blue-600">{op.sent || 0}</td>
                      <td className="text-center text-sm font-medium text-emerald-600">{op.delivered || 0}</td>
                      <td className="text-center text-sm font-medium text-red-500">{op.failed || 0}</td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          {quickLinks.map(({ label, href, icon: Icon, cls }) => (
            <Link key={href} href={href} className={`${cls} gap-2`}>
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
