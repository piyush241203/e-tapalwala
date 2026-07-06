'use client';

import { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Filter, MessageSquare, X, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TableSkeleton } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';

const STATUSES = ['QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'READ', 'FAILED'];

export default function CityAdminMessagesPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    operatorId: '', status: '', channel: '', startDate: '', endDate: '',
  });
  const [selectedBulk, setSelectedBulk] = useState<any>(null);

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  const { data: opsData } = useQuery({
    queryKey: ['city-operators-filter'],
    queryFn: () => api.get('/city-admin/operators', { params: { limit: 100 } }).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['city-messages', page, filters],
    queryFn: () => api.get('/city-admin/messages', { params: { page, ...filters } }).then(r => r.data),
    placeholderData: keepPreviousData,
  });

  const logs = data?.data || [];
  const operators = opsData?.data || [];
  const f = (k: string, v: string) => { setFilters(p => ({ ...p, [k]: v })); setPage(1); };
  const clearAll = () => { setFilters({ operatorId: '', status: '', channel: '', startDate: '', endDate: '' }); setPage(1); };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            Message Logs
            {isFetching && !isLoading && (
              <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            )}
          </h1>
          <p className="page-subtitle">
            All messages sent by operators in your city
            {data?.total != null && <span className="ml-2 badge badge-gray">{data.total.toLocaleString()} total</span>}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={15} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
          {hasActiveFilters && (
            <button onClick={clearAll} className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium">
              <X size={13} /> Clear all
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="label">Operator</label>
            <select className="select" value={filters.operatorId} onChange={e => f('operatorId', e.target.value)}>
              <option value="">All Operators</option>
              {operators.map((op: any) => <option key={op.id} value={op.id}>{op.fullName}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="select" value={filters.status} onChange={e => f('status', e.target.value)}>
              <option value="">All</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Channel</label>
            <select className="select" value={filters.channel} onChange={e => f('channel', e.target.value)}>
              <option value="">All</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="SMS">SMS</option>
            </select>
          </div>
          <div>
            <label className="label">From Date</label>
            <input type="date" className="input" value={filters.startDate} onChange={e => f('startDate', e.target.value)} />
          </div>
          <div>
            <label className="label">To Date</label>
            <input type="date" className="input" value={filters.endDate} onChange={e => f('endDate', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Table / Skeleton */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={8} />
      ) : logs.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<MessageSquare size={28} />}
            title="No messages found"
            description={hasActiveFilters ? 'Try adjusting your filters' : 'No messages sent yet'}
          />
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Recipient</th>
                <th className="hidden sm:table-cell">Operator</th>
                <th className="hidden md:table-cell">Document</th>
                <th>Channel</th>
                <th className="hidden lg:table-cell">Provider</th>
                <th>Status</th>
                <th className="hidden sm:table-cell">Sent</th>
                <th className="hidden lg:table-cell">Delivered</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr 
                  key={log.id} 
                  className={log.isBulk ? 'cursor-pointer hover:bg-primary-50/40 transition-colors' : ''}
                  onClick={() => log.isBulk && setSelectedBulk(log)}
                >
                  <td>
                    {log.isBulk ? (
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 flex items-center gap-1.5">
                          📁 {log.operationName || 'Bulk Message'}
                        </span>
                        <span className="text-[11px] text-primary-600 font-semibold font-mono bg-primary-50 px-1.5 py-0.5 rounded w-fit mt-1">
                          {log.recipientMobile}
                        </span>
                      </div>
                    ) : (
                      <span className="font-mono text-sm font-medium text-gray-800">{log.recipientMobile}</span>
                    )}
                  </td>
                  <td className="hidden sm:table-cell text-sm text-gray-600">{log.operator?.fullName || '—'}</td>
                  <td className="hidden md:table-cell" onClick={e => e.stopPropagation()}>
                    {log.document?.id ? (
                      <a 
                        href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/operator/documents/${log.document.id}/view`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs text-primary-600 hover:text-primary-700 font-semibold hover:underline max-w-[130px] truncate block"
                        title="Click to view PDF"
                      >
                        📄 {log.document.originalName}
                      </a>
                    ) : (
                      <span className="text-xs text-gray-500 max-w-[130px] truncate block" title={log.document?.originalName}>
                        {log.document?.originalName || '—'}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`badge text-xs ${log.channel === 'WHATSAPP' ? 'badge-success' : 'badge-info'}`}>
                      {log.channel}
                    </span>
                  </td>
                  <td className="hidden lg:table-cell">
                    <span className="badge badge-gray text-xs">{log.provider}</span>
                  </td>
                  <td>
                    <StatusBadge status={log.status} />
                    {log.isBulk && (
                      <span className="text-[10px] text-gray-400 block mt-0.5 font-medium">Click to track</span>
                    )}
                  </td>
                  <td className="hidden sm:table-cell text-xs text-gray-500 whitespace-nowrap">
                    {log.sentAt ? formatDate(log.sentAt) : '—'}
                  </td>
                  <td className="hidden lg:table-cell text-xs text-gray-500 whitespace-nowrap">
                    {log.isBulk ? '—' : log.deliveredAt ? formatDate(log.deliveredAt) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} pages={data?.pages || 1} total={data?.total || 0} limit={20} onPageChange={setPage} />
        </div>
      )}

      {/* Bulk Operation Details Modal */}
      {selectedBulk && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setSelectedBulk(null)}
        >
          <div 
            className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-5 py-4 bg-gray-50/50">
              <div>
                <h3 className="font-bold text-gray-800 text-base">Bulk Sending Status</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {selectedBulk.id}</p>
              </div>
              <button 
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setSelectedBulk(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <BulkProgressCard bulkOperationId={selectedBulk.id} onClose={() => setSelectedBulk(null)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BulkProgressCard({ bulkOperationId, onClose }: { bulkOperationId: string; onClose: () => void }) {
  const [operationStatus, setOperationStatus] = useState<any>(null);

  useEffect(() => {
    let intervalId: any;
    const fetchStatus = async () => {
      try {
        const res = await api.get(`/operator/bulk-operations/${bulkOperationId}`);
        setOperationStatus(res.data);
        if (res.data.status === 'COMPLETED' || res.data.status === 'FAILED') {
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error('Failed to fetch bulk operation status:', err);
      }
    };

    fetchStatus();
    intervalId = setInterval(fetchStatus, 2500);

    return () => clearInterval(intervalId);
  }, [bulkOperationId]);

  return (
    <div className={`border-2 rounded-xl p-5 space-y-4 transition-colors duration-300 ${
      !operationStatus 
        ? 'border-gray-200 bg-gray-50' 
        : operationStatus.status === 'COMPLETED' && operationStatus.failedCount === 0
          ? 'border-emerald-200 bg-emerald-50/80'
          : operationStatus.status === 'FAILED' || (operationStatus.status === 'COMPLETED' && operationStatus.failedCount === operationStatus.totalRecipients)
            ? 'border-red-200 bg-red-50/80'
            : 'border-amber-200 bg-amber-50/80'
    }`}>
      <div className="flex items-start gap-3">
        {!operationStatus || operationStatus.status === 'QUEUED' || operationStatus.status === 'PROCESSING' ? (
          <span className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5" />
        ) : operationStatus.status === 'COMPLETED' && operationStatus.failedCount === 0 ? (
          <span className="text-emerald-600 flex-shrink-0 font-bold text-lg mt-0.5">✓</span>
        ) : (
          <span className="text-red-500 flex-shrink-0 font-bold text-lg mt-0.5">⚠</span>
        )}
        <div>
          <h4 className={`font-semibold text-base ${
            !operationStatus 
              ? 'text-gray-800' 
              : operationStatus.status === 'COMPLETED' && operationStatus.failedCount === 0
                ? 'text-emerald-800'
                : operationStatus.status === 'FAILED'
                  ? 'text-red-800'
                  : 'text-amber-800'
          }`}>
            {!operationStatus 
              ? 'Fetching status details...' 
              : operationStatus.status === 'QUEUED'
                ? 'Queued for Dispatch'
                : operationStatus.status === 'PROCESSING'
                  ? 'Sending in Progress...'
                  : operationStatus.status === 'COMPLETED' && operationStatus.failedCount === 0
                    ? 'All Messages Sent Successfully!'
                    : 'Bulk Sending Completed with Errors'}
          </h4>
          <p className="text-xs text-gray-500 font-medium">Operation Name: <span className="font-semibold text-gray-700">{operationStatus?.name || '—'}</span></p>
        </div>
      </div>

      {operationStatus && (
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-white/60 rounded-lg p-2 shadow-sm">
            <p className="text-[9px] uppercase font-bold text-gray-400">Total</p>
            <p className="text-sm font-extrabold text-gray-700">{operationStatus.totalRecipients}</p>
          </div>
          <div className="bg-white/60 rounded-lg p-2 shadow-sm">
            <p className="text-[9px] uppercase font-bold text-emerald-500">Sent</p>
            <p className="text-sm font-extrabold text-emerald-600">{operationStatus.sentCount}</p>
          </div>
          <div className="bg-white/60 rounded-lg p-2 shadow-sm">
            <p className="text-[9px] uppercase font-bold text-red-400">Failed</p>
            <p className="text-sm font-extrabold text-red-500">{operationStatus.failedCount}</p>
          </div>
          <div className="bg-white/60 rounded-lg p-2 shadow-sm">
            <p className="text-[9px] uppercase font-bold text-primary-400">Rest</p>
            <p className="text-sm font-extrabold text-primary-600">
              {operationStatus.totalRecipients - operationStatus.sentCount - operationStatus.failedCount}
            </p>
          </div>
        </div>
      )}

      {operationStatus && operationStatus.totalRecipients > 0 && (
        <div className="space-y-1">
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${(operationStatus.sentCount / operationStatus.totalRecipients) * 100}%` }}
            />
            <div 
              className="h-full bg-red-500 transition-all duration-300"
              style={{ width: `${(operationStatus.failedCount / operationStatus.totalRecipients) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 font-semibold px-0.5">
            <span>0%</span>
            <span>{Math.round(((operationStatus.sentCount + operationStatus.failedCount) / operationStatus.totalRecipients) * 100)}% Complete</span>
            <span>100%</span>
          </div>
        </div>
      )}

      {operationStatus?.document?.id && (
        <div className="flex gap-3 justify-center pt-2">
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/operator/documents/${operationStatus.document.id}/view`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary py-2 px-3 text-xs font-semibold flex-1 text-center justify-center flex items-center gap-1.5 hover:bg-gray-100 transition-colors"
          >
            📄 View PDF Document
          </a>
          {operationStatus?.csvFileUrl && (
            <a
              href={operationStatus.csvFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary py-2 px-3 text-xs font-semibold flex-1 text-center justify-center flex items-center gap-1.5 hover:bg-gray-100 transition-colors"
            >
              📊 Download CSV file
            </a>
          )}
        </div>
      )}

      <div className="pt-1 flex justify-end">
        <button className="btn-secondary py-2 px-4 text-xs font-semibold" onClick={onClose}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
