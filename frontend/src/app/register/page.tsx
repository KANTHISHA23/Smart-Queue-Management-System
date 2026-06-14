'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ToastProvider';
import { Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight, CheckCircle2, Zap, Shield, Bell } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { register } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
      const principal = await register(formData.name, formData.email, formData.password, formData.phone);
      showToast('Account created! Welcome to SmartQueue 🎉', 'success');
      router.push(principal.role === 'admin' ? '/admin' : '/dashboard');
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Registration failed.';
      const status = error?.response?.status;
      if (status === 409) {
        showToast('Account already exists. Redirecting to login...', 'info');
        router.push(`/login?email=${encodeURIComponent(formData.email.trim().toLowerCase())}`);
        return;
      }
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = formData.password.length === 0 ? 0
    : formData.password.length < 6 ? 1
    : formData.password.length < 10 ? 2
    : 3;

  const strengthLabel = ['', 'Weak', 'Good', 'Strong'];
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-emerald-500'];
  const strengthTextColor = ['', 'text-red-500', 'text-amber-600', 'text-emerald-600'];

  return (
    <div className="min-h-screen flex">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-[42%] bg-gradient-to-br from-[#4F46E5] via-[#6366F1] to-[#818CF8] relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-96 h-96 rounded-full bg-white/5 -top-32 -right-32 animate-blob" />
          <div className="absolute w-64 h-64 rounded-full bg-white/5 bottom-20 left-10 animate-blob" style={{ animationDelay: '4s' }} />
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
            Join <span className="text-indigo-300">SmartQueue</span>
            <br />for Free
          </h1>
          <p className="text-indigo-200 leading-relaxed mb-10 max-w-sm mx-auto">
            Create your account and instantly access digital queue booking at thousands of locations.
          </p>

          {/* Benefits checklist */}
          <div className="space-y-3 text-left max-w-xs mx-auto mb-10">
            {[
              'Free forever — no credit card',
              'Book tokens from anywhere',
              'Real-time queue position tracking',
              'Instant notifications on your turn',
              'Book for family members too',
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={14} className="text-emerald-300" />
                </div>
                <span className="text-sm text-indigo-100">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-3 mt-2">
            <div className="flex -space-x-2">
              {['👩‍⚕️', '👨‍💼', '👩‍💻', '👴'].map((emoji, i) => (
                <div key={i} className="w-9 h-9 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-base">
                  {emoji}
                </div>
              ))}
            </div>
            <p className="text-xs text-indigo-200"><span className="font-bold text-white">10,000+</span> users joined</p>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[var(--bg-light)] relative overflow-hidden">
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

          <div className="mb-7">
            <h2 className="text-3xl font-black text-[var(--secondary)] mb-1">Create Account</h2>
            <p className="text-[var(--text-secondary)]">Join SmartQueue and skip the waiting lines.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="label">Full Name</label>
              <div className={`relative transition-all duration-200 ${focusedField === 'name' ? 'scale-[1.01]' : ''}`}>
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'name' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
                  <User size={18} />
                </div>
                <input
                  name="name" type="text" value={formData.name}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  className="input !pl-11" placeholder="Vijay Kumar" required
                  id="register-name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="label">Email Address</label>
              <div className={`relative transition-all duration-200 ${focusedField === 'email' ? 'scale-[1.01]' : ''}`}>
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'email' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
                  <Mail size={18} />
                </div>
                <input
                  name="email" type="email" value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="input !pl-11" placeholder="you@example.com" required
                  id="register-email"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="label">Phone <span className="text-[var(--text-muted)] font-normal">(Optional)</span></label>
              <div className={`relative transition-all duration-200 ${focusedField === 'phone' ? 'scale-[1.01]' : ''}`}>
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'phone' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
                  <Phone size={18} />
                </div>
                <input
                  name="phone" type="tel" value={formData.phone}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                  className="input !pl-11" placeholder="+91 98765 43210"
                  id="register-phone"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className={`relative transition-all duration-200 ${focusedField === 'password' ? 'scale-[1.01]' : ''}`}>
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'password' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
                  <Lock size={18} />
                </div>
                <input
                  name="password" type={showPassword ? 'text' : 'password'} value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="input !pl-11 !pr-12" placeholder="Min. 6 characters" required
                  id="register-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* Password strength */}
              {formData.password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i <= passwordStrength ? strengthColor[passwordStrength] : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-semibold ${strengthTextColor[passwordStrength]}`}>{strengthLabel[passwordStrength]}</p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label">Confirm Password</label>
              <div className={`relative transition-all duration-200 ${focusedField === 'confirmPassword' ? 'scale-[1.01]' : ''}`}>
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'confirmPassword' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
                  {formData.confirmPassword && formData.password === formData.confirmPassword
                    ? <CheckCircle2 size={18} className="text-emerald-500" />
                    : <Lock size={18} />}
                </div>
                <input
                  name="confirmPassword" type="password" value={formData.confirmPassword}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  className={`input !pl-11 ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? '!border-red-400 focus:!shadow-red-100' : ''
                  } ${
                    formData.confirmPassword && formData.password === formData.confirmPassword
                      ? '!border-emerald-400' : ''
                  }`}
                  placeholder="Confirm your password" required
                  id="register-confirm-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              id="register-submit"
              className="btn-primary w-full !py-4 justify-center text-base disabled:opacity-60 disabled:cursor-not-allowed !mt-6"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating your account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Create Free Account <ArrowRight size={18} />
                </span>
              )}
            </button>

            <p className="text-xs text-center text-[var(--text-muted)] mt-2">
              By registering, you agree to our <a href="#" className="text-[var(--primary)] hover:underline">Terms</a> and <a href="#" className="text-[var(--primary)] hover:underline">Privacy Policy</a>.
            </p>
          </form>

          <p className="text-center mt-6 text-sm text-[var(--text-secondary)]">
            Already have an account?{' '}
            <Link href="/login" className="text-[var(--primary)] font-bold hover:underline">
              Sign In →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
