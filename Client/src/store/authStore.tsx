import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { T_User } from '../types/auth';
import { ApiService } from '../api/api.service';
import broadcastChannel from '../lib/broadcastChannel';
import { useQueryClient } from '@tanstack/react-query';
import type { T_Api_Success_Res } from '../api/api.types';

interface IAuthContext {
  user: T_User | null;
  setUser: (user: T_User | null) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

const AuthContext = createContext<IAuthContext | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUserState] = useState<T_User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setUser = (newUser: T_User | null) => {
    const normalized = newUser ? { ...newUser, id: String(newUser.id), credits: Number(newUser.credits) } : null;
    setUserState(normalized);
    if (normalized) queryClient.setQueryData<T_Api_Success_Res<T_User>>(['getMe'], { success: true, data: normalized });
    else queryClient.removeQueries({ queryKey: ['getMe'] });
  };

  // Use useGetMe from auth service to fetch user on load
  const { data: meData, isLoading: meLoading, isSuccess } = ApiService.auth.useGetMe();

  // Update user state when meData changes
  useEffect(() => {
    if (isSuccess && meData && meData.success) {
      setUserState({ ...meData.data, id: String(meData.data.id), credits: Number(meData.data.credits) });
      setIsLoading(false);
    } else if (!meLoading) {
      setIsLoading(false);
    }
  }, [meData, meLoading, isSuccess]);

  useEffect(() => {
    broadcastChannel.setUserId(user ? String(user.id) : null);
  }, [user?.id]);

  // Listen for credit updates from other tabs
  useEffect(() => {
    const unsubscribe = broadcastChannel.onCreditUpdate((credits) => {
      setUserState((prevUser) => (prevUser ? { ...prevUser, credits } : null));
      queryClient.setQueryData<T_Api_Success_Res<T_User>>(['getMe'], (previous) =>
        previous ? { ...previous, data: { ...previous.data, credits } } : previous
      );
    });
    return () => unsubscribe();
  }, [queryClient]);

  // Broadcast credit changes to other tabs when user state changes
  useEffect(() => {
    if (user?.credits !== undefined) {
      broadcastChannel.sendCreditUpdate(Number(user.credits));
    }
  }, [user?.credits]);

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, setIsLoading }}>
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
