'use client';

/**
 * Provider Analytics — insights scoped to this organization's queues only.
 */
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { orgAnalyticsService } from '@/services/orgAnalytics.service';
import {
  BarChart3,
  ArrowLeft,
  Clock,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  Activity,
  Zap,
  AlertTriangle,
  ListChecks,
  RefreshCw,
} from 'lucide-react';

interface DashboardData {
  overview: {
    today: {
      total_tokens: number;
      completed: number;
      cancelled: number;
      active: number;
      avg_wait: number;
      avg_service: number;
    };
    queues: { total: number; active: number; pending: number; inactive: number };
    priority: { emergency: number; priority: number; normal: number };
  };
  busiest: Array<{
    id: number;
    queue_name: string;
    location_name: string;
    status: string;
    token_count: number;
    active_count: number;
  }>;
  recent: Array<{
    token_number: string;
    status: string;
    priority: string;
    queue_name: string;
    updated_at: string;
  }>;
  completion: {
    total: number;
    completed: number;
    cancelled: number;
    completionRate: number;
    cancellationRate: number;
  };
}

const STATUS_COLORS: Record<string, string> = {
  waiting: 'badge-waiting',
  called: 'badge-active',
  serving: 'badge-active',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled',
};

const PRIORITY_LABELS: Record<string, { label: string; className: string }> = {
  emergency: { label: 'Emergency', className: 'bg-red-100 text-red-700' },
  priority: { label: 'Priority', className: 'bg-emerald-100 text-emerald-700' },
  normal: { label: 'Normal', className: 'bg-gray-100 text-gray-600' },
};

function StatCard({
  icon: Icon,
  value,
  label,
  sub,
  accent,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon size={20} />
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[var(--secondary)] tabular-nums">{value}</p>
          <p className="text-xs font-medium text-[var(--text-muted)] mt-0.5">{label}</p>
        </div>
      </div>
      {sub && <p className="text-xs text-[var(--text-secondary)] mt-3 pt-3 border-t border-gray-50">{sub}</p>}
    </div>
  );
}

export default function OrgAnalyticsPage() {
  const { isOrganization, user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [waitTimes, setWaitTimes] = useState<any[]>([]);
  const [hourlyStats, setHourlyStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!isOrganization) return;
    if (silent) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const [dashRes, dailyRes, waitRes, hourlyRes] = await Promise.all([
        orgAnalyticsService.getDashboard(),
        orgAnalyticsService.getDaily(7),
        orgAnalyticsService.getWaitTimes(),
        orgAnalyticsService.getHourly(),
      ]);
      setDashboard(dashRes.data.data);
      setDailyStats(dailyRes.data.data);
      setWaitTimes(waitRes.data.data);
      setHourlyStats(hourlyRes.data.data);
    } catch (error) {
      console.error('Failed to fetch org analytics:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [isOrganization]);

  const maxDaily = useMemo(
    () => Math.max(...dailyStats.map((d) => Number(d.total)), 1),
    [dailyStats]
  );
  const maxHourly = useMemo(
    () => Math.max(...hourlyStats.map((h) => Number(h.count)), 1),
    [hourlyStats]
  );

  const priorityTotal = useMemo(() => {
    if (!dashboard) return 1;
    const { emergency, priority, normal } = dashboard.overview.priority;
    return Math.max(emergency + priority + normal, 1);
  }, [dashboard]);

  if (!isOrganization) {
    return (
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">
        <p className="text-[var(--text-secondary)]">Please sign in as an organization to view analytics.</p>
        <Link className="text-[var(--primary)] hover:underline" href="/org/login">
          Go to Provider Login
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-12">
        <div className="skeleton h-10 w-64 mb-2" />
        <div className="skeleton h-5 w-96 mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-72 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const today = dashboard?.overview.today;
  const queues = dashboard?.overview.queues;
  const priority = dashboard?.overview.priority;
  const completion = dashboard?.completion;

  return (
    <div className="max-w-6xl mx-auto px-4 pt-24 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4F6AF6] to-[#7B93FF] flex items-center justify-center shadow-lg shadow-indigo-200">
              <BarChart3 size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[var(--secondary)]">Analytics</h1>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                Performance insights for <span className="font-semibold">{user?.name}</span>&apos;s queues
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => load(true)}
            disabled={isRefreshing}
            className="px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-60"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link
            href="/org/queues"
            className="btn-primary !py-2.5 !px-4 flex items-center gap-2"
          >
            <ListChecks size={18} /> Manage Queues
          </Link>
          <Link
            href="/org/dashboard"
            className="px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <ArrowLeft size={18} /> Dashboard
          </Link>
        </div>
      </div>

      {/* Scope banner */}
      <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 flex items-center gap-3">
        <Activity size={20} className="text-indigo-600 flex-shrink-0" />
        <p className="text-sm text-indigo-900">
          All metrics below are scoped to your <strong>{queues?.total ?? 0} queues</strong> only — not system-wide data.
        </p>
      </div>

      {/* KPI row */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          value={today?.total_tokens ?? 0}
          label="Tokens Today"
          sub={`${today?.active ?? 0} currently in queue`}
          accent="bg-indigo-100 text-indigo-600"
        />
        <StatCard
          icon={CheckCircle2}
          value={today?.completed ?? 0}
          label="Completed Today"
          sub={`${completion?.completionRate ?? 0}% completion (7d)`}
          accent="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          icon={Clock}
          value={`${today?.avg_wait ?? 0}m`}
          label="Avg Wait Today"
          sub="Completed tokens only"
          accent="bg-amber-100 text-amber-600"
        />
        <StatCard
          icon={Zap}
          value={`${today?.avg_service ?? 0}m`}
          label="Avg Service Time"
          sub={`${today?.cancelled ?? 0} cancelled today`}
          accent="bg-violet-100 text-violet-600"
        />
      </div>

      {/* Charts row */}
      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        {/* Daily tokens */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart3 size={20} className="text-[var(--primary)]" />
              <h2 className="font-bold text-[var(--secondary)]">Daily Volume</h2>
            </div>
            <span className="text-xs font-medium text-[var(--text-muted)] bg-gray-50 px-2.5 py-1 rounded-lg">
              Last 7 days
            </span>
          </div>
          <div className="h-52 flex items-end justify-between gap-2 px-1">
            {dailyStats.map((day, i) => {
              const total = Number(day.total);
              const height = (total / maxDaily) * 100;
              const date = new Date(day.date);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <span className="text-xs font-bold text-[var(--secondary)] opacity-0 group-hover:opacity-100 transition-opacity">
                    {total}
                  </span>
                  <div
                    className="w-full bg-gradient-to-t from-[#4F6AF6] to-[#7B93FF] rounded-t-lg transition-all duration-500 min-h-[6px] group-hover:opacity-90"
                    style={{ height: `${Math.max(height, total > 0 ? 8 : 4)}%` }}
                    title={`${total} tokens (${day.completed} completed)`}
                  />
                  <span className="text-[10px] text-[var(--text-muted)] font-medium">
                    {date.toLocaleDateString('en', { weekday: 'short' })}
                  </span>
                </div>
              );
            })}
            {dailyStats.length === 0 && (
              <p className="text-sm text-[var(--text-muted)] mx-auto self-center">No token data yet</p>
            )}
          </div>
          {dailyStats.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-50 flex gap-4 text-xs text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-gradient-to-t from-[#4F6AF6] to-[#7B93FF]" />
                Total tokens issued
              </span>
            </div>
          )}
        </div>

        {/* Hourly distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-[var(--primary)]" />
              <h2 className="font-bold text-[var(--secondary)]">Today&apos;s Traffic</h2>
            </div>
            <span className="text-xs font-medium text-[var(--text-muted)] bg-gray-50 px-2.5 py-1 rounded-lg">
              By hour
            </span>
          </div>
          <div className="h-52 flex items-end justify-between gap-0.5 px-1">
            {Array.from({ length: 24 }, (_, i) => i).map((hour) => {
              const data = hourlyStats.find((h) => Number(h.hour) === hour);
              const count = data ? Number(data.count) : 0;
              const height = (count / maxHourly) * 100;
              const showLabel = hour % 3 === 0;
              return (
                <div key={hour} className="flex-1 flex flex-col items-center gap-1 group min-w-0">
                  {count > 0 && (
                    <span className="text-[9px] font-bold text-[var(--secondary)] hidden group-hover:block">
                      {count}
                    </span>
                  )}
                  <div
                    className={`w-full rounded-t transition-all duration-500 min-h-[2px] ${
                      count > 0
                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                        : 'bg-gray-100'
                    }`}
                    style={{ height: `${Math.max(count > 0 ? height : 4, 4)}%` }}
                    title={`${hour}:00 — ${count} tokens`}
                  />
                  {showLabel && (
                    <span className="text-[9px] text-[var(--text-muted)]">{hour}h</span>
                  )}
                </div>
              );
            })}
          </div>
          {hourlyStats.length === 0 && (
            <p className="text-sm text-[var(--text-muted)] text-center mt-4">No tokens issued today yet</p>
          )}
        </div>
      </div>

      {/* Second row: priority + busiest + completion */}
      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        {/* Priority breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle size={20} className="text-amber-500" />
            <h2 className="font-bold text-[var(--secondary)]">Priority Mix Today</h2>
          </div>
          <div className="space-y-4">
            {[
              { key: 'emergency', count: priority?.emergency ?? 0, color: 'bg-red-500' },
              { key: 'priority', count: priority?.priority ?? 0, color: 'bg-emerald-500' },
              { key: 'normal', count: priority?.normal ?? 0, color: 'bg-gray-300' },
            ].map(({ key, count, color }) => {
              const pct = Math.round((count / priorityTotal) * 100);
              const meta = PRIORITY_LABELS[key] ?? PRIORITY_LABELS.normal;
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${meta.className}`}>
                      {meta.label}
                    </span>
                    <span className="font-bold text-[var(--secondary)] tabular-nums">
                      {count} <span className="text-[var(--text-muted)] font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Busiest queues */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={20} className="text-[var(--primary)]" />
            <h2 className="font-bold text-[var(--secondary)]">Busiest Queues Today</h2>
          </div>
          {dashboard?.busiest && dashboard.busiest.length > 0 ? (
            <div className="space-y-3">
              {dashboard.busiest.map((q, i) => {
                const maxCount = Math.max(...dashboard.busiest.map((b) => b.token_count), 1);
                const pct = Math.round((q.token_count / maxCount) * 100);
                return (
                  <div key={q.id} className="flex items-center gap-4">
                    <span className="w-6 text-sm font-bold text-[var(--text-muted)] tabular-nums">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-semibold text-[var(--secondary)] truncate">{q.queue_name}</p>
                        <span className="text-sm font-bold text-[var(--primary)] tabular-nums flex-shrink-0">
                          {q.token_count} tokens
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#4F6AF6] to-[#7B93FF] rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0">
                          {q.active_count} active · {q.location_name}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">No queue activity today</p>
          )}
        </div>
      </div>

      {/* Wait times table */}
      <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-[var(--primary)]" />
            <h2 className="font-bold text-[var(--secondary)]">Wait & Service Times by Queue</h2>
          </div>
          <span className="text-xs text-[var(--text-muted)]">Last 30 days</span>
        </div>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-100">
                <th className="pb-3 pl-2 font-semibold text-[var(--text-secondary)]">Queue</th>
                <th className="pb-3 font-semibold text-[var(--text-secondary)]">Location</th>
                <th className="pb-3 font-semibold text-[var(--text-secondary)]">Status</th>
                <th className="pb-3 font-semibold text-[var(--text-secondary)] text-right">Tokens</th>
                <th className="pb-3 font-semibold text-[var(--text-secondary)] text-right">Avg Wait</th>
                <th className="pb-3 font-semibold text-[var(--text-secondary)] text-right">Avg Service</th>
                <th className="pb-3 pr-2 font-semibold text-[var(--text-secondary)] text-right">Max Wait</th>
              </tr>
            </thead>
            <tbody>
              {waitTimes.map((q, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                  <td className="py-3.5 pl-2 font-medium text-[var(--secondary)]">{q.queue_name}</td>
                  <td className="py-3.5 text-[var(--text-muted)]">{q.location_name}</td>
                  <td className="py-3.5">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-md capitalize ${
                        q.queue_status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : q.queue_status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {q.queue_status}
                    </span>
                  </td>
                  <td className="py-3.5 text-right font-semibold text-[var(--primary)] tabular-nums">
                    {q.total_tokens}
                  </td>
                  <td className="py-3.5 text-right">
                    <span className="badge badge-waiting">{q.avg_wait_time} min</span>
                  </td>
                  <td className="py-3.5 text-right">
                    <span className="badge badge-active">{q.avg_service_time} min</span>
                  </td>
                  <td className="py-3.5 pr-2 text-right">
                    <span className="badge badge-cancelled">{Math.round(q.max_wait_time)} min</span>
                  </td>
                </tr>
              ))}
              {waitTimes.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-[var(--text-muted)]">
                    No queue data yet — create a queue and start serving tokens.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom row: recent activity + queue health */}
      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Activity size={20} className="text-[var(--primary)]" />
            <h2 className="font-bold text-[var(--secondary)]">Recent Activity</h2>
          </div>
          {dashboard?.recent && dashboard.recent.length > 0 ? (
            <ul className="divide-y divide-gray-50">
              {dashboard.recent.map((item, i) => {
                const pri = PRIORITY_LABELS[item.priority] ?? PRIORITY_LABELS.normal;
                return (
                  <li key={i} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--secondary)]">
                        {item.token_number}
                        <span className="text-[var(--text-muted)] font-normal ml-2 text-sm">
                          {item.queue_name}
                        </span>
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {new Date(item.updated_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.priority !== 'normal' && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${pri.className}`}>
                          {pri.label}
                        </span>
                      )}
                      <span className={`badge capitalize ${STATUS_COLORS[item.status] ?? ''}`}>
                        {item.status}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">No recent token activity</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <ListChecks size={20} className="text-[var(--primary)]" />
            <h2 className="font-bold text-[var(--secondary)]">Queue Health</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
              <p className="text-3xl font-bold text-emerald-700 tabular-nums">{queues?.active ?? 0}</p>
              <p className="text-xs font-medium text-emerald-600 mt-1">Active</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-center">
              <p className="text-3xl font-bold text-amber-700 tabular-nums">{queues?.pending ?? 0}</p>
              <p className="text-xs font-medium text-amber-600 mt-1">Pending</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-center">
              <p className="text-3xl font-bold text-gray-600 tabular-nums">{queues?.inactive ?? 0}</p>
              <p className="text-xs font-medium text-gray-500 mt-1">Inactive</p>
            </div>
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-center">
              <p className="text-3xl font-bold text-indigo-700 tabular-nums">{completion?.completionRate ?? 0}%</p>
              <p className="text-xs font-medium text-indigo-600 mt-1">7d Completion</p>
            </div>
          </div>
          <div className="mt-5 pt-5 border-t border-gray-50 flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
              <XCircle size={16} className="text-red-400" />
              {completion?.cancelled ?? 0} cancelled (7d)
            </span>
            <span className="text-[var(--text-muted)]">
              {completion?.cancellationRate ?? 0}% cancellation rate
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
