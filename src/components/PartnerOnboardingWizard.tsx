'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  UserCheck,
  Building2,
  Camera,
  Clock,
  Trophy,
  CreditCard,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  ExternalLink,
  Plus,
  Trash2,
  Upload,
  LogOut,
  Sparkles,
  FileText,
  FileUp,
  Image as ImageIcon,
  Copy,
  CalendarDays,
  ShieldCheck,
  Percent,
  Lock,
  Eye,
  EyeOff,
  Edit3,
  MapPin,
  Phone,
  Mail,
  Check,
  X,
} from 'lucide-react';
import { onboardingApi, OnboardingRejectionReason } from '@/lib/api';

const STEPS = [
  { id: 1, title: 'Partner Details', short: 'Partner', desc: 'Personal & Identity Info', icon: UserCheck },
  { id: 2, title: 'Venue & GST', short: 'Venue', desc: 'Facility & Tax Details', icon: Building2 },
  { id: 3, title: 'Court Photos', short: 'Photos', desc: '4 to 8 Court Images', icon: Camera },
  { id: 4, title: 'Operating Hours', short: 'Hours', desc: 'Timings & Working Days', icon: Clock },
  { id: 5, title: 'Sports & Courts', short: 'Courts', desc: 'Pricing & Slot Setup', icon: Trophy },
  { id: 6, title: 'Bank Details', short: 'Bank', desc: 'Settlement Account', icon: CreditCard },
  { id: 7, title: 'Review & Submit', short: 'Review', desc: 'Final Verification', icon: FileCheck },
];

const DAYS_ORDER = [
  { day: 'MONDAY', label: 'Monday' },
  { day: 'TUESDAY', label: 'Tuesday' },
  { day: 'WEDNESDAY', label: 'Wednesday' },
  { day: 'THURSDAY', label: 'Thursday' },
  { day: 'FRIDAY', label: 'Friday' },
  { day: 'SATURDAY', label: 'Saturday' },
  { day: 'SUNDAY', label: 'Sunday' },
];

const TIME_OPTIONS = [
  '05:00 AM', '05:30 AM', '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM',
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM',
  '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM', '10:00 PM', '10:30 PM',
  '11:00 PM', '11:30 PM', '12:00 AM'
];

const AVAILABLE_SPORTS = [
  'FOOTBALL',
  'CRICKET',
  'BOX_CRICKET',
  'BADMINTON',
  'TENNIS',
  'BASKETBALL',
  'PICKLEBALL',
  'VOLLEYBALL',
];

interface DayScheduleItem {
  day: string;
  label: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface CourtConfigItem {
  court_name: string;
  display_name: string;
  sports: string[];
  minimum_booking_time_minutes: number;
  regular_price: number;
  peak_days: string[];
  peak_hours: Array<{ start_time: string; end_time: string }>;
  peak_hour_price: number;
  weekend_price: number;
  advance_booking_price: number;
  use_one_physical_court_for_two_sports: boolean;
  is_same_sport_as_above?: boolean;
  shared_with_court_index?: number;
  cancellation_window_hours?: number;
  refund_percentage?: number;
}

// Strict Format Regex Validators
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
const isValidIndianMobile = (mobile: string) => /^[6-9]\d{9}$/.test(mobile.trim());
const isValidPincode = (pincode: string) => /^\d{6}$/.test(pincode.trim());
const isValidName = (name: string) => /^[a-zA-Z\s.]{3,60}$/.test(name.trim());
const isValidGSTIN = (gst: string) => /^[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}[1-9A-Za-z]{1}[Zz][0-9A-Za-z]{1}$/.test(gst.trim());
const isValidIFSC = (ifsc: string) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.trim());
const isValidAccountNumber = (acc: string) => /^\d{9,18}$/.test(acc.trim());
const isValidGoogleMapsUrl = (url: string) => {
  const clean = url.trim();
  return clean.length >= 8 && (/google\.[a-z.]+\/maps/i.test(clean) || /maps\.app\.goo\.gl/i.test(clean) || /maps\.google/i.test(clean) || /^https?:\/\//i.test(clean));
};

// Helper to map rejection items to the 7-step wizard navigation
const mapRejectionToStep = (r: OnboardingRejectionReason): number => {
  if (r.field === 'partner_identity' || r.section?.toLowerCase().includes('partner') || r.section?.toLowerCase().includes('identity')) return 1;
  if (r.field === 'business_venue' || r.section?.toLowerCase().includes('venue') || r.section?.toLowerCase().includes('gst')) return 2;
  if (r.field === 'court_photos' || r.section?.toLowerCase().includes('photo') || r.section?.toLowerCase().includes('camera')) return 3;
  if (r.field === 'operating_hours' || r.section?.toLowerCase().includes('hours') || r.section?.toLowerCase().includes('schedule')) return 4;
  if (r.field === 'courts_matrix' || r.section?.toLowerCase().includes('court') || r.section?.toLowerCase().includes('sport')) return 5;
  if (r.field === 'bank_details' || r.section?.toLowerCase().includes('bank') || r.section?.toLowerCase().includes('payout') || r.section?.toLowerCase().includes('settlement')) return 6;
  if (typeof r.step === 'number' && r.step >= 1 && r.step <= 7) return r.step;
  return 1;
};

export default function PartnerOnboardingWizard() {
  const router = useRouter();
  const params = useParams();
  const urlToken = params?.requestId as string | undefined;

  const [token, setToken] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxCompletedStep, setMaxCompletedStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-dismiss floating bottom-right popups
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Application Status State
  const [applicationStatus, setApplicationStatus] = useState<
    'DRAFT' | 'SUBMITTED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'
  >('DRAFT');
  const [applicationId, setApplicationId] = useState<string>('');
  const [rejectionReasons, setRejectionReasons] = useState<
    OnboardingRejectionReason[]
  >([]);
  const [appAccessLink, setAppAccessLink] = useState<string | undefined>();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Step 1: Partner Details State (Dynamic)
  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [aadhaarDocId, setAadhaarDocId] = useState('');
  const [aadhaarFileName, setAadhaarFileName] = useState('');
  const [aadhaarPreviewUrl, setAadhaarPreviewUrl] = useState<string | null>(null);
  const [aadhaarUploading, setAadhaarUploading] = useState(false);

  const [profilePhotoDocId, setProfilePhotoDocId] = useState('');
  const [profilePhotoFileName, setProfilePhotoFileName] = useState('');
  const [profilePhotoPreviewUrl, setProfilePhotoPreviewUrl] = useState<string | null>(null);
  const [profilePhotoUploading, setProfilePhotoUploading] = useState(false);

  const [partnerAddress, setPartnerAddress] = useState('');
  const [partnerState, setPartnerState] = useState('Tamil Nadu');
  const [partnerDistrict, setPartnerDistrict] = useState('Coimbatore');
  const [partnerPincode, setPartnerPincode] = useState('641018');

  // Step 2: Business & Venue Details State (Dynamic)
  const [venueName, setVenueName] = useState('');
  const [venueEmail, setVenueEmail] = useState('');
  const [venueMobile, setVenueMobile] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [venueGoogleMaps, setVenueGoogleMaps] = useState('');
  const [hasGst, setHasGst] = useState(false);
  const [gstNumber, setGstNumber] = useState('');
  const [gstDocId, setGstDocId] = useState('');
  const [gstFileName, setGstFileName] = useState('');
  const [gstPreviewUrl, setGstPreviewUrl] = useState<string | null>(null);
  const [gstUploading, setGstUploading] = useState(false);

  // Automatically sync verified mobile number to venueMobile
  useEffect(() => {
    if (!venueMobile && mobileNumber) {
      setVenueMobile(mobileNumber.replace(/^\+91\s*/, '').trim());
    }
  }, [mobileNumber, venueMobile]);

  // Step 3: Court Photos State (Dynamic / 4 to 8 photos)
  const [courtPhotoList, setCourtPhotoList] = useState<
    Array<{ id: string; name: string; previewUrl?: string }>
  >([]);
  const [courtPhotoUploading, setCourtPhotoUploading] = useState(false);
  const [previewModalImage, setPreviewModalImage] = useState<{
    url: string;
    title: string;
    isPdf?: boolean;
  } | null>(null);

  // Step 4: Day-wise Operating Schedule State (Default: Mon-Fri 6AM-10PM, Sat 6AM-11PM, Sun Open)
  const [dailySchedules, setDailySchedules] = useState<DayScheduleItem[]>([
    { day: 'MONDAY', label: 'Monday', isOpen: true, openTime: '06:00 AM', closeTime: '10:00 PM' },
    { day: 'TUESDAY', label: 'Tuesday', isOpen: true, openTime: '06:00 AM', closeTime: '10:00 PM' },
    { day: 'WEDNESDAY', label: 'Wednesday', isOpen: true, openTime: '06:00 AM', closeTime: '10:00 PM' },
    { day: 'THURSDAY', label: 'Thursday', isOpen: true, openTime: '06:00 AM', closeTime: '10:00 PM' },
    { day: 'FRIDAY', label: 'Friday', isOpen: true, openTime: '06:00 AM', closeTime: '10:00 PM' },
    { day: 'SATURDAY', label: 'Saturday', isOpen: true, openTime: '06:00 AM', closeTime: '11:00 PM' },
    { day: 'SUNDAY', label: 'Sunday', isOpen: true, openTime: '06:00 AM', closeTime: '10:00 PM' },
  ]);

  // Step 5: Sports & Courts State
  const [selectedSports, setSelectedSports] = useState<string[]>(['FOOTBALL']);
  const [editingCourtIndex, setEditingCourtIndex] = useState<number | null>(0);
  const [cancellationWindowHours, setCancellationWindowHours] = useState<number>(12);
  const [refundPercentage, setRefundPercentage] = useState<number>(100);
  const [courts, setCourts] = useState<CourtConfigItem[]>([
    {
      court_name: 'Turf 1',
      display_name: 'Main Arena Court',
      sports: ['FOOTBALL'],
      minimum_booking_time_minutes: 60,
      regular_price: 1200,
      peak_days: ['SATURDAY', 'SUNDAY'],
      peak_hours: [{ start_time: '06:00 PM', end_time: '10:00 PM' }],
      peak_hour_price: 1600,
      weekend_price: 1500,
      advance_booking_price: 500,
      use_one_physical_court_for_two_sports: false,
      cancellation_window_hours: 12,
      refund_percentage: 100,
    },
  ]);

  // Step 6: Bank Details State (With AES-256 Masking & Visibility Toggle)
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [showConfirmAccountNumber, setShowConfirmAccountNumber] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountType, setAccountType] = useState('CURRENT');
  const [branchProofDocId, setBranchProofDocId] = useState('');
  const [branchProofFileName, setBranchProofFileName] = useState('');
  const [branchProofPreviewUrl, setBranchProofPreviewUrl] = useState<string | null>(null);
  const [branchProofUploading, setBranchProofUploading] = useState(false);

  // Step 7: Declaration State
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  // Hidden File Input References
  const gstFileInputRef = useRef<HTMLInputElement | null>(null);
  const aadhaarFileInputRef = useRef<HTMLInputElement | null>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement | null>(null);
  const bankProofInputRef = useRef<HTMLInputElement | null>(null);
  const courtPhotoInputRef = useRef<HTMLInputElement | null>(null);

  // Dedicated Multi-file Court Photos Upload Handler
  const handleCourtPhotosUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const activeToken =
      token ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('ibooksports_onboarding_token')
        : null) ||
      'onb_tok_demo_10231';

    setErrorMessage(null);
    setCourtPhotoUploading(true);

    try {
      const newItems: Array<{ id: string; name: string; previewUrl: string }> = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (courtPhotoList.length + newItems.length >= 8) {
          setErrorMessage('Maximum 8 facility photos are allowed.');
          break;
        }
        if (file.size > 5 * 1024 * 1024) {
          setErrorMessage(`File "${file.name}" exceeds maximum allowed limit of 5 MB.`);
          continue;
        }
        const previewUrl = URL.createObjectURL(file);
        const res = await onboardingApi.uploadDocument(activeToken, file, 'COURT_PHOTO');
        const effectiveUrl = res.document_id ? onboardingApi.getDocumentUrl(res.document_id) : previewUrl;
        newItems.push({
          id: res.document_id,
          name: res.file_name || file.name,
          previewUrl: effectiveUrl,
        });
      }
      if (newItems.length > 0) {
        setCourtPhotoList((prev) => [...prev, ...newItems]);
        setSuccessMessage(`Successfully uploaded ${newItems.length} photo(s).`);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(
        error.response?.data?.message || error.message || 'Court photo upload failed.',
      );
    } finally {
      setCourtPhotoUploading(false);
      e.target.value = '';
    }
  };

  // Generic File Upload Handler
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    docType: 'AADHAAR' | 'PROFILE_PHOTO' | 'GST_CERTIFICATE' | 'COURT_PHOTO' | 'BANK_PROOF',
    onSuccess: (docId: string, fileName: string, previewUrl?: string) => void,
    setUploadingState: (loading: boolean) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size exceeds maximum allowed limit of 5 MB.');
      return;
    }

    setErrorMessage(null);
    setUploadingState(true);

    try {
      const activeToken =
        token ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('ibooksports_onboarding_token')
          : null) ||
        'onb_tok_demo_10231';

      const previewUrl = URL.createObjectURL(file);
      const res = await onboardingApi.uploadDocument(activeToken, file, docType);
      const effectiveUrl = res.document_id ? onboardingApi.getDocumentUrl(res.document_id) : previewUrl;
      onSuccess(res.document_id, res.file_name || file.name, effectiveUrl);
      setSuccessMessage(`${file.name} uploaded and verified successfully!`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(
        error.response?.data?.message || error.message || 'File upload failed. Please try again.',
      );
    } finally {
      setUploadingState(false);
      e.target.value = '';
    }
  };

  // Dedicated document and photo preview viewer opener with fallback support
  const handleOpenDocumentPreview = (
    previewUrl: string | null | undefined,
    fileName: string,
    docId: string,
    docType: 'AADHAAR' | 'PROFILE_PHOTO' | 'GST' | 'COURT' | 'BANK',
  ) => {
    let effectiveUrl = previewUrl;
    if (!effectiveUrl) {
      if (docType === 'PROFILE_PHOTO') {
        effectiveUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';
      } else if (docType === 'GST') {
        effectiveUrl = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80';
      } else if (docType === 'BANK') {
        effectiveUrl = 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1200&q=80';
      } else if (docType === 'COURT') {
        effectiveUrl = 'https://images.unsplash.com/photo-1529900245534-47fbfb5d4fbe?auto=format&fit=crop&w=1200&q=80';
      } else {
        effectiveUrl = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80';
      }
    }

    const isPdf = !!(fileName?.toLowerCase().endsWith('.pdf') && (effectiveUrl.startsWith('blob:') || effectiveUrl.startsWith('data:application/pdf')));

    setPreviewModalImage({
      url: effectiveUrl,
      title: fileName || `${docType} Document (${docId || 'Verified'})`,
      isPdf,
    });
  };

  // Helper to copy Monday's hours to all open days
  const handleCopyMondayHoursToAll = () => {
    const mon = dailySchedules.find((d) => d.day === 'MONDAY');
    if (!mon) return;
    setDailySchedules((prev) =>
      prev.map((item) =>
        item.isOpen
          ? { ...item, openTime: mon.openTime, closeTime: mon.closeTime }
          : item,
      ),
    );
    setSuccessMessage('Monday operational hours copied to all open days.');
  };

  // Helper to open all days
  const handleOpenAllDays = () => {
    setDailySchedules((prev) => prev.map((item) => ({ ...item, isOpen: true })));
    setSuccessMessage('All 7 days marked as OPEN.');
  };

  // Helper for weekdays only (Mon-Fri open, Sat-Sun closed)
  const handleWeekdaysOnly = () => {
    setDailySchedules((prev) =>
      prev.map((item) => ({
        ...item,
        isOpen: item.day !== 'SATURDAY' && item.day !== 'SUNDAY',
      })),
    );
    setSuccessMessage('Weekdays marked as OPEN, Saturday and Sunday marked as CLOSED.');
  };

  // Load Onboarding Session
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setInitializing(false);
    }, 2000);

    const activeToken =
      urlToken ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('ibooksports_onboarding_token')
        : null) ||
      'onb_tok_demo_10231';

    if (activeToken) {
      setToken(activeToken);
      loadSession(activeToken).finally(() => {
        clearTimeout(safetyTimer);
        setInitializing(false);
      });
    } else {
      clearTimeout(safetyTimer);
      setInitializing(false);
    }

    return () => clearTimeout(safetyTimer);
  }, [urlToken]);

  const loadSession = async (sessionToken: string) => {
    try {
      const data = await onboardingApi.getSession(sessionToken);
      if (data) {
        setApplicationId(data.application_id);
        setCurrentStep(data.current_step || 1);
        setMaxCompletedStep(data.current_step || 1);
        setApplicationStatus(data.status || 'DRAFT');
        if (data.rejection_reasons) setRejectionReasons(data.rejection_reasons);
        if (data.app_access_link) setAppAccessLink(data.app_access_link);

        // Pre-fill Partner Details
        const storedMobile =
          typeof window !== 'undefined'
            ? localStorage.getItem('ibooksports_partner_mobile')
            : '';
        const resolvedMobile =
          data.partner_details?.mobile_number ||
          data.mobile_number ||
          data.business_details?.venue_mobile_number ||
          storedMobile ||
          '';

        if (resolvedMobile) {
          setMobileNumber(resolvedMobile);
          if (typeof window !== 'undefined') {
            localStorage.setItem('ibooksports_partner_mobile', resolvedMobile);
          }
        }

        if (data.partner_details) {
          setPartnerName(data.partner_details.name || '');
          setPartnerEmail(data.partner_details.email || '');
          setPartnerAddress(data.partner_details.address || '');
          setPartnerState(data.partner_details.state || 'Tamil Nadu');
          setPartnerDistrict(data.partner_details.district || 'Coimbatore');
          setPartnerPincode(data.partner_details.pincode || '');
          if (data.partner_details.aadhaar_document_id) {
            setAadhaarDocId(data.partner_details.aadhaar_document_id);
            setAadhaarFileName(`${data.partner_details.aadhaar_document_id}.pdf`);
          }
          if (data.partner_details.profile_photo_document_id) {
            setProfilePhotoDocId(data.partner_details.profile_photo_document_id);
            setProfilePhotoFileName(`${data.partner_details.profile_photo_document_id}.jpg`);
          }
        }

        // Pre-fill Business Details
        if (data.business_details) {
          setVenueName(data.business_details.venue_name || '');
          setVenueEmail(
            data.business_details.venue_email || data.partner_details?.email || '',
          );
          setVenueMobile(
            data.business_details.venue_mobile_number ||
            data.partner_details?.mobile_number ||
            data.mobile_number ||
            '',
          );
          setVenueAddress(data.business_details.venue_address || '');
          setVenueGoogleMaps(
            data.business_details.venue_google_maps_link || '',
          );
          setHasGst(data.business_details.has_gst || false);
          if (data.business_details.gst_number) {
            setGstNumber(data.business_details.gst_number);
          }
          if (data.business_details.gst_document_id) {
            setGstDocId(data.business_details.gst_document_id);
            setGstFileName(`${data.business_details.gst_document_id}.pdf`);
          }
        }

        // Pre-fill Photos
        if (data.court_photos && data.court_photos.length > 0) {
          setCourtPhotoList(
            data.court_photos.map((id, idx) => ({
              id,
              name: `Facility Photo ${idx + 1}.jpg`,
            })),
          );
        }

        // Pre-fill Operating Hours & Daily Schedule
        if (data.operating_hours) {
          if (data.operating_hours.day_schedules && data.operating_hours.day_schedules.length > 0) {
            const mapped = DAYS_ORDER.map((d) => {
              const found = data.operating_hours?.day_schedules?.find(
                (item) => item.day === d.day,
              );
              return {
                day: d.day,
                label: d.label,
                isOpen: found ? found.is_open : true,
                openTime: found?.open_time || data.operating_hours?.operating_time || '06:00 AM',
                closeTime: found?.close_time || data.operating_hours?.closing_time || '10:00 PM',
              };
            });
            setDailySchedules(mapped);
          } else if (data.operating_hours.working_days) {
            const openDays = data.operating_hours.working_days;
            const mapped = DAYS_ORDER.map((d) => ({
              day: d.day,
              label: d.label,
              isOpen: openDays.includes(d.day),
              openTime: data.operating_hours?.operating_time || '06:00 AM',
              closeTime: data.operating_hours?.closing_time || '10:00 PM',
            }));
            setDailySchedules(mapped);
          }
        }

        // Pre-fill Courts Config
        if (data.courts_config) {
          if (data.courts_config.sports && data.courts_config.sports.length > 0) {
            setSelectedSports(data.courts_config.sports);
          }
          if (data.courts_config.courts && data.courts_config.courts.length > 0) {
            setCourts(data.courts_config.courts);
          }
          if (data.courts_config.cancellation_window_hours) {
            setCancellationWindowHours(Number(data.courts_config.cancellation_window_hours));
          }
          if (data.courts_config.refund_percentage) {
            setRefundPercentage(Number(data.courts_config.refund_percentage));
          }
        }

        // Pre-fill Bank Details
        if (data.bank_details) {
          setAccountHolderName(data.bank_details.account_holder_name || '');
          setBankName(data.bank_details.bank_name || '');
          setAccountNumber(data.bank_details.account_number || '');
          setConfirmAccountNumber(
            data.bank_details.confirm_account_number || '',
          );
          setBranchName(data.bank_details.branch_name || '');
          setIfscCode(data.bank_details.ifsc_code || '');
          setAccountType(data.bank_details.account_type || 'CURRENT');
          if (data.bank_details.branch_proof_document_id) {
            setBranchProofDocId(data.bank_details.branch_proof_document_id);
            setBranchProofFileName(`${data.bank_details.branch_proof_document_id}.pdf`);
          }
        }
      }
    } catch (err) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('ibooksports_onboarding_token');
      }
      setCurrentStep(1);
    } finally {
      setInitializing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ibooksports_onboarding_token');
    router.push('/onboarding/login');
  };

  // --- STEP 1: SAVE PARTNER DETAILS WITH STRICT VALIDATION ---
  const handleSavePartnerDetails = async () => {
    if (!token) return;

    if (!isValidName(partnerName)) {
      setErrorMessage('Full Legal Name must contain letters and spaces only (minimum 3 characters).');
      return;
    }
    if (!isValidEmail(partnerEmail)) {
      setErrorMessage('Please enter a valid email address (e.g., name@domain.com).');
      return;
    }
    if (!isValidIndianMobile(mobileNumber)) {
      setErrorMessage('Verified Mobile Number must be exactly 10 digits starting with 6, 7, 8, or 9.');
      return;
    }
    if (!isValidPincode(partnerPincode)) {
      setErrorMessage('Pincode must be exactly 6 numeric digits.');
      return;
    }
    if (!partnerAddress.trim() || partnerAddress.trim().length < 5) {
      setErrorMessage('Residential Address is required (minimum 5 characters).');
      return;
    }
    if (!partnerState.trim()) {
      setErrorMessage('State is required.');
      return;
    }
    if (!partnerDistrict.trim()) {
      setErrorMessage('District is required.');
      return;
    }
    if (!aadhaarDocId) {
      setErrorMessage('Please upload your mandatory Aadhaar Card Document.');
      return;
    }
    if (!profilePhotoDocId) {
      setErrorMessage('Please upload your mandatory Profile Photo ID.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);
    try {
      await onboardingApi.savePartnerDetails(token, {
        name: partnerName.trim(),
        mobile_number: mobileNumber.trim(),
        email: partnerEmail.trim().toLowerCase(),
        aadhaar_document_id: aadhaarDocId,
        profile_photo_document_id: profilePhotoDocId,
        address: partnerAddress.trim(),
        state: partnerState.trim(),
        district: partnerDistrict.trim(),
        pincode: partnerPincode.trim(),
      });
      setCurrentStep(2);
      if (maxCompletedStep < 2) setMaxCompletedStep(2);
      setSuccessMessage('Partner profile & identification saved successfully!');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to save partner details.',
      );
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 2: SAVE BUSINESS & VENUE DETAILS WITH STRICT VALIDATION ---
  const handleSaveBusinessDetails = async () => {
    if (!token) return;

    if (!venueName.trim() || venueName.trim().length < 3) {
      setErrorMessage('Venue / Sports Arena Name must be at least 3 characters.');
      return;
    }
    if (!isValidEmail(venueEmail)) {
      setErrorMessage('Please enter a valid official venue email address.');
      return;
    }
    const effectiveMobile = (venueMobile || mobileNumber || '').replace(/^\+91\s*/, '').trim();
    if (!isValidIndianMobile(effectiveMobile)) {
      setErrorMessage('Contact Mobile Number must be exactly 10 digits starting with 6, 7, 8, or 9.');
      return;
    }
    if (!venueAddress.trim() || venueAddress.trim().length < 3) {
      setErrorMessage('Venue Physical Address is required (minimum 3 characters).');
      return;
    }
    if (!isValidGoogleMapsUrl(venueGoogleMaps)) {
      setErrorMessage('Google Maps Location Link must be a valid Google Maps URL (e.g. https://maps.app.goo.gl/...).');
      return;
    }
    if (hasGst) {
      if (!isValidGSTIN(gstNumber)) {
        setErrorMessage('Invalid 15-character GSTIN format (e.g. 33ABCDE1234F1Z5).');
        return;
      }
      if (!gstDocId) {
        setErrorMessage('Please upload the official GST Registration Certificate document.');
        return;
      }
    }

    setErrorMessage(null);
    setLoading(true);
    try {
      await onboardingApi.saveBusinessDetails(token, {
        venue_name: venueName.trim(),
        venue_email: venueEmail.trim().toLowerCase(),
        venue_mobile_number: effectiveMobile,
        venue_address: venueAddress.trim(),
        venue_google_maps_link: venueGoogleMaps.trim(),
        has_gst: hasGst,
        gst_number: hasGst ? gstNumber.trim().toUpperCase() : undefined,
        gst_document_id: hasGst ? gstDocId : undefined,
      });
      setCurrentStep(3);
      if (maxCompletedStep < 3) setMaxCompletedStep(3);
      setSuccessMessage('Venue & Business details saved successfully!');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to save business details.',
      );
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 3: SAVE COURT PHOTOS WITH STRICT VALIDATION ---
  const handleSaveCourtPhotos = async () => {
    if (!token) return;
    if (courtPhotoList.length < 4) {
      setErrorMessage(`Please upload at least 4 facility photos (${4 - courtPhotoList.length} more needed).`);
      return;
    }
    if (courtPhotoList.length > 8) {
      setErrorMessage('Maximum 8 facility photos are allowed.');
      return;
    }
    setErrorMessage(null);
    setLoading(true);
    try {
      await onboardingApi.saveCourtPhotos(
        token,
        courtPhotoList.map((p) => p.id),
      );
      setCurrentStep(4);
      if (maxCompletedStep < 4) setMaxCompletedStep(4);
      setSuccessMessage('Court photos saved successfully!');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to save court photos.',
      );
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 4: SAVE OPERATING HOURS (DAY-WISE SCHEDULE) ---
  const handleSaveOperatingHours = async () => {
    if (!token) return;
    const openDays = dailySchedules.filter((d) => d.isOpen);
    if (openDays.length === 0) {
      setErrorMessage('Please configure at least one operational day (marked OPEN) for your arena.');
      return;
    }

    const working_days = openDays.map((d) => d.day);
    const operating_time = openDays[0].openTime;
    const closing_time = openDays[0].closeTime;
    const starting_time = openDays[0].openTime;

    const day_schedules = dailySchedules.map((d) => ({
      day: d.day,
      is_open: d.isOpen,
      open_time: d.isOpen ? d.openTime : undefined,
      close_time: d.isOpen ? d.closeTime : undefined,
    }));

    setErrorMessage(null);
    setLoading(true);
    try {
      await onboardingApi.saveOperatingHours(token, {
        working_days,
        operating_time,
        closing_time,
        starting_time,
        day_schedules,
      });
      setCurrentStep(5);
      if (maxCompletedStep < 5) setMaxCompletedStep(5);
      setSuccessMessage('Operating schedule saved successfully!');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to save operating hours.',
      );
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 5: SAVE SPORTS & COURTS ---
  const handleSaveSingleCourt = (index: number) => {
    const c = courts[index];
    if (!c) return;
    if (!c.sports || c.sports.length === 0) {
      setErrorMessage(`Please select one sport for Court #${index + 1}.`);
      return;
    }
    if (!c.court_name.trim()) {
      setErrorMessage(`Court #${index + 1} Identifier Name is required.`);
      return;
    }
    if (!c.display_name.trim()) {
      setErrorMessage(`Court #${index + 1} Customer Display Name is required.`);
      return;
    }
    if (!c.regular_price || Number(c.regular_price) <= 0) {
      setErrorMessage(`Court #${index + 1} regular price must be a valid positive number.`);
      return;
    }

    setErrorMessage(null);
    setEditingCourtIndex(null);
    setSuccessMessage(`Court #${index + 1} (${c.court_name}) saved successfully! Click "+ Add Another Court" if you have more courts.`);
  };

  const handleAddNewCourt = () => {
    if (editingCourtIndex !== null) {
      const current = courts[editingCourtIndex];
      if (!current?.court_name.trim() || !current?.display_name.trim() || !current?.sports?.length) {
        setErrorMessage(`Please complete and save Court #${editingCourtIndex + 1} before adding another court.`);
        return;
      }
      handleSaveSingleCourt(editingCourtIndex);
    }

    const previousSport = courts[courts.length - 1]?.sports?.[0] || 'FOOTBALL';
    // Offer next available sport if possible, or fall back to previous sport
    const nextSport = AVAILABLE_SPORTS.find((s) => !courts.some((ct) => ct.sports?.[0] === s)) || previousSport;
    const nextNumber = courts.length + 1;
    const newCourt = {
      court_name: `Turf ${nextNumber}`,
      display_name: `Premium Court ${nextNumber}`,
      sports: [nextSport],
      minimum_booking_time_minutes: 60,
      regular_price: 1000,
      peak_days: ['SATURDAY', 'SUNDAY'],
      peak_hours: [{ start_time: '06:00 PM', end_time: '10:00 PM' }],
      peak_hour_price: 1500,
      weekend_price: 1400,
      advance_booking_price: 500,
      use_one_physical_court_for_two_sports: false,
      is_same_sport_as_above: false,
      cancellation_window_hours: cancellationWindowHours,
      refund_percentage: refundPercentage,
    };

    setCourts((prev) => [...prev, newCourt]);
    setEditingCourtIndex(courts.length);
  };

  const handleSaveCourts = async () => {
    if (!token) return;

    if (editingCourtIndex !== null) {
      const current = courts[editingCourtIndex];
      if (!current?.court_name.trim() || !current?.display_name.trim() || !current?.sports?.length) {
        setErrorMessage(`Please complete and save Court #${editingCourtIndex + 1} before continuing.`);
        return;
      }
      setEditingCourtIndex(null);
    }

    const distinctSports = Array.from(new Set(courts.flatMap((c) => c.sports))).filter(Boolean);
    if (distinctSports.length === 0) {
      setErrorMessage('Please select at least one sport for your courts.');
      return;
    }
    if (courts.length === 0) {
      setErrorMessage('Please configure at least one playable court.');
      return;
    }
    for (let i = 0; i < courts.length; i++) {
      const c = courts[i];
      if (!c.court_name.trim()) {
        setErrorMessage(`Court #${i + 1} Identifier is required.`);
        return;
      }
      if (!c.display_name.trim()) {
        setErrorMessage(`Court #${i + 1} Display Name is required.`);
        return;
      }
      if (!c.sports || c.sports.length === 0) {
        setErrorMessage(`Please select at least one sport for Court #${i + 1}.`);
        return;
      }
      if (!c.regular_price || c.regular_price <= 0) {
        setErrorMessage(`Court #${i + 1} regular price must be a valid positive number.`);
        return;
      }
    }

    setErrorMessage(null);
    setLoading(true);
    try {
      const payloadCourts = courts.map((c) => ({
        court_name: c.court_name,
        display_name: c.display_name,
        sports: [c.sports?.[0] || 'FOOTBALL'],
        minimum_booking_time_minutes: Number(c.minimum_booking_time_minutes) || 60,
        regular_price: Number(c.regular_price) || 0,
        peak_days: c.peak_days || ['SATURDAY', 'SUNDAY'],
        peak_hours: c.peak_hours || [{ start_time: '06:00 PM', end_time: '10:00 PM' }],
        peak_hour_price: Number(c.peak_hour_price) || 0,
        weekend_price: Number(c.weekend_price) || 0,
        advance_booking_price: Number(c.advance_booking_price) || 0,
        use_one_physical_court_for_two_sports: Boolean(c.use_one_physical_court_for_two_sports),
        shared_with_court_index: c.shared_with_court_index,
        is_same_sport_as_above: false,
        cancellation_window_hours: c.cancellation_window_hours || cancellationWindowHours,
        refund_percentage: c.refund_percentage || refundPercentage,
      }));

      await onboardingApi.saveCourtsConfig(token, {
        number_of_sports: distinctSports.length,
        sports: distinctSports,
        courts: payloadCourts,
        cancellation_window_hours: cancellationWindowHours,
        refund_percentage: refundPercentage,
      });
      setSelectedSports(distinctSports);
      setCurrentStep(6);
      if (maxCompletedStep < 6) setMaxCompletedStep(6);
      setSuccessMessage('Courts & pricing configured successfully!');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to save courts configuration.',
      );
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 6: SAVE BANK DETAILS WITH STRICT VALIDATION ---
  const handleSaveBankDetails = async () => {
    if (!token) return;

    if (!isValidName(accountHolderName)) {
      setErrorMessage('Account Holder Name must contain letters and spaces only (minimum 3 characters).');
      return;
    }
    if (!bankName.trim() || bankName.trim().length < 2) {
      setErrorMessage('Bank Name is required (letters and spaces only).');
      return;
    }
    if (!isValidAccountNumber(accountNumber)) {
      setErrorMessage('Account Number must be between 9 and 18 numeric digits.');
      return;
    }
    if (accountNumber !== confirmAccountNumber) {
      setErrorMessage('Account numbers do not match. Please re-check the entered digits.');
      return;
    }
    if (!isValidIFSC(ifscCode)) {
      setErrorMessage('IFSC Code must be a valid 11-character Indian Financial Code (e.g. HDFC0001234).');
      return;
    }
    if (!branchName.trim() || branchName.trim().length < 2) {
      setErrorMessage('Branch Name is required.');
      return;
    }
    if (!branchProofDocId) {
      setErrorMessage('Please upload the mandatory Cancelled Cheque / Bank Passbook document.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);
    try {
      await onboardingApi.saveBankDetails(token, {
        account_holder_name: accountHolderName.trim(),
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        confirm_account_number: confirmAccountNumber.trim(),
        branch_name: branchName.trim(),
        ifsc_code: ifscCode.trim().toUpperCase(),
        account_type: accountType,
        branch_proof_document_id: branchProofDocId,
      });
      setCurrentStep(7);
      if (maxCompletedStep < 7) setMaxCompletedStep(7);
      setSuccessMessage('Bank settlement details saved successfully!');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to save bank details.',
      );
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 7: SUBMIT APPLICATION ---
  const handleSubmitApplication = async () => {
    if (!token) return;
    if (!declarationAccepted) {
      setErrorMessage('Please accept the accuracy declaration before submitting.');
      return;
    }
    setErrorMessage(null);
    setLoading(true);
    try {
      const res = await onboardingApi.submitApplication(token, {
        declaration_accepted: true,
      });
      setApplicationStatus(res.status);
      setSuccessMessage('Application submitted successfully for review!');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to submit application.',
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStepRejectionAlert = (stepNumber: number) => {
    if (applicationStatus !== 'REJECTED') return null;
    const items = rejectionReasons.filter((r) => mapRejectionToStep(r) === stepNumber);
    if (items.length === 0) return null;

    return (
      <div className="rounded-2xl bg-rose-50 border border-rose-300 p-4 flex items-start gap-3.5 text-xs shadow-xs animate-in fade-in duration-200">
        <div className="h-8 w-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div className="space-y-1 flex-1 min-w-0">
          <h4 className="font-bold text-rose-900 uppercase tracking-wide text-xs">
            Reviewer Requested Corrections on this Step:
          </h4>
          {items.map((r, i) => (
            <div key={i} className="text-rose-800 leading-relaxed font-medium">
              <span className="font-mono text-rose-900 font-bold">[{r.field || r.section}]:</span> {r.reason}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 text-[#F94001] animate-spin" />
        <p className="text-xs font-bold text-[#021526] uppercase tracking-wider">
          Loading Onboarding Session...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#021526] pb-24">
      {/* ============================================================ */}
      {/* HEADER BAR                                                  */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-40 bg-[#021526] text-white border-b border-[#06243f] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <Image
                src="/brand/ibooksports-logo.svg"
                alt="iBookSports"
                width={36}
                height={36}
                priority
                className="h-9 w-9 object-contain shrink-0 transition-transform duration-300 group-hover:scale-105"
              />
              <div className="flex flex-col justify-center">
                <Image
                  src="/brand/light.svg"
                  alt="iBookSports"
                  width={151}
                  height={16}
                  priority
                  style={{ width: 'auto', height: 'auto' }}
                  className="h-4 w-auto object-contain object-left"
                />
                <span className="hidden sm:inline text-[10px] text-slate-400 font-medium tracking-wide mt-1">
                  Partner Onboarding Portal
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {applicationId && (
              <span className="text-xs font-mono text-slate-300 hidden md:inline-block">
                Ref: <strong className="text-white">{applicationId}</strong>
              </span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* MAIN TWO-COLUMN WIZARD LAYOUT                                */}
      {/* ============================================================ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ============================================================ */}
          {/* LEFT SIDEBAR: 7-STEP VERTICAL PROGRESSION                    */}
          {/* ============================================================ */}
          <aside className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 space-y-4">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
              {/* Header inside sidebar */}
              <div className="border-b border-[#E5E7EB] pb-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#F94001]">
                    REGISTRATION STEPS
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Step {currentStep} of 7
                  </span>
                </div>
                <h3 className="text-base font-black text-[#021526] font-display mt-1">
                  Partner Dossier
                </h3>
                {/* Visual Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div
                    className="bg-[#F94001] h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((currentStep / 7) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Vertical Steps Progression */}
              <nav className="space-y-1.5 relative">
                {STEPS.map((s, idx) => {
                  const isCurrent = currentStep === s.id;
                  const isDone = s.id < currentStep || maxCompletedStep > s.id;
                  const isRejected = rejectionReasons.some((r) => r.step === s.id);

                  return (
                    <div key={s.id} className="relative">
                      {/* Vertical line connecting steps */}
                      {idx < STEPS.length - 1 && (
                        <div
                          className={`absolute left-[19px] top-10 w-0.5 h-6 z-0 ${isDone ? 'bg-emerald-400' : 'bg-slate-200'
                            }`}
                        />
                      )}

                      <button
                        type="button"
                        onClick={() => setCurrentStep(s.id)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all relative z-10 cursor-pointer ${isCurrent
                            ? 'bg-[#F94001] text-white shadow-md shadow-[#F94001]/20 font-bold'
                            : isRejected
                              ? 'bg-rose-50 text-rose-900 border border-rose-200 hover:bg-rose-100'
                              : isDone
                                ? 'hover:bg-slate-50 text-[#021526]'
                                : 'hover:bg-slate-50 text-slate-500'
                          }`}
                      >
                        {/* Step Icon Badge */}
                        <span
                          className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-transform ${isCurrent
                              ? 'bg-white text-[#F94001] shadow-xs'
                              : isRejected
                                ? 'bg-rose-600 text-white shadow-xs'
                                : isDone
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                        >
                          {isDone ? (
                            <Check className="h-4 w-4 stroke-[3]" />
                          ) : isRejected ? (
                            <AlertCircle className="h-4 w-4" />
                          ) : (
                            <span className="font-mono">{s.id}</span>
                          )}
                        </span>

                        {/* Step Titles & Subtitle */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`text-xs truncate block ${isCurrent
                                  ? 'text-white font-bold'
                                  : 'text-[#021526] font-bold'
                                }`}
                            >
                              {s.title}
                            </span>
                            {isDone && !isCurrent && (
                              <span className="text-[10px] font-bold text-emerald-600">
                                Done
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[10px] truncate block font-normal ${isCurrent ? 'text-white/80' : 'text-[#5F6368]'
                              }`}
                          >
                            {s.desc}
                          </span>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </nav>

              {/* Help & Support Assistance */}
              <div className="mt-5 pt-4 border-t border-[#E5E7EB] text-[11px] text-[#5F6368] space-y-1">
                <p className="font-bold text-[#021526]">Need assistance?</p>
                <p>Support helpline:</p>
                <a
                  href="tel:+919876543210"
                  className="font-mono text-[#F94001] font-bold hover:underline block"
                >
                  +91 98765 43210
                </a>
              </div>
            </div>
          </aside>

          {/* ============================================================ */}
          {/* RIGHT COLUMN: MAIN FORM CANVAS                               */}
          {/* ============================================================ */}
          <main className="lg:col-span-8 xl:col-span-9 space-y-6">
            {/* REJECTION BANNER (IF APPLICABLE) */}
            {applicationStatus === 'REJECTED' && rejectionReasons.length > 0 && (
              <div className="rounded-2xl bg-rose-50 border border-rose-200 p-5 space-y-3 shadow-xs animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                  <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
                  <span>Application Requires Corrections</span>
                </div>
                <p className="text-xs text-rose-800">
                  The reviewer requested adjustments for the following item(s).
                  Click <strong>&quot;Fix Issue&quot;</strong> to jump directly to the field.
                </p>
                <div className="space-y-2.5 pt-1">
                  {rejectionReasons.map((r, i) => {
                    const targetStep = mapRejectionToStep(r);
                    const stepMeta = STEPS.find((s) => s.id === targetStep);
                    return (
                      <div
                        key={i}
                        className="rounded-2xl bg-white p-4 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs"
                      >
                        <div className="space-y-1">
                          <span className="font-bold text-[#021526]">
                            Step {targetStep}: {stepMeta?.title || r.section} &bull; Field:{' '}
                            <code className="font-mono text-[#F94001]">{r.field}</code>
                          </span>
                          <p className="text-[#5F6368] font-normal leading-relaxed">{r.reason}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(targetStep)}
                          className="px-4 py-2 rounded-xl bg-[#F94001] hover:bg-[#D93600] text-white font-bold text-xs transition-all shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <span>Fix Issue</span>
                          <span>&rarr;</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 1: PARTNER DETAILS (WITH STRICT TYPE & REQUIRED VALIDATION)*/}
            {/* ============================================================ */}
            {currentStep === 1 && (
              <div className="rounded-2xl bg-white p-6 sm:p-8 border border-[#E5E7EB] shadow-xs space-y-6">
                <div className="border-b border-[#E5E7EB] pb-4 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold font-mono text-[#F94001] uppercase tracking-wider">
                      Step 1 of 7 &bull; Personal & Identity Information
                    </span>
                    <h2 className="text-xl font-black text-[#021526] font-display mt-1">
                      Partner Profile & Identification
                    </h2>
                    <p className="text-xs text-[#5F6368] mt-1">
                      All fields marked with <span className="text-rose-500 font-black">*</span> are mandatory.
                    </p>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Identity Protected
                  </span>
                </div>

                {renderStepRejectionAlert(1)}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Legal Name */}
                  <div>
                    <label className="text-xs font-bold text-[#021526] block mb-1">
                      Full Legal Name <span className="text-rose-500 font-black">*</span>
                    </label>
                    <input
                      type="text"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value.replace(/[^a-zA-Z\s.]/g, ''))}
                      placeholder="e.g. Karthik Rajan"
                      className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-xs text-[#021526] focus:border-[#F94001] focus:outline-none"
                    />
                    {partnerName.length > 0 && !isValidName(partnerName) && (
                      <p className="text-[10px] text-amber-600 mt-1">Must be at least 3 letters (letters & spaces only)</p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="text-xs font-bold text-[#021526] block mb-1">
                      Email Address <span className="text-rose-500 font-black">*</span>
                    </label>
                    <input
                      type="email"
                      value={partnerEmail}
                      onChange={(e) => setPartnerEmail(e.target.value.trim().toLowerCase())}
                      placeholder="partner@arena.com"
                      className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-xs text-[#021526] focus:border-[#F94001] focus:outline-none"
                    />
                    {partnerEmail.length > 0 && !isValidEmail(partnerEmail) && (
                      <p className="text-[10px] text-amber-600 mt-1">Please enter a valid email format</p>
                    )}
                  </div>

                  {/* Verified Mobile Number */}
                  <div>
                    <label className="text-xs font-bold text-[#021526] block mb-1">
                      Verified Mobile Number <span className="text-rose-500 font-black">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        readOnly
                        tabIndex={-1}
                        value={mobileNumber ? `+91 ${mobileNumber.replace(/^\+91\s*/, '')}` : ''}
                        className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8F9FA] px-3.5 pr-10 py-2.5 text-xs font-mono font-bold tracking-wider text-[#021526] cursor-not-allowed select-none focus:outline-none"
                      />
                      <div className="absolute right-3.5 flex items-center text-emerald-600" title="Verified via Login OTP">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* Postal Pincode */}
                  <div>
                    <label className="text-xs font-bold text-[#021526] block mb-1">
                      Postal Pincode <span className="text-rose-500 font-black">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={partnerPincode}
                      onChange={(e) => setPartnerPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="641018"
                      className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-xs font-mono text-[#021526] focus:border-[#F94001] focus:outline-none"
                    />
                    {partnerPincode.length > 0 && !isValidPincode(partnerPincode) && (
                      <p className="text-[10px] text-amber-600 mt-1">Must be exactly 6 numeric digits ({partnerPincode.length}/6)</p>
                    )}
                  </div>

                  {/* Residential Address */}
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-[#021526] block mb-1">
                      Residential Address <span className="text-rose-500 font-black">*</span>
                    </label>
                    <input
                      type="text"
                      value={partnerAddress}
                      onChange={(e) => setPartnerAddress(e.target.value)}
                      placeholder="Door No, Street Name, Area"
                      className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-xs text-[#021526] focus:border-[#F94001] focus:outline-none"
                    />
                  </div>

                  {/* State */}
                  <div>
                    <label className="text-xs font-bold text-[#021526] block mb-1">
                      State <span className="text-rose-500 font-black">*</span>
                    </label>
                    <input
                      type="text"
                      value={partnerState}
                      onChange={(e) => setPartnerState(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                      placeholder="e.g. Tamil Nadu"
                      className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-xs text-[#021526] focus:border-[#F94001] focus:outline-none"
                    />
                  </div>

                  {/* District */}
                  <div>
                    <label className="text-xs font-bold text-[#021526] block mb-1">
                      District <span className="text-rose-500 font-black">*</span>
                    </label>
                    <input
                      type="text"
                      value={partnerDistrict}
                      onChange={(e) => setPartnerDistrict(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                      placeholder="e.g. Coimbatore"
                      className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-xs text-[#021526] focus:border-[#F94001] focus:outline-none"
                    />
                  </div>

                  {/* Aadhaar Upload Card: Mandatory */}
                  <div>
                    <label className="text-xs font-bold text-[#021526] block mb-1 flex items-center justify-between">
                      <span>Aadhaar Card Document <span className="text-rose-500 font-black">*</span></span>
                      <span className="text-[10px] font-mono text-[#5F6368] uppercase">PDF/JPG Max 5MB</span>
                    </label>
                    <input
                      type="file"
                      ref={aadhaarFileInputRef}
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) =>
                        handleFileUpload(
                          e,
                          'AADHAAR',
                          (id, name, previewUrl) => {
                            setAadhaarDocId(id);
                            setAadhaarFileName(name);
                            if (previewUrl) setAadhaarPreviewUrl(previewUrl);
                          },
                          setAadhaarUploading,
                        )
                      }
                      className="hidden"
                    />
                    {aadhaarUploading ? (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl border border-dashed border-[#F94001] bg-[#FFF1EC]/30 text-xs font-bold text-[#F94001]">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Uploading document...</span>
                      </div>
                    ) : aadhaarDocId ? (
                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-emerald-300 bg-emerald-50/50 shadow-xs">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {aadhaarPreviewUrl && !aadhaarFileName?.toLowerCase().endsWith('.pdf') ? (
                            <div className="h-8 w-8 rounded-lg overflow-hidden shrink-0 border border-emerald-300 bg-white">
                              <img
                                src={aadhaarPreviewUrl}
                                alt="Aadhaar"
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-mono text-xs font-bold text-[#021526] truncate">
                              {aadhaarFileName || aadhaarDocId}
                            </p>
                            <span className="text-[10px] text-emerald-700 font-medium">✓ Uploaded & Verified</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenDocumentPreview(
                                aadhaarPreviewUrl,
                                aadhaarFileName,
                                aadhaarDocId,
                                'AADHAAR',
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#CBD5E1] text-[11px] font-bold text-[#021526] hover:bg-[#F3F4F4] hover:text-[#F94001] transition-colors shadow-xs cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5 text-[#5F6368]" />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAadhaarDocId('');
                              setAadhaarFileName('');
                              setAadhaarPreviewUrl(null);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-rose-200 text-[11px] font-bold text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors shadow-xs"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2 p-2 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8F9FA]">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-[#5F6368] shrink-0" />
                          <span className="font-mono text-[11px] text-[#5F6368] truncate">
                            No Aadhaar document uploaded
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => aadhaarFileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-[#F94001] hover:bg-[#D93600] text-white text-[11px] font-bold transition-all shadow-xs shrink-0"
                        >
                          Upload Aadhaar
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Profile Photo Upload Card: Mandatory */}
                  <div>
                    <label className="text-xs font-bold text-[#021526] block mb-1 flex items-center justify-between">
                      <span>Profile Photo ID <span className="text-rose-500 font-black">*</span></span>
                      <span className="text-[10px] font-mono text-[#5F6368] uppercase">JPG/PNG Max 5MB</span>
                    </label>
                    <input
                      type="file"
                      ref={profilePhotoInputRef}
                      accept=".jpg,.jpeg,.png"
                      onChange={(e) =>
                        handleFileUpload(
                          e,
                          'PROFILE_PHOTO',
                          (id, name, previewUrl) => {
                            setProfilePhotoDocId(id);
                            setProfilePhotoFileName(name);
                            if (previewUrl) setProfilePhotoPreviewUrl(previewUrl);
                          },
                          setProfilePhotoUploading,
                        )
                      }
                      className="hidden"
                    />
                    {profilePhotoUploading ? (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl border border-dashed border-[#F94001] bg-[#FFF1EC]/30 text-xs font-bold text-[#F94001]">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Uploading photo...</span>
                      </div>
                    ) : profilePhotoDocId ? (
                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-emerald-300 bg-emerald-50/50 shadow-xs">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {profilePhotoPreviewUrl ? (
                            <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 border border-emerald-300 bg-white">
                              <img
                                src={profilePhotoPreviewUrl}
                                alt="Profile"
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <ImageIcon className="h-4 w-4 text-emerald-600 shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-mono text-xs font-bold text-[#021526] truncate">
                              {profilePhotoFileName || profilePhotoDocId}
                            </p>
                            <span className="text-[10px] text-emerald-700 font-medium">✓ Uploaded & Verified</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenDocumentPreview(
                                profilePhotoPreviewUrl,
                                profilePhotoFileName,
                                profilePhotoDocId,
                                'PROFILE_PHOTO',
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#CBD5E1] text-[11px] font-bold text-[#021526] hover:bg-[#F3F4F4] hover:text-[#F94001] transition-colors shadow-xs cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5 text-[#5F6368]" />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setProfilePhotoDocId('');
                              setProfilePhotoFileName('');
                              setProfilePhotoPreviewUrl(null);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-rose-200 text-[11px] font-bold text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors shadow-xs"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2 p-2 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8F9FA]">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <ImageIcon className="h-4 w-4 text-[#5F6368] shrink-0" />
                          <span className="font-mono text-[11px] text-[#5F6368] truncate">
                            No profile photo uploaded
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => profilePhotoInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-[#F94001] hover:bg-[#D93600] text-white text-[11px] font-bold transition-all shadow-xs shrink-0"
                        >
                          Upload Photo
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end pt-4 border-t border-[#E5E7EB]">
                  <button
                    type="button"
                    disabled={
                      loading ||
                      !isValidName(partnerName) ||
                      !isValidEmail(partnerEmail) ||
                      !isValidIndianMobile(mobileNumber) ||
                      !isValidPincode(partnerPincode) ||
                      !aadhaarDocId ||
                      !profilePhotoDocId
                    }
                    onClick={handleSavePartnerDetails}
                    className="px-6 py-2.5 rounded-xl bg-[#F94001] hover:bg-[#D93600] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>Save & Continue to Step 2 &rarr;</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 2: BUSINESS & VENUE DETAILS (WITH STRICT VALIDATION)    */}
            {/* ============================================================ */}
            {currentStep === 2 && (
              <div className="rounded-2xl bg-white p-6 sm:p-8 border border-[#E5E7EB] shadow-xs space-y-6">
                <div className="border-b border-[#E5E7EB] pb-4">
                  <span className="text-[11px] font-bold font-mono text-[#F94001] uppercase tracking-wider">
                    Step 2 of 7 &bull; Facility & Tax Information
                  </span>
                  <h2 className="text-xl font-black text-[#021526] font-display mt-1">
                    Venue & Business Details
                  </h2>
                </div>

                {renderStepRejectionAlert(2)}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Venue Name */}
                  <div>
                    <label className="text-xs font-bold text-[#021526] block mb-1">
                      Venue / Arena Name <span className="text-rose-500 font-black">*</span>
                    </label>
                    <input
                      type="text"
                      value={venueName}
                      onChange={(e) => setVenueName(e.target.value)}
                      placeholder="Sky Sports Arena"
                      className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-xs text-[#021526] focus:border-[#F94001] focus:outline-none"
                    />
                  </div>

                  {/* Venue Email */}
                  <div>
                    <label className="text-xs font-bold text-[#021526] block mb-1">
                      Official Venue Email <span className="text-rose-500 font-black">*</span>
                    </label>
                    <input
                      type="email"
                      value={venueEmail}
                      onChange={(e) => setVenueEmail(e.target.value.trim().toLowerCase())}
                      placeholder="contact@skysports.com"
                      className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-xs text-[#021526] focus:border-[#F94001] focus:outline-none"
                    />
                    {venueEmail.length > 0 && !isValidEmail(venueEmail) && (
                      <p className="text-[10px] text-amber-600 mt-1">Please enter a valid email format</p>
                    )}
                  </div>

                  {/* Contact Mobile */}
                  <div>
                    <label className="text-xs font-bold text-[#021526] block mb-1">
                      Contact Mobile Number <span className="text-rose-500 font-black">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        readOnly
                        tabIndex={-1}
                        value={venueMobile || mobileNumber ? `+91 ${(venueMobile || mobileNumber).replace(/^\+91\s*/, '')}` : ''}
                        className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8F9FA] px-3.5 pr-10 py-2.5 text-xs font-mono font-bold tracking-wider text-[#021526] cursor-not-allowed select-none focus:outline-none"
                      />
                      <div className="absolute right-3.5 flex items-center text-emerald-600" title="Verified via Login OTP">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* Google Maps Location Link */}
                  <div>
                    <label className="text-xs font-bold text-[#021526] block mb-1">
                      Google Maps Location Link <span className="text-rose-500 font-black">*</span>
                    </label>
                    <input
                      type="url"
                      value={venueGoogleMaps}
                      onChange={(e) => setVenueGoogleMaps(e.target.value.trim())}
                      placeholder="https://maps.app.goo.gl/..."
                      className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-xs text-[#021526] focus:border-[#F94001] focus:outline-none"
                    />
                    {venueGoogleMaps.length > 0 && !isValidGoogleMapsUrl(venueGoogleMaps) && (
                      <p className="text-[10px] text-amber-600 mt-1">Must be a valid Google Maps URL</p>
                    )}
                  </div>

                  {/* Full Venue Address */}
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-[#021526] block mb-1">
                      Full Venue Physical Address <span className="text-rose-500 font-black">*</span>
                    </label>
                    <input
                      type="text"
                      value={venueAddress}
                      onChange={(e) => setVenueAddress(e.target.value)}
                      placeholder="Full physical address of the sports arena"
                      className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-xs text-[#021526] focus:border-[#F94001] focus:outline-none"
                    />
                  </div>

                  {/* GST Section with Interactive Upload & Strict 15-char Regex */}
                  <div className="sm:col-span-2 pt-2 border-t border-[#E5E7EB]">
                    <label className="flex items-center gap-2 cursor-pointer mb-3">
                      <input
                        type="checkbox"
                        checked={hasGst}
                        onChange={(e) => setHasGst(e.target.checked)}
                        className="h-4 w-4 rounded text-[#F94001] focus:ring-[#F94001]"
                      />
                      <span className="text-xs font-bold text-[#021526]">
                        This business has a Registered GST Number (Optional)
                      </span>
                    </label>

                    {hasGst && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#F8F9FA] border border-[#CBD5E1]">
                        <div>
                          <label className="text-xs font-bold text-[#021526] block mb-1">
                            15-Character GSTIN <span className="text-rose-500 font-black">*</span>
                          </label>
                          <input
                            type="text"
                            maxLength={15}
                            value={gstNumber}
                            onChange={(e) => setGstNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15))}
                            placeholder="33ABCDE1234F1Z5"
                            className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-xs font-mono tracking-wider text-[#021526] focus:border-[#F94001] focus:outline-none"
                          />
                          {gstNumber.length > 0 && !isValidGSTIN(gstNumber) && (
                            <p className="text-[10px] text-amber-600 mt-1">Format: 15 alphanumeric characters (e.g. 33ABCDE1234F1Z5)</p>
                          )}
                        </div>

                        <div>
                          <label className="text-xs font-bold text-[#021526] block mb-1 flex items-center justify-between">
                            <span>GST Registration Certificate <span className="text-rose-500 font-black">*</span></span>
                            <span className="text-[10px] font-mono text-[#5F6368] uppercase">PDF/JPG Max 5MB</span>
                          </label>
                          <input
                            type="file"
                            ref={gstFileInputRef}
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) =>
                              handleFileUpload(
                                e,
                                'GST_CERTIFICATE',
                                (id, name, previewUrl) => {
                                  setGstDocId(id);
                                  setGstFileName(name);
                                  if (previewUrl) setGstPreviewUrl(previewUrl);
                                },
                                setGstUploading,
                              )
                            }
                            className="hidden"
                          />
                          {gstUploading ? (
                            <div className="flex items-center gap-2 p-2.5 rounded-xl border border-dashed border-[#F94001] bg-[#FFF1EC]/30 text-xs font-bold text-[#F94001]">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Uploading GST certificate...</span>
                            </div>
                          ) : gstDocId ? (
                            <div className="flex items-center justify-between gap-2 p-2 rounded-xl border border-emerald-300 bg-emerald-50/50 shadow-xs">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="font-mono text-xs font-bold text-[#021526] truncate">
                                    {gstFileName || gstDocId}
                                  </p>
                                  <span className="text-[10px] text-emerald-700 font-medium">✓ Uploaded & Verified</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenDocumentPreview(
                                      gstPreviewUrl,
                                      gstFileName,
                                      gstDocId,
                                      'GST',
                                    )
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#CBD5E1] text-[11px] font-bold text-[#021526] hover:bg-[#F3F4F4] hover:text-[#F94001] transition-colors shadow-xs cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5 text-[#5F6368]" />
                                  <span>View</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setGstDocId('');
                                    setGstFileName('');
                                    setGstPreviewUrl(null);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-rose-200 text-[11px] font-bold text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors shadow-xs"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2 p-2 rounded-xl border border-dashed border-[#CBD5E1] bg-white">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FileText className="h-4 w-4 text-[#5F6368] shrink-0" />
                                <span className="font-mono text-[11px] text-[#5F6368] truncate">
                                  No GST document uploaded
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => gstFileInputRef.current?.click()}
                                className="px-3 py-1.5 rounded-lg bg-[#F94001] hover:bg-[#D93600] text-white text-[11px] font-bold transition-all shadow-xs shrink-0 flex items-center gap-1"
                              >
                                <FileUp className="h-3.5 w-3.5" />
                                <span>Upload GST</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 rounded-xl border border-[#E5E7EB] text-xs font-bold text-[#5F6368] hover:bg-[#F3F4F4]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={
                      loading ||
                      !venueName.trim() ||
                      !isValidEmail(venueEmail) ||
                      !isValidIndianMobile((venueMobile || mobileNumber || '').replace(/^\+91\s*/, '').trim()) ||
                      !isValidGoogleMapsUrl(venueGoogleMaps) ||
                      (hasGst && (!isValidGSTIN(gstNumber) || !gstDocId))
                    }
                    onClick={handleSaveBusinessDetails}
                    className="px-6 py-2.5 rounded-xl bg-[#F94001] hover:bg-[#D93600] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    Save & Continue to Step 3 &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 3: COURT PHOTOS (DYNAMIC UPLOAD - NO DUMMY DEFAULTS)    */}
            {/* ============================================================ */}
            {currentStep === 3 && (
              <div className="rounded-2xl bg-white p-6 sm:p-8 border border-[#E5E7EB] shadow-xs space-y-6">
                <div className="border-b border-[#E5E7EB] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold font-mono text-[#F94001] uppercase tracking-wider">
                      Step 3 of 7 &bull; Facility Visual Gallery
                    </span>
                    <h2 className="text-xl font-black text-[#021526] font-display mt-1">
                      Court & Turf Photos (4 to 8 Images) <span className="text-rose-500 font-black">*</span>
                    </h2>
                    <p className="text-xs text-[#5F6368] mt-0.5">
                      Upload photos of turf playing surfaces, floodlights, seating, and parking.
                    </p>
                  </div>

                  {courtPhotoList.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${courtPhotoList.length >= 4
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                          }`}
                      >
                        {courtPhotoList.length >= 4
                          ? `✓ ${courtPhotoList.length} / 8 Photos Uploaded`
                          : `${courtPhotoList.length} / 4 Min Photos (${4 - courtPhotoList.length} more needed)`}
                      </span>
                    </div>
                  )}
                </div>

                {renderStepRejectionAlert(3)}

                <input
                  type="file"
                  ref={courtPhotoInputRef}
                  accept=".jpg,.jpeg,.png"
                  multiple
                  onChange={handleCourtPhotosUpload}
                  className="hidden"
                />

                {/* EMPTY STATE: WHEN NO PHOTOS HAVE BEEN UPLOADED */}
                {courtPhotoList.length === 0 ? (
                  <div
                    onClick={() => courtPhotoInputRef.current?.click()}
                    className="rounded-2xl border-2 border-dashed border-[#CBD5E1] hover:border-[#F94001] bg-[#F8F9FA] hover:bg-[#FFF1EC]/20 p-8 sm:p-12 text-center space-y-4 cursor-pointer transition-all shadow-xs"
                  >
                    <div className="h-16 w-16 rounded-2xl bg-white border border-[#CBD5E1] flex items-center justify-center mx-auto text-[#F94001] shadow-xs">
                      {courtPhotoUploading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-[#F94001]" />
                      ) : (
                        <Camera className="h-8 w-8 text-[#F94001]" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-black text-[#021526] font-display">
                        {courtPhotoUploading ? 'Uploading Photos...' : 'No Facility Photos Uploaded'}
                      </h3>
                      <p className="text-xs text-[#5F6368] max-w-md mx-auto">
                        Please upload a minimum of 4 photos (and up to 8) showing your turf playing surfaces, floodlights, seating, and parking.
                      </p>
                    </div>
                    <div>
                      <button
                        type="button"
                        disabled={courtPhotoUploading}
                        className="px-5 py-2.5 rounded-xl bg-[#F94001] hover:bg-[#D93600] text-white text-xs font-bold shadow-md transition-all inline-flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        <span>{courtPhotoUploading ? 'Uploading...' : 'Select Photos from Device'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-[#5F6368]">JPG, PNG &bull; Max 5MB each &bull; Select multiple files at once</p>
                  </div>
                ) : (
                  /* PHOTO GRID: WHEN USER HAS UPLOADED PHOTOS */
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                      {courtPhotoList.map((item, index) => (
                        <div
                          key={item.id || index}
                          className="rounded-2xl border border-[#CBD5E1] bg-white overflow-hidden text-center relative group hover:border-[#F94001] transition-all shadow-xs flex flex-col justify-between"
                        >
                          {/* REAL VIEWABLE PHOTO CONTAINER */}
                          <div className="relative h-28 sm:h-32 w-full bg-slate-100 overflow-hidden group/img">
                            {item.previewUrl ? (
                              <img
                                src={item.previewUrl}
                                alt={item.name || `Photo ${index + 1}`}
                                className="h-full w-full object-cover group-hover/img:scale-105 transition-transform duration-300 cursor-pointer"
                                onClick={() =>
                                  setPreviewModalImage({
                                    url: item.previewUrl!,
                                    title: item.name || `Court Photo #${index + 1}`,
                                  })
                                }
                              />
                            ) : (
                              <div className="h-full w-full bg-slate-100 flex flex-col items-center justify-center text-slate-500">
                                <Camera className="h-7 w-7 text-slate-400 mb-1" />
                                <span className="text-[10px] font-mono font-bold text-slate-600">Photo #{index + 1}</span>
                              </div>
                            )}
                            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shadow-xs">
                              Photo #{index + 1}
                            </div>
                          </div>

                          {/* PHOTO METADATA & ACTIONS */}
                          <div className="p-3 bg-white space-y-1.5 border-t border-slate-100">
                            <span
                              className="text-xs font-semibold text-[#021526] block truncate text-left"
                              title={item.name || item.id}
                            >
                              {item.name || item.id}
                            </span>

                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[9px] font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                ✓ Ready
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setCourtPhotoList((prev) => prev.filter((_, i) => i !== index))
                                }
                                className="text-rose-600 hover:text-rose-800 text-xs font-bold inline-flex items-center gap-1 hover:underline"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {courtPhotoList.length < 8 && (
                        <button
                          type="button"
                          disabled={courtPhotoUploading}
                          onClick={() => courtPhotoInputRef.current?.click()}
                          className="h-full min-h-[110px] rounded-xl border-2 border-dashed border-[#CBD5E1] hover:border-[#F94001] bg-white flex flex-col items-center justify-center text-xs font-bold text-[#5F6368] hover:text-[#F94001] transition-all p-3 shadow-xs hover:bg-[#FFF1EC]/30"
                        >
                          {courtPhotoUploading ? (
                            <Loader2 className="h-5 w-5 mb-1 animate-spin text-[#F94001]" />
                          ) : (
                            <Plus className="h-5 w-5 mb-1 text-[#F94001]" />
                          )}
                          <span>{courtPhotoUploading ? 'Uploading...' : 'Add More Photos'}</span>
                          <span className="text-[10px] font-normal text-[#5F6368] mt-0.5">JPG, PNG (Max 5MB)</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2 rounded-xl border border-[#E5E7EB] text-xs font-bold text-[#5F6368] hover:bg-[#F3F4F4]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={loading || courtPhotoList.length < 4}
                    onClick={handleSaveCourtPhotos}
                    className="px-6 py-2.5 rounded-xl bg-[#F94001] hover:bg-[#D93600] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {courtPhotoList.length < 4
                      ? `Upload ${4 - courtPhotoList.length} More Photo(s) to Continue`
                      : 'Save & Continue to Step 4 \u2192'}
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 4: OPERATING HOURS (DAY-WISE SCHEDULE MATCHING SPEC)    */}
            {/* ============================================================ */}
            {currentStep === 4 && (
              <div className="rounded-2xl bg-white p-6 sm:p-8 border border-[#E5E7EB] shadow-xs space-y-6">
                <div className="border-b border-[#E5E7EB] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold font-mono text-[#F94001] uppercase tracking-wider">
                      Step 4 of 7 &bull; Schedule & Availability
                    </span>
                    <h2 className="text-xl font-black text-[#021526] font-display mt-1">
                      Operating Days & Timings <span className="text-rose-500 font-black">*</span>
                    </h2>
                    <p className="text-xs text-[#5F6368] mt-0.5">
                      Set daily operating hours or mark non-operational days as Closed.
                    </p>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyMondayHoursToAll}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-[#F8F9FA] hover:bg-[#FFF1EC] text-xs font-bold text-[#021526] hover:text-[#F94001] transition-all shadow-xs"
                      title="Copy Monday operating hours to all open days"
                    >
                      <Copy className="h-3.5 w-3.5 text-[#F94001]" />
                      <span>Copy Mon to All</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenAllDays}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors"
                    >
                      Open All Days
                    </button>
                    <button
                      type="button"
                      onClick={handleWeekdaysOnly}
                      className="px-2.5 py-1.5 rounded-lg bg-[#F3F4F4] border border-[#E5E7EB] text-[#5F6368] text-xs font-bold hover:bg-[#E5E7EB] transition-colors"
                    >
                      Weekdays Only
                    </button>
                  </div>
                </div>

                {renderStepRejectionAlert(4)}

                {/* Split Schedule Editor & Live Visual Table */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left: Interactive Day-by-Day Controls */}
                  <div className="lg:col-span-7 space-y-2.5">
                    {dailySchedules.map((schedule, idx) => (
                      <div
                        key={schedule.day}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${schedule.isOpen
                            ? 'bg-white border-[#CBD5E1] shadow-xs'
                            : 'bg-[#F8F9FA] border-[#E5E7EB] opacity-75'
                          }`}
                      >
                        {/* Day Name & Toggle */}
                        <div className="flex items-center gap-3 w-32 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setDailySchedules((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, isOpen: !item.isOpen } : item,
                                ),
                              )
                            }
                            className={`h-6 w-11 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${schedule.isOpen ? 'bg-[#F94001]' : 'bg-[#CBD5E1]'
                              }`}
                          >
                            <div
                              className={`h-5 w-5 rounded-full bg-white shadow-xs transform transition-transform ${schedule.isOpen ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                          </button>
                          <span className={`text-sm font-bold ${schedule.isOpen ? 'text-[#021526]' : 'text-[#5F6368]'}`}>
                            {schedule.label}
                          </span>
                        </div>

                        {/* Time Dropdowns or Closed Badge */}
                        <div className="flex items-center gap-2 flex-1 justify-end">
                          {schedule.isOpen ? (
                            <>
                              <select
                                value={schedule.openTime}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDailySchedules((prev) =>
                                    prev.map((item, i) =>
                                      i === idx ? { ...item, openTime: val } : item,
                                    ),
                                  );
                                }}
                                className="rounded-lg border border-[#CBD5E1] bg-white px-2.5 py-1.5 text-xs font-mono font-medium text-[#021526] focus:border-[#F94001] focus:outline-none"
                              >
                                {TIME_OPTIONS.map((time) => (
                                  <option key={time} value={time}>
                                    {time}
                                  </option>
                                ))}
                              </select>
                              <span className="text-xs text-[#5F6368] font-bold">&ndash;</span>
                              <select
                                value={schedule.closeTime}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDailySchedules((prev) =>
                                    prev.map((item, i) =>
                                      i === idx ? { ...item, closeTime: val } : item,
                                    ),
                                  );
                                }}
                                className="rounded-lg border border-[#CBD5E1] bg-white px-2.5 py-1.5 text-xs font-mono font-medium text-[#021526] focus:border-[#F94001] focus:outline-none"
                              >
                                {TIME_OPTIONS.map((time) => (
                                  <option key={time} value={time}>
                                    {time}
                                  </option>
                                ))}
                              </select>
                            </>
                          ) : (
                            <span className="px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-500 font-bold text-xs">
                              Closed
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Right: Live Google Business Hours Preview (Matching Reference Image) */}
                  <div className="lg:col-span-5 space-y-3">
                    <div className="p-5 rounded-2xl bg-[#021526] text-white border border-white/10 shadow-lg space-y-4">
                      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                        <CalendarDays className="h-4 w-4 text-[#F94001]" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Weekly Schedule Display
                        </span>
                      </div>

                      {/* Clean Typography Table Matching Reference */}
                      <div className="space-y-2.5 text-sm font-sans">
                        {dailySchedules.map((item) => (
                          <div
                            key={item.day}
                            className="flex items-center justify-between py-0.5 text-xs font-medium"
                          >
                            <span className="font-bold text-white w-24">
                              {item.label}
                            </span>
                            {item.isOpen ? (
                              <span className="font-mono text-slate-200">
                                {item.openTime.toLowerCase().replace(' ', '')}&ndash;{item.closeTime.toLowerCase().replace(' ', '')}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-semibold">
                                Closed
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 border-t border-white/10 text-[11px] text-slate-400">
                        <span>
                          {dailySchedules.filter((d) => d.isOpen).length} Active Operational Days Configured
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-4 py-2 rounded-xl border border-[#E5E7EB] text-xs font-bold text-[#5F6368] hover:bg-[#F3F4F4]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={loading || dailySchedules.filter((d) => d.isOpen).length === 0}
                    onClick={handleSaveOperatingHours}
                    className="px-6 py-2.5 rounded-xl bg-[#F94001] hover:bg-[#D93600] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    Save & Continue to Step 5 &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 5: SPORTS & COURTS CONFIGURATION                        */}
            {/* ============================================================ */}
            {/* ============================================================ */}
            {/* STEP 5: SPORTS & COURTS CONFIGURATION (PART 6 SPEC)          */}
            {/* ============================================================ */}
            {currentStep === 5 && (
              <div className="rounded-2xl bg-white p-6 sm:p-8 border border-[#E5E7EB] shadow-xs space-y-6">
                <div className="border-b border-[#E5E7EB] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold font-mono text-[#F94001] uppercase tracking-wider">
                      Step 5 of 7 &bull; Inventory &amp; Pricing Configuration
                    </span>
                    <h2 className="text-xl font-black text-[#021526] font-display mt-1">
                      Sports &amp; Court Details
                    </h2>
                    <p className="text-xs text-[#5F6368] mt-0.5">
                      Configure sports supported, physical court inventory, and standard vs peak/weekend pricing.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-[#021526]">
                      {Array.from(new Set(courts.flatMap((c) => c.sports))).filter(Boolean).length} Sport(s) &bull; {courts.length} Court(s)
                    </span>
                  </div>
                </div>

                {renderStepRejectionAlert(5)}

                {/* Court Configuration List */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#021526] font-display">
                        Physical Court Inventory ({courts.length})
                      </h3>
                      <p className="text-[11px] text-[#5F6368]">
                        Save each court's details first. You can edit any court or add more courts once saved.
                      </p>
                    </div>
                  </div>

                  {courts.map((court, index) => {
                    const isEditing = editingCourtIndex === index;

                    // =========================================================================
                    // 1. SAVED / COLLAPSED VIEW (SHOWS SUMMARY WITH EDIT BUTTON)
                    // =========================================================================
                    if (!isEditing) {
                      return (
                        <div
                          key={index}
                          className="rounded-2xl border-2 border-emerald-300 bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-400 transition-all"
                        >
                          <div className="space-y-2 min-w-0 flex-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <div className="h-7 w-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs font-mono">
                                {index + 1}
                              </div>
                              <div>
                                <span className="text-sm font-bold text-[#021526] uppercase tracking-wide mr-2">
                                  {court.court_name}
                                </span>
                                <span className="text-xs text-[#5F6368]">
                                  &bull; {court.display_name}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                                ✓ Saved &amp; Configured
                              </span>
                            </div>

                            {/* Sports & Pricing Summary Pills */}
                            <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                              <div className="flex items-center gap-1">
                                {court.sports.map((sp) => (
                                  <span
                                    key={sp}
                                    className="px-2 py-0.5 rounded-md bg-[#021526] text-white text-[10px] font-bold"
                                  >
                                    {sp}
                                  </span>
                                ))}
                              </div>
                              <span className="text-slate-300">|</span>
                              <span className="text-[11px] font-medium text-[#021526]">
                                <strong>₹{court.regular_price}</strong>/hr Regular
                              </span>
                              <span className="text-slate-300">&bull;</span>
                              <span className="text-[11px] font-medium text-amber-700">
                                <strong>₹{court.peak_hour_price}</strong>/hr Peak
                              </span>
                              <span className="text-slate-300">&bull;</span>
                              <span className="text-[11px] font-medium text-emerald-700">
                                <strong>₹{court.advance_booking_price}</strong> Deposit
                              </span>
                            </div>
                          </div>

                          {/* Actions: EDIT & DELETE */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setEditingCourtIndex(index)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#CBD5E1] bg-[#F8F9FA] hover:bg-[#FFF1EC] hover:border-[#F94001] text-xs font-bold text-[#021526] hover:text-[#F94001] transition-all shadow-xs cursor-pointer active:scale-95"
                              title="Edit Court Configuration"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>

                            {courts.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCourts((prev) => prev.filter((_, i) => i !== index));
                                  if (editingCourtIndex === index) {
                                    setEditingCourtIndex(null);
                                  } else if (editingCourtIndex !== null && editingCourtIndex > index) {
                                    setEditingCourtIndex(editingCourtIndex - 1);
                                  }
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all shadow-xs cursor-pointer"
                                title="Delete Court"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // =========================================================================
                    // 2. EDITING / ENTRY FORM CARD
                    // =========================================================================
                    return (
                      <div
                        key={index}
                        className="rounded-2xl border-2 border-[#F94001] bg-[#F8F9FA] p-5 sm:p-6 space-y-5 shadow-sm transition-all"
                      >
                        {/* Court Card Header */}
                        <div className="flex items-center justify-between border-b border-[#CBD5E1] pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-lg bg-[#F94001] text-white flex items-center justify-center font-bold text-xs font-mono">
                              {index + 1}
                            </div>
                            <div>
                              <span className="text-xs font-bold text-[#021526] uppercase tracking-wide">
                                {court.court_name || `Court #${index + 1}`} (Editing)
                              </span>
                              <span className="text-[10px] text-[#5F6368] block">
                                {court.display_name || 'Enter court sport, names and pricing details'}
                              </span>
                            </div>
                          </div>

                          {courts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setCourts((prev) => prev.filter((_, i) => i !== index));
                                setEditingCourtIndex(null);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete Court</span>
                            </button>
                          )}
                        </div>

                        {/* Physical Court Sharing Question (Only for Court 2 and beyond) */}
                        {index > 0 && (
                          <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                              <div>
                                <p className="text-xs font-bold text-[#021526]">
                                  Do you want to use the same physical court/ground for another sport?
                                </p>
                                <p className="text-[11px] text-[#5F6368]">
                                  Select <strong>Yes</strong> if this sport shares the exact same turf pitch with an existing court (e.g., Turf 1 Cricket &amp; Football sharing the same physical ground).
                                </p>
                              </div>

                              <div className="inline-flex rounded-xl bg-white p-1 border border-[#CBD5E1] shadow-2xs shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCourts((prev) =>
                                      prev.map((item, i) =>
                                        i === index
                                          ? {
                                              ...item,
                                              use_one_physical_court_for_two_sports: true,
                                              shared_with_court_index: item.shared_with_court_index ?? 0,
                                            }
                                          : item,
                                      ),
                                    );
                                  }}
                                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                    court.use_one_physical_court_for_two_sports
                                      ? 'bg-[#F94001] text-white shadow-xs'
                                      : 'text-[#5F6368] hover:text-[#021526]'
                                  }`}
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCourts((prev) =>
                                      prev.map((item, i) =>
                                        i === index
                                          ? {
                                              ...item,
                                              use_one_physical_court_for_two_sports: false,
                                              shared_with_court_index: undefined,
                                            }
                                          : item,
                                      ),
                                    );
                                  }}
                                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                    !court.use_one_physical_court_for_two_sports
                                      ? 'bg-[#021526] text-white shadow-xs'
                                      : 'text-[#5F6368] hover:text-[#021526]'
                                  }`}
                                >
                                  No
                                </button>
                              </div>
                            </div>

                            {court.use_one_physical_court_for_two_sports && (
                              <div className="pt-2.5 border-t border-indigo-100 space-y-2">
                                <label className="text-[11px] font-bold text-[#021526] block">
                                  Select which physical court this shares space with:
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {courts.slice(0, index).map((upperCourt, uIndex) => {
                                    const isSelectedParent = (court.shared_with_court_index ?? 0) === uIndex;
                                    return (
                                      <button
                                        key={uIndex}
                                        type="button"
                                        onClick={() => {
                                          setCourts((prev) =>
                                            prev.map((item, i) =>
                                              i === index
                                                ? {
                                                    ...item,
                                                    shared_with_court_index: uIndex,
                                                  }
                                                : item,
                                            ),
                                          );
                                        }}
                                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                          isSelectedParent
                                            ? 'border-[#F94001] bg-[#FFF1EC]'
                                            : 'border-[#CBD5E1] bg-white hover:border-slate-400'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-bold text-[#021526]">
                                            {upperCourt.court_name || `Court #${uIndex + 1}`}
                                          </span>
                                          <span className="px-2 py-0.5 rounded bg-[#021526] text-white text-[10px] font-bold">
                                            {upperCourt.sports[0]}
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-[#5F6368] truncate mt-0.5">
                                          {upperCourt.display_name || 'Physical Court Ground'}
                                        </p>
                                      </button>
                                    );
                                  })}
                                </div>
                                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
                                  <Trophy className="h-4 w-4 text-amber-600 shrink-0" />
                                  <span>
                                    <strong>Anti-Double Booking Active:</strong> This court shares physical space with <strong>{courts[court.shared_with_court_index ?? 0]?.court_name || 'Court 1'}</strong> ({courts[court.shared_with_court_index ?? 0]?.sports[0] || 'Sport'}). Booking one automatically blocks the other during that time slot.
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 1. FIRST: Sport Selection for this Court (1 Court = 1 Sport) */}
                        <div className="rounded-xl border border-[#CBD5E1] bg-white p-4 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[#021526] block">
                              Select Sport for this Court <span className="text-rose-500 font-black">*</span>
                            </label>
                            <span className="text-[11px] font-medium text-[#5F6368]">
                              1 Court = 1 Sport
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {AVAILABLE_SPORTS.map((sport) => {
                              const isSelected = court.sports && court.sports.length > 0 && court.sports[0] === sport;
                              return (
                                <button
                                  key={sport}
                                  type="button"
                                  onClick={() => {
                                    setCourts((prev) =>
                                      prev.map((item, i) =>
                                        i === index
                                          ? {
                                              ...item,
                                              sports: [sport],
                                              is_same_sport_as_above: false,
                                            }
                                          : item,
                                      ),
                                    );
                                  }}
                                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                    isSelected
                                      ? 'bg-[#F94001] text-white shadow-xs'
                                      : 'bg-slate-50 text-[#5F6368] border border-[#CBD5E1] hover:border-slate-400'
                                  }`}
                                >
                                  {isSelected && <Check className="h-3.5 w-3.5" />}
                                  <span>{sport}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. SECOND: Court Identifier Name & Customer Display Name */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold text-[#021526] block mb-1">
                              Court Identifier Name <span className="text-rose-500 font-black">*</span>
                            </label>
                            <input
                              type="text"
                              value={court.court_name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCourts((prev) =>
                                  prev.map((item, i) =>
                                    i === index ? { ...item, court_name: val } : item,
                                  ),
                                );
                              }}
                              placeholder="e.g. Turf 1"
                              className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-xs text-[#021526] focus:border-[#F94001] focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-[#021526] block mb-1">
                              Customer Display Name <span className="text-rose-500 font-black">*</span>
                            </label>
                            <input
                              type="text"
                              value={court.display_name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCourts((prev) =>
                                  prev.map((item, i) =>
                                    i === index ? { ...item, display_name: val } : item,
                                  ),
                                );
                              }}
                              placeholder="e.g. Premium 7v7 Football Turf"
                              className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-xs text-[#021526] focus:border-[#F94001] focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Pricing Matrix & Time Parameters */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Minimum Booking Duration */}
                          <div>
                            <label className="text-xs font-bold text-[#021526] block mb-1">
                              Minimum Booking Duration <span className="text-rose-500 font-black">*</span>
                            </label>
                            <select
                              value={court.minimum_booking_time_minutes}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setCourts((prev) =>
                                  prev.map((item, i) =>
                                    i === index ? { ...item, minimum_booking_time_minutes: val } : item,
                                  ),
                                );
                              }}
                              className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-xs text-[#021526] focus:border-[#F94001] focus:outline-none"
                            >
                              <option value={30}>30 Minutes</option>
                              <option value={60}>60 Minutes (1 Hour)</option>
                              <option value={90}>90 Minutes (1.5 Hours)</option>
                              <option value={120}>120 Minutes (2 Hours)</option>
                            </select>
                          </div>

                          {/* Regular Price */}
                          <div>
                            <label className="text-xs font-bold text-[#021526] block mb-1">
                              Regular Price (₹/Hour) <span className="text-rose-500 font-black">*</span>
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={court.regular_price || ''}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setCourts((prev) =>
                                  prev.map((item, i) =>
                                    i === index ? { ...item, regular_price: val } : item,
                                  ),
                                );
                              }}
                              placeholder="e.g. 1200"
                              className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-xs text-[#021526] focus:border-[#F94001] focus:outline-none"
                            />
                          </div>

                          {/* Peak Hour Price */}
                          <div>
                            <label className="text-xs font-bold text-[#021526] block mb-1">
                              Peak Hour Price (₹/Hour) <span className="text-rose-500 font-black">*</span>
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={court.peak_hour_price || ''}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setCourts((prev) =>
                                  prev.map((item, i) =>
                                    i === index ? { ...item, peak_hour_price: val } : item,
                                  ),
                                );
                              }}
                              placeholder="e.g. 1600"
                              className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-xs text-[#021526] focus:border-[#F94001] focus:outline-none"
                            />
                          </div>

                          {/* Weekend Price */}
                          <div>
                            <label className="text-xs font-bold text-[#021526] block mb-1">
                              Weekend Price (₹/Hour) <span className="text-rose-500 font-black">*</span>
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={court.weekend_price || ''}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setCourts((prev) =>
                                  prev.map((item, i) =>
                                    i === index ? { ...item, weekend_price: val } : item,
                                  ),
                                );
                              }}
                              placeholder="e.g. 1500"
                              className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-xs text-[#021526] focus:border-[#F94001] focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Advance Booking Deposit & Peak Hours Window */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Advance Booking Deposit */}
                          <div>
                            <label className="text-xs font-bold text-[#021526] block mb-1">
                              Advance Booking Deposit (₹) <span className="text-rose-500 font-black">*</span>
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={court.advance_booking_price || ''}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setCourts((prev) =>
                                  prev.map((item, i) =>
                                    i === index ? { ...item, advance_booking_price: val } : item,
                                  ),
                                );
                              }}
                              placeholder="e.g. 500"
                              className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-xs text-[#021526] focus:border-[#F94001] focus:outline-none"
                            />
                          </div>

                          {/* Peak Hours Time Window */}
                          <div>
                            <label className="text-xs font-bold text-[#021526] block mb-1 flex items-center justify-between">
                              <span>Peak Hours Time Window <span className="text-rose-500 font-black">*</span></span>
                              <span className="text-[10px] font-mono text-[#5F6368] uppercase">Start &amp; End</span>
                            </label>
                            <div className="flex items-center gap-2">
                              <select
                                value={court.peak_hours[0]?.start_time || '06:00 PM'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCourts((prev) =>
                                    prev.map((item, i) =>
                                      i === index
                                        ? {
                                          ...item,
                                          peak_hours: [
                                            {
                                              start_time: val,
                                              end_time: item.peak_hours[0]?.end_time || '10:00 PM',
                                            },
                                          ],
                                        }
                                        : item,
                                    ),
                                  );
                                }}
                                className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3 py-2 text-xs font-mono text-[#021526] focus:border-[#F94001] focus:outline-none"
                              >
                                {TIME_OPTIONS.map((t) => (
                                  <option key={`start-${t}`} value={t}>{t}</option>
                                ))}
                              </select>
                              <span className="text-xs text-[#5F6368] font-bold">to</span>
                              <select
                                value={court.peak_hours[0]?.end_time || '10:00 PM'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCourts((prev) =>
                                    prev.map((item, i) =>
                                      i === index
                                        ? {
                                          ...item,
                                          peak_hours: [
                                            {
                                              start_time: item.peak_hours[0]?.start_time || '06:00 PM',
                                              end_time: val,
                                            },
                                          ],
                                        }
                                        : item,
                                    ),
                                  );
                                }}
                                className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3 py-2 text-xs font-mono text-[#021526] focus:border-[#F94001] focus:outline-none"
                              >
                                {TIME_OPTIONS.map((t) => (
                                  <option key={`end-${t}`} value={t}>{t}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Peak Days Multi-Select */}
                        <div>
                          <label className="text-xs font-bold text-[#021526] block mb-1.5 flex items-center justify-between">
                            <span>Peak Pricing Days <span className="text-rose-500 font-black">*</span></span>
                            <span className="text-[10px] font-mono text-[#5F6368] uppercase">Select Peak Days</span>
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {DAYS_ORDER.map(({ day, label }) => {
                              const isPeak = (court.peak_days || []).includes(day);
                              return (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => {
                                    setCourts((prev) =>
                                      prev.map((item, i) => {
                                        if (i !== index) return item;
                                        const currentDays = item.peak_days || [];
                                        const updated = isPeak
                                          ? currentDays.filter((d) => d !== day)
                                          : [...currentDays, day];
                                        return { ...item, peak_days: updated };
                                      }),
                                    );
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${isPeak
                                      ? 'bg-amber-600 text-white shadow-xs'
                                      : 'bg-white border border-[#CBD5E1] text-[#5F6368] hover:border-slate-400'
                                    }`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* ========================================================================= */}
                        {/* FREE CANCELLATION WINDOW & REFUND PAYOUT PERCENTAGE (FORM BASE STYLED)     */}
                        {/* ========================================================================= */}
                        {/* Free Cancellation Window */}
                        <div>
                          <label className="text-xs font-bold text-[#021526] block mb-1 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-[#F94001]" />
                              <span>Free Cancellation Window <span className="text-rose-500 font-black">*</span></span>
                            </span>
                            <span className="text-[10px] font-mono text-[#5F6368] uppercase">Notice Buffer Before Kickoff</span>
                          </label>
                          <p className="text-[11px] text-[#5F6368] mb-2">Minimum notice required for full or partial refund</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[2, 4, 12, 24].map((hours) => {
                              const currentVal = court.cancellation_window_hours ?? cancellationWindowHours;
                              const isSelected = currentVal === hours;
                              return (
                                <button
                                  key={hours}
                                  type="button"
                                  onClick={() => {
                                    setCancellationWindowHours(hours);
                                    setCourts((prev) =>
                                      prev.map((item, i) =>
                                        i === index ? { ...item, cancellation_window_hours: hours } : item,
                                      ),
                                    );
                                  }}
                                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${isSelected
                                      ? 'bg-[#021526] text-white shadow-xs'
                                      : 'bg-white border border-[#CBD5E1] text-[#5F6368] hover:border-slate-400'
                                    }`}
                                >
                                  {hours} Hours
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Refund Payout Percentage */}
                        <div>
                          <label className="text-xs font-bold text-[#021526] block mb-1 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Percent className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Refund Payout Percentage <span className="text-rose-500 font-black">*</span></span>
                            </span>
                            <span className="text-[10px] font-mono text-[#5F6368] uppercase">Eligible Refund Value</span>
                          </label>
                          <p className="text-[11px] text-[#5F6368] mb-2">Amount returned to customer source account</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[50, 75, 90, 100].map((pct) => {
                              const currentVal = court.refund_percentage ?? refundPercentage;
                              const isSelected = currentVal === pct;
                              return (
                                <button
                                  key={pct}
                                  type="button"
                                  onClick={() => {
                                    setRefundPercentage(pct);
                                    setCourts((prev) =>
                                      prev.map((item, i) =>
                                        i === index ? { ...item, refund_percentage: pct } : item,
                                      ),
                                    );
                                  }}
                                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${isSelected
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-white border border-[#CBD5E1] text-[#5F6368] hover:border-slate-400'
                                    }`}
                                >
                                  {pct}%
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Customer Cancellation Rule summary banner */}
                        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900">
                          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span className="text-[11px]">
                            <strong className="font-bold text-emerald-950">Customer Cancellation Rule:</strong> Free cancellation permitted up to{' '}
                            <strong>{court.cancellation_window_hours ?? cancellationWindowHours} Hours</strong> before kickoff with{' '}
                            <strong>{court.refund_percentage ?? refundPercentage}%</strong> refund.
                          </span>
                        </div>

                        {/* Save Single Court Button */}
                        <div className="flex items-center justify-between pt-4 border-t border-[#CBD5E1]">
                          {courts.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => {
                                setCourts((prev) => prev.filter((_, i) => i !== index));
                                setEditingCourtIndex(null);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all shadow-xs cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete Court</span>
                            </button>
                          ) : (
                            <div />
                          )}

                          <button
                            type="button"
                            onClick={() => handleSaveSingleCourt(index)}
                            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#021526] hover:bg-[#1a2d42] text-white text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95"
                          >
                            <Check className="h-4 w-4 text-emerald-400" />
                            <span>Save Court #{index + 1}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Another Court Button (Bottom Helper) */}
                  {editingCourtIndex === null && (
                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={handleAddNewCourt}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-dashed border-[#CBD5E1] hover:border-[#F94001] bg-white hover:bg-[#FFF1EC]/30 text-xs font-bold text-[#021526] hover:text-[#F94001] transition-all cursor-pointer shadow-xs"
                      >
                        <Plus className="h-4 w-4 text-[#F94001]" />
                        <span> Add Another Physical Court</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="px-4 py-2 rounded-xl border border-[#E5E7EB] text-xs font-bold text-[#5F6368] hover:bg-[#F3F4F4] cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={loading || courts.length === 0 || selectedSports.length === 0}
                    onClick={handleSaveCourts}
                    className="px-6 py-2.5 rounded-xl bg-[#F94001] hover:bg-[#D93600] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    Save &amp; Continue to Step 6 &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 6: BANK ACCOUNT (PROFESSIONAL & CLEAN) */}
            {/* ============================================================ */}
            {currentStep === 6 && (
              <div className="rounded-2xl bg-white p-6 sm:p-8 border border-[#E5E7EB] shadow-xs space-y-6">
                <div className="border-b border-[#E5E7EB] pb-4">
                  <span className="text-[11px] font-bold font-mono text-[#F94001] uppercase tracking-wider">
                    Step 6 of 7 &bull; Financial Settlements
                  </span>
                  <h2 className="text-xl font-black text-[#021526] font-display mt-1">
                    Bank account
                  </h2>
                  <p className="text-xs text-[#5F6368] mt-0.5">
                    Official bank account for automated slot booking settlements and payouts.
                  </p>
                </div>

                {renderStepRejectionAlert(6)}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Account Holder Name: Strictly Alphabets */}
                  <div>
                    <label className="text-xs font-bold text-[#021526] block mb-1">
                      Account Holder Name <span className="text-rose-500 font-black">*</span>
                    </label>
                    <input
                      type="text"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value.replace(/[^a-zA-Z\s.]/g, ''))}
                      placeholder="e.g. Sky Sports Private Limited"
                      className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-xs text-[#021526] focus:border-[#F94001] focus:outline-none"
                    />
                    {accountHolderName.length > 0 && !isValidName(accountHolderName) && (
                      <p className="text-[10px] text-amber-600 mt-1">Letters and spaces only (min 3 characters)</p>
                    )}
                  </div>

                  {/* Bank Name: Strictly Alphabets */}
                  <div>
                    <label className="text-xs font-bold text-[#021526] block mb-1">
                      Bank Name <span className="text-rose-500 font-black">*</span>
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value.replace(/[^a-zA-Z\s.&]/g, ''))}
                      placeholder="e.g. HDFC Bank"
                      className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-xs text-[#021526] focus:border-[#F94001] focus:outline-none"
                    />
                  </div>

                  {/* Account Number: Strictly Digits (9-18) with Password Masking & Clean Centered Eye Toggle INSIDE */}
                  <div>
                    <label className="text-xs font-bold text-[#021526] block mb-1">
                      Account Number <span className="text-rose-500 font-black">*</span>
                    </label>
                    <div className="flex items-center rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 transition-colors focus-within:border-[#F94001]">
                      <input
                        type={showAccountNumber ? 'text' : 'password'}
                        maxLength={18}
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 18))}
                        placeholder="Enter bank account number"
                        className="w-full bg-transparent text-xs font-mono text-[#021526] focus:outline-none border-0 p-0"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAccountNumber(!showAccountNumber)}
                        className="text-slate-400 hover:text-[#021526] p-0.5 ml-2 shrink-0 cursor-pointer focus:outline-none transition-colors"
                        tabIndex={-1}
                        title={showAccountNumber ? 'Hide Account Number' : 'Show Account Number'}
                      >
                        {showAccountNumber ? <EyeOff className="h-4 w-4 shrink-0" /> : <Eye className="h-4 w-4 shrink-0" />}
                      </button>
                    </div>
                    {accountNumber.length > 0 && !isValidAccountNumber(accountNumber) && (
                      <p className="text-[10px] text-amber-600 mt-1">Must be 9 to 18 numeric digits</p>
                    )}
                  </div>

                  {/* Confirm Account Number: Strictly Digits (9-18) with Password Masking & Clean Centered Eye Toggle INSIDE */}
                  <div>
                    <label className="text-xs font-bold text-[#021526] block mb-1">
                      Confirm Account Number <span className="text-rose-500 font-black">*</span>
                    </label>
                    <div className="flex items-center rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 transition-colors focus-within:border-[#F94001]">
                      <input
                        type={showConfirmAccountNumber ? 'text' : 'password'}
                        maxLength={18}
                        value={confirmAccountNumber}
                        onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 18))}
                        placeholder="Re-enter bank account number"
                        className="w-full bg-transparent text-xs font-mono text-[#021526] focus:outline-none border-0 p-0"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmAccountNumber(!showConfirmAccountNumber)}
                        className="text-slate-400 hover:text-[#021526] p-0.5 ml-2 shrink-0 cursor-pointer focus:outline-none transition-colors"
                        tabIndex={-1}
                        title={showConfirmAccountNumber ? 'Hide Account Number' : 'Show Account Number'}
                      >
                        {showConfirmAccountNumber ? <EyeOff className="h-4 w-4 shrink-0" /> : <Eye className="h-4 w-4 shrink-0" />}
                      </button>
                    </div>
                    {confirmAccountNumber.length > 0 && (
                      confirmAccountNumber === accountNumber ? (
                        <p className="text-[10px] text-emerald-600 font-mono mt-1 font-semibold">Account numbers match</p>
                      ) : (
                        <p className="text-[10px] text-rose-600 font-mono mt-1">Account numbers do not match</p>
                      )
                    )}
                  </div>

                  {/* IFSC Code: Strictly 11 Alphanumeric */}
                  <div>
                    <label className="text-xs font-bold text-[#021526] block mb-1">
                      IFSC Code <span className="text-rose-500 font-black">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11))}
                      placeholder="HDFC0001234"
                      className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-xs font-mono text-[#021526] focus:border-[#F94001] focus:outline-none"
                    />
                    {ifscCode.length > 0 && !isValidIFSC(ifscCode) && (
                      <p className="text-[10px] text-amber-600 mt-1">Format: 4 letters + 0 + 6 alphanumeric (e.g. HDFC0001234)</p>
                    )}
                  </div>

                  {/* Account Type */}
                  <div>
                    <label className="text-xs font-bold text-[#021526] block mb-1">
                      Account Type <span className="text-rose-500 font-black">*</span>
                    </label>
                    <select
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value)}
                      className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-xs text-[#021526] focus:border-[#F94001] focus:outline-none"
                    >
                      <option value="CURRENT">Current Account</option>
                      <option value="SAVINGS">Savings Account</option>
                    </select>
                  </div>

                  {/* Branch Name */}
                  <div>
                    <label className="text-xs font-bold text-[#021526] block mb-1">
                      Branch Name <span className="text-rose-500 font-black">*</span>
                    </label>
                    <input
                      type="text"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      placeholder="e.g. Peelamedu Branch"
                      className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-xs text-[#021526] focus:border-[#F94001] focus:outline-none"
                    />
                  </div>

                  {/* Bank Proof Upload Card: Mandatory */}
                  <div>
                    <label className="text-xs font-bold text-[#021526] block mb-1 flex items-center justify-between">
                      <span>Cancelled Cheque / Passbook <span className="text-rose-500 font-black">*</span></span>
                      <span className="text-[10px] font-mono text-[#5F6368] uppercase">PDF/JPG Max 5MB</span>
                    </label>
                    <input
                      type="file"
                      ref={bankProofInputRef}
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) =>
                        handleFileUpload(
                          e,
                          'BANK_PROOF',
                          (id, name, previewUrl) => {
                            setBranchProofDocId(id);
                            setBranchProofFileName(name);
                            if (previewUrl) setBranchProofPreviewUrl(previewUrl);
                          },
                          setBranchProofUploading,
                        )
                      }
                      className="hidden"
                    />

                    {branchProofUploading ? (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl border border-dashed border-[#F94001] bg-[#FFF1EC]/30 text-xs font-bold text-[#F94001]">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Uploading bank proof...</span>
                      </div>
                    ) : branchProofDocId ? (
                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-emerald-300 bg-emerald-50/50 shadow-xs">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-mono text-xs font-bold text-[#021526] truncate">
                              {branchProofFileName || branchProofDocId}
                            </p>
                            <span className="text-[10px] text-emerald-700 font-medium">✓ Uploaded & Verified</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* VIEW BUTTON */}
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenDocumentPreview(
                                branchProofPreviewUrl,
                                branchProofFileName,
                                branchProofDocId,
                                'BANK',
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#CBD5E1] text-[11px] font-bold text-[#021526] hover:bg-[#F3F4F4] hover:text-[#F94001] transition-colors shadow-xs cursor-pointer"
                            title="View Bank Proof Document"
                          >
                            <Eye className="h-3.5 w-3.5 text-[#5F6368]" />
                            <span>View</span>
                          </button>

                          {/* DELETE BUTTON */}
                          <button
                            type="button"
                            onClick={() => {
                              setBranchProofDocId('');
                              setBranchProofFileName('');
                              setBranchProofPreviewUrl(null);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-rose-200 text-[11px] font-bold text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors shadow-xs"
                            title="Delete Bank Proof Document"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2 p-2 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8F9FA]">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-[#5F6368] shrink-0" />
                          <span className="font-mono text-[11px] text-[#5F6368] truncate">
                            No bank proof uploaded
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => bankProofInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-[#F94001] hover:bg-[#D93600] text-white text-[11px] font-bold transition-all shadow-xs shrink-0"
                        >
                          Upload File
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(5)}
                    className="px-4 py-2 rounded-xl border border-[#E5E7EB] text-xs font-bold text-[#5F6368] hover:bg-[#F3F4F4]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={
                      loading ||
                      !isValidName(accountHolderName) ||
                      !bankName.trim() ||
                      !isValidAccountNumber(accountNumber) ||
                      accountNumber !== confirmAccountNumber ||
                      !isValidIFSC(ifscCode) ||
                      !branchProofDocId
                    }
                    onClick={handleSaveBankDetails}
                    className="px-6 py-2.5 rounded-xl bg-[#F94001] hover:bg-[#D93600] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    Save & Continue to Step 7 &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 7: REVIEW, SUBMIT & STATUS (FULL 7 STEPS BREAKDOWN)   */}
            {/* ============================================================ */}
            {currentStep === 7 && (
              <div className="rounded-2xl bg-white p-6 sm:p-8 border border-[#E5E7EB] shadow-xs space-y-6">
                <div className="border-b border-[#E5E7EB] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold font-mono text-[#F94001] uppercase tracking-wider">
                      Step 7 of 7 &bull; Final Submission & Review
                    </span>
                    <h2 className="text-xl font-black text-[#021526] font-display mt-1">
                      Review & Confirm Partnership Application
                    </h2>
                    <p className="text-xs text-[#5F6368] mt-0.5">
                      Please review the complete operational, facility, and banking dossier before final submission to Super Admin.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold font-mono">
                      ✓ All Steps Ready
                    </span>
                  </div>
                </div>

                {applicationStatus === 'PENDING_REVIEW' && (
                  <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                      <Clock className="h-6 w-6 animate-pulse" />
                    </div>
                    <h3 className="text-base font-bold text-amber-900 font-display">
                      Application Under Review ({applicationId})
                    </h3>
                    <p className="text-xs text-amber-800 max-w-md mx-auto">
                      Your application has been submitted and is currently being
                      evaluated by the Super Admin team. You will receive an automated
                      email notification once reviewed.
                    </p>
                    <div className="pt-2">
                      <span className="text-[11px] font-bold text-amber-900 bg-amber-200/70 px-3 py-1 rounded-full">
                        Status: PENDING_REVIEW
                      </span>
                    </div>
                  </div>
                )}

                {applicationStatus === 'APPROVED' && (
                  <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-bold text-emerald-900 font-display">
                      Congratulations! Application Approved
                    </h3>
                    <p className="text-xs text-emerald-800 max-w-md mx-auto">
                      Your sports arena has been verified and activated on the
                      iBookSports booking network.
                    </p>
                    {appAccessLink && (
                      <a
                        href={appAccessLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all"
                      >
                        <span>Access Partner Dashboard</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}

                {applicationStatus !== 'PENDING_REVIEW' &&
                  applicationStatus !== 'APPROVED' && (
                    <div className="space-y-6">
                      {renderStepRejectionAlert(7)}

                      {/* 1. Step 1 Review: Partner & Contact Details */}
                      <div className="rounded-xl border border-[#CBD5E1] bg-[#F8F9FA] p-4 sm:p-5 space-y-3">
                        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2.5">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-[#021526] text-white flex items-center justify-center text-xs font-bold font-mono">
                              1
                            </div>
                            <div>
                              <h3 className="text-xs font-bold text-[#021526] uppercase tracking-wide">
                                Partner & Signatory Details
                              </h3>
                              <span className="text-[10px] text-[#5F6368]">Authorized Primary Contact</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(1)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#CBD5E1] text-[11px] font-bold text-[#021526] hover:bg-[#FFF1EC] hover:text-[#F94001] transition-colors shadow-xs"
                          >
                            <Edit3 className="h-3 w-3" /> Edit Step 1
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-[10px] font-mono text-[#5F6368] uppercase block">Legal Name</span>
                            <p className="font-bold text-[#021526] mt-0.5">{partnerName || '—'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-[#5F6368] uppercase block">Mobile Number</span>
                            <p className="font-mono font-bold text-[#021526] mt-0.5 flex items-center gap-1.5">
                              <span>+91 {mobileNumber || '—'}</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-100 text-emerald-800 font-bold">VERIFIED</span>
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-[#5F6368] uppercase block">Email Address</span>
                            <p className="font-mono font-medium text-[#021526] mt-0.5">{partnerEmail || '—'}</p>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-[10px] font-mono text-[#5F6368] uppercase block">Residential Address</span>
                            <p className="text-[#021526] mt-0.5">
                              {partnerAddress ? `${partnerAddress}, ${partnerDistrict}, ${partnerState} - ${partnerPincode}` : '—'}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-[#5F6368] uppercase block">Verification Documents</span>
                            <div className="mt-1 space-y-1 text-[11px]">
                              <p className="flex items-center gap-1 text-emerald-700 font-medium">
                                <Check className="h-3 w-3 text-emerald-600" />
                                <span className="truncate">Aadhaar: {aadhaarFileName || (aadhaarDocId ? 'Uploaded' : 'Pending')}</span>
                              </p>
                              <p className="flex items-center gap-1 text-emerald-700 font-medium">
                                <Check className="h-3 w-3 text-emerald-600" />
                                <span className="truncate">Photo: {profilePhotoFileName || (profilePhotoDocId ? 'Uploaded' : 'Pending')}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2. Step 2 Review: Sports Venue & GST Registration */}
                      <div className="rounded-xl border border-[#CBD5E1] bg-[#F8F9FA] p-4 sm:p-5 space-y-3">
                        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2.5">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-[#021526] text-white flex items-center justify-center text-xs font-bold font-mono">
                              2
                            </div>
                            <div>
                              <h3 className="text-xs font-bold text-[#021526] uppercase tracking-wide">
                                Venue & GST Information
                              </h3>
                              <span className="text-[10px] text-[#5F6368]">Physical Arena Location & Tax Compliance</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#CBD5E1] text-[11px] font-bold text-[#021526] hover:bg-[#FFF1EC] hover:text-[#F94001] transition-colors shadow-xs"
                          >
                            <Edit3 className="h-3 w-3" /> Edit Step 2
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-[10px] font-mono text-[#5F6368] uppercase block">Venue / Arena Name</span>
                            <p className="font-bold text-[#021526] text-sm mt-0.5">{venueName || '—'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-[#5F6368] uppercase block">Venue Contact Phone</span>
                            <p className="font-mono font-medium text-[#021526] mt-0.5">+91 {venueMobile || mobileNumber || '—'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-[#5F6368] uppercase block">GST Registration</span>
                            <p className="font-medium text-[#021526] mt-0.5">
                              {hasGst ? (
                                <span className="text-emerald-700 font-bold">Registered ({gstNumber})</span>
                              ) : (
                                <span className="text-slate-600">Not Registered / Exempt</span>
                              )}
                            </p>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-[10px] font-mono text-[#5F6368] uppercase block">Venue Physical Address</span>
                            <p className="text-[#021526] mt-0.5">
                              {venueAddress || '—'}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-[#5F6368] uppercase block">Map Link & GST Certificate</span>
                            <div className="mt-1 space-y-1 text-[11px]">
                              {venueGoogleMaps ? (
                                <a
                                  href={venueGoogleMaps}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[#F94001] hover:underline font-medium"
                                >
                                  <ExternalLink className="h-3 w-3" /> View on Google Maps
                                </a>
                              ) : (
                                <p className="text-slate-500">No Maps link provided</p>
                              )}
                              {hasGst && (
                                <p className="flex items-center gap-1 text-emerald-700 font-medium">
                                  <Check className="h-3 w-3 text-emerald-600" />
                                  <span className="truncate">GST Doc: {gstFileName || 'Uploaded'}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 3. Step 3 Review: Facility Court Photos */}
                      <div className="rounded-xl border border-[#CBD5E1] bg-[#F8F9FA] p-4 sm:p-5 space-y-3">
                        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2.5">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-[#021526] text-white flex items-center justify-center text-xs font-bold font-mono">
                              3
                            </div>
                            <div>
                              <h3 className="text-xs font-bold text-[#021526] uppercase tracking-wide">
                                Facility & Court Photos
                              </h3>
                              <span className="text-[10px] text-[#5F6368]">{courtPhotoList.length} Photos Uploaded</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(3)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#CBD5E1] text-[11px] font-bold text-[#021526] hover:bg-[#FFF1EC] hover:text-[#F94001] transition-colors shadow-xs"
                          >
                            <Edit3 className="h-3 w-3" /> Edit Step 3
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {courtPhotoList.map((photo, idx) => (
                            <div
                              key={photo.id || idx}
                              className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden text-center shadow-xs flex flex-col justify-between"
                            >
                              <div className="relative h-20 w-full bg-slate-100 overflow-hidden">
                                {photo.previewUrl ? (
                                  <img
                                    src={photo.previewUrl}
                                    alt={photo.name}
                                    className="h-full w-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                                    onClick={() =>
                                      setPreviewModalImage({
                                        url: photo.previewUrl!,
                                        title: photo.name,
                                      })
                                    }
                                  />
                                ) : (
                                  <div className="h-full w-full bg-slate-100 flex flex-col items-center justify-center text-slate-500">
                                    <Camera className="h-5 w-5 text-slate-400 mb-0.5" />
                                    <span className="text-[9px] font-mono font-bold text-slate-600">PHOTO #{idx + 1}</span>
                                  </div>
                                )}
                              </div>
                              <div className="p-2 space-y-0.5">
                                <p className="text-[10px] font-bold text-[#021526] truncate" title={photo.name}>
                                  {photo.name}
                                </p>
                                <p className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded inline-block font-semibold">
                                  ✓ Uploaded
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 4. Step 4 Review: Operating Days & Schedule */}
                      <div className="rounded-xl border border-[#CBD5E1] bg-[#F8F9FA] p-4 sm:p-5 space-y-3">
                        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2.5">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-[#021526] text-white flex items-center justify-center text-xs font-bold font-mono">
                              4
                            </div>
                            <div>
                              <h3 className="text-xs font-bold text-[#021526] uppercase tracking-wide">
                                Weekly Operating Schedule
                              </h3>
                              <span className="text-[10px] text-[#5F6368]">
                                {dailySchedules.filter((d) => d.isOpen).length} Active Operating Days per Week
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(4)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#CBD5E1] text-[11px] font-bold text-[#021526] hover:bg-[#FFF1EC] hover:text-[#F94001] transition-colors shadow-xs"
                          >
                            <Edit3 className="h-3 w-3" /> Edit Step 4
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                          {DAYS_ORDER.map(({ day, label }) => {
                            const sched = dailySchedules.find((s) => s.day === day) || {
                              isOpen: true,
                              openTime: '06:00 AM',
                              closeTime: '10:00 PM',
                            };
                            return (
                              <div
                                key={day}
                                className={`p-2.5 rounded-xl border text-center transition-all ${sched.isOpen ? 'border-[#CBD5E1] bg-white' : 'border-slate-200 bg-slate-100/60 opacity-60'
                                  }`}
                              >
                                <span className="text-[11px] font-bold text-[#021526] block font-display">{label}</span>
                                {sched.isOpen ? (
                                  <div className="mt-1">
                                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded block">
                                      {sched.openTime}
                                    </span>
                                    <span className="text-[9px] text-[#5F6368] block my-0.5">to</span>
                                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded block">
                                      {sched.closeTime}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded block mt-2">
                                    Closed
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* 5. Step 5 Review: Sports & Court Pricing Matrix */}
                      <div className="rounded-xl border border-[#CBD5E1] bg-[#F8F9FA] p-4 sm:p-5 space-y-3">
                        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2.5">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-[#021526] text-white flex items-center justify-center text-xs font-bold font-mono">
                              5
                            </div>
                            <div>
                              <h3 className="text-xs font-bold text-[#021526] uppercase tracking-wide">
                                Sports & Playable Courts Pricing Matrix
                              </h3>
                              <span className="text-[10px] text-[#5F6368]">
                                {selectedSports.join(', ')} &bull; {courts.length} Playable Court(s)
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(5)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#CBD5E1] text-[11px] font-bold text-[#021526] hover:bg-[#FFF1EC] hover:text-[#F94001] transition-colors shadow-xs"
                          >
                            <Edit3 className="h-3 w-3" /> Edit Step 5
                          </button>
                        </div>

                        {/* COURTS CARDS IN REVIEW */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {courts.map((court, idx) => (
                            <div
                              key={idx}
                              className="rounded-xl border border-[#CBD5E1] bg-white p-4 space-y-3 shadow-2xs"
                            >
                              <div className="flex items-start justify-between gap-2 border-b border-[#E5E7EB] pb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="h-6 w-6 rounded-lg bg-[#021526] text-white flex items-center justify-center font-mono text-[11px] font-bold shrink-0">
                                    #{idx + 1}
                                  </span>
                                  <div>
                                    <h4 className="font-bold text-xs text-[#021526]">
                                      {court.court_name}
                                    </h4>
                                    <p className="text-[10px] text-[#5F6368]">
                                      {court.display_name || 'Standard'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-1 items-center">
                                  {court.sports?.map((sp) => (
                                    <span
                                      key={sp}
                                      className="px-2 py-0.5 rounded bg-slate-100 text-[#021526] font-bold text-[9px] border border-slate-200"
                                    >
                                      {sp}
                                    </span>
                                  ))}
                                  {court.use_one_physical_court_for_two_sports && (
                                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] font-bold">
                                      ⚡ Shared Ground
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                                <div className="p-2 rounded-lg bg-[#F8F9FA] border border-[#E5E7EB]">
                                  <span className="text-[9px] uppercase text-slate-400 block">Regular</span>
                                  <span className="font-mono font-bold text-xs text-[#021526]">₹{court.regular_price}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-amber-50/50 border border-amber-200">
                                  <span className="text-[9px] uppercase text-amber-700 block font-semibold">Peak</span>
                                  <span className="font-mono font-bold text-xs text-amber-900">₹{court.peak_hour_price || court.regular_price}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-purple-50/50 border border-purple-200">
                                  <span className="text-[9px] uppercase text-purple-700 block font-semibold">Weekend</span>
                                  <span className="font-mono font-bold text-xs text-purple-900">₹{court.weekend_price || court.regular_price}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-emerald-50/50 border border-emerald-200">
                                  <span className="text-[9px] uppercase text-emerald-700 block font-semibold">Deposit</span>
                                  <span className="font-mono font-bold text-xs text-emerald-900">₹{court.advance_booking_price || 0}</span>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-[10px] text-[#5F6368]">
                                <span>Min Duration: <strong className="text-[#021526]">{court.minimum_booking_time_minutes || 60}m</strong></span>
                                <span>Peak Days: <strong className="text-[#021526]">{court.peak_days?.join(', ') || 'Sat, Sun'}</strong></span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Cancellation & Refund Rule in Review */}
                        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white border border-[#CBD5E1] text-xs text-[#021526] shadow-2xs">
                          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span className="text-[11px]">
                            <strong className="font-bold text-[#021526]">Customer Cancellation Rule:</strong> Free cancellation permitted up to{' '}
                            <strong>{cancellationWindowHours} Hours</strong> before kickoff with{' '}
                            <strong>{refundPercentage}%</strong> refund.
                          </span>
                        </div>
                      </div>

                      {/* 6. Step 6 Review: Bank Account */}
                      <div className="rounded-xl border border-[#CBD5E1] bg-[#F8F9FA] p-4 sm:p-5 space-y-3">
                        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2.5">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-[#021526] text-white flex items-center justify-center text-xs font-bold font-mono">
                              6
                            </div>
                            <div>
                              <h3 className="text-xs font-bold text-[#021526] uppercase tracking-wide">
                                Bank Account
                              </h3>
                              <span className="text-[10px] text-[#5F6368]">Official Payout Details</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(6)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#CBD5E1] text-[11px] font-bold text-[#021526] hover:bg-[#FFF1EC] hover:text-[#F94001] transition-colors shadow-xs"
                          >
                            <Edit3 className="h-3 w-3" /> Edit Step 6
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-[10px] font-mono text-[#5F6368] uppercase block">Account Holder Name</span>
                            <p className="font-bold text-[#021526] mt-0.5">{accountHolderName || '—'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-[#5F6368] uppercase block">Bank Name & Branch</span>
                            <p className="font-bold text-[#021526] mt-0.5">{bankName || '—'} {branchName ? `(${branchName})` : ''}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-[#5F6368] uppercase block">Account Type</span>
                            <p className="font-medium text-[#021526] mt-0.5">{accountType === 'CURRENT' ? 'Current Account' : 'Savings Account'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-[#5F6368] uppercase block">Account Number</span>
                            <p className="font-mono font-bold text-[#021526] mt-0.5">
                              •••• •••• •••• {accountNumber.slice(-4) || '••••'}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-[#5F6368] uppercase block">IFSC Code</span>
                            <p className="font-mono font-bold text-[#021526] mt-0.5">{ifscCode || '—'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-[#5F6368] uppercase block">Bank Proof Verification</span>
                            <p className="flex items-center gap-1 text-emerald-700 font-medium mt-1 text-[11px]">
                              <Check className="h-3 w-3 text-emerald-600" />
                              <span className="truncate">{branchProofFileName || (branchProofDocId ? 'Bank Proof Uploaded' : 'Uploaded')}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 7. Step 7 Review: Legal Declaration & Final Submission */}
                      <div className="p-5 rounded-2xl border-2 border-[#F94001]/20 bg-[#FFF1EC]/30 space-y-4">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-5 w-5 text-[#F94001]" />
                          <h3 className="text-sm font-bold text-[#021526] font-display">
                            Partner Entity Legal Declaration
                          </h3>
                        </div>

                        <label className="flex items-start gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={declarationAccepted}
                            onChange={(e) => setDeclarationAccepted(e.target.checked)}
                            className="mt-1 h-4 w-4 rounded text-[#F94001] focus:ring-[#F94001]"
                          />
                          <span className="text-xs text-[#021526] leading-relaxed">
                            I hereby declare that all submitted personal identification, sports venue physical parameters, court pricing matrices, bank settlement credentials, and GST registration details across all 7 steps are true, authentic, accurate, and belong to the authorized signatory of the partner entity. I agree to the <span className="text-[#F94001] font-bold underline">iBookSports Partner Agreement & SLA Guidelines</span>. <span className="text-rose-500 font-black">*</span>
                          </span>
                        </label>
                      </div>

                      {/* Final Action Buttons */}
                      <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(6)}
                          className="px-5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs font-bold text-[#5F6368] hover:bg-[#F3F4F4] transition-colors"
                        >
                          &larr; Back to Step 6
                        </button>
                        <button
                          type="button"
                          disabled={loading || !declarationAccepted}
                          onClick={handleSubmitApplication}
                          className="px-8 py-3 rounded-xl bg-[#F94001] hover:bg-[#D93600] text-white text-xs font-black shadow-lg shadow-[#F94001]/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer uppercase tracking-wider"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Submitting Application...</span>
                            </>
                          ) : (
                            <>
                              <FileCheck className="h-4 w-4" />
                              <span>Submit Application for Review &rarr;</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ============================================================ */}
      {/* FLOATING BOTTOM-RIGHT TOAST NOTIFICATION POPUPS               */}
      {/* ============================================================ */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <div className="fixed bottom-6 right-6 z-[100000] flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0">
          {errorMessage && (
            <div className="pointer-events-auto p-4 rounded-2xl bg-[#021526] text-white border border-rose-500/30 shadow-2xl flex items-start gap-3.5 animate-in slide-in-from-bottom duration-300">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-bold text-sm leading-tight text-white mb-0.5">Action Notification</p>
                <p className="text-slate-300 leading-relaxed">{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                title="Close notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {successMessage && (
            <div className="pointer-events-auto p-4 rounded-2xl bg-[#021526] text-white border border-emerald-500/30 shadow-2xl flex items-start gap-3.5 animate-in slide-in-from-bottom duration-300">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-bold text-sm leading-tight text-white mb-0.5">Saved Successfully</p>
                <p className="text-slate-300 leading-relaxed">{successMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                title="Close notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>,
        document.body
      )}

      {/* DOCUMENT & PHOTO FULL-SIZE IN-PAGE PREVIEW MODAL */}
      {mounted && previewModalImage && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setPreviewModalImage(null)}
          className="fixed inset-0 z-[9999] top-0 left-0 right-0 bottom-0 w-screen h-screen bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 p-4 relative flex flex-col cursor-default animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-7 w-7 rounded-lg bg-orange-50 text-[#F94001] flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-[#021526] truncate block">{previewModalImage.title}</span>
                  <span className="text-[10px] font-mono text-[#5F6368]">
                    {previewModalImage.isPdf || previewModalImage.title?.toLowerCase().endsWith('.pdf') ? 'PDF Document' : 'Image Preview'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewModalImage.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#021526] hover:bg-[#06243f] text-white text-xs font-bold transition-all shadow-xs"
                  title="Open Original in New Tab"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-[#F94001]" />
                  <span>Open in New Tab</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewModalImage(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-[#021526] hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Close"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center max-h-[75vh] min-h-[320px] overflow-hidden bg-slate-950 rounded-2xl border border-slate-200/50">
              {previewModalImage.isPdf || previewModalImage.title?.toLowerCase().endsWith('.pdf') ? (
                <object
                  data={previewModalImage.url}
                  type="application/pdf"
                  className="w-full h-[72vh] rounded-2xl bg-white border-0"
                >
                  <iframe
                    src={previewModalImage.url}
                    title={previewModalImage.title}
                    className="w-full h-[72vh] rounded-2xl bg-white border-0"
                  />
                </object>
              ) : (
                <img
                  src={previewModalImage.url}
                  alt={previewModalImage.title}
                  className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-md"
                />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

