'use client';

/**
 * Location Detail Page
 * Shows location info and available queues with booking option
 */
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { locationService } from '@/services/location.service';
import { tokenService } from '@/services/token.service';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ToastProvider';
import {
  MapPin, Clock, Phone, Mail, Users, Timer, ArrowLeft,
  Ticket, CheckCircle2, AlertCircle, Building2, Star, MessageSquare
} from 'lucide-react';

interface LocationReview {
  author: string;
  role?: string;
  rating: number;
  text: string;
  date?: string;
}
import Link from 'next/link';

export default function LocationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [location, setLocation] = useState<any>(null);
  const [queues, setQueues] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingQueue, setBookingQueue] = useState<number | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await locationService.getById(Number(params.id));
        setLocation(res.data.data.location);
        setQueues(res.data.data.queues);
      } catch (error) {
        console.error('Failed to fetch location:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (params.id) fetchLocation();
  }, [params.id]);

  const handleBookToken = async (queueId: number, priorityLevel: string = 'normal') => {
    if (!isAuthenticated) {
      showToast('Please sign in to book a token.', 'warning');
      router.push('/login');
      return;
    }

    setBookingQueue(queueId);
    try {
      const res = await tokenService.book({ queue_id: queueId, priority_level: priorityLevel });
      showToast(`🎉 ${res.data.message}`, 'success');
      router.push('/dashboard');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to book token.', 'error');
    } finally {
      setBookingQueue(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-light)] pt-24 pb-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="skeleton h-8 w-64 mb-4" />
          <div className="skeleton h-40 w-full mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-32 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Location Not Found</h2>
          <Link href="/locations" className="btn-primary mt-4">Back to Locations</Link>
        </div>
      </div>
    );
  }

  const hours = typeof location.operating_hours === 'string' 
    ? JSON.parse(location.operating_hours) 
    : location.operating_hours;

  const reviews: LocationReview[] = (() => {
    if (!location.reviews) return [];
    if (typeof location.reviews === 'string') {
      try { return JSON.parse(location.reviews); } catch { return []; }
    }
    return Array.isArray(location.reviews) ? location.reviews : [];
  })();

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-[var(--bg-light)] pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link href="/locations" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Locations
        </Link>

        {/* Location Header Card */}
        <div className="card-static mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4F6AF6] to-[#3B50D5] flex items-center justify-center">
                  <Building2 size={28} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[var(--secondary)]">{location.name}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="badge badge-active">{location.type}</span>
                    {avgRating && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        {avgRating} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-[var(--text-secondary)] mb-4">{location.description}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {location.address && (
                  <div className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <MapPin size={16} className="text-[var(--primary)] mt-0.5" />
                    <span>{location.address}, {location.city}</span>
                  </div>
                )}
                {hours && (
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Clock size={16} className="text-[var(--primary)]" />
                    <span>{hours.open} - {hours.close} ({hours.days?.join(', ')})</span>
                  </div>
                )}
                {location.phone && (
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Phone size={16} className="text-[var(--primary)]" />
                    <span>{location.phone}</span>
                  </div>
                )}
                {location.email && (
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Mail size={16} className="text-[var(--primary)]" />
                    <span>{location.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Local reviews */}
        {reviews.length > 0 && (
          <div className="card-static mb-8">
            <div className="flex items-center gap-2 mb-5">
              <MessageSquare size={20} className="text-[var(--primary)]" />
              <h2 className="text-xl font-bold text-[var(--secondary)]">What locals say</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((review, i) => (
                <div key={i} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, star) => (
                      <Star
                        key={star}
                        size={14}
                        className={star < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed italic">
                    &ldquo;{review.text}&rdquo;
                  </p>
                  <div className="mt-3 pt-3 border-t border-gray-200/80">
                    <p className="text-sm font-semibold text-[var(--secondary)]">{review.author}</p>
                    {review.role && (
                      <p className="text-xs text-[var(--text-muted)]">{review.role}</p>
                    )}
                    {review.date && (
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">
                        {new Date(review.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Queues */}
        <h2 className="text-xl font-bold text-[var(--secondary)] mb-4">
          Available Queues ({queues.length})
        </h2>

        {queues.length === 0 ? (
          <div className="card-static text-center py-12">
            <AlertCircle size={40} className="text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-[var(--text-secondary)]">No queues available at this location.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {queues.map((queue) => (
              <div key={queue.id} className="card-static">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-[var(--secondary)]">{queue.name}</h3>
                    {queue.description && (
                      <p className="text-sm text-[var(--text-muted)] mt-0.5">{queue.description}</p>
                    )}
                  </div>
                  <span className={`badge ${queue.status === 'active' ? 'badge-active' : 'badge-cancelled'}`}>
                    {queue.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <Users size={16} className="text-blue-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-blue-700">{queue.waiting_count || 0}</p>
                    <p className="text-[10px] text-blue-600 font-medium">Waiting</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <CheckCircle2 size={16} className="text-green-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-green-700">{queue.today_served || 0}</p>
                    <p className="text-[10px] text-green-600 font-medium">Served Today</p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-3 text-center">
                    <Timer size={16} className="text-orange-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-orange-700">~{queue.avg_service_time}m</p>
                    <p className="text-[10px] text-orange-600 font-medium">Avg Time</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <select 
                    value={selectedPriority[queue.id] || 'normal'}
                    onChange={(e) => setSelectedPriority({ ...selectedPriority, [queue.id]: e.target.value })}
                    className="input text-sm !py-2.5 max-w-[130px]"
                    disabled={queue.status !== 'active' || bookingQueue === queue.id}
                  >
                    <option value="normal">Normal</option>
                    <option value="priority">Priority</option>
                    <option value="emergency">Emergency ‼️</option>
                  </select>
                  <button
                    onClick={() => handleBookToken(queue.id, selectedPriority[queue.id] || 'normal')}
                    disabled={queue.status !== 'active' || bookingQueue === queue.id}
                    className="btn-primary flex-1 text-sm !py-2.5 justify-center disabled:opacity-50"
                  >
                    {bookingQueue === queue.id ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Booking...
                      </span>
                    ) : (
                      <>
                        <Ticket size={16} /> Book Token
                      </>
                    )}
                  </button>
                  <Link href={`/queue/${queue.id}`} className="btn-secondary text-sm !py-2.5 !px-4">
                    View Queue
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
