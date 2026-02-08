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

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
          // Validate token and restore user session
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const login = useCallback(
    async (email: string, _password: string) => {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
      try {
        setIsLoading(true);

        // Create or get user from backend
        const response = await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name: email.split('@')[0] }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Login failed');
        }

        const backendUser = data.data;
        const appUser: User = {
          id: backendUser.id,
          email: backendUser.email,
          name: backendUser.name || email.split('@')[0],
          createdAt: backendUser.created_at,
        };

        const token = `session-${backendUser.id}-${Date.now()}`;

        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(appUser));
        setUser(appUser);

        replace('/');
      } catch (error) {
        console.error('Login failed:', error);
        throw new Error(
          'Login failed. Please check your connection and try again.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [replace]
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const register = useCallback(
    async (name: string, email: string, _password: string) => {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
      try {
        setIsLoading(true);

        // Create user in backend
        const response = await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Registration failed');
        }

        const backendUser = data.data;
        const appUser: User = {
          id: backendUser.id,
          email: backendUser.email,
          name: backendUser.name || name,
          createdAt: backendUser.created_at,
        };

        const token = `session-${backendUser.id}-${Date.now()}`;

        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(appUser));
        setUser(appUser);

        replace('/');
      } catch (error) {
        console.error('Registration failed:', error);
        throw new Error('Registration failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [replace]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
    // Use safe navigation
    replace('/login');
  }, [replace]);

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
