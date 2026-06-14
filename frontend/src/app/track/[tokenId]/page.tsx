'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AxiosError } from 'axios';
import {
  ArrowLeft,
  Clock3,
  Copy,
  LoaderCircle,
  Radio,
  RefreshCw,
  ShieldCheck,
  Ticket,
  TimerReset,
  Users,
} from 'lucide-react';
import { useSocket } from '@/context/SocketContext';
import { publicTokenService, PublicTokenTrackingData, PublicTokenStatus } from '@/services/publicToken.service';

function getStatusMeta(status: PublicTokenStatus) {
  switch (status) {
    case 'waiting':
      return {
        label: 'Waiting',
        badge: 'badge badge-waiting',
        description: 'Your token is still in the queue.',
      };
    case 'serving':
      return {
        label: 'Serving',
        badge: 'badge badge-serving',
        description: 'This token is at the counter now.',
      };
    case 'completed':
      return {
        label: 'Completed',
        badge: 'badge badge-completed',
        description: 'This token has already been completed.',
      };
    case 'missed':
      return {
        label: 'Missed',
        badge: 'badge badge-cancelled',
        description: 'This token was marked as missed.',
      };
  }
}

function formatWaitTime(minutes: number) {
  if (minutes <= 0) return 'Ready now';
  if (minutes === 1) return 'About 1 minute';
  if (minutes < 60) return `About ${minutes} minutes`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (!remainingMinutes) return `About ${hours} hour${hours > 1 ? 's' : ''}`;
  return `About ${hours}h ${remainingMinutes}m`;
}

function formatPosition(positionInQueue: number, status: PublicTokenStatus) {
  if (status === 'waiting') return `#${positionInQueue}`;
  if (status === 'serving') return 'At counter';
  return 'Queue finished';
}

export default function TrackTokenDetailPage() {
  const params = useParams();
  const rawTokenId = useMemo(() => decodeURIComponent(String(params.tokenId || '')), [params.tokenId]);
  const { socket, isConnected, joinQueue, leaveQueue } = useSocket();

  const [tracking, setTracking] = useState<PublicTokenTrackingData | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchTracking = useCallback(async (showLoader: boolean) => {
    if (!rawTokenId) {
      setError('Invalid token ID.');
      setTracking(null);
      setIsLoading(false);
      return;
    }

    if (showLoader) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const response = await publicTokenService.getStatus(rawTokenId);
      setTracking(response.data.data);
      setError('');
      setLastUpdated(new Date());
    } catch (requestError) {
      const typedError = requestError as AxiosError<{ message?: string }>;
      const message =
        typedError.response?.data?.message || 'Unable to load this token right now.';
      setTracking(null);
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [rawTokenId]);

  useEffect(() => {
    fetchTracking(true);
  }, [fetchTracking]);

  useEffect(() => {
    if (!tracking?.queue_id || !isConnected) return;

    joinQueue(tracking.queue_id);
    return () => {
      leaveQueue(tracking.queue_id);
    };
  }, [tracking?.queue_id, isConnected, joinQueue, leaveQueue]);

  useEffect(() => {
    if (!socket || !tracking?.queue_id) return;

    const handleQueueEvent = (payload?: { queueId?: number | string }) => {
      if (!payload?.queueId) return;
      if (Number(payload.queueId) !== tracking.queue_id) return;
      fetchTracking(false);
    };

    socket.on('queue-update', handleQueueEvent);
    socket.on('token-called', handleQueueEvent);
    socket.on('queue_reordered', handleQueueEvent);
    socket.on('waiting_time_updated', handleQueueEvent);

    return () => {
      socket.off('queue-update', handleQueueEvent);
      socket.off('token-called', handleQueueEvent);
      socket.off('queue_reordered', handleQueueEvent);
      socket.off('waiting_time_updated', handleQueueEvent);
    };
  }, [socket, tracking?.queue_id, fetchTracking]);

  const handleCopyLink = useCallback(async () => {
    if (typeof window === 'undefined') return;

    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-light)] pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="skeleton h-8 w-48 mb-5 rounded-xl" />
          <div className="skeleton h-72 w-full rounded-3xl mb-6" />
          <div className="grid md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="skeleton h-32 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="min-h-screen bg-[var(--bg-light)] pt-24 pb-12 flex items-center">
        <div className="max-w-xl mx-auto px-4 sm:px-6 w-full">
          <div className="card-static text-center">
            <div className="w-16 h-16 rounded-3xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
              <Ticket size={28} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-black text-[var(--secondary)] mb-2">Token not available</h1>
            <p className="text-[var(--text-secondary)] mb-6">{error || 'This token could not be tracked publicly.'}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/track" className="btn-primary justify-center">
                Try another token
              </Link>
              <Link href="/" className="btn-secondary justify-center">
                Return home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusMeta = getStatusMeta(tracking.status);

  return (
    <div className="min-h-screen bg-[var(--bg-light)] pt-20 pb-12">
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#312E81] pt-6 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '44px 44px' }}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative">
          <Link href="/track" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-200 hover:text-white mb-4 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Track Token
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-indigo-200 uppercase tracking-[0.24em] mb-2">
                Public Token Tracker
              </p>
              <h1 className="text-4xl md:text-5xl font-black text-white leading-none mb-3">
                {tracking.token_number}
              </h1>
              <p className="text-lg text-indigo-100">{tracking.queue_name}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => fetchTracking(false)} className="btn-secondary">
                {isRefreshing ? <LoaderCircle size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Refresh
              </button>
              <button type="button" onClick={handleCopyLink} className="btn-primary">
                <Copy size={16} />
                {copied ? 'Copied' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8">
        <div className="card-static mb-6 overflow-hidden">
          <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-5 items-stretch">
            <div className="bg-gradient-to-br from-[var(--primary)] via-[var(--primary-dark)] to-[#312E81] rounded-3xl p-6 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.08]"
                style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '22px 22px' }}
              />
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-100 mb-2">
                Current Serving
              </p>
              <p className="text-6xl font-black leading-none mb-3">
                {tracking.current_serving_token || '—'}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-indigo-100">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                  </span>
                  {isConnected ? 'Live updates connected' : 'Reconnecting to live updates'}
                </span>
                <span className={statusMeta.badge}>{statusMeta.label}</span>
              </div>
              <p className="text-sm text-indigo-100/90 mt-4 max-w-xl">{statusMeta.description}</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 flex flex-col justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-[0.18em] mb-2">
                  Tracking Info
                </p>
                <p className="text-2xl font-black text-[var(--secondary)] mb-2">
                  {formatPosition(tracking.position_in_queue, tracking.status)}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {tracking.status === 'waiting'
                    ? `${tracking.position_in_queue - 1} token${tracking.position_in_queue - 1 === 1 ? '' : 's'} ahead of you`
                    : 'This token is no longer waiting in the queue.'}
                </p>
              </div>

              <div className="mt-5 pt-5 border-t border-slate-200">
                <p className="text-xs text-[var(--text-muted)] mb-1">Last updated</p>
                <p className="text-sm font-semibold text-[var(--secondary)]">
                  {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Just now'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {[
            {
              title: 'Token Number',
              value: tracking.token_number,
              caption: 'Public reference',
              icon: <Ticket size={18} className="text-indigo-600" />,
            },
            {
              title: 'Status',
              value: statusMeta.label,
              caption: 'Read-only visibility',
              icon: <ShieldCheck size={18} className="text-emerald-600" />,
            },
            {
              title: 'Queue Position',
              value: formatPosition(tracking.position_in_queue, tracking.status),
              caption: tracking.status === 'waiting' ? 'Dynamic live rank' : 'Not currently waiting',
              icon: <Users size={18} className="text-cyan-600" />,
            },
            {
              title: 'Estimated Wait',
              value: formatWaitTime(tracking.estimated_wait_time),
              caption: tracking.prediction_source === 'ml'
                ? 'AI-predicted from live queue data'
                : 'Based on recent service time',
              icon: <Clock3 size={18} className="text-orange-600" />,
            },
          ].map((item) => (
            <div key={item.title} className="card">
              <div className="w-11 h-11 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4">
                {item.icon}
              </div>
              <p className="text-sm font-semibold text-[var(--text-muted)] mb-1">{item.title}</p>
              <p className="text-2xl font-black text-[var(--secondary)] break-words">{item.value}</p>
              <p className="text-sm text-[var(--text-secondary)] mt-2">{item.caption}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-5">
          <div className="card-static">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-[var(--primary-50)] flex items-center justify-center">
                <Radio size={18} className="text-[var(--primary)]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[var(--secondary)]">Live queue summary</h2>
                <p className="text-sm text-[var(--text-secondary)]">Safe public information only</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)] mb-1">
                  Current serving token
                </p>
                <p className="text-xl font-black text-[var(--secondary)]">
                  {tracking.current_serving_token || 'No token currently being served'}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)] mb-1">
                  Estimated waiting time
                </p>
                <p className="text-xl font-black text-[var(--secondary)]">
                  {formatWaitTime(tracking.estimated_wait_time)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)] mb-1">
                  Queue position
                </p>
                <p className="text-xl font-black text-[var(--secondary)]">
                  {formatPosition(tracking.position_in_queue, tracking.status)}
                </p>
              </div>
            </div>
          </div>

          <div className="card-static bg-gradient-to-br from-white via-[#F8FAFF] to-[#EEF2FF]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                <TimerReset size={18} className="text-[var(--primary)]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[var(--secondary)]">Tracking notes</h2>
                <p className="text-sm text-[var(--text-secondary)]">How the public tracker behaves</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-[var(--text-secondary)]">
              <div className="rounded-2xl bg-white/80 border border-white px-4 py-3">
                Anyone with the token link can view status updates, but there are no public write actions.
              </div>
              <div className="rounded-2xl bg-white/80 border border-white px-4 py-3">
                Personal details are hidden. Only queue-safe fields are shown on this page.
              </div>
              <div className="rounded-2xl bg-white/80 border border-white px-4 py-3">
                This page refreshes automatically whenever the queue room receives a live update.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
