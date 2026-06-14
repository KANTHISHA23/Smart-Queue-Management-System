'use client';

/**
 * Provider Queue Management Page
 * Providers can create, edit, delete, reset queues.
 * Status is controlled by Admin (pending → active → inactive).
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/components/ToastProvider';
import {
  ArrowLeft,
  Building2,
  Clock,
  ListChecks,
  RotateCcw,
  SkipForward,
  CheckCircle2,
  Users,
  Plus,
  XCircle,
  AlertTriangle,
  Trash2,
  MapPin,
  Star,
  MoreVertical,
} from 'lucide-react';
import { orgQueueService } from '@/services/orgQueue.service';
import { orgTokenService } from '@/services/orgToken.service';
import { locationService } from '@/services/location.service';

type Queue = {
  id: number;
  name: string;
  description?: string | null;
  status: 'pending' | 'active' | 'inactive';
  now_serving: number;
  current_number: number;
};

type TokenRow = {
  id: number;
  token_number: string;
  position: number;
  status: string;
  estimated_wait: number;
  user_name: string;
  user_phone?: string;
  user_email?: string;
  priority_level?: 'normal' | 'priority' | 'emergency';
};

type PriorityLevel = 'normal' | 'priority' | 'emergency';

function PriorityBadge({ level }: { level: PriorityLevel }) {
  if (level === 'emergency') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-red-600 text-white">
        <AlertTriangle size={10} /> Emergency
      </span>
    );
  }
  if (level === 'priority') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200">
        <Star size={10} /> Priority
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-gray-100 text-gray-600 border border-gray-200">
      Normal
    </span>
  );
}

function tokenAccentClass(level: PriorityLevel) {
  if (level === 'emergency') return 'border-l-4 border-l-red-500';
  if (level === 'priority') return 'border-l-4 border-l-emerald-500';
  return '';
}

const statusConfig: Record<string, { label: string; color: string; dotColor: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pending Approval',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    dotColor: 'bg-amber-500',
    icon: <Clock size={12} />,
  },
  active: {
    label: 'Active',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dotColor: 'bg-emerald-500',
    icon: <CheckCircle2 size={12} />,
  },
  inactive: {
    label: 'Inactive',
    color: 'bg-red-100 text-red-800 border-red-200',
    dotColor: 'bg-red-400',
    icon: <XCircle size={12} />,
  },
};

export default function OrgQueuesPage() {
  const { isOrganization, user } = useAuth();
  const { socket, joinQueue, leaveQueue } = useSocket();
  const { showToast } = useToast();

  const [queues, setQueues] = useState<Queue[]>([]);
  const [isQueuesLoading, setIsQueuesLoading] = useState(true);
  const [queuesError, setQueuesError] = useState<string | null>(null);

  const [selectedQueueId, setSelectedQueueId] = useState<number | null>(null);
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [isTokensLoading, setIsTokensLoading] = useState(false);
  const [tokensError, setTokensError] = useState<string | null>(null);
  const [priorityMenuTokenId, setPriorityMenuTokenId] = useState<number | null>(null);

  const [createForm, setCreateForm] = useState({
    location_id: '',
    name: '',
    description: '',
  });

  const [locations, setLocations] = useState<any[]>([]);
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);
  const [newLocForm, setNewLocForm] = useState({
    name: '',
    type: 'hospital',
    description: '',
    city: '',
  });

  const isOrgReady = isOrganization && user?.role === 'organization';

  const refreshLocations = useCallback(async () => {
    try {
      const res = await locationService.getAll();
      setLocations(res.data.data?.locations || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const refreshQueues = useCallback(async () => {
    setIsQueuesLoading(true);
    setQueuesError(null);
    try {
      const res = await orgQueueService.listMine();
      const data = (res.data.data || []) as Queue[];
      setQueues(data);

      if (data.length > 0 && selectedQueueId == null) {
        setSelectedQueueId(data[0].id);
      }

      if (selectedQueueId != null && !data.some((q) => q.id === selectedQueueId)) {
        setSelectedQueueId(data[0]?.id ?? null);
      }
    } catch (e: any) {
      setQueuesError(e?.response?.data?.message || e?.message || 'Failed to load queues.');
    } finally {
      setIsQueuesLoading(false);
    }
  }, [selectedQueueId]);

  const refreshTokens = useCallback(
    async (queueId: number) => {
      setIsTokensLoading(true);
      setTokensError(null);
      try {
        const res = await orgTokenService.getQueueTokens(queueId);
        setTokens((res.data.data || []) as TokenRow[]);
      } catch (e: any) {
        setTokensError(e?.response?.data?.message || e?.message || 'Failed to load tokens.');
      } finally {
        setIsTokensLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!isOrgReady) return;
    refreshQueues();
    refreshLocations();
  }, [isOrgReady, refreshQueues, refreshLocations]);

  useEffect(() => {
    if (!isOrgReady) return;
    if (selectedQueueId == null) return;
    refreshTokens(selectedQueueId);
  }, [isOrgReady, selectedQueueId, refreshTokens]);

  useEffect(() => {
    if (selectedQueueId == null) return;
    joinQueue(selectedQueueId);
    return () => leaveQueue(selectedQueueId);
  }, [selectedQueueId, joinQueue, leaveQueue]);

  // Real-time org updates + governance events
  useEffect(() => {
    if (!socket) return;
    const onUpdate = () => {
      if (selectedQueueId != null) refreshTokens(selectedQueueId);
      refreshQueues();
    };
    socket.on('org-queue-update', onUpdate);
    socket.on('queue_activated', onUpdate);
    socket.on('queue_deactivated', onUpdate);
    socket.on('queue_reordered', onUpdate);
    socket.on('waiting_time_updated', onUpdate);
    return () => {
      socket.off('org-queue-update', onUpdate);
      socket.off('queue_activated', onUpdate);
      socket.off('queue_deactivated', onUpdate);
      socket.off('queue_reordered', onUpdate);
      socket.off('waiting_time_updated', onUpdate);
    };
  }, [socket, selectedQueueId, refreshTokens, refreshQueues]);

  const tokenWaiting = useMemo(() => tokens.filter((t) => t.status === 'waiting'), [tokens]);
  const tokenCalled = useMemo(
    () => tokens.filter((t) => t.status === 'called' || t.status === 'serving'),
    [tokens]
  );

  const selectedQueue = useMemo(() => queues.find(q => q.id === selectedQueueId), [queues, selectedQueueId]);

  const handleCreateQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.location_id) {
      showToast('Please select a location.', 'warning');
      return;
    }
    try {
      const payload = {
        location_id: Number(createForm.location_id),
        name: createForm.name,
        description: createForm.description || undefined,
      };
      const res = await orgQueueService.create(payload);
      showToast(res.data.message || 'Queue created (pending approval).', 'success');
      setCreateForm((p) => ({ ...p, name: '', description: '' }));
      await refreshQueues();
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to create queue.', 'error');
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await locationService.create(newLocForm);
      showToast('Location created successfully!', 'success');
      await refreshLocations();
      
      const newLocId = res.data.data?.id || res.data.data?.location?.id;
      if (newLocId) {
        setCreateForm((p) => ({ ...p, location_id: newLocId.toString() }));
      }
      
      setIsCreatingLocation(false);
      setNewLocForm({ name: '', type: 'hospital', description: '', city: '' });
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to create location.', 'error');
    }
  };

  const handleDeleteQueue = async (queueId: number) => {
    try {
      const res = await orgQueueService.delete(queueId);
      showToast(res.data.message || 'Queue deleted.', 'success');
      if (selectedQueueId === queueId) setSelectedQueueId(null);
      await refreshQueues();
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to delete queue.', 'error');
    }
  };

  const handleResetQueue = async (queueId: number) => {
    const queueName = selectedQueue?.name || 'this queue';
    const waitingCount = tokenWaiting.length;
    const servingCount = tokenCalled.length;
    const affected = waitingCount + servingCount;

    const message =
      affected > 0
        ? `"${queueName}" will start a fresh session.\n\n` +
          `• ${affected} active token(s) (waiting or called) will be CANCELLED\n` +
          `• Token numbering resets to zero\n` +
          `• Users will lose their place in line\n\n` +
          `Use this only at end of day or when clearing the queue intentionally.\n\n` +
          `Type RESET to confirm.`
        : `"${queueName}" token counters will reset to zero.\n\nNo active tokens are waiting — safe to reset.\n\nContinue?`;

    if (affected > 0) {
      const typed = window.prompt(message);
      if (typed?.trim().toUpperCase() !== 'RESET') {
        if (typed !== null) showToast('Reset cancelled — confirmation text did not match.', 'warning');
        return;
      }
    } else if (!window.confirm(message)) {
      return;
    }

    try {
      const res = await orgQueueService.reset(queueId);
      showToast(res.data.message || 'Queue reset.', 'success');
      await refreshTokens(queueId);
      await refreshQueues();
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to reset queue.', 'error');
    }
  };

  const handleCallNext = async () => {
    if (selectedQueueId == null) return;
    try {
      const res = await orgTokenService.callNext(selectedQueueId);
      showToast(res.data.message || 'Called next token.', 'success');
      await refreshTokens(selectedQueueId);
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to call next.', 'error');
    }
  };

  const handleSkip = async (tokenId: number) => {
    try {
      const res = await orgTokenService.skip(tokenId);
      showToast(res.data.message || 'Token skipped.', 'success');
      if (selectedQueueId != null) await refreshTokens(selectedQueueId);
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to skip token.', 'error');
    }
  };

  const handleComplete = async (tokenId: number) => {
    try {
      const res = await orgTokenService.complete(tokenId);
      showToast(res.data.message || res.data?.message || 'Token completed.', 'success');
      if (selectedQueueId != null) await refreshTokens(selectedQueueId);
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to complete token.', 'error');
    }
  };

  const handlePriority = async (tokenId: number, level: string) => {
    setPriorityMenuTokenId(null);
    try {
      const res = await orgTokenService.setPriority(tokenId, level);
      showToast(`Priority marked as ${level}.`, 'success');
      if (selectedQueueId != null) await refreshTokens(selectedQueueId);
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to set priority.', 'error');
    }
  };

  useEffect(() => {
    if (priorityMenuTokenId == null) return;
    const close = () => setPriorityMenuTokenId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [priorityMenuTokenId]);

  const renderTokenCard = (
    t: TokenRow,
    options: { showComplete?: boolean; showPriorityMenu?: boolean; highlightServing?: boolean } = {}
  ) => {
    const priority = (t.priority_level || 'normal') as PriorityLevel;
    const { showComplete = false, showPriorityMenu = false, highlightServing = false } = options;

    return (
      <div
        key={t.id}
        className={`p-4 rounded-xl border bg-white shadow-sm transition-colors ${tokenAccentClass(priority)} ${
          highlightServing ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-100'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-[var(--secondary)] text-lg">
                {t.token_number}
                <span className="text-sm font-normal text-[var(--text-secondary)] ml-2">#{t.position}</span>
              </p>
              <PriorityBadge level={priority} />
            </div>
            <p className="text-sm text-[var(--text-secondary)] mt-1.5">
              {t.user_name} • Est. {t.estimated_wait} min
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 capitalize">Status: {t.status}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {showComplete && (t.status === 'called' || t.status === 'serving') && (
              <button type="button" className="btn-primary !py-2 !px-4" onClick={() => handleComplete(t.id)}>
                <CheckCircle2 size={16} /> Complete
              </button>
            )}
            {(t.status === 'waiting' || t.status === 'called') && (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                onClick={() => handleSkip(t.id)}
              >
                <SkipForward size={15} /> Skip
              </button>
            )}
            {showPriorityMenu && t.status === 'waiting' && (
              <div className="relative">
                <button
                  type="button"
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                  aria-label="Priority options"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPriorityMenuTokenId((prev) => (prev === t.id ? null : t.id));
                  }}
                >
                  <MoreVertical size={18} />
                </button>
                {priorityMenuTokenId === t.id && (
                  <div
                    className="absolute right-0 top-full mt-1 z-20 w-44 py-1 bg-white border border-gray-200 rounded-xl shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      Set priority
                    </p>
                    {(['normal', 'priority', 'emergency'] as PriorityLevel[]).map((level) => (
                      <button
                        key={level}
                        type="button"
                        className={`w-full text-left px-3 py-2 text-sm capitalize hover:bg-gray-50 flex items-center justify-between ${
                          priority === level ? 'text-[var(--primary)] font-medium bg-blue-50/50' : 'text-gray-700'
                        }`}
                        onClick={() => handlePriority(t.id, level)}
                      >
                        {level}
                        {priority === level && <CheckCircle2 size={14} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!isOrganization) {
    return (
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">
        <p className="text-[var(--text-secondary)]">Please sign in as an organization to view this page.</p>
        <Link className="text-[var(--primary)] hover:underline" href="/org/login">
          Go to Provider Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pt-24 pb-12">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <ListChecks className="text-[var(--primary)]" />
          <h1 className="text-2xl font-bold text-[var(--secondary)]">My Queues</h1>
        </div>
        <Link
          href="/org/dashboard"
          className="px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
        >
          <ArrowLeft size={18} /> Back
        </Link>
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-[var(--secondary)] flex items-center gap-2">
              <Building2 size={18} /> Create Queue
            </h2>

            {isCreatingLocation ? (
              <form onSubmit={handleCreateLocation} className="mt-4 space-y-3 bg-gray-50 border border-gray-100 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm text-[var(--secondary)] flex items-center gap-1"><MapPin size={14}/> New Location</h3>
                  <button type="button" onClick={() => setIsCreatingLocation(false)} className="text-xs text-[var(--text-muted)] hover:text-gray-800">Cancel</button>
                </div>
                <div>
                  <label className="text-xs text-[var(--text-secondary)]">Location Name *</label>
                  <input
                    value={newLocForm.name}
                    onChange={(e) => setNewLocForm((p) => ({ ...p, name: e.target.value }))}
                    className="input w-full mt-1 !text-sm !py-1.5"
                    placeholder="e.g. HealthFirst Clinic"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-[var(--text-secondary)]">Type *</label>
                    <select
                      value={newLocForm.type}
                      onChange={(e) => setNewLocForm((p) => ({ ...p, type: e.target.value }))}
                      className="input w-full mt-1 !text-sm !py-1.5"
                      required
                    >
                      <option value="hospital">Hospital</option>
                      <option value="clinic">Clinic</option>
                      <option value="office">Office</option>
                      <option value="bank">Bank</option>
                      <option value="government">Government</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-secondary)]">City</label>
                    <input
                      value={newLocForm.city}
                      onChange={(e) => setNewLocForm((p) => ({ ...p, city: e.target.value }))}
                      className="input w-full mt-1 !text-sm !py-1.5"
                      placeholder="e.g. London"
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full !py-2 !text-xs mt-2">
                  Save Location
                </button>
              </form>
            ) : (
              <form onSubmit={handleCreateQueue} className="mt-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm text-[var(--text-secondary)]">Location *</label>
                    <button type="button" onClick={() => setIsCreatingLocation(true)} className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1">
                      <Plus size={12} /> Add new
                    </button>
                  </div>
                  <select
                    value={createForm.location_id}
                    onChange={(e) => setCreateForm((p) => ({ ...p, location_id: e.target.value }))}
                    className="input w-full"
                    required
                  >
                    <option value="" disabled>Select a location</option>
                    {locations.map((loc: any) => (
                      <option key={loc.id} value={loc.id}>{loc.name} {loc.city ? `(${loc.city})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-[var(--text-secondary)]">Queue Name *</label>
                  <input
                    value={createForm.name}
                    onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                    className="input w-full mt-1"
                    placeholder="e.g. General OPD"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-[var(--text-secondary)]">Description (optional)</label>
                  <input
                    value={createForm.description}
                    onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                    className="input w-full mt-1"
                    placeholder="Optional"
                  />
                </div>
                <button type="submit" className="btn-primary w-full !py-2.5 flex items-center justify-center gap-2">
                  <Plus size={16} /> Create Queue
                </button>
                <p className="text-xs text-[var(--text-muted)] text-center mt-2">
                  New queues require admin approval before users can see them.
                </p>
              </form>
            )}
          </div>

          <div className="mt-4">
            {isQueuesLoading ? (
              <div className="text-[var(--text-secondary)]">Loading…</div>
            ) : queuesError ? (
              <div className="text-red-600">{queuesError}</div>
            ) : queues.length === 0 ? (
              <div className="text-[var(--text-secondary)]">No queues yet.</div>
            ) : (
              <div className="space-y-3">
                {queues.map((q) => {
                  const cfg = statusConfig[q.status] || statusConfig.pending;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setSelectedQueueId(q.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        selectedQueueId === q.id
                          ? 'border-[var(--primary)] bg-[var(--primary-50)]'
                          : 'border-gray-100 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[var(--secondary)]">{q.name}</p>
                          <p className="text-xs text-[var(--text-secondary)] mt-1">
                            Serving: {q.now_serving} • Total: {q.current_number}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
                          {cfg.label}
                        </span>
                      </div>
                      {q.status === 'pending' && (
                        <p className="text-[10px] text-amber-600 mt-2 flex items-center gap-1">
                          <AlertTriangle size={10} /> Awaiting admin approval
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-semibold text-[var(--secondary)]">Queue Control</h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Manage tokens. Queue activation is controlled by the system admin.
                </p>
              </div>
              {selectedQueueId != null && selectedQueue?.status === 'active' && (
                <button onClick={handleCallNext} className="btn-primary !py-2.5 !px-4">
                  Call Next
                </button>
              )}
            </div>

            {selectedQueueId == null ? (
              <div className="mt-6 text-[var(--text-secondary)]">Select a queue to manage.</div>
            ) : (
              <>
                {/* Status Banner */}
                {selectedQueue?.status === 'pending' && (
                  <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-sm text-amber-800">
                    <Clock size={16} />
                    <span>This queue is <strong>pending admin approval</strong>. Users cannot see it yet.</span>
                  </div>
                )}
                {selectedQueue?.status === 'inactive' && (
                  <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-800">
                    <XCircle size={16} />
                    <span>This queue has been <strong>deactivated by admin</strong>. Contact admin to re-activate.</span>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    title="Start a fresh queue session — cancels all waiting tokens"
                    className="btn-secondary !py-2.5 !px-4 flex items-center gap-1.5"
                    onClick={() => handleResetQueue(selectedQueueId)}
                  >
                    <RotateCcw size={16} /> Reset Queue
                  </button>
                  <button className="btn-secondary !py-2.5 !px-4 flex items-center gap-1.5 text-red-600 hover:bg-red-50 border-red-200" onClick={() => handleDeleteQueue(selectedQueueId)}>
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
                <p className="mt-2 text-xs text-[var(--text-muted)] max-w-xl">
                  <strong>Reset</strong> starts a new session (token numbers go back to 0). All waiting or called tokens are cancelled — use only at end of day or when intentionally clearing the line.
                </p>

                <div className="mt-6">
                  {isTokensLoading ? (
                    <div className="text-[var(--text-secondary)]">Loading tokens…</div>
                  ) : tokensError ? (
                    <div className="text-red-600">{tokensError}</div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4 flex-wrap mb-5 text-sm text-[var(--text-secondary)]">
                        <span className="inline-flex items-center gap-2">
                          <Clock size={16} /> Waiting: {tokenWaiting.length}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Users size={16} /> Called/Serving: {tokenCalled.length}
                        </span>
                      </div>

                      {tokenCalled.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">
                            Currently Serving
                          </h3>
                          <div className="rounded-2xl bg-blue-50/60 border border-blue-100 p-4 space-y-3">
                            {tokenCalled.map((t) =>
                              renderTokenCard(t, { showComplete: true, highlightServing: true })
                            )}
                          </div>
                        </div>
                      )}

                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">
                          Waiting Queue
                        </h3>
                        {tokenWaiting.length === 0 ? (
                          <div className="text-[var(--text-secondary)] text-sm py-4">
                            {tokens.length === 0
                              ? 'No tokens for today in this queue.'
                              : 'No tokens waiting.'}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {tokenWaiting.map((t) =>
                              renderTokenCard(t, { showPriorityMenu: true })
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
