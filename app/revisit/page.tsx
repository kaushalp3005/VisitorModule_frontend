'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { CheckIcon, ChevronDownIcon, XIcon, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toast, useToast } from '@/components/toast';
import { VisitorImage } from '@/components/visitor-image';
import { API_ENDPOINTS, getImageUrl } from '@/lib/api-config';
import { PersonToMeet } from '@/lib/types';

interface ElectronicsItem {
  type: string;
  brand: string;
  serialNumber?: string;
  quantity: number;
  photo?: string;
}

const REASON_FOR_VISIT_OPTIONS = [
  "Customer Meeting",
  "Supplier Meeting",
  "Management Meeting",
  "Business Discussion",
  "Order Discussion",
  "Price Negotiation",
  "Contract Finalization",
  "QC / QA Inspection",
  "Material Inspection",
  "Production Audit",
  "Sample Submission",
  "Sample Collection",
  "Factory Tour",
  "Process Review",
  "Machine Repair",
  "Machine Installation",
  "Preventive Maintenance",
  "Breakdown Inspection",
  "AMC Visit",
  "Technical Consultation",
  "Training Session",
  "Loading",
  "Unloading",
  "Transport Document Collection",
  "Vehicle Entry",
  "Courier Delivery",
  "Parcel Pickup",
  "Interview",
  "Job Application",
  "Joining Formalities",
  "HR Meeting",
  "Training / Induction",
  "Hardware Support",
  "Software Update",
  "System Installation",
  "Troubleshooting",
  "Network Setup",
  "IT Audit",
  "Invoice Verification",
  "Payment Settlement",
  "Ledger Reconciliation",
  "Agreement Signing",
  "Document Submission",
  "ISO Audit",
  "FSSAI Inspection",
  "Safety Audit",
  "Fire Department Visit",
  "Labour Department Visit",
  "Regulatory Compliance Check",
  "Fire Safety Equipment Check",
  "Security Inspection",
  "Emergency Drill",
  "CCTV / Access Control Check",
  "Personal Meeting",
  "General Visit",
  "Miscellaneous Work",
  "Courier / Parcel",
  "Other"
];

const ELECTRONICS_ITEM_OPTIONS = ["Laptop", "Tablet", "Mobile", "Others"];

function RevisitContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toasts, addToast, removeToast } = useToast();

  // Visitor data from API
  const [visitorData, setVisitorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [step, setStep] = useState<'confirm' | 'details'>('confirm');
  const [personToMeet, setPersonToMeet] = useState('');
  const [reasonForVisit, setReasonForVisit] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState('');
  const [selfie, setSelfie] = useState<string | undefined>(undefined);
  const [carryingElectronics, setCarryingElectronics] = useState(false);
  const [electronicsItems, setElectronicsItems] = useState<ElectronicsItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Dropdowns
  const [approvers, setApprovers] = useState<PersonToMeet[]>([]);
  const [loadingApprovers, setLoadingApprovers] = useState(true);
  const [personPopoverOpen, setPersonPopoverOpen] = useState(false);
  const [reasonPopoverOpen, setReasonPopoverOpen] = useState(false);

  // Camera
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [shouldStartCamera, setShouldStartCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Electronics camera
  const [electronicsPhotoDialogOpen, setElectronicsPhotoDialogOpen] = useState(false);
  const [currentElectronicsIndex, setCurrentElectronicsIndex] = useState(0);
  const [shouldStartElectronicsCamera, setShouldStartElectronicsCamera] = useState(false);
  const [isElectronicsCameraActive, setIsElectronicsCameraActive] = useState(false);
  const electronicsVideoRef = useRef<HTMLVideoElement>(null);
  const electronicsCanvasRef = useRef<HTMLCanvasElement>(null);
  const electronicsStreamRef = useRef<MediaStream | null>(null);

  // Fetch visitor data
  useEffect(() => {
    const phone = searchParams.get('phone');
    if (!phone) {
      setError('No phone number provided. Please go back and verify your number.');
      setLoading(false);
      return;
    }

    const fetchVisitorData = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.visitors}/phone/${phone}`);
        if (!response.ok) {
          throw new Error('No previous visits found for this number');
        }
        const data = await response.json();
        if (data.length > 0) {
          setVisitorData(data[0]); // Most recent visit
        } else {
          throw new Error('No previous visits found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load visitor data');
      } finally {
        setLoading(false);
      }
    };

    fetchVisitorData();
  }, [searchParams]);

  // Fetch approvers
  useEffect(() => {
    const fetchApprovers = async () => {
      try {
        setLoadingApprovers(true);
        const response = await fetch(`${API_ENDPOINTS.approvers}/list?active_only=true`);
        if (!response.ok) throw new Error('Failed to fetch approvers');
        const data = await response.json();
        const formatted: PersonToMeet[] = (data.approvers || data || []).map((a: any) => ({
          id: a.username,
          displayName: a.name,
        }));
        setApprovers(formatted);
      } catch (error) {
        console.error('Error fetching approvers:', error);
        setApprovers([]);
      } finally {
        setLoadingApprovers(false);
      }
    };
    fetchApprovers();
  }, []);

  // Camera useEffect
  useEffect(() => {
    if (shouldStartCamera && isDialogOpen) {
      const timeoutId = setTimeout(async () => {
        if (videoRef.current) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
              audio: false,
            });
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              streamRef.current = stream;
              setIsCameraActive(true);
              setShouldStartCamera(false);
            }
          } catch (err) {
            console.error('Error accessing camera:', err);
            setFormErrors((prev) => ({ ...prev, selfie: 'Unable to access camera.' }));
            setIsDialogOpen(false);
            setIsCameraActive(false);
            setShouldStartCamera(false);
          }
        }
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [shouldStartCamera, isDialogOpen]);

  // Electronics camera useEffect
  useEffect(() => {
    if (shouldStartElectronicsCamera && electronicsPhotoDialogOpen) {
      const timeoutId = setTimeout(async () => {
        if (electronicsVideoRef.current) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
              audio: false,
            });
            if (electronicsVideoRef.current) {
              electronicsVideoRef.current.srcObject = stream;
              electronicsStreamRef.current = stream;
              setIsElectronicsCameraActive(true);
              setShouldStartElectronicsCamera(false);
            }
          } catch (err) {
            console.error('Error accessing electronics camera:', err);
            alert('Unable to access camera. Please allow camera permissions.');
            setElectronicsPhotoDialogOpen(false);
            setIsElectronicsCameraActive(false);
            setShouldStartElectronicsCamera(false);
          }
        }
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [shouldStartElectronicsCamera, electronicsPhotoDialogOpen]);

  // Camera functions
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setIsDialogOpen(false);
    setShouldStartCamera(false);
  };

  const startCamera = () => {
    if (selfie) setSelfie(undefined);
    setIsDialogOpen(true);
    setShouldStartCamera(true);
  };

  const captureSelfie = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setSelfie(imageData);
        if (formErrors.selfie) setFormErrors((prev) => { const { selfie, ...rest } = prev; return rest; });
        stopCamera();
      }
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      if (isCameraActive) stopCamera();
      setShouldStartCamera(false);
    }
  };

  // Electronics camera functions
  const stopElectronicsCamera = () => {
    if (electronicsStreamRef.current) {
      electronicsStreamRef.current.getTracks().forEach((track) => track.stop());
      electronicsStreamRef.current = null;
    }
    setIsElectronicsCameraActive(false);
  };

  const captureElectronicsPhoto = () => {
    if (electronicsVideoRef.current && electronicsCanvasRef.current) {
      const video = electronicsVideoRef.current;
      const canvas = electronicsCanvasRef.current;
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        const updatedItems = [...electronicsItems];
        updatedItems[currentElectronicsIndex] = { ...updatedItems[currentElectronicsIndex], photo: imageData };
        setElectronicsItems(updatedItems);
        setElectronicsPhotoDialogOpen(false);
        stopElectronicsCamera();
      }
    }
  };

  const startElectronicsCamera = (index: number) => {
    setCurrentElectronicsIndex(index);
    setElectronicsPhotoDialogOpen(true);
    setShouldStartElectronicsCamera(true);
  };

  const handleElectronicsPhotoDialogOpenChange = (open: boolean) => {
    setElectronicsPhotoDialogOpen(open);
    if (!open) {
      stopElectronicsCamera();
      setShouldStartElectronicsCamera(false);
    }
  };

  // Dropdown handlers
  const handlePersonSelect = (value: string) => {
    setPersonToMeet(value);
    setPersonPopoverOpen(false);
    if (formErrors.personToMeet) setFormErrors((prev) => { const { personToMeet, ...rest } = prev; return rest; });
  };

  const handleReasonSelect = (value: string) => {
    setReasonForVisit((prev) => {
      const isSelected = prev.includes(value);
      return isSelected ? prev.filter((r) => r !== value) : [...prev, value];
    });
    if (value === 'Other' && reasonForVisit.includes('Other')) setCustomReason('');
    if (formErrors.reasonForVisit) setFormErrors((prev) => { const { reasonForVisit, ...rest } = prev; return rest; });
  };

  // Electronics handlers
  const handleElectronicsChange = (value: boolean) => {
    setCarryingElectronics(value);
    if (value && electronicsItems.length === 0) {
      setElectronicsItems([{ type: '', brand: '', serialNumber: '', quantity: 1, photo: undefined }]);
    } else if (!value) {
      setElectronicsItems([]);
    }
  };

  const addElectronicsItem = () => {
    setElectronicsItems((prev) => [...prev, { type: '', brand: '', serialNumber: '', quantity: 1, photo: undefined }]);
  };

  const removeElectronicsItem = (index: number) => {
    setElectronicsItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateElectronicsItem = (index: number, field: keyof ElectronicsItem, value: string | number) => {
    setElectronicsItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!personToMeet) newErrors.personToMeet = 'Please select who you are meeting';
    if (reasonForVisit.length === 0) newErrors.reasonForVisit = 'Please select at least one reason';
    else if (reasonForVisit.includes('Other') && !customReason.trim()) newErrors.reasonForVisit = 'Please specify the reason';
    if (!selfie) newErrors.selfie = 'Please take a selfie';
    if (carryingElectronics) {
      if (electronicsItems.length === 0) {
        newErrors.electronicsItems = 'Please add at least one electronic item';
      } else {
        for (let i = 0; i < electronicsItems.length; i++) {
          const item = electronicsItems[i];
          if (!item.type || !item.brand || item.quantity < 1) {
            newErrors.electronicsItems = `Please fill required fields for item ${i + 1}`;
            break;
          }
        }
      }
    }
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const base64Data = selfie?.split(',')[1];
      if (!base64Data) throw new Error('Selfie is required');

      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      const processedReasons = reasonForVisit.map((r) =>
        r === 'Other' && customReason.trim() ? customReason.trim() : r
      );

      const formDataToSend = new FormData();
      formDataToSend.append('visitor_name', visitorData.visitor_name);
      formDataToSend.append('mobile_number', visitorData.mobile_number);
      formDataToSend.append('person_to_meet', personToMeet);
      formDataToSend.append('reason_to_visit', processedReasons.join(', '));
      formDataToSend.append('image', blob, 'selfie.jpg');

      if (visitorData.email_address) formDataToSend.append('email_address', visitorData.email_address);
      if (visitorData.company) formDataToSend.append('company', visitorData.company);
      if (visitorData.warehouse) formDataToSend.append('warehouse', visitorData.warehouse);
      formDataToSend.append('carrying_electronics', carryingElectronics.toString());
      formDataToSend.append('is_revisit', 'true');

      if (carryingElectronics && electronicsItems.length > 0) {
        formDataToSend.append('electronics_items', JSON.stringify(electronicsItems));
        electronicsItems.forEach((item, index) => {
          if (item.photo) {
            const eBase64 = item.photo.split(',')[1];
            const eBytes = atob(eBase64);
            const eArray = new Array(eBytes.length);
            for (let i = 0; i < eBytes.length; i++) {
              eArray[i] = eBytes.charCodeAt(i);
            }
            const eBlob = new Blob([new Uint8Array(eArray)], { type: 'image/jpeg' });
            formDataToSend.append(`electronics_photo_${index}`, eBlob, `electronics_${index}.jpg`);
          }
        });
      }

      const response = await fetch(`${API_ENDPOINTS.visitors}/check-in-with-image`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Check-in failed: ${errorText}`);
      }

      const data = await response.json();
      addToast(data.message || 'Check-in successful!', 'success');
      router.push(`/visitor-pass/${data.visitor.id}`);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to submit', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <>
        <AppHeader />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your details...</p>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (error || !visitorData) {
    return (
      <>
        <AppHeader />
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
              <XIcon className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Details</h2>
            <p className="text-gray-600 mb-6">{error || 'No visitor data found'}</p>
            <Link href="/">
              <Button className="bg-[#7a2e2e] text-white hover:bg-[#8a3e3e]">Go Back to Registration</Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Confirm identity step
  if (step === 'confirm') {
    return (
      <>
        <AppHeader />
        <div className="min-h-screen bg-gray-50 py-8 px-4">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Registration
            </button>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Confirm Your Identity</h2>
              <p className="text-sm text-gray-500 mb-6">We found your previous visit details. Please confirm this is you.</p>

              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6">
                <div className="flex items-start gap-5">
                  <VisitorImage src={getImageUrl(visitorData.img_url)} alt={visitorData.visitor_name} size="medium" />
                  <div className="space-y-2 min-w-0 flex-1">
                    <p className="text-xl font-bold text-gray-900">{visitorData.visitor_name}</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {visitorData.mobile_number}
                      </div>
                      {visitorData.email_address && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="truncate">{visitorData.email_address}</span>
                        </div>
                      )}
                      {visitorData.company && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="truncate">{visitorData.company}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 font-medium">Are you this visitor?</p>
                <p className="text-xs text-blue-600 mt-1">Confirm to proceed with quick check-in using your existing details.</p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep('details')}
                  className="flex-1 bg-[#7a2e2e] text-white hover:bg-[#8a3e3e] h-12 text-base font-semibold"
                >
                  Yes, this is me
                </Button>
                <Link href="/" className="flex-1">
                  <Button
                    variant="outline"
                    className="w-full h-12 text-base border-gray-300"
                  >
                    No, go back
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
        ))}
      </>
    );
  }

  // Details step
  const hasErrors = Object.keys(formErrors).length > 0;

  return (
    <>
      <AppHeader />
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Registration
          </button>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Quick Check-in</h2>
            <p className="text-sm text-gray-500 mb-6">Welcome back! Your details are pre-filled from your previous visit.</p>

            {/* Visitor Info Card (read-only) */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Your Details</h3>
              <div className="flex items-start gap-4">
                <VisitorImage src={getImageUrl(visitorData.img_url)} alt={visitorData.visitor_name} size="small" />
                <div className="space-y-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{visitorData.visitor_name}</p>
                  <p className="text-sm text-gray-600">{visitorData.mobile_number}</p>
                  {visitorData.email_address && <p className="text-sm text-gray-600 truncate">{visitorData.email_address}</p>}
                  {visitorData.company && <p className="text-sm text-gray-600 truncate">{visitorData.company}</p>}
                </div>
              </div>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
              <div>
                <p className="text-sm text-gray-500 font-medium">Step 2 of 2</p>
                <p className="text-xs text-gray-400 mt-0.5">Visit Details</p>
              </div>
            </div>

            {hasErrors && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-4 mb-5">
                <p className="text-sm font-medium text-red-800">Please fix the highlighted fields.</p>
              </div>
            )}

            <div className="space-y-5">
              {/* Person to Meet */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Host <span className="text-red-500">*</span>
                </label>
                <Popover open={personPopoverOpen} onOpenChange={setPersonPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={personPopoverOpen}
                      disabled={loadingApprovers}
                      className={cn(
                        "w-full justify-between text-left font-normal text-sm h-12 border-gray-300 bg-white hover:bg-gray-50",
                        !personToMeet && "text-gray-400",
                        formErrors.personToMeet && "border-red-500 bg-red-50"
                      )}
                    >
                      {loadingApprovers
                        ? "Loading approvers..."
                        : personToMeet
                          ? approvers.find((p) => p.id === personToMeet)?.displayName
                          : "Select the person you are meeting"}
                      <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
                    <Command>
                      <CommandInput placeholder="Search person..." />
                      <CommandList>
                        <CommandEmpty>No person found.</CommandEmpty>
                        <CommandGroup>
                          {approvers.map((person) => (
                            <CommandItem
                              key={person.id}
                              value={person.displayName}
                              onSelect={() => handlePersonSelect(person.id)}
                            >
                              <CheckIcon className={cn("mr-2 h-4 w-4", personToMeet === person.id ? "opacity-100" : "opacity-0")} />
                              {person.displayName}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {formErrors.personToMeet && <p className="mt-1 text-xs text-red-600">{formErrors.personToMeet}</p>}
              </div>

              {/* Reason for Visit */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason for Visit <span className="text-red-500">*</span>
                  {reasonForVisit.length > 0 && (
                    <span className="ml-2 text-xs font-normal text-gray-500">({reasonForVisit.length} selected)</span>
                  )}
                </label>
                <Popover open={reasonPopoverOpen} onOpenChange={setReasonPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={reasonPopoverOpen}
                      className={cn(
                        "w-full justify-between text-left font-normal text-sm min-h-12 border-gray-300 bg-white hover:bg-gray-50",
                        reasonForVisit.length === 0 && "text-gray-400",
                        formErrors.reasonForVisit && "border-red-500 bg-red-50"
                      )}
                    >
                      <span className="truncate">
                        {reasonForVisit.length === 0
                          ? "Select reason(s) for visit..."
                          : reasonForVisit.length === 1
                            ? reasonForVisit[0]
                            : `${reasonForVisit.length} reasons selected`}
                      </span>
                      <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] max-h-[300px]" align="start">
                    <Command>
                      <CommandInput placeholder="Search reason..." />
                      <CommandList>
                        <CommandEmpty>No reason found.</CommandEmpty>
                        <CommandGroup>
                          {REASON_FOR_VISIT_OPTIONS.map((reason) => {
                            const isSelected = reasonForVisit.includes(reason);
                            return (
                              <CommandItem
                                key={reason}
                                value={reason}
                                onSelect={() => handleReasonSelect(reason)}
                                className="cursor-pointer"
                              >
                                <CheckIcon className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                                {reason}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {reasonForVisit.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {reasonForVisit.map((reason) => (
                      <span key={reason} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                        {reason}
                        <button type="button" onClick={() => handleReasonSelect(reason)} className="ml-1 hover:text-blue-900">
                          <XIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {reasonForVisit.includes('Other') && (
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => { setCustomReason(e.target.value); if (formErrors.reasonForVisit) setFormErrors((prev) => { const { reasonForVisit, ...rest } = prev; return rest; }); }}
                    placeholder="Please specify the reason for visit"
                    className={cn(
                      "mt-3 w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
                      formErrors.reasonForVisit ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                    )}
                  />
                )}
                {formErrors.reasonForVisit && <p className="mt-1 text-xs text-red-600">{formErrors.reasonForVisit}</p>}
              </div>

              {/* Electronics */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Are you carrying any electronics?
                </label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={carryingElectronics ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleElectronicsChange(true)}
                    className={carryingElectronics ? 'bg-blue-600 text-white' : ''}
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant={!carryingElectronics ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleElectronicsChange(false)}
                    className={!carryingElectronics ? 'bg-blue-600 text-white' : ''}
                  >
                    No
                  </Button>
                </div>

                {carryingElectronics && (
                  <div className="mt-4 space-y-4">
                    {electronicsItems.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium text-gray-700">Item {index + 1}</p>
                          {electronicsItems.length > 1 && (
                            <button type="button" onClick={() => removeElectronicsItem(index)} className="text-red-500 hover:text-red-700 text-xs">
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Type *</label>
                            <select
                              value={item.type}
                              onChange={(e) => updateElectronicsItem(index, 'type', e.target.value)}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                            >
                              <option value="">Select type</option>
                              {ELECTRONICS_ITEM_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Brand *</label>
                            <input
                              type="text"
                              value={item.brand}
                              onChange={(e) => updateElectronicsItem(index, 'brand', e.target.value)}
                              placeholder="Brand name"
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Serial Number</label>
                            <input
                              type="text"
                              value={item.serialNumber || ''}
                              onChange={(e) => updateElectronicsItem(index, 'serialNumber', e.target.value)}
                              placeholder="Serial number"
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Quantity *</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateElectronicsItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              min={1}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />
                          </div>
                        </div>
                        <div className="mt-3">
                          {item.photo ? (
                            <div className="flex items-center gap-3">
                              <img src={item.photo} alt={`Item ${index + 1}`} className="w-16 h-16 object-cover rounded-lg border" />
                              <button type="button" onClick={() => startElectronicsCamera(index)} className="text-sm text-blue-600 hover:text-blue-800 underline">
                                Retake Photo
                              </button>
                            </div>
                          ) : (
                            <Button type="button" variant="outline" size="sm" onClick={() => startElectronicsCamera(index)} className="text-xs">
                              Take Photo
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addElectronicsItem} className="text-xs">
                      + Add Another Item
                    </Button>
                    {formErrors.electronicsItems && <p className="text-xs text-red-600">{formErrors.electronicsItems}</p>}
                  </div>
                )}
              </div>

              {/* Selfie */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Selfie <span className="text-red-500">*</span>
                </label>
                {selfie ? (
                  <div className="flex items-center gap-4">
                    <img src={selfie} alt="Selfie" className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200" />
                    <div className="flex flex-col gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={startCamera} className="text-xs">
                        Retake Selfie
                      </Button>
                      <button type="button" onClick={() => setSelfie(undefined)} className="text-xs text-red-500 hover:text-red-700 underline">
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={startCamera}
                    className={cn(
                      "w-full h-24 border-dashed border-2 text-gray-500 hover:text-gray-700 hover:border-gray-400",
                      formErrors.selfie && "border-red-500 bg-red-50 text-red-500"
                    )}
                  >
                    <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Take Selfie
                  </Button>
                )}
                {formErrors.selfie && <p className="mt-1 text-xs text-red-600">{formErrors.selfie}</p>}
              </div>
            </div>

            {/* Submit button */}
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full mt-8 bg-[#7a2e2e] text-white hover:bg-[#8a3e3e] h-12 text-base font-semibold disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Check-in'}
            </Button>
          </div>
        </div>
      </div>

      {/* Camera Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Take a Selfie</DialogTitle>
            <DialogDescription>Position your face in the camera and click capture.</DialogDescription>
          </DialogHeader>
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="flex justify-center gap-3">
            <Button type="button" variant="outline" onClick={stopCamera}>Cancel</Button>
            <Button type="button" onClick={captureSelfie} disabled={!isCameraActive} className="bg-[#7a2e2e] text-white hover:bg-[#8a3e3e]">
              Capture
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Electronics Photo Dialog */}
      <Dialog open={electronicsPhotoDialogOpen} onOpenChange={handleElectronicsPhotoDialogOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Take Photo of Item</DialogTitle>
            <DialogDescription>Take a photo of the electronic item.</DialogDescription>
          </DialogHeader>
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video ref={electronicsVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={electronicsCanvasRef} className="hidden" />
          </div>
          <div className="flex justify-center gap-3">
            <Button type="button" variant="outline" onClick={() => { setElectronicsPhotoDialogOpen(false); stopElectronicsCamera(); }}>Cancel</Button>
            <Button type="button" onClick={captureElectronicsPhoto} disabled={!isElectronicsCameraActive} className="bg-[#7a2e2e] text-white hover:bg-[#8a3e3e]">
              Capture
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
      ))}
    </>
  );
}

export default function RevisitPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <RevisitContent />
    </Suspense>
  );
}
