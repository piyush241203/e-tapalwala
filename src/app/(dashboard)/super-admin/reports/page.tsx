'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import { PageLoader } from '@/components/ui/Spinner';
import { BarChart3 } from 'lucide-react';
import { useState } from 'react';

const COLORS = ['#22c55e','#3b82f6','#8b5cf6','#ef4444','#f59e0b','#06b6d4'];

export default function ReportsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['reports', startDate, endDate],
    queryFn: () => api.get('/super-admin/reports', { params: { startDate, endDate } }).then(r => r.data),
  });

  const byStatus = (data?.byStatus || []).map((i: any) => ({ name: i.status, value: i._count.status }));
  const byChannel = (data?.byChannel || []).map((i: any) => ({ name: i.channel, value: i._count.channel }));
  const byCity = (data?.byCity || []).map((i: any) => ({ name: i.cityName, value: i._count.cityId }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="page-header mb-0">
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Aggregate statistics across all cities and operators</p>
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
          <button className="btn-secondary" onClick={() => { setStartDate(''); setEndDate(''); }}>Clear</button>
        </div>
      </div>

      {isLoading ? <PageLoader /> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Status */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Messages by Status</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={byStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {byStatus.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* By Channel */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Messages by Channel</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={byChannel} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {byChannel.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* By City */}
          <div className="card lg:col-span-2">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Top Cities by Message Volume</h3>
            {byCity.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byCity} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Messages" fill="#16a34a" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No city data yet</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
