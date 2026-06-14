'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ToastProvider';
import { Mail, Lock, Eye, EyeOff, Building2, LogIn } from 'lucide-react';

function OrgLoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { loginOrganization } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailFromQuery = searchParams.get('email');
    if (emailFromQuery) {
      setEmail(emailFromQuery);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const principal = await loginOrganization(email, password);
      showToast('Organization login successful.', 'success');
      router.push(
        principal.role === 'organization'
          ? '/org/dashboard'
          : principal.role === 'admin'
            ? '/admin'
            : '/dashboard'
      );
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Login failed.';
      const status = error?.response?.status;
      showToast(status ? `Login failed (${status}): ${message}` : message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center px-4 pt-20 pb-10">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl shadow-blue-100 p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4F6AF6] to-[#3B50D5] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
              <Building2 size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--secondary)]">Provider Sign In</h1>
            <p className="text-[var(--text-secondary)] mt-2">Manage your queues and analytics</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input !pl-11"
                  placeholder="provider@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input !pl-11 !pr-11"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full !py-3.5 justify-center text-base disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn size={18} /> Sign In
                </span>
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-[var(--text-secondary)]">
            Don&apos;t have an organization account?{' '}
            <Link href="/org/register" className="text-[var(--primary)] font-semibold hover:underline">
              Create Provider Account
            </Link>
          </p>
          <p className="text-center mt-3 text-xs text-[var(--text-muted)]">
            Looking to book a token? <Link href="/login" className="text-[var(--primary)] hover:underline">User login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OrgLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center px-4 pt-20 pb-10">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <OrgLoginContent />
    </Suspense>
  );
}

