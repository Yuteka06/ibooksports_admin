'use client';

import React, { useState, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  Inbox,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  AlertCircle,
  Loader2,
  Mail,
  Check,
  Eye,
  Copy,
  RefreshCw,
  ShieldAlert,
  Calendar,
  MapPin,
  Phone,
  Layers,
  ChevronRight,
  Link2,
  X,
  Trophy,
  ArrowUpRight,
  Building2,
} from 'lucide-react';
import {
  adminApi,
  PartnerRequestItem,
} from '@/lib/api';

const REJECTION_REASON_OPTIONS = [
  { value: 'SUSPICIOUS', label: 'Suspicious activity' },
  { value: 'FAKE', label: 'Fake / duplicate listing' },
  { value: 'INCOMPLETE', label: 'Incomplete information' },
  { value: 'NOT_ELIGIBLE', label: 'Does not meet requirements' },
  { value: 'OTHER', label: 'Other' },
];

const FALLBACK_PARTNER_REQUESTS: PartnerRequestItem[] = [
  {
    request_id: 'REQ-2026-0891',
    request_type: 'ONBOARDING',
    requester_name: 'K. Rajesh Kumar',
    requester_email: 'rajesh@apexarena.in',
    mobile_number: '9842184920',
    venue_name: 'Apex Sports Arena & Box Turf',
    venue_location: 'https://maps.google.com/?q=Apex+Arena+Coimbatore',
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    sports: ['Cricket', 'Football', 'Badminton'],
    number_of_courts: 4,
    request_status: 'SUBMITTED',
    status_updated_at: '2026-09-08T09:30:00Z',
    created_at: '2026-09-08T09:30:00Z',
  },
  {
    request_id: 'REQ-2026-0892',
    request_type: 'ONBOARDING',
    requester_name: 'Sneha Hegde',
    requester_email: 'sneha@unitedturf.com',
    mobile_number: '9880132910',
    venue_name: 'Decathlon United Turf Complex',
    venue_location: 'https://maps.google.com/?q=Decathlon+Whitefield',
    state: 'Karnataka',
    district: 'Bengaluru',
    sports: ['Football', 'Pickleball', 'Tennis'],
    number_of_courts: 6,
    request_status: 'SUBMITTED',
    status_updated_at: '2026-09-08T08:15:00Z',
    created_at: '2026-09-08T08:15:00Z',
  },
  {
    request_id: 'REQ-2026-0893',
    request_type: 'ONBOARDING',
    requester_name: 'S. Karthik',
    requester_email: 'karthik@smashzone.co.in',
    mobile_number: '9444018233',
    venue_name: 'SmashZone Badminton Hub',
    venue_location: 'https://maps.google.com/?q=Smashzone+Chennai',
    state: 'Tamil Nadu',
    district: 'Chennai',
    sports: ['Badminton', 'Table Tennis'],
    number_of_courts: 8,
    request_status: 'APPROVED',
    status_updated_at: '2026-09-07T16:20:00Z',
    created_at: '2026-09-07T14:10:00Z',
    approval_access_link: 'http://localhost:3001/onboarding/a8f9024bc68e102f901cbde9320e8810c9e',
    onboarding_link_sent_at: '2026-09-07T16:20:00Z',
    onboarding_token_expiry: '2026-09-14T16:20:00Z',
    raw_onboarding_token: 'a8f9024bc68e102f901cbde9320e8810c9e',
  },
  {
    request_id: 'REQ-2026-0894',
    request_type: 'ONBOARDING',
    requester_name: 'Vikram Reddy',
    requester_email: 'vikram@strikevelocity.in',
    mobile_number: '9908144520',
    venue_name: 'Strike Velocity Padel & Turf',
    venue_location: 'https://maps.google.com/?q=Strike+Velocity+Hyderabad',
    state: 'Telangana',
    district: 'Hyderabad',
    sports: ['Pickleball', 'Football', 'Cricket'],
    number_of_courts: 5,
    request_status: 'SUBMITTED',
    status_updated_at: '2026-09-08T07:45:00Z',
    created_at: '2026-09-08T07:45:00Z',
  },
  {
    request_id: 'REQ-2026-0895',
    request_type: 'ONBOARDING',
    requester_name: 'Mathew Thomas',
    requester_email: 'mathew@greenfieldsports.in',
    mobile_number: '9745190212',
    venue_name: 'GreenField Sports Village',
    venue_location: 'https://maps.google.com/?q=GreenField+Kochi',
    state: 'Kerala',
    district: 'Kochi',
    sports: ['Football', 'Cricket'],
    number_of_courts: 3,
    request_status: 'APPROVED',
    status_updated_at: '2026-09-06T11:00:00Z',
    created_at: '2026-09-06T09:30:00Z',
    approval_access_link: 'http://localhost:3001/onboarding/d37801be9c33110efac8129031d2798e',
    onboarding_link_sent_at: '2026-09-06T11:00:00Z',
    raw_onboarding_token: 'd37801be9c33110efac8129031d2798e',
  },
  {
    request_id: 'REQ-2026-0896',
    request_type: 'ONBOARDING',
    requester_name: 'M. Pandian',
    requester_email: 'pandian@championturf.com',
    mobile_number: '9843077114',
    venue_name: 'Champion Turf & Box Arena',
    venue_location: 'https://maps.google.com/?q=Champion+Turf+Madurai',
    state: 'Tamil Nadu',
    district: 'Madurai',
    sports: ['Cricket', 'Football'],
    number_of_courts: 2,
    request_status: 'REJECTED',
    status_updated_at: '2026-09-05T14:30:00Z',
    created_at: '2026-09-05T10:15:00Z',
    rejection_reason: 'INCOMPLETE',
    rejection_note: 'GST Certificate and Municipal Trade License missing from registration payload.',
    rejected_by_admin_id: 'admin_super_01',
    rejected_at: '2026-09-05T14:30:00Z',
  },
  {
    request_id: 'REQ-2026-0897',
    request_type: 'ONBOARDING',
    requester_name: 'Arvind Menon',
    requester_email: 'arvind@skylinearena.in',
    mobile_number: '9741288401',
    venue_name: 'Skyline Rooftop Arena',
    venue_location: 'https://maps.google.com/?q=Skyline+Arena+Bengaluru',
    state: 'Karnataka',
    district: 'Bengaluru',
    sports: ['Football', 'Badminton'],
    number_of_courts: 3,
    request_status: 'SUBMITTED',
    status_updated_at: '2026-09-08T06:50:00Z',
    created_at: '2026-09-08T06:50:00Z',
  },
  {
    request_id: 'REQ-2026-0898',
    request_type: 'ONBOARDING',
    requester_name: 'Priya Sundaram',
    requester_email: 'priya@acetennis.co.in',
    mobile_number: '9488210924',
    venue_name: 'Ace Tennis & Pickleball Park',
    venue_location: 'https://maps.google.com/?q=Ace+Tennis+Coimbatore',
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    sports: ['Tennis', 'Pickleball'],
    number_of_courts: 4,
    request_status: 'APPROVED',
    status_updated_at: '2026-09-04T12:00:00Z',
    created_at: '2026-09-04T09:00:00Z',
    approval_access_link: 'http://localhost:3001/onboarding/f21094ba1280ccb87201ef32098dca01',
    onboarding_link_sent_at: '2026-09-04T12:00:00Z',
    raw_onboarding_token: 'f21094ba1280ccb87201ef32098dca01',
  },
];

export default function PartnerRequestsPage() {
  const [requests, setRequests] = useState<PartnerRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSport, setSelectedSport] = useState<string>('ALL');
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Right Slide-out Drawer State
  const [activeRequest, setActiveRequest] = useState<PartnerRequestItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isResendingLink, setIsResendingLink] = useState(false);

  // 2. Approve Pop-up Modal State
  const [approvingRequest, setApprovingRequest] = useState<PartnerRequestItem | null>(null);
  const [customOnboardingLink, setCustomOnboardingLink] = useState('');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);

  // 3. Reject Pop-up Modal State
  const [rejectingRequest, setRejectingRequest] = useState<PartnerRequestItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('INCOMPLETE');
  const [rejectionNote, setRejectionNote] = useState<string>('');
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  // Toast Banner State
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    title: string;
    description: string;
  } | null>(null);

  const onboardingLinkId = useId();
  const reasonSelectId = useId();
  const rejectionNoteId = useId();

  // Fetch Requests
  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getRequests().catch(() => null);
      let combined = (data && data.length > 0) ? data : FALLBACK_PARTNER_REQUESTS;

      // Merge newly submitted partner requests from public website form
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('ibooksports_partner_requests');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const ids = new Set(parsed.map((p: any) => p.request_id));
              combined = [...parsed, ...combined.filter((c) => !ids.has(c.request_id))];
            }
          }
        } catch (e) {
          console.error('Error merging local partner requests', e);
        }
      }
      setRequests(combined);
    } catch (e) {
      console.warn('Using fallback partner requests dataset', e);
      let combined = FALLBACK_PARTNER_REQUESTS;
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('ibooksports_partner_requests');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const ids = new Set(parsed.map((p: any) => p.request_id));
              combined = [...parsed, ...combined.filter((c) => !ids.has(c.request_id))];
            }
          }
        } catch {}
      }
      setRequests(combined);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Close modals or drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (approvingRequest) setApprovingRequest(null);
        else if (rejectingRequest) setRejectingRequest(null);
        else if (activeRequest) setActiveRequest(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeRequest, approvingRequest, rejectingRequest]);

  // Open Details Slide-Out Drawer
  const handleOpenDetails = (req: PartnerRequestItem) => {
    setActiveRequest(req);
    setCopiedLink(false);
  };

  // Copy Onboarding Link Action
  const handleCopyOnboardingLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Resend Onboarding Link from Details Drawer
  const handleResendLinkFromDetails = async (req: PartnerRequestItem) => {
    setIsResendingLink(true);
    try {
      const res = await adminApi.resendOnboardingLink(req.request_id);
      setToastMessage({
        type: 'success',
        title: 'Onboarding link resent.',
        description: `A fresh invitation link was generated and emailed to ${req.requester_email}.`,
      });
      if (activeRequest && activeRequest.request_id === req.request_id) {
        setActiveRequest({
          ...activeRequest,
          approval_access_link: res.onboarding_link,
          onboarding_token_expiry: res.expires_at,
          onboarding_link_sent_at: res.link_sent_at,
          raw_onboarding_token: res.raw_token,
        });
      }
      await loadRequests();
    } catch (e: unknown) {
      const err = e as Error;
      setToastMessage({
        type: 'error',
        title: 'Failed to resend onboarding link.',
        description: err.message || 'Network error occurred.',
      });
    } finally {
      setIsResendingLink(false);
    }
  };

  // Helper to generate 64-char hex SHA-256 cryptographic token
  const generateSecureHexToken = () => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const arr = new Uint8Array(32);
      window.crypto.getRandomValues(arr);
      return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
    }
    return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  };

  // Open Approve Pop-up Modal
  const handleOpenApprove = (req: PartnerRequestItem) => {
    setApprovingRequest(req);
    const existingToken =
      req.raw_onboarding_token ||
      (req.approval_access_link && req.approval_access_link.includes('/onboarding/')
        ? req.approval_access_link.split('/onboarding/')[1]?.trim()
        : null);

    const token =
      existingToken && existingToken.length >= 32
        ? existingToken
        : generateSecureHexToken();

    const baseUrl =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'http://localhost:3000';

    setCustomOnboardingLink(`${baseUrl}/onboarding/${token}`);
    setApproveError(null);
  };

  // Submit Approval from Pop-up Modal
  const handleConfirmApprove = async () => {
    if (!approvingRequest) return;
    setIsSubmittingApproval(true);
    setApproveError(null);
    try {
      await adminApi.updateRequestStatus(approvingRequest.request_id, {
        request_status: 'APPROVED',
        approval_access_link: customOnboardingLink.trim() || undefined,
      });

      // Persist in localStorage under ibooksports_partner_requests
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('ibooksports_partner_requests');
        let parsed = stored ? JSON.parse(stored) : [];
        const found = parsed.find((p: any) => p.request_id === approvingRequest.request_id);
        if (found) {
          found.request_status = 'APPROVED';
          found.approval_access_link = customOnboardingLink.trim();
        } else {
          parsed.unshift({
            ...approvingRequest,
            request_status: 'APPROVED',
            approval_access_link: customOnboardingLink.trim(),
          });
        }
        localStorage.setItem('ibooksports_partner_requests', JSON.stringify(parsed));

        // Auto-seed application into ibooksports_onboarding_apps so it appears in /admin/onboarding
        const storedApps = localStorage.getItem('ibooksports_onboarding_apps');
        let onboardingApps = storedApps ? JSON.parse(storedApps) : [];
        const appId = approvingRequest.request_id;
        const exists = onboardingApps.some((a: any) => a.application_id === appId);
        if (!exists) {
          const newApp = {
            application_id: appId,
            status: 'PENDING_REVIEW',
            current_step: 8,
            mobile_number: Number(approvingRequest.mobile_number) || 9876543210,
            partner_details: {
              name: approvingRequest.requester_name,
              email: approvingRequest.requester_email,
              district: approvingRequest.district,
              state: approvingRequest.state,
              aadhaar_number: 'XXXX-XXXX-8921',
              address: `${approvingRequest.district}, ${approvingRequest.state}`,
            },
            business_details: {
              venue_name: approvingRequest.venue_name,
              address: `${approvingRequest.district}, ${approvingRequest.state}`,
              google_maps_url: approvingRequest.venue_location,
              gstin: '33AAAPL1298D1Z5',
              sports: (approvingRequest.sports || []).join(', '),
            },
            sports_and_courts: {
              sports: approvingRequest.sports || ['FOOTBALL'],
              courts: (approvingRequest.sports || ['Football']).map((sp: string, idx: number) => ({
                court_name: `Ground ${idx + 1} (${sp})`,
                display_name: `Pitch ${idx + 1}`,
                sports: [sp],
                regular_price: 1200,
                peak_hour_price: 1600,
                weekend_price: 1500,
              })),
            },
            bank_details: {
              account_holder_name: approvingRequest.requester_name,
              bank_name: 'HDFC Bank Ltd',
              account_number: '50200084920194',
              ifsc_code: 'HDFC0001248',
              account_type: 'CURRENT',
            },
            created_at: new Date().toISOString(),
          };
          onboardingApps.unshift(newApp);
          localStorage.setItem('ibooksports_onboarding_apps', JSON.stringify(onboardingApps));
        }
      }

      setToastMessage({
        type: 'success',
        title: 'Approved — Onboarding link created!',
        description: `Onboarding invite generated for ${approvingRequest.venue_name}. Partner can now complete facility setup.`,
      });

      if (activeRequest && activeRequest.request_id === approvingRequest.request_id) {
        setActiveRequest({
          ...activeRequest,
          request_status: 'APPROVED',
          approval_access_link: customOnboardingLink.trim() || undefined,
          onboarding_token_expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          onboarding_link_sent_at: new Date().toISOString(),
        });
      }

      setApprovingRequest(null);
      await loadRequests();
    } catch (e: unknown) {
      const err = e as Error;
      setApproveError(err.message || 'Server action failed to complete approval.');
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // Open Reject Pop-up Modal
  const handleOpenReject = (req: PartnerRequestItem) => {
    setActiveRequest(req);
    setRejectingRequest(req);
    setRejectionReason('INCOMPLETE');
    setRejectionNote('');
    setRejectionError(null);
  };

  // Submit Rejection from Pop-up Modal
  const handleConfirmReject = async () => {
    if (!rejectingRequest) return;
    setRejectionError(null);

    if (rejectionReason === 'OTHER' && !rejectionNote.trim()) {
      setRejectionError('Please provide a description note when selecting "Other" as the rejection reason.');
      return;
    }

    setIsSubmittingRejection(true);
    try {
      await adminApi.updateRequestStatus(rejectingRequest.request_id, {
        request_status: 'REJECTED',
        rejection_reason: rejectionReason,
        rejection_note: rejectionNote.trim() || undefined,
        admin_id: 'admin_super_01',
      });

      setToastMessage({
        type: 'success',
        title: 'Partner request rejected & email sent.',
        description: `Request ${rejectingRequest.request_id} marked as REJECTED. Notification sent to ${rejectingRequest.requester_email}.`,
      });

      if (activeRequest && activeRequest.request_id === rejectingRequest.request_id) {
        setActiveRequest({
          ...activeRequest,
          request_status: 'REJECTED',
          rejection_reason: rejectionReason as PartnerRequestItem['rejection_reason'],
          rejection_note: rejectionNote.trim() || undefined,
          rejected_at: new Date().toISOString(),
          rejected_by_admin_id: 'admin_super_01',
        });
      }

      setRejectingRequest(null);
      await loadRequests();
    } catch (e: unknown) {
      const err = e as Error;
      setRejectionError(err.message || 'Failed to submit rejection.');
    } finally {
      setIsSubmittingRejection(false);
    }
  };

  // KPI Calculations
  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.request_status === 'SUBMITTED').length;
  const approvedCount = requests.filter((r) => r.request_status === 'APPROVED').length;
  const rejectedCount = requests.filter((r) => r.request_status === 'REJECTED').length;

  // Filtered Requests
  const filteredRequests = requests.filter((r) => {
    if (selectedStatus !== 'ALL' && r.request_status !== selectedStatus) {
      return false;
    }
    if (selectedSport !== 'ALL') {
      const sportsList = r.sports || [];
      const hasSport = sportsList.some((s) => s.toLowerCase().includes(selectedSport.toLowerCase()));
      if (!hasSport) return false;
    }
    if (selectedCity !== 'ALL') {
      const district = (r.district || '').toLowerCase();
      if (!district.includes(selectedCity.toLowerCase())) return false;
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchId = r.request_id.toLowerCase().includes(query);
      const matchVenue = r.venue_name.toLowerCase().includes(query);
      const matchName = r.requester_name.toLowerCase().includes(query);
      const matchDistrict = (r.district || '').toLowerCase().includes(query);
      const matchState = (r.state || '').toLowerCase().includes(query);
      const matchPhone = (r.mobile_number || '').includes(query);
      const matchEmail = (r.requester_email || '').toLowerCase().includes(query);
      const matchSports = (r.sports || []).some((s) => s.toLowerCase().includes(query));
      return matchId || matchVenue || matchName || matchDistrict || matchState || matchPhone || matchEmail || matchSports;
    }
    return true;
  });

  const getSportBadgeStyle = (sport: string) => {
    const s = sport.toLowerCase();
    if (s.includes('cricket')) return 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
    if (s.includes('football')) return 'bg-sky-50 text-sky-800 border-sky-200/80';
    if (s.includes('badminton')) return 'bg-purple-50 text-purple-800 border-purple-200/80';
    if (s.includes('tennis')) return 'bg-amber-50 text-amber-800 border-amber-200/80';
    if (s.includes('pickleball') || s.includes('padel')) return 'bg-pink-50 text-pink-800 border-pink-200/80';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#021526] font-display flex items-center gap-2.5">
            <Inbox className="h-6 w-6 text-[#F94001]" />
            Partner Requests
          </h1>
          <p className="text-xs text-[#5F6368] mt-1">
            Evaluate inbound facility applications and verify onboarding credentials.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadRequests}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#CBD5E1] bg-white text-[#021526] text-xs font-bold hover:bg-[#F8F9FA] transition-all shadow-xs cursor-pointer active:scale-95"
            title="Refresh Inbound Queue"
            suppressHydrationWarning
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#F94001]' : 'text-slate-600'}`} />
            <span>Sync Queue</span>
          </button>
        </div>
      </div>

      {/* TOAST NOTIFICATION POPUP */}
      {mounted && toastMessage && typeof document !== 'undefined' && createPortal(
        <div className="fixed bottom-6 right-6 z-[100000] max-w-md p-4 rounded-2xl bg-[#021526] text-white border border-emerald-500/30 shadow-2xl flex items-start gap-3.5 animate-in slide-in-from-bottom duration-300 pointer-events-auto">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs">
            <p className="font-bold text-sm leading-tight text-white mb-0.5">{toastMessage.title}</p>
            <p className="text-slate-300 leading-relaxed">{toastMessage.description}</p>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>,
        document.body
      )}

      {/* (KPI Cards Removed for Minimal Aesthetic) */}

      {/* MINIMAL FILTER & SEARCH TOOLBAR */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 bg-white p-3 rounded-2xl border border-[#E5E7EB] shadow-2xs" suppressHydrationWarning>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full">
            {[
              { id: 'ALL', label: 'All', count: totalCount },
              { id: 'SUBMITTED', label: 'Pending', count: pendingCount },
              { id: 'APPROVED', label: 'Approved', count: approvedCount },
              { id: 'REJECTED', label: 'Declined', count: rejectedCount },
            ].map((tab) => {
              const isActive = selectedStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedStatus(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#021526] text-white shadow-sm'
                      : 'text-[#5F6368] hover:bg-slate-100'
                  }`}
                  suppressHydrationWarning
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sport Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className={`appearance-none pl-8 pr-8 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none focus:border-[#F94001] focus:ring-1 focus:ring-[#F94001] cursor-pointer transition-colors ${
                selectedSport !== 'ALL'
                  ? 'border-[#F94001] bg-orange-50 text-[#F94001]'
                  : 'border-[#E5E7EB] bg-[#F8F9FA] text-[#021526] hover:bg-white'
              }`}
            >
              <option value="ALL">All Sports</option>
              <option value="Cricket">Cricket</option>
              <option value="Football">Football</option>
              <option value="Badminton">Badminton</option>
              <option value="Tennis">Tennis</option>
              <option value="Pickleball">Pickleball</option>
            </select>
            <Trophy className={`h-3.5 w-3.5 absolute left-2.5 top-2.5 pointer-events-none transition-colors ${selectedSport !== 'ALL' ? 'text-[#F94001]' : 'text-[#5F6368]'}`} />
          </div>

          {/* City / Location Dropdown */}
          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className={`appearance-none pl-8 pr-8 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none focus:border-[#F94001] focus:ring-1 focus:ring-[#F94001] cursor-pointer transition-colors ${
                selectedCity !== 'ALL'
                  ? 'border-[#F94001] bg-orange-50 text-[#F94001]'
                  : 'border-[#E5E7EB] bg-[#F8F9FA] text-[#021526] hover:bg-white'
              }`}
            >
              <option value="ALL">All Regions</option>
              <option value="Coimbatore">Coimbatore</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Chennai">Chennai</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Kochi">Kochi</option>
              <option value="Madurai">Madurai</option>
            </select>
            <MapPin className={`h-3.5 w-3.5 absolute left-2.5 top-2.5 pointer-events-none transition-colors ${selectedCity !== 'ALL' ? 'text-[#F94001]' : 'text-[#5F6368]'}`} />
          </div>

          {/* Reset Filters Shortcut */}
          {(selectedStatus !== 'ALL' || selectedSport !== 'ALL' || selectedCity !== 'ALL' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedStatus('ALL');
                setSelectedSport('ALL');
                setSelectedCity('ALL');
                setSearchQuery('');
              }}
              className="text-xs text-[#F94001] font-bold hover:underline px-2 py-1 cursor-pointer flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" /> Reset Filters
            </button>
          )}
        </div>

        {/* Real-time Search Input */}
        <div className="relative w-full xl:w-80">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#5F6368]" />
          <input
            type="text"
            placeholder="Search venue, owner, phone, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] pl-10 pr-9 py-2 text-xs text-[#021526] placeholder-[#5F6368] focus:bg-white focus:border-[#F94001] focus:outline-none focus:ring-1 focus:ring-[#F94001] transition-all shadow-xs"
            suppressHydrationWarning
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* DATA TABLE */}
      <div id="partner-requests-table" className="rounded-2xl bg-white border border-[#E5E7EB] shadow-xs overflow-hidden scroll-mt-24 transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[900px]" suppressHydrationWarning>
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-white text-[#5F6368] font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-4 w-[110px]">Request ID</th>
                <th className="py-3.5 px-4 w-[200px]">Venue &amp; Location</th>
                <th className="py-3.5 px-4 w-[180px]">Applicant</th>
                <th className="py-3.5 px-4 w-[140px]">Contact &amp; Sports</th>
                <th className="py-3.5 px-4 w-[120px]">Submitted</th>
                <th className="py-3.5 px-4 w-[120px]">Status</th>
                <th className="py-3.5 px-4 w-[120px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-[#5F6368]">
                    <Loader2 className="h-7 w-7 animate-spin mx-auto text-[#F94001] mb-2" />
                    <p className="font-bold text-xs text-[#021526]">Loading partner requests...</p>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-[#5F6368]">
                    <Inbox className="h-9 w-9 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-sm text-[#021526]">No requests found</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStatus('ALL');
                        setSelectedSport('ALL');
                        setSelectedCity('ALL');
                        setSearchQuery('');
                      }}
                      className="mt-3 px-3 py-1.5 rounded-xl bg-[#021526] text-white text-xs font-bold hover:bg-[#F94001] transition-all cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const reqDate = req.created_at ? new Date(req.created_at) : new Date();
                  const formattedDate = !isNaN(reqDate.getTime())
                    ? reqDate.toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—';

                  const initials = req.requester_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <tr
                      key={req.request_id}
                      className="hover:bg-slate-50 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDetails(req)}
                    >
                      {/* ID */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 border border-slate-200">
                          <span className="text-[10px] text-slate-400 font-mono">#</span>
                          <span className="font-mono font-bold text-[#021526] text-xs">
                            {req.request_id}
                          </span>
                        </div>
                      </td>

                      {/* Venue & Location */}
                      <td className="py-3.5 px-4 align-middle">
                        <p className="font-bold text-[#021526] text-xs leading-snug group-hover:text-[#F94001] transition-colors truncate">
                          {req.venue_name}
                        </p>
                        <p className="text-[11px] text-[#5F6368] mt-0.5 truncate">
                          {req.district || 'Coimbatore'}, {req.state || 'Tamil Nadu'}
                        </p>
                      </td>

                      {/* Applicant */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-slate-100 text-[#021526] border border-slate-200 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <p className="font-medium text-[#021526] text-xs truncate">{req.requester_name}</p>
                        </div>
                      </td>

                      {/* Contact & Sports */}
                      <td className="py-3.5 px-4 align-middle">
                        <p className="text-[11px] text-[#021526] font-mono mb-0.5">{req.mobile_number || 'N/A'}</p>
                        <p className="text-[10px] text-[#5F6368] truncate max-w-[120px]">
                          {req.sports && req.sports.length > 0 ? req.sports.join(', ') : (req.request_type === 'BANK_CHANGE' ? 'Bank Change' : 'Court Update')}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap" suppressHydrationWarning>
                        <div className="text-[#021526] font-bold text-xs mb-0.5">
                          {formattedDate}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>{reqDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>

                      {/* Audit Status */}
                      <td className="py-3.5 px-4 align-middle">
                        {req.request_status === 'SUBMITTED' && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-600">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                            </span>
                            Pending
                          </span>
                        )}
                        {req.request_status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Approved
                          </span>
                        )}
                        {req.request_status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
                            <XCircle className="h-3.5 w-3.5" />
                            Rejected
                          </span>
                        )}
                      </td>

                      {/* Action Column */}
                      <td className="py-3.5 px-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {req.request_status === 'SUBMITTED' && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleOpenApprove(req); }}
                                title="Quick Approve"
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white transition-colors cursor-pointer"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleOpenReject(req); }}
                                title="Reject Application"
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white transition-colors cursor-pointer"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          {req.request_status === 'APPROVED' && (
                            <div className="flex items-center gap-1">
                              {req.approval_access_link ? (
                                <a
                                  href={req.approval_access_link}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Open Partner Onboarding Link"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white text-[10px] font-bold transition-colors"
                                >
                                  <Link2 className="h-3 w-3" />
                                  <span>Onboard</span>
                                </a>
                              ) : (
                                <Link
                                  href="/admin/onboarding"
                                  title="View in Partner Onboarding Module"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-800 text-slate-700 hover:text-white text-[10px] font-bold transition-colors"
                                >
                                  <Layers className="h-3 w-3" />
                                  <span>Onboarding</span>
                                </Link>
                              )}
                            </div>
                          )}
                          <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-slate-400 group-hover:text-[#021526] transition-colors ml-2">
                            Details <ChevronRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SLIDE-OUT DRAWER FROM RIGHT SIDE (OPENED BY EYE ICON) */}
      {/* ========================================================================= */}
      {mounted && activeRequest && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] top-0 left-0 right-0 bottom-0 w-screen h-screen overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={() => setActiveRequest(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
              {/* Drawer Top Header */}
              <div className="p-6 border-b border-[#E5E7EB] bg-white sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#5F6368] uppercase tracking-wider font-mono">
                      Partner Request Dossier
                    </span>
                    <h3 className="text-lg font-black text-[#021526] font-display flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[#F94001]">{activeRequest.request_id}</span>
                      <span>&bull;</span>
                      <span className="truncate max-w-[280px]">{activeRequest.venue_name}</span>
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveRequest(null)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-[#F3F4F4] transition-all"
                    title="Close Drawer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Drawer Scrollable Body Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                {/* 1. SaaS Properties Inspector (Clean Key-Value Grid) */}
                <div className="rounded-2xl bg-slate-50/70 border border-slate-200/80 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Application Properties
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        activeRequest.request_status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                          : activeRequest.request_status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-900 border-rose-200'
                          : 'bg-amber-100 text-amber-900 border-amber-200'
                      }`}
                    >
                      {activeRequest.request_status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Facility Name</span>
                      <p className="font-bold text-[#021526] text-xs truncate mt-0.5">{activeRequest.venue_name}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Request Type</span>
                      <p className="font-semibold text-[#021526] text-xs mt-0.5">
                        {activeRequest.request_type === 'BANK_CHANGE' ? 'Bank Details Change' : activeRequest.request_type === 'COURT_CHANGE' ? 'Court Addition' : `${activeRequest.number_of_courts || 1} Grounds Onboarding`}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Submitted Date</span>
                      <p className="font-semibold text-[#021526] text-xs mt-0.5">
                        {new Date(activeRequest.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Location</span>
                        <p className="font-semibold text-[#021526] text-xs mt-0.5">
                          {activeRequest.district || 'Coimbatore'}, {activeRequest.state || 'Tamil Nadu'}
                        </p>
                      </div>
                      {activeRequest.venue_location && (
                        <a
                          href={activeRequest.venue_location}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-white border border-[#E5E7EB] hover:border-[#F94001] text-slate-400 hover:text-[#F94001] transition-colors"
                          title="View on Google Maps"
                        >
                          <MapPin className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Owner & Contact Information */}
                <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4 space-y-3 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Owner &amp; Contact Information
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#021526] to-slate-700 text-white flex items-center justify-center font-black text-sm uppercase shrink-0 shadow-2xs">
                      {(activeRequest.requester_name || 'Y')[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-sm text-[#021526] leading-tight truncate">
                        {activeRequest.requester_name || 'yuteka'}
                      </p>
                      <p className="text-[11px] text-[#5F6368] font-medium">Authorized Owner</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <a
                      href={`tel:+91${activeRequest.mobile_number || '6369591821'}`}
                      className="p-2.5 rounded-xl bg-slate-50 border border-[#E5E7EB] hover:border-[#F94001] flex items-center gap-2 transition-colors cursor-pointer group"
                    >
                      <Phone className="h-3.5 w-3.5 text-slate-500 group-hover:text-[#F94001]" />
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono text-slate-400 block leading-none">Phone</span>
                        <span className="font-mono font-bold text-xs text-[#021526] group-hover:text-[#F94001] truncate block mt-0.5">
                          +91 {activeRequest.mobile_number || '6369591821'}
                        </span>
                      </div>
                    </a>
                    <a
                      href={`mailto:${activeRequest.requester_email || 'yutekahema003@gmail.com'}`}
                      className="p-2.5 rounded-xl bg-slate-50 border border-[#E5E7EB] hover:border-[#F94001] flex items-center gap-2 transition-colors cursor-pointer group truncate"
                    >
                      <Mail className="h-3.5 w-3.5 text-slate-500 group-hover:text-[#F94001] shrink-0" />
                      <div className="min-w-0 truncate">
                        <span className="text-[10px] font-mono text-slate-400 block leading-none">Email</span>
                        <span className="font-semibold text-[11px] text-[#021526] group-hover:text-[#F94001] truncate block mt-0.5">
                          {activeRequest.requester_email || 'yutekahema003@gmail.com'}
                        </span>
                      </div>
                    </a>
                  </div>
                </div>

                {/* 3. Conditional Audit Dossier */}
                {activeRequest.request_type === 'BANK_CHANGE' && activeRequest.bank_details && (
                  <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] space-y-3 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Proposed Bank Account Specifications
                    </span>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">Bank Name</span>
                        <span className="font-bold text-[#021526] text-[13px]">{activeRequest.bank_details.bank_name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">Beneficiary Name</span>
                        <span className="font-bold text-[#021526] text-[13px]">{activeRequest.bank_details.account_holder_name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">Account Number</span>
                        <span className="font-mono font-bold text-[#021526] text-xs">
                          {activeRequest.bank_details.account_number}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">IFSC Code</span>
                        <span className="font-mono font-bold text-[#021526]">{activeRequest.bank_details.ifsc_code}</span>
                      </div>
                      <div className="col-span-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">Reason for Update</span>
                        <span className="text-slate-700 font-medium leading-relaxed block">{activeRequest.bank_details.reason_for_change}</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeRequest.request_type === 'COURT_CHANGE' && activeRequest.court_details && (
                  <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] space-y-3 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Proposed Court / Pitch Specifications
                    </span>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">Court Name</span>
                        <span className="font-bold text-[#021526] text-[13px]">{activeRequest.court_details.court_name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">Base Hourly Rate</span>
                        <span className="font-bold text-[#021526] text-[13px]">₹{activeRequest.court_details.hourly_rate} / hr</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">Sport &amp; Surface</span>
                        <span className="font-medium text-[#021526]">{activeRequest.court_details.sport_type} &middot; {activeRequest.court_details.surface_type}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">Environment</span>
                        <span className="font-medium text-[#021526]">
                          {activeRequest.court_details.indoor_outdoor === 'INDOOR' ? 'Indoor' : 'Outdoor'} &middot; {activeRequest.court_details.lighting_available ? 'Lit' : 'Unlit'}
                        </span>
                      </div>
                      {activeRequest.court_details.remarks && (
                        <div className="col-span-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                          <span className="text-[10px] font-bold uppercase text-slate-500 block">Operational Remarks</span>
                          <span className="text-slate-700 font-medium leading-relaxed block">{activeRequest.court_details.remarks}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(!activeRequest.request_type || activeRequest.request_type === 'ONBOARDING') && activeRequest.sports && activeRequest.sports.length > 0 && (
                  <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] space-y-3 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Facility Sports Setup
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {activeRequest.sports.map((sp) => (
                        <span
                          key={sp}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-[#F8F9FA] text-[#021526] border border-[#CBD5E1] shadow-2xs"
                        >
                          {sp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* CONDITIONAL: ONBOARDING LINK STATUS IF APPROVED */}

                {/* CONDITIONAL: ONBOARDING LINK STATUS IF APPROVED */}
                {activeRequest.request_status === 'APPROVED' && (!activeRequest.request_type || activeRequest.request_type === 'ONBOARDING') && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-900 font-bold">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Onboarding Link &amp; Invite Status</span>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-200/70 text-emerald-900">
                        {activeRequest.onboarding_token_used_at ? 'Used' : 'Active (Single-Use)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-emerald-900">
                      <div>
                        Sent Date:{' '}
                        <strong>
                          {activeRequest.onboarding_link_sent_at
                            ? new Date(activeRequest.onboarding_link_sent_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : 'On Approval'}
                        </strong>
                      </div>
                      <div>
                        Token Expiry:{' '}
                        <strong>
                          {activeRequest.onboarding_token_expiry
                            ? new Date(activeRequest.onboarding_token_expiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '7 Days'}
                        </strong>
                      </div>
                    </div>

                    {activeRequest.approval_access_link && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={activeRequest.approval_access_link}
                            className="flex-1 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-[11px] font-mono text-[#021526] select-all shadow-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleCopyOnboardingLink(activeRequest.approval_access_link!)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all flex items-center gap-1 shrink-0 shadow-xs active:scale-95"
                          >
                            {copiedLink ? (
                              <>
                                <Check className="h-3.5 w-3.5" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" /> Copy Link
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-emerald-200/60">
                      <span className="text-[10px] text-emerald-800">
                        Generate fresh token &amp; re-send:
                      </span>
                      <button
                        type="button"
                        disabled={isResendingLink}
                        onClick={() => handleResendLinkFromDetails(activeRequest)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 underline disabled:opacity-50"
                      >
                        {isResendingLink ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Resending...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3.5 w-3.5" /> Resend Onboarding Link
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* CONDITIONAL: APPROVED STATUS FOR BANK & COURT REQUESTS */}
                {activeRequest.request_status === 'APPROVED' && activeRequest.request_type && activeRequest.request_type !== 'ONBOARDING' && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>
                        {activeRequest.request_type === 'BANK_CHANGE'
                          ? 'Bank Account Update Approved'
                          : 'Court Addition Request Approved'}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      The proposed specifications have been verified and approved by administration. An automated confirmation email was dispatched to <strong>{activeRequest.requester_email}</strong> and the status is synchronized on the vendor portal.
                    </p>
                  </div>
                )}

                {/* CONDITIONAL: REJECTION REASON DISPLAY */}
                {activeRequest.request_status === 'REJECTED' && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2.5">
                    <div className="flex items-center gap-2 text-rose-900 font-bold">
                      <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
                      <span>
                        {activeRequest.request_type === 'BANK_CHANGE'
                          ? 'Bank Details Reject Reason'
                          : activeRequest.request_type === 'COURT_CHANGE'
                          ? 'Court Details Reject Reason'
                          : 'Rejection Reason Audit Record'}
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-800">
                      This exact rejection reason was dispatched via automated HTML email to <strong>{activeRequest.requester_email}</strong> and is displayed on the vendor support portal.
                    </p>
                    <div className="p-3.5 rounded-xl bg-white border border-rose-200 text-xs space-y-1.5 shadow-2xs">
                      <p>
                        <strong>Reason Category:</strong>{' '}
                        <span className="font-mono text-rose-700 font-bold">
                          {activeRequest.rejection_reason || 'INCOMPLETE'}
                        </span>
                      </p>
                      {activeRequest.rejection_note && (
                        <p>
                          <strong>
                            {activeRequest.request_type === 'BANK_CHANGE'
                              ? 'Bank Details Reject Note:'
                              : activeRequest.request_type === 'COURT_CHANGE'
                              ? 'Court Details Reject Note:'
                              : 'Rejection Note:'}
                          </strong>{' '}
                          <span className="text-[#021526] font-medium">{activeRequest.rejection_note}</span>
                        </p>
                      )}
                      {activeRequest.rejected_by_admin_id && (
                        <p className="text-[10px] text-slate-400 pt-1">
                          Rejected by: {activeRequest.rejected_by_admin_id} &bull; {activeRequest.rejected_at ? new Date(activeRequest.rejected_at).toLocaleString() : 'Recorded'}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* REJECTION FORM INLINE */}
                {rejectingRequest?.request_id === activeRequest.request_id && (
                  <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2 text-rose-700 font-bold text-sm border-b border-rose-200 pb-2">
                      <XCircle className="h-5 w-5" />
                      Rejection Details
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label htmlFor={reasonSelectId} className="font-bold text-[#021526] text-xs block mb-1">
                          Reason Category <span className="text-rose-600">*</span>
                        </label>
                        <select
                          id={reasonSelectId}
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-xs text-[#021526] focus:border-[#F94001] focus:outline-none shadow-xs"
                        >
                          {REJECTION_REASON_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor={rejectionNoteId} className="font-bold text-[#021526] text-xs block mb-1">
                          Correction Note <span className="text-rose-600">*</span>
                        </label>
                        <textarea
                          id={rejectionNoteId}
                          rows={3}
                          value={rejectionNote}
                          onChange={(e) => setRejectionNote(e.target.value)}
                          placeholder="Explain why this is rejected and what needs to be corrected..."
                          className="w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-xs text-[#021526] focus:border-[#F94001] focus:outline-none shadow-xs"
                        />
                      </div>
                    </div>

                    {rejectionError && (
                      <div className="p-2.5 rounded-lg bg-rose-100 border border-rose-200 text-[11px] font-medium text-rose-800 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{rejectionError}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Drawer Bottom Footer with APPROVE and REJECT Buttons with Strict Status Logic */}
              <div className="p-4 sm:p-6 border-t border-[#E5E7EB] bg-[#F8F9FA] flex items-center justify-between gap-3 sticky bottom-0 z-10">
                {rejectingRequest?.request_id === activeRequest.request_id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setRejectingRequest(null)}
                      className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-xs font-bold text-[#5F6368] hover:bg-[#F3F4F4] transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingRejection || !rejectionNote.trim()}
                      onClick={handleConfirmReject}
                      className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isSubmittingRejection ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Rejecting...
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4" /> Confirm Reject &amp; Notify
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    {/* 1. REJECT BUTTON LOGIC */}
                    {activeRequest.request_status === 'APPROVED' ? (
                      <button
                        type="button"
                        disabled
                        title="Approved requests cannot be rejected as an onboarding invite has already been issued"
                        className="px-5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 font-bold text-xs flex items-center gap-1.5 cursor-not-allowed opacity-60"
                      >
                        <XCircle className="h-4 w-4 text-slate-300" />
                        <span>Reject</span>
                      </button>
                    ) : activeRequest.request_status === 'REJECTED' ? (
                      <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                        <XCircle className="h-4 w-4 text-rose-600" />
                        <span>Request Rejected</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenReject(activeRequest)}
                        className="px-5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </button>
                    )}

                    {/* 2. APPROVE BUTTON LOGIC */}
                    {activeRequest.request_status === 'APPROVED' ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>Approved</span>
                        </div>
                        <button
                          type="button"
                          disabled={isResendingLink}
                          onClick={() => handleResendLinkFromDetails(activeRequest)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer disabled:opacity-50 transition-all"
                        >
                          {isResendingLink ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Resending...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-3.5 w-3.5" /> Resend Link
                            </>
                          )}
                        </button>
                      </div>
                    ) : activeRequest.request_status === 'REJECTED' ? (
                      <button
                        type="button"
                        disabled
                        title="Rejected requests cannot be directly approved without partner re-application"
                        className="px-6 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 font-bold text-xs flex items-center gap-2 cursor-not-allowed opacity-60"
                      >
                        <Check className="h-4 w-4 text-slate-300" />
                        <span>Approve &amp; Send Link</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenApprove(activeRequest)}
                        className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                      >
                        <Check className="h-4 w-4" /> Approve &amp; Send Link
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* 2. APPROVE POP-UP MODAL (TOP-LEVEL OVERLAY z-[10000]) */}
      {/* ========================================================================= */}
      {mounted && approvingRequest && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="approve-modal-title"
          className="fixed inset-0 z-[10000] top-0 left-0 right-0 bottom-0 w-screen h-screen bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 border border-[#E5E7EB]">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-base">
                <CheckCircle2 className="h-5 w-5" />
                <span id="approve-modal-title">
                  {approvingRequest.request_type === 'BANK_CHANGE'
                    ? 'Approve Bank Details Change'
                    : approvingRequest.request_type === 'COURT_CHANGE'
                    ? 'Approve Court Addition Request'
                    : 'Approve Partner Onboarding Request'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setApprovingRequest(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-[#F3F4F4]"
                aria-label="Cancel approval"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-[#021526]">
              {/* Clean Confirmation Copy */}
              <p className="text-sm font-semibold text-[#021526] leading-relaxed">
                {approvingRequest.request_type === 'BANK_CHANGE'
                  ? `Approve updated bank account specifications for ${approvingRequest.venue_name}? Automated approval confirmation email will be dispatched to `
                  : approvingRequest.request_type === 'COURT_CHANGE'
                  ? `Approve court listing request for ${approvingRequest.venue_name}? Automated approval confirmation email will be dispatched to `
                  : `Approve ${approvingRequest.venue_name}? An onboarding invite will be emailed to `}
                <strong className="text-[#F94001]">{approvingRequest.requester_email}</strong>.
              </p>

              {/* Onboarding Link Input Box ONLY for Onboarding requests */}
              {(!approvingRequest.request_type || approvingRequest.request_type === 'ONBOARDING') && (
                <div className="space-y-1.5">
                  <label
                    htmlFor={onboardingLinkId}
                    className="font-bold text-[#021526] flex items-center gap-1.5 text-xs"
                  >
                    <Link2 className="h-3.5 w-3.5 text-[#F94001]" />
                    Onboarding Access Link (Single-use &bull; 7-day validity)
                  </label>
                  <input
                    id={onboardingLinkId}
                    type="text"
                    value={customOnboardingLink}
                    onChange={(e) => setCustomOnboardingLink(e.target.value)}
                    placeholder="http://localhost:3000/onboarding/752bca5f7e68c4c3540d0dec4df796ae13b907c0a12ff68ec9684afbc0bdd416"
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] px-3.5 py-2.5 text-xs font-mono text-[#021526] focus:border-[#F94001] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F94001] transition-all shadow-xs"
                  />
                  <p className="text-[11px] text-[#5F6368]">
                    A cryptographically hashed SHA-256 token will be generated and dispatched automatically via HTML email.
                  </p>
                </div>
              )}

              {/* Email Notification Alert for Bank / Court */}
              {(approvingRequest.request_type === 'BANK_CHANGE' || approvingRequest.request_type === 'COURT_CHANGE') && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1 text-xs">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <Mail className="h-4 w-4 text-emerald-700" />
                    <span>Instant Email Dispatch &amp; Vendor Sync</span>
                  </div>
                  <p className="text-emerald-800 text-[11.5px] leading-relaxed">
                    TurfTown dispatch system will immediately send the official approval email with the Request ID pill (<strong>{approvingRequest.request_id}</strong>) and update the live status on the vendor portal.
                  </p>
                </div>
              )}

              {approveError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{approveError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setApprovingRequest(null)}
                className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-xs font-bold text-[#5F6368] hover:bg-[#F3F4F4] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingApproval}
                onClick={handleConfirmApprove}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingApproval ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Approving &amp; Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" /> Confirm Approval &amp; Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* REJECT MODAL REMOVED - REJECTION NOW HAPPENS INSIDE THE SLIDE-OUT DRAWER */}
    </div>
  );
}
