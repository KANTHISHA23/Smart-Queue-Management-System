import { API_BASE_URL } from '@/lib/api';

/** Build browser URL for a stored avatar path or absolute URL. */
export function resolveAvatarUrl(avatarUrl?: string | null): string | null {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) return avatarUrl;
  const path = avatarUrl.startsWith('/') ? avatarUrl : `/${avatarUrl}`;
  return `${API_BASE_URL}${path}`;
}

export function getInitials(name?: string | null): string {
  if (!name) return '?';
  return name.trim().charAt(0).toUpperCase();
}
