import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from '@/features/auth/api'; 
import type { User, AuthContextType, AuthProviderProps } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps ) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const data = await getCurrentUser();
        setUser({ email: data.email });
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, []);

  const login = async () => {
    try {
      const data = await getCurrentUser();
      setUser({ email: data.email });
      queryClient.clear();
    } catch (error) {
      console.error("Failed to fetch user profile", error);
      logout();
    }
  };

  const logout = () => {
    setUser(null);
    queryClient.clear();
    navigate('/login');
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
