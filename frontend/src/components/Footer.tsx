'use client';

/**
 * Footer — Premium redesign with gradient branding, improved links layout
 */
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Globe, Code2, MessageCircle, Briefcase, ArrowRight, Zap } from 'lucide-react';

export default function Footer() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-[#0F172A] text-gray-300 relative overflow-hidden">
      {/* Decorative bg */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-indigo-600/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] rounded-full bg-violet-600/5 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '60px 60px' }}
        />
      </div>

      {/* CTA Banner */}
      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-black text-white mb-1">Ready to skip the queue?</h3>
              <p className="text-gray-400 text-sm">Join SmartQueue for free and never wait in a physical line again.</p>
            </div>
            <Link href="/register" className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-indigo-900/30 group">
              <Zap size={16} className="text-amber-300" />
              Get Started Free
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#4F46E5] flex items-center justify-center shadow-lg shadow-indigo-900/50">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  <path d="M9 14l2 2 4-4" />
                </svg>
              </div>
              <span className="text-xl font-black">
                <span className="text-[#818CF8]">Smart</span>
                <span className="text-white">Queue</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              The intelligent queue management platform. Book tokens remotely, track in real-time, and never wait in a physical line again.
            </p>

            {/* Social */}
            <div className="flex gap-2.5">
              {[
                { icon: <Globe size={16} />, label: 'Website' },
                { icon: <Code2 size={16} />, label: 'GitHub' },
                { icon: <MessageCircle size={16} />, label: 'Twitter' },
                { icon: <Briefcase size={16} />, label: 'LinkedIn' },
              ].map((s, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-[#6366F1] hover:border-[#6366F1] flex items-center justify-center transition-all duration-300 group"
                >
                  <span className="text-gray-400 group-hover:text-white transition-colors">{s.icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Product</h3>
            <ul className="space-y-3">
              {[
                { href: '/', label: 'Home' },
                { href: '/locations', label: 'Find Locations' },
                { href: '/about', label: 'About Us' },
                { href: '/contact', label: 'Contact' },
                { href: '/register', label: 'Get Started Free' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-[#818CF8] transition-colors duration-200 flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-[#6366F1] transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h3 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Solutions</h3>
            <ul className="space-y-3">
              {[
                'Hospital Queue',
                'Clinic Management',
                'Bank Queue',
                'Government Offices',
                'Corporate Offices',
              ].map(item => (
                <li key={item}>
                  <span className="text-sm text-gray-400 hover:text-[#818CF8] transition-colors duration-200 cursor-pointer flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-[#6366F1] transition-colors" />
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Get in Touch</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#6366F1]/20 flex items-center justify-center flex-shrink-0">
                  <Mail size={14} className="text-[#818CF8]" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Email</p>
                  <span className="text-sm text-gray-400">vijay931111@gmail.com</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#6366F1]/20 flex items-center justify-center flex-shrink-0">
                  <Phone size={14} className="text-[#818CF8]" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Phone</p>
                  <span className="text-sm text-gray-400">+91 6201135206</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#6366F1]/20 flex items-center justify-center flex-shrink-0">
                  <MapPin size={14} className="text-[#818CF8]" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Location</p>
                  <span className="text-sm text-gray-400">Vikash Nagar, Hazaribagh, India</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            © {year ?? ''} SmartQueue Technologies. All rights reserved.
          </p>
          <div className="flex gap-5">
            <a href="#" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Terms of Service</a>
            <a href="#" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
