'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppHeader } from '@/components/app-header';
import { PageContainer } from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Toast, useToast } from '@/components/toast';
import { useAuth } from '@/lib/auth-store';
import { API_ENDPOINTS } from '@/lib/api-config';
import { QrScanner } from '@/components/qr-scanner';
import { ScanQrCode, RefreshCw, CheckCircle, CalendarDays } from 'lucide-react';
import { isSameDay, parseISO } from 'date-fns';

interface ICard {
  id: number;
  card_name: string;
  icard_name?: string | null;
  occ_status: boolean;
  occ_to: number | null;
  created_at: string;
  updated_at: string;
}

interface Visitor {
  id: string;
  name: string;
  mobileNumber: string;
  email: string;
  company: string;
  personToMeet: {
    id: string;
    displayName: string;
  };
  reasonForVisit: string;
  status: string;
  submittedAt: string;
  updatedAt: string;
  visitorNumber?: string;
  rawId: number;
  assignedCard?: string | null;
}

// Utility function to format card names to readable format
const formatCardName = (cardName: string): string => {
  // Match pattern: CU003, VE001, VI002, etc.
  const match = cardName.match(/^([A-Z]{2})(\d+)$/i);

  if (match) {
    const [, typeCode, number] = match;

    // Map type codes to full names
    const typeMap: { [key: string]: string } = {
      'CU': 'Customer',
      'VE': 'Vendor',
      'VI': 'Visitor'
    };

    const typeName = typeMap[typeCode.toUpperCase()] || typeCode;
    return `${typeName} Card_${number}`;
  }

  // Fallback pattern: type_number_letter (e.g., customer_1_A, vendor_2_B)
  const fallbackMatch = cardName.match(/^([a-z]+)_(\d+)_([a-z])$/i);
  if (fallbackMatch) {
    const [, type, number] = fallbackMatch;
    const formattedType = type.charAt(0).toUpperCase() + type.slice(1);
    const paddedNumber = number.padStart(2, '0');
    return `${formattedType} Card_${paddedNumber}`;
  }

  // Return original name if no pattern matches
  return cardName;
};

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const [approvedVisitors, setApprovedVisitors] = useState<Visitor[]>([]);
  const [icards, setIcards] = useState<ICard[]>([]);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isReleasingAll, setIsReleasingAll] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Date filter state
  const today = useMemo(() => new Date().toISOString().split('T')[0], []); // "YYYY-MM-DD"
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showAllVisitors, setShowAllVisitors] = useState(false);

  // Filter visitors by selected date - MOVED UP to maintain hook order
  const filteredByDate = useMemo(() => {
    // If "Show All Visitors" is enabled, return all visitors without date filtering
    if (showAllVisitors) {
      return approvedVisitors;
    }

    return approvedVisitors.filter((visitor) => {
      if (!selectedDate) return true;

      try {
        const visitorDate = parseISO(visitor.submittedAt);
        const filterDate = parseISO(selectedDate);
        return isSameDay(visitorDate, filterDate);
      } catch (error) {
        console.error('Error parsing date:', error);
        return false;
      }
    });
  }, [approvedVisitors, selectedDate, showAllVisitors]);

  // Sort approved visitors by most recent first - MOVED UP to maintain hook order
  const sortedApprovedVisitors = useMemo(() => {
    return [...filteredByDate].sort((a, b) => {
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });
  }, [filteredByDate]);

  // Fetch all approved visitors
  const fetchApprovedVisitors = useCallback(async () => {
    if (!user) {
      console.log('No user found, skipping fetch');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('Fetching visitors with token:', user.access_token?.substring(0, 20) + '...');

      let allVisitors: any[] = [];
      let currentPage = 1;
      let totalPages = 1;

      do {
        const url = `${API_ENDPOINTS.visitors}/?page=${currentPage}&page_size=100`;
        console.log('Fetching from:', url);

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'accept': 'application/json',
          },
        });

        if (!response.ok) {
          let errorText = '';
          let errorDetails: any = {};
          try {
            errorText = await response.text();
            try {
              errorDetails = JSON.parse(errorText);
            } catch {
              errorDetails = { detail: errorText || 'Unknown error' };
            }
          } catch (e) {
            errorText = 'Failed to read error response';
          }
          
          console.error('Failed to fetch visitors:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
            errorDetails: errorDetails,
            url: url,
          });

          // Check if it's an authentication error
          if (response.status === 401) {
            addToast('Authentication failed. Please log in again.', 'error');
            logout();
            return;
          }

          const errorMessage = errorDetails.detail || errorDetails.message || `Failed to fetch visitors: ${response.status} ${response.statusText}`;
          throw new Error(errorMessage);
        }

        const data = await response.json();
        allVisitors = [...allVisitors, ...data.visitors];
        totalPages = Math.ceil(data.total / 100);
        currentPage++;
      } while (currentPage <= totalPages);

      // Get unique approver usernames from approved visitors
      const approvedVisitors = allVisitors.filter((v: any) => v.status.toLowerCase() === 'approved');
      const uniqueApprovers = [...new Set(approvedVisitors.map((v: any) => v.person_to_meet))];

      // Fetch approver details for all unique approvers
      const approverDetailsMap = new Map<string, string>();
      await Promise.all(
        uniqueApprovers.map(async (username) => {
          try {
            const response = await fetch(`${API_ENDPOINTS.approvers}/${username}`, {
              headers: {
                'Authorization': `Bearer ${user.access_token}`,
                'accept': 'application/json',
              },
            });
            if (response.ok) {
              const approver = await response.json();
              approverDetailsMap.set(username, approver.name);
            } else {
              approverDetailsMap.set(username, username); // Fallback to username
            }
          } catch (error) {
            console.error(`Error fetching approver ${username}:`, error);
            approverDetailsMap.set(username, username); // Fallback to username
          }
        })
      );

      // Map approved visitors with approver names (card assignment will be updated separately)
      const approved = approvedVisitors.map((visitor: any) => ({
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
        status: 'approved',
        submittedAt: visitor.check_in_time,
        updatedAt: visitor.updated_at,
        visitorNumber: visitor.id.toString(),
        rawId: visitor.id,
        assignedCard: null, // Will be updated when icards are fetched
      }));

      setApprovedVisitors(approved);
      
      // Immediately fetch card assignments after visitors are loaded
      if (approved.length > 0) {
        // Fetch card assignments right away for initial load
        fetchVisitorCardAssignments(approved).catch((err) => {
          console.error('Error fetching card assignments on initial load:', err);
        });
      }
      
      return approved; // Return the approved visitors array
    } catch (error) {
      console.error('Error fetching visitors:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        addToast('Cannot connect to server. Please ensure the backend is running.', 'error');
      } else {
        addToast(error instanceof Error ? error.message : 'Failed to fetch visitors', 'error');
      }
      return []; // Return empty array on error
    } finally {
      setIsLoading(false);
    }
  }, [user, addToast, logout]);

  // Fetch all ICards
  const fetchICards = useCallback(async () => {
    if (!user) {
      console.log('No user found, skipping ICards fetch');
      return;
    }

    try {
      const url = `${API_ENDPOINTS.icards}/?page=1&page_size=100`;
      console.log('Fetching ICards from:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'accept': 'application/json',
        },
      });

      if (!response.ok) {
        let errorText = '';
        let errorDetails: any = {};
        try {
          errorText = await response.text();
          try {
            errorDetails = JSON.parse(errorText);
          } catch {
            errorDetails = { detail: errorText || 'Unknown error' };
          }
        } catch (e) {
          errorText = 'Failed to read error response';
        }
        
        console.error('Failed to fetch ICards:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          errorDetails: errorDetails,
          url: url,
        });

        // Check if it's an authentication error
        if (response.status === 401) {
          addToast('Authentication failed. Please log in again.', 'error');
          logout();
          return;
        }

        const errorMessage = errorDetails.detail || errorDetails.message || `Failed to fetch ICards: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('ICards fetched successfully:', data);
      console.log('📊 ICard Status Summary:', {
        total: data.cards?.length || 0,
        occupied: data.cards?.filter((c: ICard) => c.occ_status).length || 0,
        available: data.cards?.filter((c: ICard) => !c.occ_status).length || 0,
        occupiedCards: data.cards?.filter((c: ICard) => c.occ_status).map((c: ICard) => ({
          name: c.card_name,
          occupiedBy: c.occ_to
        })) || []
      });
      setIcards(data.cards || []);
    } catch (error) {
      console.error('Error fetching ICards:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        addToast('Cannot connect to server. Please ensure the backend is running.', 'error');
      } else {
        addToast(error instanceof Error ? error.message : 'Failed to fetch ICards', 'error');
      }
    }
  }, [user, addToast, logout]);

  // Assign ICard to visitor
  const handleAssignCard = async (cardId: number) => {
    if (!selectedVisitor || !user) return;

    // Check if visitor already has a card assigned
    if (selectedVisitor.assignedCard) {
      addToast(`Visitor already has an ICard assigned: ${selectedVisitor.assignedCard}. Please release it first.`, 'error');
      return;
    }

    setIsAssigning(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.icards}/${cardId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`,
          'accept': 'application/json',
        },
        body: JSON.stringify({
          visitor_id: selectedVisitor.rawId,
        }),
      });

      if (!response.ok) {
        let errorData: any = {};
        let errorMessage = 'Failed to assign card';
        try {
          const errorText = await response.text();
          try {
            errorData = JSON.parse(errorText);
            errorMessage = errorData.detail || errorData.message || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        console.error('Assign card error:', errorData);
        throw new Error(errorMessage);
      }

      // Get the assigned card name from the response
      const cardData = await response.json();
      const assignedCardName = cardData.card_name;

      // Immediately update the visitor's assignedCard in state
      // This ensures the UI updates instantly without waiting for refresh
      setApprovedVisitors((prevVisitors) =>
        prevVisitors.map((visitor) =>
          visitor.id === selectedVisitor.id
            ? { ...visitor, assignedCard: assignedCardName }
            : visitor
        )
      );

      // Update selected visitor if it's still selected
      if (selectedVisitor) {
        setSelectedVisitor({
          ...selectedVisitor,
          assignedCard: assignedCardName,
        });
      }

      addToast('ICard assigned successfully', 'success');
      
      // Refresh ICards to update availability
      await fetchICards();
      
      // Don't refresh visitors immediately - the state update above is enough
      // Refresh visitors in the background after a delay to ensure sync
      // This prevents the "With I-Cards" section from disappearing
      setTimeout(() => {
        fetchApprovedVisitors().catch((err) => {
          console.error('Error refreshing visitors:', err);
        });
      }, 1000);
      
      // Clear selection after a brief delay to show the success message
      setTimeout(() => {
        setSelectedVisitor(null);
      }, 500);
    } catch (error) {
      console.error('Error assigning card:', error);
      addToast(error instanceof Error ? error.message : 'Failed to assign ICard', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  // Mark visitor as completed
  const handleCompleteVisitor = async () => {
    if (!selectedVisitor || !user) return;

    setIsCompleting(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.visitors}/${selectedVisitor.rawId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`,
          'accept': 'application/json',
        },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });

      if (!response.ok) {
        let errorData: any = {};
        let errorMessage = 'Failed to mark visitor as completed';
        try {
          const errorText = await response.text();
          try {
            errorData = JSON.parse(errorText);
            errorMessage = errorData.detail || errorData.message || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        console.error('Complete visitor error:', errorData);
        throw new Error(errorMessage);
      }

      // Remove the visitor from the approved list (they're no longer APPROVED)
      setApprovedVisitors((prevVisitors) =>
        prevVisitors.filter((visitor) => visitor.id !== selectedVisitor.id)
      );

      // Clear selection
      setSelectedVisitor(null);
      setShowCompleteModal(false);

      addToast('Visitor marked as completed', 'success');

      // Refresh data to ensure consistency
      await fetchApprovedVisitors();
      await fetchICards();
    } catch (error) {
      console.error('Error completing visitor:', error);
      addToast(error instanceof Error ? error.message : 'Failed to mark visitor as completed', 'error');
    } finally {
      setIsCompleting(false);
    }
  };

  // Release ICard and update visitor checkout
  const handleReleaseCard = async (cardId: number) => {
    if (!user) return;

    try {
      // Get card details first to know which visitor to update
      const cardResponse = await fetch(`${API_ENDPOINTS.icards}/${cardId}`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'accept': 'application/json',
        },
      });

      if (!cardResponse.ok) {
        throw new Error('Failed to fetch card details');
      }

      const cardData = await cardResponse.json();
      const visitorId = cardData.occ_to;

      // Step 1: Release the card
      const releaseResponse = await fetch(`${API_ENDPOINTS.icards}/${cardId}/release`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'accept': 'application/json',
        },
      });

      if (!releaseResponse.ok) {
        const errorData = await releaseResponse.json().catch(() => ({}));
        console.error('Release card error:', errorData);
        throw new Error(errorData.detail || 'Failed to release card');
      }

      // Step 2: Update visitor checkout time if card was occupied
      if (visitorId) {
        const checkoutTime = new Date().toISOString();

        const updateResponse = await fetch(`${API_ENDPOINTS.visitors}/${visitorId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.access_token}`,
            'accept': 'application/json',
          },
          body: JSON.stringify({
            check_out_time: checkoutTime,
          }),
        });

        if (!updateResponse.ok) {
          console.error('Failed to update visitor checkout time, but card was released');
        }
      }

      addToast('ICard released successfully', 'success');
      await fetchICards();
      await fetchApprovedVisitors();
    } catch (error) {
      console.error('Error releasing card:', error);
      addToast(error instanceof Error ? error.message : 'Failed to release ICard', 'error');
    }
  };

  // Release all ICards (fix "all occupied" when no assignments were made)
  const handleReleaseAllCards = async () => {
    if (!user || occupiedCards.length === 0) return;

    console.log(`🔓 Attempting to release all ${occupiedCards.length} occupied ICards...`);
    setIsReleasingAll(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.icards}/release-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'accept': 'application/json',
        },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error('❌ Failed to release all cards:', err);
        throw new Error(err.detail || 'Failed to release all ICards');
      }
      const data = await response.json();
      console.log('✅ All ICards released successfully:', data);
      setIcards(data.cards || []);
      addToast(`All ${occupiedCards.length} ICards released successfully!`, 'success');
      await fetchApprovedVisitors();
    } catch (error) {
      console.error('❌ Error releasing all cards:', error);
      addToast(error instanceof Error ? error.message : 'Failed to release all ICards', 'error');
    } finally {
      setIsReleasingAll(false);
    }
  };

  // Handle QR code scan
  const handleQrScan = async (scannedData: string) => {
    console.log('🔍 Processing QR scan:', scannedData);
    setShowScanner(false);

    try {
      // Check if this is a visitor appointment QR code (starts with APT-)
      if (scannedData.startsWith('APT-')) {
        console.log('👤 Processing visitor appointment QR code');
        
        // Find the visitor by appointment ID or visitor number
        const visitor = approvedVisitors.find(v => 
          v.visitorNumber === scannedData || 
          v.id.includes(scannedData.split('-')[1]) ||
          scannedData.includes(v.visitorNumber || '')
        );

        if (visitor) {
          console.log('✅ Found visitor:', visitor.name);
          setSelectedVisitor(visitor);
          
          // Check if visitor already has a card assigned
          if (visitor.assignedCard) {
            addToast(`Visitor ${visitor.name} already has an ICard assigned: ${visitor.assignedCard}. Cannot assign another card.`, 'error');
          } else {
            addToast(`Visitor ${visitor.name} selected. You can now assign an available ICard.`, 'success');
          }
        } else {
          console.log('❌ Visitor not found for QR code:', scannedData);
          addToast(`Visitor not found for QR code: "${scannedData}". Make sure the visitor is approved.`, 'error');
        }
        return;
      }

      // Check if this is an ICard QR code (CU001, VE005, VI012 format)
      const icardMatch = scannedData.trim().toUpperCase().match(/^(CU|VE|VI)\d{3}$/);
      if (icardMatch) {
        const cardName = scannedData.trim().toUpperCase();
        console.log('🎫 ICard QR detected:', cardName);

        try {
          const response = await fetch(`${API_ENDPOINTS.icards}/scan-release`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user!.access_token}`,
              'accept': 'application/json',
            },
            body: JSON.stringify({ card_name: cardName }),
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => null);
            throw new Error(errData?.detail || 'Failed to release card');
          }

          const result = await response.json();
          const visitorInfo = result.visitor_name ? ` (Visitor: ${result.visitor_name})` : '';
          addToast(`Card ${cardName} released & visit completed${visitorInfo}`, 'success');

          // Refresh data
          await Promise.all([fetchApprovedVisitors(), fetchICards()]);
        } catch (err) {
          addToast(err instanceof Error ? err.message : 'Failed to release card', 'error');
        }
        return;
      }

      // Handle card release QR code (legacy numeric ID format)
      let cardId: number;

      try {
        const jsonData = JSON.parse(scannedData);
        cardId = jsonData.card_id || jsonData.id || parseInt(jsonData, 10);
        console.log('📦 Parsed JSON from QR:', jsonData);
      } catch {
        // If not JSON, try to extract numeric ID directly
        cardId = parseInt(scannedData, 10);
        console.log('🔢 Parsed numeric ID from QR:', cardId);
      }

      if (isNaN(cardId)) {
        console.error('❌ Invalid QR code format:', scannedData);
        addToast(`Invalid QR code format: "${scannedData}"`, 'error');
        return;
      }

      console.log('✅ Releasing card with ID:', cardId);
      // Release the card
      await handleReleaseCard(cardId);
    } catch (error) {
      console.error('❌ Error processing QR scan:', error);
      addToast(error instanceof Error ? error.message : 'Failed to process QR code', 'error');
    }
  };

  // Fetch card assignments for all approved visitors using the new endpoint - MOVED UP
  const fetchVisitorCardAssignments = useCallback(async (visitorsToFetch?: typeof approvedVisitors) => {
    // Use provided visitors or current state
    const visitors = visitorsToFetch || approvedVisitors;
    if (visitors.length === 0) return;

    try {
      // Fetch card assignments for all visitors in parallel
      const cardPromises = visitors.map(async (visitor) => {
        try {
          const response = await fetch(`${API_ENDPOINTS.icards}/visitor/${visitor.rawId}/card`, {
            headers: {
              'Authorization': `Bearer ${user?.access_token}`,
              'accept': 'application/json',
            },
          });
          if (response.ok) {
            const data = await response.json();
            return {
              visitorId: visitor.rawId,
              cardName: data.icard_name || data.card_name,
              cardId: data.card_id,
            };
          }
        } catch (error) {
          console.error(`Error fetching card for visitor ${visitor.rawId}:`, error);
        }
        return { visitorId: visitor.rawId, cardName: null, cardId: null };
      });

      const cardAssignments = await Promise.all(cardPromises);

      // Create a map of visitor ID to card name
      const visitorCardMap = new Map<number, string | null>();
      cardAssignments.forEach((assignment) => {
        visitorCardMap.set(assignment.visitorId, assignment.cardName);
      });

      // Update approved visitors with card assignments
      // Only update visitors that don't already have a card assigned (to preserve immediate updates)
      setApprovedVisitors((prevVisitors) =>
        prevVisitors.map((visitor) => {
          const cardName = visitorCardMap.get(visitor.rawId);
          // Only update if visitor doesn't already have a card assigned
          // This preserves immediate state updates after assignment
          if (visitor.assignedCard === null || visitor.assignedCard === undefined) {
            return {
              ...visitor,
              assignedCard: cardName || null,
            };
          }
          return visitor; // Keep existing assignedCard if already set
        })
      );
    } catch (error) {
      console.error('Error fetching visitor card assignments:', error);
    }
  }, [user, approvedVisitors]);

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Fetch visitors and I-cards in parallel
      const [refreshedVisitors] = await Promise.all([fetchApprovedVisitors(), fetchICards()]);

      // Explicitly fetch card assignments for the refreshed visitors
      // This ensures visitors with I-Cards are displayed correctly after refresh
      if (refreshedVisitors && refreshedVisitors.length > 0) {
        await fetchVisitorCardAssignments(refreshedVisitors);
      }

      addToast('Data refreshed successfully', 'success');
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

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

  // Redirect to admin login if not authenticated or not admin/superuser
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/admin/login');
      } else if (user) {
        // Only allow admin emails or superusers to access admin page
        const canAccessAdmin = user.superuser || (user.admin && isAdminEmail(user.email));
        if (!canAccessAdmin) {
          // User is authenticated but not admin email or superuser, redirect to dashboard
          router.push('/dashboard');
        }
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Fetch data when user is available (only on mount or when user changes)
  useEffect(() => {
    if (user) {
      fetchApprovedVisitors();
      fetchICards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only re-fetch when user changes, not when functions change

  // Auto-refresh ICards every 10 seconds to stay in sync with appointment page
  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(() => {
      console.log('[Admin] Auto-refreshing ICards to stay in sync...');
      fetchICards();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(intervalId);
  }, [user, fetchICards]);

  // Fetch card assignments when approved visitors change
  // Only fetch if ALL visitors have null/undefined assignedCard (initial load scenario)
  useEffect(() => {
    if (approvedVisitors.length > 0) {
      // Check if ALL visitors have null/undefined assignedCard (meaning initial load)
      const allHaveNullCards = approvedVisitors.every(v => v.assignedCard === null || v.assignedCard === undefined);
      // Only fetch if all visitors have null cards (initial load scenario)
      // This prevents overwriting immediate state updates after assignment
      if (allHaveNullCards) {
        fetchVisitorCardAssignments();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approvedVisitors.length]); // Only re-run when the number of visitors changes

  // Also update card assignments when icards change (for real-time updates after assign/release)
  useEffect(() => {
    if (approvedVisitors.length > 0 && icards.length > 0) {
      fetchVisitorCardAssignments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [icards.length]);

  // Show loading state while checking auth
  if (authLoading) {
    return null;
  }

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  // Sort available cards in ascending order by card_name
  // Show all available cards, but for customer cards only show 1-5 (hide customer_6_W202 and above)
  const availableCards = icards
    .filter((card) => {
      if (card.occ_status) return false; // Skip occupied cards
      
      // If it's a customer card, only show if numbered 1-5
      const customerMatch = card.card_name.match(/^customer_(\d+)_/i);
      if (customerMatch) {
        const customerNumber = parseInt(customerMatch[1], 10);
        return customerNumber >= 1 && customerNumber <= 5; // Only customer_1 to customer_5
      }
      
      // For all other cards (vendor, etc.), show them
      return true;
    })
    .sort((a, b) => a.card_name.localeCompare(b.card_name));

  const occupiedCards = icards.filter((card) => card.occ_status);

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

      <PageContainer>
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          {/* Header - Responsive */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 md:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="mt-1 sm:mt-1.5 md:mt-2 text-sm sm:text-base md:text-lg text-muted-foreground">
                Manage ICard assignments for approved visitors
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full sm:w-auto">
              <Button
                onClick={handleRefresh}
                variant="outline"
                disabled={isRefreshing}
                className="border-border text-sm h-11 md:h-10"
              >
                <RefreshCw className={`mr-1.5 md:mr-2 h-4 w-4 md:h-5 md:w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                <span className="sm:hidden">↻</span>
              </Button>
              <Button
                onClick={() => setShowScanner(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm h-11 md:h-10"
              >
                <ScanQrCode className="mr-1.5 md:mr-2 h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">Scan QR Code</span>
                <span className="sm:hidden">Scan QR</span>
              </Button>
            </div>
          </div>

          {/* Warning Banner - All Cards Occupied */}
          {occupiedCards.length > 0 && availableCards.length === 0 && (
            <div className="rounded-lg bg-orange-50 border-2 border-orange-300 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="h-5 w-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-orange-800">All ICards Are Occupied</h3>
                  <p className="mt-1 text-sm text-orange-700">
                    All {occupiedCards.length} ICards are currently marked as occupied. If this is incorrect or you need to free up cards, you can release them all at once.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      onClick={handleReleaseAllCards}
                      disabled={isReleasingAll}
                      variant="outline"
                      size="sm"
                      className="bg-white text-orange-700 border-orange-400 hover:bg-orange-100 hover:text-orange-800 font-semibold"
                    >
                      {isReleasingAll ? 'Releasing...' : `Release All ${occupiedCards.length} ICards`}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content - Fully Responsive Grid */}
          <div className="grid gap-4 md:gap-6 xl:grid-cols-2">
            {/* Left: Approved Visitors List - Fully Responsive */}
            <div className="space-y-2 sm:space-y-3 md:space-y-4">
              {/* Header with title and count */}
              <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1.5 sm:gap-2">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground">
                  Approved Visitors ({filteredByDate.length})
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {filteredByDate.filter(v => v.assignedCard).length} with I-Cards
                </p>
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-3 flex-wrap">
                <Label htmlFor="visitor-date" className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 md:h-5 md:w-5" />
                  Filter by Date:
                </Label>
                <Input
                  id="visitor-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedVisitor(null); // Clear selection when filter changes
                  }}
                  max={today}
                  disabled={showAllVisitors}
                  className="w-auto min-w-[140px] text-sm h-11 md:h-10"
                />
                {selectedDate !== today && !showAllVisitors && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(today)}
                    className="text-sm h-11 md:h-10"
                  >
                    Today
                  </Button>
                )}
              </div>

              {/* Show All Visitors Checkbox */}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center min-w-[44px] min-h-[44px]">
                  <Checkbox
                    id="show-all-visitors"
                    checked={showAllVisitors}
                    onCheckedChange={(checked) => {
                      setShowAllVisitors(checked as boolean);
                      setSelectedVisitor(null); // Clear selection when filter changes
                    }}
                  />
                </div>
                <Label
                  htmlFor="show-all-visitors"
                  className="text-sm text-foreground font-medium cursor-pointer"
                >
                  Show All Visitors (No Date Filter)
                </Label>
              </div>

              {isLoading ? (
                <div className="rounded-lg border border-border border-dashed p-6 sm:p-8 text-center">
                  <p className="text-sm sm:text-base md:text-lg text-muted-foreground">Loading visitors...</p>
                </div>
              ) : filteredByDate.length === 0 ? (
                <div className="rounded-lg border border-border border-dashed p-4 sm:p-6 md:p-8 text-center space-y-3">
                  <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
                    {showAllVisitors
                      ? 'No approved visitors found.'
                      : `No approved visitors found for ${new Date(selectedDate).toLocaleDateString()}.`
                    }
                  </p>
                  {!showAllVisitors && selectedDate !== today && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate(today)}
                      className="text-sm h-11 md:h-10"
                    >
                      Show Today's Visitors
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5 sm:space-y-2 md:space-y-3 max-h-[calc(100vh-280px)] sm:max-h-[calc(100vh-300px)] md:max-h-[calc(100vh-320px)] overflow-y-auto -mx-1 px-1">
                  {/* Section: Visitors with I-Cards - Fully Responsive */}
                  {sortedApprovedVisitors.some(v => v.assignedCard) && (
                    <div className="sticky top-0 bg-background/95 backdrop-blur-sm py-1 sm:py-1.5 md:py-2 px-2 sm:px-2.5 md:px-3 -mx-1 mb-1 sm:mb-1.5 md:mb-2 border-b border-border z-10">
                      <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        With I-Cards ({sortedApprovedVisitors.filter(v => v.assignedCard).length})
                      </p>
                    </div>
                  )}

                  {sortedApprovedVisitors.map((visitor, index, array) => {
                    // Check if we need to show "Without I-Cards" separator
                    const showSeparator =
                      index > 0 &&
                      array[index - 1].assignedCard &&
                      !visitor.assignedCard;

                    return (
                      <div key={visitor.id}>
                        {showSeparator && (
                          <div className="sticky top-0 bg-background/95 backdrop-blur-sm py-1 sm:py-1.5 md:py-2 px-2 sm:px-2.5 md:px-3 -mx-1 mb-1 sm:mb-1.5 md:mb-2 mt-1 sm:mt-1.5 md:mt-2 border-b border-border z-10">
                            <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                              Without I-Cards ({sortedApprovedVisitors.filter(v => !v.assignedCard).length})
                            </p>
                          </div>
                        )}
                        <div
                          onClick={() => setSelectedVisitor(visitor)}
                          className={`rounded-lg border p-3 sm:p-4 md:p-5 cursor-pointer transition-colors touch-manipulation ${
                            selectedVisitor?.id === visitor.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border bg-card hover:bg-muted/50 active:bg-muted/70'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-foreground truncate">
                                {visitor.name}
                              </h3>
                              <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-0.5 sm:mt-0.5 md:mt-1 truncate">
                                {visitor.company}
                              </p>
                              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-0.5 md:mt-1">
                                Visitor #: {visitor.visitorNumber}
                              </p>
                              {visitor.assignedCard && (
                                <div className="mt-1 sm:mt-1.5 md:mt-2 inline-flex items-center rounded-md bg-blue-50 px-2 py-1 md:px-2.5 md:py-1.5 text-xs sm:text-sm font-medium text-blue-700 border border-blue-200">
                                  <svg className="mr-1 md:mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                  </svg>
                                  <span className="truncate">{formatCardName(visitor.assignedCard)}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-0.5 sm:gap-1 md:gap-2 flex-shrink-0">
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 md:px-2.5 md:py-1.5 text-xs sm:text-sm font-medium text-green-800">
                                Approved
                              </span>
                              {!visitor.assignedCard && (
                                <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-1 md:px-2.5 md:py-1.5 text-xs sm:text-sm font-medium text-orange-800">
                                  No Card
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Visitor Details and ICard Assignment - Fully Responsive */}
            <div className="space-y-2 sm:space-y-3 md:space-y-4">
              {selectedVisitor ? (
                <>
                  {/* Visitor Details - Fully Responsive */}
                  <div className="rounded-lg border border-border bg-card p-3 sm:p-4 md:p-6">
                    <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground mb-2 sm:mb-3 md:mb-4">
                      Visitor Details
                    </h2>
                    <div className="space-y-1.5 sm:space-y-2 md:space-y-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Name</p>
                        <p className="text-foreground font-medium">{selectedVisitor.name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Company</p>
                        <p className="text-foreground font-medium">{selectedVisitor.company}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Mobile</p>
                        <p className="text-foreground font-medium">{selectedVisitor.mobileNumber}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="text-foreground font-medium truncate">{selectedVisitor.email}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Person to Meet</p>
                        <p className="text-foreground font-medium">{selectedVisitor.personToMeet.displayName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Visitor Number</p>
                        <p className="text-foreground font-medium font-mono">{selectedVisitor.visitorNumber}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Assigned ICard</p>
                        {selectedVisitor.assignedCard ? (
                          <div className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 md:px-2.5 md:py-1.5 text-xs sm:text-sm font-medium text-blue-700 border border-blue-200 mt-1">
                            <svg className="mr-1 md:mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                            </svg>
                            <span className="truncate">{formatCardName(selectedVisitor.assignedCard)}</span>
                          </div>
                        ) : (
                          <p className="text-orange-600 font-medium text-sm">Not assigned</p>
                        )}
                      </div>
                    </div>

                    {/* Completed Button */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <Button
                        onClick={() => setShowCompleteModal(true)}
                        variant="outline"
                        disabled={!!selectedVisitor.assignedCard}
                        className={`w-full text-sm h-11 md:h-10 ${
                          selectedVisitor.assignedCard
                            ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                            : 'border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800'
                        }`}
                      >
                        <CheckCircle className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                        {selectedVisitor.assignedCard ? 'Release ICard First' : 'Completed'}
                      </Button>
                    </div>
                  </div>

                  {/* Available ICards - Fully Responsive */}
                  {!selectedVisitor.assignedCard && (
                    <div className="rounded-lg border border-border bg-card p-3 sm:p-4 md:p-6">
                      <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4 gap-3">
                        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground">
                          Available ICards ({availableCards.length})
                        </h2>
                        {occupiedCards.length > 0 && (
                          <Button
                            onClick={handleReleaseAllCards}
                            disabled={isReleasingAll}
                            variant="outline"
                            size="sm"
                            className="text-xs sm:text-sm text-orange-700 border-orange-400 hover:bg-orange-50 font-semibold flex-shrink-0"
                          >
                            {isReleasingAll ? 'Releasing...' : `Release All (${occupiedCards.length})`}
                          </Button>
                        )}
                      </div>
                    {availableCards.length === 0 ? (
                      <div className="space-y-3">
                        {icards.length === 0 ? (
                          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
                            <p className="text-sm text-gray-700 font-medium">No ICards found in the system.</p>
                            <p className="text-xs text-gray-600 mt-1">
                              Please check:
                            </p>
                            <ul className="text-xs text-gray-600 mt-2 ml-4 list-disc space-y-1">
                              <li>Backend is running and connected</li>
                              <li>ICards are configured in the database</li>
                              <li>Check browser console for errors</li>
                            </ul>
                          </div>
                        ) : (
                          <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 space-y-2">
                            <p className="text-sm text-orange-800">
                              <strong>All {occupiedCards.length} ICards are currently occupied.</strong>
                              <br />
                              If this is incorrect, you can release them all at once:
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleReleaseAllCards}
                              disabled={isReleasingAll}
                              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/50 font-semibold"
                            >
                              {isReleasingAll ? 'Releasing all cards...' : 'Release All ICards'}
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1 sm:space-y-1.5 md:space-y-2 max-h-[250px] sm:max-h-[300px] md:max-h-[400px] overflow-y-auto">
                        {availableCards.map((card) => (
                          <div
                            key={card.id}
                            className="flex items-center justify-between p-2 sm:p-2.5 md:p-3 rounded-lg border border-border bg-muted/50 gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs sm:text-sm md:text-base font-medium text-foreground truncate">{formatCardName(card.icard_name || card.card_name)}</p>
                              <p className="text-xs sm:text-sm text-green-600">Available</p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleAssignCard(card.id)}
                              disabled={isAssigning}
                              className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm h-11 md:h-10 px-3 md:px-2.5 flex-shrink-0 touch-manipulation"
                            >
                              {isAssigning ? 'Assigning...' : 'Assign'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    </div>
                  )}

                  {/* Occupied ICards - Fully Responsive */}
                  {occupiedCards.length > 0 && (
                    <div className="rounded-lg border border-border bg-card p-3 sm:p-4 md:p-6">
                      <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground mb-2 sm:mb-3 md:mb-4">
                        Occupied ICards ({occupiedCards.length})
                      </h2>
                      <div className="space-y-1 sm:space-y-1.5 md:space-y-2 max-h-[200px] sm:max-h-[250px] md:max-h-[300px] overflow-y-auto">
                        {occupiedCards.map((card) => (
                          <div
                            key={card.id}
                            className="flex items-center justify-between p-2 sm:p-2.5 md:p-3 rounded-lg border border-border bg-muted/50 gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs sm:text-sm md:text-base font-medium text-foreground truncate">{formatCardName(card.icard_name || card.card_name)}</p>
                              <p className="text-xs sm:text-sm text-red-600">
                                Occupied (Visitor #{card.occ_to})
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReleaseCard(card.id)}
                              className="text-destructive hover:text-destructive text-sm h-11 md:h-10 px-3 md:px-2.5 flex-shrink-0 touch-manipulation"
                            >
                              Release
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-lg border border-border border-dashed p-6 sm:p-8 md:p-12 text-center">
                  <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
                    Select a visitor from the list to view details and assign an ICard
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageContainer>

      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {showScanner && (
        <QrScanner
          onScan={handleQrScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Complete Confirmation Modal */}
      {showCompleteModal && selectedVisitor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              Mark Visit as Completed
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              Are you sure you want to mark visitor <strong>{selectedVisitor.name}</strong>'s visit as completed?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                onClick={() => setShowCompleteModal(false)}
                variant="outline"
                disabled={isCompleting}
                className="w-full sm:w-auto h-11 md:h-10 text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCompleteVisitor}
                disabled={isCompleting}
                className="w-full sm:w-auto h-11 md:h-10 text-sm bg-green-600 hover:bg-green-700 text-white"
              >
                {isCompleting ? 'Updating...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
