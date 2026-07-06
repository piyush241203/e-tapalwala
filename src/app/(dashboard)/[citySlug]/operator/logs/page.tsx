'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Search, ClipboardList, X } from 'lucide-react';
import api from '@/lib/api';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TableSkeleton } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import { MetaSandboxNotice } from '@/components/ui/MetaSandboxNotice';

const STATUSES = ['QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'RETRYING'];

export default function OperatorLogsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [channel, setChannel] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedBulk, setSelectedBulk] = useState<any>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((v: string) => {
    setSearch(v);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(v);
      setPage(1);
    }, 350);
  }, []);

  useEffect(() => () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); }, []);

  const { data, isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['operator-logs', page, status, channel, debouncedSearch],
    queryFn: () => api.get('/operator/messages', { params: { page, limit: 10, status, channel, search: debouncedSearch } }).then(r => r.data),
    placeholderData: keepPreviousData,
    refetchInterval: 20000,
  });

  const logs = data?.data || [];
  const hasFilters = !!(status || channel || debouncedSearch);
  const clearAll = () => { setStatus(''); setChannel(''); setSearch(''); setDebouncedSearch(''); setPage(1); };

  const lastUpdated = dataUpdatedAt
    ? new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(dataUpdatedAt))
    : null;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            My Logs
            {isFetching && !isLoading && (
              <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            )}
          </h1>
          <p className="page-subtitle">
            All messages you have sent
            {data?.total != null && <span className="ml-2 badge badge-gray">{data.total.toLocaleString()} total</span>}
          </p>
        </div>
        {lastUpdated && (
          <span className="text-xs text-gray-400 hidden sm:block whitespace-nowrap mt-1">
            Updated {lastUpdated}
          </span>
        )}
      </div>

      {/* <MetaSandboxNotice /> */}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Debounced search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-8 w-44"
            placeholder="Search mobile…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>
        <div>
          <select className="select w-40" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <select className="select w-32" value={channel} onChange={e => { setChannel(e.target.value); setPage(1); }}>
            <option value="">All Channels</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="SMS">SMS</option>
          </select>
        </div>
        {hasFilters && (
          <button
            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
            onClick={clearAll}
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={8} />
      ) : logs.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<ClipboardList size={28} />}
            title="No messages yet"
            description={hasFilters ? 'Try adjusting your filters' : 'Start by sending a single or bulk message'}
          />
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Recipient</th>
                <th className="hidden sm:table-cell">Document</th>
                <th>Channel</th>
                <th className="hidden md:table-cell">Provider</th>
                <th>Status</th>
                <th className="hidden sm:table-cell">Sent At</th>
                <th className="hidden lg:table-cell">Delivered</th>
                <th className="hidden lg:table-cell">Error</th>
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
                  <td className="hidden sm:table-cell" onClick={e => e.stopPropagation()}>
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
                  <td className="hidden md:table-cell">
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
                  <td className="hidden lg:table-cell">
                    {log.error
                      ? <span className="text-xs text-red-500 max-w-[100px] truncate block" title={log.error}>{log.error}</span>
                      : <span className="text-gray-300">—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} pages={data?.pages || 1} total={data?.total || 0} limit={10} onPageChange={setPage} />
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
