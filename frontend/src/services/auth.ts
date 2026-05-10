import api from './api';

// --- Types ---
export interface LoginCredentials {
  student_id: string;
  password: string;
}

export interface RegisterData {
  student_id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  program: string;
  year_level: number;
  house_id: number;
}

export interface AuthUser {
  id: number;
  student_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'STUDENT' | 'FACILITATOR' | 'ORGANIZER' | 'HOUSE_LEADER' | 'ADMIN';
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

// --- Token helpers ---
export const saveTokens = (tokens: AuthTokens): void => {
  localStorage.setItem('access_token', tokens.access);
  localStorage.setItem('refresh_token', tokens.refresh);
};

export const clearTokens = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem('access_token');
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token');
};

// --- Auth service functions ---
export const login = async (credentials: LoginCredentials): Promise<AuthUser> => {
  const response = await api.post('/auth/login/', credentials);
  const { access, refresh, user } = response.data.data;
  saveTokens({ access, refresh });
  return user;
};

export const register = async (data: RegisterData): Promise<AuthUser> => {
  const response = await api.post('/users/register/', data);
  return response.data.data;
};

export const logout = async (): Promise<void> => {
  const refresh = getRefreshToken();
  if (refresh) {
    await api.post('/auth/logout/', { refresh });
  }
  clearTokens();
};

export const refreshAccessToken = async (): Promise<string> => {
  const refresh = getRefreshToken();
  const response = await api.post('/auth/token/refresh/', { refresh });
  const newAccess = response.data.data.access;
  localStorage.setItem('access_token', newAccess);
  return newAccess;
};