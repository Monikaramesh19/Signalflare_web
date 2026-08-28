import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'VICTIM' | 'VOLUNTEER' | 'RESCUE' | 'ADMIN';
  volunteer?: {
    id: string;
    status: string;
    skills: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => Promise<void>;
  updateCachedUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user session from local storage (including offline cache)
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('signalflare_token');
      const cachedUser = localStorage.getItem('signalflare_user');

      if (storedToken) {
        setToken(storedToken);
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
        }

        try {
          // If online, refresh user profile from api
          if (navigator.onLine) {
            const response = await api.get('/auth/me');
            setUser(response.data);
            localStorage.setItem('signalflare_user', JSON.stringify(response.data));
          }
        } catch (err) {
          console.warn('Could not refresh user session (offline or session expired)');
          // If 401 Unauthorized, clear session
          if (err instanceof Error && err.message.includes('401')) {
            localStorage.removeItem('signalflare_token');
            localStorage.removeItem('signalflare_user');
            setToken(null);
            setUser(null);
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: newToken, user: newUser } = response.data;

      localStorage.setItem('signalflare_token', newToken);
      localStorage.setItem('signalflare_user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
      return newUser;
    } catch (err: any) {
      // Offline fallback check: if offline, check if matches cached user email
      const cachedUserJson = localStorage.getItem('signalflare_user');
      if (!navigator.onLine && cachedUserJson) {
        const cachedUser = JSON.parse(cachedUserJson) as User;
        if (cachedUser.email === email) {
          // Simulate offline login (for demo purposes)
          setUser(cachedUser);
          setToken('offline_token');
          return cachedUser;
        }
      }
      throw err;
    }
  };

  const register = async (data: any) => {
    const response = await api.post('/auth/register', data);
    const { token: newToken, user: newUser } = response.data;

    localStorage.setItem('signalflare_token', newToken);
    localStorage.setItem('signalflare_user', JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const logout = async () => {
    try {
      if (navigator.onLine && token && token !== 'offline_token') {
        await api.post('/auth/logout');
      }
    } catch (err) {
      console.error('Logout API warning:', err);
    } finally {
      localStorage.removeItem('signalflare_token');
      localStorage.removeItem('signalflare_user');
      setToken(null);
      setUser(null);
    }
  };

  const updateCachedUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('signalflare_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, updateCachedUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
