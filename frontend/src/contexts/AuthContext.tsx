import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import type { User } from '../types';
import { apiClient } from '../services/api';
import {
  isSupabaseConfigured,
  missingSupabaseConfigMessage,
  supabase,
} from '../lib/supabase';

// Re-export for backward compatibility
export type { User };

const ILLINOIS_DOMAIN = 'illinois.edu';
const AUTH_SETUP_ERROR = `Authentication is unavailable. ${missingSupabaseConfigMessage}`;

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithIllinoisEmail: (email: string) => Promise<void>;
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

  if (lower.includes('@illinois.edu') || lower.includes('illinois')) {
    return `Only @${ILLINOIS_DOMAIN} email addresses are allowed.`;
  }

  if (lower.includes('email rate limit exceeded')) {
    return 'Too many authentication attempts right now. Please wait a minute and try again.';
  }

  if (lower.includes('email not confirmed')) {
    return 'Your email is not verified yet. Please check your inbox and confirm your email, then sign in.';
  }

  if (lower.includes('invalid login credentials')) {
    return 'Invalid email or password. Please try again.';
  }

  return raw;
};

const isValidIllinoisEmail = (email?: string | null): boolean =>
  !!email && email.toLowerCase().endsWith(`@${ILLINOIS_DOMAIN}`);

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
  const isMountedRef = useRef(true);

  const clearLocalAuth = useCallback(() => {
    apiClient.clearToken();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('venturebot_session_id');
    if (isMountedRef.current) {
      setUser(null);
    }
  }, []);

  const hydrateAppUser = useCallback(
    async (session: Session, options?: { redirectOnSuccess?: boolean }) => {
      const email = session.user?.email || null;
      if (!isValidIllinoisEmail(email)) {
        if (supabase) {
          await supabase.auth.signOut();
        }
        clearLocalAuth();
        throw new Error(
          `Only @${ILLINOIS_DOMAIN} email addresses are allowed.`
        );
      }

      const token = session.access_token;
      localStorage.setItem('auth_token', token);
      apiClient.setToken(token);

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          if (supabase) {
            await supabase.auth.signOut();
          }
          clearLocalAuth();
        } else {
          const cached = localStorage.getItem('user');
          if (cached && isMountedRef.current) {
            setUser(JSON.parse(cached) as User);
          }
        }
        return;
      }

      const data = await response.json();
      if (!data.success || !data.user) {
        throw new Error('Failed to load user profile.');
      }

      const appUser: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name || data.user.email.split('@')[0],
        createdAt: data.user.created_at,
      };

      localStorage.setItem('user', JSON.stringify(appUser));
      if (isMountedRef.current) {
        setUser(appUser);
      }

      if (options?.redirectOnSuccess) {
        replace('/');
      }
    },
    [API_BASE_URL, clearLocalAuth, replace]
  );

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase || !isSupabaseConfigured) {
        clearLocalAuth();
        setIsLoading(false);
        return;
      }

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (session) {
          await hydrateAppUser(session);
        } else {
          clearLocalAuth();
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
  }, [clearLocalAuth, hydrateAppUser]);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      void (async () => {
        try {
          if (event === 'SIGNED_OUT' || !session) {
            clearLocalAuth();
            if (isMountedRef.current) {
              setIsLoading(false);
            }
            return;
          }

          if (event === 'SIGNED_IN') {
            await hydrateAppUser(session, { redirectOnSuccess: true });
          } else if (event === 'TOKEN_REFRESHED') {
            await hydrateAppUser(session);
          }
        } catch (error) {
          console.error('Auth state update failed:', error);
        } finally {
          if (isMountedRef.current) {
            setIsLoading(false);
          }
        }
      })();
    });

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [clearLocalAuth, hydrateAppUser]);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase || !isSupabaseConfigured) {
      throw new Error(AUTH_SETUP_ERROR);
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: { hd: ILLINOIS_DOMAIN },
          redirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      setIsLoading(false);
      throw new Error(
        toFriendlyAuthMessage(error, 'Failed to start Google sign in.')
      );
    }
  }, []);

  const signInWithIllinoisEmail = useCallback(async (email: string) => {
    if (!supabase || !isSupabaseConfigured) {
      throw new Error(AUTH_SETUP_ERROR);
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidIllinoisEmail(normalizedEmail)) {
      throw new Error(`Only @${ILLINOIS_DOMAIN} email addresses are allowed.`);
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      throw new Error(
        toFriendlyAuthMessage(error, 'Failed to send magic link.')
      );
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      void password;
      // Backward compatibility: treat login as magic-link initiation.
      await signInWithIllinoisEmail(email);
    },
    [signInWithIllinoisEmail]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      void name;
      void password;
      // Backward compatibility: treat register as magic-link initiation.
      await signInWithIllinoisEmail(email);
    },
    [signInWithIllinoisEmail]
  );

  const logout = useCallback(() => {
    void (async () => {
      try {
        if (supabase) {
          await supabase.auth.signOut();
        }
      } catch (error) {
        console.error('Sign out failed:', error);
      } finally {
        clearLocalAuth();
        replace('/login');
      }
    })();
  }, [clearLocalAuth, replace]);

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
      signInWithGoogle,
      signInWithIllinoisEmail,
      login,
      register,
      logout,
      updateUser,
    }),
    [
      user,
      isLoading,
      signInWithGoogle,
      signInWithIllinoisEmail,
      login,
      register,
      logout,
      updateUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
