'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Upload, FileText, X, Zap, Loader2, CheckCircle2, Users, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import { MetaSandboxNotice } from '@/components/ui/MetaSandboxNotice';
import { useParams } from 'next/navigation';

export default function BulkSendPage() {
  const { citySlug } = useParams();
  const [name, setName] = useState('');
  const [channel, setChannel] = useState('WHATSAPP');
  const [provider, setProvider] = useState('META');
  const [body, setBody] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [operationStatus, setOperationStatus] = useState<any>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!result?.bulkOperationId) {
      setOperationStatus(null);
      return;
    }

    let intervalId: any;
    const fetchStatus = async () => {
      try {
        const res = await api.get(`/operator/bulk-operations/${result.bulkOperationId}`);
        setOperationStatus(res.data);
        if (res.data.status === 'COMPLETED' || res.data.status === 'FAILED') {
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error('Failed to fetch bulk operation status:', err);
      }
    };

    fetchStatus();
    intervalId = setInterval(fetchStatus, 2000);

    return () => clearInterval(intervalId);
  }, [result?.bulkOperationId]);

  const previewMutation = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('csv', file);
      return api.post('/operator/csv/preview', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: (res) => setPreview(res.data),
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const sendMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('pdf', pdfFile!);
      fd.append('csv', csvFile!);
      fd.append('name', name);
      fd.append('channel', channel);
      fd.append('provider', provider);
      if (body) fd.append('body', body);
      return api.post('/operator/send/bulk', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: (res) => {
      setResult(res.data);
      toast.success(`Bulk operation started for ${res.data.totalRecipients} recipients!`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleCsvChange = (file: File) => {
    setCsvFile(file);
    setPreview(null);
    previewMutation.mutate(file);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile) { toast.error('PDF file required'); return; }
    if (!csvFile) { toast.error('CSV file required'); return; }
    if (!name) { toast.error('Operation name required'); return; }
    sendMutation.mutate();
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="page-header">
        <h1 className="page-title">Bulk Message</h1>
        <p className="page-subtitle">Send a document to multiple recipients using a CSV file</p>
      </div>

      {/* <MetaSandboxNotice /> */}

      {!result ? (
        <form onSubmit={handleSend} className="space-y-5">
          {/* Operation Name */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">1. Operation Details</h3>
            <div className="form-group">
              <label className="label">Operation Name *</label>
              <input className="input" placeholder="e.g. Land Record Notice - June 2025"
                value={name} onChange={e => setName(e.target.value)} required />
            </div>
          </div>

          {/* Files */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">2. Upload Files</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* PDF */}
              <div>
                <label className="label">PDF Document *</label>
                {!pdfFile ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
                    onClick={() => pdfRef.current?.click()}>
                    <FileText size={22} className="mx-auto text-gray-300 mb-1" />
                    <p className="text-xs text-gray-500">Click to upload PDF</p>
                    <input ref={pdfRef} type="file" accept=".pdf" className="hidden"
                      onChange={e => setPdfFile(e.target.files?.[0] || null)} />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-primary-50 rounded-xl border border-primary-100">
                    <FileText size={16} className="text-primary-600" />
                    <p className="text-xs text-gray-700 truncate flex-1">{pdfFile.name}</p>
                    <a
                      href={URL.createObjectURL(pdfFile)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-gray-400 hover:text-primary-600 rounded hover:bg-white transition-all"
                      title="View PDF"
                    >
                      <Eye size={14} />
                    </a>
                    <button type="button" onClick={() => setPdfFile(null)}>
                      <X size={14} className="text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                )}
              </div>

              {/* CSV */}
              <div>
                <label className="label">Recipients CSV *</label>
                {!csvFile ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-accent-400 hover:bg-accent-50/30 transition-colors"
                    onClick={() => csvRef.current?.click()}>
                    <Users size={22} className="mx-auto text-gray-300 mb-1" />
                    <p className="text-xs text-gray-500">Click to upload CSV</p>
                    <p className="text-xs text-gray-400">Needs: mobile, name columns</p>
                    <input ref={csvRef} type="file" accept=".csv,text/csv" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleCsvChange(f); }} />
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 p-3 bg-accent-50 rounded-xl border border-accent-100">
                      <Users size={16} className="text-accent-600" />
                      <p className="text-xs text-gray-700 truncate flex-1">{csvFile.name}</p>
                      <a
                        href={URL.createObjectURL(csvFile)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-gray-400 hover:text-accent-600 rounded hover:bg-white transition-all"
                        title="View CSV"
                      >
                        <Eye size={14} />
                      </a>
                      <button type="button" onClick={() => { setCsvFile(null); setPreview(null); }}>
                        <X size={14} className="text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                    {/* Preview */}
                    {previewMutation.isPending && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Validating CSV...</p>
                    )}
                    {preview && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Total rows:</span>
                          <span className="font-semibold">{preview.totalRows}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Valid numbers:</span>
                          <span className="font-semibold text-green-600">{preview.validRows}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Mobile column:</span>
                          <code className="bg-white px-1 rounded">{preview.mobileColumn || 'Not found'}</code>
                        </div>
                        {!preview.mobileColumn && (
                          <p className="text-red-500 flex items-center gap-1">
                            <AlertCircle size={12} /> No mobile column found. Expected: mobile, phone, or number
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

        {/* Message & Channel */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">3. Channel & Message</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="label">Channel</label>
                <select className="select" value={channel} onChange={e => setChannel(e.target.value)}>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="SMS">SMS</option>
                </select>
              </div>
              <div>
                <label className="label">Provider</label>
                <select className="select" value={provider} onChange={e => setProvider(e.target.value)}>
                  <option value="META">Meta WhatsApp</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="label">Message / Caption (optional)</label>
              <textarea className="input resize-none h-20" placeholder="Optional message or caption..."
                value={body} onChange={e => setBody(e.target.value)} />
            </div>
          </div>

          <button type="submit" className="btn-accent w-full py-3 text-base"
            disabled={sendMutation.isPending || !pdfFile || !csvFile || (preview && !preview.mobileColumn)}>
            {sendMutation.isPending
              ? <><Loader2 size={18} className="animate-spin" /> Starting Bulk Send...</>
              : <><Zap size={18} /> Start Bulk Send {preview ? `(${preview.validRows} recipients)` : ''}</>}
          </button>
        </form>
      ) : (
        <div className={`card border-2 transition-colors duration-300 space-y-4 ${
          !operationStatus 
            ? 'border-gray-200 bg-gray-50' 
            : operationStatus.status === 'COMPLETED' && operationStatus.failedCount === 0
              ? 'border-emerald-200 bg-emerald-50/80'
              : operationStatus.status === 'FAILED' || (operationStatus.status === 'COMPLETED' && operationStatus.failedCount === operationStatus.totalRecipients)
                ? 'border-red-200 bg-red-50/80'
                : 'border-amber-200 bg-amber-50/80'
        }`}>
          <div className="flex items-center gap-3">
            {!operationStatus || operationStatus.status === 'QUEUED' || operationStatus.status === 'PROCESSING' ? (
              <RefreshCw size={24} className="text-primary-600 animate-spin flex-shrink-0" />
            ) : operationStatus.status === 'COMPLETED' && operationStatus.failedCount === 0 ? (
              <CheckCircle2 size={24} className="text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle size={24} className="text-red-500 flex-shrink-0" />
            )}
            <div>
              <h3 className={`font-semibold text-base ${
                !operationStatus 
                  ? 'text-gray-800' 
                  : operationStatus.status === 'COMPLETED' && operationStatus.failedCount === 0
                    ? 'text-emerald-800'
                    : operationStatus.status === 'FAILED'
                      ? 'text-red-800'
                      : 'text-amber-800'
              }`}>
                {!operationStatus 
                  ? 'Initializing Bulk Operation...' 
                  : operationStatus.status === 'QUEUED'
                    ? 'Queued for Dispatch'
                    : operationStatus.status === 'PROCESSING'
                      ? 'Sending in Progress...'
                      : operationStatus.status === 'COMPLETED' && operationStatus.failedCount === 0
                        ? 'All Messages Sent Successfully!'
                        : 'Bulk Sending Completed with Errors'}
              </h3>
              {/* <p className="text-xs text-gray-500 font-medium">Operation ID: <code className="font-mono bg-white/45 px-1.5 py-0.5 rounded text-[11px]">{result.bulkOperationId}</code></p> */}
            </div>
          </div>

          {operationStatus && (
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-white/50 rounded-lg p-2.5 shadow-sm">
                <p className="text-[9px] uppercase font-bold text-gray-400">Total</p>
                <p className="text-sm font-extrabold text-gray-700">{operationStatus.totalRecipients}</p>
              </div>
              <div className="bg-white/50 rounded-lg p-2.5 shadow-sm">
                <p className="text-[9px] uppercase font-bold text-emerald-500">Sent</p>
                <p className="text-sm font-extrabold text-emerald-600">{operationStatus.sentCount}</p>
              </div>
              <div className="bg-white/50 rounded-lg p-2.5 shadow-sm">
                <p className="text-[9px] uppercase font-bold text-red-400">Failed</p>
                <p className="text-sm font-extrabold text-red-500">{operationStatus.failedCount}</p>
              </div>
              <div className="bg-white/50 rounded-lg p-2.5 shadow-sm">
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
              <div className="flex justify-between text-[10px] text-gray-400 font-semibold px-0.5 animate-pulse">
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

          <div className="pt-2 flex gap-3">
            <a href={`/${citySlug}/operator/logs`} className="btn-primary flex-1 text-center py-2 text-sm justify-center flex items-center">
              View My Logs
            </a>
            <button 
              className="btn-secondary flex-1 py-2 text-sm" 
              onClick={() => { setResult(null); setName(''); setPdfFile(null); setCsvFile(null); setPreview(null); }}
            >
              New Operation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
