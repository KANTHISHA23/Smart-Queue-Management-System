'use client';

/**
 * Auth Context Provider
 * Manages authentication state across the application
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '@/services/auth.service';
import { orgService } from '@/services/org.service';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin' | 'organization';
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOrganization: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<User>;
  loginOrganization: (email: string, password: string) => Promise<User>;
  registerOrganization: (name: string, email: string, password: string, type?: string) => Promise<User>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('accessToken');
        
        if (storedUser && token) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    try {
      const response = await authService.login({
        email: normalizedEmail,
        password: normalizedPassword,
      });
      const { user: userData, accessToken, refreshToken } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      return userData as User;
    } catch (error: any) {
      // If user credentials are valid for organization login,
      // complete auth seamlessly instead of showing a hard 401.
      if (error?.response?.status === 401) {
        const response = await orgService.login({
          email: normalizedEmail,
          password: normalizedPassword,
        });
        const { organization, accessToken, refreshToken } = response.data.data;
        const principal: User = {
          id: organization.id,
          name: organization.name,
          email: organization.email,
          role: 'organization',
        };
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(principal));
        setUser(principal);
        return principal;
      }
      throw error;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, phone?: string) => {
    const response = await authService.register({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      phone: phone?.trim(),
    });
    const { user: userData, accessToken, refreshToken } = response.data.data;
    
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    
    setUser(userData);
    return userData as User;
  }, []);

  const loginOrganization = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    try {
      const response = await orgService.login({
        email: normalizedEmail,
        password: normalizedPassword,
      });
      const { organization, accessToken, refreshToken } = response.data.data;

      const principal: User = {
        id: organization.id,
        name: organization.name,
        email: organization.email,
        role: 'organization',
      };

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(principal));

      setUser(principal);
      return principal;
    } catch (error: any) {
      // Also allow existing user/admin accounts to sign in from org form accidentally.
      if (error?.response?.status === 401) {
        const response = await authService.login({
          email: normalizedEmail,
          password: normalizedPassword,
        });
        const { user: userData, accessToken, refreshToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData as User;
      }
      throw error;
    }
  }, []);

  const registerOrganization = useCallback(async (name: string, email: string, password: string, type?: string) => {
    const response = await orgService.register({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      type: type?.trim(),
    });
    const { organization, accessToken, refreshToken } = response.data.data;

    const principal: User = {
      id: organization.id,
      name: organization.name,
      email: organization.email,
      role: 'organization',
    };

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(principal));

    setUser(principal);
    return principal;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isOrganization: user?.role === 'organization',
        login,
        register,
        loginOrganization,
        registerOrganization,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
