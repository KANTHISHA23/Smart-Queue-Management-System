'use client';

/**
 * Live Queue Tracking Page — Premium redesign with real-time socket updates
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { queueService } from '@/services/queue.service';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft, Users, Timer, CheckCircle2, Clock, Radio,
  AlertTriangle, Crown, RefreshCw, Zap, Building2, TrendingUp
} from 'lucide-react';

export default function QueueTrackingPage() {
  const params = useParams();
  const { socket, joinQueue, leaveQueue } = useSocket();
  const { user } = useAuth();
  const [queue, setQueue] = useState<any>(null);
  const [tokens, setTokens] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const queueId = Number(params.id);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await queueService.getById(queueId);
      setQueue(res.data.data.queue);
      setTokens(res.data.data.tokens);
      setStats(res.data.data.stats);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch queue:', error);
    } finally {
      setIsLoading(false);
    }
  }, [queueId]);

  useEffect(() => {
    fetchQueue();
    joinQueue(queueId);
    return () => { leaveQueue(queueId); };
  }, [fetchQueue, joinQueue, leaveQueue, queueId]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchQueue();
    socket.on('queue-update', handleUpdate);
    socket.on('token-called', handleUpdate);
    socket.on('queue_reordered', handleUpdate);
    socket.on('waiting_time_updated', handleUpdate);
    return () => {
      socket.off('queue-update', handleUpdate);
      socket.off('token-called', handleUpdate);
      socket.off('queue_reordered', handleUpdate);
      socket.off('waiting_time_updated', handleUpdate);
    };
  }, [socket, fetchQueue]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'serving': return { bg: 'bg-gradient-to-r from-emerald-500 to-teal-600', text: 'text-white', dot: 'bg-emerald-400', label: 'Serving' };
      case 'called': return { bg: 'bg-gradient-to-r from-blue-500 to-indigo-600', text: 'text-white', dot: 'bg-blue-400', label: 'Called' };
      case 'waiting': return { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-400', label: 'Waiting' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', label: status };
    }
  };

  const formatWaitTime = (minutes: number) => {
    if (minutes <= 0) return '< 1 min';
    if (minutes <= 5) return '~1-5 min';
    if (minutes <= 15) return '~5-15 min';
    if (minutes <= 30) return '~15-30 min';
    if (minutes <= 60) return '~30-60 min';
    return '> 1 hr';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-light)] pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="skeleton h-8 w-64 mb-4 rounded-xl" />
          <div className="skeleton h-52 w-full mb-6 rounded-2xl" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-16 w-full rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!queue) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Queue Not Found</h2>
          <Link href="/locations" className="btn-primary mt-4">Browse Locations</Link>
        </div>
      </div>
    );
  }

  const servingToken = tokens.find(t => t.status === 'serving');
  const calledToken = tokens.find(t => t.status === 'called');
  const waitingTokens = tokens.filter(t => t.status === 'waiting');
  const userToken = user ? tokens.find(t => t.user_id === user.id) : null;

  return (
    <div className="min-h-screen bg-[var(--bg-light)] pt-20 pb-12">
      {/* Header gradient */}
      <div className="bg-gradient-to-r from-[#6366F1] via-[#4F46E5] to-[#3730A3] pt-6 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 relative">
          <Link href="/locations" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-200 hover:text-white mb-4 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Locations
          </Link>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 size={14} className="text-indigo-300" />
                <p className="text-sm text-indigo-200 font-medium">{queue.location_name}</p>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white">{queue.name}</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/15 border border-white/20 backdrop-blur">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                </span>
                <span className="text-xs font-bold text-white">Live</span>
              </div>
              <button
                onClick={fetchQueue}
                className="p-2 rounded-xl bg-white/15 border border-white/20 hover:bg-white/25 transition-all backdrop-blur text-white"
                title="Refresh"
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-8">
        {/* Now Serving Card */}
        <div className="card-static mb-5 overflow-hidden">
          {/* Now serving hero */}
          <div className="bg-gradient-to-br from-[#6366F1] to-[#3730A3] rounded-2xl p-7 text-center text-white mb-5 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.08]"
              style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
            />
            <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-2">Now Serving</p>
            <p className="text-7xl font-black mb-2 leading-none">
              {servingToken?.token_number || calledToken?.token_number || '—'}
            </p>
            <p className="text-sm text-indigo-200 font-medium mt-2">
              {servingToken ? '✅ Being served at counter' : calledToken ? '🔔 Called to counter' : 'Waiting for next token'}
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 text-center border border-blue-100">
              <Users size={20} className="text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-black text-blue-700">{stats?.waiting_count || 0}</p>
              <p className="text-xs text-blue-500 font-semibold">Waiting</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 text-center border border-emerald-100">
              <CheckCircle2 size={20} className="text-emerald-600 mx-auto mb-2" />
              <p className="text-2xl font-black text-emerald-700">{stats?.today_served || 0}</p>
              <p className="text-xs text-emerald-500 font-semibold">Served Today</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 text-center border border-orange-100">
              <Timer size={20} className="text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-black text-orange-700">~{Math.round(stats?.avg_service_time || queue.avg_service_time)}m</p>
              <p className="text-xs text-orange-500 font-semibold">Avg. Time</p>
            </div>
          </div>
        </div>

        {/* User's token highlight */}
        {userToken && (
          <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border-2 border-indigo-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#4F46E5] flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-200 flex-shrink-0">
              {userToken.token_number}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[var(--primary)]">Your Token</p>
              <p className="text-xs text-[var(--text-secondary)]">
                {userToken.people_ahead > 0 ? `${userToken.people_ahead} people ahead · ` : 'You\'re next! · '}
                {userToken.estimated_wait > 0 ? formatWaitTime(userToken.estimated_wait) : 'Almost ready'}
              </p>
            </div>
            <span className={`badge ${userToken.status === 'waiting' ? 'badge-waiting' : userToken.status === 'called' ? 'badge-called' : 'badge-serving'} flex-shrink-0`}>
              {userToken.status}
            </span>
          </div>
        )}

        {/* Queue List */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[var(--secondary)] flex items-center gap-2">
            <Radio size={18} className="text-[var(--primary)]" />
            Full Queue
          </h2>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span>{tokens.length} tokens</span>
            <span>·</span>
            <span>Updated {lastUpdated.toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="space-y-2">
          {tokens.length === 0 ? (
            <div className="card-static text-center py-12">
              <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                <Radio size={28} className="text-gray-300" />
              </div>
              <p className="text-[var(--text-secondary)] font-medium">No tokens in queue yet.</p>
            </div>
          ) : (
            tokens.map((token, index) => {
              const isCurrentUser = user && token.user_id === user.id;
              const isNearTurn = token.status === 'waiting' && token.estimated_wait > 0 && token.estimated_wait <= 10;
              const config = getStatusConfig(token.status);

              return (
                <div
                  key={token.id}
                  className={`bg-white rounded-2xl px-4 py-3.5 flex items-center justify-between border transition-all duration-300 ${
                    isCurrentUser
                      ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20 bg-[var(--primary-50)]'
                      : isNearTurn
                      ? 'border-amber-300 ring-2 ring-amber-200/50 bg-amber-50/50'
                      : token.status === 'serving'
                      ? 'border-emerald-200 bg-emerald-50/30'
                      : 'border-gray-100 hover:border-gray-200'
                  } ${token.status === 'called' ? 'animate-pulse' : ''}`}
                >
                  {/* Left: position + token */}
                  <div className="flex items-center gap-3">
                    {/* Position number */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                      token.status === 'serving' ? 'bg-emerald-500 text-white' :
                      token.status === 'called' ? 'bg-blue-500 text-white' :
                      'bg-gray-100 text-[var(--text-secondary)]'
                    }`}>
                      {index + 1}
                    </div>

                    <span className="text-base font-black text-[var(--secondary)] w-14">{token.token_number}</span>

                    {/* Badges */}
                    <div className="flex items-center gap-1.5">
                      {isNearTurn && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                        </span>
                      )}
                      {token.priority_level === 'emergency' && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">🚨 Emergency</span>
                      )}
                      {token.priority_level === 'priority' && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">⚡ Priority</span>
                      )}
                      {isCurrentUser && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[var(--primary-100)] text-[var(--primary)] border border-[var(--primary-200)]">You</span>
                      )}
                    </div>
                  </div>

                  {/* Right: wait time + status */}
                  <div className="flex items-center gap-3">
                    {token.status === 'waiting' && token.estimated_wait > 0 && (
                      <span className={`text-xs flex items-center gap-1.5 font-semibold ${
                        isNearTurn ? 'text-amber-600' : 'text-[var(--text-muted)]'
                      }`}>
                        <Clock size={12} /> {formatWaitTime(token.estimated_wait)}
                      </span>
                    )}
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-xl ${config.bg} ${config.text}`}>
                      {config.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
