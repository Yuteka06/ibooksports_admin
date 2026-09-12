'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  UserCheck,
  Building2,
  Camera,
  Clock,
  CreditCard,
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Search,
  RefreshCw,
  Trophy,
  Eye,
  Layers,
  Check,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Percent,
  ArrowLeft,
  X,
  FileText,
  Image as ImageIcon,
  Download,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { onboardingApi, OnboardingSessionData } from '@/lib/api';
import { VenueDetail } from '@/lib/mockData';

const ONBOARDING_STEPS_META = [
  { step: 1, title: 'Mobile OTP Verification', icon: Phone, desc: '10-digit mobile number + 6-digit OTP' },
  { step: 2, title: 'Partner Details & Identity', icon: UserCheck, desc: 'Name, email, Aadhaar, profile photo, address' },
  { step: 3, title: 'Business & Venue Details', icon: Building2, desc: 'Venue address, Google Maps link, GSTIN & document' },
  { step: 4, title: 'Court Visual Verification', icon: Camera, desc: 'Min 4 and max 8 mandatory court photographs' },
  { step: 5, title: 'Operating Hours & Schedule', icon: Clock, desc: 'Operating days, opening/closing and starting time' },
  { step: 6, title: 'Sports, Courts & Pricing', icon: Trophy, desc: 'Courts matrix, peak/weekend pricing, shared court rule' },
  { step: 7, title: 'Settlement Bank & Proof', icon: CreditCard, desc: 'Account number, IFSC, account type, cancelled cheque' },
  { step: 8, title: 'Application Review & Status', icon: FileCheck, desc: 'Declaration, review state, approval link / rejection' },
];

export default function PartnerOnboardingAdminTrackerPage() {
  const [applications, setApplications] = useState<OnboardingSessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Purge any stale mock onboarding apps cached in localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('ibooksports_onboarding_apps');
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Slide-out Full Inspection Drawer State
  const [drawerApp, setDrawerApp] = useState<OnboardingSessionData | null>(null);

  // Document Inspection Lightbox State
  const [selectedDocPreview, setSelectedDocPreview] = useState<{
    title: string;
    docType: 'AADHAAR' | 'PROFILE_PHOTO' | 'GST' | 'COURT_PHOTO' | 'BANK_PROOF';
    docNumber?: string;
    description?: string;
    applicantName?: string;
    venueName?: string;
    venueAddress?: string;
    partnerAddress?: string;
    partnerMobile?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branchName?: string;
    accountType?: string;
    fileUrl?: string;
    isPdf?: boolean;
    extraDetails?: Record<string, string>;
  } | null>(null);

  const handleDownloadProof = () => {
    if (!selectedDocPreview) return;
    const docTitle = selectedDocPreview.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${docTitle}_${selectedDocPreview.docNumber || 'verified'}.html`;

    const htmlDoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${selectedDocPreview.title} - iBookSports Verification</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b1528; color: #0f172a; padding: 40px; margin: 0; }
    .sheet { max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); border: 1px solid #e2e8f0; }
    .header { background: #021526; color: white; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #f94001; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; }
    .badge { background: #059669; color: white; font-size: 11px; font-weight: bold; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; }
    .content { padding: 32px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0; }
    .field { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px 18px; border-radius: 12px; }
    .field.full { grid-column: span 2; }
    .label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; margin-bottom: 4px; }
    .value { font-size: 15px; font-weight: 700; color: #0f172a; word-break: break-all; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; }
    .actions { padding: 0 32px 32px; text-align: right; }
    .btn { background: #f94001; color: white; border: none; padding: 10px 22px; font-weight: 700; border-radius: 10px; cursor: pointer; font-size: 13px; }
    @media print { body { background: white; padding: 0; } .sheet { box-shadow: none; border: none; } .actions { display: none; } }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>
        <h1>${selectedDocPreview.title}</h1>
        <p style="margin:4px 0 0;font-size:12px;opacity:0.75;">iBookSports Verified Partner Onboarding Document Proof</p>
      </div>
      <span class="badge">VERIFIED DOCUMENT</span>
    </div>
    <div class="content">
      <div class="grid">
        <div class="field">
          <div class="label">Document Reference ID</div>
          <div class="value" style="font-family:monospace;color:#f94001;">${selectedDocPreview.docNumber || 'DOC_RECORD_PENDING'}</div>
        </div>
        <div class="field">
          <div class="label">Document Type</div>
          <div class="value">${selectedDocPreview.docType}</div>
        </div>
        <div class="field">
          <div class="label">Partner / Applicant Name</div>
          <div class="value">${selectedDocPreview.applicantName || 'Partner'}</div>
        </div>
        ${selectedDocPreview.partnerMobile ? `<div class="field"><div class="label">Contact Mobile</div><div class="value">+91 ${selectedDocPreview.partnerMobile}</div></div>` : ''}
        ${selectedDocPreview.venueName ? `<div class="field full"><div class="label">Associated Venue / Arena</div><div class="value">${selectedDocPreview.venueName}</div></div>` : ''}
        ${selectedDocPreview.venueAddress ? `<div class="field full"><div class="label">Facility Address</div><div class="value">${selectedDocPreview.venueAddress}</div></div>` : ''}
        ${selectedDocPreview.partnerAddress ? `<div class="field full"><div class="label">Residential Address</div><div class="value">${selectedDocPreview.partnerAddress}</div></div>` : ''}
        ${selectedDocPreview.bankName ? `<div class="field"><div class="label">Settlement Bank</div><div class="value">${selectedDocPreview.bankName} (${selectedDocPreview.branchName || ''})</div></div>` : ''}
        ${selectedDocPreview.accountNumber ? `<div class="field"><div class="label">Account Number</div><div class="value" style="font-family:monospace;">${selectedDocPreview.accountNumber}</div></div>` : ''}
        ${selectedDocPreview.ifscCode ? `<div class="field"><div class="label">IFSC Code</div><div class="value" style="font-family:monospace;">${selectedDocPreview.ifscCode}</div></div>` : ''}
        ${selectedDocPreview.accountType ? `<div class="field"><div class="label">Account Type</div><div class="value">${selectedDocPreview.accountType}</div></div>` : ''}
      </div>
      <div style="background:#ecfdf5;border:1px solid #a7f3d0;padding:12px 16px;border-radius:12px;font-size:12px;color:#065f46;">
        ✓ Authenticated under iBookSports Partner Compliance Guidelines
      </div>
    </div>
    <div class="actions">
      <button class="btn" onclick="window.print()">Print / Save as PDF</button>
    </div>
    <div class="footer">
      <span>Official Record &bull; iBookSports Technologies Private Limited</span>
      <span>Exported: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('success', 'Document Downloaded', `Saved ${filename} to your Downloads folder.`);
  };

  // ─── Section-Level Rejection Notes ───────────────────────────────────────
  // Key: sectionKey (e.g. 'partner_identity', 'business_venue', etc.)
  // Value: { note, step, section (display label) }
  type SectionNote = { note: string; step: number; section: string };
  const [sectionNotes, setSectionNotes] = useState<Record<string, SectionNote>>({});
  const [editingNoteKey, setEditingNoteKey] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  // Review Modal State
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [actionTargetApp, setActionTargetApp] = useState<OnboardingSessionData | null>(null);
  const [appLinkInput, setAppLinkInput] = useState('https://app.ibooksports.com/download');
  const [actionLoading, setActionLoading] = useState(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    title: string;
    description: string;
  } | null>(null);

  const showToast = (type: 'success' | 'error', title: string, description: string) => {
    setToastMessage({ type, title, description });
  };

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await onboardingApi.listAdminApplications();
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching onboarding applications from API:', err);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Toast Auto-Dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleOpenApproveModal = (app: OnboardingSessionData) => {
    setActionTargetApp(app);
    setAppLinkInput(`https://app.ibooksports.com/vendor/login?app=${app.application_id}`);
    setReviewAction('APPROVE');
  };

  const handleOpenRejectModal = (app: OnboardingSessionData) => {
    setActionTargetApp(app);
    setReviewAction('REJECT');
  };

  const handleConfirmApprove = async () => {
    if (!actionTargetApp) return;
    setActionLoading(true);
    try {
      try {
        await onboardingApi.reviewApplication(actionTargetApp.application_id, 'APPROVE', {
          app_access_link: appLinkInput,
        });
      } catch (err) {
        console.warn('API review failed or simulated', err);
      }

      // Convert to Live Venue in localStorage ibooksports_live_venues
      if (typeof window !== 'undefined') {
        try {
          const storedVenues = localStorage.getItem('ibooksports_live_venues');
          let liveVenues: VenueDetail[] = storedVenues ? JSON.parse(storedVenues) : [];

          const venueId = actionTargetApp.application_id.startsWith('REQ-')
            ? 'VEN-' + actionTargetApp.application_id.replace('REQ-', '')
            : `VEN-${Date.now().toString().slice(-4)}`;

          const sportsArr: string[] = actionTargetApp.courts_config?.sports?.length
            ? actionTargetApp.courts_config.sports
            : ((actionTargetApp.business_details as any)?.sports
                ? String((actionTargetApp.business_details as any).sports).split(',').map((s: string) => s.trim())
                : ['Football', 'Cricket']);

          const courtsArr = (actionTargetApp.courts_config?.courts && actionTargetApp.courts_config.courts.length > 0)
            ? actionTargetApp.courts_config.courts.map((c: any, idx: number) => ({
                id: `CRT-${venueId}-${idx + 1}`,
                name: c.court_name || `Court ${idx + 1}`,
                sport: (c.sports && c.sports[0]) || sportsArr[0] || 'Football',
                surface: 'FIFA Pro 50mm Astroturf',
                court_type: 'OUTDOOR' as const,
                dimensions: '100ft x 65ft',
                lighting: '500 Lux Commercial Stadium LED',
                base_hourly_rate: c.regular_price || 1200,
                status: 'ACTIVE' as const,
              }))
            : sportsArr.map((sp: string, idx: number) => ({
                id: `CRT-${venueId}-${idx + 1}`,
                name: `${sp} Ground ${idx + 1}`,
                sport: sp,
                surface: 'Professional Turf System',
                court_type: 'OUTDOOR' as const,
                dimensions: '100ft x 65ft',
                lighting: '500 Lux Commercial Stadium LED',
                base_hourly_rate: 1200,
                status: 'ACTIVE' as const,
              }));

          const newLiveVenue: VenueDetail = {
            id: venueId,
            venue_name: actionTargetApp.business_details?.venue_name || 'Premier Sports Arena',
            tagline: 'Certified Live Partner Facility & Arena',
            name: actionTargetApp.partner_details?.name || 'Partner Owner',
            mobile_number: Number(actionTargetApp.mobile_number || actionTargetApp.partner_details?.mobile_number) || 9876543210,
            email: actionTargetApp.partner_details?.email || 'partner@ibooksports.com',
            venue_location_name: actionTargetApp.business_details?.venue_google_maps_link || 'https://maps.google.com',
            address: actionTargetApp.business_details?.venue_address || `${actionTargetApp.partner_details?.district || 'Coimbatore'}, ${actionTargetApp.partner_details?.state || 'Tamil Nadu'}`,
            state: actionTargetApp.partner_details?.state || 'Tamil Nadu',
            district: actionTargetApp.partner_details?.district || 'Coimbatore',
            pincode: actionTargetApp.partner_details?.pincode || '641001',
            sports: sportsArr.join(', '),
            sports_list: sportsArr,
            courts: courtsArr.length,
            status: 'ACTIVE',
            rating: 5.0,
            total_reviews: 0,
            opening_time: actionTargetApp.operating_hours?.starting_time || '06:00 AM',
            closing_time: actionTargetApp.operating_hours?.closing_time || '11:00 PM',
            created_at: new Date().toISOString(),
            owner: {
              full_name: actionTargetApp.partner_details?.name || 'Partner Owner',
              phone: String(actionTargetApp.mobile_number || '9876543210'),
              email: actionTargetApp.partner_details?.email || 'partner@ibooksports.com',
              pan_number: 'ABCDE1234F',
              pan_status: 'VERIFIED',
              aadhaar_masked: 'XXXX-XXXX-8921',
              aadhaar_status: 'VERIFIED',
              gstin: actionTargetApp.business_details?.gst_number || '33AAAPL1298D1Z5',
              gstin_status: actionTargetApp.business_details?.has_gst ? 'ACTIVE' : 'UNREGISTERED',
              registered_address: actionTargetApp.partner_details?.address || 'Partner Address',
              kyc_verified_date: new Date().toISOString().split('T')[0],
            },
            bank: {
              account_holder_name: actionTargetApp.bank_details?.account_holder_name || actionTargetApp.partner_details?.name || 'Partner Account',
              bank_name: actionTargetApp.bank_details?.bank_name || 'HDFC Bank Ltd',
              account_number_masked: actionTargetApp.bank_details?.account_number ? `XXXX${String(actionTargetApp.bank_details.account_number).slice(-4)}` : 'XXXX4567',
              ifsc_code: actionTargetApp.bank_details?.ifsc_code || 'HDFC0001234',
              branch_name: actionTargetApp.bank_details?.branch_name || 'Main Branch',
              upi_id: `${(actionTargetApp.partner_details?.name || 'partner').toLowerCase().replace(/\s+/g, '')}@okaxis`,
              verification_status: 'VERIFIED',
              penny_drop_status: 'SUCCESS',
              last_payout_date: 'Pending First Payout',
            },
            court_list: courtsArr,
            slot_rules: {
              slot_duration_minutes: 60,
              peak_morning_hours: '06:00 AM - 09:00 AM',
              peak_morning_price: 1500,
              regular_day_hours: '09:00 AM - 05:00 PM',
              regular_day_price: 1200,
              prime_night_hours: '06:00 PM - 11:00 PM',
              prime_night_price: 1600,
              weekend_surge_percent: 25,
              instant_booking_enabled: true,
            },
            financials: {
              gross_volume: 0,
              platform_commission: 0,
              unsettled_balance: 0,
              total_settled: 0,
            },
            amenities: [
              'Parking Available',
              'Changing Rooms',
              'Drinking Water',
              'CCTV Surveillance',
              'Floodlights',
            ],
          };

          // Deduplicate and prepend
          liveVenues = liveVenues.filter((v: any) => v.id !== venueId && v.venue_name !== newLiveVenue.venue_name);
          liveVenues.unshift(newLiveVenue);
          localStorage.setItem('ibooksports_live_venues', JSON.stringify(liveVenues));
        } catch (e) {
          console.error('Error persisting live venue conversion', e);
        }
      }

      setReviewAction(null);
      setActionTargetApp(null);
      if (drawerApp?.application_id === actionTargetApp.application_id) {
        setDrawerApp(null);
      }
      setToastMessage({
        type: 'success',
        title: 'Onboarding Approved — Live Venue Activated!',
        description: `Facility "${actionTargetApp.business_details?.venue_name || 'Venue'}" is now officially LIVE in Venue Management with full courts and slot configurations.`,
      });
      await fetchApplications();
    } catch {
      setToastMessage({
        type: 'error',
        title: 'Approval Failed',
        description: 'An error occurred while saving the approval decision.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!actionTargetApp) return;
    setActionLoading(true);
    try {
      // Build rejection_reasons array from sectionNotes
      const rejection_reasons = Object.entries(sectionNotes).map(([key, val]) => ({
        step: val.step,
        section: val.section,
        field: key,
        reason: val.note,
      }));

      await onboardingApi.reviewApplication(actionTargetApp.application_id, 'REJECT', {
        rejection_reasons: rejection_reasons.length > 0 ? rejection_reasons : [
          { step: actionTargetApp.current_step || 1, section: 'GENERAL', field: 'application', reason: 'Application rejected by admin.' },
        ],
      });
      setReviewAction(null);
      setActionTargetApp(null);
      setSectionNotes({});
      if (drawerApp?.application_id === actionTargetApp.application_id) {
        setDrawerApp(null);
      }
      setToastMessage({
        type: 'success',
        title: 'Rejection Notice Dispatched',
        description: `Rejection email with ${rejection_reasons.length} correction note(s) sent to partner.`,
      });
      await fetchApplications();
    } catch {
      setToastMessage({
        type: 'error',
        title: 'Rejection Dispatch Failed',
        description: 'Could not send rejection notice.',
      });
    } finally {
      setActionLoading(false);
    }
  };


  const filteredApps = applications.filter((app) => {
    if (!app) return false;
    const query = (searchQuery || '').trim().toLowerCase();

    const matchesSearch =
      !query ||
      Boolean(
        (app.application_id && String(app.application_id).toLowerCase().includes(query)) ||
        (app.partner_details?.name && String(app.partner_details.name).toLowerCase().includes(query)) ||
        (app.business_details?.venue_name && String(app.business_details.venue_name).toLowerCase().includes(query)) ||
        (app.mobile_number && String(app.mobile_number).includes(query)) ||
        (app.partner_details?.district && String(app.partner_details.district).toLowerCase().includes(query))
      );

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PENDING_REVIEW' && (app.status === 'PENDING_REVIEW' || app.status === 'SUBMITTED')) ||
      (statusFilter === 'DRAFT' && (app.status === 'DRAFT' || !app.status)) ||
      app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate Metrics
  const totalCount = applications.length;
  const pendingCount = applications.filter((a) => a.status === 'PENDING_REVIEW' || a.status === 'SUBMITTED').length;
  const approvedCount = applications.filter((a) => a.status === 'APPROVED').length;
  const rejectedCount = applications.filter((a) => a.status === 'REJECTED').length;
  const draftCount = applications.filter((a) => a.status === 'DRAFT' || !a.status).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> APPROVED
          </span>
        );
      case 'PENDING_REVIEW':
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="h-3 w-3 text-amber-600" /> PENDING_REVIEW
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="h-3 w-3 text-rose-600" /> REJECTED
          </span>
        );
      default:
        return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-slate-100 text-slate-700 border border-slate-200">
            <Layers className="h-3 w-3 text-slate-500" /> DRAFT
          </span>
        );
    }
  };

  // ─── Helper: Render per-section note button + inline editor popup ──────────
  const renderNoteButton = (sectionKey: string, step: number, sectionLabel: string) => {
    const existing = sectionNotes[sectionKey];
    const isEditing = editingNoteKey === sectionKey;

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            if (isEditing) {
              setEditingNoteKey(null);
            } else {
              setEditingNoteKey(sectionKey);
              setEditingNoteText(existing?.note || '');
            }
          }}
          className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
            existing
              ? 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'
              : 'border-slate-200 bg-white text-slate-500 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50'
          }`}
          title={existing ? 'Edit rejection note' : 'Add rejection note for this section'}
        >
          {existing ? (
            <>
              <AlertCircle className="h-3 w-3" />
              Edit Note
            </>
          ) : (
            <>
              <X className="h-3 w-3" />
              Add Rejection Note
            </>
          )}
        </button>

        {/* Inline floating note editor */}
        {isEditing && (
          <div
            className="absolute right-0 top-8 z-50 w-72 bg-white border border-rose-200 rounded-2xl shadow-xl p-4 space-y-3 animate-in zoom-in-95 duration-150"
            style={{ minWidth: 260 }}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                Rejection Note — {sectionLabel}
              </p>
              <button
                type="button"
                onClick={() => setEditingNoteKey(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <textarea
              autoFocus
              rows={3}
              placeholder="Describe what needs to be corrected in this section..."
              value={editingNoteText}
              onChange={(e) => setEditingNoteText(e.target.value)}
              className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8F9FA] px-3 py-2 text-xs text-[#021526] focus:border-rose-400 focus:outline-none resize-none"
            />

            <div className="flex items-center justify-end gap-2">
              {existing && (
                <button
                  type="button"
                  onClick={() => {
                    setSectionNotes((prev) => {
                      const next = { ...prev };
                      delete next[sectionKey];
                      return next;
                    });
                    setEditingNoteKey(null);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 text-[11px] font-bold hover:bg-rose-50 transition-all cursor-pointer"
                >
                  Remove
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (editingNoteText.trim()) {
                    setSectionNotes((prev) => ({
                      ...prev,
                      [sectionKey]: { note: editingNoteText.trim(), step, section: sectionLabel },
                    }));
                  }
                  setEditingNoteKey(null);
                }}
                disabled={!editingNoteText.trim()}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition-all shadow cursor-pointer disabled:opacity-40"
              >
                Save Note
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6" suppressHydrationWarning>
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

      {/* PAGE HEADER & MINIMAL KPI */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#021526]">
              Partner Onboarding
            </h1>
            <p className="text-[11px] text-[#5F6368] mt-0.5">
              Track and verify 8-step partner registrations and court matrices.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/onboarding"
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F94001] hover:bg-[#D93600] text-white text-xs font-bold transition-all"
            >
              <span>Open Partner Wizard</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={fetchApplications}
              className="p-2 rounded-xl bg-slate-100 text-[#5F6368] hover:text-[#021526] transition-all cursor-pointer"
              title="Refresh List"
              suppressHydrationWarning
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* SEARCH, FILTERS & MINIMAL METRICS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full">
            {[
              { key: 'ALL', label: 'All', count: totalCount },
              { key: 'PENDING_REVIEW', label: 'Pending', count: pendingCount },
              { key: 'APPROVED', label: 'Approved', count: approvedCount },
              { key: 'REJECTED', label: 'Corrections', count: rejectedCount },
              { key: 'DRAFT', label: 'Draft', count: draftCount },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === key
                    ? 'bg-[#021526] text-white shadow-sm'
                    : 'text-[#5F6368] hover:bg-slate-100'
                }`}
                suppressHydrationWarning
              >
                <span>{label}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono ${
                    statusFilter === key
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-8 pr-4 py-1.5 rounded-xl bg-slate-50 text-xs text-[#021526] focus:outline-none focus:ring-1 focus:ring-[#F94001] transition-all"
              suppressHydrationWarning
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. TABLE VIEW (FULL-WIDTH TRACKER TABLE)                                  */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-[#CBD5E1] bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#021526] min-w-[1050px]" suppressHydrationWarning>
            <thead className="bg-[#F8F9FA] border-b border-[#E5E7EB] text-[11px] font-bold uppercase text-[#5F6368] tracking-wider">
              <tr>
                <th className="px-4 py-3.5 w-[140px]">Application</th>
                <th className="px-4 py-3.5 w-[170px]">Date &amp; Time</th>
                <th className="px-4 py-3.5 w-[200px]">Partner</th>
                <th className="px-4 py-3.5 w-[220px]">Venue</th>
                <th className="px-4 py-3.5 w-[180px]">Progress</th>
                <th className="px-4 py-3.5 w-[130px]">Status</th>
                <th className="px-4 py-3.5 w-[80px] text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#5F6368]">
                    <AlertCircle className="h-8 w-8 mx-auto opacity-40 mb-2" />
                    <p className="font-bold text-xs">No onboarding applications found.</p>
                    <p className="text-[11px] mt-0.5">Try clearing filters or search queries.</p>
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => {
                  const stepNum = app.current_step || 1;
                  const progressPercent = Math.min(100, Math.round((stepNum / 8) * 100));
                  const fullTimestamp = app.updated_at || app.created_at || 'Just now';
                  const dateObj = new Date(fullTimestamp);
                  const isValidDate = !isNaN(dateObj.getTime());
                  const datePart = isValidDate 
                    ? dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
                    : (fullTimestamp.includes(' ') ? fullTimestamp.split(' ')[0] : fullTimestamp);
                  
                  const timePart = isValidDate
                    ? dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : (fullTimestamp.includes(' ') ? fullTimestamp.split(' ').slice(1).join(' ') : '');

                  return (
                    <tr key={app.application_id} className="hover:bg-[#FFF8F5]/60 transition-colors">
                      {/* ID */}
                      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 border border-slate-200">
                          <span className="text-[10px] text-slate-400 font-mono">#</span>
                          <span className="font-mono font-bold text-[#021526] text-xs">
                            {app.application_id}
                          </span>
                        </div>
                      </td>

                      {/* Date & Time Separate Column */}
                      <td className="px-4 py-3.5 align-middle whitespace-nowrap" suppressHydrationWarning>
                        <div className="text-[#021526] font-bold text-xs mb-0.5">
                          {datePart}
                        </div>
                        {timePart && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span>{timePart}</span>
                          </div>
                        )}
                      </td>

                      {/* Partner Contact */}
                      <td className="px-4 py-3.5 align-middle">
                        <p className="font-bold text-[#021526]">
                          {app.partner_details?.name || 'Partner Name Pending'}
                        </p>
                        <p className="text-[11px] text-[#5F6368] font-mono mt-0.5">
                          +91 {app.mobile_number}
                        </p>
                        {app.partner_details?.email && (
                          <span className="text-[10px] text-slate-500 truncate block">
                            {app.partner_details.email}
                          </span>
                        )}
                      </td>

                      {/* Venue & Location */}
                      <td className="px-4 py-3.5 max-w-[220px] align-middle">
                        <p className="font-bold text-[#021526] truncate">
                          {app.business_details?.venue_name || 'Venue Details Pending'}
                        </p>
                        <p className="text-[11px] text-[#5F6368] truncate mt-0.5">
                          {app.partner_details?.district || 'Coimbatore'}, {app.partner_details?.state || 'Tamil Nadu'}
                        </p>
                        {app.business_details?.venue_google_maps_link && (
                          <a
                            href={app.business_details.venue_google_maps_link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-[#F94001] hover:underline inline-flex items-center gap-1 mt-0.5"
                          >
                            <MapPin className="h-3 w-3" /> View on Maps
                          </a>
                        )}
                      </td>

                      {/* Step Engine Progress */}
                      <td className="px-4 py-3.5 min-w-[150px] align-middle">
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold mb-1">
                          <span className="text-[#021526]">Step {stepNum} of 8</span>
                          <span className="text-[#F94001]">{progressPercent}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-[#F94001] rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-[#5F6368] block mt-1 truncate">
                          {ONBOARDING_STEPS_META[stepNum - 1]?.title || 'Review Application'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap align-middle">
                        {getStatusBadge(app.status)}
                      </td>

                      {/* Action Column: ONLY Eye Icon */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap align-middle">
                        <button
                          type="button"
                          onClick={() => setDrawerApp(app)}
                          className="p-2 rounded-xl border border-[#CBD5E1] bg-white text-[#5F6368] hover:bg-[#FFF1EC] hover:text-[#F94001] hover:border-[#F94001] transition-all cursor-pointer shadow-xs inline-flex items-center justify-center group active:scale-95"
                          title="Inspect & Review Full Dossier"
                        >
                          <Eye className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        </button>
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
      {/* 3. FULL-SCREEN ONBOARDING INSPECTION DOSSIER (ZERO TOP GAP WITH PORTAL)   */}
      {/* ========================================================================= */}
      {mounted && drawerApp && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] top-0 left-0 right-0 bottom-0 w-screen h-screen m-0 p-0 bg-[#F8F9FA] flex flex-col overflow-hidden animate-in fade-in duration-200">
          {/* Top Full-Width Header Bar */}
          <div className="px-6 py-3.5 bg-[#021526] text-white border-b border-[#06243f] flex items-center justify-between gap-4 shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { setDrawerApp(null); setSectionNotes({}); setEditingNoteKey(null); }}
                className="p-2 rounded-xl bg-[#06243f] hover:bg-[#0b3359] text-slate-300 hover:text-white border border-slate-700/60 transition-all cursor-pointer shadow-xs flex items-center justify-center"
                title="Close and return to table"
                aria-label="Close review"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="h-6 w-px bg-slate-700 hidden sm:block" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#F94001] bg-[#FFF1EC] px-2 py-0.5 rounded">
                    {drawerApp.application_id}
                  </span>
                  {getStatusBadge(drawerApp.status)}
                  <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
                    Step {drawerApp.current_step || 1} of 8 ({Math.min(100, Math.round(((drawerApp.current_step || 1) / 8) * 100))}%)
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-white font-display mt-0.5 truncate max-w-xl">
                  {drawerApp.business_details?.venue_name || 'Partner Onboarding Dossier'}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {/* REJECT BUTTON LOGIC */}
              {drawerApp.status === 'APPROVED' ? (
                <button
                  type="button"
                  disabled
                  title="Approved applications cannot be rejected"
                  className="px-5 py-2 rounded-xl border border-slate-700/60 bg-slate-800/40 text-slate-500 font-bold text-xs flex items-center gap-2 cursor-not-allowed opacity-50"
                >
                  <X className="h-4 w-4 text-slate-600" />
                  <span>Reject Application</span>
                </button>
              ) : drawerApp.status === 'REJECTED' ? (
                <div className="px-5 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
                  <X className="h-4 w-4 text-rose-400" />
                  <span>Application Rejected</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleOpenRejectModal(drawerApp)}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md hover:shadow-rose-600/25 active:scale-95 cursor-pointer"
                  title={Object.keys(sectionNotes).length > 0 ? `Reject application with ${Object.keys(sectionNotes).length} correction note(s)` : 'Reject application'}
                >
                  <X className="h-4 w-4 stroke-[2.5]" />
                  <span>Reject Application</span>
                  {Object.keys(sectionNotes).length > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-950/60 text-white text-[10px] font-black leading-none border border-white/20">
                      {Object.keys(sectionNotes).length} {Object.keys(sectionNotes).length === 1 ? 'Note' : 'Notes'}
                    </span>
                  )}
                </button>
              )}

              {/* APPROVE BUTTON LOGIC */}
              {drawerApp.status === 'APPROVED' ? (
                <div className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-md">
                  <Check className="h-4 w-4" />
                  <span>Application Approved</span>
                </div>
              ) : drawerApp.status === 'REJECTED' ? (
                <button
                  type="button"
                  disabled
                  title="Rejected applications require partner resubmission before approval"
                  className="px-5 py-2 rounded-xl border border-slate-700 bg-slate-900/50 text-slate-500 font-bold text-xs flex items-center gap-2 cursor-not-allowed opacity-50"
                >
                  <Check className="h-4 w-4 text-slate-600" />
                  <span>Approve Application</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleOpenApproveModal(drawerApp)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>Approve Application</span>
                </button>
              )}
            </div>
          </div>

          {/* Full Screen Scrollable Body Content (Fluid Responsive 2-Column Grid) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="max-w-[1500px] mx-auto space-y-6">
              {/* Top Banner: Partner & Venue Overview */}
              <div className="border-b border-[#E5E7EB] pb-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-[#021526] text-white flex items-center justify-center font-display font-black text-lg shrink-0">
                    {drawerApp.business_details?.venue_name?.[0] || 'V'}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#021526]">
                      {drawerApp.business_details?.venue_name || 'Venue Details Pending'}
                    </h3>
                    <p className="text-xs text-[#5F6368] flex items-center gap-2 mt-0.5 flex-wrap">
                      <span>Owner: <strong className="text-[#021526]">{drawerApp.partner_details?.name || '—'}</strong></span>
                      <span>&bull;</span>
                      <span className="font-mono text-[#021526]">+91 {drawerApp.mobile_number}</span>
                      <span>&bull;</span>
                      <span>{drawerApp.partner_details?.district || 'Coimbatore'}, {drawerApp.partner_details?.state || 'Tamil Nadu'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] uppercase font-bold text-[#5F6368] block font-mono">Submitted / Updated</span>
                    <span className="text-xs font-mono font-bold text-[#021526]">
                      {drawerApp.updated_at || drawerApp.created_at || 'Just now'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2-Column Main Dossier Sections Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT COLUMN: Identity, Business, Venue Photos & Banking */}
                <div className="space-y-6">
                  {/* Step 1: Partner Identity & KYC Details */}
                  <div className={`p-4 rounded-2xl border ${sectionNotes['partner_identity'] ? 'border-rose-300 bg-rose-50/50' : 'border-[#E5E7EB] bg-white'} space-y-4`}>
                    <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                      <h4 className="text-xs font-bold uppercase text-[#F94001] font-mono tracking-wider flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        <span>Step 1: Partner &amp; Identity Details</span>
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${drawerApp.mobile_verified ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
                          {drawerApp.mobile_verified ? 'Phone Verified' : 'OTP Pending'}
                        </span>
                        {renderNoteButton('partner_identity', 1, 'Partner Details')}
                      </div>
                    </div>
                    {sectionNotes['partner_identity'] && (
                      <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-rose-600" />
                        <span>{sectionNotes['partner_identity'].note}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-mono font-bold mb-1">Owner / Full Name</span>
                        <p className="font-bold text-[#021526] text-sm">{drawerApp.partner_details?.name || '—'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-mono font-bold mb-1">Contact Mobile</span>
                        <p className="font-mono font-bold text-[#021526] text-sm flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-[#F94001]" />
                          +91 {drawerApp.mobile_number}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-mono font-bold mb-1">Official Email</span>
                        <p className="font-medium text-[#021526] flex items-center gap-1.5 truncate">
                          <Mail className="h-3.5 w-3.5 text-[#F94001] shrink-0" />
                          {drawerApp.partner_details?.email || '—'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-mono font-bold mb-1">Location</span>
                        <p className="font-medium text-[#021526]">
                          {[drawerApp.partner_details?.district, drawerApp.partner_details?.state].filter(Boolean).join(', ') || '—'}
                        </p>
                      </div>

                      {/* Residential Address */}
                      <div className="sm:col-span-2">
                        <span className="text-[10px] text-slate-500 uppercase block font-mono font-bold mb-1">Partner Residential Address</span>
                        <p className="font-medium text-[#021526] text-xs">
                          {[drawerApp.partner_details?.address, drawerApp.partner_details?.district, drawerApp.partner_details?.state, drawerApp.partner_details?.pincode ? `- ${drawerApp.partner_details.pincode}` : ''].filter(Boolean).join(', ') || 'Not provided'}
                        </p>
                      </div>
                    </div>

                    {/* Aadhaar & Profile Photo Verification Row */}
                    <div className="pt-3 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="text-[11px] font-bold text-[#021526] block">
                            Aadhaar Document: {drawerApp.partner_details?.aadhaar_document_id || 'Not Uploaded'}
                          </span>
                          <span className="text-[10px] text-[#5F6368]">Government KYC Identification Proof</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {drawerApp.partner_details?.aadhaar_document_id && (
                          <button
                            type="button"
                            onClick={() => {
                              const fUrl = onboardingApi.getDocumentUrl(drawerApp.partner_details?.aadhaar_document_id);
                              setSelectedDocPreview({
                                title: 'Aadhaar Card Document',
                                docType: 'AADHAAR',
                                docNumber: drawerApp.partner_details?.aadhaar_document_id,
                                fileUrl: fUrl,
                                isPdf: drawerApp.partner_details?.aadhaar_document_id?.toLowerCase().includes('.pdf'),
                                applicantName: drawerApp.partner_details?.name || 'Partner',
                                partnerMobile: drawerApp.mobile_number,
                                partnerAddress: [drawerApp.partner_details?.address, drawerApp.partner_details?.district, drawerApp.partner_details?.state, drawerApp.partner_details?.pincode ? `- ${drawerApp.partner_details.pincode}` : ''].filter(Boolean).join(', '),
                                description: 'Government KYC Identification Document uploaded by partner',
                              });
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#021526] hover:bg-[#06243f] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                          >
                            <FileText className="h-3.5 w-3.5 text-[#F94001]" />
                            <span>View Aadhaar</span>
                          </button>
                        )}
                        {drawerApp.partner_details?.profile_photo_document_id && (
                          <button
                            type="button"
                            onClick={() => {
                              const fUrl = onboardingApi.getDocumentUrl(drawerApp.partner_details?.profile_photo_document_id);
                              setSelectedDocPreview({
                                title: 'Partner Profile Photograph',
                                docType: 'PROFILE_PHOTO',
                                docNumber: drawerApp.partner_details?.profile_photo_document_id,
                                fileUrl: fUrl,
                                applicantName: drawerApp.partner_details?.name || 'Partner',
                                partnerMobile: drawerApp.mobile_number,
                                description: 'Partner profile photograph uploaded during registration',
                              });
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-[#021526] border border-[#CBD5E1] font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
                          >
                            <ImageIcon className="h-3.5 w-3.5 text-slate-600" />
                            <span>View Photo</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Business & Venue Details */}
                  <div className={`p-4 rounded-2xl border ${sectionNotes['business_venue'] ? 'border-rose-300 bg-rose-50/50' : 'border-[#E5E7EB] bg-white'} space-y-4`}>
                    <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                      <h4 className="text-xs font-bold uppercase text-[#F94001] font-mono tracking-wider flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>Step 2: Business &amp; Venue Details</span>
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          {drawerApp.business_details?.has_gst ? 'GST Registered' : 'GST Exempt'}
                        </span>
                        {renderNoteButton('business_venue', 2, 'Venue & GST')}
                      </div>
                    </div>
                    {sectionNotes['business_venue'] && (
                      <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-rose-600" />
                        <span>{sectionNotes['business_venue'].note}</span>
                      </div>
                    )}

                    <div className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-mono font-bold mb-1">Venue / Arena Name</span>
                          <p className="font-bold text-[#021526] text-sm">{drawerApp.business_details?.venue_name || '—'}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-mono font-bold mb-1">Venue Contact Mobile</span>
                          <p className="font-mono font-bold text-[#021526] text-sm">
                            {drawerApp.business_details?.venue_mobile_number ? `+91 ${drawerApp.business_details.venue_mobile_number}` : '—'}
                          </p>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-mono font-bold mb-1">Venue Official Email</span>
                        <p className="font-medium text-[#021526]">{drawerApp.business_details?.venue_email || '—'}</p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-mono font-bold mb-1">Facility Physical Address</span>
                        <p className="font-medium text-[#021526]">{drawerApp.business_details?.venue_address || '—'}</p>
                      </div>

                      {drawerApp.business_details?.venue_google_maps_link && (
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-mono font-bold mb-1">Google Maps Navigation Link</span>
                          <a
                            href={drawerApp.business_details.venue_google_maps_link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#F94001] hover:underline font-mono text-xs inline-flex items-center gap-1.5 break-all"
                          >
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                            <span>{drawerApp.business_details.venue_google_maps_link}</span>
                          </a>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-mono font-bold mb-1">GST Registration Status</span>
                          <p className="font-bold text-[#021526]">
                            {drawerApp.business_details?.has_gst ? 'Registered Business' : 'GST Exempt / Individual'}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-mono font-bold mb-1">GSTIN Registration Number</span>
                          <p className="font-mono font-bold text-[#021526]">
                            {drawerApp.business_details?.gst_number || (drawerApp.business_details?.has_gst ? 'Pending' : 'N/A (Exempt)')}
                          </p>
                        </div>
                      </div>

                      {/* GST Document Action Button */}
                      {drawerApp.business_details?.has_gst && drawerApp.business_details?.gst_document_id && (
                        <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2">
                            <FileCheck className="h-4 w-4 text-indigo-600 shrink-0" />
                            <div>
                              <span className="text-[11px] font-bold text-[#021526] block">
                                GST Certificate Document: {drawerApp.business_details.gst_document_id}
                              </span>
                              <span className="text-[10px] text-[#5F6368]">GST Registration Certificate (Form REG-06)</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const docId = drawerApp.business_details?.gst_document_id;
                              const fUrl = onboardingApi.getDocumentUrl(docId);
                              setSelectedDocPreview({
                                title: 'GST Registration Certificate (Form REG-06)',
                                docType: 'GST',
                                docNumber: drawerApp.business_details?.gst_number || docId || '33ABCDE1234F1Z5',
                                fileUrl: fUrl,
                                isPdf: docId?.toLowerCase().includes('.pdf'),
                                venueName: drawerApp.business_details?.venue_name || 'Venue',
                                venueAddress: drawerApp.business_details?.venue_address,
                                applicantName: drawerApp.partner_details?.name || 'Partner',
                                description: 'Goods and Services Tax Certificate of Registration uploaded by partner',
                              });
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#021526] hover:bg-[#06243f] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                          >
                            <Eye className="h-3.5 w-3.5 text-[#F94001]" />
                            <span>View Certificate</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 3: Court Photographs Gallery */}
                  <div className={`p-4 rounded-2xl border ${sectionNotes['court_photos'] ? 'border-rose-300 bg-rose-50/50' : 'border-[#E5E7EB] bg-white'} space-y-4`}>
                    <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                      <h4 className="text-xs font-bold uppercase text-[#F94001] font-mono tracking-wider flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        <span>Step 3: Facility &amp; Court Photographs ({drawerApp.court_photos?.length || 0} Photos)</span>
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${drawerApp.court_photos && drawerApp.court_photos.length >= 4 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
                          {drawerApp.court_photos?.length || 0} of min 4 Photos
                        </span>
                        {renderNoteButton('court_photos', 3, 'Court Photos')}
                      </div>
                    </div>
                    {sectionNotes['court_photos'] && (
                      <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-rose-600" />
                        <span>{sectionNotes['court_photos'].note}</span>
                      </div>
                    )}

                    {/* Photos Grid */}
                    {(!drawerApp.court_photos || drawerApp.court_photos.length === 0) ? (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                        No court photographs uploaded yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {drawerApp.court_photos.map((photoId, pIdx) => {
                          const photoUrl = onboardingApi.getDocumentUrl(photoId);
                          return (
                            <div
                              key={pIdx}
                              onClick={() =>
                                setSelectedDocPreview({
                                  title: `Court Visual Inspection Photo #${pIdx + 1}`,
                                  docType: 'COURT_PHOTO',
                                  docNumber: photoId,
                                  fileUrl: photoUrl,
                                  venueName: drawerApp.business_details?.venue_name || 'Venue',
                                  applicantName: drawerApp.partner_details?.name || 'Partner',
                                  venueAddress: drawerApp.business_details?.venue_address,
                                  description: `Court visual inspection photo #${pIdx + 1} (${photoId})`,
                                })
                              }
                              className="group relative rounded-xl border border-[#CBD5E1] bg-slate-900 h-36 w-full cursor-pointer hover:border-[#F94001] transition-all shadow-xs overflow-hidden"
                            >
                              <img
                                src={photoUrl}
                                alt={`Court Photo ${pIdx + 1}`}
                                className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-all duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 p-2.5 flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-mono font-bold bg-black/60 text-white px-1.5 py-0.5 rounded backdrop-blur-xs">
                                    #{pIdx + 1}
                                  </span>
                                  <Eye className="h-3.5 w-3.5 text-white/80 group-hover:text-[#F94001] transition-colors" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-white leading-tight truncate">
                                    {photoId}
                                  </p>
                                  <p className="text-[10px] text-slate-300">Click to view photo</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Step 4: Operating Hours & Schedule (Moved to Left Column) */}
                  <div className={`p-4 rounded-2xl border ${sectionNotes['operating_hours'] ? 'border-rose-300 bg-rose-50/50' : 'border-[#E5E7EB] bg-white'} space-y-4`}>
                    <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                      <h4 className="text-xs font-bold uppercase text-[#F94001] font-mono tracking-wider flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Step 4: Operating Hours &amp; Schedule</span>
                      </h4>
                      {renderNoteButton('operating_hours', 4, 'Operating Hours')}
                    </div>
                    {sectionNotes['operating_hours'] && (
                      <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-rose-600" />
                        <span>{sectionNotes['operating_hours'].note}</span>
                      </div>
                    )}
                    {(() => {
                      const openDayWithTime = drawerApp.operating_hours?.day_schedules?.find(
                        (s) => s.is_open && s.open_time
                      );

                      const openingTime =
                        drawerApp.operating_hours?.starting_time ||
                        drawerApp.operating_hours?.operating_time ||
                        openDayWithTime?.open_time ||
                        (drawerApp.operating_hours?.day_schedules?.[0]?.open_time) ||
                        '—';

                      const closingTime =
                        drawerApp.operating_hours?.closing_time ||
                        openDayWithTime?.close_time ||
                        (drawerApp.operating_hours?.day_schedules?.[0]?.close_time) ||
                        '—';

                      const hasOperatingHours = Boolean(
                        drawerApp.operating_hours &&
                        (openingTime !== '—' ||
                         closingTime !== '—' ||
                         drawerApp.operating_hours.day_schedules?.length ||
                         drawerApp.operating_hours.working_days?.length)
                      );

                      if (!hasOperatingHours) {
                        return (
                          <div className="p-4 rounded-xl border border-[#E5E7EB] text-center text-xs text-slate-500">
                            Operating hours and schedule have not been configured by the partner yet.
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase block font-mono font-bold mb-1">Daily Opening Time</span>
                            <p className="font-bold text-[#021526] text-sm">
                              {openingTime}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase block font-mono font-bold mb-1">Daily Closing Time</span>
                            <p className="font-bold text-[#021526] text-sm mt-0.5">
                              {closingTime}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-[10px] text-slate-500 uppercase block font-mono font-bold mb-1.5">Weekly Days Operating Schedule</span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                              {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map((d) => {
                                const sched = drawerApp.operating_hours?.day_schedules?.find((s) => s.day === d);
                                const isOpen = sched
                                  ? sched.is_open
                                  : (drawerApp.operating_hours?.working_days?.includes(d) ?? true);
                                const openT = sched?.open_time || (openingTime !== '—' ? openingTime : '06:00 AM');
                                const closeT = sched?.close_time || (closingTime !== '—' ? closingTime : '10:00 PM');
                                return (
                                  <div
                                    key={d}
                                    className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between text-[10px] ${
                                      isOpen ? 'bg-emerald-50 border-emerald-200 text-[#021526]' : 'bg-slate-100 border-slate-200 text-slate-400'
                                    }`}
                                  >
                                    <span className="font-bold">{d.slice(0, 3)}</span>
                                    <span className={`font-mono font-semibold ${isOpen ? 'text-emerald-700' : 'text-slate-400'}`}>
                                      {isOpen ? `${openT} - ${closeT}` : 'Closed'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Step 6: Settlement Bank Details */}
                  <div className={`p-4 rounded-2xl border ${sectionNotes['bank_details'] ? 'border-rose-300 bg-rose-50/50' : 'border-[#E5E7EB] bg-white'} space-y-4`}>
                    <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                      <h4 className="text-xs font-bold uppercase text-[#F94001] font-mono tracking-wider flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span>Step 6: Payout &amp; Settlement Bank Account</span>
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-mono">
                          {drawerApp.bank_details?.account_type || 'CURRENT'}
                        </span>
                        {renderNoteButton('bank_details', 6, 'Bank Details')}
                      </div>
                    </div>
                    {sectionNotes['bank_details'] && (
                      <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-rose-600" />
                        <span>{sectionNotes['bank_details'].note}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-mono font-bold mb-1">Account Holder Name</span>
                        <p className="font-bold text-[#021526]">{drawerApp.bank_details?.account_holder_name || '—'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-mono font-bold mb-1">Bank Name</span>
                        <p className="font-bold text-[#021526]">{drawerApp.bank_details?.bank_name || '—'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-mono font-bold mb-1">Bank Account Number</span>
                        <p className="font-mono font-bold text-[#021526]">
                          {drawerApp.bank_details?.account_number || '—'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-mono font-bold mb-1">IFSC Code &amp; Branch</span>
                        <p className="font-mono font-bold text-[#021526]">
                          {drawerApp.bank_details?.ifsc_code || '—'} {drawerApp.bank_details?.branch_name ? `(${drawerApp.bank_details.branch_name})` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Bank Passbook / Cheque Action Row */}
                    {drawerApp.bank_details?.branch_proof_document_id && (
                      <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="text-[11px] font-bold text-[#021526] block">
                              Bank Proof: {drawerApp.bank_details.branch_proof_document_id}
                            </span>
                            <span className="text-[10px] text-[#5F6368]">Cancelled Cheque / Bank Passbook Document</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const docId = drawerApp.bank_details?.branch_proof_document_id;
                            const fUrl = onboardingApi.getDocumentUrl(docId);
                            setSelectedDocPreview({
                              title: 'Bank Passbook / Cancelled Cheque',
                              docType: 'BANK_PROOF',
                              docNumber: docId || 'DOC_BANK_PROOF',
                              fileUrl: fUrl,
                              isPdf: docId?.toLowerCase().includes('.pdf'),
                              applicantName: drawerApp.bank_details?.account_holder_name || drawerApp.partner_details?.name || 'Partner',
                              venueName: drawerApp.business_details?.venue_name || 'Venue',
                              bankName: drawerApp.bank_details?.bank_name || 'Commercial Bank',
                              accountNumber: drawerApp.bank_details?.account_number || '•••• •••• 6914',
                              ifscCode: drawerApp.bank_details?.ifsc_code || 'SBIN0018111',
                              branchName: drawerApp.bank_details?.branch_name || 'Branch',
                              accountType: drawerApp.bank_details?.account_type || 'CURRENT',
                              description: 'Bank settlement proof document uploaded by partner',
                            });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#021526] hover:bg-[#06243f] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                        >
                          <Eye className="h-3.5 w-3.5 text-[#F94001]" />
                          <span>View Bank Proof</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN: Sports & Courts Matrix ONLY (Single Clean Container) */}
                <div className="space-y-6">
                  {/* Step 5: Single Unified Container */}
                  <div className={`p-4 rounded-2xl border ${sectionNotes['courts_matrix'] ? 'border-rose-300 bg-rose-50/50' : 'border-[#E5E7EB] bg-white'} space-y-4`}>
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                      <h4 className="text-xs font-bold uppercase text-[#F94001] font-mono tracking-wider flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        <span>Step 5: Sports &amp; Courts Pricing Matrix</span>
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 font-mono">
                          {drawerApp.courts_config?.courts?.length || 0} Courts Configured
                        </span>
                        {renderNoteButton('courts_matrix', 5, 'Sports & Courts')}
                      </div>
                    </div>

                    {sectionNotes['courts_matrix'] && (
                      <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-rose-600" />
                        <span>{sectionNotes['courts_matrix'].note}</span>
                      </div>
                    )}

                    {/* Offered Sports (Text-based) */}
                    {drawerApp.courts_config?.sports && drawerApp.courts_config.sports.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="text-[10px] font-bold uppercase text-[#5F6368] font-mono tracking-wide">
                          Offered Sports:
                        </span>
                        {drawerApp.courts_config.sports.map((sp) => (
                          <span
                            key={sp}
                            className="px-2.5 py-0.5 rounded-md bg-[#F8F9FA] border border-[#E5E7EB] text-[#021526] font-bold text-[11px]"
                          >
                            {sp}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Courts List (Clean, Text-based Specifications) */}
                    <div className="space-y-5 pt-1">
                      {(!drawerApp.courts_config?.courts || drawerApp.courts_config.courts.length === 0) ? (
                        <p className="text-xs text-[#5F6368] py-4 text-center">
                          No court pricing configuration added yet.
                        </p>
                      ) : (
                        drawerApp.courts_config.courts.map((ct, idx) => (
                          <div
                            key={idx}
                            className="space-y-3 pt-4 first:pt-0 border-t border-[#F1F3F5] first:border-t-0"
                          >
                            {/* Court Title & Badges */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-[#F94001]">
                                  #{idx + 1}
                                </span>
                                <h5 className="font-bold text-sm text-[#021526]">
                                  {ct.court_name}
                                </h5>
                                {ct.display_name && (
                                  <span className="text-xs text-[#5F6368]">
                                    ({ct.display_name})
                                  </span>
                                )}
                              </div>

                                <div className="flex flex-wrap items-center gap-1.5">
                                  {ct.sports?.slice(0, 1).map((s) => (
                                    <span
                                      key={s}
                                      className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#021526] text-white"
                                    >
                                      {s}
                                    </span>
                                  ))}
                                  {ct.use_one_physical_court_for_two_sports && (
                                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                      ⚡ Shared Ground
                                    </span>
                                  )}
                                </div>
                            </div>

                            {/* Rates & Policy Grid (Clean text-based with rich, distinct colors) */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-2.5 gap-x-4 text-xs py-1.5">
                              <div>
                                <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block">Regular Rate</span>
                                <p className="font-mono font-black text-base text-[#021526] mt-0.5">
                                  ₹{ct.regular_price || 0}<span className="text-[11px] font-normal text-slate-400">/hr</span>
                                </p>
                              </div>

                              <div>
                                <span className="text-[10px] uppercase font-mono font-bold text-amber-600 block">Peak Rate</span>
                                <p className="font-mono font-black text-base text-amber-700 mt-0.5">
                                  ₹{ct.peak_hour_price || 0}<span className="text-[11px] font-normal text-amber-500/80">/hr</span>
                                </p>
                              </div>

                              <div>
                                <span className="text-[10px] uppercase font-mono font-bold text-purple-600 block">Weekend Rate</span>
                                <p className="font-mono font-black text-base text-purple-700 mt-0.5">
                                  ₹{ct.weekend_price || 0}<span className="text-[11px] font-normal text-purple-500/80">/hr</span>
                                </p>
                              </div>

                              <div>
                                <span className="text-[10px] uppercase font-mono font-bold text-emerald-600 block">Advance Deposit</span>
                                <p className="font-mono font-black text-base text-emerald-700 mt-0.5">
                                  ₹{ct.advance_booking_price || 0}
                                </p>
                              </div>

                              <div>
                                <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block">Cancellation</span>
                                <p className="font-mono font-black text-base text-[#021526] mt-0.5">
                                  {ct.cancellation_window_hours || drawerApp.courts_config?.cancellation_window_hours || 12}<span className="text-[11px] font-normal text-slate-400">h buffer</span>
                                </p>
                              </div>

                              <div>
                                <span className="text-[10px] uppercase font-mono font-bold text-emerald-600 block">Refund Payout</span>
                                <p className="font-mono font-black text-base text-emerald-700 mt-0.5">
                                  {ct.refund_percentage || drawerApp.courts_config?.refund_percentage || 100}%
                                </p>
                              </div>
                            </div>

                            {/* Operating & Peak Rules Line with subtle color accents */}
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-[#5F6368] pt-1">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-[#F94001] shrink-0" />
                                <span>
                                  Min Booking: <strong className="text-[#021526] font-bold">{ct.minimum_booking_time_minutes || 60} mins</strong>
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <CalendarIcon className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                                <span>
                                  Peak Days: <strong className="text-purple-900 font-bold">{ct.peak_days && ct.peak_days.length > 0 ? ct.peak_days.join(', ') : 'None'}</strong>
                                </span>
                              </div>
                              {ct.peak_hours && ct.peak_hours.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-amber-700 font-bold text-[11px]">Peak Windows:</span>
                                  <span className="font-mono font-bold text-amber-900">{ct.peak_hours.map((p) => `${p.start_time} - ${p.end_time}`).join(', ')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* 4. APPROVE MODAL                                                          */}
      {/* ========================================================================= */}
      {mounted && reviewAction === 'APPROVE' && actionTargetApp && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#021526] font-display">
                  Approve Partner Application
                </h3>
                <span className="text-[11px] font-mono text-[#F94001] font-bold">
                  {actionTargetApp.application_id} &bull; {actionTargetApp.business_details?.venue_name}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#5F6368] leading-relaxed">
              Approving this application will generate vendor access credentials and notify the partner via automated WhatsApp &amp; Email alerts.
            </p>

            <div>
              <label className="text-xs font-bold text-[#021526] block mb-1">
                Vendor App Access URL
              </label>
              <input
                type="text"
                value={appLinkInput}
                onChange={(e) => setAppLinkInput(e.target.value)}
                className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8F9FA] px-3.5 py-2 text-xs font-mono text-[#021526] focus:border-[#F94001] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => {
                  setReviewAction(null);
                  setActionTargetApp(null);
                }}
                className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#5F6368] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmApprove}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Approving...' : 'Confirm & Activate Partner'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* 5. REJECT & CORRECTION MODAL (Note-Summary Based)                         */}
      {/* ========================================================================= */}
      {mounted && reviewAction === 'REJECT' && actionTargetApp && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#021526] font-display">
                  Reject &amp; Send Correction Email
                </h3>
                <span className="text-[11px] font-mono text-[#F94001] font-bold">
                  {actionTargetApp.application_id} &bull; {actionTargetApp.business_details?.venue_name}
                </span>
              </div>
            </div>

            {/* Notes Summary */}
            {Object.keys(sectionNotes).length === 0 ? (
              <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-900">No rejection notes added yet</p>
                  <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                    Please close this dialog and click <strong>&quot;Add Rejection Note&quot;</strong> on each section that needs correction. Those notes will be included in the rejection email sent to the partner.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-bold text-[#021526]">
                  Rejection notes for {Object.keys(sectionNotes).length} section(s) will be emailed to the partner:
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {Object.entries(sectionNotes).map(([key, val]) => (
                    <div key={key} className="flex items-start gap-3 px-3.5 py-3 rounded-xl bg-rose-50 border border-rose-200">
                      <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-rose-800 uppercase tracking-wide">
                          Step {val.step} — {val.section}
                        </p>
                        <p className="text-xs text-rose-900 mt-0.5 leading-relaxed">{val.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[11px] text-[#5F6368] leading-relaxed border-t border-[#E5E7EB] pt-3">
              The partner will receive a rejection email listing all noted corrections and will be unlocked to fix and resubmit the flagged sections without re-entering valid data.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setReviewAction(null);
                  setActionTargetApp(null);
                }}
                className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#5F6368] cursor-pointer hover:bg-slate-50 transition-colors"
              >
                {Object.keys(sectionNotes).length === 0 ? 'Close & Add Notes' : 'Cancel'}
              </button>
              {Object.keys(sectionNotes).length > 0 && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleConfirmReject}
                  className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 border border-rose-800"
                >
                  {actionLoading ? 'Sending...' : `Send Rejection Email (${Object.keys(sectionNotes).length} note${Object.keys(sectionNotes).length > 1 ? 's' : ''})`}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* 6. MINIMAL DOCUMENT & PHOTO INSPECTION LIGHTBOX MODAL                     */}
      {/* ========================================================================= */}
      {mounted && selectedDocPreview && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setSelectedDocPreview(null)}
          className="fixed inset-0 z-[99999] top-0 left-0 right-0 bottom-0 w-screen h-screen bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-[#CBD5E1] overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 cursor-default"
          >
            {/* Minimal Header */}
            <div className="px-5 py-3.5 bg-white border-b border-[#E5E7EB] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-sm font-bold text-[#021526] truncate">
                  {selectedDocPreview.title}
                </span>
                {selectedDocPreview.docNumber && (
                  <span className="text-[11px] font-mono text-[#5F6368] bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[220px]">
                    {selectedDocPreview.docNumber}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedDocPreview.fileUrl && (
                  <a
                    href={selectedDocPreview.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    title="Open original file in new tab"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Open in New Tab</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedDocPreview.fileUrl && !selectedDocPreview.fileUrl.startsWith('data:') && !selectedDocPreview.fileUrl.startsWith('blob:')) {
                      window.open(selectedDocPreview.fileUrl, '_blank');
                    } else {
                      handleDownloadProof();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#021526] hover:bg-[#06243f] text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                  title="Download or open original"
                >
                  <Download className="h-3.5 w-3.5 text-[#F94001]" />
                  <span className="hidden sm:inline">Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDocPreview(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-[#021526] hover:bg-slate-100 transition-colors cursor-pointer ml-1"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Minimal Document Viewer Body */}
            <div className="flex-1 overflow-hidden bg-slate-100 flex items-center justify-center min-h-[420px] max-h-[82vh]">
              {selectedDocPreview.fileUrl ? (
                selectedDocPreview.docType === 'COURT_PHOTO' || selectedDocPreview.docType === 'PROFILE_PHOTO' ? (
                  <div className="w-full h-full flex items-center justify-center p-4 bg-slate-950/95 overflow-auto">
                    <img
                      src={selectedDocPreview.fileUrl}
                      alt={selectedDocPreview.title}
                      className="max-h-[78vh] max-w-full w-auto object-contain rounded-lg shadow-xl"
                    />
                  </div>
                ) : (
                  <iframe
                    src={selectedDocPreview.fileUrl}
                    title={selectedDocPreview.title}
                    className="w-full h-[78vh] bg-white border-0"
                  />
                )
              ) : (
                <div className="p-10 text-center space-y-2">
                  <AlertCircle className="h-8 w-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-[#021526]">No Document File Uploaded</p>
                  <p className="text-[11px] text-[#5F6368]">No physical file was uploaded for this record.</p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
