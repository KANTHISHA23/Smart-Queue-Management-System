'use client';

/**
 * Navbar Component — Premium glassmorphism nav with notifications & profile
 */
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Menu, X, Bell, ChevronDown, LogOut, LayoutDashboard,
  History, Shield, Sparkles, Zap, User
} from 'lucide-react';
import { notificationService } from '@/services/notification.service';
import { getInitials, resolveAvatarUrl } from '@/lib/avatar';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, isOrganization, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchUnread = async () => {
        try {
          const res = await notificationService.getAll({ unread_only: 'true' });
          setUnreadCount(res.data.data.unreadCount);
        } catch (e) { /* silent */ }
      };
      fetchUnread();
      const interval = setInterval(fetchUnread, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
  }, [pathname]);

  const isAdminPage = pathname?.startsWith('/admin');
  const isOrgPage = pathname?.startsWith('/org');

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/locations', label: 'Locations' },
    { href: '/track', label: 'Track Token' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname?.startsWith(href);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled || isAdminPage || mobileMenuOpen
          ? 'bg-white/90 backdrop-blur-2xl shadow-lg shadow-indigo-100/40 border-b border-white/60'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-18">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#4F46E5] flex items-center justify-center shadow-lg shadow-indigo-300/50 group-hover:shadow-indigo-400/60 transition-all duration-300 group-hover:scale-105">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <path d="M9 14l2 2 4-4" />
              </svg>
            </div>
            <div className="flex items-baseline gap-0">
              <span className="text-xl font-black text-[var(--primary)]">Smart</span>
              <span className="text-xl font-black text-[var(--secondary)]">Queue</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive(link.href)
                    ? 'text-[var(--primary)] bg-[var(--primary-50)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-gray-50'
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--primary)]" />
                )}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* Notifications Bell */}
                <Link
                  href="/notifications"
                  className="relative p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--primary-50)] transition-all group"
                >
                  <Bell size={19} className="group-hover:animate-bounce-in" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 bg-gradient-to-br from-red-500 to-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-md shadow-red-200 animate-bounce-in">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 border ${
                      profileMenuOpen
                        ? 'bg-[var(--primary-50)] border-[var(--primary-100)]'
                        : 'border-transparent hover:bg-gray-50 hover:border-gray-100'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366F1] to-[#818CF8] flex items-center justify-center text-white text-sm font-bold shadow-md shadow-indigo-200 overflow-hidden">
                      {resolveAvatarUrl(user?.avatarUrl) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={resolveAvatarUrl(user?.avatarUrl)!} alt="" className="w-full h-full object-cover" />
                      ) : (
                        getInitials(user?.name)
                      )}
                    </div>
                    <div className="text-left hidden lg:block">
                      <p className="text-sm font-semibold text-[var(--text-primary)] max-w-[100px] truncate leading-tight">{user?.name}</p>
                      {isAdmin && <p className="text-[10px] text-[var(--primary)] font-bold">Admin</p>}
                      {isOrganization && <p className="text-[10px] text-amber-600 font-bold">Provider</p>}
                    </div>
                    <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform duration-300 ${profileMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-3 w-60 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-indigo-100/50 border border-gray-100/80 z-50 py-2 animate-fade-in-down overflow-hidden">
                        {/* User info */}
                        <div className="px-4 py-3 bg-gradient-to-br from-[var(--primary-50)] to-[var(--primary-100)] mx-2 rounded-xl mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6366F1] to-[#818CF8] flex items-center justify-center text-white font-bold text-sm shadow-md overflow-hidden">
                              {resolveAvatarUrl(user?.avatarUrl) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={resolveAvatarUrl(user?.avatarUrl)!} alt="" className="w-full h-full object-cover" />
                              ) : (
                                getInitials(user?.name)
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[var(--text-primary)] truncate">{user?.name}</p>
                              <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
                            </div>
                          </div>
                        </div>

                        <Link
                          href="/profile"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--primary-50)] hover:text-[var(--primary)] transition-colors rounded-lg mx-1"
                        >
                          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                            <User size={14} />
                          </div>
                          Profile
                        </Link>
                        <Link
                          href={isOrganization ? "/org/dashboard" : "/dashboard"}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--primary-50)] hover:text-[var(--primary)] transition-colors rounded-lg mx-1"
                        >
                          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                            <LayoutDashboard size={14} />
                          </div>
                          Dashboard
                        </Link>
                        {!isOrganization && !isAdmin && (
                          <Link href="/history" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--primary-50)] hover:text-[var(--primary)] transition-colors rounded-lg mx-1">
                            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                              <History size={14} />
                            </div>
                            Booking History
                          </Link>
                        )}
                        {isAdmin && (
                          <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--primary-50)] hover:text-[var(--primary)] transition-colors rounded-lg mx-1">
                            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Shield size={14} />
                            </div>
                            Admin Panel
                          </Link>
                        )}
                        <div className="h-px bg-gray-100 mx-4 my-1" />
                        <button
                          onClick={logout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full rounded-lg mx-1"
                        >
                          <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                            <LogOut size={14} />
                          </div>
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-5 py-2.5 text-sm font-semibold text-[var(--text-secondary)] rounded-xl hover:bg-gray-100 transition-all duration-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/org/register"
                  className="px-5 py-2.5 text-sm font-semibold text-[var(--primary)] border-2 border-[var(--primary-200)] rounded-xl hover:bg-[var(--primary-50)] hover:border-[var(--primary)] transition-all duration-200"
                >
                  Provider Sign Up
                </Link>
                <Link
                  href="/register"
                  className="btn-primary text-sm !py-2.5 !px-5"
                >
                  <Zap size={15} />
                  Get Token
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 rounded-xl text-[var(--text-secondary)] hover:bg-gray-100 transition-all"
            aria-label="Toggle menu"
          >
            <div className={`transition-transform duration-300 ${mobileMenuOpen ? 'rotate-90' : ''}`}>
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-2xl shadow-indigo-100/40 animate-fade-in">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  isActive(link.href)
                    ? 'text-[var(--primary)] bg-[var(--primary-50)]'
                    : 'text-[var(--text-secondary)] hover:bg-gray-50'
                }`}
              >
                {link.label}
                {isActive(link.href) && <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />}
              </Link>
            ))}

            {isAuthenticated ? (
              <>
                <div className="h-px bg-gray-100 my-2" />
                {/* User info */}
                <div className="flex items-center gap-3 px-4 py-3 bg-[var(--primary-50)] rounded-xl mb-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6366F1] to-[#818CF8] flex items-center justify-center text-white font-bold overflow-hidden">
                    {resolveAvatarUrl(user?.avatarUrl) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={resolveAvatarUrl(user?.avatarUrl)!} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(user?.name)
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[var(--secondary)]">{user?.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{user?.email}</p>
                  </div>
                </div>
                <Link href="/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[var(--text-secondary)] hover:bg-gray-50">
                  <User size={16} /> Profile
                </Link>
                <Link href={isOrganization ? "/org/dashboard" : "/dashboard"} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[var(--text-secondary)] hover:bg-gray-50">
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                {!isOrganization && !isAdmin && (
                  <Link href="/history" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[var(--text-secondary)] hover:bg-gray-50">
                    <History size={16} /> Booking History
                  </Link>
                )}
                {isAdmin && (
                  <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[var(--text-secondary)] hover:bg-gray-50">
                    <Shield size={16} /> Admin Panel
                  </Link>
                )}
                <button onClick={logout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 w-full transition-colors">
                  <LogOut size={16} /> Sign Out
                </button>
              </>
            ) : (
              <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                <Link href="/login" className="text-center px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  Sign In
                </Link>
                <Link href="/org/register" className="text-center px-4 py-3 text-sm font-semibold text-[var(--primary)] border-2 border-[var(--primary-200)] rounded-xl hover:bg-[var(--primary-50)] transition-colors">
                  Provider Sign Up
                </Link>
                <Link href="/register" className="btn-primary text-sm !py-3 justify-center">
                  <Zap size={15} /> Get Token Free
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
