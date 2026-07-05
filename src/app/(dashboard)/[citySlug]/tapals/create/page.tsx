'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { FileUp, Inbox, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Link from 'next/link';
import { getErrorMessage } from '@/lib/utils';

export default function CreateTapalPage() {
  const router = useRouter();
  const { citySlug } = useParams();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    type: 'Inward',
    subject: '',
    organization: '',
    senderName: '',
    referenceLetterNo: '',
    receivedDate: new Date().toISOString().split('T')[0],
  });
  const [file, setFile] = useState<File | null>(null);

  const s = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const createMutation = useMutation({
    mutationFn: (formData: FormData) =>
      api.post('/tapals', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: () => {
      toast.success('New Tapal registered successfully');
      qc.invalidateQueries({ queryKey: ['tapals'] });
      router.push(`/${citySlug}/tapals`);
    },
    onError: err => toast.error(getErrorMessage(err)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('PDF file attachment is required');
      return;
    }

    const fd = new FormData();
    fd.append('pdf', file);
    fd.append('type', form.type);
    fd.append('subject', form.subject);
    if (form.organization) fd.append('organization', form.organization);
    if (form.senderName) fd.append('senderName', form.senderName);
    if (form.referenceLetterNo) fd.append('referenceLetterNo', form.referenceLetterNo);
    if (form.receivedDate) fd.append('receivedDate', new Date(form.receivedDate).toISOString());

    createMutation.mutate(fd);
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl mx-auto">
      {/* Back button */}
      <Link href={`/${citySlug}/tapals`} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 font-semibold self-start transition-colors">
        <ArrowLeft size={14} /> Back to list
      </Link>

      {/* Header */}
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Inbox size={22} className="text-primary-600" />
          <span>New Tapal Entry</span>
        </h1>
        <p className="page-subtitle">Register a physical inward/outward letter or internal file to begin desk workflow tracking</p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-group mb-0">
            <label className="label">Type of Tapal *</label>
            <select className="select input w-full" value={form.type} onChange={e => s('type', e.target.value)}>
              <option value="Inward">Inward (From outside agency/citizen)</option>
              <option value="Outward">Outward (Leaving office to citizen/agency)</option>
              <option value="Internal">Internal (Moving between collector desks)</option>
            </select>
          </div>
          <div className="form-group mb-0">
            <label className="label">Received Date</label>
            <input className="input" type="date" value={form.receivedDate} onChange={e => s('receivedDate', e.target.value)} />
          </div>
        </div>

        <div className="form-group mb-0">
          <label className="label">Subject/Topic of Letter *</label>
          <input className="input" value={form.subject} onChange={e => s('subject', e.target.value)} placeholder="e.g. Request for sand mining lease license extension" required />
        </div>

        {/* Sender details (only really makes sense for Inward / Outward) */}
        <div className="border-t border-gray-100 pt-4 space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
            <Sparkles size={12} className="text-primary-500" />
            Sender & Reference Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group mb-0">
              <label className="label">Sender Organization/Office</label>
              <input className="input" value={form.organization} onChange={e => s('organization', e.target.value)} placeholder="e.g. Zilla Parishad Nanded" />
            </div>
            <div className="form-group mb-0">
              <label className="label">Sender Name</label>
              <input className="input" value={form.senderName} onChange={e => s('senderName', e.target.value)} placeholder="e.g. Ramesh Kumar (Deputy Clerk)" />
            </div>
          </div>
          <div className="form-group mb-0">
            <label className="label">Reference Physical Letter/File Number</label>
            <input className="input font-mono" value={form.referenceLetterNo} onChange={e => s('referenceLetterNo', e.target.value)} placeholder="e.g. COLL-NDD-REV-2026-X12" />
          </div>
        </div>

        {/* File attachment */}
        <div className="border-t border-gray-100 pt-4">
          <label className="label">Upload Scanned Document (PDF only) *</label>
          <div className={`mt-1 border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-colors cursor-pointer ${file ? 'border-emerald-300 bg-emerald-50/20' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50/50'}`}>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              id="pdf-upload"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) setFile(f);
              }}
            />
            <label htmlFor="pdf-upload" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
              <FileUp className={`w-8 h-8 mb-2 ${file ? 'text-emerald-500' : 'text-gray-400'}`} />
              {file ? (
                <div className="text-center">
                  <p className="text-sm font-semibold text-emerald-800">{file.name}</p>
                  <p className="text-xs text-emerald-600/80">{(file.size / 1024 / 1024).toFixed(2)} MB • PDF file selected</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700">Click to choose or drop PDF file</p>
                  <p className="text-xs text-gray-400">PDF documents only (Max size 10MB)</p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Action Button */}
        <button type="submit" className="btn-primary w-full mt-3 flex items-center justify-center gap-2" disabled={createMutation.isPending}>
          {createMutation.isPending ? (
            <><Loader2 className="animate-spin" size={16} /> Uploading & Registering Tapal…</>
          ) : (
            'Register and Keep at My Desk'
          )}
        </button>
      </form>
    </div>
  );
}
