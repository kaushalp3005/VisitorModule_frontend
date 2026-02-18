'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-store';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const { identify } = useAuth();
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setError('Please enter your full name.');
      return;
    }

    setIsLoading(true);

    try {
      const success = await identify(trimmedName);

      if (success) {
        // Get user from auth store to check role
        const authData = localStorage.getItem('auth_user');
        if (authData) {
          try {
            const user = JSON.parse(authData);
            // Redirect admin emails to admin page, others to dashboard
            if (user.superuser || (user.admin && isAdminEmail(user.email))) {
              router.push('/admin');
            } else if (isAdminEmail(user.email)) {
              router.push('/admin');
            } else {
              router.push('/dashboard');
            }
          } catch (e) {
            router.push('/dashboard');
          }
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      } else {
        setError('No employee found with this name. Please enter your full name as registered.');
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
              <div className="mx-auto w-16 h-16 bg-[#7a2e2e]/10 rounded-full flex items-center justify-center mb-4">
                <User className="h-8 w-8 text-[#7a2e2e]" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome</h1>
              <p className="text-sm text-gray-600">
                Enter your full name to access the visitor approval dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-semibold text-gray-700">Your Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Name Surname"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={isLoading}
                  autoFocus
                  className="w-full h-12 text-sm border-gray-300 focus:ring-2 focus:ring-[#7a2e2e] focus:border-[#7a2e2e]"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-[#7a2e2e] text-white hover:bg-[#8a3e3e] shadow-md hover:shadow-lg transition-all"
                disabled={isLoading}
              >
                {isLoading ? 'Verifying...' : 'Continue'}
              </Button>
            </form>

            <div className="text-center mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Your session will remain active for 7 days
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
