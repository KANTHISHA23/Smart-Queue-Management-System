'use client';

/**
 * Landing Page — Home
 * Stunning, award-winning landing page with micro-animations and premium aesthetics
 */
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, Smartphone, Radio, Brain, LayoutDashboard,
  Clock, Users, Shield, BarChart3, AlertTriangle, Bell,
  CheckCircle2, Zap, TrendingUp, Star, Play, ChevronDown,
  MapPin, Award, Activity, Globe
} from 'lucide-react';

// Animated counter hook
function useCounter(target: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

function StatCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const count = useCounter(value);
  return (
    <div className="text-center">
      <p className="text-3xl md:text-4xl font-bold text-gradient-static tabular-nums">
        {count.toLocaleString()}{suffix}
      </p>
      <p className="text-sm text-[var(--text-muted)] mt-1 font-medium">{label}</p>
    </div>
  );
}

export default function HomePage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  return (
    <div className="overflow-hidden">

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Hero background image */}
        <div className="absolute inset-0 pointer-events-none">
          <Image
            src="/images/hero-queue-bg.png"
            alt=""
            fill
            priority
            className="object-cover object-center scale-105 brightness-[0.97] contrast-[1.12] saturate-[1.2]"
            sizes="100vw"
          />
          {/* Left scrim for text readability; right side shows more of the photo */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#EEF2FF]/88 via-[#E8EDFF]/45 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAFBFF]/30 via-transparent to-[#EEF2FF]/20" />
        </div>

        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-indigo-400/20 to-violet-400/10 blur-3xl animate-blob" />
          <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-cyan-400/15 to-blue-400/10 blur-3xl animate-blob" style={{ animationDelay: '3s' }} />
          <div className="absolute -bottom-32 left-1/3 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-violet-400/10 to-indigo-400/15 blur-3xl animate-blob" style={{ animationDelay: '6s' }} />

          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.015]"
            style={{ backgroundImage: 'linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left Content */}
            <div className="animate-fade-in-up">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur border border-indigo-200/60 text-sm font-semibold text-[var(--primary-dark)] mb-8 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                </span>
                Live Queue Management Platform
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-[var(--secondary)] mb-8">
                Skip the Line,{' '}
                <span className="text-gradient block">
                  Not the Service
                </span>
              </h1>

              <p className="text-xl text-[var(--text-secondary)] leading-relaxed mb-10 max-w-lg font-light">
                Book digital tokens remotely and track your queue in real-time. 
                AI-powered wait predictions for hospitals, banks, and government offices.
              </p>

              <div className="flex flex-wrap gap-4 mb-14">
                <Link href="/register" className="btn-primary text-base !py-4 !px-8 group">
                  Start For Free
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/track" className="btn-secondary text-base !py-4 !px-8 group">
                  <Radio size={16} className="text-[var(--primary)]" />
                  Track Token
                </Link>
                <Link href="/locations" className="btn-secondary text-base !py-4 !px-8 group">
                  <Play size={16} className="text-[var(--primary)]" />
                  Explore Queues
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200/70">
                <StatCounter value={10000} suffix="+" label="Tokens Issued" />
                <StatCounter value={50} suffix="+" label="Locations" />
                <StatCounter value={99} suffix="%" label="Satisfaction" />
              </div>
            </div>

            {/* Right — Premium Queue Visualization */}
            <div className="relative animate-slide-in-right hidden lg:block">
              {/* Main Card — pulsing glow */}
              <div className="relative z-10 animate-float">
                <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-200/60 p-7 max-w-md mx-auto border border-indigo-100/50">
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">Now Serving</p>
                      <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#6366F1] to-[#4F46E5]">A101</p>
                    </div>
                    <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 p-4 shadow-lg shadow-emerald-200">
                      <CheckCircle2 size={32} className="text-white" />
                    </div>
                  </div>

                  {/* Queue Status */}
                  <div className="bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-[var(--primary-dark)] uppercase tracking-wider">Queue Status</p>
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        Live
                      </span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { token: 'A101', status: 'Serving', color: 'bg-gradient-to-r from-emerald-500 to-emerald-600', dot: 'bg-emerald-400' },
                        { token: 'A102', status: 'Called', color: 'bg-gradient-to-r from-blue-500 to-blue-600', dot: 'bg-blue-400' },
                        { token: 'A103', status: 'Waiting', color: 'bg-gradient-to-r from-amber-500 to-orange-500', dot: 'bg-amber-400' },
                        { token: 'A104', status: 'Waiting', color: 'bg-gradient-to-r from-amber-400 to-orange-400', dot: 'bg-amber-300' },
                      ].map((item, i) => (
                        <div key={i} className={`flex items-center justify-between bg-white rounded-xl px-4 py-2.5 ${i === 0 ? 'shadow-sm border border-indigo-100' : ''}`}>
                          <div className="flex items-center gap-3">
                            <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                            <span className="font-bold text-sm text-[var(--text-primary)]">{item.token}</span>
                          </div>
                          <span className={`${item.color} text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg`}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-5 pt-5 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                        <Clock size={14} className="text-[var(--primary)]" />
                      </div>
                      <div>
                        <p className="text-[10px] text-[var(--text-muted)]">Est. wait</p>
                        <p className="text-sm font-bold text-[var(--text-primary)]">~12 min</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                        <Users size={14} className="text-[var(--primary)]" />
                      </div>
                      <div>
                        <p className="text-[10px] text-[var(--text-muted)]">In queue</p>
                        <p className="text-sm font-bold text-[var(--text-primary)]">4 people</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <TrendingUp size={14} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-[var(--text-muted)]">Served today</p>
                        <p className="text-sm font-bold text-[var(--text-primary)]">247</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating notification */}
              <div className="absolute -top-8 -right-4 z-20 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 animate-float-delayed border border-emerald-100" style={{ animationDelay: '1s' }}>
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-md shadow-emerald-200">
                  <Bell size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">Your turn is next!</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Token A102 · 2 min ago</p>
                </div>
              </div>

              {/* Floating AI badge */}
              <div className="absolute -bottom-6 -left-6 z-20 bg-white rounded-2xl shadow-xl p-4 animate-float-delayed border border-indigo-100" style={{ animationDelay: '2s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                    <Brain size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--text-primary)]">Smart Wait Estimate</p>
                    <p className="text-base font-black text-gradient-static">Real-time ETA</p>
                  </div>
                </div>
              </div>

              {/* Decorative ring */}
              <div className="absolute inset-0 rounded-3xl border-2 border-dashed border-indigo-200/40 scale-105" />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[var(--text-muted)] animate-bounce">
          <span className="text-xs font-medium tracking-wider uppercase">Scroll</span>
          <ChevronDown size={18} />
        </div>
      </section>

      {/* ===== TRUST BAR ===== */}
      <section className="py-10 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 text-center">
            {[
              { icon: <Shield size={20} />, label: 'Enterprise Security', color: 'text-indigo-500' },
              { icon: <Activity size={20} />, label: '99.9% Uptime', color: 'text-emerald-500' },
              { icon: <Globe size={20} />, label: 'Multi-location', color: 'text-cyan-500' },
              { icon: <Award size={20} />, label: 'Award-winning UX', color: 'text-amber-500' },
              { icon: <Zap size={20} />, label: 'Real-time Updates', color: 'text-violet-500' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 text-[var(--text-secondary)]">
                <span className={item.color}>{item.icon}</span>
                <span className="text-sm font-semibold whitespace-nowrap">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section className="py-24 bg-[var(--bg-section)] relative overflow-hidden" id="features">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-indigo-100/50 to-violet-100/30 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="section-label mx-auto w-fit mb-4">
              <Zap size={14} className="text-[var(--primary)]" />
              Everything You Need
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-[var(--secondary)] leading-tight mb-4">
              Built for Modern{' '}
              <span className="text-gradient-static">Queue Management</span>
            </h2>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto font-light">
              Eliminate frustration and streamline operations with our comprehensive, AI-powered platform.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Smartphone size={26} />,
                title: 'Remote Token Booking',
                description: 'Book tokens from your smartphone anytime, anywhere. No more standing in physical queues.',
                gradient: 'from-blue-500 to-indigo-600',
                light: 'from-blue-50 to-indigo-50',
                accent: 'text-blue-600',
                accentBg: 'bg-blue-50',
                glow: 'shadow-blue-200/50'
              },
              {
                icon: <Radio size={26} />,
                title: 'Real-Time Tracking',
                description: 'Watch your queue position update live via WebSocket. Never miss your turn.',
                gradient: 'from-violet-500 to-purple-600',
                light: 'from-violet-50 to-purple-50',
                accent: 'text-violet-600',
                accentBg: 'bg-violet-50',
                glow: 'shadow-violet-200/50'
              },
              {
                icon: <Brain size={26} />,
                title: 'AI Wait Prediction',
                description: 'Machine learning algorithms predict your waiting time with up to 97% accuracy.',
                gradient: 'from-emerald-500 to-teal-600',
                light: 'from-emerald-50 to-teal-50',
                accent: 'text-emerald-600',
                accentBg: 'bg-emerald-50',
                glow: 'shadow-emerald-200/50'
              },
              {
                icon: <LayoutDashboard size={26} />,
                title: 'Smart Admin Dashboard',
                description: 'Comprehensive controls to manage queues, call tokens, and optimize workflows.',
                gradient: 'from-orange-500 to-rose-600',
                light: 'from-orange-50 to-rose-50',
                accent: 'text-orange-600',
                accentBg: 'bg-orange-50',
                glow: 'shadow-orange-200/50'
              },
              {
                icon: <BarChart3 size={26} />,
                title: 'Analytics & Insights',
                description: 'Deep metrics on wait times, throughput, peak hours and service efficiency.',
                gradient: 'from-cyan-500 to-sky-600',
                light: 'from-cyan-50 to-sky-50',
                accent: 'text-cyan-600',
                accentBg: 'bg-cyan-50',
                glow: 'shadow-cyan-200/50'
              },
              {
                icon: <AlertTriangle size={26} />,
                title: 'Priority & Emergency',
                description: 'Instant fast-track routing for priority cases and emergency situations.',
                gradient: 'from-red-500 to-rose-600',
                light: 'from-red-50 to-rose-50',
                accent: 'text-red-600',
                accentBg: 'bg-red-50',
                glow: 'shadow-red-200/50'
              },
            ].map((feature, i) => (
              <div
                key={i}
                className={`feature-card group cursor-default animate-fade-in-up`}
                style={{ animationDelay: `${i * 0.08}s` }}
                onMouseEnter={() => setHoveredFeature(i)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                {/* Icon */}
                <div className="relative mb-5">
                  <div className={`w-14 h-14 rounded-2xl ${feature.accentBg} flex items-center justify-center transition-all duration-500 ${hoveredFeature === i ? `bg-gradient-to-br ${feature.gradient} shadow-lg ${feature.glow}` : ''}`}>
                    <span className={`transition-colors duration-300 ${hoveredFeature === i ? 'text-white' : feature.accent}`}>
                      {feature.icon}
                    </span>
                  </div>
                  {/* Accent dot */}
                  <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center`}>
                    <span className="text-white text-[8px] font-bold">{i + 1}</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-[var(--secondary)] mb-2 group-hover:text-[var(--primary)] transition-colors">{feature.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{feature.description}</p>

                {/* Hover arrow */}
                <div className="flex items-center gap-1 mt-4 text-xs font-semibold text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                  Learn more <ArrowRight size={12} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-24 bg-white relative" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="section-label mx-auto w-fit mb-4">
              <Activity size={14} className="text-[var(--primary)]" />
              Simple Process
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-[var(--secondary)] leading-tight mb-4">
              Up and Running in{' '}
              <span className="text-gradient-static">4 Steps</span>
            </h2>
            <p className="text-lg text-[var(--text-secondary)] font-light max-w-xl mx-auto">
              Getting started is effortless. No app download required.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connector */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-transparent via-indigo-300 to-transparent" />

            {[
              {
                step: '01',
                icon: <Users size={28} />,
                title: 'Create Account',
                description: 'Sign up free in 30 seconds. No credit card required.',
                gradient: 'from-blue-500 to-indigo-600',
                delay: 0
              },
              {
                step: '02',
                icon: <MapPin size={28} />,
                title: 'Choose Location',
                description: 'Find your hospital, clinic, or office from our directory.',
                gradient: 'from-violet-500 to-purple-600',
                delay: 0.1
              },
              {
                step: '03',
                icon: <TicketIcon />,
                title: 'Get Token',
                description: 'Book your digital position instantly. Skip the line.',
                gradient: 'from-emerald-500 to-teal-600',
                delay: 0.2
              },
              {
                step: '04',
                icon: <Radio size={28} />,
                title: 'Track Live',
                description: 'Monitor your position in real-time. Get notified when it\'s your turn.',
                gradient: 'from-orange-500 to-rose-500',
                delay: 0.3
              },
            ].map((step, i) => (
              <div
                key={i}
                className="text-center group relative animate-fade-in-up"
                style={{ animationDelay: `${step.delay}s` }}
              >
                <div className="relative z-10 inline-flex flex-col items-center">
                  <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white mb-5 shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:shadow-2xl group-hover:rotate-3`}>
                    {step.icon}
                  </div>
                  {/* Step number */}
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-lg border-2 border-indigo-100 flex items-center justify-center">
                    <span className="text-xs font-black text-[var(--primary)]">{step.step}</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-[var(--secondary)] mt-2 mb-2">{step.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-[200px] mx-auto">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHY CHOOSE US ===== */}
      <section className="py-24 bg-[var(--bg-section)] relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-indigo-100/40 to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left text */}
            <div className="animate-fade-in-up">
              <div className="section-label w-fit mb-4">
                <Star size={14} className="text-[var(--primary)]" />
                Why SmartQueue
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-[var(--secondary)] leading-tight mb-6">
                The Smarter Way to{' '}
                <span className="text-gradient-static">Manage Queues</span>
              </h2>
              <p className="text-lg text-[var(--text-secondary)] font-light leading-relaxed mb-8">
                Traditional waiting wastes time, creates crowds, and frustrates everyone. 
                SmartQueue turns waiting into a seamless digital experience.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: <Clock size={18} />, title: 'Reduced Wait Times', desc: 'Up to 40% faster service delivery', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                  { icon: <Star size={18} />, title: 'Higher Satisfaction', desc: 'Transparent, stress-free waiting', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                  { icon: <Zap size={18} />, title: 'Instant Alerts', desc: 'Notified the moment your turn comes', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                  { icon: <Shield size={18} />, title: 'Secure & Private', desc: 'Enterprise-grade data protection', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
                  { icon: <BarChart3 size={18} />, title: 'Deep Analytics', desc: 'Insights to optimize operations', color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' },
                  { icon: <Bell size={18} />, title: 'Priority Handling', desc: 'Emergency fast-track lanes', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
                ].map((item, i) => (
                  <div key={i} className={`flex items-start gap-3 p-4 rounded-2xl border ${item.border} ${item.bg} group hover:shadow-md transition-all duration-300`}>
                    <div className={`w-8 h-8 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                      <span className={item.color}>{item.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[var(--secondary)]">{item.title}</h4>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — visual testimonial/stats panel */}
            <div className="animate-slide-in-right">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: '40%', label: 'Reduction in wait time', gradient: 'from-indigo-500 to-blue-600', pattern: true },
                  { value: '2.4K+', label: 'Tokens issued in Hazaribagh', gradient: 'from-violet-500 to-purple-600', pattern: false },
                  { value: '12', label: 'Local partner locations', gradient: 'from-emerald-500 to-teal-600', pattern: false },
                  { value: '97%', label: 'AI prediction accuracy', gradient: 'from-orange-500 to-rose-500', pattern: true },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className={`bg-gradient-to-br ${stat.gradient} rounded-3xl p-6 text-white relative overflow-hidden shadow-xl group hover:scale-105 transition-transform duration-300`}
                  >
                    {/* Decorative circle */}
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
                    <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full bg-white/5" />
                    <p className="text-3xl font-black mb-1 relative z-10">{stat.value}</p>
                    <p className="text-sm text-white/80 font-medium relative z-10">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Testimonial */}
              <div className="mt-4 bg-white rounded-3xl p-6 shadow-lg border border-indigo-50">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4 italic">
                  &ldquo;SmartQueue changed OPD at Sadar Hospital. Patients from Matwari and Ichak now know their turn before reaching the bus stand.&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm">DS</div>
                  <div>
                    <p className="font-bold text-sm text-[var(--secondary)]">Dr. Deepak Sinha</p>
                    <p className="text-xs text-[var(--text-muted)]">Medical Officer, District Sadar Hospital, Hazaribagh</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="bg-cta-gradient py-24 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}
          />
          <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-violet-500/20 blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-cyan-500/15 blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-semibold text-white/90 mb-8 backdrop-blur">
            <Zap size={14} className="text-amber-400" />
            Free Forever for Individuals
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
            Ready to Transform
            <br />
            <span className="text-indigo-300">Queue Management?</span>
          </h2>
          <p className="text-xl text-indigo-200 mb-10 max-w-2xl mx-auto font-light">
            Join thousands of organizations that trust SmartQueue to delight their customers.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white text-[var(--primary-dark)] font-bold px-10 py-4 rounded-2xl hover:bg-indigo-50 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:-translate-y-1 inline-flex items-center gap-2 text-base"
            >
              Get Started Free
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white/30 text-white font-semibold px-10 py-4 rounded-2xl hover:bg-white/10 transition-all duration-300 inline-flex items-center gap-2 text-base backdrop-blur"
            >
              Talk to Sales
            </Link>
          </div>

          <p className="text-indigo-300/70 text-sm mt-6">No credit card required · Setup in 2 minutes · Cancel anytime</p>
        </div>
      </section>
    </div>
  );
}

// Custom icon
function TicketIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" />
    </svg>
  );
}
