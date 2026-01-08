'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { AppHeader } from '@/components/app-header';
import { PageContainer } from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { API_ENDPOINTS } from '@/lib/api-config';
import { VisitorImage } from '@/components/visitor-image';
import { Toast, useToast } from '@/components/toast';
import { CheckCircle2, XCircle, Clock, Download, Printer, ArrowLeft } from 'lucide-react';

interface VisitorData {
  id: number;
  visitor_name: string;
  mobile_number: string;
  email_address?: string;
  company?: string;
  person_to_meet: string;
  reason_to_visit: string;
  warehouse?: string;
  status: 'WAITING' | 'APPROVED' | 'REJECTED';
  check_in_time: string;
  check_out_time?: string | null;
  img_url?: string;
  visitor_number?: string;
}

export default function VisitorPassPage() {
  const router = useRouter();
  const params = useParams();
  const visitorId = params?.id as string;
  const { toasts, addToast, removeToast } = useToast();
  
  const [visitor, setVisitor] = useState<VisitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [personToMeetName, setPersonToMeetName] = useState<string>('');
  const [hasShownToast, setHasShownToast] = useState(false);

  // Fetch visitor details
  const fetchVisitorDetails = async () => {
    if (!visitorId) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_ENDPOINTS.visitors}/${visitorId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Visitor not found');
        }
        throw new Error('Failed to fetch visitor details');
      }

      const data = await response.json();
      console.log(`[Visitor Pass] Fetched visitor ${data.id}: Status = "${data.status}"`);
      setVisitor(data);

      // Fetch approver name
      try {
        const approverResponse = await fetch(`${API_ENDPOINTS.approvers}/${data.person_to_meet}`);
        if (approverResponse.ok) {
          const approverData = await approverResponse.json();
          setPersonToMeetName(approverData.name || data.person_to_meet);
        } else {
          setPersonToMeetName(data.person_to_meet);
        }
      } catch (err) {
        setPersonToMeetName(data.person_to_meet);
      }
    } catch (err) {
      console.error('Error fetching visitor:', err);
      setError(err instanceof Error ? err.message : 'Failed to load visitor details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visitorId) {
      // Reset toast state when visitor ID changes
      setHasShownToast(false);
      fetchVisitorDetails();

      // Poll for status updates every 10 seconds if status is WAITING
      const interval = setInterval(() => {
        if (visitor?.status === 'WAITING') {
          console.log(`[Visitor Pass] Polling for visitor ${visitorId} status update...`);
          fetchVisitorDetails();
        } else {
          console.log(`[Visitor Pass] Visitor ${visitorId} status is ${visitor?.status}, stopping polling`);
        }
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [visitorId]);

  // Show toast notification when visitor data is first loaded
  useEffect(() => {
    if (visitor && !hasShownToast && visitor.id) {
      addToast(`Please note your visitor ID: ${visitor.id}`, 'info');
      setHasShownToast(true);
    }
  }, [visitor, hasShownToast, addToast]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Generate a simple text file with visitor details
    if (!visitor) return;

    const content = `
VISITOR PASS
============

Visitor ID: ${visitor.id}
Name: ${visitor.visitor_name}
Mobile: ${visitor.mobile_number}
Email: ${visitor.email_address || 'N/A'}
Company: ${visitor.company || 'N/A'}
Person to Meet: ${personToMeetName || visitor.person_to_meet}
Reason: ${visitor.reason_to_visit}
Warehouse: ${visitor.warehouse || 'N/A'}
Status: ${visitor.status}
Check-in Time: ${new Date(visitor.check_in_time).toLocaleString()}
${visitor.check_out_time ? `Check-out Time: ${new Date(visitor.check_out_time).toLocaleString()}` : ''}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visitor-pass-${visitor.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = () => {
    if (!visitor) return null;

    const statusConfig = {
      WAITING: {
        icon: Clock,
        text: 'Awaiting Approval',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        iconClassName: 'text-yellow-600',
      },
      APPROVED: {
        icon: CheckCircle2,
        text: 'Approved - You may enter',
        className: 'bg-green-100 text-green-800 border-green-200',
        iconClassName: 'text-green-600',
      },
      REJECTED: {
        icon: XCircle,
        text: 'Entry Denied',
        className: 'bg-red-100 text-red-800 border-red-200',
        iconClassName: 'text-red-600',
      },
    };

    const config = statusConfig[visitor.status];
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${config.className}`}>
        <Icon className={`h-5 w-5 ${config.iconClassName}`} />
        <span className="font-semibold">{config.text}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <AppHeader />
        <PageContainer>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading visitor pass...</p>
            </div>
          </div>
        </PageContainer>
      </>
    );
  }

  if (error || !visitor) {
    return (
      <>
        <AppHeader />
        <PageContainer>
          <div className="text-center space-y-4 py-12">
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">Visitor Not Found</h2>
            <p className="text-muted-foreground">{error || 'The visitor pass you are looking for does not exist.'}</p>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Check-In
              </Button>
            </Link>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <AppHeader
        className="print:hidden"
        rightContent={
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Check-In
            </Button>
          </Link>
        }
      />
      <PageContainer>
        <div className="max-w-3xl mx-auto space-y-6 print:space-y-2">
          {/* Success Header */}
          <div className="text-center space-y-4 print:space-y-1 print:hidden">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 print:hidden">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-foreground print:text-lg print:font-semibold">Check-In Successful!</h1>
            <p className="text-muted-foreground print:hidden">Your visitor pass has been generated</p>
          </div>

          {/* Visitor Pass Card */}
          <div className="rounded-lg border border-border bg-card p-6 sm:p-8 shadow-lg print:shadow-none print:p-4 print:border-2">
            <div className="grid gap-6 md:grid-cols-2 print:gap-4">
              {/* Left: Visitor Photo */}
              <div className="flex flex-col items-center space-y-4 print:space-y-2">
                <VisitorImage
                  src={visitor.img_url || (visitor as any).image_url}
                  alt={`Photo of ${visitor.visitor_name}`}
                  size="medium"
                />
                <div className="text-center">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 print:text-[10px]">
                    Visitor ID
                  </p>
                  <p className="text-2xl font-mono font-bold text-foreground print:text-lg">{visitor.id}</p>
                </div>
              </div>

              {/* Right: Visitor Details */}
              <div className="space-y-4 print:space-y-2">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-1 print:text-lg print:mb-0">{visitor.visitor_name}</h2>
                  <p className="text-sm text-muted-foreground print:text-xs">Visitor Pass</p>
                </div>

                <div className="space-y-3 print:space-y-1.5">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 print:text-[10px] print:mb-0.5">
                      Mobile Number
                    </p>
                    <p className="text-foreground font-medium print:text-sm">{visitor.mobile_number}</p>
                  </div>

                  {visitor.email_address && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 print:text-[10px] print:mb-0.5">
                        Email
                      </p>
                      <p className="text-foreground font-medium print:text-sm">{visitor.email_address}</p>
                    </div>
                  )}

                  {visitor.company && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 print:text-[10px] print:mb-0.5">
                        Company
                      </p>
                      <p className="text-foreground font-medium print:text-sm">{visitor.company}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 print:text-[10px] print:mb-0.5">
                      Person to Meet
                    </p>
                    <p className="text-foreground font-medium print:text-sm">
                      {personToMeetName || visitor.person_to_meet}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 print:text-[10px] print:mb-0.5">
                      Purpose
                    </p>
                    <p className="text-foreground font-medium print:text-sm">{visitor.reason_to_visit}</p>
                  </div>

                  {visitor.warehouse && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 print:text-[10px] print:mb-0.5">
                        Warehouse
                      </p>
                      <p className="text-foreground font-medium print:text-sm">{visitor.warehouse}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 print:text-[10px] print:mb-0.5">
                      Check-in Time
                    </p>
                    <p className="text-foreground font-medium text-sm print:text-xs">{formatTime(visitor.check_in_time)}</p>
                  </div>

                  {visitor.check_out_time && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 print:text-[10px] print:mb-0.5">
                        Check-out Time
                      </p>
                      <p className="text-foreground font-medium text-sm print:text-xs">
                        {formatTime(visitor.check_out_time)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="pt-4 border-t border-border print:pt-2 print:border-t-2">
                  {getStatusBadge()}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 print:hidden">
            <Button
              onClick={handlePrint}
              variant="outline"
              className="flex-1"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Pass
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Pass
            </Button>
            <Link href="/" className="flex-1">
              <Button variant="default" className="w-full">
                New Check-In
              </Button>
            </Link>
          </div>

          {/* Status Polling Info */}
          {visitor.status === 'WAITING' && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
              <p className="text-sm text-yellow-800">
                <Clock className="inline h-4 w-4 mr-1" />
                Status updates automatically. This page will refresh when your request is approved or rejected.
              </p>
            </div>
          )}
        </div>
      </PageContainer>

          {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          @page {
            margin: 0.5cm;
          }
          .print\\:space-y-2 > * + * {
            margin-top: 0.5rem !important;
          }
          .print\\:space-y-1 > * + * {
            margin-top: 0.25rem !important;
          }
          .print\\:space-y-1\\.5 > * + * {
            margin-top: 0.375rem !important;
          }
        }
      `}</style>

      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
}

