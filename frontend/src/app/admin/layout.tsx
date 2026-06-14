'use client';

/**
 * Admin Layout
 * Provides sidebar navigation for admin pages
 */
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, MapPin, Radio, BarChart3, ArrowLeft, MessageSquare, Brain } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen pt-24 flex items-center justify-center"><div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 text-[var(--secondary)]">Access Denied</h2>
          <p className="text-[var(--text-secondary)] mb-4">You need admin privileges to access this page.</p>
          <Link href="/dashboard" className="btn-primary">Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard', exact: true },
    { href: '/admin/locations', icon: <MapPin size={20} />, label: 'Locations' },
    { href: '/admin/queues', icon: <Radio size={20} />, label: 'Queue Control' },
    { href: '/admin/analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
    { href: '/admin/ml-insights', icon: <Brain size={20} />, label: 'Model Overview' },
    { href: '/admin/queries', icon: <MessageSquare size={20} />, label: 'Queries' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-light)] pt-16">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] sticky top-16">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-[var(--secondary)]">Admin Panel</h2>
            <p className="text-xs text-[var(--text-muted)]">Queue Management</p>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map(item => {
              const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[var(--primary)] text-white shadow-md shadow-blue-200'
                      : 'text-[var(--text-secondary)] hover:bg-gray-50 hover:text-[var(--primary)]'
                  }`}
                >
                  {item.icon} {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-3 border-t border-gray-100">
            <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--primary)]">
              <ArrowLeft size={16} /> Back to User View
            </Link>
          </div>
        </aside>

        {/* Mobile Nav */}
        <div className="lg:hidden sticky top-16 z-30 bg-white border-b border-gray-200 w-full">
          <div className="flex overflow-x-auto gap-1 p-2">
            {navItems.map(item => {
              const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    isActive ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-secondary)] bg-gray-50'
                  }`}
                >
                  {item.icon} {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
