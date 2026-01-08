'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth-store';
import { API_ENDPOINTS } from '@/lib/api-config';
import { AppHeader } from '@/components/app-header';
import { PageContainer } from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgetPassword, setShowForgetPassword] = useState(false);
  const [forgotPasswordUsername, setForgotPasswordUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Helper function to check if email is an admin email
  const isAdminEmail = (email: string | undefined): boolean => {
    if (!email) return false;
    const adminEmails = [
      'admin01@candorfoods.in',
      'admin02@candorfoods.in',
      'admin03@candorfoods.in',
      'admin04@candorfoods.in',
      'admin05@candorfoods.in',
    ];
    return adminEmails.includes(email.toLowerCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(username.trim(), password);

      if (success) {
        // Get user from auth store to check email
        const authData = localStorage.getItem('auth_user');
        if (authData) {
          try {
            const user = JSON.parse(authData);
            // Redirect admin emails to admin page, others to dashboard
            if (user.superuser || (user.admin && isAdminEmail(user.email))) {
              router.push('/admin');
            } else if (isAdminEmail(user.email)) {
              // Admin email but not admin flag - redirect to admin page
              router.push('/admin');
            } else {
              router.push('/dashboard');
            }
          } catch (e) {
            console.error('Error parsing user data:', e);
            // Fallback to dashboard if parsing fails
            router.push('/dashboard');
          }
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      } else {
        setError('Invalid username or password. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AppHeader
        rightContent={
          <Link href="/">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm h-8 md:h-9 px-2 md:px-4">
              <ArrowLeft className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Back to Check-In</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
        }
      />
      <div className="min-h-screen flex items-center justify-center px-4 py-6 md:py-8 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-professional-lg border border-gray-200 p-6 sm:p-8 md:p-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Approver Login</h1>
              <p className="text-sm text-gray-600">
                Sign in to access the visitor approval dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-semibold text-gray-700">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full h-12 text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full pr-10 h-12 text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 touch-manipulation"
                    tabIndex={-1}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm text-gray-600 hover:text-gray-900 h-10 mt-4"
              onClick={() => setShowForgetPassword(true)}
            >
              Forget Password
            </Button>

            <div className="text-center mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Demo credentials: CF0001 / password
              </p>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showForgetPassword} onOpenChange={setShowForgetPassword}>
        <DialogContent className="sm:max-w-md max-w-[calc(100vw-2rem)] mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Forgot Password</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Enter your username or email and set a new password. No verification required.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setPasswordError('');
              setPasswordSuccess('');

              if (!forgotPasswordUsername || !newPassword || !confirmPassword) {
                setPasswordError('All fields are required');
                return;
              }

              if (newPassword !== confirmPassword) {
                setPasswordError('New password and confirm password do not match');
                return;
              }

              if (newPassword.length < 6) {
                setPasswordError('New password must be at least 6 characters long');
                return;
              }

              setIsChangingPassword(true);
              try {
                const apiUrl = API_ENDPOINTS.auth.forgotPassword;
                console.log('Calling forgot password API:', apiUrl);
                
                const response = await fetch(apiUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    username: forgotPasswordUsername.trim(),
                    new_password: newPassword,
                  }),
                });

                console.log('Response status:', response.status);
                console.log('Response ok:', response.ok);

                if (!response.ok) {
                  let errorMessage = 'Failed to reset password';
                  try {
                    const errorData = await response.json();
                    errorMessage = errorData.detail || errorData.message || errorMessage;
                  } catch (parseError) {
                    errorMessage = `Server error: ${response.status} ${response.statusText}`;
                  }
                  throw new Error(errorMessage);
                }

                const data = await response.json();
                console.log('Password reset successful:', data);
                setPasswordSuccess('Password reset successfully! You can now login with your new password.');
                
                // Clear form after 2 seconds
                setTimeout(() => {
                  setShowForgetPassword(false);
                  setForgotPasswordUsername('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                  setPasswordSuccess('');
                }, 2000);
              } catch (err) {
                console.error('Forgot password error:', err);
                if (err instanceof TypeError && err.message === 'Failed to fetch') {
                  setPasswordError('Cannot connect to server. Please check if the backend is running and the API URL is correct.');
                } else {
                  setPasswordError(err instanceof Error ? err.message : 'Failed to reset password. Please try again.');
                }
              } finally {
                setIsChangingPassword(false);
              }
            }}
            className="space-y-3 md:space-y-4"
          >
            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="forgotPasswordUsername" className="text-sm md:text-base">Username or Email</Label>
              <Input
                id="forgotPasswordUsername"
                type="text"
                placeholder="Enter your username or email"
                value={forgotPasswordUsername}
                onChange={(e) => setForgotPasswordUsername(e.target.value)}
                required
                disabled={isChangingPassword}
                className="w-full h-10 md:h-11 text-sm md:text-base"
              />
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="newPassword" className="text-sm md:text-base">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (confirmPassword && e.target.value !== confirmPassword) {
                      setPasswordError('New password and confirm password do not match');
                    } else if (confirmPassword && e.target.value === confirmPassword) {
                      setPasswordError('');
                    }
                  }}
                  required
                  disabled={isChangingPassword}
                  className="w-full pr-10 h-10 md:h-11 text-sm md:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground touch-manipulation"
                  tabIndex={-1}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 md:h-5 md:w-5" />
                  ) : (
                    <Eye className="h-4 w-4 md:h-5 md:w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm md:text-base">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (newPassword && e.target.value !== newPassword) {
                      setPasswordError('New password and confirm password do not match');
                    } else {
                      setPasswordError('');
                    }
                  }}
                  required
                  disabled={isChangingPassword}
                  className="w-full pr-10 h-10 md:h-11 text-sm md:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground touch-manipulation"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 md:h-5 md:w-5" />
                  ) : (
                    <Eye className="h-4 w-4 md:h-5 md:w-5" />
                  )}
                </button>
              </div>
            </div>

            {passwordError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-2.5 md:p-3 text-xs md:text-sm text-destructive">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="rounded-md bg-green-50 border border-green-200 p-2.5 md:p-3 text-xs md:text-sm text-green-800">
                {passwordSuccess}
              </div>
            )}

            <div className="flex gap-2 md:gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-10 md:h-11 text-sm md:text-base touch-manipulation"
                onClick={() => {
                  setShowForgetPassword(false);
                  setForgotPasswordUsername('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
                disabled={isChangingPassword}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-10 md:h-11 text-sm md:text-base touch-manipulation"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

