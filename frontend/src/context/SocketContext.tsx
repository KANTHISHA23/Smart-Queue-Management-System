'use client';

/**
 * Socket Context Provider
 * Manages Socket.io connection for real-time updates
 */
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from '@/components/ToastProvider';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinQueue: (queueId: number) => void;
  leaveQueue: (queueId: number) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinQueue: () => {},
  leaveQueue: () => {},
});

/** Same host as the API, without `/api` (Socket.io is on the backend origin, not under /api). */
function deriveSocketUrlFromApiUrl(): string | undefined {
  const api = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!api) return undefined;
  return api.replace(/\/api\/?$/i, '');
}

/**
 * Resolve Socket.io base URL. Prefer NEXT_PUBLIC_SOCKET_URL; otherwise derive from NEXT_PUBLIC_API_URL
 * so Vercel only needs one backend URL if the user forgets SOCKET_URL.
 */
function resolveSocketUrl(): string | undefined {
  const explicit = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
  const base = explicit || deriveSocketUrlFromApiUrl();

  // During SSR, avoid reading `window`.
  if (typeof window === 'undefined') return base;

  if (!base) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[Socket] Set NEXT_PUBLIC_API_URL (and optionally NEXT_PUBLIC_SOCKET_URL) for real-time updates.'
      );
    }
    return undefined;
  }

  const host = window.location.hostname;
  const isClientLocal =
    host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '0.0.0.0';

  const envLooksLikeLocalhost =
    base.includes('localhost:5000') ||
    base.includes('127.0.0.1:5000') ||
    base.includes('0.0.0.0:5000');

  if (!isClientLocal && envLooksLikeLocalhost) {
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }

  return base;
}

/** Request browser notification permission once on mount */
function requestBrowserNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

/** Show a browser-level push notification (works when tab is hidden) */
function showBrowserNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, { body, icon: '/favicon.ico' });
    } catch (_) {}
  }
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  // Keep a stable ref so socket event handlers don't capture stale closures
  const showToastRef = useRef(showToast);
  useEffect(() => { showToastRef.current = showToast; }, [showToast]);

  useEffect(() => {
    requestBrowserNotificationPermission();
  }, []);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    const socketUrl = resolveSocketUrl();
    if (!socketUrl) {
      return;
    }

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      // Prevent excessive retry loops from degrading the browser/CPU when the backend is unreachable.
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    newSocket.on('connect', () => {
      console.log('🔌 Socket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', () => {
      // Intentionally quiet to avoid confusing users with transient dev-time failures.
      // Components should rely on API calls for core functionality.
    });

    // ── Pre-Call Notification ──────────────────────────────────────────────
    // Fired by backend when a user's estimated wait drops to ≤10 minutes.
    newSocket.on('pre_call_notification', (data: { tokenNumber: string; message: string }) => {
      const msg = data?.message || `⚡ Your turn for token ${data?.tokenNumber} is coming soon!`;
      showToastRef.current(msg, 'warning');
      showBrowserNotification('⚡ Your Turn Is Near!', msg);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [isAuthenticated, user?.role]);

  const joinQueue = (queueId: number) => {
    if (socket) {
      socket.emit('join-queue', { queueId });
    }
  };

  const leaveQueue = (queueId: number) => {
    if (socket) {
      socket.emit('leave-queue', { queueId });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinQueue, leaveQueue }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
