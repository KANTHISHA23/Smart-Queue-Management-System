'use client';

/**
 * Admin Dashboard Page
 * Overview stats, busiest queues, and recent activity
 */
import React, { useState, useEffect } from 'react';
import { analyticsService } from '@/services/analytics.service';
import { useSocket } from '@/context/SocketContext';
import {
  Users, Ticket, Clock, CheckCircle2, XCircle, AlertTriangle,
  TrendingUp, Activity, BarChart3, Timer, Brain
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { socket } = useSocket();

  const fetchStats = async () => {
    try {
      const res = await analyticsService.getDashboard();
      setStats(res.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Real-time refresh
  useEffect(() => {
    if (!socket) return;
    socket.on('queue-update', fetchStats);
    socket.on('token-called', fetchStats);
    return () => {
      socket.off('queue-update', fetchStats);
      socket.off('token-called', fetchStats);
    };
  }, [socket]);

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="skeleton h-8 w-48 mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-28" />)}
        </div>
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  const today = stats?.today || {};
  const statCards = [
    { label: 'Total Tokens Today', value: today.total_tokens_today || 0, icon: <Ticket size={22} />, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
    { label: 'Completed', value: today.completed_today || 0, icon: <CheckCircle2 size={22} />, color: 'from-green-500 to-green-600', bg: 'bg-green-50' },
    { label: 'Currently Waiting', value: today.waiting_now || 0, icon: <Users size={22} />, color: 'from-orange-500 to-orange-600', bg: 'bg-orange-50' },
    { label: 'Avg Wait Time', value: `${today.avg_wait_time || 0} min`, icon: <Timer size={22} />, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50' },
  ];

  const secondaryStats = [
    { label: 'Active Queues', value: stats?.activeQueues || 0, icon: <Activity size={18} /> },
    { label: 'Total Locations', value: stats?.totalLocations || 0, icon: <BarChart3 size={18} /> },
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: <Users size={18} /> },
    { label: 'Now Serving', value: today.serving_now || 0, icon: <TrendingUp size={18} /> },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--secondary)]">Admin Dashboard</h1>
          <p className="text-sm text-[var(--text-muted)]">Real-time overview of all queues</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          Live
        </div>
      </div>

      {/* Main Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, i) => (
          <div key={i} className="card-static">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <span className={`bg-gradient-to-br ${stat.color} text-transparent bg-clip-text`}>{stat.icon}</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-[var(--secondary)]">{stat.value}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {secondaryStats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3">
            <span className="text-[var(--primary)]">{stat.icon}</span>
            <div>
              <p className="text-lg font-bold text-[var(--secondary)]">{stat.value}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Busiest Queues */}
        <div className="card-static">
          <h2 className="text-lg font-bold text-[var(--secondary)] mb-4">Busiest Queues Today</h2>
          <div className="space-y-3">
            {stats?.busiestQueues?.map((q: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-semibold text-sm text-[var(--secondary)]">{q.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{q.location_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[var(--primary)]">{q.token_count}</p>
                  <p className="text-xs text-[var(--text-muted)]">{q.waiting_count} waiting</p>
                </div>
              </div>
            ))}
            {(!stats?.busiestQueues || stats.busiestQueues.length === 0) && (
              <p className="text-sm text-[var(--text-muted)] text-center py-4">No queue data available</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card-static">
          <h2 className="text-lg font-bold text-[var(--secondary)] mb-4">Recent Activity</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {stats?.recentActivity?.map((activity: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                <span className={`badge text-[10px] ${
                  activity.status === 'completed' ? 'badge-completed' :
                  activity.status === 'waiting' ? 'badge-waiting' :
                  activity.status === 'called' ? 'badge-called' :
                  activity.status === 'cancelled' ? 'badge-cancelled' : 'badge-waiting'
                }`}>
                  {activity.status}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--secondary)] truncate">
                    {activity.token_number} — {activity.user_name}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">{activity.queue_name}</p>
                </div>
                <span className="text-xs text-[var(--text-muted)] flex-shrink-0">
                  {format(new Date(activity.booked_at), 'HH:mm')}
                </span>
              </div>
            ))}
            {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
              <p className="text-sm text-[var(--text-muted)] text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <Link href="/admin/queues" className="card group flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <Activity size={20} className="text-blue-600" />
          </div>
          <span className="font-semibold text-sm text-[var(--secondary)]">Manage Queues</span>
        </Link>
        <Link href="/admin/locations" className="card group flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
            <TrendingUp size={20} className="text-green-600" />
          </div>
          <span className="font-semibold text-sm text-[var(--secondary)]">Manage Locations</span>
        </Link>
        <Link href="/admin/ml-insights" className="card group flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
            <Brain size={20} className="text-indigo-600" />
          </div>
          <span className="font-semibold text-sm text-[var(--secondary)]">Model Overview</span>
        </Link>
      </div>
    </div>
  );
}
