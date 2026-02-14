'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppHeader } from '@/components/app-header';
import { PageContainer } from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Toast, useToast } from '@/components/toast';
import { useAuth } from '@/lib/auth-store';
import { API_ENDPOINTS, API_URL } from '@/lib/api-config';
import { QrScanner } from '@/components/qr-scanner';
import { ScanQrCode, RefreshCw, User, FileText, Copy, CheckCheck } from 'lucide-react';
import { VisitorImage } from '@/components/visitor-image';

interface ICard {
  id: number;
  card_name: string;
  occ_status: boolean;
  occ_to: number | null;
  created_at: string;
  updated_at: string;
}

interface VisitorData {
  id: number;
  visitor_name: string;
  mobile_number: string;
  email_address?: string;
  company?: string;
  person_to_meet: string;
  reason_to_visit: string;
  isAppointment?: boolean;
  appointmentDate?: string;
  appointmentTime?: string;
  qr_code?: string;
  status: string;
  warehouse?: string;
  check_in_time?: string;
  check_out_time?: string | null;
  img_url?: string;
  visitor_number?: string;
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

export default function AppointmentPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const [scannedVisitor, setScannedVisitor] = useState<VisitorData | null>(null);
  const [icards, setIcards] = useState<ICard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showReleaseScanner, setShowReleaseScanner] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Google Form URL
  const googleFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSczeVeqIu82VYwxzCDBM9T1Lt-IGwZVUKuBQpopxxYRKZEkdA/viewform?usp=dialog';

  // Fetch ICards
  const fetchICards = useCallback(async () => {
    if (!user) return;

    try {
      const url = `${API_ENDPOINTS.icards}/`;
      console.log('[Appointment] Fetching ICards from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          addToast('Authentication failed. Please log in again.', 'error');
          logout();
          return;
        }

        throw new Error(`Failed to fetch ICards: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setIcards(data.cards || []);
    } catch (error) {
      console.error('[Appointment] Error fetching ICards:', error);
      console.error('[Appointment] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        url: `${API_ENDPOINTS.icards}/`,
        apiUrl: API_ENDPOINTS.icards,
        baseUrl: API_URL
      });
      if (error instanceof TypeError && error.message.includes('fetch')) {
        addToast('Cannot connect to server. Please ensure the backend is running.', 'error');
        console.error('[Appointment] Network error - Backend may not be running or URL is incorrect');
      } else {
        addToast(error instanceof Error ? error.message : 'Failed to fetch ICards', 'error');
      }
    }
  }, [user, addToast, logout]);

  // Fetch visitor details by ID
  const fetchVisitorById = async (visitorId: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_ENDPOINTS.visitors}/${visitorId}`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          addToast('Visitor not found. Please check the QR code.', 'error');
          return null;
        }
        throw new Error(`Failed to fetch visitor: ${response.status}`);
      }

      const data = await response.json();
      
      // Fetch assigned card if any
      let assignedCard = null;
      try {
        const cardResponse = await fetch(`${API_ENDPOINTS.icards}/visitor/${data.id}/card`, {
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'accept': 'application/json',
          },
        });
        if (cardResponse.ok) {
          const cardData = await cardResponse.json();
          assignedCard = cardData.card_name;
        }
      } catch (err) {
        console.error('Error fetching card assignment:', err);
      }

      return { ...data, assignedCard };
    } catch (error) {
      console.error('Error fetching visitor:', error);
      addToast(error instanceof Error ? error.message : 'Failed to fetch visitor details', 'error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch appointment by QR code
  const fetchAppointmentByQr = async (qrCode: string) => {
    if (!user) return null;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_ENDPOINTS.appointments}/qr/${qrCode}`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          addToast('Appointment not found. Please check the QR code.', 'error');
          return null;
        }
        throw new Error(`Failed to fetch appointment: ${response.status}`);
      }

      const data = await response.json();
      
      // Convert appointment data to visitor format for display
      // Use visitor_id if available, otherwise use appointment_id
      const visitorId = data.visitor_id || data.visitor.id || data.appointment_id;
      
      const visitorData: VisitorData = {
        id: visitorId,  // Use visitor_id for ICard assignment
        visitor_name: data.visitor.name,
        mobile_number: data.visitor.mobile,
        email_address: data.visitor.email,
        company: data.visitor.company,
        person_to_meet: data.appointment_details.person_to_meet_name || data.appointment_details.person_to_meet, // Use name instead of username
        reason_to_visit: data.appointment_details.purpose,
        status: data.visitor_status || (data.is_approved ? 'APPROVED' : 'WAITING'),
        isAppointment: true,
        appointmentDate: data.appointment_details.date,
        appointmentTime: data.appointment_details.time,
        qr_code: data.qr_code,
        check_in_time: new Date().toISOString(), // Default check_in_time for appointments
        assignedCard: undefined, // Will be set below if card exists
      };
      
      // Fetch assigned card if visitor_id exists
      if (visitorId) {
        try {
          const cardResponse = await fetch(`${API_ENDPOINTS.icards}/visitor/${visitorId}/card`, {
            headers: {
              'Authorization': `Bearer ${user.access_token}`,
              'accept': 'application/json',
            },
          });
          if (cardResponse.ok) {
            const cardData = await cardResponse.json();
            visitorData.assignedCard = cardData.card_name;
          }
        } catch (err) {
          console.error('Error fetching card assignment:', err);
        }
      }

      return visitorData;
    } catch (error) {
      console.error('Error fetching appointment:', error);
      addToast(error instanceof Error ? error.message : 'Failed to fetch appointment details', 'error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle visitor QR scan
  const handleVisitorQrScan = async (scannedData: string) => {
    console.log('🔍 Processing visitor QR scan:', scannedData);
    setShowScanner(false);

    try {
      const trimmedData = scannedData.trim();
      
      // Check if it's an appointment QR code (format: APT-12345-ABCD1234)
      if (trimmedData.startsWith('APT-')) {
        console.log('📅 Detected appointment QR code:', trimmedData);
        const appointment = await fetchAppointmentByQr(trimmedData);

        if (appointment) {
          setScannedVisitor(appointment);
          if (appointment.assignedCard) {
            addToast(`Visitor already has ICard "${appointment.assignedCard}" assigned.`, 'error');
          } else {
            addToast('Appointment QR code scanned successfully!', 'success');
          }
        }
        return;
      }

      // Try to parse as JSON first (regular visitor QR)
      let visitorId: string;

      try {
        const jsonData = JSON.parse(trimmedData);
        visitorId = jsonData.visitor_id || jsonData.id || trimmedData;
        console.log('📦 Parsed JSON from QR:', jsonData);
      } catch {
        // If not JSON, use the scanned data directly as visitor ID
        visitorId = trimmedData;
        console.log('🔢 Using scanned data as visitor ID:', visitorId);
      }

      if (!visitorId || visitorId.length === 0) {
        console.error('❌ Invalid visitor ID:', scannedData);
        addToast(`Invalid QR code format: "${scannedData}"`, 'error');
        return;
      }

      console.log('✅ Fetching visitor with ID:', visitorId);
      const visitor = await fetchVisitorById(visitorId);
      
      if (visitor) {
        setScannedVisitor(visitor);
        if (visitor.assignedCard) {
          addToast(`Visitor already has ICard "${visitor.assignedCard}" assigned.`, 'error');
        } else {
          addToast('Visitor details loaded successfully', 'success');
        }
        // Refresh cards to show current status
        await fetchICards();
      }
    } catch (error) {
      console.error('❌ Error processing QR scan:', error);
      addToast(error instanceof Error ? error.message : 'Failed to process QR code', 'error');
    }
  };

  // Handle card QR scan for release
  const handleCardQrScan = async (scannedData: string) => {
    console.log('🔍 Processing card QR scan for release:', scannedData);
    setShowReleaseScanner(false);

    try {
      // Try to parse as JSON first
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
        console.error('❌ Invalid card ID:', scannedData);
        addToast(`Invalid QR code format: "${scannedData}"`, 'error');
        return;
      }

      console.log('✅ Releasing card with ID:', cardId);
      await handleReleaseCard(cardId);
    } catch (error) {
      console.error('❌ Error processing QR scan:', error);
      addToast(error instanceof Error ? error.message : 'Failed to process QR code', 'error');
    }
  };

  // Assign ICard to visitor
  const handleAssignCard = async (cardId: number) => {
    if (!scannedVisitor || !user) return;

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
          visitor_id: scannedVisitor.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Assign card error:', errorData);
        throw new Error(errorData.detail || 'Failed to assign card');
      }

      addToast('ICard assigned successfully', 'success');
      await fetchICards();
      // Refresh visitor data to show assigned card
      const updatedVisitor = await fetchVisitorById(scannedVisitor.id.toString());
      if (updatedVisitor) {
        setScannedVisitor(updatedVisitor);
      }
    } catch (error) {
      console.error('Error assigning card:', error);
      addToast(error instanceof Error ? error.message : 'Failed to assign ICard', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  // Release ICard
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
      
      // If the released card was for the scanned visitor, refresh visitor data
      if (scannedVisitor && scannedVisitor.id === visitorId) {
        const updatedVisitor = await fetchVisitorById(scannedVisitor.id.toString());
        if (updatedVisitor) {
          setScannedVisitor(updatedVisitor);
        }
      }
    } catch (error) {
      console.error('Error releasing card:', error);
      addToast(error instanceof Error ? error.message : 'Failed to release ICard', 'error');
    }
  };

  // Copy Google Form link
  const copyGoogleFormLink = async () => {
    try {
      await navigator.clipboard.writeText(googleFormUrl);
      setLinkCopied(true);
      addToast('Google Form link copied to clipboard!', 'success');
      
      // Reset copied state after 3 seconds
      setTimeout(() => {
        setLinkCopied(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      addToast('Failed to copy link. Please copy manually.', 'error');
    }
  };

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchICards();
      if (scannedVisitor) {
        const updatedVisitor = await fetchVisitorById(scannedVisitor.id.toString());
        if (updatedVisitor) {
          setScannedVisitor(updatedVisitor);
        }
      }
      addToast('Data refreshed successfully', 'success');
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch ICards when user is available (only once on mount or when user changes)
  useEffect(() => {
    if (user) {
      fetchICards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only depend on user, not fetchICards to prevent infinite loop

  // Auto-refresh ICards every 10 seconds to stay in sync with admin page
  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(() => {
      console.log('[Appointment] Auto-refreshing ICards to stay in sync...');
      fetchICards();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(intervalId);
  }, [user, fetchICards]);

  // Show loading state while checking auth
  if (authLoading) {
    return null;
  }

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  // Sort available cards
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
        <div className="space-y-3 md:space-y-6 py-3 md:py-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 md:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Appointment Management</h1>
              <p className="mt-1 sm:mt-1.5 md:mt-2 text-xs sm:text-sm md:text-base text-muted-foreground">
                Scan visitor QR code to view details and manage ICard assignments
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                onClick={handleRefresh}
                variant="outline"
                disabled={isRefreshing}
                className="border-border text-xs md:text-sm h-9 md:h-10"
              >
                <RefreshCw className={`mr-1.5 md:mr-2 h-3 w-3 md:h-4 md:w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                <span className="sm:hidden">↻</span>
              </Button>
              <Button
                onClick={() => setShowScanner(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs md:text-sm h-9 md:h-10"
              >
                <ScanQrCode className="mr-1.5 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Scan Visitor QR</span>
                <span className="sm:hidden">Scan</span>
              </Button>
              <Button
                onClick={() => setShowReleaseScanner(true)}
                variant="outline"
                className="text-xs md:text-sm h-9 md:h-10"
              >
                <ScanQrCode className="mr-1.5 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Scan QR to Release</span>
                <span className="sm:hidden">Release</span>
              </Button>
              <div className="flex gap-2">
                <Button
                  onClick={() => window.open(googleFormUrl, '_blank')}
                  className="bg-[#7a2e2e] text-white hover:bg-[#8a3e3e] text-xs md:text-sm h-9 md:h-10"
                >
                  <FileText className="mr-1.5 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Book Appointment</span>
                  <span className="sm:hidden">Book</span>
                </Button>
                <Button
                  onClick={copyGoogleFormLink}
                  variant="outline"
                  className="text-xs md:text-sm h-9 md:h-10"
                >
                  {linkCopied ? (
                    <CheckCheck className="mr-1.5 md:mr-2 h-3 w-3 md:h-4 md:w-4 text-green-600" />
                  ) : (
                    <Copy className="mr-1.5 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                  )}
                  <span className="hidden sm:inline">{linkCopied ? 'Copied!' : 'Copy Link'}</span>
                  <span className="sm:hidden">{linkCopied ? '✓' : 'Copy'}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid gap-3 sm:gap-4 md:gap-6 lg:grid-cols-2">
            {/* Left: Visitor Details */}
            <div className="space-y-2 sm:space-y-3 md:space-y-4">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground">
                Visitor Details
              </h2>

              {isLoading ? (
                <div className="rounded-lg border border-border border-dashed p-6 sm:p-8 text-center">
                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground">Loading visitor...</p>
                </div>
              ) : scannedVisitor ? (
                <div className="rounded-lg border border-border bg-card p-3 sm:p-4 md:p-6 space-y-3 md:space-y-4">
                  {/* Visitor Image */}
                  {scannedVisitor.img_url && (
                    <div className="flex justify-center">
                      <VisitorImage
                        src={scannedVisitor.img_url}
                        alt={`Photo of ${scannedVisitor.visitor_name}`}
                        size="medium"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5 sm:space-y-2 md:space-y-3 text-[11px] sm:text-xs md:text-sm">
                    <div>
                      <p className="text-muted-foreground">Name</p>
                      <p className="text-foreground font-medium">{scannedVisitor.visitor_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Company</p>
                      <p className="text-foreground font-medium">{scannedVisitor.company || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Mobile</p>
                      <p className="text-foreground font-medium">{scannedVisitor.mobile_number}</p>
                    </div>
                    {scannedVisitor.email_address && (
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="text-foreground font-medium truncate">{scannedVisitor.email_address}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">Person to Meet</p>
                      <p className="text-foreground font-medium">{scannedVisitor.person_to_meet}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{scannedVisitor.isAppointment ? 'Purpose' : 'Reason'}</p>
                      <p className="text-foreground font-medium">
                        {scannedVisitor.isAppointment 
                          ? scannedVisitor.reason_to_visit.replace('[APPOINTMENT] ', '') 
                          : scannedVisitor.reason_to_visit}
                      </p>
                    </div>
                    {scannedVisitor.isAppointment && (
                      <>
                        {scannedVisitor.appointmentDate && (
                          <div>
                            <p className="text-muted-foreground">Appointment Date</p>
                            <p className="text-foreground font-medium">{scannedVisitor.appointmentDate}</p>
                          </div>
                        )}
                        {scannedVisitor.appointmentTime && (
                          <div>
                            <p className="text-muted-foreground">Appointment Time</p>
                            <p className="text-foreground font-medium">{scannedVisitor.appointmentTime}</p>
                          </div>
                        )}
                        {scannedVisitor.qr_code && (
                          <div>
                            <p className="text-muted-foreground">QR Code</p>
                            <p className="text-foreground font-medium font-mono text-xs">{scannedVisitor.qr_code}</p>
                          </div>
                        )}
                      </>
                    )}
                    {scannedVisitor.visitor_number && (
                      <div>
                        <p className="text-muted-foreground">Visitor Number</p>
                        <p className="text-foreground font-medium font-mono">{scannedVisitor.visitor_number}</p>
                      </div>
                    )}
                    {scannedVisitor.warehouse && (
                      <div>
                        <p className="text-muted-foreground">Warehouse</p>
                        <p className="text-foreground font-medium">{scannedVisitor.warehouse}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] sm:text-xs font-medium ${
                          scannedVisitor.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          scannedVisitor.status === 'WAITING' ? 'bg-yellow-100 text-yellow-800' :
                          scannedVisitor.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {scannedVisitor.status}
                        </span>
                        {scannedVisitor.isAppointment && scannedVisitor.status === 'APPROVED' && (
                          <span className="inline-flex items-center rounded-full px-2 py-1 text-[10px] sm:text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                            APPOINTMENT CONFIRMED
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Assigned ICard</p>
                      {scannedVisitor.assignedCard ? (
                        <div className="inline-flex items-center rounded-md bg-blue-50 px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs md:text-sm font-medium text-blue-700 border border-blue-200 mt-1">
                          <svg className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 md:h-4 md:w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                          </svg>
                          <span className="truncate">{formatCardName(scannedVisitor.assignedCard)}</span>
                        </div>
                      ) : (
                        <p className="text-orange-600 font-medium text-[11px] sm:text-xs md:text-sm">Not assigned</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-border border-dashed p-6 sm:p-8 md:p-12 text-center">
                  <User className="mx-auto h-8 w-8 sm:h-12 sm:w-12 md:h-16 md:w-16 text-muted-foreground mb-3 sm:mb-4" />
                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-2 sm:mb-3">
                    No visitor scanned yet
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Click "Scan Visitor QR" to scan a visitor's QR code
                  </p>
                </div>
              )}
            </div>

            {/* Right: ICard Management */}
            <div className="space-y-2 sm:space-y-3 md:space-y-4">
              {/* Available ICards */}
              <div className="rounded-lg border border-border bg-card p-3 sm:p-4 md:p-6">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground mb-2 sm:mb-3 md:mb-4">
                  Available ICards ({availableCards.length})
                </h2>
                {availableCards.length === 0 ? (
                  <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground">
                    No ICards available. All cards are currently occupied.
                  </p>
                ) : (
                  <div className="space-y-1 sm:space-y-1.5 md:space-y-2 max-h-[250px] sm:max-h-[300px] md:max-h-[400px] overflow-y-auto">
                    {availableCards.map((card) => (
                      <div
                        key={card.id}
                        className="flex items-center justify-between p-2 sm:p-2.5 md:p-3 rounded-lg border border-border bg-muted/50 gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm md:text-base font-medium text-foreground truncate">{formatCardName(card.card_name)}</p>
                          <p className="text-[9px] sm:text-[10px] md:text-xs text-green-600">Available</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAssignCard(card.id)}
                          disabled={isAssigning || !scannedVisitor || !!scannedVisitor?.assignedCard}
                          className="bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] sm:text-xs md:text-sm h-7 sm:h-7 md:h-8 px-2 sm:px-2.5 md:px-3 shrink-0 touch-manipulation disabled:opacity-50"
                        >
                          {isAssigning ? 'Assigning...' : scannedVisitor?.assignedCard ? 'Already Assigned' : 'Assign'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Occupied ICards */}
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
                          <p className="text-xs sm:text-sm md:text-base font-medium text-foreground truncate">{formatCardName(card.card_name)}</p>
                          <p className="text-[9px] sm:text-[10px] md:text-xs text-red-600">
                            Occupied (Visitor #{card.occ_to})
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReleaseCard(card.id)}
                          className="text-destructive hover:text-destructive text-[10px] sm:text-xs md:text-sm h-7 sm:h-7 md:h-8 px-2 sm:px-2.5 md:px-3 shrink-0 touch-manipulation"
                        >
                          Release
                        </Button>
                      </div>
                    ))}
                  </div>
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
          onScan={handleVisitorQrScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {showReleaseScanner && (
        <QrScanner
          onScan={handleCardQrScan}
          onClose={() => setShowReleaseScanner(false)}
        />
      )}
    </>
  );
}


