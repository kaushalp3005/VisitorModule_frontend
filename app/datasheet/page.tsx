'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppHeader } from '@/components/app-header';
import { PageContainer } from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { API_ENDPOINTS } from '@/lib/api-config';
import { useAuth } from '@/lib/auth-store';
import { Download, CalendarDays, ArrowLeft, FileSpreadsheet, Loader2, ShieldAlert } from 'lucide-react';

export default function DatasheetPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');

  // If not a superuser, show access denied
  if (!authLoading && (!user || !user.superuser)) {
    return (
      <>
        <AppHeader
          rightContent={
            <Link href="/">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                <ArrowLeft className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                Back
              </Button>
            </Link>
          }
        />
        <PageContainer>
          <div className="max-w-md mx-auto mt-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <ShieldAlert className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-sm text-gray-500 mb-6">
              Only superusers can access this page. Please log in with a superuser account.
            </p>
            <Button onClick={() => router.push('/')} variant="outline">
              Go to Home
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  const handleDownload = async () => {
    setError('');

    if (!fromDate || !toDate) {
      setError('Please select both dates.');
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      setError('From date cannot be after To date.');
      return;
    }

    setIsDownloading(true);
    try {
      const url = `${API_ENDPOINTS.visitors}/export?from_date=${fromDate}&to_date=${toDate}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${user!.access_token}`,
        },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.detail || 'Failed to download data');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `visitors_${fromDate}_${toDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <AppHeader
        rightContent={
          <Link href="/">
            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
              <ArrowLeft className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
              Back
            </Button>
          </Link>
        }
      />

      <PageContainer>
        <div className="max-w-xl mx-auto mt-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                <FileSpreadsheet className="h-7 w-7 text-blue-600" />
              </div>
              <CardTitle className="text-xl sm:text-2xl">Download Visitor Data</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Select a date range to export visitor records as an Excel file.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from-date" className="flex items-center gap-1.5 text-sm font-medium">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    From Date
                  </Label>
                  <Input
                    id="from-date"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    max={toDate || today}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="to-date" className="flex items-center gap-1.5 text-sm font-medium">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    To Date
                  </Label>
                  <Input
                    id="to-date"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    min={fromDate}
                    max={today}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <Button
                onClick={handleDownload}
                disabled={isDownloading || !fromDate || !toDate}
                className="w-full h-11 text-sm sm:text-base"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Excel
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
