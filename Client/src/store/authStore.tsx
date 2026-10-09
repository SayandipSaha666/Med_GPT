import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { T_User } from '../types/auth';
import { ApiService } from '../api/api.service';

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
    console.log('[AuthStore] Setting user:', newUser);
    setUserState(newUser);
  };

  // Use useGetMe from auth service to fetch user on load
  const { data: meData, isLoading: meLoading, isSuccess } = ApiService.auth.useGetMe();

  // Update user state when meData changes
  useEffect(() => {
    if (isSuccess && meData && meData.success) {
      console.log('[AuthStore] Retrieved user from server:', meData.data);
      setUserState(meData.data);
      setIsLoading(false);
    } else if (!meLoading) {
      // If no token or error, set loading to false with null user
      console.log('[AuthStore] No token or user not loaded, user:', user);
      setIsLoading(false);
    }
  }, [meData, meLoading, isSuccess]);

  // Log when component mounts
  console.log('[AuthStore] AuthProvider mounted, current user:', user, 'isLoading:', isLoading);

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
