import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // TODO: Replace with actual API call
      // Simulating API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock successful login
      const mockUser: User = {
        id: '1',
        email,
        name: email.split('@')[0],
        createdAt: new Date().toISOString(),
      };

      const mockToken = 'mock-jwt-token-' + Date.now();

      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      setUser(mockUser);

      window.location.href = '/';
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);

      // TODO: Replace with actual API call
      // Simulating API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock successful registration
      const mockUser: User = {
        id: '1',
        email,
        name,
        createdAt: new Date().toISOString(),
      };

      const mockToken = 'mock-jwt-token-' + Date.now();

      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      setUser(mockUser);

      window.location.href = '/';
    } catch (error) {
      console.error('Registration failed:', error);
      throw new Error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
