'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore, Role } from '@/store/auth.store';
import {
  LayoutDashboard, Building2, Users, MessageSquare, Settings,
  FileText, BarChart3, Shield, LogOut, ChevronRight, Zap,
  Send, ClipboardList, AlertCircle, Globe, X, Menu,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const platformAdminNav: NavItem[] = [
  { label: 'Overview',     href: '/super-admin/dashboard',   icon: <LayoutDashboard size={18} /> },
  { label: 'Cities',       href: '/super-admin/cities',       icon: <Globe size={18} /> },
  { label: 'Offices',      href: '/super-admin/offices',      icon: <Building2 size={18} /> },
  { label: 'Office Admins',href: '/super-admin/city-admins',  icon: <Users size={18} /> },
  { label: 'Message Logs', href: '/super-admin/logs',         icon: <MessageSquare size={18} /> },
  { label: 'Audit Logs',   href: '/super-admin/audit-logs',   icon: <Shield size={18} /> },
  { label: 'Reports',      href: '/super-admin/reports',      icon: <BarChart3 size={18} /> },
  { label: 'API Settings', href: '/super-admin/settings',     icon: <Settings size={18} /> },
];

const roleLabels: Record<Role, string> = {
  PLATFORM_ADMIN: 'Platform Admin',
  CITY_ADMIN:     'City Admin',
  OPERATOR:       'Operator',
  Admin:          'City Admin',
  Clerk:          'Clerk',
  Superintendent: 'Superintendent',
  Officer:        'Officer',
};

const roleBadgeStyle: Record<Role, string> = {
  PLATFORM_ADMIN: 'bg-slate-100 text-slate-700',
  CITY_ADMIN:     'bg-emerald-100 text-emerald-700',
  OPERATOR:       'bg-teal-100 text-teal-700',
  Admin:          'bg-emerald-100 text-emerald-700',
  Clerk:          'bg-teal-100 text-teal-700',
  Superintendent: 'bg-teal-100 text-teal-700',
  Officer:        'bg-teal-100 text-teal-700',
};

const roleAvatarStyle: Record<Role, string> = {
  PLATFORM_ADMIN: 'bg-slate-700 text-white',
  CITY_ADMIN:     'bg-gradient-to-br from-emerald-500 to-green-700 text-white',
  OPERATOR:       'bg-gradient-to-br from-teal-500 to-cyan-700 text-white',
  Admin:          'bg-gradient-to-br from-emerald-500 to-green-700 text-white',
  Clerk:          'bg-gradient-to-br from-teal-500 to-cyan-700 text-white',
  Superintendent: 'bg-gradient-to-br from-teal-500 to-cyan-700 text-white',
  Officer:        'bg-gradient-to-br from-teal-500 to-cyan-700 text-white',
};

const roleLogoutPath: Record<Role, string> = {
  PLATFORM_ADMIN: '/admin/platform-login',
  CITY_ADMIN:     '/login',
  OPERATOR:       '/login',
  Admin:          '/login',
  Clerk:          '/login',
  Superintendent: '/login',
  Officer:        '/login',
};

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, clearAuth } = useAuthStore();

  if (!user) return null;

  const isCityAdmin = user.role === 'CITY_ADMIN' || user.role === 'Admin';
  const isOperator = user.role === 'OPERATOR' || user.role === 'Clerk' || user.role === 'Superintendent' || user.role === 'Officer';

  const navItems: NavItem[] =
    user.role === 'PLATFORM_ADMIN'
      ? platformAdminNav
      : isCityAdmin
      ? [
          { label: 'Dashboard',     href: `/${user.citySlug}/dashboard`,  icon: <LayoutDashboard size={18} /> },
          { label: 'Departments',   href: `/${user.citySlug}/departments`,icon: <Building2 size={18} /> },
          { label: 'Operators',     href: `/${user.citySlug}/operators`,   icon: <Users size={18} /> },
          { label: 'Tapals (Letters)', href: `/${user.citySlug}/tapals`,   icon: <FileText size={18} /> },
          { label: 'Message Logs',  href: `/${user.citySlug}/messages`,    icon: <MessageSquare size={18} /> },
          { label: 'Reports',       href: `/${user.citySlug}/reports`,     icon: <BarChart3 size={18} /> },
        ]
      : [
          { label: 'Dashboard',   href: `/${user.citySlug}/operator/dashboard`,   icon: <LayoutDashboard size={18} /> },
          { label: 'Tapals (Letters)', href: `/${user.citySlug}/tapals`,        icon: <FileText size={18} /> },
          { label: 'Single Send', href: `/${user.citySlug}/operator/send/single`, icon: <Send size={18} /> },
          { label: 'Bulk Send',   href: `/${user.citySlug}/operator/send/bulk`,   icon: <Zap size={18} /> },
          { label: 'My Logs',     href: `/${user.citySlug}/operator/logs`,        icon: <ClipboardList size={18} /> },
          { label: 'Retry Queue', href: `/${user.citySlug}/operator/retry`,       icon: <AlertCircle size={18} /> },
        ];

  const handleLogout = () => {
    const role = user.role;
    // Fire and forget backend logout
    api.post('/auth/logout').catch(() => {});
    clearAuth();
    router.push(roleLogoutPath[role] || '/login');
  };

  const initial = user.fullName.charAt(0).toUpperCase();

  const sidebarContent = (
    <aside className="sidebar-root">
      {/* Mobile close */}
      {onMobileClose && (
        <button
          onClick={onMobileClose}
          className="lg:hidden absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <X size={18} />
        </button>
      )}

      {/* Logo */}
      <div className="sidebar-logo">
        <div className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center shadow-sm',
          user.role === 'PLATFORM_ADMIN' ? 'bg-slate-800' : 'bg-gradient-to-br from-emerald-500 to-green-700'
        )}>
          {user.role === 'PLATFORM_ADMIN'
            ? <Globe size={17} className="text-white" />
            : <FileText size={17} className="text-white" />}
        </div>
        <div>
          <h1 className="text-sm font-bold text-gray-900 tracking-tight">E-Tapalwala</h1>
          <p className="text-[11px] text-gray-400 leading-tight">
            {user.role === 'PLATFORM_ADMIN' ? 'Platform Console' : 'Govt. Document Dispatch'}
          </p>
        </div>
      </div>

      {/* User profile card */}
      <div className="sidebar-user-card">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm flex-shrink-0', roleAvatarStyle[user.role])}>
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate leading-tight">{user.fullName}</p>
          <span className={cn('inline-block text-[11px] px-2 py-0.5 rounded-full font-medium mt-0.5', roleBadgeStyle[user.role])}>
            {roleLabels[user.role]}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        <p className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Navigation</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn('sidebar-nav-link', isActive && 'sidebar-nav-link--active')}
            >
              <span className={cn('sidebar-nav-icon', isActive && 'sidebar-nav-icon--active')}>
                {item.icon}
              </span>
              <span className="flex-1 text-sm">{item.label}</span>
              {isActive && <ChevronRight size={13} className="text-primary-500 flex-shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="sidebar-nav-link w-full text-red-500 hover:!bg-red-50 hover:!text-red-600 group"
        >
          <span className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-400 group-hover:bg-red-100 transition-colors">
            <LogOut size={16} />
          </span>
          <span className="flex-1 text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <div className="relative w-64 flex-shrink-0 z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Standalone hamburger button used by Topbar ───────────────────────────────
export function SidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      aria-label="Open sidebar"
    >
      <Menu size={20} />
    </button>
  );
}
