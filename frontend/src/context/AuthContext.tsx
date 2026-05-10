import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  login as loginService,
  logout as logoutService,
  getAccessToken,
} from '../services/auth';
import type { AuthUser, LoginCredentials } from '../services/auth';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // On app load, check if a token already exists
    // This keeps the user logged in after a page refresh
    const token = getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    // Token exists but we don't have user data in memory yet
    // For now we mark as loading done — /api/auth/me/ can be added later
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    const userData = await loginService(credentials);
    setUser(userData);
  };

  const logout = async (): Promise<void> => {
    await logoutService();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};