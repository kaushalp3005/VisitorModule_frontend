'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppHeader } from '@/components/app-header';
import { PageContainer } from '@/components/page-container';
import { VisitorForm } from '@/components/visitor-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
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

  // Revisit flow state
  const [showRevisitDialog, setShowRevisitDialog] = useState(false);
  const [revisitPhone, setRevisitPhone] = useState('');
  const [revisitStep, setRevisitStep] = useState<'phone' | 'otp'>('phone');
  const [otpValue, setOtpValue] = useState('');
  const [revisitLoading, setRevisitLoading] = useState(false);
  const [revisitError, setRevisitError] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);

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

  // Revisit OTP handlers
  const handleSendOTP = async () => {
    setRevisitError('');
    if (!/^\d{10}$/.test(revisitPhone)) {
      setRevisitError('Please enter a valid 10-digit mobile number');
      return;
    }
    setRevisitLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.visitors}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_number: revisitPhone }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to send OTP');
      }
      setRevisitStep('otp');
      setOtpCooldown(60);
      addToast('OTP sent to your mobile number', 'success');
    } catch (error) {
      setRevisitError(error instanceof Error ? error.message : 'Failed to send OTP');
    } finally {
      setRevisitLoading(false);
    }
  };

  const handleVerifyOTP = async (otpVal: string) => {
    if (otpVal.length !== 4) return;
    setRevisitError('');
    setRevisitLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.visitors}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_number: revisitPhone, otp: otpVal }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'OTP verification failed');
      }
      addToast('Phone verified! Loading your details...', 'success');
      router.push(`/revisit?phone=${encodeURIComponent(revisitPhone)}`);
    } catch (error) {
      setRevisitError(error instanceof Error ? error.message : 'Verification failed');
      setOtpValue('');
    } finally {
      setRevisitLoading(false);
    }
  };

  // Cooldown timer for resend
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  const handleRevisitDialogClose = (open: boolean) => {
    setShowRevisitDialog(open);
    if (!open) {
      setRevisitStep('phone');
      setRevisitPhone('');
      setOtpValue('');
      setRevisitError('');
      setRevisitLoading(false);
    }
  };

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
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Register as Visitor</h2>

                    {/* Revisit CTA */}
                    <div className="mb-6 sm:mb-8 flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <span className="text-sm text-blue-700 font-medium">Visited us before?</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-300 hover:bg-blue-100 text-xs"
                        onClick={() => setShowRevisitDialog(true)}
                      >
                        Yes, Quick Check-in
                      </Button>
                    </div>
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

      {/* Revisit Phone Verification Dialog */}
      <Dialog open={showRevisitDialog} onOpenChange={handleRevisitDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {revisitStep === 'phone' ? 'Verify Your Phone Number' : 'Enter OTP'}
            </DialogTitle>
            <DialogDescription>
              {revisitStep === 'phone'
                ? 'Enter the mobile number you used during your previous visit.'
                : `We sent a 4-digit OTP to ${revisitPhone.slice(0, 3)}****${revisitPhone.slice(7)}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {revisitStep === 'phone' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={revisitPhone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setRevisitPhone(val);
                      setRevisitError('');
                    }}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={10}
                  />
                </div>
                {revisitError && (
                  <p className="text-sm text-red-600">{revisitError}</p>
                )}
                <Button
                  onClick={handleSendOTP}
                  disabled={revisitLoading || revisitPhone.length !== 10}
                  className="w-full bg-[#7a2e2e] text-white hover:bg-[#8a3e3e] h-11"
                >
                  {revisitLoading ? 'Sending OTP...' : 'Send OTP'}
                </Button>
              </>
            ) : (
              <>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={4}
                    value={otpValue}
                    onChange={(val) => {
                      setOtpValue(val);
                      if (val.length === 4) {
                        handleVerifyOTP(val);
                      }
                    }}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="w-12 h-12 text-lg" />
                      <InputOTPSlot index={1} className="w-12 h-12 text-lg" />
                      <InputOTPSlot index={2} className="w-12 h-12 text-lg" />
                      <InputOTPSlot index={3} className="w-12 h-12 text-lg" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                {revisitError && (
                  <p className="text-sm text-red-600 text-center">{revisitError}</p>
                )}
                {revisitLoading && (
                  <p className="text-sm text-gray-500 text-center">Verifying...</p>
                )}
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setRevisitStep('phone');
                      setOtpValue('');
                      setRevisitError('');
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    Change number
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={otpCooldown > 0 || revisitLoading}
                    className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 underline"
                  >
                    {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend OTP'}
                  </button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
