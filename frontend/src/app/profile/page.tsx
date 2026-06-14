'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ToastProvider';
import { authService } from '@/services/auth.service';
import { getInitials, resolveAvatarUrl } from '@/lib/avatar';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Shield,
  Building2,
  Calendar,
  Save,
  Loader2,
  Camera,
} from 'lucide-react';

type ProfileData = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: 'user' | 'admin' | 'organization';
  type?: string | null;
  avatar_url?: string | null;
  avatarUrl?: string | null;
  created_at?: string;
};

function roleLabel(role: ProfileData['role']) {
  if (role === 'admin') return 'Administrator';
  if (role === 'organization') return 'Service Provider';
  return 'User';
}

function roleBadgeClass(role: ProfileData['role']) {
  if (role === 'admin') return 'bg-indigo-100 text-indigo-800 border-indigo-200';
  if (role === 'organization') return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-emerald-100 text-emerald-800 border-emerald-200';
}

function dashboardHref(role: ProfileData['role']) {
  if (role === 'admin') return '/admin';
  if (role === 'organization') return '/org/dashboard';
  return '/dashboard';
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, updateUser } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.getProfile();
      const data = res.data.data as ProfileData;

      // Guard against wrong account when user/org IDs collide across tables
      const sessionEmail = user?.email?.trim().toLowerCase();
      const profileEmail = data.email?.trim().toLowerCase();
      if (sessionEmail && profileEmail && sessionEmail !== profileEmail) {
        setError('Profile data does not match your signed-in account. Please sign out and sign in again.');
        return;
      }

      setProfile(data);
      setName(data.name || '');
      setPhone(data.phone || '');
      setAvatarPreview(resolveAvatarUrl(data.avatarUrl || data.avatar_url));
      updateUser({
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        avatarUrl: data.avatarUrl || data.avatar_url || undefined,
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load profile.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.email, updateUser]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    loadProfile();
  }, [authLoading, isAuthenticated, loadProfile, router, user?.email]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file (JPEG, PNG, WebP, or GIF).', 'warning');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be 2 MB or smaller.', 'warning');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const res = await authService.uploadAvatar(file);
      const updated = res.data.data as ProfileData;
      const avatarUrl = updated.avatarUrl || updated.avatar_url;
      setProfile(updated);
      setAvatarPreview(`${resolveAvatarUrl(avatarUrl)}?v=${Date.now()}`);
      updateUser({ avatarUrl: avatarUrl || undefined });
      showToast(res.data.message || 'Profile photo updated.', 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to upload photo.', 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      showToast('Name must be at least 2 characters.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const payload =
        profile?.role === 'organization'
          ? { name: trimmedName }
          : { name: trimmedName, phone: phone.trim() || undefined };

      const res = await authService.updateProfile(payload);
      const updated = res.data.data as ProfileData;
      setProfile(updated);
      setName(updated.name);
      setPhone(updated.phone || '');
      updateUser({
        name: updated.name,
        phone: updated.phone || undefined,
        email: updated.email,
      });
      showToast(res.data.message || 'Profile updated successfully.', 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to update profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || (!isAuthenticated && !error)) {
    return (
      <div className="min-h-screen bg-hero-gradient pt-24 flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
      </div>
    );
  }

  const displayRole = profile?.role || user?.role || 'user';
  const backHref = dashboardHref(displayRole as ProfileData['role']);
  const headerAvatar =
    avatarPreview || resolveAvatarUrl(user?.avatarUrl) || null;
  const displayName = profile?.name || user?.name || '?';

  return (
    <div className="min-h-screen bg-hero-gradient pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors mb-6"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-indigo-100/40 overflow-hidden">
          {/* Header */}
          <div className="px-6 sm:px-8 py-8 bg-gradient-to-br from-[#6366F1] via-[#4F46E5] to-[#3730A3] text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/30 blur-2xl" />
              <div className="absolute -bottom-8 left-10 w-32 h-32 rounded-full bg-indigo-300/30 blur-2xl" />
            </div>
            <div className="relative flex items-center gap-5">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center text-2xl font-black shadow-lg overflow-hidden">
                  {headerAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={headerAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(displayName)
                  )}
                </div>
                <label
                  className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white text-[var(--primary)] flex items-center justify-center shadow-md cursor-pointer hover:bg-indigo-50 transition-colors ${isUploadingAvatar ? 'opacity-60 pointer-events-none' : ''}`}
                  title="Upload photo"
                >
                  {isUploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                  />
                </label>
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-black truncate">{displayName}</h1>
                <p className="text-indigo-200 text-sm mt-1 truncate">{profile?.email || user?.email}</p>
                <span
                  className={`inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border ${roleBadgeClass(displayRole as ProfileData['role'])}`}
                >
                  {displayRole === 'admin' && <Shield size={12} />}
                  {displayRole === 'organization' && <Building2 size={12} />}
                  {displayRole === 'user' && <User size={12} />}
                  {roleLabel(displayRole as ProfileData['role'])}
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-6 sm:p-8">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-[var(--text-secondary)]">
                <Loader2 className="animate-spin mr-2" size={20} /> Loading profile…
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <button type="button" onClick={loadProfile} className="btn-primary !py-2.5 !px-5">
                  Try Again
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="relative shrink-0 mx-auto sm:mx-0">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#6366F1] to-[#818CF8] flex items-center justify-center text-3xl font-bold text-white overflow-hidden shadow-lg">
                      {headerAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={headerAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        getInitials(displayName)
                      )}
                    </div>
                    <label
                      className={`absolute bottom-0 right-0 w-9 h-9 rounded-full bg-white border-2 border-gray-100 text-[var(--primary)] flex items-center justify-center shadow-md cursor-pointer hover:bg-indigo-50 ${isUploadingAvatar ? 'opacity-60 pointer-events-none' : ''}`}
                    >
                      {isUploadingAvatar ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="sr-only"
                        onChange={handleAvatarUpload}
                        disabled={isUploadingAvatar}
                      />
                    </label>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="font-semibold text-[var(--secondary)]">Profile Photo</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      Upload a photo (JPEG, PNG, WebP, or GIF). Max 2 MB.
                    </p>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[var(--secondary)]">Account Details</h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Update your display name{profile?.role !== 'organization' ? ' and contact phone' : ''}.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label htmlFor="profile-name" className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                      <input
                        id="profile-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input w-full !pl-10"
                        placeholder="Your name"
                        required
                        minLength={2}
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="profile-email" className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                      <input
                        id="profile-email"
                        type="email"
                        value={profile?.email || user?.email || ''}
                        readOnly
                        className="input w-full !pl-10 bg-gray-50 text-[var(--text-muted)] cursor-not-allowed"
                      />
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1.5">Email cannot be changed from this page.</p>
                  </div>

                  {profile?.role !== 'organization' && (
                    <div className="sm:col-span-2">
                      <label htmlFor="profile-phone" className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
                        Phone Number <span className="font-normal text-[var(--text-muted)]">(optional)</span>
                      </label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input
                          id="profile-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="input w-full !pl-10"
                          placeholder="+1 234 567 8900"
                        />
                      </div>
                    </div>
                  )}

                  {profile?.role === 'organization' && profile.type && (
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
                        Organization Type
                      </label>
                      <div className="relative">
                        <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input
                          type="text"
                          value={profile.type}
                          readOnly
                          className="input w-full !pl-10 bg-gray-50 text-[var(--text-muted)] cursor-not-allowed capitalize"
                        />
                      </div>
                    </div>
                  )}

                  {profile?.created_at && (
                    <div className="sm:col-span-2 flex items-center gap-2 text-sm text-[var(--text-muted)] pt-1">
                      <Calendar size={14} />
                      Member since {new Date(profile.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
                  <button type="submit" disabled={isSaving} className="btn-primary !py-3 !px-6 flex items-center gap-2">
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {isSaving ? 'Saving…' : 'Save Changes'}
                  </button>
                  <Link href={backHref} className="btn-secondary !py-3 !px-6">
                    Cancel
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
