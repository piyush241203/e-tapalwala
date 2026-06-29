'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '@/lib/api';
import { PageLoader } from '@/components/ui/Spinner';

const COLORS = ['#22c55e','#3b82f6','#ef4444','#f59e0b','#8b5cf6','#06b6d4'];

export default function CityAdminReportsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['city-reports', startDate, endDate],
    queryFn: () => api.get('/city-admin/reports', { params: { startDate, endDate } }).then(r => r.data),
  });

  const byStatus = (data?.byStatus || []).map((i: any) => ({ name: i.status, value: i._count.status }));
  const byChannel = (data?.byChannel || []).map((i: any) => ({ name: i.channel, value: i._count.channel }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="page-header mb-0">
          <h1 className="page-title">City Reports</h1>
          <p className="page-subtitle">Message statistics for your city</p>
        </div>
        <div className="flex gap-2 items-end flex-wrap">
          <div>
            <label className="label">From</label>
            <input type="date" className="input w-36" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="label">To</label>
            <input type="date" className="input w-36" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={() => refetch()}>Apply</button>
        </div>
      </div>

      {/* Total */}
      {data && (
        <div className="card inline-block">
          <p className="text-3xl font-bold text-primary-700">{data.total || 0}</p>
          <p className="text-sm text-gray-500 mt-0.5">Total messages in period</p>
        </div>
      )}

      {isLoading ? <PageLoader /> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">By Status</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={byStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {byStatus.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend iconType="circle" iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">By Channel</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byChannel} barSize={40}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" name="Messages" fill="#16a34a" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
