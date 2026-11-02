'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppHeader } from '@/components/app-header';
import { PageContainer } from '@/components/page-container';
import { TabSwitcher } from '@/components/tab-switcher';
import { VisitorRequestCard } from '@/components/visitor-request-card';
import { RequestsPagination } from '@/components/requests-pagination';
import { Button } from '@/components/ui/button';
import { Toast, useToast } from '@/components/toast';
import { useAuth } from '@/lib/auth-store';
import { API_ENDPOINTS } from '@/lib/api-config';
import { ManageApprovers } from '@/components/manage-approvers';

const PAGE_SIZE = 12;
const POLL_INTERVAL_MS = 30000;

// Backend status behind each tab that lists the logged-in approver's own requests
const TAB_STATUS: Record<string, string> = {
  Pending: 'WAITING',
  Approved: 'APPROVED',
  Rejected: 'REJECTED',
};

type VisitorStats = {
  total_visitors: number;
  waiting: number;
  approved: number;
  rejected: number;
};

// A malformed declaration on an old row must not take the whole page down
function parseHealthDeclaration(value: string | null | undefined): any {
  try {
    const parsed = JSON.parse(value || 'null');
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (e) {
    return null;
  }
}

// Map the API response to match the expected format
function mapVisitor(visitor: any) {
  // Normalize status to lowercase for internal use
  const normalizedStatus = visitor.status.toLowerCase();
  const healthData = parseHealthDeclaration(visitor.health_declaration);

  // Check if this is an appointment request (from Google Form)
  const isAppointment = visitor.reason_to_visit?.startsWith('[APPOINTMENT]') || healthData?.source === 'google_form';

  return {
    id: visitor.id.toString(),
    name: visitor.visitor_name,
    mobileNumber: visitor.mobile_number,
    email: visitor.email_address,
    company: visitor.company,
    personToMeet: {
      id: visitor.person_to_meet,
      displayName: visitor.person_to_meet_name || visitor.person_to_meet,
    },
    reasonForVisit: visitor.reason_to_visit,
    status: normalizedStatus === 'waiting' ? 'pending' : normalizedStatus,
    submittedAt: visitor.check_in_time,
    visitorNumber: normalizedStatus === 'approved' ? visitor.id.toString() : undefined,
    approvedAt: normalizedStatus === 'approved' ? visitor.updated_at : undefined,
    rejectedAt: normalizedStatus === 'rejected' ? visitor.updated_at : undefined,
    rejectionReason: visitor.rejection_reason,
    rawId: visitor.id, // Store the raw ID for API calls
    imageUrl: visitor.img_url || visitor.image_url, // Support both field names
    healthDeclaration: healthData ? visitor.health_declaration : undefined,
    warehouse: visitor.warehouse,
    isAppointment: isAppointment, // Flag to identify appointment requests
    timeSlot: isAppointment ? healthData?.time_slot : null, // Time slot for appointments
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState('Pending');
  const [page, setPage] = useState(1);
  const [requests, setRequests] = useState<any[]>([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [myStats, setMyStats] = useState<VisitorStats | null>(null);
  const [allStats, setAllStats] = useState<VisitorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // The load in progress, if any. A newer load cancels it so a slow older
  // response can't overwrite what's on screen.
  const activeLoadRef = useRef<AbortController | null>(null);

  // Fetch the current tab's page of requests plus the counts shown around it
  const fetchRequests = useCallback(async (silent = false) => {
    if (!user) return;

    activeLoadRef.current?.abort();
    const controller = new AbortController();
    activeLoadRef.current = controller;
    let sessionExpired = false;

    const fetchJson = async (url: string) => {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'accept': 'application/json',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        sessionExpired = response.status === 401;
        throw new Error(`Failed to fetch visitor requests: ${response.status} ${response.statusText}`);
      }

      return response.json();
    };

    try {
      if (!silent) setIsLoading(true);

      const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
      if (TAB_STATUS[activeTab]) {
        params.set('mine', 'true');
        params.set('status', TAB_STATUS[activeTab]);
      }

      const [list, mine, all] = await Promise.all([
        activeTab === 'Manage Approvers' ? null : fetchJson(`${API_ENDPOINTS.visitors}/?${params}`),
        fetchJson(`${API_ENDPOINTS.visitors}/stats?mine=true`),
        activeTab === 'All Requests' ? fetchJson(`${API_ENDPOINTS.visitors}/stats`) : null,
      ]);

      setMyStats(mine);
      if (all) setAllStats(all);

      if (list) {
        // Approving the last request on the last page leaves this page empty
        const lastPage = Math.max(1, Math.ceil(list.total / PAGE_SIZE));
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }

        setRequests(list.visitors.map(mapVisitor));
        setTotalRequests(list.total);
      }
    } catch (error) {
      if (controller.signal.aborted) return;

      // Check if it's an authentication error
      if (sessionExpired) {
        addToast('Authentication failed. Please log in again.', 'error');
        logout();
        return;
      }

      // A failed background refresh keeps the current data on screen and retries on the next poll
      if (silent) {
        console.error('[Dashboard] Refresh failed:', error);
        return;
      }

      // Provide user-friendly error messages
      if (error instanceof TypeError && error.message.includes('fetch')) {
        addToast('Cannot connect to server. Please ensure the backend is running.', 'error');
      } else if (error instanceof Error) {
        addToast(error.message, 'error');
      } else {
        addToast('Failed to fetch visitor requests. Please try again.', 'error');
      }
    } finally {
      if (activeLoadRef.current === controller) {
        activeLoadRef.current = null;
        setIsLoading(false);
      }
    }
  }, [user, activeTab, page, addToast, logout]);

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

  // Redirect to login if not authenticated (only after auth state is loaded)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (user && !user.superuser && isAdminEmail(user.email)) {
      // Admin emails cannot access approver dashboard, redirect to admin page
      router.push('/admin');
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Fetch whenever the user, tab or page changes
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Refresh the current page in the background, and straight away when the browser tab
  // is reopened. Skipped while hidden or while a load is running, so requests can't pile up.
  useEffect(() => {
    if (!user) return;

    const refresh = () => {
      if (document.hidden || activeLoadRef.current) return;
      fetchRequests(true);
    };

    const intervalId = setInterval(refresh, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', refresh);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [user, fetchRequests]);

  // Cancel any load still running when leaving the page
  useEffect(() => {
    return () => activeLoadRef.current?.abort();
  }, []);

  // Show loading state while checking auth
  if (authLoading) {
    return null;
  }

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  const handleTabChange = (tab: string) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setPage(1);
    setRequests([]);
    setTotalRequests(0);
    setIsLoading(true);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setIsLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApprove = async (id: string) => {
    // Prevent approvals from "All Requests" tab
    if (activeTab === 'All Requests') return;

    const request = requests.find((r) => r.id === id);
    if (!request || !user) return;

    try {
      const requestBody = { status: 'APPROVED' };
      const url = `${API_ENDPOINTS.visitors}/${request.rawId}/status`;

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`,
          'accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to approve visitor');
      }

      addToast('Visitor approved successfully.', 'success');
      fetchRequests(true); // Refresh without replacing the cards with a spinner
    } catch (error) {
      // Provide more specific error messages
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        addToast('Cannot connect to server. Please ensure the backend is running.', 'error');
      } else if (error instanceof Error) {
        addToast(error.message, 'error');
      } else {
        addToast('Failed to approve visitor', 'error');
      }
    }
  };

  const handleReject = async (id: string) => {
    // Prevent rejections from "All Requests" tab
    if (activeTab === 'All Requests') return;

    const request = requests.find((r) => r.id === id);
    if (!request || !user) return;

    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      const url = `${API_ENDPOINTS.visitors}/${request.rawId}/status`;

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`,
          'accept': 'application/json',
        },
        body: JSON.stringify({
          status: 'REJECTED',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject visitor');
      }

      addToast('Visitor request rejected.', 'error');
      fetchRequests(true); // Refresh without replacing the cards with a spinner
    } catch (error) {
      // Provide more specific error messages
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        addToast('Cannot connect to server. Please ensure the backend is running.', 'error');
      } else if (error instanceof Error) {
        addToast(error.message, 'error');
      } else {
        addToast('Failed to reject visitor', 'error');
      }
    }
  };

  // Build tabs array based on user permissions
  const tabs = user.superuser
    ? ['Pending', 'Approved', 'Rejected', 'All Requests', 'Manage Approvers']
    : ['Pending', 'Approved', 'Rejected'];

  return (
    <>
      <AppHeader
        rightContent={
          <div className="flex gap-1.5 md:gap-2">
            <Link href="/">
              <Button variant="outline" size="sm" className="text-xs md:text-sm h-8 md:h-9 px-2 md:px-4">
                <span className="hidden sm:inline">Back to Check-In</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
            <Link href="/appointment">
              <Button variant="outline" size="sm" className="text-xs md:text-sm h-8 md:h-9 px-2 md:px-4">
                <span className="hidden sm:inline">Appointment</span>
                <span className="sm:hidden">Appt</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="text-xs md:text-sm h-8 md:h-9 px-2 md:px-4"
              onClick={() => {
                logout();
                router.push('/login');
              }}
            >
              Logout
            </Button>
          </div>
        }
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <PageContainer>
          <div className="space-y-3 md:space-y-6 lg:space-y-8 py-3 md:py-6 lg:py-8">
            {/* Dashboard Header */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-professional-lg border border-gray-200 p-3 md:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-4">
                <div>
                  <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Visitor Approval Dashboard</h1>
                  <p className="mt-1 md:mt-2 text-xs md:text-sm lg:text-base text-gray-600">
                    Logged in as <strong className="text-gray-900">{user.name}</strong>
                    {user.superuser && (
                      <span className="ml-1.5 md:ml-2 inline-flex items-center px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[12px] md:text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                        Superuser
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="text-right">
                    <p className="text-[12px] md:text-xs text-gray-500 uppercase tracking-wide">Total</p>
                    <p className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">{myStats?.total_visitors ?? 0}</p>
                  </div>
                  <div className="h-8 md:h-12 w-px bg-gray-300"></div>
                  <div className="text-right">
                    <p className="text-[12px] md:text-xs text-gray-500 uppercase tracking-wide">Pending</p>
                    <p className="text-lg md:text-xl lg:text-2xl font-bold text-blue-600">{myStats?.waiting ?? 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-professional-lg border border-gray-200 overflow-hidden">
              <TabSwitcher
                tabs={tabs}
                activeTab={activeTab}
                onChange={handleTabChange}
                className="px-2 md:px-4 lg:px-6"
              />
            </div>

            {/* Requests Grid */}
            {activeTab === 'Manage Approvers' && user.superuser ? (
              <ManageApprovers />
            ) : isLoading ? (
              <div className="bg-white rounded-xl md:rounded-2xl shadow-professional-lg border border-gray-200 p-6 md:p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-2 md:border-4 border-gray-300 border-t-blue-600 mb-3 md:mb-4"></div>
                <p className="text-xs md:text-sm lg:text-base text-gray-600 font-medium">Loading requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-white rounded-xl md:rounded-2xl shadow-professional-lg border border-gray-200 p-6 md:p-12 text-center">
                <svg className="mx-auto h-8 w-8 md:h-12 md:w-12 text-gray-400 mb-3 md:mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-xs md:text-sm lg:text-base text-gray-600">
                  {activeTab === 'All Requests'
                    ? 'No visitor requests found.'
                    : `No ${activeTab.toLowerCase()} requests for ${user.name}.`}
                </p>
              </div>
            ) : (
              <>
                {activeTab === 'All Requests' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg md:rounded-xl p-2.5 md:p-4 lg:p-5 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2 md:gap-4">
                      <div>
                        <p className="text-[12px] md:text-xs text-blue-600 uppercase tracking-wide font-semibold mb-0.5 md:mb-1">Viewing All Requests</p>
                        <p className="text-xs md:text-sm text-blue-900">
                          <strong className="text-sm md:text-base lg:text-lg">{allStats?.total_visitors ?? 0}</strong> total visitors
                        </p>
                      </div>
                      <div className="flex gap-2 md:gap-4 text-xs md:text-sm">
                        <div>
                          <span className="text-blue-600 font-semibold">{allStats?.waiting ?? 0}</span>
                          <span className="text-blue-700 ml-0.5 md:ml-1">pending</span>
                        </div>
                        <div>
                          <span className="text-green-600 font-semibold">{allStats?.approved ?? 0}</span>
                          <span className="text-green-700 ml-0.5 md:ml-1">approved</span>
                        </div>
                        <div>
                          <span className="text-red-600 font-semibold">{allStats?.rejected ?? 0}</span>
                          <span className="text-red-700 ml-0.5 md:ml-1">rejected</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3 md:gap-4 lg:gap-6 lg:grid-cols-2 xl:grid-cols-3">
                  {requests.map((request) => {
                    // Determine the mode for each card
                    // In "All Requests" tab, show cards in view-only mode (use approved/rejected based on status, but never pending)
                    let cardMode: 'pending' | 'approved' | 'rejected';

                    if (activeTab === 'All Requests') {
                      // In "All Requests" tab, treat pending as approved for display (read-only, no buttons)
                      cardMode = request.status === 'pending' ? 'approved' : request.status as 'approved' | 'rejected';
                    } else {
                      cardMode = activeTab.toLowerCase() as 'pending' | 'approved' | 'rejected';
                    }

                    // Only provide approve/reject handlers for the Pending tab (not "All Requests")
                    const showActions = activeTab === 'Pending';

                    return (
                      <VisitorRequestCard
                        key={request.id}
                        request={request}
                        mode={cardMode}
                        onApprove={showActions ? handleApprove : undefined}
                        onReject={showActions ? handleReject : undefined}
                      />
                    );
                  })}
                </div>
                <RequestsPagination
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={totalRequests}
                  onChange={handlePageChange}
                />
              </>
            )}
          </div>
        </PageContainer>
      </div>

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
