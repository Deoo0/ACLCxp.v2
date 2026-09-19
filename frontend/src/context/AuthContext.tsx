import { queryClient } from "../services/queries";
import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import {
  login as loginService,
  logout as logoutService,
  getAccessToken,
  clearTokens,
  getMe,
} from "../services/auth";
import type { AuthUser, LoginCredentials } from "../services/auth";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const expire = () => {
      clearTokens();
      queryClient.clear();
      setUser(null);
    };
    window.addEventListener("auth:expired", expire);
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
    return () => window.removeEventListener("auth:expired", expire);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<AuthUser> => {
    queryClient.clear();
    await loginService(credentials); // saves tokens, we ignore the returned user
    const freshUser = await getMe(); // fetch authoritative profile
    setUser(freshUser);
    return freshUser;
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const freshUser = await getMe();
      setUser(freshUser);
    } catch {
      clearTokens();
      setUser(null);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);

    try {
      await logoutService();
    } finally {
      clearTokens();
      queryClient.clear();
      setUser(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
