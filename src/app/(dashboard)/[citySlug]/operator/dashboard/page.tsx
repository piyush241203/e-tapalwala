'use client';

import { useQuery } from '@tanstack/react-query';
import { Send, Zap, ClipboardList, AlertCircle, MessageSquare, CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { DashboardStatsSkeleton, ActionCardSkeleton, CardSkeleton } from '@/components/ui/SkeletonLoader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';

const ACTION_CONFIG = [
  {
    label: 'Send Single',
    desc: 'Upload PDF & send to one number',
    slug: 'send/single',
    icon: Send,
    gradient: 'from-emerald-500 to-green-600',
    bg: 'from-emerald-50 to-green-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    hover: 'hover:border-emerald-300 hover:shadow-emerald-100',
  },
  {
    label: 'Bulk Send',
    desc: 'Upload PDF + CSV for many recipients',
    slug: 'send/bulk',
    icon: Zap,
    gradient: 'from-orange-500 to-amber-500',
    bg: 'from-orange-50 to-amber-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    hover: 'hover:border-orange-300 hover:shadow-orange-100',
  },
  {
    label: 'My Logs',
    desc: 'View all sent messages',
    slug: 'logs',
    icon: ClipboardList,
    gradient: 'from-blue-500 to-indigo-600',
    bg: 'from-blue-50 to-indigo-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    hover: 'hover:border-blue-300 hover:shadow-blue-100',
  },
  {
    label: 'Retry Queue',
    desc: 'Retry failed messages',
    slug: 'retry',
    icon: AlertCircle,
    gradient: 'from-red-500 to-rose-600',
    bg: 'from-red-50 to-rose-50',
    border: 'border-red-200',
    text: 'text-red-700',
    hover: 'hover:border-red-300 hover:shadow-red-100',
  },
];

const STAT_CONFIG = [
  { key: 'totalSent',  label: 'Total Sent',  icon: MessageSquare, gradient: 'from-blue-500 to-indigo-600',   glow: 'shadow-blue-100' },
  { key: 'pending',    label: 'Pending',      icon: Clock,         gradient: 'from-amber-500 to-orange-500',  glow: 'shadow-amber-100' },
  { key: 'delivered',  label: 'Delivered',    icon: CheckCircle2,  gradient: 'from-emerald-500 to-green-600', glow: 'shadow-emerald-100' },
  { key: 'failed',     label: 'Failed',       icon: XCircle,       gradient: 'from-red-500 to-rose-600',      glow: 'shadow-red-100' },
];

export default function OperatorDashboard() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['operator-dashboard'],
    queryFn: () => api.get('/operator/dashboard').then(r => r.data),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <div className="skeleton-pulse h-8 w-52 rounded-lg" />
          <div className="skeleton-pulse h-4 w-64 rounded mt-2" />
        </div>
        <DashboardStatsSkeleton count={4} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <ActionCardSkeleton key={i} />)}
        </div>
        <CardSkeleton lines={4} />
      </div>
    );
  }

  const stats = data?.stats || {};
  const recent = data?.recentLogs || [];
  const totalMessages = (stats.totalSent || 0) + (stats.pending || 0) + (stats.delivered || 0) + (stats.failed || 0);
  const successRate = totalMessages > 0
    ? Math.round(((stats.delivered || 0) / totalMessages) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">
            Welcome back, <span className="text-emerald-600">{user?.fullName?.split(' ')[0]}</span> 👋
          </h1>
          <p className="page-subtitle">Send documents and track message status</p>
        </div>
        {successRate > 0 && (
          <div className="kpi-pill">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span className="text-sm font-semibold text-emerald-700">{successRate}% success rate</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {STAT_CONFIG.map(({ key, label, icon: Icon, gradient, glow }) => {
          const value = stats[key] ?? 0;
          return (
            <div key={key} className={`stat-card-premium ${glow}`}>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
                <Icon size={19} className="text-white" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-gray-900 tabular-nums">{value.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ACTION_CONFIG.map(({ label, desc, slug, icon: Icon, gradient, bg, border, text, hover }) => {
            const href = `/${user?.citySlug}/operator/${slug}`;
            return (
              <Link
                key={slug}
                href={href}
                className={`group flex items-center gap-4 p-4 rounded-2xl border bg-gradient-to-r ${bg} ${border} ${hover} shadow-sm hover:shadow-md transition-all duration-200`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
                  <Icon size={21} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${text}`}>{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{desc}</p>
                </div>
                <ArrowRight size={16} className={`${text} opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0`} />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Messages */}
      {recent.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Recent Messages</h3>
            <Link href={`/${user?.citySlug}/operator/logs`} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-1">
            {recent.map((log: any) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                    <MessageSquare size={14} className="text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 font-mono">{log.recipientMobile}</p>
                    <p className="text-xs text-gray-400 truncate max-w-[180px]">{log.document?.originalName || 'No document'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`badge text-xs ${log.channel === 'WHATSAPP' ? 'badge-success' : 'badge-info'}`}>
                    {log.channel}
                  </span>
                  <StatusBadge status={log.status} />
                  <span className="text-xs text-gray-400 hidden sm:block whitespace-nowrap">{formatDate(log.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
