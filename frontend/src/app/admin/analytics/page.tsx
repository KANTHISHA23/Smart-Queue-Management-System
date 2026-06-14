'use client';

/**
 * Admin Analytics Page
 * Charts and statistics for queue performance
 */
import React, { useState, useEffect } from 'react';
import { analyticsService } from '@/services/analytics.service';
import { BarChart3, TrendingUp, Clock, Users } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [waitTimes, setWaitTimes] = useState<any[]>([]);
  const [hourlyStats, setHourlyStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [dailyRes, waitRes, hourlyRes] = await Promise.all([
          analyticsService.getDaily(7),
          analyticsService.getWaitTimes(),
          analyticsService.getHourly(),
        ]);
        setDailyStats(dailyRes.data.data);
        setWaitTimes(waitRes.data.data);
        setHourlyStats(hourlyRes.data.data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="skeleton h-8 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-64" />)}
        </div>
      </div>
    );
  }

  const maxDaily = Math.max(...dailyStats.map(d => Number(d.total)), 1);
  const maxHourly = Math.max(...hourlyStats.map(h => Number(h.count)), 1);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--secondary)]">Analytics</h1>
        <p className="text-sm text-[var(--text-muted)]">Queue performance insights and trends</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Token Chart */}
        <div className="card-static">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={20} className="text-[var(--primary)]" />
            <h2 className="font-bold text-[var(--secondary)]">Daily Tokens (Last 7 Days)</h2>
          </div>
          <div className="h-48 flex items-end justify-between gap-2">
            {dailyStats.map((day, i) => {
              const height = (Number(day.total) / maxDaily) * 100;
              const date = new Date(day.date);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-[var(--secondary)]">{day.total}</span>
                  <div
                    className="w-full bg-gradient-to-t from-[#4F6AF6] to-[#7B93FF] rounded-t-lg transition-all duration-500 min-h-[4px]"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {date.toLocaleDateString('en', { weekday: 'short' })}
                  </span>
                </div>
              );
            })}
            {dailyStats.length === 0 && (
              <p className="text-sm text-[var(--text-muted)] mx-auto">No data available</p>
            )}
          </div>
        </div>

        {/* Hourly Distribution */}
        <div className="card-static">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} className="text-[var(--primary)]" />
            <h2 className="font-bold text-[var(--secondary)]">Today&apos;s Hourly Distribution</h2>
          </div>
          <div className="h-48 flex items-end justify-between gap-1">
            {Array.from({ length: 12 }, (_, i) => i + 8).map(hour => {
              const data = hourlyStats.find(h => Number(h.hour) === hour);
              const count = data ? Number(data.count) : 0;
              const height = (count / maxHourly) * 100;
              return (
                <div key={hour} className="flex-1 flex flex-col items-center gap-1">
                  {count > 0 && <span className="text-[10px] font-bold text-[var(--secondary)]">{count}</span>}
                  <div
                    className="w-full bg-gradient-to-t from-green-500 to-green-300 rounded-t-lg transition-all duration-500 min-h-[2px]"
                    style={{ height: `${Math.max(count > 0 ? height : 2, 2)}%` }}
                  />
                  <span className="text-[10px] text-[var(--text-muted)]">{hour}h</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wait Time by Queue */}
        <div className="card-static lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-[var(--primary)]" />
            <h2 className="font-bold text-[var(--secondary)]">Average Wait Times by Queue</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th className="pb-3 font-semibold text-[var(--text-secondary)]">Queue</th>
                  <th className="pb-3 font-semibold text-[var(--text-secondary)]">Location</th>
                  <th className="pb-3 font-semibold text-[var(--text-secondary)] text-right">Tokens</th>
                  <th className="pb-3 font-semibold text-[var(--text-secondary)] text-right">Avg Wait</th>
                  <th className="pb-3 font-semibold text-[var(--text-secondary)] text-right">Avg Service</th>
                  <th className="pb-3 font-semibold text-[var(--text-secondary)] text-right">Max Wait</th>
                </tr>
              </thead>
              <tbody>
                {waitTimes.map((q, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 font-medium text-[var(--secondary)]">{q.queue_name}</td>
                    <td className="py-3 text-[var(--text-muted)]">{q.location_name}</td>
                    <td className="py-3 text-right font-semibold text-[var(--primary)]">{q.total_tokens}</td>
                    <td className="py-3 text-right">
                      <span className="badge badge-waiting">{q.avg_wait_time} min</span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="badge badge-active">{q.avg_service_time} min</span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="badge badge-cancelled">{Math.round(q.max_wait_time)} min</span>
                    </td>
                  </tr>
                ))}
                {waitTimes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-[var(--text-muted)]">No data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
