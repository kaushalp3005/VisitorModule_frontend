'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { PersonToMeet } from './types';
import { API_ENDPOINTS } from './api-config';

type AuthUser = {
  username: string;
  email: string;
  name: string;
  id: number;
  ph_no: string | null;
  superuser: boolean;
  admin: boolean;
  is_active: boolean;
  access_token: string;
};

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored auth on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          localStorage.removeItem('auth_user');
        }
      }
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const requestBody = {
        username,
        password,
      };

      console.log('[Auth] Login request:', {
        url: API_ENDPOINTS.auth.login,
        username: username,
        hasPassword: !!password,
      });

      const response = await fetch(API_ENDPOINTS.auth.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorMessage = 'Invalid username or password';
        let errorDetails: any = {
          status: response.status,
          statusText: response.statusText,
          url: API_ENDPOINTS.auth.login,
        };
        
        try {
          const errorText = await response.text();
          if (errorText) {
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.detail || errorData.message || errorMessage;
              errorDetails.errorData = errorData;
            } catch (parseError) {
              errorDetails.rawError = errorText;
              errorMessage = errorText || errorMessage;
            }
          }
          errorDetails.errorMessage = errorMessage;
          console.error('Login failed:', errorDetails);
        } catch (e) {
          console.error('Login failed - could not parse error:', {
            exception: e,
            status: response.status,
            statusText: response.statusText,
            url: API_ENDPOINTS.auth.login,
          });
        }
        return false;
      }

      const data = await response.json();

      const authUser: AuthUser = {
        username: data.approver.username,
        email: data.approver.email,
        name: data.approver.name,
        id: data.approver.id,
        ph_no: data.approver.ph_no || '',  // Handle null ph_no for admin users
        superuser: data.approver.superuser || false,
        admin: data.approver.admin || false,
        is_active: data.approver.is_active !== undefined ? data.approver.is_active : true,
        access_token: data.access_token,
      };

      setUser(authUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_user', JSON.stringify(authUser));
      }
      return true;
    } catch (error) {
      console.error('[Auth] Login error:', {
        error: error instanceof Error ? error.message : String(error),
        url: API_ENDPOINTS.auth.login,
        type: error instanceof TypeError ? 'NetworkError' : 'UnknownError',
      });
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('[Auth] Network error - Backend may not be running or URL is incorrect');
      }
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_user');
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

