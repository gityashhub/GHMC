import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService, { User, LoginCredentials } from '@/services/auth.service';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is already logged in on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = authService.getUser();
      const token = authService.getToken();

      if (storedUser && token) {
        try {
          // Verify token is still valid by fetching current user
          const currentUser = await authService.getMe();
          setUser(currentUser);
        } catch (error) {
          // Token invalid, clear auth
          authService.clearAuth();
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials);
      authService.setAuth(response.token, response.user);
      setUser(response.user);
      toast.success('Login successful');
      if (response.user.role === 'admin') {
        navigate('/');
      } else {
        navigate('/companies');
      }
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      authService.clearAuth();
      setUser(null);
      toast.success('Logged out successfully');
      navigate('/login');
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    authService.setAuth(authService.getToken()!, updatedUser);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

