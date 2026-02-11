'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppHeader } from '@/components/app-header';
import { PageContainer } from '@/components/page-container';
import { TabSwitcher } from '@/components/tab-switcher';
import { VisitorRequestCard } from '@/components/visitor-request-card';
import { Button } from '@/components/ui/button';
import { Toast, useToast } from '@/components/toast';
import { useAuth } from '@/lib/auth-store';
import { API_ENDPOINTS } from '@/lib/api-config';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState('Pending');
  const [requests, setRequests] = useState<any[]>([]);
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch visitor requests for the logged-in user
  const fetchRequests = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      const url = `${API_ENDPOINTS.visitors}/`;

      // Fetch all visitors using the authenticated endpoint
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'accept': 'application/json',
        },
      });

      if (!response.ok) {
        // Check if it's an authentication error
        if (response.status === 401) {
          addToast('Authentication failed. Please log in again.', 'error');
          logout();
          return;
        }

        const errorText = await response.text();
        throw new Error(`Failed to fetch visitor requests: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Filter visitors where person_to_meet matches the logged-in user's username
      const userVisitors = data.visitors.filter(
        (visitor: any) => visitor.person_to_meet === user.username
      );

      // Map the API response to match the expected format
      const mappedRequests = userVisitors.map((visitor: any) => {
        // Normalize status to lowercase for internal use
        const normalizedStatus = visitor.status.toLowerCase();

        // Check if this is an appointment request (from Google Form)
        const isAppointment = visitor.reason_to_visit?.startsWith('[APPOINTMENT]') || 
                             (visitor.health_declaration && 
                              JSON.parse(visitor.health_declaration || '{}').source === 'google_form');
        
        // Extract time slot from health_declaration if it's an appointment
        let timeSlot = null;
        if (isAppointment && visitor.health_declaration) {
          try {
            const healthData = JSON.parse(visitor.health_declaration);
            timeSlot = healthData.time_slot;
          } catch (e) {
            // Ignore parsing errors
          }
        }

        return {
          id: visitor.id.toString(),
          name: visitor.visitor_name,
          mobileNumber: visitor.mobile_number,
          email: visitor.email_address,
          company: visitor.company,
          personToMeet: {
            id: visitor.person_to_meet,
            displayName: user.name,
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
          healthDeclaration: visitor.health_declaration,
          warehouse: visitor.warehouse,
          isAppointment: isAppointment, // Flag to identify appointment requests
          timeSlot: timeSlot, // Time slot for appointments
        };
      });

      setRequests(mappedRequests);
    } catch (error) {
      // Provide user-friendly error messages
      if (error instanceof TypeError && error.message.includes('fetch')) {
        addToast('Cannot connect to server. Please ensure the backend is running.', 'error');
      } else if (error instanceof Error) {
        addToast(error.message, 'error');
      } else {
        addToast('Failed to fetch visitor requests. Please try again.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, addToast, logout]);

  // Fetch all visitor requests (for superusers only)
  const fetchAllRequests = useCallback(async () => {
    if (!user || !user.superuser) return;

    try {
      setIsLoading(true);

      // Fetch all visitors - loop through all pages
      let allVisitors: any[] = [];
      let currentPage = 1;
      let totalPages = 1;

      do {
        const url = `${API_ENDPOINTS.visitors}/?page=${currentPage}&page_size=100`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'accept': 'application/json',
          },
        });

        if (!response.ok) {
          // Check if it's an authentication error
          if (response.status === 401) {
            addToast('Authentication failed. Please log in again.', 'error');
            logout();
            return;
          }

          const errorText = await response.text();
          throw new Error(`Failed to fetch all visitor requests: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        allVisitors = [...allVisitors, ...data.visitors];

        // Calculate total pages based on total count and page size
        totalPages = Math.ceil(data.total / 100);
        currentPage++;
      } while (currentPage <= totalPages);

      // Get unique approver usernames
      const uniqueApprovers = [...new Set(allVisitors.map((v: any) => v.person_to_meet))];

      // Fetch approver details for all unique approvers
      const approverDetailsMap = new Map<string, string>();
      await Promise.all(
        uniqueApprovers
          .filter((username) => username && username.trim() !== '') // Filter out empty/null usernames
          .map(async (username) => {
            try {
              // Skip if username looks like a test/dummy value
              if (username.toLowerCase().includes('john') && username.toLowerCase().includes('doe')) {
                approverDetailsMap.set(username, username);
                return;
              }
              
              const response = await fetch(`${API_ENDPOINTS.approvers}/${encodeURIComponent(username)}`, {
                headers: {
                  'Authorization': `Bearer ${user.access_token}`,
                  'accept': 'application/json',
                },
              });
              if (response.ok) {
                const approver = await response.json();
                approverDetailsMap.set(username, approver.name);
              } else if (response.status === 404) {
                approverDetailsMap.set(username, username);
              } else {
                approverDetailsMap.set(username, username); // Fallback to username
              }
            } catch (error) {
              approverDetailsMap.set(username, username);
            }
          })
      );

      // Map the API response to match the expected format
      const mappedRequests = allVisitors.map((visitor: any) => {
        // Normalize status to lowercase for internal use
        const normalizedStatus = visitor.status.toLowerCase();
        
        // Check if this is an appointment request (from Google Form)
        const isAppointment = visitor.reason_to_visit?.startsWith('[APPOINTMENT]') || 
                             (visitor.health_declaration && 
                              JSON.parse(visitor.health_declaration || '{}').source === 'google_form');
        
        // Extract time slot from health_declaration if it's an appointment
        let timeSlot = null;
        if (isAppointment && visitor.health_declaration) {
          try {
            const healthData = JSON.parse(visitor.health_declaration);
            timeSlot = healthData.time_slot;
          } catch (e) {
            // Ignore parsing errors
          }
        }

        return {
          id: visitor.id.toString(),
          name: visitor.visitor_name,
          mobileNumber: visitor.mobile_number,
          email: visitor.email_address,
          company: visitor.company,
          personToMeet: {
            id: visitor.person_to_meet,
            displayName: approverDetailsMap.get(visitor.person_to_meet) || visitor.person_to_meet,
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
          healthDeclaration: visitor.health_declaration,
          warehouse: visitor.warehouse,
          isAppointment: isAppointment, // Flag to identify appointment requests
          timeSlot: timeSlot, // Time slot for appointments
        };
      });

      setAllRequests(mappedRequests);
    } catch (error) {
      // Provide user-friendly error messages
      if (error instanceof TypeError && error.message.includes('fetch')) {
        addToast('Cannot connect to server. Please ensure the backend is running.', 'error');
      } else if (error instanceof Error) {
        addToast(error.message, 'error');
      } else {
        addToast('Failed to fetch all visitor requests. Please try again.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, addToast, logout]);

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

  // Fetch requests when user is available (only on mount or when user changes)
  useEffect(() => {
    if (user) {
      fetchRequests();
      // Fetch all requests if user is a superuser
      if (user.superuser) {
        fetchAllRequests();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only re-fetch when user changes, not when functions change

  // Poll for status updates every 10 seconds (only when user is logged in)
  // Note: We don't depend on requests/allRequests to avoid infinite loops
  useEffect(() => {
    if (!user) {
      // Clear polling if user logs out
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Clear any existing interval first
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // Start polling - fetch updates every 10 seconds
    // The polling will continue until user logs out or component unmounts
    pollingIntervalRef.current = setInterval(() => {
      fetchRequests();
      if (user.superuser) {
        fetchAllRequests();
      }
    }, 10000); // Poll every 10 seconds

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
    // Only depend on user - fetchRequests/fetchAllRequests are stable callbacks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // All hooks must be called before any conditional returns
  const filteredRequests = useMemo(() => {
    return requests;
  }, [requests]);

  // Show loading state while checking auth
  if (authLoading) {
    return null;
  }

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  const pendingRequests = filteredRequests.filter((r) => r.status === 'pending');
  const approvedRequests = filteredRequests.filter((r) => r.status === 'approved');
  const rejectedRequests = filteredRequests.filter((r) => r.status === 'rejected');

  // For "All Requests" tab - separate pending, approved, rejected from all requests
  const allPendingRequests = allRequests.filter((r) => r.status === 'pending');
  const allApprovedRequests = allRequests.filter((r) => r.status === 'approved');
  const allRejectedRequests = allRequests.filter((r) => r.status === 'rejected');

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
      fetchRequests(); // Refresh the user's requests
      if (user.superuser) {
        fetchAllRequests(); // Refresh all requests for superusers
      }
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
      fetchRequests(); // Refresh the user's requests
      if (user.superuser) {
        fetchAllRequests(); // Refresh all requests for superusers
      }
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

  const getDisplayRequests = () => {
    switch (activeTab) {
      case 'Pending':
        return pendingRequests;
      case 'Approved':
        return approvedRequests;
      case 'Rejected':
        return rejectedRequests;
      case 'All Requests':
        return allRequests;
      default:
        return pendingRequests;
    }
  };

  const displayRequests = getDisplayRequests();

  // Build tabs array based on user permissions
  const tabs = user.superuser
    ? ['Pending', 'Approved', 'Rejected', 'All Requests']
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
                      <span className="ml-1.5 md:ml-2 inline-flex items-center px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                        Superuser
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="text-right">
                    <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wide">Total</p>
                    <p className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">{filteredRequests.length}</p>
                  </div>
                  <div className="h-8 md:h-12 w-px bg-gray-300"></div>
                  <div className="text-right">
                    <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wide">Pending</p>
                    <p className="text-lg md:text-xl lg:text-2xl font-bold text-blue-600">{pendingRequests.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-professional-lg border border-gray-200 overflow-hidden">
              <TabSwitcher
                tabs={tabs}
                activeTab={activeTab}
                onChange={setActiveTab}
                className="px-2 md:px-4 lg:px-6"
              />
            </div>

            {/* Requests Grid */}
            {isLoading ? (
              <div className="bg-white rounded-xl md:rounded-2xl shadow-professional-lg border border-gray-200 p-6 md:p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-2 md:border-4 border-gray-300 border-t-blue-600 mb-3 md:mb-4"></div>
                <p className="text-xs md:text-sm lg:text-base text-gray-600 font-medium">Loading requests...</p>
              </div>
            ) : displayRequests.length === 0 ? (
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
                        <p className="text-[10px] md:text-xs text-blue-600 uppercase tracking-wide font-semibold mb-0.5 md:mb-1">Viewing All Requests</p>
                        <p className="text-xs md:text-sm text-blue-900">
                          <strong className="text-sm md:text-base lg:text-lg">{allRequests.length}</strong> total visitors
                        </p>
                      </div>
                      <div className="flex gap-2 md:gap-4 text-xs md:text-sm">
                        <div>
                          <span className="text-blue-600 font-semibold">{allPendingRequests.length}</span>
                          <span className="text-blue-700 ml-0.5 md:ml-1">pending</span>
                        </div>
                        <div>
                          <span className="text-green-600 font-semibold">{allApprovedRequests.length}</span>
                          <span className="text-green-700 ml-0.5 md:ml-1">approved</span>
                        </div>
                        <div>
                          <span className="text-red-600 font-semibold">{allRejectedRequests.length}</span>
                          <span className="text-red-700 ml-0.5 md:ml-1">rejected</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid gap-3 md:gap-4 lg:gap-6 lg:grid-cols-2 xl:grid-cols-3">
                  {displayRequests.map((request) => {
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
