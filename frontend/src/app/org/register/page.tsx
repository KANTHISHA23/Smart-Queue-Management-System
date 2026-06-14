'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ToastProvider';
import { Mail, Lock, Eye, EyeOff, Building2, UserPlus, BadgeCheck } from 'lucide-react';

export default function OrgRegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    type: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { registerOrganization } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    if (formData.password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await registerOrganization(formData.name, formData.email, formData.password, formData.type || undefined);
      showToast('Provider account created successfully!', 'success');
      router.push('/org/dashboard');
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Registration failed.';
      const status = error?.response?.status;
      if (status === 409) {
        showToast('Provider account already exists. Redirecting to provider login...', 'info');
        router.push(`/org/login?email=${encodeURIComponent(formData.email.trim().toLowerCase())}`);
        return;
      }
      showToast(status ? `Registration failed (${status}): ${message}` : message, 'error');
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
            <h1 className="text-2xl font-bold text-[var(--secondary)]">Provider Sign Up</h1>
            <p className="text-[var(--text-secondary)] mt-2">Create your organization account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Organization Name</label>
              <div className="relative">
                <BadgeCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="input !pl-11"
                  placeholder="City Hospital"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input !pl-11"
                  placeholder="provider@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Organization Type (Optional)</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="input"
              >
                <option value="">Select type</option>
                <option value="hospital">Hospital</option>
                <option value="bank">Bank</option>
                <option value="temple">Temple</option>
                <option value="clinic">Clinic</option>
                <option value="office">Office</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className="input !pl-11 !pr-11"
                  placeholder="Min. 6 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input !pl-11"
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full !py-3.5 justify-center text-base disabled:opacity-60 disabled:cursor-not-allowed !mt-6"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus size={18} /> Create Provider Account
                </span>
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-[var(--text-secondary)]">
            Already have a provider account?{' '}
            <Link href="/org/login" className="text-[var(--primary)] font-semibold hover:underline">
              Sign In
            </Link>
          </p>
          <p className="text-center mt-3 text-xs text-[var(--text-muted)]">
            Looking to book a token? <Link href="/register" className="text-[var(--primary)] hover:underline">User signup</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

