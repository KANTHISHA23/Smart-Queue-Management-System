'use client';

/**
 * Provider Dashboard Page
 * Shows overview of queues, status counts, and quick links.
 */
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { Building2, ListChecks, BarChart3, Users, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { orgQueueService } from '@/services/orgQueue.service';

export default function OrgDashboardPage() {
  const { user, isOrganization } = useAuth();
  const { socket } = useSocket();
  const [queues, setQueues] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    if (!isOrganization) return;
    setIsLoading(true);
    try {
      const res = await orgQueueService.listMine();
      setQueues(res.data.data || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [isOrganization]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;
    const onUpdate = () => load();
    socket.on('org-queue-update', onUpdate);
    socket.on('queue_activated', onUpdate);
    socket.on('queue_deactivated', onUpdate);
    return () => {
      socket.off('org-queue-update', onUpdate);
      socket.off('queue_activated', onUpdate);
      socket.off('queue_deactivated', onUpdate);
    };
  }, [socket]);

  const queueStatus = useMemo(() => {
    const active = queues.filter((q) => q.status === 'active').length;
    const pending = queues.filter((q) => q.status === 'pending').length;
    const inactive = queues.filter((q) => q.status === 'inactive').length;
    return { active, pending, inactive };
  }, [queues]);

  return (
    <div className="max-w-6xl mx-auto px-4 pt-24 pb-12">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-[var(--secondary)] flex items-center gap-2">
            <Building2 className="text-[var(--primary)]" /> Provider Dashboard
          </h1>
          <p className="text-[var(--text-secondary)] mt-2">
            {isOrganization ? (
              <>Signed in as <span className="font-semibold">{user?.name}</span></>
            ) : (
              <>Sign in as an organization to manage queues.</>
            )}
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/org/queues" className="btn-primary !py-2.5 !px-4">
            <ListChecks size={18} /> Manage Queues
          </Link>
          <Link
            href="/org/users"
            className="px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <Users size={18} /> Users
          </Link>
          <Link
            href="/org/analytics"
            className="px-4 py-2.5 text-sm font-semibold text-[var(--primary)] border-2 border-[var(--primary)] rounded-xl hover:bg-[var(--primary-50)] transition-all flex items-center gap-2"
          >
            <BarChart3 size={18} /> Analytics
          </Link>
        </div>
      </div>

      {/* Pending Alert */}
      {queueStatus.pending > 0 && (
        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-amber-900">
              {queueStatus.pending} queue{queueStatus.pending > 1 ? 's' : ''} pending admin approval
            </p>
            <p className="text-sm text-amber-700 mt-0.5">
              These queues are not yet visible to users. The system admin must activate them.
            </p>
          </div>
        </div>
      )}

      {/* Status Cards */}
      <div className="mt-8 grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--secondary)]">{queueStatus.active}</p>
              <p className="text-xs text-[var(--text-muted)]">Active Queues</p>
            </div>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">Approved by admin and visible to users</p>
        </div>

        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--secondary)]">{queueStatus.pending}</p>
              <p className="text-xs text-[var(--text-muted)]">Pending Approval</p>
            </div>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">Awaiting admin review</p>
        </div>

        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <XCircle size={20} className="text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--secondary)]">{queueStatus.inactive}</p>
              <p className="text-xs text-[var(--text-muted)]">Inactive</p>
            </div>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">Deactivated by admin</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="mt-6 grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-[var(--text-primary)]">Governance Flow</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            You create queues → Admin approves → Users can see and join them. This ensures quality control.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-[var(--text-primary)]">Isolation</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Organization endpoints are tenant-scoped via <code className="px-1 py-0.5 bg-gray-50 rounded">organization_id</code>.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-[var(--text-primary)]">Real-time</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Status changes are pushed instantly. When admin activates your queue, you&apos;ll see the update here.
          </p>
        </div>
      </div>

      {/* Queue Overview */}
      <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-[var(--text-primary)]">Your Queue Overview</h3>
        <p className="text-sm text-[var(--text-secondary)] mt-2">
          {isLoading
            ? 'Loading…'
            : `Total queues: ${queues.length}. Active: ${queueStatus.active}, Pending: ${queueStatus.pending}, Inactive: ${queueStatus.inactive}.`}
        </p>
      </div>
    </div>
  );
}
