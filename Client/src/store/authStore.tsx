import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { T_User } from '../types/auth';
import { ApiService } from '../api/api.service';
import broadcastChannel from '../lib/broadcastChannel';

interface IAuthContext {
  user: T_User | null;
  setUser: (user: T_User | null) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

const AuthContext = createContext<IAuthContext | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<T_User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setUser = (newUser: T_User | null) => {
    setUserState(newUser);
  };

  // Use useGetMe from auth service to fetch user on load
  const { data: meData, isLoading: meLoading, isSuccess } = ApiService.auth.useGetMe();

  // Update user state when meData changes
  useEffect(() => {
    if (isSuccess && meData && meData.success) {
      setUserState(meData.data);
      setIsLoading(false);
    } else if (!meLoading) {
      setIsLoading(false);
    }
  }, [meData, meLoading, isSuccess]);

  // Listen for credit updates from other tabs
  useEffect(() => {
    const unsubscribe = broadcastChannel.onCreditUpdate((credits) => {
      setUserState((prevUser) => (prevUser ? { ...prevUser, credits } : null));
    });
    return () => unsubscribe();
  }, []);

  // Broadcast credit changes to other tabs when user state changes
  useEffect(() => {
    if (user?.credits !== undefined) {
      broadcastChannel.sendCreditUpdate(user.credits);
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
