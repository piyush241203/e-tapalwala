'use client';

import { Bell, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { SidebarToggle } from '@/components/layout/Sidebar';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await qc.invalidateQueries();
    setTimeout(() => setRefreshing(false), 800);
  };

  const dateStr = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date());

  const initial = user?.fullName?.charAt(0).toUpperCase() ?? '?';

  return (
    <header className="topbar">
      {/* Left — hamburger + date */}
      <div className="flex items-center gap-3">
        {onMenuClick && <SidebarToggle onClick={onMenuClick} />}
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-gray-400 font-medium">{dateStr}</span>
        </div>
      </div>

      {/* Right — refresh + bell + avatar */}
      <div className="flex items-center gap-2">
        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          title="Refresh data"
          className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>

        {/* Notifications bell */}
        <button className="relative p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200">
          <Bell size={17} />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* User avatar + info */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center shadow-sm">
            <span className="text-xs font-bold text-white">{initial}</span>
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-semibold text-gray-800 leading-tight">{user?.fullName}</p>
            <p className="text-[11px] text-gray-400 leading-tight">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
