'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  profile_image?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.getUser();
      if (response.success && response.data) {
        setUser(response.data as User);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    if (response.success) {
      await checkAuth();
      router.push('/home');
      return { success: true };
    }
    return { success: false, error: response.error };
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await api.register(name, email, password);
    if (response.success) {
      router.push('/login');
      return { success: true };
    }
    return { success: false, error: response.error };
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    router.push('/login');
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth
  };
}
