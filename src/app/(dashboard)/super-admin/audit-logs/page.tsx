'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { PageLoader, EmptyState } from '@/components/ui/Spinner';
import { Pagination } from '@/components/ui/Pagination';
import { formatDate } from '@/lib/utils';
import { Shield } from 'lucide-react';

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'bg-blue-100 text-blue-700',
  LOGOUT: 'bg-gray-100 text-gray-600',
  CREATE_CITY: 'bg-green-100 text-green-700',
  UPDATE_CITY: 'bg-yellow-100 text-yellow-700',
  DELETE_CITY: 'bg-red-100 text-red-700',
  ACTIVATE_CITY: 'bg-green-100 text-green-700',
  DEACTIVATE_CITY: 'bg-orange-100 text-orange-700',
  CREATE_CITY_ADMIN: 'bg-purple-100 text-purple-700',
  UPDATE_CITY_ADMIN: 'bg-yellow-100 text-yellow-700',
  CREATE_OPERATOR: 'bg-primary-100 text-primary-700',
  UPDATE_OPERATOR: 'bg-yellow-100 text-yellow-700',
  SEND_SINGLE_MESSAGE: 'bg-cyan-100 text-cyan-700',
  SEND_BULK_MESSAGE: 'bg-indigo-100 text-indigo-700',
  RESET_PASSWORD: 'bg-orange-100 text-orange-700',
  UPDATE_MESSAGING_SETTINGS: 'bg-red-100 text-red-700',
};

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, action],
    queryFn: () => api.get('/super-admin/audit-logs', { params: { page, action } }).then(r => r.data),
  });

  const logs = data?.data || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle">Complete audit trail of all system actions</p>
        </div>
        <div className="flex gap-2 items-center">
          <Shield size={16} className="text-gray-400" />
          <input className="input w-48 text-sm" placeholder="Filter by action..."
            value={action} onChange={e => { setAction(e.target.value); setPage(1); }} />
        </div>
      </div>

      {isLoading ? <PageLoader /> : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Actor</th><th>Role</th><th>Action</th><th>Entity</th><th>IP Address</th><th>Time</th></tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={6} className="py-0">
                  <EmptyState icon={<Shield size={22} />} title="No audit logs found" />
                </td></tr>
              ) : logs.map((log: any) => (
                <tr key={log.id}>
                  <td>
                    <p className="font-medium text-sm text-gray-900">{log.actor?.fullName}</p>
                  </td>
                  <td>
                    <span className="badge badge-gray text-xs">{log.actor?.role}</span>
                  </td>
                  <td>
                    <span className={`badge text-xs ${ACTION_COLORS[log.action] || 'badge-gray'}`}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="text-sm text-gray-600">
                    {log.entityType}{log.entityId ? ` #${log.entityId.slice(0, 8)}…` : ''}
                  </td>
                  <td className="text-xs text-gray-400 font-mono">{log.ipAddress || '—'}</td>
                  <td className="text-xs text-gray-500">{formatDate(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} pages={data?.pages || 1} total={data?.total || 0} limit={20} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
