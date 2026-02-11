'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { CheckIcon, ChevronDownIcon, XIcon } from 'lucide-react';
import { PersonToMeet } from '@/lib/types';
import { cn } from '@/lib/utils';
import { API_ENDPOINTS } from '@/lib/api-config';
import { HealthDeclarationForm, HealthDeclaration } from '@/components/health-declaration-form';

interface ElectronicsItem {
  type: string;
  brand: string;
  serialNumber?: string;
  quantity: number;
  photo?: string;
}

interface VisitorFormData {
  name: string;
  mobileNumber: string;
  email: string;
  company: string;
  personToMeet: string;
  reasonForVisit: string[]; // Changed to array for multiple selections
  selfie?: string;
  warehouse?: string;
  healthDeclaration?: HealthDeclaration;
  carryingElectronics: boolean;
  electronicsItems: ElectronicsItem[];
}

interface VisitorFormProps {
  onSubmit: (data: VisitorFormData) => Promise<void>;
  isLoading?: boolean;
  warehouseName?: string;
}

type FormErrors = Partial<Record<keyof VisitorFormData, string>>;

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

const ELECTRONICS_ITEM_OPTIONS = [
  "Laptop",
  "Tablet",
  "Mobile",
  "Others"
];

export function VisitorForm({ onSubmit, isLoading = false, warehouseName }: VisitorFormProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<VisitorFormData>({
    name: '',
    mobileNumber: '',
    email: '',
    company: '',
    personToMeet: '',
    reasonForVisit: [], // Changed to array for multiple selections
    selfie: undefined,
    warehouse: warehouseName || '',
    carryingElectronics: false,
    electronicsItems: [],
  });

  const [healthDeclaration, setHealthDeclaration] = useState<HealthDeclaration>({
    hasRespiratoryAilment: false,
    hasSkinInfection: false,
    hasGastrointestinalAilment: false,
    hasENTInfection: false,
    hasViralFever: false,
    hasCovid19: false,
    hadPastIllness: false,
    pastIllnessDetails: '',
    hadTyphoidDiarrhoea: false,
    hadRecentCovid: false,
    isOnMedication: false,
    protectiveClothingAck: false,
    foodDrinksAck: false,
    jewelryAck: false,
    personalHygieneAck: false,
    perfumeNailsAck: false,
    hygieneNormsAck: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [shouldStartCamera, setShouldStartCamera] = useState(false);
  const [reasonPopoverOpen, setReasonPopoverOpen] = useState(false);
  const [personPopoverOpen, setPersonPopoverOpen] = useState(false);
  const [customReason, setCustomReason] = useState('');
  const [approvers, setApprovers] = useState<PersonToMeet[]>([]);
  const [loadingApprovers, setLoadingApprovers] = useState(true);
  const [electronicsPhotoDialogOpen, setElectronicsPhotoDialogOpen] = useState(false);
  const [currentElectronicsIndex, setCurrentElectronicsIndex] = useState(0);
  const [shouldStartElectronicsCamera, setShouldStartElectronicsCamera] = useState(false);
  const [isElectronicsCameraActive, setIsElectronicsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const electronicsVideoRef = useRef<HTMLVideoElement>(null);
  const electronicsCanvasRef = useRef<HTMLCanvasElement>(null);
  const electronicsStreamRef = useRef<MediaStream | null>(null);

  // Update warehouse when warehouseName prop changes
  useEffect(() => {
    if (warehouseName) {
      setFormData((prev) => ({
        ...prev,
        warehouse: warehouseName,
      }));
    }
  }, [warehouseName]);

  // Fetch approvers from API
  useEffect(() => {
    const fetchApprovers = async () => {
      try {
        setLoadingApprovers(true);
        const url = `${API_ENDPOINTS.approvers}/list?active_only=true`;
        console.log('[VisitorForm] Fetching approvers from:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[VisitorForm] Failed to fetch approvers:', {
            status: response.status,
            statusText: response.statusText,
            url: url,
            error: errorText
          });
          throw new Error(`Failed to fetch approvers: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('[VisitorForm] Approvers data received:', data);
        const formattedApprovers: PersonToMeet[] = (data.approvers || data || []).map((approver: any) => ({
          id: approver.username,
          displayName: approver.name
        }));
        console.log('[VisitorForm] Loaded approvers:', formattedApprovers.length);
        setApprovers(formattedApprovers);
      } catch (error) {
        console.error('[VisitorForm] Error fetching approvers:', error);
        console.error('[VisitorForm] API URL being used:', API_ENDPOINTS.approvers);
        setApprovers([]);
      } finally {
        setLoadingApprovers(false);
      }
    };

    fetchApprovers();
  }, []);

  // Start camera when dialog is open and video element is ready
  useEffect(() => {
    if (shouldStartCamera && isDialogOpen) {
      // Add a small delay to ensure the video element is rendered in the DOM
      const timeoutId = setTimeout(async () => {
        if (videoRef.current) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
              audio: false
            });

            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              streamRef.current = stream;
              setIsCameraActive(true);
              setShouldStartCamera(false);
            }
          } catch (error) {
            console.error('Error accessing camera:', error);
            setErrors((prev) => ({
              ...prev,
              selfie: 'Unable to access camera. Please allow camera permissions.',
            }));
            setIsDialogOpen(false);
            setIsCameraActive(false);
            setShouldStartCamera(false);
          }
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [shouldStartCamera, isDialogOpen]);

  // Start electronics camera when dialog is open and video element is ready
  useEffect(() => {
    if (shouldStartElectronicsCamera && electronicsPhotoDialogOpen) {
      const timeoutId = setTimeout(async () => {
        if (electronicsVideoRef.current) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
              audio: false
            });

            if (electronicsVideoRef.current) {
              electronicsVideoRef.current.srcObject = stream;
              electronicsStreamRef.current = stream;
              setIsElectronicsCameraActive(true);
              setShouldStartElectronicsCamera(false);
            }
          } catch (error) {
            console.error('Error accessing electronics camera:', error);
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

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Visitor name is required';
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobileNumber)) {
      newErrors.mobileNumber = 'Mobile number must be exactly 10 digits';
    }

    // Email is required and must be valid
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Company is required
    if (!formData.company.trim()) {
      newErrors.company = 'Company / Organization is required';
    }

    if (!formData.personToMeet) {
      newErrors.personToMeet = 'Please select who you are meeting';
    }

    if (formData.reasonForVisit.length === 0) {
      newErrors.reasonForVisit = 'Please select at least one reason for visit';
    } else if (formData.reasonForVisit.includes('Other') && !customReason.trim()) {
      newErrors.reasonForVisit = 'Please specify the reason for visit';
    }

    if (!formData.selfie) {
      newErrors.selfie = 'Selfie is required';
    }

    // Electronics validation
    if (formData.carryingElectronics) {
      if (formData.electronicsItems.length === 0) {
        newErrors.electronicsItems = 'Please add at least one electronic item';
      } else {
        // Validate each electronics item
        for (let i = 0; i < formData.electronicsItems.length; i++) {
          const item = formData.electronicsItems[i];
          if (!item.type || !item.brand || item.quantity < 1) {
            newErrors.electronicsItems = `Please fill required fields for electronic item ${i + 1}`;
            break;
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const startCamera = () => {
    // Clear existing selfie if retaking
    if (formData.selfie) {
      setFormData((prev) => ({
        ...prev,
        selfie: undefined,
      }));
    }
    // Open dialog first, then start camera via useEffect
    setIsDialogOpen(true);
    setShouldStartCamera(true);
  };

  const discardSelfie = () => {
    setFormData((prev) => ({
      ...prev,
      selfie: undefined,
    }));
    if (errors.selfie) {
      setErrors((prev) => ({
        ...prev,
        selfie: undefined,
      }));
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setIsDialogOpen(false);
    setShouldStartCamera(false);
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

        setFormData((prev) => ({
          ...prev,
          selfie: imageData,
        }));

        if (errors.selfie) {
          setErrors((prev) => ({
            ...prev,
            selfie: undefined,
          }));
        }

        stopCamera();
      }
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      if (isCameraActive) {
        stopCamera();
      }
      setShouldStartCamera(false);
    }
  };

  const handleElectronicsPhotoDialogOpenChange = (open: boolean) => {
    setElectronicsPhotoDialogOpen(open);
    if (!open) {
      stopElectronicsCamera();
      setShouldStartElectronicsCamera(false);
    }
  };

  const stopElectronicsCamera = () => {
    if (electronicsStreamRef.current) {
      electronicsStreamRef.current.getTracks().forEach(track => track.stop());
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

        setFormData((prev) => {
          const updatedItems = [...prev.electronicsItems];
          updatedItems[currentElectronicsIndex] = {
            ...updatedItems[currentElectronicsIndex],
            photo: imageData
          };
          return {
            ...prev,
            electronicsItems: updatedItems
          };
        });

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name as keyof VisitorFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handlePersonSelect = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      personToMeet: value,
    }));
    setPersonPopoverOpen(false);
    if (errors.personToMeet) {
      setErrors((prev) => ({
        ...prev,
        personToMeet: undefined,
      }));
    }
  };

  const handleReasonSelect = (value: string) => {
    setFormData((prev) => {
      const currentReasons = prev.reasonForVisit;
      const isSelected = currentReasons.includes(value);
      
      let newReasons: string[];
      if (isSelected) {
        // Remove if already selected
        newReasons = currentReasons.filter((r) => r !== value);
      } else {
        // Add if not selected
        newReasons = [...currentReasons, value];
      }
      
      return {
        ...prev,
        reasonForVisit: newReasons,
      };
    });
    
    // Clear custom reason if "Other" is deselected
    if (value === 'Other' && formData.reasonForVisit.includes('Other')) {
      setCustomReason('');
    }
    
    if (errors.reasonForVisit) {
      setErrors((prev) => ({
        ...prev,
        reasonForVisit: undefined,
      }));
    }
    // Don't close popover - allow multiple selections
  };

  const handleCustomReasonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomReason(e.target.value);
    if (errors.reasonForVisit) {
      setErrors((prev) => ({
        ...prev,
        reasonForVisit: undefined,
      }));
    }
  };

  const handleElectronicsChange = (value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      carryingElectronics: value,
      electronicsItems: value 
        ? (prev.electronicsItems.length === 0 
            ? [{ type: '', brand: '', serialNumber: '', quantity: 1, photo: undefined }] 
            : prev.electronicsItems)
        : [],
    }));
    if (errors.electronicsItems) {
      setErrors((prev) => ({
        ...prev,
        electronicsItems: undefined,
      }));
    }
  };

  const addElectronicsItem = () => {
    setFormData((prev) => ({
      ...prev,
      electronicsItems: [
        ...prev.electronicsItems,
        { type: '', brand: '', serialNumber: '', quantity: 1, photo: undefined }
      ]
    }));
  };

  const removeElectronicsItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      electronicsItems: prev.electronicsItems.filter((_, i) => i !== index)
    }));
  };

  const updateElectronicsItem = (index: number, field: keyof ElectronicsItem, value: string | number) => {
    setFormData((prev) => {
      const updatedItems = [...prev.electronicsItems];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value
      };
      return {
        ...prev,
        electronicsItems: updatedItems
      };
    });
    if (errors.electronicsItems) {
      setErrors((prev) => ({
        ...prev,
        electronicsItems: undefined,
      }));
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    stopCamera();
    setCurrentStep(2);
    // Scroll to top when moving to next step
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToStep1 = () => {
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      // Process reasons: replace "Other" with custom reason if present, then join with comma
      const processedReasons = formData.reasonForVisit.map((reason) =>
        reason === 'Other' && customReason.trim() ? customReason.trim() : reason
      );
      const reasonString = processedReasons.join(', ');
      
      const submitData = {
        ...formData,
        reasonForVisit: reasonString,
        healthDeclaration: healthDeclaration,
      };
      await onSubmit(submitData);

      // Reset form
      setFormData({
        name: '',
        mobileNumber: '',
        email: '',
        company: '',
        personToMeet: '',
        reasonForVisit: [],
        selfie: undefined,
        warehouse: warehouseName || '',
        carryingElectronics: false,
        electronicsItems: [],
      });
      setHealthDeclaration({
        hasRespiratoryAilment: false,
        hasSkinInfection: false,
        hasGastrointestinalAilment: false,
        hasENTInfection: false,
        hasViralFever: false,
        hasCovid19: false,
        hadPastIllness: false,
        pastIllnessDetails: '',
        hadTyphoidDiarrhoea: false,
        hadRecentCovid: false,
        isOnMedication: false,
        protectiveClothingAck: false,
        foodDrinksAck: false,
        jewelryAck: false,
        personalHygieneAck: false,
        perfumeNailsAck: false,
        hygieneNormsAck: false,
      });
      setCustomReason('');
      setCurrentStep(1);
    } finally {
      setSubmitting(false);
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

  // Show health declaration form on step 2
  if (currentStep === 2) {
    return (
      <HealthDeclarationForm
        data={healthDeclaration}
        onChange={setHealthDeclaration}
        onBack={handleBackToStep1}
        onSubmit={handleFinalSubmit}
        isLoading={submitting || isLoading}
      />
    );
  }

  // Step 1: Basic visitor information
  return (
    <form onSubmit={handleNextStep} className="space-y-5 sm:space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <div>
          <p className="text-sm text-gray-500 font-medium">Step 1 of 2</p>
          <p className="text-xs text-gray-400 mt-0.5">Basic Information</p>
        </div>
      </div>
      {hasErrors && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">
            Please fix the highlighted fields.
          </p>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
          First Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter your first name"
          aria-describedby={errors.name ? 'name-error' : undefined}
          className={`w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
          }`}
        />
        {errors.name && (
          <p id="name-error" className="mt-1.5 text-xs text-red-600">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="mobileNumber" className="block text-sm font-semibold text-gray-700 mb-2">
          Mobile <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          id="mobileNumber"
          name="mobileNumber"
          value={formData.mobileNumber}
          onChange={handleChange}
          placeholder="Enter your 10-digit mobile number"
          aria-describedby={errors.mobileNumber ? 'mobile-error' : undefined}
          className={`w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            errors.mobileNumber ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
          }`}
        />
        {errors.mobileNumber && (
          <p id="mobile-error" className="mt-1.5 text-xs text-red-600">
            {errors.mobileNumber}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          required
          aria-describedby={errors.email ? 'email-error' : undefined}
          className={`w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
          }`}
        />
        {errors.email && (
          <p id="email-error" className="mt-1.5 text-xs text-red-600">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="company" className="block text-sm font-semibold text-gray-700 mb-2">
          Company / Organization <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="company"
          name="company"
          value={formData.company}
          onChange={handleChange}
          placeholder="Enter your company name"
          required
          aria-describedby={errors.company ? 'company-error' : undefined}
          className={`w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            errors.company ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
          }`}
        />
        {errors.company && (
          <p id="company-error" className="mt-1.5 text-xs text-red-600">
            {errors.company}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="personToMeet" className="block text-sm font-semibold text-gray-700 mb-2">
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
                !formData.personToMeet && "text-gray-400",
                errors.personToMeet && "border-red-500 bg-red-50"
              )}
            >
              {loadingApprovers
                ? "Loading approvers..."
                : formData.personToMeet
                  ? approvers.find((person) => person.id === formData.personToMeet)?.displayName
                  : "Select the person you are meeting"}
              <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="p-0 w-[var(--radix-popover-trigger-width)]"
            align="start"
          >
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
                      <CheckIcon
                        className={cn(
                          "mr-2 h-4 w-4",
                          formData.personToMeet === person.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {person.displayName}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {errors.personToMeet && (
          <p id="person-error" className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-red-600">
            {errors.personToMeet}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="reasonForVisit" className="block text-sm font-semibold text-gray-700 mb-2">
          Reason for Visit <span className="text-red-500">*</span>
          {formData.reasonForVisit.length > 0 && (
            <span className="ml-2 text-xs font-normal text-gray-500">
              ({formData.reasonForVisit.length} selected)
            </span>
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
                formData.reasonForVisit.length === 0 && "text-gray-400",
                errors.reasonForVisit && "border-red-500 bg-red-50"
              )}
            >
              <span className="truncate">
                {formData.reasonForVisit.length === 0
                  ? "Select reason(s) for visit..."
                  : formData.reasonForVisit.length === 1
                  ? formData.reasonForVisit[0]
                  : `${formData.reasonForVisit.length} reasons selected`}
              </span>
              <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="p-0 w-[var(--radix-popover-trigger-width)] max-h-[300px]" 
            align="start"
          >
            <Command>
              <CommandInput placeholder="Search reason..." />
              <CommandList>
                <CommandEmpty>No reason found.</CommandEmpty>
                <CommandGroup>
                  {REASON_FOR_VISIT_OPTIONS.map((reason) => {
                    const isSelected = formData.reasonForVisit.includes(reason);
                    return (
                      <CommandItem
                        key={reason}
                        value={reason}
                        onSelect={() => handleReasonSelect(reason)}
                        className="cursor-pointer"
                      >
                        <CheckIcon
                          className={cn(
                            "mr-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {reason}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {/* Show selected reasons as chips */}
        {formData.reasonForVisit.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.reasonForVisit.map((reason) => (
              <span
                key={reason}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md border border-blue-200"
              >
                {reason}
                <button
                  type="button"
                  onClick={() => handleReasonSelect(reason)}
                  className="ml-1 hover:text-blue-900 focus:outline-none"
                  aria-label={`Remove ${reason}`}
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        {formData.reasonForVisit.includes('Other') && (
          <input
            type="text"
            value={customReason}
            onChange={handleCustomReasonChange}
            placeholder="Please specify the reason for visit"
            aria-describedby={errors.reasonForVisit ? 'reason-error' : undefined}
            className={cn(
              "mt-3 w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors",
              errors.reasonForVisit ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
            )}
          />
        )}
        {errors.reasonForVisit && (
          <p id="reason-error" className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-red-600">
            {errors.reasonForVisit}
          </p>
        )}
      </div>

        {formData.warehouse && (
        <div>
          <label htmlFor="warehouse" className="block text-sm font-semibold text-gray-700 mb-2">
            Warehouse Location
          </label>
          <input
            type="text"
            id="warehouse"
            name="warehouse"
            value={formData.warehouse}
            disabled
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
          />
          <p className="mt-1.5 text-xs text-gray-500">
            Auto-filled from QR scan
          </p>
        </div>
      )}

      {/* Electronics Carrying Section */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Are you carrying anything like a Laptop/tablet etc?
        </label>
        <div className="flex gap-4 mt-2">
          <button
            type="button"
            onClick={() => handleElectronicsChange(true)}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              formData.carryingElectronics
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => handleElectronicsChange(false)}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              !formData.carryingElectronics
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            No
          </button>
        </div>
        
        {formData.carryingElectronics && (
          <div className="mt-4 space-y-4">
            {formData.electronicsItems.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Electronic Item {index + 1}
                  </h4>
                  {formData.electronicsItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeElectronicsItem(index)}
                      className="text-red-600 hover:text-red-800 text-xs font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Item Type *
                    </label>
                    <select
                      value={item.type}
                      onChange={(e) => updateElectronicsItem(index, 'type', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select item type</option>
                      {ELECTRONICS_ITEM_OPTIONS.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Brand Name *
                    </label>
                    <input
                      type="text"
                      value={item.brand}
                      onChange={(e) => updateElectronicsItem(index, 'brand', e.target.value)}
                      placeholder="e.g., Apple, Dell, Samsung"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Serial Number
                    </label>
                    <input
                      type="text"
                      value={item.serialNumber}
                      onChange={(e) => updateElectronicsItem(index, 'serialNumber', e.target.value)}
                      placeholder="Enter serial number"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateElectronicsItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Device Photo
                  </label>
                  {item.photo ? (
                    <div className="relative">
                      <img
                        src={item.photo}
                        alt={`${item.type} photo`}
                        className="w-32 h-24 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => updateElectronicsItem(index, 'photo', '')}
                        className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 text-xs"
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => startElectronicsCamera(index)}
                      variant="outline"
                      className="text-xs h-8 px-3"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Take Photo
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            <Button
              type="button"
              onClick={addElectronicsItem}
              variant="outline"
              className="w-full h-10 text-sm border-dashed border-gray-400 hover:border-gray-600"
            >
              + Add Another Item
            </Button>
          </div>
        )}
        
        {errors.electronicsItems && (
          <p className="mt-1 text-xs text-red-600">
            {errors.electronicsItems}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Selfie <span className="text-red-500">*</span>
        </label>

        <Button
          type="button"
          onClick={startCamera}
          className="w-full bg-[#7a2e2e] text-white hover:bg-[#8a3e3e] h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Take Selfie
        </Button>

        {formData.selfie && (
          <div className="mt-2 sm:mt-3 space-y-2 sm:space-y-3">
            <div className="relative rounded-lg overflow-hidden border border-border">
              <img
                src={formData.selfie}
                alt="Captured selfie"
                className="w-full h-auto"
              />
              <button
                type="button"
                onClick={discardSelfie}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 shadow-lg transition-colors"
                aria-label="Discard selfie"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            <Button
              type="button"
              onClick={startCamera}
              variant="outline"
              className="w-full h-9 sm:h-10 text-xs sm:text-sm"
            >
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Retake Selfie
            </Button>
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Capture Selfie</DialogTitle>
              <DialogDescription>
                Position your face in the camera frame and click Capture Photo when ready.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video w-full">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                  style={{ display: isCameraActive ? 'block' : 'none' }}
                />
                {!isCameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-white text-sm">Starting camera...</p>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={captureSelfie}
                  disabled={!isCameraActive}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  Capture Photo
                </Button>
                <Button
                  type="button"
                  onClick={stopCamera}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <canvas ref={canvasRef} className="hidden" />

        {errors.selfie && (
          <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-red-600">
            {errors.selfie}
          </p>
        )}
      </div>

      {/* Electronics Photo Dialog */}
      <Dialog open={electronicsPhotoDialogOpen} onOpenChange={handleElectronicsPhotoDialogOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Take Photo of Electronic Device</DialogTitle>
            <DialogDescription>
              Position your device in the camera frame and click Capture Photo when ready.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-black aspect-video w-full">
              <video
                ref={electronicsVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ display: isElectronicsCameraActive ? 'block' : 'none' }}
              />
              {!isElectronicsCameraActive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-white text-sm">Starting camera...</p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={captureElectronicsPhoto}
                disabled={!isElectronicsCameraActive}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Capture Photo
              </Button>
              <Button
                type="button"
                onClick={() => setElectronicsPhotoDialogOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <canvas ref={electronicsCanvasRef} className="hidden" />

      <div className="flex gap-3 pt-6 border-t border-gray-200">
        <Button
          type="submit"
          disabled={submitting || isLoading}
          className="flex-1 bg-[#7a2e2e] text-white hover:bg-[#8a3e3e] h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all"
        >
          Next: Health Declaration →
        </Button>
      </div>
    </form>
  );
}
