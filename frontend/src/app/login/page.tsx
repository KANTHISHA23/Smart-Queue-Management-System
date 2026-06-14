'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ToastProvider';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, CheckCircle2, Zap, Shield, Bell } from 'lucide-react';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { login } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailFromQuery = searchParams.get('email');
    if (emailFromQuery) setEmail(emailFromQuery);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const principal = await login(email, password);
      showToast('Welcome back! 🎉', 'success');
      router.push(
        principal.role === 'admin' ? '/admin'
          : principal.role === 'organization' ? '/org/dashboard'
          : '/dashboard'
      );
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Invalid credentials';
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-[#6366F1] via-[#4F46E5] to-[#3730A3] relative overflow-hidden flex-col items-center justify-center p-12">
        {/* Animated bg elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-96 h-96 rounded-full bg-white/5 -top-32 -left-32 animate-blob" />
          <div className="absolute w-64 h-64 rounded-full bg-white/5 bottom-20 right-10 animate-blob" style={{ animationDelay: '3s' }} />
          <div className="absolute w-48 h-48 rounded-full bg-indigo-300/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-blob" style={{ animationDelay: '6s' }} />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}
          />
        </div>

        <div className="relative z-10 text-white text-center">
          {/* Logo */}
          <div className="w-16 h-16 rounded-3xl bg-white/15 backdrop-blur flex items-center justify-center mx-auto mb-8 border border-white/20">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              <path d="M9 14l2 2 4-4" />
            </svg>
          </div>

          <h1 className="text-4xl font-black mb-3 leading-tight">
            Welcome to<br />
            <span className="text-indigo-300">SmartQueue</span>
          </h1>
          <p className="text-indigo-200 leading-relaxed mb-12 max-w-sm mx-auto">
            The intelligent queue management platform that saves time and delights customers.
          </p>

          {/* Feature highlights */}
          <div className="space-y-4 text-left max-w-sm mx-auto">
            {[
              { icon: <Zap size={16} />, text: 'Real-time queue tracking' },
              { icon: <Bell size={16} />, text: 'Instant turn notifications' },
              { icon: <Shield size={16} />, text: 'Enterprise-grade security' },
              { icon: <CheckCircle2 size={16} />, text: 'AI-powered wait prediction' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>
                <span className="text-sm text-indigo-100 font-medium">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Bottom testimonial */}
          <div className="mt-12 p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur text-left max-w-sm mx-auto">
            <div className="flex gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-3.5 h-3.5 fill-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              ))}
            </div>
            <p className="text-xs text-indigo-200 italic">&ldquo;Pension counter token saved my whole morning at Gorakh Nath Chowk SBI.&rdquo;</p>
            <p className="text-xs text-indigo-400 mt-1 font-semibold">— Shyam Sundar Singh, Hazaribagh</p>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-16 bg-[var(--bg-light)] relative">
        {/* Subtle bg decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[400px] h-[400px] rounded-full bg-indigo-100/40 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[300px] h-[300px] rounded-full bg-violet-100/30 blur-3xl" />
        </div>

        <div className="w-full max-w-md relative">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#4F46E5] flex items-center justify-center shadow-lg shadow-indigo-300/40">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <path d="M9 14l2 2 4-4" />
              </svg>
            </div>
            <span className="text-xl font-black"><span className="text-[var(--primary)]">Smart</span><span className="text-[var(--secondary)]">Queue</span></span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-[var(--secondary)] mb-2">Sign In</h2>
            <p className="text-[var(--text-secondary)]">Good to see you again! Enter your details below.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="label">Email Address</label>
              <div className={`relative transition-all duration-200 ${focusedField === 'email' ? 'scale-[1.01]' : ''}`}>
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'email' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="input !pl-11"
                  placeholder="you@example.com"
                  required
                  id="login-email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label !mb-0">Password</label>
                <a href="#" className="text-xs text-[var(--primary)] font-semibold hover:underline">Forgot password?</a>
              </div>
              <div className={`relative transition-all duration-200 ${focusedField === 'password' ? 'scale-[1.01]' : ''}`}>
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'password' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="input !pl-11 !pr-12"
                  placeholder="Enter your password"
                  required
                  id="login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              id="login-submit"
              className="btn-primary w-full !py-4 justify-center text-base disabled:opacity-60 disabled:cursor-not-allowed !mt-6"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In <ArrowRight size={18} />
                </span>
              )}
            </button>
          </form>

          {/* Demo credentials */}
         

          <p className="text-center mt-6 text-sm text-[var(--text-secondary)]">
            New to SmartQueue?{' '}
            <Link href="/register" className="text-[var(--primary)] font-bold hover:underline">
              Create free account →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
