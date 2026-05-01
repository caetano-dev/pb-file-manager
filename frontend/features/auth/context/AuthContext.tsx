'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setUser({ email: localStorage.getItem('email') || '' });
    }
    setLoading(false);
  }, []);

  const login = async (token: string) => {
    localStorage.setItem('token', token);
    
    try {
      const data = await apiFetch('/auth/me', { method: 'GET' }); 
      
      localStorage.setItem('email', data.email);
      setUser({ email: data.email });
      queryClient.clear();
    } catch (error) {
      console.error("Failed to fetch user profile", error);
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    setUser(null);
    queryClient.clear();
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
