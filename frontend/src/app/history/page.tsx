'use client';

/**
 * Booking History Page
 */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { tokenService } from '@/services/token.service';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export default function HistoryPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuth();
  const [tokens, setTokens] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      router.replace('/admin');
    }
  }, [isAdmin, router]);

  useEffect(() => {
    if (!isAuthenticated || isAdmin) return;
    
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const res = await tokenService.getHistory({ page: pagination.page, limit: 10 });
        setTokens(res.data.data.tokens);
        setPagination(prev => ({ ...prev, ...res.data.data.pagination }));
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [isAuthenticated, isAdmin, pagination.page]);

  if (isAdmin) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please sign in</h2>
          <Link href="/login" className="btn-primary">Sign In</Link>
        </div>
      </div>
    );
  }

  const statusBadge = (status: string) => {
    const badges: Record<string, string> = {
      completed: 'badge-completed', waiting: 'badge-waiting', called: 'badge-called',
      serving: 'badge-serving', cancelled: 'badge-cancelled', skipped: 'badge-skipped',
    };
    return badges[status] || 'badge-waiting';
  };

  return (
    <div className="min-h-screen bg-[var(--bg-light)] pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--secondary)] mb-2">Booking History</h1>
        <p className="text-[var(--text-secondary)] mb-8">View all your past and current queue bookings.</p>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-20 w-full" />)}
          </div>
        ) : tokens.length === 0 ? (
          <div className="card-static text-center py-16">
            <Calendar size={48} className="text-[var(--text-muted)] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[var(--secondary)] mb-2">No Booking History</h3>
            <p className="text-[var(--text-secondary)] mb-6">You haven&apos;t booked any tokens yet.</p>
            <Link href="/locations" className="btn-primary">Book Your First Token</Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {tokens.map((token) => (
                <div key={token.id} className="card-static flex flex-col sm:flex-row sm:items-center justify-between gap-3 !py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-[var(--primary-50)] flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-[var(--primary)]">{token.token_number}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--secondary)]">{token.queue_name}</h3>
                      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mt-1">
                        <span className="flex items-center gap-1"><MapPin size={12} /> {token.location_name}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {format(new Date(token.booked_at), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`badge ${statusBadge(token.status)} self-start sm:self-center`}>
                    {token.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page <= 1}
                  className="btn-secondary !py-2 !px-3 text-sm disabled:opacity-50"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <span className="text-sm text-[var(--text-secondary)]">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="btn-secondary !py-2 !px-3 text-sm disabled:opacity-50"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
