'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertCircle,
  Phone,
  Building2,
  MapPin,
  Trophy,
  ArrowRight,
  Loader2,
  ShieldCheck,
  RotateCcw,
  Check,
  User,
  Mail,
  Globe,
  Link as LinkIcon,
  ExternalLink,
  ChevronDown,
  X,
  Plus,
  Clock,
} from 'lucide-react';
import { AxiosError } from 'axios';
import { websiteApi, SubmitVenueDetailsPayload } from '@/lib/api';
import { INDIAN_STATES, INDIAN_LOCATIONS } from '@/data/locations';
import { SPORTS_OPTIONS } from '@/data/sports';

interface FormState {
  name: string;
  email: string;
  mobileNumber: string;
  venueName: string;
  venueLocationName: string;
  state: string;
  district: string;
  selectedSports: string[];
  customSportName: string;
}

const INITIAL_FORM: FormState = {
  name: '',
  email: '',
  mobileNumber: '',
  venueName: '',
  venueLocationName: '',
  state: 'Tamil Nadu',
  district: 'Coimbatore',
  selectedSports: ['FOOTBALL'],
  customSportName: '',
};

export default function WebsiteLeadForm() {
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>(
    INDIAN_LOCATIONS['Tamil Nadu'] || []
  );

  // Sports Multi-Select Dropdown State
  const [isSportsDropdownOpen, setIsSportsDropdownOpen] = useState(false);
  const [sportsSearchQuery, setSportsSearchQuery] = useState('');
  const sportsDropdownRef = useRef<HTMLDivElement>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<{
    requestId: string;
    name: string;
    email?: string;
    mobile_number: number;
    venue_name: string;
    venue_location_name: string;
    state: string;
    district: string;
    sports: string;
    message: string;
  } | null>(null);

  // Close sports dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sportsDropdownRef.current &&
        !sportsDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSportsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update districts when state changes
  useEffect(() => {
    const districts = INDIAN_LOCATIONS[formData.state] || ['General'];
    setAvailableDistricts(districts);
    setFormData((prev) => {
      if (!districts.includes(prev.district)) {
        return { ...prev, district: districts[0] || '' };
      }
      return prev;
    });
  }, [formData.state]);

  // Handle Phone change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData((prev) => ({ ...prev, mobileNumber: val }));
  };

  // Toggle Sport Selection
  const handleToggleSport = (sportId: string) => {
    setFormData((prev) => {
      const exists = prev.selectedSports.includes(sportId);
      const updated = exists
        ? prev.selectedSports.filter((id) => id !== sportId)
        : [...prev.selectedSports, sportId];
      return { ...prev, selectedSports: updated };
    });
  };

  // Remove Sport Chip
  const handleRemoveSport = (sportId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedSports: prev.selectedSports.filter((id) => id !== sportId),
    }));
  };

  // Submit Venue Details
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedVenueName = formData.venueName.trim();
    const trimmedLocationUrl = formData.venueLocationName.trim();

    // 1. Name validation
    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 100) {
      setFormError('Name must contain between 2 and 100 valid characters.');
      return;
    }

    if (!/^[a-zA-Z\s.']+$/.test(trimmedName)) {
      setFormError('Name cannot be numeric-only and must contain valid letters.');
      return;
    }

    // 2. Email validation (if provided)
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFormError('Please enter a valid email address (e.g. name@arena.com).');
      return;
    }

    // 3. Mobile number validation
    if (!formData.mobileNumber || formData.mobileNumber.length !== 10) {
      setFormError('Mobile number must be a valid 10-digit number.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(formData.mobileNumber)) {
      setFormError('Mobile number must start with 6, 7, 8, or 9 for Indian mobile numbers.');
      return;
    }

    // 4. Venue Name validation
    if (!trimmedVenueName || trimmedVenueName.length < 2 || trimmedVenueName.length > 255) {
      setFormError('Venue name must contain between 2 and 255 characters.');
      return;
    }

    // 5. Venue Location URL validation
    if (!trimmedLocationUrl || !/^https?:\/\/.+/i.test(trimmedLocationUrl)) {
      setFormError('Please provide a valid Google Maps link starting with http:// or https://');
      return;
    }

    // 6. State validation
    if (!formData.state.trim()) {
      setFormError('Please provide a valid state.');
      return;
    }

    // 7. District validation
    if (!formData.district.trim()) {
      setFormError('Please provide a valid district.');
      return;
    }

    // 8. Sports validation
    if (formData.selectedSports.length === 0) {
      setFormError('Please select at least one sport.');
      return;
    }

    if (formData.selectedSports.includes('OTHER') && !formData.customSportName.trim()) {
      setFormError('Please specify the sport name for "Other Sports".');
      return;
    }

    const finalSportsList = formData.selectedSports.map((s) => {
      if (s === 'OTHER' && formData.customSportName.trim()) {
        return formData.customSportName.trim();
      }
      return s.charAt(0) + s.slice(1).toLowerCase();
    });
    const primarySportString = finalSportsList.join(', ');

    setIsSubmitting(true);

    try {
      const payload: SubmitVenueDetailsPayload = {
        name: trimmedName,
        email: trimmedEmail || undefined,
        mobile_number: Number(formData.mobileNumber),
        venue_name: trimmedVenueName,
        venue_location_name: trimmedLocationUrl,
        state: formData.state.trim(),
        district: formData.district.trim(),
        sports: primarySportString,
      };

      const res = await websiteApi.submitVenueDetails(payload);
      const effectiveId =
        res?.data?.requestId ||
        res?.data?.request_id ||
        res?.data?.id;

      if (!effectiveId) {
        throw new Error('Server did not return a valid reference ID. Please try again.');
      }

      setSubmissionResult({
        requestId: effectiveId,
        name: trimmedName,
        email: trimmedEmail,
        mobile_number: Number(formData.mobileNumber),
        venue_name: trimmedVenueName,
        venue_location_name: trimmedLocationUrl,
        state: formData.state.trim(),
        district: formData.district.trim(),
        sports: primarySportString,
        message: 'Venue partnership request registered in queue successfully',
      });
    } catch (err: any) {
      console.error('Submission error:', err);
      setFormError(
        err?.message || 'Failed to submit application to the server. Please try again in a few moments.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered sports for dropdown
  const filteredSports = SPORTS_OPTIONS.filter((s) =>
    s.label.toLowerCase().includes(sportsSearchQuery.toLowerCase())
  );

  // SUCCESS CONFIRMATION VIEW (201 Created)
  if (submissionResult) {
    return (
      <div className="rounded-3xl border border-[#E5E7EB] bg-white p-8 sm:p-12 shadow-sm text-center max-w-xl mx-auto space-y-6 animate-in fade-in">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#F94001] font-mono font-bold text-xs">
            <span>Reference ID:</span>
            <span className="font-extrabold">{submissionResult.requestId}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#021526] font-display">
            Request Received!
          </h2>
          <p className="text-xs sm:text-sm text-[#5F6368] max-w-md mx-auto">
            Your facility application for <strong className="text-[#021526] font-bold">{submissionResult.venue_name}</strong> has been submitted to the admin review queue.
          </p>
        </div>

        {/* Minimal Onboarding Lifecycle Flow */}
        <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-[#E5E7EB] text-left space-y-3">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Partner Activation Pipeline
          </span>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-700 font-bold">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>1. Application Submitted (Done)</span>
            </div>
            <div className="flex items-center gap-2 text-amber-700 font-bold">
              <Clock className="h-4 w-4 shrink-0 animate-spin" style={{ animationDuration: '4s' }} />
              <span>2. Admin Review &amp; Onboarding Link Creation (In Queue)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <div className="h-4 w-4 rounded-full border border-slate-300 shrink-0" />
              <span>3. Partner Completes KYC, Bank &amp; Pitch Setup</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <div className="h-4 w-4 rounded-full border border-slate-300 shrink-0" />
              <span>4. Final Approval &amp; Live Venue Activation</span>
            </div>
          </div>
        </div>

        {/* Submitted Summary Card */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 text-left text-xs space-y-2 shadow-2xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[#5F6368] text-[10px] block uppercase font-bold">Owner Name</span>
              <p className="font-bold text-[#021526]">{submissionResult.name}</p>
            </div>
            <div>
              <span className="text-[#5F6368] text-[10px] block uppercase font-bold">Phone Number</span>
              <p className="font-bold font-mono text-[#021526]">+91 {submissionResult.mobile_number}</p>
            </div>
            <div>
              <span className="text-[#5F6368] text-[10px] block uppercase font-bold">Location</span>
              <p className="font-bold text-[#021526]">{submissionResult.district}, {submissionResult.state}</p>
            </div>
            <div>
              <span className="text-[#5F6368] text-[10px] block uppercase font-bold">Sports</span>
              <p className="font-bold text-[#F94001]">{submissionResult.sports}</p>
            </div>
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/admin/requests"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#021526] hover:bg-[#F94001] px-5 py-2.5 text-xs font-bold text-white transition-all shadow-xs"
          >
            <span>Open Admin Review Queue</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <button
            type="button"
            onClick={() => {
              setSubmissionResult(null);
              setFormData(INITIAL_FORM);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-[#021526] transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            <span>Register Another Facility</span>
          </button>
        </div>
      </div>
    );
  }

  // STANDARD FORM VIEW
  return (
    <div className="rounded-3xl border border-[#E5E7EB] bg-white p-6 sm:p-10 shadow-sm max-w-2xl mx-auto space-y-8" suppressHydrationWarning>
      {/* Form Header */}
      <div className="border-b border-[#E5E7EB] pb-6" suppressHydrationWarning>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF1EC] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#F94001] border border-[#F94001]/30 mb-2">
          <Trophy className="h-3.5 w-3.5" /> Partner Venue Registration
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#021526] font-display">
          Submit Your Venue Details
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-[#5F6368]">
          Register your sports arena with official location link and contact information.
        </p>
      </div>

      {/* Global Error Banner */}
      {formError && (
        <div className="flex items-start gap-3 rounded-2xl bg-rose-50 p-4 border border-rose-200 text-xs text-rose-800 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Validation Error</p>
            <p className="text-rose-700/90 text-xs mt-0.5">{formError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" suppressHydrationWarning>
        {/* ========================================================================= */}
        {/* SECTION 1: OWNER & CONTACT INFORMATION (WITH EMAIL FOR LINK DISPATCH) */}
        {/* ========================================================================= */}
        <div className="space-y-4" suppressHydrationWarning>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#021526] flex items-center gap-2">
            <User className="h-4 w-4 text-[#F94001]" /> 1. Contact &amp; Owner Information
          </h2>

          {/* Name & Email Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5" suppressHydrationWarning>
            {/* Full Name */}
            <div className="space-y-1.5" suppressHydrationWarning>
              <label className="flex items-center gap-1 text-xs font-bold text-[#021526]">
                Full Name <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Karthik Rajan"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#021526] placeholder-[#5F6368] transition-all focus:border-[#F94001] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F94001]"
                  suppressHydrationWarning
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5" suppressHydrationWarning>
              <label className="flex items-center gap-1 text-xs font-bold text-[#021526]">
                Email Address <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="e.g. karthik@skysports.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#021526] placeholder-[#5F6368] transition-all focus:border-[#F94001] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F94001]"
                  suppressHydrationWarning
                />
              </div>
            </div>
          </div>

          {/* Mobile Number Field */}
          <div className="space-y-1.5" suppressHydrationWarning>
            <label className="flex items-center gap-1.5 text-xs font-bold text-[#021526]">
              <Phone className="h-3.5 w-3.5 text-[#F94001]" />
              Mobile Number <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-[#5F6368]">
                +91
              </span>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="10-digit Indian mobile number (e.g. 9876543210)"
                value={formData.mobileNumber}
                onChange={handlePhoneChange}
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] pl-12 pr-4 py-2.5 text-xs sm:text-sm text-[#021526] font-mono placeholder-[#5F6368] transition-all focus:border-[#F94001] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F94001]"
                suppressHydrationWarning
              />
            </div>
            <p className="text-[11px] text-[#5F6368]">
              We will send your submission confirmation and onboarding access link to your email and phone.
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: VENUE & GOOGLE MAPS LOCATION */}
        {/* ========================================================================= */}
        <div className="space-y-4 pt-2" suppressHydrationWarning>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#021526] flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#F94001]" /> 2. Venue &amp; Location Details
          </h2>

          {/* Venue Name */}
          <div className="space-y-1.5" suppressHydrationWarning>
            <label className="flex items-center gap-1 text-xs font-bold text-[#021526]">
              Venue Name <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. Sky Sports Arena"
                value={formData.venueName}
                onChange={(e) =>
                  setFormData({ ...formData, venueName: e.target.value })
                }
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#021526] placeholder-[#5F6368] transition-all focus:border-[#F94001] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F94001]"
                suppressHydrationWarning
              />
            </div>
          </div>

          {/* Google Maps Location URL */}
          <div className="space-y-1.5" suppressHydrationWarning>
            <label className="flex items-center gap-1 text-xs font-bold text-[#021526]">
              Google Maps Facility Link <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="url"
                required
                placeholder="e.g. https://www.google.com/maps?q=11.0283,77.0012"
                value={formData.venueLocationName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    venueLocationName: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#021526] placeholder-[#5F6368] transition-all focus:border-[#F94001] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F94001]"
                suppressHydrationWarning
              />
            </div>
            <p className="text-[11px] text-[#5F6368]">
              Paste the full Google Maps share URL for your facility location.
            </p>
          </div>

          {/* State & District Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5" suppressHydrationWarning>
            {/* State */}
            <div className="space-y-1.5" suppressHydrationWarning>
              <label className="flex items-center gap-1 text-xs font-bold text-[#021526]">
                State <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <select
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] pl-10 pr-8 py-2.5 text-xs sm:text-sm text-[#021526] transition-all focus:border-[#F94001] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F94001] appearance-none"
                  suppressHydrationWarning
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 text-xs">
                  ▼
                </div>
              </div>
            </div>

            {/* District */}
            <div className="space-y-1.5" suppressHydrationWarning>
              <label className="flex items-center gap-1 text-xs font-bold text-[#021526]">
                District <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <select
                  value={formData.district}
                  onChange={(e) =>
                    setFormData({ ...formData, district: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] pl-10 pr-8 py-2.5 text-xs sm:text-sm text-[#021526] transition-all focus:border-[#F94001] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F94001] appearance-none"
                  suppressHydrationWarning
                >
                  {availableDistricts.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 text-xs">
                  ▼
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: PRIMARY SPORTS (MULTIPLE SELECT DROPDOWN WITH "OTHERS" OPTION) */}
        {/* ========================================================================= */}
        <div className="space-y-3 pt-2" ref={sportsDropdownRef} suppressHydrationWarning>
          <div className="flex items-center justify-between" suppressHydrationWarning>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#021526] flex items-center gap-2">
              <Trophy className="h-4 w-4 text-[#F94001]" /> 3. Primary Sports Offered <span className="text-rose-600">*</span>
            </h2>
            <span className="text-[11px] text-[#5F6368]">
              Select all sports offered
            </span>
          </div>

          {/* Interactive Multi-Select Trigger Bar */}
          <div className="space-y-2" suppressHydrationWarning>
            <div
              onClick={() => setIsSportsDropdownOpen(!isSportsDropdownOpen)}
              className="w-full min-h-[46px] rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] hover:bg-[#F3F4F4] p-2 flex items-center justify-between gap-2 cursor-pointer transition-all focus-within:border-[#F94001] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#F94001]"
              suppressHydrationWarning
            >
              <div className="flex flex-wrap gap-1.5 flex-1 items-center" suppressHydrationWarning>
                {formData.selectedSports.length === 0 ? (
                  <span className="text-xs text-[#5F6368] px-2">
                    Click to select sports offered at your venue...
                  </span>
                ) : (
                  formData.selectedSports.map((sportId) => {
                    const sportObj = SPORTS_OPTIONS.find((s) => s.id === sportId);
                    const label = sportId === 'OTHER'
                      ? (formData.customSportName ? `Other: ${formData.customSportName}` : 'Other Sports')
                      : (sportObj?.label || sportId);

                    return (
                      <span
                        key={sportId}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FFF1EC] text-[#F94001] border border-[#F94001]/30 animate-in fade-in"
                        suppressHydrationWarning
                      >
                        <span>{label}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSport(sportId);
                          }}
                          className="text-[#F94001] hover:text-[#021526] p-0.5 rounded"
                          suppressHydrationWarning
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })
                )}
              </div>

              <div className="flex items-center gap-1.5 pr-2 text-slate-400 shrink-0" suppressHydrationWarning>
                <span className="text-[11px] font-bold text-[#5F6368]">
                  {formData.selectedSports.length} selected
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isSportsDropdownOpen ? 'rotate-180 text-[#F94001]' : ''
                  }`}
                />
              </div>
            </div>

            {/* Dropdown Popover List */}
            {isSportsDropdownOpen && (
              <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-xl p-3 space-y-2.5 z-20 animate-in fade-in zoom-in-95" suppressHydrationWarning>
                {/* Search inside dropdown */}
                <input
                  type="text"
                  placeholder="Search sports (e.g. Badminton, Cricket, Pickleball)..."
                  value={sportsSearchQuery}
                  onChange={(e) => setSportsSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-[#F8F9FA] px-3 py-1.5 text-xs text-[#021526] placeholder-[#5F6368] focus:border-[#F94001] focus:outline-none focus:bg-white"
                  suppressHydrationWarning
                />

                {/* Sports Grid */}
                <div className="max-h-56 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1" suppressHydrationWarning>
                  {filteredSports.map((sport) => {
                    const isSelected = formData.selectedSports.includes(sport.id);
                    return (
                      <div
                        key={sport.id}
                        onClick={() => handleToggleSport(sport.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#FFF1EC] border-[#F94001] text-[#021526]'
                            : 'bg-[#F8F9FA] border-[#E5E7EB] text-[#5F6368] hover:bg-[#F3F4F4] hover:text-[#021526]'
                        }`}
                        suppressHydrationWarning
                      >
                        <div>
                          <p className="font-bold text-[#021526]">{sport.label}</p>
                          <p className="text-[10px] text-[#5F6368]">{sport.description}</p>
                        </div>
                        <div
                          className={`h-4 w-4 rounded flex items-center justify-center border transition-all ${
                            isSelected
                              ? 'bg-[#F94001] border-[#F94001] text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB] text-[11px]" suppressHydrationWarning>
                  <span className="text-[#5F6368]">
                    Select all sports offered at your venue
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSportsDropdownOpen(false)}
                    className="font-bold text-[#F94001] hover:underline"
                    suppressHydrationWarning
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* CONDITIONAL: "OTHERS" CUSTOM SPORT TEXT FIELD */}
            {formData.selectedSports.includes('OTHER') && (
              <div className="p-3.5 rounded-xl border border-[#F94001]/30 bg-[#FFF1EC]/50 space-y-1.5 animate-in fade-in slide-in-from-top-2" suppressHydrationWarning>
                <label className="flex items-center gap-1.5 text-xs font-bold text-[#021526]">
                  <Plus className="h-3.5 w-3.5 text-[#F94001]" />
                  Specify Other Custom Sport Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Skating, Padel, Squash, Archery, Martial Arts"
                  value={formData.customSportName}
                  onChange={(e) =>
                    setFormData({ ...formData, customSportName: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2 text-xs sm:text-sm text-[#021526] placeholder-[#5F6368] focus:border-[#F94001] focus:outline-none focus:ring-1 focus:ring-[#F94001] shadow-xs"
                  suppressHydrationWarning
                />
                <p className="text-[11px] text-[#5F6368]">
                  Type your venue&apos;s custom or specialized sports here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SUBMIT BUTTON */}
        {/* ========================================================================= */}
        <div className="pt-4 border-t border-[#E5E7EB]" suppressHydrationWarning>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-[#F94001] hover:bg-[#D93600] text-white py-3.5 text-sm sm:text-base font-bold shadow-md shadow-[#F94001]/25 transition-all duration-300 active:scale-[0.99] disabled:opacity-50"
            suppressHydrationWarning
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Submitting Venue Details...</span>
              </>
            ) : (
              <>
                <span>Submit Venue Details</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
          <p className="text-center text-[11px] text-[#5F6368] mt-2.5">
            Your application will be recorded and queued for administrative review.
          </p>
        </div>
      </form>
    </div>
  );
}
