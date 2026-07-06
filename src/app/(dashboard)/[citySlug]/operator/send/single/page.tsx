'use client';

import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Upload, Send, FileText, CheckCircle2, Loader2, X, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MetaSandboxNotice } from '@/components/ui/MetaSandboxNotice';

export default function SingleSendPage() {
  const [mobile, setMobile] = useState('');
  const [channel, setChannel] = useState('WHATSAPP');
  const [provider, setProvider] = useState('META');
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      formData.append('pdf', file!);
      formData.append('recipientMobile', mobile);
      formData.append('channel', channel);
      formData.append('provider', provider);
      if (body) formData.append('body', body);
      return api.post('/operator/send/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: (res) => {
      setResult(res.data);
      toast.success('Message queued successfully!');
      setFile(null);
      setMobile('');
      setBody('');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.error('Please select a PDF file'); return; }
    if (!mobile || mobile.length < 10) { toast.error('Enter a valid mobile number'); return; }
    mutation.mutate();
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="page-header">
        <h1 className="page-title">Single Message</h1>
        <p className="page-subtitle">Send a PDF document to a single recipient</p>
      </div>

      {/* <MetaSandboxNotice /> */}

      <form onSubmit={handleSend} className="space-y-5">
        {/* File Upload */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">1. Upload PDF Document</h3>
          {!file ? (
            <div
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={28} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-medium text-gray-600">Click to upload PDF</p>
              <p className="text-xs text-gray-400 mt-1">Max 10MB · PDF only</p>
              <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden"
                onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-xl border border-primary-100">
              <FileText size={20} className="text-primary-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={URL.createObjectURL(file)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-gray-400 hover:text-primary-600 rounded hover:bg-white border border-transparent hover:border-gray-200 transition-all"
                  title="View PDF"
                >
                  <Eye size={16} />
                </a>
                <button type="button" onClick={() => setFile(null)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-white border border-transparent hover:border-gray-200 transition-all">
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recipient */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">2. Recipient Details</h3>
          <div className="form-group">
            <label className="label">Mobile Number *</label>
            <input
              className="input"
              placeholder="+919876543210"
              value={mobile}
              onChange={e => setMobile(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="label">Message / Caption (optional)</label>
            <textarea
              className="input resize-none h-20"
              placeholder="Add a custom message or caption for the document..."
              value={body}
              onChange={e => setBody(e.target.value)}
            />
          </div>
        </div>

        {/* Channel */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">3. Select Channel & Provider</h3>
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
        </div>

        {/* Send */}
        <button type="submit" className="btn-primary w-full py-3 text-base" disabled={mutation.isPending}>
          {mutation.isPending
            ? <><Loader2 size={18} className="animate-spin" /> Sending...</>
            : <><Send size={18} /> Send Document</>}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className="card border-green-200 bg-green-50">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 size={20} className="text-green-600" />
            <h3 className="text-sm font-semibold text-green-800">Message Queued</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
            <div><span className="text-green-500">Message ID:</span> <code className="bg-white/60 px-1 rounded">{result.messageLogId?.slice(0, 12)}…</code></div>
            <div><span className="text-green-500">Document ID:</span> <code className="bg-white/60 px-1 rounded">{result.documentId?.slice(0, 12)}…</code></div>
          </div>
          <p className="text-xs text-green-600 mt-2">Check "My Logs" for delivery status updates.</p>
        </div>
      )}
    </div>
  );
}
