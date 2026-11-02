'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { API_ENDPOINTS } from './api-config';

const SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds

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
  session_created_at?: number; // timestamp when session was created
};

type OtpResult = {
  success: boolean;
  message: string;
  resendAfterSeconds?: number;
};

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  sendLoginOtp: (username: string) => Promise<OtpResult>;
  verifyLoginOtp: (username: string, otp: string) => Promise<OtpResult>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored auth on mount + validate 14-day session expiry
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        try {
          const parsed: AuthUser = JSON.parse(storedUser);

          // Check if session has expired (14 days)
          if (parsed.session_created_at) {
            const elapsed = Date.now() - parsed.session_created_at;
            if (elapsed > SESSION_DURATION_MS) {
              // Session expired - clear it
              localStorage.removeItem('auth_user');
              setIsLoading(false);
              return;
            }
          }

          setUser(parsed);
        } catch (e) {
          localStorage.removeItem('auth_user');
        }
      }
      setIsLoading(false);
    }
  }, []);

  // Send a login OTP on WhatsApp to the approver's registered phone number
  const sendLoginOtp = useCallback(async (username: string): Promise<OtpResult> => {
    try {
      const response = await fetch(API_ENDPOINTS.auth.sendLoginOtp, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          message: typeof data.detail === 'string' ? data.detail : 'Could not send the OTP. Please try again.',
        };
      }

      return {
        success: true,
        message: data.message,
        resendAfterSeconds: data.resend_after_seconds,
      };
    } catch (error) {
      console.error('[Auth] Send login OTP error:', error);
      return { success: false, message: 'Cannot reach the server. Please check your connection and try again.' };
    }
  }, []);

  // Verify the login OTP and sign the approver in
  const verifyLoginOtp = useCallback(async (username: string, otp: string): Promise<OtpResult> => {
    try {
      const response = await fetch(API_ENDPOINTS.auth.verifyLoginOtp, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({ username, otp }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          message: typeof data.detail === 'string' ? data.detail : 'Verification failed. Please try again.',
        };
      }

      const authUser: AuthUser = {
        username: data.approver.username,
        email: data.approver.email,
        name: data.approver.name,
        id: data.approver.id,
        ph_no: data.approver.ph_no || '',
        superuser: data.approver.superuser || false,
        admin: data.approver.admin || false,
        is_active: data.approver.is_active !== undefined ? data.approver.is_active : true,
        access_token: data.access_token,
        session_created_at: Date.now(),
      };

      setUser(authUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_user', JSON.stringify(authUser));
      }
      return { success: true, message: 'Verification successful.' };
    } catch (error) {
      console.error('[Auth] Verify login OTP error:', error);
      return { success: false, message: 'Cannot reach the server. Please check your connection and try again.' };
    }
  }, []);

  // Login with username & password (kept for admin login)
  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(API_ENDPOINTS.auth.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();

      const authUser: AuthUser = {
        username: data.approver.username,
        email: data.approver.email,
        name: data.approver.name,
        id: data.approver.id,
        ph_no: data.approver.ph_no || '',
        superuser: data.approver.superuser || false,
        admin: data.approver.admin || false,
        is_active: data.approver.is_active !== undefined ? data.approver.is_active : true,
        access_token: data.access_token,
        session_created_at: Date.now(),
      };

      setUser(authUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_user', JSON.stringify(authUser));
      }
      return true;
    } catch (error) {
      console.error('[Auth] Login error:', error);
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
        sendLoginOtp,
        verifyLoginOtp,
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
