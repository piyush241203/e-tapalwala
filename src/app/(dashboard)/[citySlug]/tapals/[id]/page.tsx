'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { FileText, Inbox, ArrowLeft, ArrowRightLeft, Send, CheckCircle2, RotateCcw, User, Calendar, MessageSquare, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/SkeletonLoader';
import { formatDateShort, getErrorMessage } from '@/lib/utils';

export default function TapalDetailPage() {
  const { citySlug, id } = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuthStore();

  const [modal, setModal] = useState<'forward' | 'resolve' | 'return' | null>(null);
  const [forwardForm, setForwardForm] = useState({ toUserId: '', actionTaken: '', remarks: '' });
  const [remarksForm, setRemarksForm] = useState({ remarks: '' });

  // 1. Fetch Tapal and History
  const { data: tapal, isLoading, error } = useQuery<any>({
    queryKey: ['tapal', id],
    queryFn: () => api.get(`/tapals/${id}`).then(r => r.data),
  });

  // 2. Fetch list of desks (users in city) to select for forwarding
  const { data: operatorsData } = useQuery<any>({
    queryKey: ['operators-list-for-forwarding'],
    queryFn: () => api.get('/city-admin/operators', { params: { limit: 100 } }).then(r => r.data),
    enabled: !!tapal,
  });
  const desks = (operatorsData?.data || []).filter((d: any) => d.id !== user?.id);

  // 3. Forward mutation
  const forwardMutation = useMutation({
    mutationFn: (body: any) => api.post(`/tapals/${id}/forward`, body),
    onSuccess: () => {
      toast.success('Tapal forwarded successfully');
      qc.invalidateQueries({ queryKey: ['tapal', id] });
      setModal(null);
      setForwardForm({ toUserId: '', actionTaken: '', remarks: '' });
    },
    onError: err => toast.error(getErrorMessage(err)),
  });

  // 4. Resolve mutation
  const resolveMutation = useMutation({
    mutationFn: (body: any) => api.post(`/tapals/${id}/resolve`, body),
    onSuccess: () => {
      toast.success('Tapal marked as Resolved');
      qc.invalidateQueries({ queryKey: ['tapal', id] });
      setModal(null);
      setRemarksForm({ remarks: '' });
    },
    onError: err => toast.error(getErrorMessage(err)),
  });

  // 5. Return mutation
  const returnMutation = useMutation({
    mutationFn: (body: any) => api.post(`/tapals/${id}/return`, body),
    onSuccess: () => {
      toast.success('Tapal returned successfully');
      qc.invalidateQueries({ queryKey: ['tapal', id] });
      setModal(null);
      setRemarksForm({ remarks: '' });
    },
    onError: err => toast.error(getErrorMessage(err)),
  });

  if (isLoading) {
    return <div className="space-y-4"><TableSkeleton rows={4} cols={3} /></div>;
  }

  if (error || !tapal) {
    return (
      <div className="card text-center p-8 space-y-3">
        <AlertCircle size={36} className="text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-gray-900">Failed to load Tapal details</h2>
        <Link href={`/${citySlug}/tapals`} className="btn-primary inline-flex gap-2">
          Back to list
        </Link>
      </div>
    );
  }

  const isCurrentHolder = tapal.currentHolderId === user?.id;

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

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Back button */}
      <Link href={`/${citySlug}/tapals`} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 font-semibold self-start transition-colors">
        <ArrowLeft size={14} /> Back to list
      </Link>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">TRACKING NUMBER</span>
          <h1 className="text-2xl font-bold text-gray-900 font-mono tracking-tight">{tapal.trackingNumber}</h1>
          <p className="text-sm font-medium text-gray-600 mt-1">Subject: <span className="font-semibold text-gray-800">{tapal.subject}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-xl border text-xs font-bold ${getStatusBadge(tapal.status)}`}>
            {tapal.status}
          </span>
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
            {tapal.type}
          </span>
        </div>
      </div>

      {/* Split screen layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* PDF viewer: 7 cols */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card p-3 overflow-hidden">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <FileText size={14} className="text-primary-500" />
              Scanned Letter Document
            </h2>
            {tapal.fileAttachment?.storageKey ? (
              <iframe
                src={tapal.fileAttachment.storageKey}
                className="w-full h-[650px] rounded-xl border border-gray-100 shadow-inner"
                title="Tapal Scanned PDF"
              />
            ) : (
              <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400 italic text-sm">
                No document file attached
              </div>
            )}
          </div>
        </div>

        {/* Timeline & Actions: 5 cols */}
        <div className="lg:col-span-5 space-y-5">
          {/* Actions panel */}
          <div className="card space-y-4 bg-gradient-to-br from-gray-50 to-white border-primary-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Current Location / Desk</h3>
              <p className="text-xs text-gray-400 mt-0.5">Currently pending action at:</p>
            </div>
            <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0">
                {tapal.currentHolder?.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{tapal.currentHolder?.fullName}</p>
                <p className="text-xs text-primary-600 font-medium mt-0.5">{tapal.currentHolder?.deskName || 'General Desk'}</p>
              </div>
            </div>

            {isCurrentHolder ? (
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => setModal('forward')}
                  className="btn-primary w-full flex items-center justify-center gap-2 shadow-md shadow-primary-100"
                >
                  <Send size={15} /> Forward to another desk
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setModal('return')}
                    className="btn-secondary flex items-center justify-center gap-1.5"
                    disabled={tapal.movements?.length === 0}
                  >
                    <RotateCcw size={14} /> Return to sender
                  </button>
                  <button
                    onClick={() => setModal('resolve')}
                    className="btn-secondary !text-emerald-700 hover:!bg-emerald-50 hover:!border-emerald-200 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={14} /> Resolve & Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 flex items-start gap-2.5 mt-2">
                <AlertCircle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-normal">
                  You are not the current holder of this letter. Only the current desk holder can route, return, or resolve this Tapal.
                </p>
              </div>
            )}
          </div>

          {/* Workflow history timeline */}
          <div className="card space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <ArrowRightLeft size={14} className="text-primary-500" />
              Desk Workflow Timeline
            </h2>
            <div className="relative pl-6 border-l border-gray-100 space-y-6 pt-2">
              {/* Origin entry */}
              <div className="relative">
                <div className="absolute -left-[30px] top-1 w-2.5 h-2.5 rounded-full bg-primary-500 ring-4 ring-primary-50" />
                <div className="text-xs space-y-0.5">
                  <p className="font-semibold text-gray-800">Tapal Registered / Entry</p>
                  <p className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Calendar size={10} /> {formatDateShort(tapal.createdAt)}
                  </p>
                  {tapal.senderDetails && (
                    <div className="bg-gray-50/50 border border-gray-100 p-2.5 rounded-lg mt-1.5 space-y-1">
                      <p className="font-medium text-gray-700">Sender details:</p>
                      <p className="text-gray-600 text-[11px]">{tapal.senderDetails.senderName} ({tapal.senderDetails.organization})</p>
                      {tapal.senderDetails.referenceLetterNo && (
                        <p className="font-mono text-[10px] text-primary-500">Letter no: {tapal.senderDetails.referenceLetterNo}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Movements history */}
              {tapal.movements?.map((m: any, idx: number) => (
                <div key={m.id} className="relative">
                  <div className="absolute -left-[30px] top-1 w-2.5 h-2.5 rounded-full bg-gray-300 ring-4 ring-gray-50 group-hover:bg-primary-500 transition-colors" />
                  <div className="text-xs space-y-0.5">
                    <p className="font-semibold text-gray-800">{m.actionTaken}</p>
                    <p className="text-gray-500 font-medium">
                      From: <span className="text-gray-700">{m.fromUser?.fullName}</span> ({m.fromUser?.deskName || 'General Desk'})
                    </p>
                    <p className="text-gray-500 font-medium">
                      To: <span className="text-gray-700">{m.toUser?.fullName}</span> ({m.toUser?.deskName || 'General Desk'})
                    </p>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1 pt-0.5">
                      <Calendar size={9} /> {formatDateShort(m.timestamp)}
                    </p>
                    {m.remarks && (
                      <div className="bg-primary-50/20 border border-primary-50 p-2 rounded-lg mt-1.5 flex items-start gap-1.5">
                        <MessageSquare size={10} className="text-primary-400 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-600 text-[11px] italic leading-normal">"{m.remarks}"</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {/* Forward Modal */}
      <Modal isOpen={modal === 'forward'} onClose={() => setModal(null)} title="Forward Tapal to Another Desk">
        <form
          onSubmit={e => {
            e.preventDefault();
            forwardMutation.mutate(forwardForm);
          }}
          className="space-y-4"
        >
          <div className="form-group">
            <label className="label">Forward To Desk/Officer *</label>
            <select
              className="select input w-full"
              value={forwardForm.toUserId}
              onChange={e => setForwardForm(f => ({ ...f, toUserId: e.target.value }))}
              required
            >
              <option value="">Select Target Desk</option>
              {desks.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.fullName} — {d.deskName || 'General Desk'} ({d.role})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Action Required / Taken *</label>
            <input
              className="input"
              value={forwardForm.actionTaken}
              onChange={e => setForwardForm(f => ({ ...f, actionTaken: e.target.value }))}
              placeholder="e.g. Forwarded for inquiry and spot report"
              required
            />
          </div>
          <div className="form-group">
            <label className="label">Remarks/Instructions</label>
            <textarea
              className="input h-20 py-2"
              value={forwardForm.remarks}
              onChange={e => setForwardForm(f => ({ ...f, remarks: e.target.value }))}
              placeholder="Add specific comments/instructions..."
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={forwardMutation.isPending}>
            {forwardMutation.isPending ? 'Forwarding…' : 'Forward Tapal'}
          </button>
        </form>
      </Modal>

      {/* Resolve Modal */}
      <Modal isOpen={modal === 'resolve'} onClose={() => setModal(null)} title="Resolve and Close Tapal file">
        <form
          onSubmit={e => {
            e.preventDefault();
            resolveMutation.mutate(remarksForm);
          }}
          className="space-y-4"
        >
          <div className="form-group">
            <label className="label">Resolution Summary Remarks *</label>
            <textarea
              className="input h-24 py-2"
              value={remarksForm.remarks}
              onChange={e => setRemarksForm(f => ({ ...f, remarks: e.target.value }))}
              placeholder="Summarize the final action taken to resolve this letter request..."
              required
            />
          </div>
          <button type="submit" className="btn-primary !bg-emerald-600 hover:!bg-emerald-700 w-full" disabled={resolveMutation.isPending}>
            {resolveMutation.isPending ? 'Resolving…' : 'Resolve and Close Tapal'}
          </button>
        </form>
      </Modal>

      {/* Return Modal */}
      <Modal isOpen={modal === 'return'} onClose={() => setModal(null)} title="Return Tapal to Previous Desk">
        <form
          onSubmit={e => {
            e.preventDefault();
            returnMutation.mutate(remarksForm);
          }}
          className="space-y-4"
        >
          <div className="form-group">
            <label className="label">Reason for Return *</label>
            <textarea
              className="input h-24 py-2"
              value={remarksForm.remarks}
              onChange={e => setRemarksForm(f => ({ ...f, remarks: e.target.value }))}
              placeholder="Provide comments explaining why you are returning this file..."
              required
            />
          </div>
          <button type="submit" className="btn-primary !bg-rose-600 hover:!bg-rose-700 w-full" disabled={returnMutation.isPending}>
            {returnMutation.isPending ? 'Returning…' : 'Confirm Return'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
