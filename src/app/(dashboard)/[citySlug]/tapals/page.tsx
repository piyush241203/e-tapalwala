'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Plus, Search, FileText, ExternalLink, Calendar, User, Eye, Inbox } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { TableSkeleton } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/Spinner';
import { formatDateShort } from '@/lib/utils';

export default function TapalsPage() {
  const router = useRouter();
  const { citySlug } = useParams();
  const { user } = useAuthStore();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [mine, setMine] = useState(true); // default to viewing their own pending desk items
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(v);
    }, 350);
  }, []);

  useEffect(() => () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); }, []);

  const { data: tapals = [], isLoading } = useQuery<any[]>({
    queryKey: ['tapals', type, status, debouncedSearch, mine],
    queryFn: () =>
      api
        .get('/tapals', {
          params: {
            type: type || undefined,
            status: status || undefined,
            search: debouncedSearch || undefined,
            mine: mine ? 'true' : undefined,
          },
        })
        .then(r => r.data),
  });

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'New':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'In-Progress':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Returned':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getTypeBadge = (t: string) => {
    switch (t) {
      case 'Inward':
        return 'bg-purple-100 text-purple-700';
      case 'Outward':
        return 'bg-blue-100 text-blue-700';
      case 'Internal':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Inbox size={22} className="text-primary-600" />
            <span>Tapal Tracking Portal (Letters)</span>
          </h1>
          <p className="page-subtitle">Track and route inward, outward, and internal files across office desks</p>
        </div>
        <Link href={`/${citySlug}/tapals/create`} className="btn-primary self-start sm:self-auto">
          <Plus size={16} /> New Tapal Entry
        </Link>
      </div>

      {/* Filters Panel */}
      <div className="card space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Search by Tracking #, subject or sender..."
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
            />
          </div>

          {/* Type Filter */}
          <select className="select input md:w-44" value={type} onChange={e => setType(e.target.value)}>
            <option value="">All Types</option>
            <option value="Inward">Inward</option>
            <option value="Outward">Outward</option>
            <option value="Internal">Internal</option>
          </select>

          {/* Status Filter */}
          <select className="select input md:w-44" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="In-Progress">In-Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Returned">Returned</option>
          </select>
        </div>

        {/* Toggle between own pending and all city tapals */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4 border-gray-300"
              checked={mine}
              onChange={e => setMine(e.target.checked)}
            />
            <span className="text-xs font-semibold text-gray-700">Show only Tapals pending at my desk</span>
          </label>
        </div>
      </div>

      {/* List content */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : tapals.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<FileText size={28} />}
            title="No Tapals Found"
            description={
              mine
                ? "No pending tapals at your desk. Toggle off 'Show only pending' to see all city tapals."
                : "No matching Tapals found in Nagpur district database."
            }
          />
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Tracking Number</th>
                <th>Subject</th>
                <th>Type</th>
                <th>Sender / Letter details</th>
                <th>Current Holder (Desk)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tapals.map((tapal: any) => (
                <tr key={tapal.id} className="group hover:bg-gray-50/50">
                  <td className="font-mono text-xs font-bold text-primary-600">
                    <Link href={`/${citySlug}/tapals/${tapal.id}`} className="hover:underline">
                      {tapal.trackingNumber}
                    </Link>
                  </td>
                  <td>
                    <div className="max-w-xs sm:max-w-md">
                      <p className="font-semibold text-gray-900 text-sm truncate">{tapal.subject}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                        <Calendar size={10} /> Received {formatDateShort(tapal.createdAt)}
                      </p>
                    </div>
                  </td>
                  <td>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getTypeBadge(tapal.type)}`}>
                      {tapal.type}
                    </span>
                  </td>
                  <td className="text-xs">
                    {tapal.senderDetails ? (
                      <div>
                        <p className="font-medium text-gray-800">{tapal.senderDetails.senderName || '—'}</p>
                        <p className="text-gray-400 text-[10px]">{tapal.senderDetails.organization || 'No Organization'}</p>
                        {tapal.senderDetails.referenceLetterNo && (
                          <p className="text-primary-500 font-mono text-[9px] mt-0.5">Ref: {tapal.senderDetails.referenceLetterNo}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td>
                    {tapal.currentHolder ? (
                      <div className="text-xs">
                        <p className="font-medium text-gray-800 flex items-center gap-1">
                          <User size={10} className="text-gray-400" />
                          {tapal.currentHolder.fullName}
                        </p>
                        <p className="text-[10px] text-primary-600 font-medium mt-0.5">
                          {tapal.currentHolder.deskName || 'General Desk'}
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-300">Unassigned</span>
                    )}
                  </td>
                  <td>
                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-xl border ${getStatusBadge(tapal.status)}`}>
                      {tapal.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/${citySlug}/tapals/${tapal.id}`}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                        title="View workflow history & details"
                      >
                        <Eye size={15} />
                      </Link>
                      {tapal.fileAttachment?.storageKey && (
                        <a
                          href={tapal.fileAttachment.storageKey}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Open PDF Document"
                        >
                          <ExternalLink size={15} />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
