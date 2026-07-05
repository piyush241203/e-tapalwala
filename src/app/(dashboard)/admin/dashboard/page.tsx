'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Building2, Users, MessageSquare, CheckCircle2, XCircle,
  TrendingUp, Activity, Globe, ServerCrash,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { PageLoader } from '@/components/ui/Spinner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  SENT: '#3b82f6',
  DELIVERED: '#22c55e',
  READ: '#8b5cf6',
  FAILED: '#ef4444',
  QUEUED: '#f59e0b',
  PROCESSING: '#06b6d4',
};

export default function PlatformAdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['platform-admin-dashboard'],
    queryFn: () => api.get('/super-admin/dashboard').then(r => r.data),
    refetchInterval: 30000,
  });

  if (isLoading) return <PageLoader />;

  const stats = data?.stats || {};
  const recentActivity = data?.recentActivity || [];
  const topCities = data?.topCities || [];

  const statCards = [
    { label: 'Active Cities', value: stats.totalCities ?? 0, icon: <Building2 size={22} />, light: 'bg-blue-50 text-blue-600' },
    { label: 'City Admins', value: stats.totalCityAdmins ?? 0, icon: <Users size={22} />, light: 'bg-purple-50 text-purple-600' },
    { label: 'Operators', value: stats.totalOperators ?? 0, icon: <Globe size={22} />, light: 'bg-indigo-50 text-indigo-600' },
    { label: 'Total Messages', value: stats.totalMessages ?? 0, icon: <MessageSquare size={22} />, light: 'bg-cyan-50 text-cyan-700' },
    { label: 'Delivered', value: stats.deliveredMessages ?? 0, icon: <CheckCircle2 size={22} />, light: 'bg-green-50 text-green-700' },
    { label: 'Failed', value: stats.failedMessages ?? 0, icon: <ServerCrash size={22} />, light: 'bg-red-50 text-red-600' },
    { label: 'Delivery Rate', value: `${stats.deliveryRate ?? 0}%`, icon: <TrendingUp size={22} />, light: 'bg-orange-50 text-orange-600' },
    { label: 'Read Rate', value: `${stats.readRate ?? 0}%`, icon: <Activity size={22} />, light: 'bg-amber-50 text-amber-700' },
  ];

  const pieData = recentActivity.map((item: any) => ({
    name: item.status,
    value: item._count.status,
    fill: STATUS_COLORS[item.status] || '#94a3b8',
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Platform Overview</h1>
        <p className="page-subtitle">Full visibility across all tenants and cities</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className={`stat-icon ${card.light}`}>{card.icon}</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Message Status Pie */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Message Status (Last 7 Days)</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={90}
                  paddingAngle={3} dataKey="value"
                >
                  {pieData.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any, n: any) => [v, n]} />
                <Legend iconType="circle" iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data yet</div>
          )}
        </div>

        {/* Top Cities Bar */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Top Cities by Messages</h3>
          {topCities.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topCities} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="cityName" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No cities yet</div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/cities" className="btn-primary text-sm">+ Add City</Link>
          <Link href="/admin/city-admins" className="btn-primary text-sm">+ Add City Admin</Link>
          <Link href="/admin/logs" className="btn-secondary text-sm">View All Logs</Link>
          <Link href="/admin/reports" className="btn-secondary text-sm">Export Reports</Link>
          <Link href="/admin/settings" className="btn-secondary text-sm">API Settings</Link>
        </div>
      </div>
    </div>
  );
}
