'use client';

/**
 * User Dashboard — Premium redesign with gradient token cards and live indicators
 */
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/components/ToastProvider';
import { tokenService } from '@/services/token.service';
import {
  Ticket, Clock, MapPin, Users, ArrowRight, RefreshCw,
  XCircle, CheckCircle2, Timer, Building2, Zap, Radio,
  TrendingUp, AlertCircle, Sparkles, Bell
} from 'lucide-react';

interface ActiveToken {
  id: number;
  token_number: string;
  queue_name: string;
  location_name: string;
  location_type: string;
  status: string;
  position: number;
  people_ahead: number;
  estimated_wait: number;
  booked_at: string;
  priority_level: 'normal' | 'priority' | 'emergency';
  queue_id: number;
  prediction_source?: 'heuristic' | 'ml';
}

export default function DashboardPage() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { socket, joinQueue } = useSocket();
  const { showToast } = useToast();
  const [activeTokens, setActiveTokens] = useState<ActiveToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTokens = useCallback(async () => {
    setError(null);
    try {
      const res = await tokenService.getMyTokens();
      setActiveTokens(res.data.data);
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
      setError('Failed to load your active tokens.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTokens();
  };

  useEffect(() => {
    if (isAuthenticated) fetchTokens();
  }, [isAuthenticated, fetchTokens]);

  useEffect(() => {
    if (!socket) return;
    if (!activeTokens || activeTokens.length === 0) return;
    activeTokens.forEach((t) => joinQueue(t.queue_id));
  }, [socket, activeTokens, joinQueue]);

  useEffect(() => {
    if (!socket) return;
    const handleQueueUpdate = () => fetchTokens();
    const handleYourTurn = (data: any) => {
      showToast(`🎉 Your token ${data.tokenNumber} has been called!`, 'success');
      fetchTokens();
    };
    socket.on('queue-update', handleQueueUpdate);
    socket.on('token-called', handleQueueUpdate);
    socket.on('your-turn', handleYourTurn);
    socket.on('waiting_time_updated', handleQueueUpdate);
    return () => {
      socket.off('queue-update', handleQueueUpdate);
      socket.off('token-called', handleQueueUpdate);
      socket.off('your-turn', handleYourTurn);
      socket.off('waiting_time_updated', handleQueueUpdate);
    };
  }, [socket, fetchTokens, showToast]);

  const formatWaitTime = (minutes: number) => {
    if (minutes <= 0) return '< 1 min';
    if (minutes <= 5) return '~1-5 mins';
    if (minutes <= 15) return '~5-15 mins';
    if (minutes <= 30) return '~15-30 mins';
    if (minutes <= 60) return '~30-60 mins';
    return '> 1 hr';
  };

  const handleCancel = async (tokenId: number) => {
    if (!confirm('Cancel this token? This action cannot be undone.')) return;
    try {
      await tokenService.cancel(tokenId);
      showToast('Token cancelled successfully.', 'success');
      fetchTokens();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to cancel token.', 'error');
    }
  };

  const handleRejoin = async (tokenId: number) => {
    if (!confirm('Rejoin the queue? You will be placed at the end of the line.')) return;
    try {
      await tokenService.rejoin(tokenId);
      showToast('Successfully rejoined the queue.', 'success');
      fetchTokens();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to rejoin queue.', 'error');
    }
  };

  const handleRecall = async (tokenId: number) => {
    if (!confirm('Request a re-call? You will be placed near the front of the line.')) return;
    try {
      await tokenService.recall(tokenId);
      showToast('Recall requested successfully.', 'success');
      fetchTokens();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to request recall.', 'error');
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'waiting': return { badge: 'badge-waiting', gradient: 'from-amber-500 to-orange-500', label: 'Waiting' };
      case 'called': return { badge: 'badge-called', gradient: 'from-blue-500 to-indigo-600', label: '🔔 Called' };
      case 'serving': return { badge: 'badge-serving', gradient: 'from-emerald-500 to-teal-600', label: '✅ Serving' };
      case 'missed': return { badge: 'bg-rose-100 text-rose-700', gradient: 'from-rose-500 to-red-600', label: '❌ Missed Turn' };
      default: return { badge: 'badge-waiting', gradient: 'from-gray-400 to-gray-500', label: status };
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-[var(--bg-light)]">
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mx-auto mb-4">
            <Ticket size={36} className="text-[var(--primary)]" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Sign in to continue</h2>
          <p className="text-[var(--text-secondary)] mb-6">Access your queue tokens and real-time tracking.</p>
          <Link href="/login" className="btn-primary">Sign In <ArrowRight size={16} /></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-light)] pt-20 pb-16">
      {/* Header gradient band */}
      <div className="bg-gradient-to-r from-[#6366F1] via-[#4F46E5] to-[#3730A3] pt-8 pb-16 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}
          />
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-violet-500/20 blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-semibold text-white/80 mb-3 backdrop-blur">
                <Sparkles size={12} className="text-amber-300" />
                Dashboard
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-1">
                Hey, {user?.name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-indigo-200 font-light">
                {activeTokens.length > 0
                  ? `You have ${activeTokens.length} active token${activeTokens.length > 1 ? 's' : ''}`
                  : 'Ready to skip the queue?'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 border border-white/20 text-sm font-semibold text-white hover:bg-white/25 transition-all backdrop-blur"
              >
                <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </button>
              <Link href="/locations" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[var(--primary-dark)] text-sm font-bold hover:bg-indigo-50 transition-all shadow-lg">
                <Zap size={15} />
                Book Token
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        {/* Active Tokens */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="card-static">
                <div className="skeleton h-5 w-28 mb-4 rounded-lg" />
                <div className="skeleton h-20 w-full mb-4 rounded-xl" />
                <div className="skeleton h-4 w-40 mb-2 rounded" />
                <div className="skeleton h-4 w-32 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="card-static text-center py-12">
            <div className="w-16 h-16 rounded-3xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-[var(--secondary)] mb-2">Something went wrong</h3>
            <p className="text-[var(--text-secondary)] mb-6">{error}</p>
            <button onClick={fetchTokens} className="btn-primary">Retry</button>
          </div>
        ) : activeTokens.length === 0 ? (
          <div className="card-static text-center py-16 overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-violet-50/30 pointer-events-none" />
            <div className="relative z-10">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mx-auto mb-5">
                <Ticket size={40} className="text-[var(--primary)]" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--secondary)] mb-2">No Active Tokens</h3>
              <p className="text-[var(--text-secondary)] mb-8 max-w-sm mx-auto">
                You don't have any active queue tokens. Find a location and book your spot!
              </p>
              <Link href="/locations" className="btn-primary !py-3.5 !px-8">
                Browse Locations <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeTokens.map((token) => {
              const isNearTurn = token.estimated_wait <= 10 && token.status === 'waiting';
              const isActive = token.status === 'called' || token.status === 'serving';
              const isMissed = token.status === 'missed';
              const config = getStatusConfig(token.status);
              return (
                <div
                  key={token.id}
                  className={`card-static overflow-hidden transition-all duration-300 ${
                    isMissed ? 'ring-2 ring-rose-400 ring-offset-2' :
                    isNearTurn ? 'ring-2 ring-amber-400 ring-offset-2' :
                    isActive ? 'ring-2 ring-emerald-400 ring-offset-2' : ''
                  }`}
                >
                  {/* Gradient top bar */}
                  <div className={`h-1.5 -mx-6 -mt-6 mb-5 bg-gradient-to-r ${config.gradient}`} />

                  {/* Near turn banner */}
                  {isNearTurn && (
                    <div className="-mx-6 -mt-5 mb-5 px-5 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/60 flex items-center gap-2.5">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                      </span>
                      <p className="text-xs font-bold text-amber-700">⚡ Your turn is approaching — please get ready!</p>
                    </div>
                  )}

                  {isActive && (
                    <div className="-mx-6 -mt-5 mb-5 px-5 py-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200/60 flex items-center gap-2.5">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                      </span>
                      <p className="text-xs font-bold text-emerald-700">
                        {token.status === 'called' ? '🔔 Your token has been called — please proceed to the counter!' : '✅ You are currently being served.'}
                      </p>
                    </div>
                  )}

                  {isMissed && (
                    <div className="-mx-6 -mt-5 mb-5 px-5 py-2.5 bg-gradient-to-r from-rose-50 to-red-50 border-b border-rose-200/60 flex items-center gap-2.5">
                      <XCircle size={16} className="text-rose-500" />
                      <p className="text-sm font-bold text-rose-700 max-w-sm leading-tight">You missed your turn! Please choose a recovery option below.</p>
                    </div>
                  )}

                  {/* Card header */}
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 size={13} className="text-[var(--text-muted)]" />
                        <span className="text-xs text-[var(--text-muted)] font-medium">{token.location_name}</span>
                      </div>
                      <h3 className="font-bold text-[var(--secondary)] text-lg leading-tight">{token.queue_name}</h3>
                    </div>
                    <span className={`badge ${config.badge} flex-shrink-0`}>{config.label}</span>
                  </div>

                  {/* Token number — hero display */}
                  <div className={`bg-gradient-to-br ${config.gradient} rounded-2xl p-6 text-center mb-5 relative overflow-hidden shadow-lg`}>
                    <div className="absolute inset-0 opacity-[0.1]"
                      style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                    />
                    <p className="text-xs text-white/70 font-semibold uppercase tracking-widest mb-1">Your Token</p>
                    <p className="text-6xl font-black text-white leading-none">{token.token_number}</p>
                    <div className="flex items-center justify-center gap-2 mt-3">
                      {token.priority_level === 'emergency' && (
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/20 text-white border border-white/30">🚨 Emergency</span>
                      )}
                      {token.priority_level === 'priority' && (
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/20 text-white border border-white/30">⚡ Priority</span>
                      )}
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3.5 text-center border border-gray-100">
                      <Users size={18} className="text-[var(--primary)] mx-auto mb-1.5" />
                      <p className="text-2xl font-black text-[var(--secondary)]">{token.people_ahead}</p>
                      <p className="text-xs text-[var(--text-muted)] font-medium">People Ahead</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3.5 text-center border border-gray-100">
                      <Timer size={18} className="text-[var(--primary)] mx-auto mb-1.5" />
                      <p className="text-lg font-black text-[var(--secondary)]">{formatWaitTime(token.estimated_wait)}</p>
                      <p className="text-xs text-[var(--text-muted)] font-medium">Est. Wait</p>
                      {token.prediction_source === 'ml' && (
                        <p className="text-[10px] text-indigo-600 font-semibold mt-1">AI-predicted from live queue data</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {isMissed ? (
                      <>
                        <button onClick={() => handleRecall(token.id)} className="btn-primary flex-1 !py-2.5 text-sm flex items-center justify-center gap-2">
                          <Radio size={15} /> Request Recall
                        </button>
                        <button onClick={() => handleRejoin(token.id)} className="btn-secondary flex-1 !py-2.5 text-sm flex items-center justify-center gap-2 shadow-sm border bg-white/60">
                          <RefreshCw size={15} /> Rejoin Queue
                        </button>
                      </>
                    ) : (
                      <>
                        <Link href={`/queue/${token.queue_id}`} className="btn-secondary flex-1 !py-2.5 justify-center text-sm shadow-sm border bg-white/60">
                          <Radio size={15} />
                          Track Live
                        </Link>
                        {token.status === 'waiting' && (
                          <button onClick={() => handleCancel(token.id)} className="btn-danger !py-2.5 !px-4 text-sm flex items-center justify-center gap-1">
                            <XCircle size={15} /> Cancel
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-8">
          <h2 className="text-lg font-bold text-[var(--secondary)] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                href: '/locations',
                icon: <MapPin size={22} />,
                title: 'Find Locations',
                desc: 'Browse nearby services',
                gradient: 'from-blue-500 to-indigo-600',
                bg: 'bg-blue-50',
                border: 'border-blue-100',
                iconColor: 'text-blue-600'
              },
              ...(!isAdmin ? [{
                href: '/history',
                icon: <Clock size={22} />,
                title: 'Booking History',
                desc: 'View past bookings',
                gradient: 'from-violet-500 to-purple-600',
                bg: 'bg-violet-50',
                border: 'border-violet-100',
                iconColor: 'text-violet-600'
              }] : []),
              {
                href: '/notifications',
                icon: <Bell size={22} />,
                title: 'Notifications',
                desc: 'View all alerts',
                gradient: 'from-emerald-500 to-teal-600',
                bg: 'bg-emerald-50',
                border: 'border-emerald-100',
                iconColor: 'text-emerald-600'
              },
            ].map((item, i) => (
              <Link key={i} href={item.href} className={`card group flex items-center gap-4 overflow-hidden`}>
                <div className={`w-12 h-12 rounded-2xl ${item.bg} border ${item.border} flex items-center justify-center flex-shrink-0 group-hover:bg-gradient-to-br group-hover:${item.gradient} group-hover:border-transparent transition-all duration-300`}>
                  <span className={`${item.iconColor} group-hover:text-white transition-colors duration-300`}>{item.icon}</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-[var(--secondary)] group-hover:text-[var(--primary)] transition-colors">{item.title}</h3>
                  <p className="text-sm text-[var(--text-muted)] truncate">{item.desc}</p>
                </div>
                <ArrowRight size={18} className="ml-auto text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
