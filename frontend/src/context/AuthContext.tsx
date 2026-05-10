import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  login as loginService,
  logout as logoutService,
  getAccessToken,
  clearTokens,
  getMe,
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
    const initAuth = async () => {
      const token = getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const userData = await getMe();
        setUser(userData);
      } catch {
        clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
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