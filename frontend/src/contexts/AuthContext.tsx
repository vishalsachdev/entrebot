import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types';
import { apiClient } from '../services/api';

// Re-export for backward compatibility
export type { User };

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toFriendlyAuthMessage = (error: unknown, fallback: string): string => {
  const raw =
    error instanceof Error && error.message ? error.message : fallback;
  const lower = raw.toLowerCase();

  if (lower.includes('email rate limit exceeded')) {
    return 'Too many sign-up attempts right now. Please wait a minute and try again.';
  }

  if (lower.includes('email not confirmed')) {
    return 'Your email is not verified yet. Please check your inbox and confirm your email, then sign in.';
  }

  if (lower.includes('invalid login credentials')) {
    return 'Invalid email or password. Please try again.';
  }

  return raw;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Internal navigation wrapper
interface NavigationHelper {
  navigateTo: (path: string) => void;
  replace: (path: string) => void;
}

const useAuthNavigation = (): NavigationHelper => {
  const navigate = useNavigate();

  return {
    navigateTo: (path: string) => {
      try {
        navigate(path);
      } catch {
        // Fallback to window.location if navigate fails
        console.warn('Navigation hook failed, using window.location');
        window.location.href = path;
      }
    },
    replace: (path: string) => {
      try {
        navigate(path, { replace: true });
      } catch {
        console.warn('Navigation hook failed, using window.location');
        window.location.replace(path);
      }
    },
  };
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { replace } = useAuthNavigation();
  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const clearLocalAuth = () => {
        apiClient.clearToken();
        localStorage.removeItem('user');
        setUser(null);
      };

      try {
        const token = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
          apiClient.setToken(token);

          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
              const appUser: User = {
                id: data.user.id,
                email: data.user.email,
                name: data.user.name,
                createdAt: data.user.created_at,
              };
              localStorage.setItem('user', JSON.stringify(appUser));
              setUser(appUser);
              return;
            }
          }

          // Only clear on auth failures; preserve session for transient backend failures.
          if (response.status === 401 || response.status === 403) {
            clearLocalAuth();
          } else {
            const cachedUser: User = JSON.parse(storedUser);
            setUser(cachedUser);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const cachedUser: User = JSON.parse(storedUser);
            setUser(cachedUser);
          } catch {
            clearLocalAuth();
          }
        } else {
          clearLocalAuth();
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [API_BASE_URL]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setIsLoading(true);

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Login failed');
        }

        const token = data.session?.access_token;
        if (!token) {
          throw new Error('Login did not return an access token');
        }

        const backendUser = data.user;
        const appUser: User = {
          id: backendUser.id,
          email: backendUser.email,
          name: backendUser.name,
          createdAt: backendUser.created_at,
        };

        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(appUser));
        apiClient.setToken(token);
        setUser(appUser);

        replace('/');
      } catch (error) {
        console.error('Login failed:', error);
        throw new Error(
          toFriendlyAuthMessage(
            error,
            'Login failed. Please check your credentials and try again.'
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [API_BASE_URL, replace]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      try {
        setIsLoading(true);

        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Registration failed');
        }

        if (data.requires_email_verification || !data.session?.access_token) {
          throw new Error(
            'Registration successful. Please verify your email before signing in.'
          );
        }

        const token = data.session.access_token;
        const backendUser = data.user;
        const appUser: User = {
          id: backendUser.id,
          email: backendUser.email,
          name: backendUser.name || name,
          createdAt: backendUser.created_at,
        };

        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(appUser));
        apiClient.setToken(token);
        setUser(appUser);

        replace('/');
      } catch (error) {
        console.error('Registration failed:', error);
        throw new Error(
          toFriendlyAuthMessage(error, 'Registration failed. Please try again.')
        );
      } finally {
        setIsLoading(false);
      }
    },
    [API_BASE_URL, replace]
  );

  const logout = useCallback(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {
        // Best-effort logout call; local cleanup is authoritative for client session.
      });
    }

    apiClient.clearToken();
    localStorage.removeItem('user');
    setUser(null);
    // Use safe navigation
    replace('/login');
  }, [API_BASE_URL, replace]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(currentUser => {
      if (currentUser) {
        const updatedUser = { ...currentUser, ...updates };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
      }
      return currentUser;
    });
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      updateUser,
    }),
    [user, isLoading, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
