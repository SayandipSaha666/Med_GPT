import { createContext, useContext, useState, ReactNode } from 'react';
import { T_User } from '../types/auth';

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
