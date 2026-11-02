'use client';

import { useEffect, useState } from 'react';
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
  const { sendLoginOtp, verifyLoginOtp } = useAuth();
  const [employeeId, setEmployeeId] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  // Count down until the backend will accept another send
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn(resendIn - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const requestOtp = async () => {
    setError('');
    setInfo('');

    const trimmedId = employeeId.trim();
    if (!trimmedId) {
      setError('Please enter your Employee ID.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await sendLoginOtp(trimmedId);

      if (result.success) {
        setOtpSent(true);
        setOtp('');
        setInfo(result.message);
        setResendIn(result.resendAfterSeconds ?? 0);
      } else {
        setError(result.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    await requestOtp();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await verifyLoginOtp(employeeId.trim(), otp);

      if (result.success) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(result.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeEmployeeId = () => {
    setOtpSent(false);
    setOtp('');
    setInfo('');
    setError('');
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
                Sign in with your Employee ID to access the visitor approval dashboard
              </p>
            </div>

            <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="employeeId" className="text-sm font-semibold text-gray-700">Employee ID</Label>
                  {otpSent && (
                    <button
                      type="button"
                      onClick={handleChangeEmployeeId}
                      disabled={isLoading}
                      className="text-xs text-[#7a2e2e] hover:text-[#8a3e3e] hover:underline disabled:opacity-50"
                    >
                      Change
                    </button>
                  )}
                </div>
                <Input
                  id="employeeId"
                  type="text"
                  placeholder="e.g. CF0001"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  required
                  disabled={isLoading || otpSent}
                  autoFocus
                  autoComplete="username"
                  className="w-full h-12 text-sm border-gray-300 focus:ring-2 focus:ring-[#7a2e2e] focus:border-[#7a2e2e]"
                />
              </div>

              {otpSent && (
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-sm font-semibold text-gray-700">OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    placeholder="6-digit code"
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); if (error) setError(''); }}
                    maxLength={6}
                    required
                    disabled={isLoading}
                    autoFocus
                    autoComplete="one-time-code"
                    className="w-full h-12 text-sm tracking-widest font-mono border-gray-300 focus:ring-2 focus:ring-[#7a2e2e] focus:border-[#7a2e2e]"
                  />
                </div>
              )}

              {info && !error && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                  {info} It expires in 5 minutes.
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              {otpSent ? (
                <>
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold bg-[#7a2e2e] text-white hover:bg-[#8a3e3e] shadow-md hover:shadow-lg transition-all"
                    disabled={isLoading || otp.length < 6}
                  >
                    {isLoading ? 'Please wait...' : 'Verify & Sign In'}
                  </Button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={requestOtp}
                      disabled={isLoading || resendIn > 0}
                      className="text-sm text-[#7a2e2e] hover:text-[#8a3e3e] hover:underline disabled:text-gray-400 disabled:no-underline"
                    >
                      {resendIn > 0 ? `Resend OTP in ${resendIn}s` : 'Resend OTP'}
                    </button>
                  </div>
                </>
              ) : (
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-[#7a2e2e] text-white hover:bg-[#8a3e3e] shadow-md hover:shadow-lg transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send OTP'}
                </Button>
              )}
            </form>

            <div className="text-center mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Your session will remain active for 14 days
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
