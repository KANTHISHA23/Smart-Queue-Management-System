'use client';

/**
 * Locations Page — Premium redesign with glassmorphism search and gradient cards
 */
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { locationService } from '@/services/location.service';
import { MapPin, Search, Building2, Clock, Users, ChevronRight, Filter, Radio, Sparkles } from 'lucide-react';

interface Location {
  id: number;
  name: string;
  type: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  operating_hours: any;
  queue_count: number;
  active_queues: number;
  is_active: boolean;
}

const typeConfig: Record<string, { label: string; emoji: string; gradient: string; bg: string; border: string; text: string }> = {
  hospital: { label: 'Hospital', emoji: '🏥', gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700' },
  clinic: { label: 'Clinic', emoji: '🩺', gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700' },
  office: { label: 'Office', emoji: '🏢', gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', border: 'border-violet-100', text: 'text-violet-700' },
  bank: { label: 'Bank', emoji: '🏦', gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700' },
  government: { label: 'Government', emoji: '🏛️', gradient: 'from-rose-500 to-pink-600', bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-700' },
};

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoading(true);
      try {
        const params: any = {};
        if (search) params.search = search;
        if (typeFilter) params.type = typeFilter;
        const res = await locationService.getAll(params);
        setLocations(res.data.data.locations);
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      } finally {
        setIsLoading(false);
      }
    };
    const debounce = setTimeout(fetchLocations, 300);
    return () => clearTimeout(debounce);
  }, [search, typeFilter]);

  return (
    <div className="min-h-screen pt-20 pb-16">
      {/* Hero header */}
      <div className="bg-gradient-to-r from-[#6366F1] via-[#4F46E5] to-[#3730A3] pt-10 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/25 text-xs font-semibold text-white/80 mb-5 backdrop-blur">
            <MapPin size={12} /> Service Locations
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            Find a Location Near You
          </h1>
          <p className="text-indigo-200 max-w-2xl mx-auto text-lg font-light">
            Hospitals, clinics, banks, and government offices across Hazaribagh, Jharkhand. Book your token and skip the Matwari Chowk rush.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
        {/* Search & Filters — floating card */}
        <div className="card-static mb-8 shadow-xl">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input !pl-11"
                placeholder="Search Hazaribagh locations..."
                id="location-search"
              />
            </div>
            {/* Type filters */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setTypeFilter('')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  !typeFilter
                    ? 'bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white shadow-md shadow-indigo-200'
                    : 'bg-gray-100 text-[var(--text-secondary)] hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {Object.entries(typeConfig).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setTypeFilter(typeFilter === key ? '' : key)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    typeFilter === key
                      ? `bg-gradient-to-r ${cfg.gradient} text-white shadow-md`
                      : 'bg-gray-100 text-[var(--text-secondary)] hover:bg-gray-200'
                  }`}
                >
                  {cfg.emoji} {cfg.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results count + sort */}
        {!isLoading && locations.length > 0 && (
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-[var(--text-secondary)] font-medium">
              <span className="font-bold text-[var(--secondary)]">{locations.length}</span> locations found
            </p>
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <Filter size={13} />
              <span>{typeFilter ? typeConfig[typeFilter]?.label : 'All types'}</span>
            </div>
          </div>
        )}

        {/* Locations Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card-static">
                <div className="skeleton h-5 w-20 mb-3 rounded-xl" />
                <div className="skeleton h-6 w-48 mb-2 rounded" />
                <div className="skeleton h-4 w-full mb-1 rounded" />
                <div className="skeleton h-4 w-4/5 mb-5 rounded" />
                <div className="skeleton h-4 w-36 mb-2 rounded" />
                <div className="skeleton h-4 w-28 mb-5 rounded" />
                <div className="skeleton h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : locations.length === 0 ? (
          <div className="card-static text-center py-20">
            <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center mx-auto mb-5">
              <Building2 size={36} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-[var(--secondary)] mb-2">No Locations Found</h3>
            <p className="text-[var(--text-secondary)] mb-6">Try adjusting your search or removing filters.</p>
            <button onClick={() => { setSearch(''); setTypeFilter(''); }} className="btn-secondary">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((location) => {
              const cfg = typeConfig[location.type] || { label: location.type, emoji: '📍', gradient: 'from-gray-400 to-gray-500', bg: 'bg-gray-50', border: 'border-gray-100', text: 'text-gray-700' };
              const hours = typeof location.operating_hours === 'string'
                ? JSON.parse(location.operating_hours)
                : location.operating_hours;

              return (
                <Link href={`/locations/${location.id}`} key={location.id} className="card group block">
                  {/* Top section */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-xl shadow-md group-hover:scale-110 transition-transform duration-300`}>
                        {cfg.emoji}
                      </div>
                      <span className={`text-xs font-bold ${cfg.text} ${cfg.bg} ${cfg.border} border px-2.5 py-1 rounded-full`}>
                        {cfg.label}
                      </span>
                    </div>

                    {/* Active indicator */}
                    <div className={`flex items-center gap-1.5 text-xs font-semibold ${location.active_queues > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                      <span className={`w-2 h-2 rounded-full ${location.active_queues > 0 ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                      {location.active_queues > 0 ? `${location.active_queues} active` : 'No active queues'}
                    </div>
                  </div>

                  {/* Name & desc */}
                  <h3 className="text-lg font-bold text-[var(--secondary)] mb-1 group-hover:text-[var(--primary)] transition-colors leading-tight">
                    {location.name}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-2 leading-relaxed">{location.description}</p>

                  {/* Info */}
                  <div className="space-y-2 mb-5">
                    {location.address && (
                      <div className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                        <MapPin size={14} className="text-[var(--primary)] mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-1">{location.address}, {location.city}</span>
                      </div>
                    )}
                    {hours && (
                      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <Clock size={14} className="text-[var(--primary)] flex-shrink-0" />
                        <span>{hours.open} – {hours.close}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <Radio size={14} className="text-[var(--primary)] flex-shrink-0" />
                      <span>{location.queue_count} queue{location.queue_count !== 1 ? 's' : ''} available</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className={`flex items-center justify-between pt-4 border-t border-gray-100 group-hover:border-[var(--primary-100)] transition-colors`}>
                    <span className="text-sm font-bold text-[var(--primary)]">View & Book Queues</span>
                    <div className="w-8 h-8 rounded-xl bg-[var(--primary-50)] flex items-center justify-center group-hover:bg-[var(--primary)] transition-all duration-300">
                      <ChevronRight size={16} className="text-[var(--primary)] group-hover:text-white transition-colors group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
