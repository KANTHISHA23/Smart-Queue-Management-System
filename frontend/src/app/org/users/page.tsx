'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ToastProvider';
import { orgTokenService } from '@/services/orgToken.service';
import { ArrowLeft, Users } from 'lucide-react';

export default function OrgUsersPage() {
  const { isOrganization } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const res = await orgTokenService.getUsers();
        setUsers(res.data.data || []);
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || 'Failed to load users.');
      } finally {
        setIsLoading(false);
      }
    };
    if (isOrganization) load();
  }, [isOrganization]);

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
          <Users className="text-[var(--primary)]" />
          <h1 className="text-2xl font-bold text-[var(--secondary)]">Queue Users</h1>
        </div>
        <Link
          href="/org/dashboard"
          className="px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
        >
          <ArrowLeft size={18} /> Back
        </Link>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="text-[var(--text-secondary)]">Loading…</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : users.length === 0 ? (
          <div className="text-[var(--text-secondary)]">No active users found for your organization.</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="grid md:grid-cols-2 gap-4">
              {users.map((u) => (
                <div key={u.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50">
                  <p className="font-semibold text-[var(--secondary)]">{u.name}</p>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{u.email}</p>
                  {u.phone && <p className="text-sm text-[var(--text-secondary)] mt-1">Phone: {u.phone}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

