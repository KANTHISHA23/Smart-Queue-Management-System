'use client';

/**
 * Admin Queue Governance Page
 * View all queues across all organizations, activate/deactivate them.
 * Real-time updates via Socket.io.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminQueueService } from '@/services/adminQueue.service';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/components/ToastProvider';
import {
  Radio, CheckCircle2, XCircle, Clock, Building2, MapPin,
  Filter, RefreshCw, Shield, AlertTriangle, Zap
} from 'lucide-react';

type Queue = {
  id: number;
  name: string;
  description?: string;
  status: 'pending' | 'active' | 'inactive';
  organization_id: number;
  organization_name?: string;
  organization_email?: string;
  location_name?: string;
  location_type?: string;
  location_address?: string;
  current_number: number;
  now_serving: number;
  max_capacity: number;
  created_at: string;
};

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    dotColor: 'bg-amber-500',
    icon: <Clock size={14} />,
  },
  active: {
    label: 'Active',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dotColor: 'bg-emerald-500',
    icon: <CheckCircle2 size={14} />,
  },
  inactive: {
    label: 'Inactive',
    color: 'bg-red-100 text-red-800 border-red-200',
    dotColor: 'bg-red-400',
    icon: <XCircle size={14} />,
  },
};

export default function AdminQueuesPage() {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'inactive'>('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const { socket } = useSocket();
  const { showToast } = useToast();

  const fetchQueues = useCallback(async () => {
    try {
      const res = await adminQueueService.getAll();
      setQueues(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch queues:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueues();
  }, [fetchQueues]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;
    const onQueueCreated = () => fetchQueues();
    const onQueueActivated = () => fetchQueues();
    const onQueueDeactivated = () => fetchQueues();
    const onQueueDeleted = () => fetchQueues();

    socket.on('queue_created', onQueueCreated);
    socket.on('queue_activated', onQueueActivated);
    socket.on('queue_deactivated', onQueueDeactivated);
    socket.on('queue_deleted', onQueueDeleted);
    return () => {
      socket.off('queue_created', onQueueCreated);
      socket.off('queue_activated', onQueueActivated);
      socket.off('queue_deactivated', onQueueDeactivated);
      socket.off('queue_deleted', onQueueDeleted);
    };
  }, [socket, fetchQueues]);

  const handleActivate = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await adminQueueService.activate(id);
      showToast(res.data.message || 'Queue activated!', 'success');
      await fetchQueues();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to activate queue.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await adminQueueService.deactivate(id);
      showToast(res.data.message || 'Queue deactivated!', 'success');
      await fetchQueues();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to deactivate queue.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredQueues = useMemo(() => {
    if (filter === 'all') return queues;
    return queues.filter(q => q.status === filter);
  }, [queues, filter]);

  const counts = useMemo(() => ({
    all: queues.length,
    pending: queues.filter(q => q.status === 'pending').length,
    active: queues.filter(q => q.status === 'active').length,
    inactive: queues.filter(q => q.status === 'inactive').length,
  }), [queues]);

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="skeleton h-8 w-64 mb-6" />
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-12" />)}
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--secondary)] flex items-center gap-2">
            <Shield size={24} className="text-[var(--primary)]" /> Queue Governance
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Approve, activate, or deactivate queues created by service providers
          </p>
        </div>
        <button
          onClick={fetchQueues}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Pending Alert */}
      {counts.pending > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-amber-900">
              {counts.pending} queue{counts.pending > 1 ? 's' : ''} awaiting approval
            </p>
            <p className="text-sm text-amber-700 mt-0.5">
              Providers have created queues that need your activation before users can see them.
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'pending', 'active', 'inactive'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              filter === tab
                ? 'bg-[var(--primary)] text-white shadow-md shadow-blue-200'
                : 'bg-white text-[var(--text-secondary)] border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab === 'all' && <Filter size={14} />}
            {tab === 'pending' && <Clock size={14} />}
            {tab === 'active' && <CheckCircle2 size={14} />}
            {tab === 'inactive' && <XCircle size={14} />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              filter === tab ? 'bg-white/20' : 'bg-gray-100'
            }`}>
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Queue List */}
      {filteredQueues.length === 0 ? (
        <div className="card-static text-center py-16">
          <Radio size={48} className="text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[var(--secondary)] mb-2">No Queues Found</h3>
          <p className="text-[var(--text-secondary)]">
            {filter === 'all' ? 'No queues have been created yet.' : `No ${filter} queues.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQueues.map(queue => {
            const cfg = statusConfig[queue.status] || statusConfig.pending;
            const isLoading = actionLoading === queue.id;

            return (
              <div
                key={queue.id}
                className={`bg-white rounded-2xl border p-5 transition-all hover:shadow-md ${
                  queue.status === 'pending' ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Queue Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-bold text-[var(--secondary)]">{queue.name}</h3>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
                        {cfg.icon} {cfg.label}
                      </span>
                    </div>

                    {queue.description && (
                      <p className="text-sm text-[var(--text-secondary)] mt-1">{queue.description}</p>
                    )}

                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      {queue.organization_name && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                          <Building2 size={12} /> {queue.organization_name}
                        </span>
                      )}
                      {queue.location_name && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                          <MapPin size={12} /> {queue.location_name}
                        </span>
                      )}
                      <span className="text-xs text-[var(--text-muted)]">
                        Cap: {queue.max_capacity} • Serving: {queue.now_serving}/{queue.current_number}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {queue.status === 'pending' && (
                      <button
                        onClick={() => handleActivate(queue.id)}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl hover:from-emerald-600 hover:to-emerald-700 shadow-sm shadow-emerald-200 transition-all disabled:opacity-50"
                      >
                        <Zap size={16} /> {isLoading ? 'Activating…' : 'Approve & Activate'}
                      </button>
                    )}
                    {queue.status === 'active' && (
                      <button
                        onClick={() => handleDeactivate(queue.id)}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-all disabled:opacity-50"
                      >
                        <XCircle size={16} /> {isLoading ? 'Deactivating…' : 'Deactivate'}
                      </button>
                    )}
                    {queue.status === 'inactive' && (
                      <button
                        onClick={() => handleActivate(queue.id)}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all disabled:opacity-50"
                      >
                        <CheckCircle2 size={16} /> {isLoading ? 'Activating…' : 'Re-activate'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
