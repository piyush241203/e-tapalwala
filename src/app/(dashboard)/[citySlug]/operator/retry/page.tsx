'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { RefreshCw, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TableSkeleton } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/Spinner';
import { formatDate, getErrorMessage } from '@/lib/utils';

export default function RetryQueuePage() {
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['failed-messages', page],
    queryFn: () => api.get('/operator/messages/failed', { params: { page } }).then(r => r.data),
    placeholderData: keepPreviousData,
    refetchInterval: 20000,
  });

  const retryMutation = useMutation({
    mutationFn: (id: string) => api.post(`/operator/messages/${id}/retry`),
    onSuccess: () => {
      toast.success('Retry queued');
      qc.invalidateQueries({ queryKey: ['failed-messages'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const logs = data?.data || [];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title flex items-center gap-2">
          Retry Queue
          {isFetching && !isLoading && (
            <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          )}
        </h1>
        <p className="page-subtitle">
          Failed messages that can be retried (max 3 attempts)
          {data?.total != null && <span className="ml-2 badge badge-danger">{data.total} failed</span>}
        </p>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} cols={8} />
      ) : logs.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<CheckCircle size={28} className="text-emerald-500" />}
            title="No failed messages"
            description="All messages sent successfully — great job!"
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
                <th>Status</th>
                <th className="hidden md:table-cell">Error</th>
                <th>Retries</th>
                <th className="hidden sm:table-cell">Last Try</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log.id}>
                  <td className="font-mono text-sm font-medium text-gray-800">{log.recipientMobile}</td>
                  <td className="hidden sm:table-cell">
                    <span className="text-xs text-gray-500 max-w-[120px] truncate block" title={log.document?.originalName}>
                      {log.document?.originalName || '—'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge text-xs ${log.channel === 'WHATSAPP' ? 'badge-success' : 'badge-info'}`}>
                      {log.channel}
                    </span>
                  </td>
                  <td><StatusBadge status={log.status} /></td>
                  <td className="hidden md:table-cell">
                    <span className="text-xs text-red-500 max-w-[150px] truncate block" title={log.error}>
                      {log.error || '—'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge text-xs ${log.retryCount >= 3 ? 'badge-danger' : 'badge-warning'}`}>
                      {log.retryCount}/3
                    </span>
                  </td>
                  <td className="hidden sm:table-cell text-xs text-gray-500 whitespace-nowrap">
                    {log.lastRetryAt ? formatDate(log.lastRetryAt) : '—'}
                  </td>
                  <td>
                    {log.retryCount < 3 ? (
                      <button
                        onClick={() => retryMutation.mutate(log.id)}
                        disabled={retryMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all disabled:opacity-50"
                      >
                        {retryMutation.isPending
                          ? <Loader2 size={12} className="animate-spin" />
                          : <RefreshCw size={12} />}
                        Retry
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Max reached</span>
                    )}
                  </td>
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
