'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppHeader } from '@/components/app-header';
import { PageContainer } from '@/components/page-container';
import { VisitorForm } from '@/components/visitor-form';
import { Button } from '@/components/ui/button';
import { Toast, useToast } from '@/components/toast';
import { useVisitors } from '@/lib/visitor-store';
import { API_ENDPOINTS } from '@/lib/api-config';
import { useAuth } from '@/lib/auth-store';

interface HealthDeclaration {
  hasRespiratoryAilment: boolean;
  hasSkinInfection: boolean;
  hasGastrointestinalAilment: boolean;
  hasENTInfection: boolean;
  hasViralFever: boolean;
  hasCovid19: boolean;
  hadPastIllness: boolean;
  pastIllnessDetails: string;
  hadTyphoidDiarrhoea: boolean;
  hadRecentCovid: boolean;
  isOnMedication: boolean;
  protectiveClothingAck: boolean;
  foodDrinksAck: boolean;
  jewelryAck: boolean;
  personalHygieneAck: boolean;
  perfumeNailsAck: boolean;
  hygieneNormsAck: boolean;
}

interface ElectronicsItem {
  type: string;
  brand: string;
  serialNumber: string;
  quantity: number;
  photo?: string;
}

interface VisitorFormData {
  name: string;
  mobileNumber: string;
  email: string;
  company: string;
  personToMeet: string;
  reasonForVisit: string;
  selfie?: string;
  warehouse?: string;
  healthDeclaration?: HealthDeclaration;
  carryingElectronics: boolean;
  electronicsItems: ElectronicsItem[];
}

export default function VisitorCheckInPage() {
  const router = useRouter();
  const { addRequest } = useVisitors();
  const { toasts, addToast, removeToast } = useToast();
  const { user } = useAuth();
  const [submittedData, setSubmittedData] = useState<{ referenceId: string; mobile: string; personToMeetName: string; personToMeetContact: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [warehouseName, setWarehouseName] = useState<string>('');

  // "Visited us before?" prompt. Returning visitors enter their phone, receive a
  // WhatsApp OTP (visitor_revisit_otp template), enter the OTP, and are then
  // routed to /revisit where prior details are pre-filled.
  //
  //   asking    → show the Yes/No question
  //   phone     → show the phone-number input
  //   otp       → OTP was sent; show the code input
  //   declined  → user said "first time"; hide the prompt
  const [revisitPrompt, setRevisitPrompt] = useState<'asking' | 'phone' | 'otp' | 'declined'>('asking');
  const [revisitPhone, setRevisitPhone] = useState('');
  const [revisitOtp, setRevisitOtp] = useState('');
  const [revisitVerifiedPhone, setRevisitVerifiedPhone] = useState('');
  const [revisitError, setRevisitError] = useState<string | null>(null);
  const [revisitInfo, setRevisitInfo] = useState<string | null>(null);
  const [revisitBusy, setRevisitBusy] = useState(false);

  const handleSendRevisitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = revisitPhone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      setRevisitError('Please enter a valid 10-digit mobile number.');
      return;
    }
    const phone = cleaned.slice(-10);
    setRevisitBusy(true);
    setRevisitError(null);
    setRevisitInfo(null);
    try {
      const res = await fetch(`${API_ENDPOINTS.visitors}/send-revisit-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 404) {
        setRevisitError(
          'No previous visit found for this number. Please register as a first-time visitor below.'
        );
        return;
      }
      if (!res.ok) {
        setRevisitError(body.detail || body.error || 'Could not send the OTP. Please try again.');
        return;
      }
      setRevisitVerifiedPhone(phone);
      setRevisitPrompt('otp');
      setRevisitOtp('');
      setRevisitInfo(body.message || 'OTP sent to your WhatsApp.');
    } catch {
      setRevisitError('Cannot reach the server. Please check your connection and try again.');
    } finally {
      setRevisitBusy(false);
    }
  };

  const handleVerifyRevisitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = revisitOtp.trim();
    if (code.length < 4) {
      setRevisitError('Please enter the code you received on WhatsApp.');
      return;
    }
    setRevisitBusy(true);
    setRevisitError(null);
    try {
      const res = await fetch(`${API_ENDPOINTS.visitors}/verify-revisit-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: revisitVerifiedPhone, otp: code }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRevisitError(body.detail || body.error || 'Verification failed.');
        return;
      }
      router.push(`/revisit?phone=${revisitVerifiedPhone}`);
    } catch {
      setRevisitError('Cannot reach the server. Please try again.');
    } finally {
      setRevisitBusy(false);
    }
  };

  const handleRevisitCancel = () => {
    setRevisitPrompt('asking');
    setRevisitPhone('');
    setRevisitOtp('');
    setRevisitVerifiedPhone('');
    setRevisitError(null);
    setRevisitInfo(null);
  };

  // Check URL parameters on mount for warehouse from QR code scan
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const warehouseParam = params.get('warehouse');
    if (warehouseParam) {
      const decodedWarehouse = decodeURIComponent(warehouseParam);
      setWarehouseName(decodedWarehouse);
      addToast(`Warehouse: ${decodedWarehouse}`, 'success');
      // Clean up URL to remove the parameter (optional - keeps URL clean)
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [addToast]);

  const handleFormSubmit = async (formData: VisitorFormData) => {
    setIsLoading(true);

    try {
      // Convert base64 selfie to blob
      const base64Data = formData.selfie?.split(',')[1];
      if (!base64Data) {
        throw new Error('Selfie is required');
      }

      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      // Create FormData
      const formDataToSend = new FormData();
      formDataToSend.append('visitor_name', formData.name);
      formDataToSend.append('mobile_number', formData.mobileNumber);
      formDataToSend.append('person_to_meet', formData.personToMeet);
      formDataToSend.append('reason_to_visit', formData.reasonForVisit);
      formDataToSend.append('image', blob, 'selfie.jpg');

      // Add optional fields
      if (formData.email) {
        formDataToSend.append('email_address', formData.email);
      }
      if (formData.company) {
        formDataToSend.append('company', formData.company);
      }
      if (formData.warehouse) {
        formDataToSend.append('warehouse', formData.warehouse);
      }
      if (formData.healthDeclaration) {
        formDataToSend.append('health_declaration', JSON.stringify(formData.healthDeclaration));
      }

      // Add electronics data
      formDataToSend.append('carrying_electronics', formData.carryingElectronics.toString());
      if (formData.carryingElectronics && formData.electronicsItems.length > 0) {
        formDataToSend.append('electronics_items', JSON.stringify(formData.electronicsItems));
        
        // Add electronics photos as separate files
        formData.electronicsItems.forEach((item, index) => {
          if (item.photo) {
            // Convert base64 to blob
            const electronicsBase64Data = item.photo.split(',')[1];
            const electronicsBytes = atob(electronicsBase64Data);
            const electronicsArray = new Array(electronicsBytes.length);
            for (let i = 0; i < electronicsBytes.length; i++) {
              electronicsArray[i] = electronicsBytes.charCodeAt(i);
            }
            const electronicsBlob = new Blob([new Uint8Array(electronicsArray)], { type: 'image/jpeg' });
            formDataToSend.append(`electronics_photo_${index}`, electronicsBlob, `electronics_${index}.jpg`);
          }
        });
      }

      const response = await fetch(`${API_ENDPOINTS.visitors}/check-in-with-image`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      // Fetch approver details to get phone number
      let approverName = data.visitor.person_to_meet;
      let approverPhone = '';
      try {
        const approverResponse = await fetch(`${API_ENDPOINTS.approvers}/${data.visitor.person_to_meet}`);
        if (approverResponse.ok) {
          const approverData = await approverResponse.json();
          approverName = approverData.name || data.visitor.person_to_meet;
          approverPhone = approverData.ph_no || '';
        }
      } catch (error) {
        // Use fallback name
        approverName = ['Yash – CEO', 'Sunil – CFO', 'Nitin – CBO', 'Reception / Front Desk'].find(
          (p) =>
            p.startsWith(
              ['yash', 'sunil', 'nitin', 'reception'].find((id) => id === data.visitor.person_to_meet) || ''
            )
        ) || data.visitor.person_to_meet;
      }

      // Store the visitor data in local state
      const referenceId = `${data.visitor.id}`;

      const newRequest = {
        id: referenceId,
        name: data.visitor.visitor_name,
        mobileNumber: data.visitor.mobile_number,
        email: data.visitor.email_address,
        company: data.visitor.company,
        personToMeet: {
          id: data.visitor.person_to_meet,
          displayName: approverName,
          contact: approverPhone,
        },
        reasonForVisit: data.visitor.reason_to_visit,
        status: data.visitor.status.toLowerCase() === 'waiting' ? 'pending' : data.visitor.status.toLowerCase(),
        submittedAt: data.visitor.check_in_time,
        imageUrl: data.visitor.img_url || data.visitor.image_url, // S3 URL from backend
        healthDeclaration: data.visitor.health_declaration,
        warehouse: data.visitor.warehouse,
      };

      addRequest(newRequest);

      // Extract person to meet details
      const personToMeetName = approverName;
      const personToMeetContact = approverPhone;

      // Redirect to visitor pass page
      addToast(data.message || 'Visitor checked in successfully!', 'success');
      router.push(`/visitor-pass/${data.visitor.id}`);
    } catch (error) {
      // More detailed error message
      let errorMessage = 'Failed to submit request. ';
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage += 'Cannot connect to server. Please check if the backend is running on http://localhost:8000';
      } else if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again.';
      }

      addToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AppHeader
        rightContent={
          <div className="flex gap-2">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                Approver Dashboard
              </Button>
            </Link>
            <Link href="/appointment">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                Appointment
              </Button>
            </Link>
            {user?.superuser && (
              <Link href="/datasheet">
                <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                  Download Data
                </Button>
              </Link>
            )}
            {/* Admin link - visible to all users */}
            <Link href="/admin">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                Admin
              </Button>
            </Link>
          </div>
        }
      />

      <div className="min-h-screen flex">
        {/* Left section - Blue gradient background */}
        <div className="hidden lg:flex lg:w-2/5 gradient-blue relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent"></div>
          <div className="relative z-10 flex flex-col justify-center items-center px-8 py-12 text-white">
            <div className="max-w-md">
              <div className="mb-4">
                <p className="text-sm md:text-base text-blue-200 uppercase tracking-wider font-semibold mb-2">
                  Candor Foods
                </p>
                <h1 className="text-4xl md:text-5xl font-bold mb-2 leading-tight">
                  Welcome Visitor
                </h1>
              </div>
              <p className="text-lg md:text-xl text-blue-50 mb-8 leading-relaxed">
                A seamless visitor check-in experience designed for security and convenience.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white text-lg font-bold border-2 border-white/30">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg mb-1">Fill Your Details</h3>
                    <p className="text-sm text-blue-100">
                      Provide your information and reason for visit.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white text-lg font-bold border-2 border-white/30">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg mb-1">Wait for Approval</h3>
                    <p className="text-sm text-blue-100">
                      Your request is reviewed by the appropriate person.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white text-lg font-bold border-2 border-white/30">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg mb-1">Get Your Visitor Number</h3>
                    <p className="text-sm text-blue-100">
                      Receive a unique token once approved.
                    </p>
                  </div>
                </div>
              </div>

              <Link href="/status" className="mt-10 inline-block">
                <Button variant="outline" className="w-full sm:w-auto bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 px-6 py-2.5">
                  Check Status
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Right section - White form area */}
        <div className="flex-1 lg:w-3/5 bg-white relative">
          {/* Curved edge on mobile/tablet */}
          <div className="lg:hidden absolute top-0 left-0 right-0 h-24 gradient-blue rounded-b-[3rem]"></div>
          
          <div className="relative z-10 min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-12 py-8 lg:py-12">
            <div className="w-full max-w-2xl">
              {/* Mobile Status Section - Visible only on mobile/tablet */}
              <div className="lg:hidden mb-6 -mt-4">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-professional-lg border border-blue-500 p-5 text-white">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <p className="text-xs text-blue-200 uppercase tracking-wider font-semibold mb-1">
                        Candor Foods
                      </p>
                      <h3 className="text-xl font-bold mb-1">Welcome Visitor</h3>
                      <p className="text-sm text-blue-50">
                        Track your visitor request status anytime
                      </p>
                    </div>
                    <Link href="/status">
                      <Button className="bg-white text-[#7a2e2e] hover:bg-[#f5e6e6] h-10 px-5 text-sm font-semibold shadow-md whitespace-nowrap">
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Check Status
                      </Button>
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-100">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Use your mobile number or reference ID to check status</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl lg:rounded-3xl shadow-professional-lg border border-gray-100 p-6 sm:p-8 lg:p-10">
                {submittedData ? (
                  <div className="text-center space-y-6">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                      <svg
                        className="h-8 w-8 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Request Submitted Successfully!
                    </h3>
                    <div className="rounded-xl bg-gray-50 p-6 border border-gray-200">
                      <p className="text-sm text-gray-600 mb-2">Reference ID</p>
                      <p className="text-2xl font-mono font-bold text-gray-900">
                        {submittedData.referenceId}
                      </p>
                    </div>
                    {submittedData.personToMeetContact && (
                      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-4">
                        <p className="text-sm text-gray-600 mb-2">Person to Meet</p>
                        <p className="text-lg font-semibold text-gray-900 mb-4">
                          {submittedData.personToMeetName}
                        </p>
                        <a href={`tel:${submittedData.personToMeetContact}`}>
                          <Button className="w-full bg-green-600 text-white hover:bg-green-700 h-11 text-base">
                            <svg
                              className="h-5 w-5 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                              />
                            </svg>
                            Call {submittedData.personToMeetName}
                          </Button>
                        </a>
                      </div>
                    )}
                    <p className="text-sm text-gray-600">
                      You will receive your visitor number once approved. You can also check your status
                      using your mobile number or reference ID.
                    </p>
                    <Link href="/status">
                      <Button className="w-full bg-[#7a2e2e] text-white hover:bg-[#8a3e3e] h-11 text-base mt-4">
                        Check Status
                      </Button>
                    </Link>
                    <button
                      onClick={() => setSubmittedData(null)}
                      className="w-full text-sm text-[#7a2e2e] hover:text-[#8a3e3e] hover:underline mt-2"
                    >
                      Submit Another Request
                    </button>
                  </div>
                ) : (
                  <>
                    {warehouseName && (
                      <div className="mb-4">
                        <div className="inline-flex items-center rounded-lg bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 border border-blue-200">
                          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {warehouseName}
                        </div>
                      </div>
                    )}

                    {/* Visited us before? — sends a WhatsApp OTP, verifies it, then routes to /revisit */}
                    {revisitPrompt !== 'declined' && (
                      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50/60 p-4 sm:p-5">
                        {revisitPrompt === 'asking' && (
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-sm sm:text-base">Have you visited us before?</p>
                                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Skip the form — we'll fetch your details from your last visit. We'll send a one-time code to your WhatsApp to verify.</p>
                              </div>
                            </div>
                            <div className="flex gap-2 sm:flex-shrink-0">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => { setRevisitPrompt('phone'); setRevisitError(null); setRevisitInfo(null); }}
                                className="bg-blue-600 text-white hover:bg-blue-700 h-9"
                              >
                                Yes — Quick Check-in
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setRevisitPrompt('declined')}
                                className="h-9"
                              >
                                No, first time
                              </Button>
                            </div>
                          </div>
                        )}

                        {revisitPrompt === 'phone' && (
                          <form onSubmit={handleSendRevisitOtp} className="space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900 text-sm sm:text-base">Enter your mobile number</p>
                                <p className="text-xs text-gray-600 mt-0.5">We'll send a one-time code on WhatsApp to confirm it's you.</p>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="tel"
                                inputMode="numeric"
                                autoFocus
                                value={revisitPhone}
                                onChange={(e) => { setRevisitPhone(e.target.value); if (revisitError) setRevisitError(null); }}
                                placeholder="10-digit mobile number"
                                maxLength={15}
                                disabled={revisitBusy}
                                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <Button
                                type="submit"
                                size="sm"
                                disabled={revisitBusy}
                                className="bg-blue-600 text-white hover:bg-blue-700 h-10 px-5"
                              >
                                {revisitBusy ? 'Sending…' : 'Send OTP'}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={revisitBusy}
                                onClick={handleRevisitCancel}
                                className="h-10"
                              >
                                Cancel
                              </Button>
                            </div>
                            {revisitError && (
                              <p className="text-xs text-red-600 ml-12">{revisitError}</p>
                            )}
                          </form>
                        )}

                        {revisitPrompt === 'otp' && (
                          <form onSubmit={handleVerifyRevisitOtp} className="space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900 text-sm sm:text-base">Enter the OTP</p>
                                <p className="text-xs text-gray-600 mt-0.5">
                                  {revisitInfo || `Code sent to your WhatsApp at ${revisitVerifiedPhone}.`}
                                  {' '}It expires in 5 minutes.
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                inputMode="numeric"
                                autoFocus
                                value={revisitOtp}
                                onChange={(e) => { setRevisitOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); if (revisitError) setRevisitError(null); }}
                                placeholder="6-digit code"
                                maxLength={6}
                                disabled={revisitBusy}
                                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm bg-white tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <Button
                                type="submit"
                                size="sm"
                                disabled={revisitBusy || revisitOtp.length < 4}
                                className="bg-blue-600 text-white hover:bg-blue-700 h-10 px-5"
                              >
                                {revisitBusy ? 'Verifying…' : 'Verify & Continue'}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={revisitBusy}
                                onClick={handleRevisitCancel}
                                className="h-10"
                              >
                                Cancel
                              </Button>
                            </div>
                            <div className="flex items-center justify-between ml-12">
                              {revisitError ? (
                                <p className="text-xs text-red-600">{revisitError}</p>
                              ) : (
                                <span />
                              )}
                              <button
                                type="button"
                                onClick={() => { setRevisitPrompt('phone'); setRevisitOtp(''); setRevisitError(null); setRevisitInfo(null); }}
                                disabled={revisitBusy}
                                className="text-xs text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
                              >
                                Resend / change number
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}

                    {revisitPrompt === 'declined' && (
                      <button
                        type="button"
                        onClick={() => setRevisitPrompt('asking')}
                        className="mb-4 text-xs text-gray-500 hover:text-blue-600 underline"
                      >
                        Already visited us? Quick check-in
                      </button>
                    )}

                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Register as Visitor</h2>
                    <VisitorForm onSubmit={handleFormSubmit} isLoading={isLoading} warehouseName={warehouseName} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
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
