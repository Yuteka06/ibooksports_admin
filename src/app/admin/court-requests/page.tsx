'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  RefreshCw,
  Building2,
  Phone,
  Layers,
  X,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Pencil,
  Trash2,
  Plus,
  Eye,
  History,
  Sparkles,
  ChevronDown,
  Calendar,
  Flame,
  Sun,
  RotateCcw,
  ShieldCheck,
  MapPin,
  User,
} from 'lucide-react';
import {
  INITIAL_COURT_REQUESTS,
  INITIAL_VENUES,
  CourtExtensionRequest,
  CourtExtensionHistory,
  VenueDetail,
} from '@/lib/mockData';
import { adminApi } from '@/lib/api';

const REJECTION_REASONS = [
  { value: 'PRICING_OUT_OF_BOUNDS', label: 'Hourly pricing violates regional slot rate caps' },
  { value: 'SURFACE_VERIFICATION_NEEDED', label: 'Surface type or court dimensions require physical verification' },
  { value: 'INCOMPLETE_DETAILS', label: 'Incomplete or unclear court specifications / photos' },
  { value: 'DUPLICATE_LISTING', label: 'Duplicate court name or slot already listed for this venue' },
  { value: 'OPERATING_HOURS_MISMATCH', label: 'Requested peak hours conflict with venue master operating schedule' },
  { value: 'OTHER', label: 'Other specific reason (specify detailed notes below)' },
];

export default function CourtRequestsPage() {
  const [requests, setRequests] = useState<CourtExtensionRequest[]>(INITIAL_COURT_REQUESTS);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedVenueFilter, setSelectedVenueFilter] = useState<string>('ALL');
  const [selectedSport, setSelectedSport] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Right-Side Slide Bar (Drawer) State
  const [selectedRequestForDrawer, setSelectedRequestForDrawer] = useState<CourtExtensionRequest | null>(null);

  // Add / Edit Court Request Modal State (Screenshot Replica)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRequestForResubmit, setEditingRequestForResubmit] = useState<CourtExtensionRequest | null>(null);

  // Form Fields State (Matching Screenshots 1, 2, 3)
  const [formVenueId, setFormVenueId] = useState('ven_1001');
  const [formSamePhysicalSports, setFormSamePhysicalSports] = useState<boolean>(false);
  const [formParentCourtName, setFormParentCourtName] = useState('Main Football Turf');
  const [formSport, setFormSport] = useState('Football');
  const [formCourtName, setFormCourtName] = useState('Turf 1A (5-a-side)');
  const [formDisplayName, setFormDisplayName] = useState('Main Arena Pitch 1 (Floodlit Turf)');
  const [formMinDuration, setFormMinDuration] = useState('1 Hour');
  const [formPricePerHour, setFormPricePerHour] = useState<number>(1000);
  const [formPeakStart, setFormPeakStart] = useState('06:00 PM');
  const [formPeakEnd, setFormPeakEnd] = useState('11:00 PM');
  const [formPeakPrice, setFormPeakPrice] = useState<number>(1400);
  const [formWeekendPrice, setFormWeekendPrice] = useState<number>(1500);
  const [formPeakDays, setFormPeakDays] = useState<string[]>(['Fri', 'Sat', 'Sun']);
  const [formCancellationHours, setFormCancellationHours] = useState<number>(12);
  const [formRefundPercentage, setFormRefundPercentage] = useState<number>(100);

  // Drawer Action Sub-States
  const [isRejectFormOpen, setIsRejectFormOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string>('PRICING_OUT_OF_BOUNDS');
  const [rejectionNote, setRejectionNote] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    description: string;
  } | null>(null);

  // Load from backend on mount, merge with localStorage fallback
  useEffect(() => {
    const loadRequests = async () => {
      setIsLoading(true);
      try {
        const backendData = await adminApi.getCourtRequests();
        if (Array.isArray(backendData) && backendData.length > 0) {
          // Map backend CourtRequestItem → CourtExtensionRequest shape
          const mapped: CourtExtensionRequest[] = backendData.map((r) => ({
            id: r.id,
            venue_id: r.vendor_mobile || 'ven_unknown',
            venue_name: r.venue_name,
            venue_city: r.venue_city || '',
            owner_name: r.vendor_name || 'Venue Owner',
            owner_phone: r.vendor_mobile ? `+91 ${r.vendor_mobile}` : '',
            same_physical_sports: r.same_physical_sports ?? false,
            parent_court_name: r.parent_court_name,
            sport: Array.isArray(r.sports) ? r.sports[0] : r.sports || 'Football',
            court_name: r.court_name,
            display_name: r.display_name || r.court_name,
            min_booking_duration: r.min_booking_duration || '1 Hour',
            price_per_hour: r.price_per_hour,
            peak_hours_start: r.peak_hours_start || '06:00 PM',
            peak_hours_end: r.peak_hours_end || '10:00 PM',
            peak_price: r.peak_hours_price || r.price_per_hour,
            weekend_price: r.weekend_price || r.price_per_hour,
            peak_days: r.peak_days || ['Fri', 'Sat', 'Sun'],
            cancellation_window_hours: r.cancellation_window_hours ?? 12,
            refund_percentage: r.refund_percentage ?? 100,
            // Map backend PENDING → SUBMITTED for admin UI
            status: r.status === 'PENDING' ? 'SUBMITTED' : (r.status as any),
            submission_count: 1,
            rejection_reason: r.rejection_reason ? 'OTHER' : undefined,
            rejection_notes: r.rejection_reason,
            reviewed_by: r.reviewer_name,
            reviewed_at: r.reviewed_at,
            history: [
              {
                round: 1,
                action: 'SUBMITTED' as any,
                timestamp: r.created_at,
                notes: 'Court request loaded from backend.',
              },
              ...(r.reviewed_at ? [{
                round: 1,
                action: r.status as any,
                timestamp: r.reviewed_at,
                reviewer: r.reviewer_name || 'Admin',
                notes: r.rejection_reason || 'Approved by admin.',
              }] : []),
            ],
            created_at: r.created_at,
            updated_at: r.updated_at,
          }));

          // Merge: backend data takes priority over localStorage mock data
          const backendIds = new Set(mapped.map((r) => r.id));
          const localFallback = INITIAL_COURT_REQUESTS.filter((r) => !backendIds.has(r.id));
          setRequests([...mapped, ...localFallback]);
        } else {
          // Fallback: try localStorage
          if (typeof window !== 'undefined') {
            try {
              const stored = localStorage.getItem('ibooksports_court_requests');
              if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setRequests(parsed);
                }
              }
            } catch (_) {}
          }
        }
      } catch (err) {
        console.error('Failed to load court requests from backend', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadRequests();
  }, []);

  // Save to localStorage helper
  const persistRequests = (updated: CourtExtensionRequest[]) => {
    setRequests(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ibooksports_court_requests', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to persist court requests', e);
      }
    }
  };

  // Open Add Modal Pre-populated or Blank
  const handleOpenAddModal = (existing?: CourtExtensionRequest) => {
    if (existing) {
      setEditingRequestForResubmit(existing);
      setFormVenueId(existing.venue_id);
      setFormSamePhysicalSports(existing.same_physical_sports);
      setFormParentCourtName(existing.parent_court_name || 'Main Football Turf');
      setFormSport(existing.sport);
      setFormCourtName(existing.court_name);
      setFormDisplayName(existing.display_name);
      setFormMinDuration(existing.min_booking_duration);
      setFormPricePerHour(existing.price_per_hour);
      setFormPeakStart(existing.peak_hours_start);
      setFormPeakEnd(existing.peak_hours_end);
      setFormPeakPrice(existing.peak_price);
      setFormWeekendPrice(existing.weekend_price);
      setFormPeakDays(existing.peak_days);
      setFormCancellationHours(existing.cancellation_window_hours);
      setFormRefundPercentage(existing.refund_percentage);
    } else {
      setEditingRequestForResubmit(null);
      setFormVenueId('ven_1001');
      setFormSamePhysicalSports(false);
      setFormParentCourtName('Main Football Turf');
      setFormSport('Football');
      setFormCourtName('Turf 1A (5-a-side)');
      setFormDisplayName('Main Arena Pitch 1 (Floodlit Turf)');
      setFormMinDuration('1 Hour');
      setFormPricePerHour(1000);
      setFormPeakStart('06:00 PM');
      setFormPeakEnd('11:00 PM');
      setFormPeakPrice(1400);
      setFormWeekendPrice(1500);
      setFormPeakDays(['Fri', 'Sat', 'Sun']);
      setFormCancellationHours(12);
      setFormRefundPercentage(100);
    }
    setIsFormModalOpen(true);
  };

  // Toggle Peak Day
  const handleTogglePeakDay = (day: string) => {
    setFormPeakDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // Handle Form Submission — admin creates or resubmits a court, wired to backend
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetVenue = INITIAL_VENUES.find((v) => v.id === formVenueId) || INITIAL_VENUES[0];
    const vendorMobile = String(targetVenue.mobile_number).replace(/\D/g, '').slice(-10);

    if (editingRequestForResubmit) {
      // RESUBMITTING PREVIOUS REQUEST (Round 2+)
      const newRound = (editingRequestForResubmit.submission_count || 1) + 1;
      const historyEntry: CourtExtensionHistory = {
        round: newRound,
        action: 'RESUBMITTED',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        notes: `Admin amended court specs (Price: ₹${formPricePerHour}, Weekend: ₹${formWeekendPrice}) and resubmitted for approval.`,
      };

      const updatedRequest: CourtExtensionRequest = {
        ...editingRequestForResubmit,
        same_physical_sports: formSamePhysicalSports,
        parent_court_name: formSamePhysicalSports ? formParentCourtName : undefined,
        sport: formSport,
        court_name: formCourtName,
        display_name: formDisplayName || formCourtName,
        min_booking_duration: formMinDuration,
        price_per_hour: Number(formPricePerHour),
        peak_hours_start: formPeakStart,
        peak_hours_end: formPeakEnd,
        peak_price: Number(formPeakPrice),
        weekend_price: Number(formWeekendPrice),
        peak_days: formPeakDays,
        cancellation_window_hours: Number(formCancellationHours),
        refund_percentage: Number(formRefundPercentage),
        status: 'RESUBMITTED',
        submission_count: newRound,
        rejection_reason: undefined,
        rejection_notes: undefined,
        history: [...editingRequestForResubmit.history, historyEntry],
        updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };

      const updatedList = requests.map((r) => (r.id === updatedRequest.id ? updatedRequest : r));
      persistRequests(updatedList);
      if (selectedRequestForDrawer?.id === updatedRequest.id) {
        setSelectedRequestForDrawer(updatedRequest);
      }

      setToastMessage({
        type: 'info',
        title: 'Court Request Resubmitted',
        description: `${updatedRequest.court_name} (${updatedRequest.id}) updated and moved to RESUBMITTED status.`,
      });
    } else {
      // ADMIN CREATES NEW COURT — POST to backend, then auto-approve so it goes live on vendor portal
      let backendId: string | null = null;
      try {
        const created = await adminApi.createCourtRequest({
          court_name: formCourtName,
          display_name: formDisplayName || formCourtName,
          sports: [formSport],
          price_per_hour: Number(formPricePerHour),
          min_booking_duration: formMinDuration,
          peak_hours_start: formPeakStart,
          peak_hours_end: formPeakEnd,
          peak_hours_price: Number(formPeakPrice),
          peak_days: formPeakDays,
          weekend_price: Number(formWeekendPrice),
          same_physical_sports: formSamePhysicalSports,
          parent_court_name: formSamePhysicalSports ? formParentCourtName : undefined,
          cancellation_window_hours: Number(formCancellationHours),
          refund_percentage: Number(formRefundPercentage),
          venue_name: targetVenue.venue_name,
          venue_city: `${targetVenue.district}, ${targetVenue.state}`,
          vendor_mobile: vendorMobile,
          vendor_name: targetVenue.owner?.full_name || targetVenue.name,
        });
        backendId = created.id;

        // Auto-approve immediately: admin-created courts go live on vendor portal at once
        await adminApi.reviewCourtRequest(created.id, {
          status: 'APPROVED',
          reviewer_name: 'Platform Administrator',
        });
      } catch (err) {
        console.warn('[Admin] Backend court creation/approval failed, using local fallback:', err);
      }

      const newId = backendId || `CRQ-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;
      const newRequest: CourtExtensionRequest = {
        id: newId,
        venue_id: targetVenue.id,
        venue_name: targetVenue.venue_name,
        venue_city: `${targetVenue.district}, ${targetVenue.state}`,
        owner_name: targetVenue.owner?.full_name || targetVenue.name,
        owner_phone: targetVenue.owner?.phone || `+91 ${targetVenue.mobile_number}`,
        same_physical_sports: formSamePhysicalSports,
        parent_court_name: formSamePhysicalSports ? formParentCourtName : undefined,
        sport: formSport,
        court_name: formCourtName,
        display_name: formDisplayName || formCourtName,
        min_booking_duration: formMinDuration,
        price_per_hour: Number(formPricePerHour),
        peak_hours_start: formPeakStart,
        peak_hours_end: formPeakEnd,
        peak_price: Number(formPeakPrice),
        weekend_price: Number(formWeekendPrice),
        peak_days: formPeakDays,
        cancellation_window_hours: Number(formCancellationHours),
        refund_percentage: Number(formRefundPercentage),
        // Admin-created courts start as APPROVED and immediately active
        status: 'APPROVED',
        reviewed_by: 'Platform Administrator',
        reviewed_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
        submission_count: 1,
        history: [
          {
            round: 1,
            action: 'SUBMITTED',
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            notes: 'Court created directly by Platform Administrator.',
          },
          {
            round: 1,
            action: 'APPROVED',
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            reviewer: 'Platform Administrator',
            notes: 'Auto-approved on creation. Court is now live on vendor portal.',
          },
        ],
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
        updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };

      const updatedList = [newRequest, ...requests];
      persistRequests(updatedList);

      setToastMessage({
        type: 'success',
        title: '✅ Court Created & Activated!',
        description: `${formCourtName} (${newId}) created for ${targetVenue.venue_name}. Auto-approved — vendor portal will show it as active on next login/refresh.`,
      });
    }

    setIsFormModalOpen(false);
  };

  // Handle Approve Request — calls backend then updates local state
  const handleApproveRequest = async (req: CourtExtensionRequest) => {
    try {
      await adminApi.reviewCourtRequest(req.id, {
        status: 'APPROVED',
        reviewer_name: 'Platform Administrator',
      });
    } catch (err) {
      console.warn('[Admin] Backend approve failed for', req.id, err);
    }

    const historyEntry: CourtExtensionHistory = {
      round: req.submission_count || 1,
      action: 'APPROVED',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      reviewer: 'Platform Administrator',
      notes: 'Specifications, pricing, and cancellation policy verified. Court authorized & live.',
    };

    const updated: CourtExtensionRequest = {
      ...req,
      status: 'APPROVED',
      reviewed_by: 'Platform Administrator',
      reviewed_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      history: [...req.history, historyEntry],
      updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    const updatedList = requests.map((r) => (r.id === req.id ? updated : r));
    persistRequests(updatedList);
    if (selectedRequestForDrawer?.id === req.id) {
      setSelectedRequestForDrawer(updated);
    }

    setToastMessage({
      type: 'success',
      title: 'Court Approved & Activated!',
      description: `${req.court_name} (${req.id}) approved. Vendor portal will reflect the active court on next sync.`,
    });
  };

  // Handle Reject Request — calls backend then updates local state
  const handleRejectRequest = async (req: CourtExtensionRequest) => {
    if (!rejectionNote.trim() && rejectionReason === 'OTHER') {
      setActionError('Please specify feedback notes for the venue owner.');
      return;
    }

    const reasonLabel = REJECTION_REASONS.find((r) => r.value === rejectionReason)?.label || rejectionReason;
    const finalNote = rejectionNote.trim() ? `${reasonLabel}: ${rejectionNote.trim()}` : reasonLabel;

    try {
      await adminApi.reviewCourtRequest(req.id, {
        status: 'REJECTED',
        rejection_reason: finalNote,
        reviewer_name: 'Platform Administrator',
      });
    } catch (err) {
      console.warn('[Admin] Backend reject failed for', req.id, err);
    }

    const historyEntry: CourtExtensionHistory = {
      round: req.submission_count || 1,
      action: 'REJECTED',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      reviewer: 'Platform Administrator',
      notes: finalNote,
    };

    const updated: CourtExtensionRequest = {
      ...req,
      status: 'REJECTED',
      rejection_reason: rejectionReason,
      rejection_notes: finalNote,
      history: [...req.history, historyEntry],
      updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    const updatedList = requests.map((r) => (r.id === req.id ? updated : r));
    persistRequests(updatedList);
    if (selectedRequestForDrawer?.id === req.id) {
      setSelectedRequestForDrawer(updated);
    }

    setIsRejectFormOpen(false);
    setRejectionNote('');
    setActionError(null);

    setToastMessage({
      type: 'error',
      title: 'Court Request Rejected',
      description: `${req.court_name} rejected. Vendor will see the rejection reason on their portal and can resubmit.`,
    });
  };

  // Handle Delete Request (Venue ID based action)
  const handleDeleteRequest = (req: CourtExtensionRequest) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete court request "${req.court_name}" (${req.id}) for venue ${req.venue_name} [${req.venue_id}]?`
    );
    if (!confirmDelete) return;

    const updatedList = requests.filter((r) => r.id !== req.id);
    persistRequests(updatedList);
    if (selectedRequestForDrawer?.id === req.id) {
      setSelectedRequestForDrawer(null);
    }

    setToastMessage({
      type: 'info',
      title: 'Court Request Deleted',
      description: `Request ${req.id} for venue ${req.venue_id} has been removed.`,
    });
  };

  // Metrics
  const totalCount = requests.length;
  const submittedCount = requests.filter((r) => r.status === 'SUBMITTED').length;
  const resubmittedCount = requests.filter((r) => r.status === 'RESUBMITTED').length;
  const approvedCount = requests.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = requests.filter((r) => r.status === 'REJECTED').length;

  // Filtered List
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'PENDING' ? (req.status === 'SUBMITTED' || req.status === 'RESUBMITTED') : req.status === selectedStatus);

      const matchesVenue =
        selectedVenueFilter === 'ALL' || req.venue_id === selectedVenueFilter;

      const matchesSport =
        selectedSport === 'ALL' || req.sport.toLowerCase() === selectedSport.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        req.id.toLowerCase().includes(q) ||
        req.court_name.toLowerCase().includes(q) ||
        req.display_name.toLowerCase().includes(q) ||
        req.venue_name.toLowerCase().includes(q) ||
        req.venue_id.toLowerCase().includes(q) ||
        req.owner_name.toLowerCase().includes(q) ||
        req.sport.toLowerCase().includes(q);

      return matchesStatus && matchesVenue && matchesSport && matchesQuery;
    });
  }, [requests, selectedStatus, selectedVenueFilter, selectedSport, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-orange-50 border border-orange-200/60 text-[#F94001] flex items-center justify-center shrink-0 shadow-2xs">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 font-display flex items-center gap-2">
                Court Requests &amp; Arena Expansion
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Review venue expansion requests, inspect court specifications, approve live pitches, and issue rejection notes with resubmission tracking.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2 rounded-xl bg-[#F94001] hover:bg-[#E03800] text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Request New Court / Turf</span>
          </button>
        </div>
      </div>

      {/* 2. KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Requests */}
        <div
          onClick={() => setSelectedStatus('ALL')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-2xs ${
            selectedStatus === 'ALL' ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Requests</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 font-mono">{totalCount}</span>
            <span className="text-[10px] font-semibold text-slate-400">All rounds</span>
          </div>
        </div>

        {/* 1st Submission (SUBMITTED) */}
        <div
          onClick={() => setSelectedStatus('SUBMITTED')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-2xs ${
            selectedStatus === 'SUBMITTED' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">1st Submitted</p>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-700 font-mono">{submittedCount}</span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
              Round 1
            </span>
          </div>
        </div>

        {/* Resubmitted (RESUBMITTED) */}
        <div
          onClick={() => setSelectedStatus('RESUBMITTED')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-2xs ${
            selectedStatus === 'RESUBMITTED' ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Resubmitted</p>
            <RotateCcw className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-blue-700 font-mono">{resubmittedCount}</span>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
              Round 2+
            </span>
          </div>
        </div>

        {/* Approved & Active */}
        <div
          onClick={() => setSelectedStatus('APPROVED')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-2xs ${
            selectedStatus === 'APPROVED' ? 'border-emerald-600 ring-2 ring-emerald-600/20' : 'border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Approved &amp; Live</p>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-700 font-mono">{approvedCount}</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              Active Turf
            </span>
          </div>
        </div>

        {/* Rejected with Reason */}
        <div
          onClick={() => setSelectedStatus('REJECTED')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-2xs ${
            selectedStatus === 'REJECTED' ? 'border-rose-600 ring-2 ring-rose-600/20' : 'border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Rejected</p>
            <XCircle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-rose-700 font-mono">{rejectedCount}</span>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
              Needs Edit
            </span>
          </div>
        </div>
      </div>

      {/* 3. FILTER & SEARCH CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'ALL', label: 'All Status' },
              { id: 'SUBMITTED', label: '1st Submitted' },
              { id: 'RESUBMITTED', label: 'Resubmitted' },
              { id: 'APPROVED', label: 'Approved' },
              { id: 'REJECTED', label: 'Rejected' },
            ].map((tab) => {
              const isActive = selectedStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedStatus(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Venue Dropdown Filter */}
          <select
            value={selectedVenueFilter}
            onChange={(e) => setSelectedVenueFilter(e.target.value)}
            className="h-8 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none cursor-pointer focus:border-[#F94001]"
          >
            <option value="ALL">All Arena Venues</option>
            {INITIAL_VENUES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.venue_name} ({v.id})
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search court, venue, ID, sport..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8.5 pl-8.5 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none focus:bg-white focus:border-[#F94001]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 4. COURT REQUESTS LIST / CARDS */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-2xs">
            <Layers className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="font-extrabold text-sm text-slate-800">No Court Requests Found</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting the filters or submit a new court extension request.</p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isSubmitted = req.status === 'SUBMITTED';
            const isResubmitted = req.status === 'RESUBMITTED';
            const isApproved = req.status === 'APPROVED';
            const isRejected = req.status === 'REJECTED';

            return (
              <div
                key={req.id}
                className={`bg-white rounded-3xl border p-5 shadow-2xs space-y-4 transition-all hover:shadow-md ${
                  isResubmitted
                    ? 'border-blue-300 ring-1 ring-blue-100'
                    : isSubmitted
                    ? 'border-amber-300 ring-1 ring-amber-100'
                    : isApproved
                    ? 'border-emerald-200'
                    : 'border-rose-200'
                }`}
              >
                {/* Header Row: IDs, Venue Info, Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                      {req.sport.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[11px] font-black text-[#F94001] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/80">
                          {req.id}
                        </span>
                        <Link
                          href={`/admin/venues/${req.venue_id}`}
                          className="font-bold text-xs text-slate-900 hover:text-[#F94001] flex items-center gap-1 transition-colors"
                        >
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          <span>{req.venue_name}</span>
                          <span className="font-mono text-[10px] text-slate-400">({req.venue_id})</span>
                        </Link>
                      </div>
                      <h3 className="text-base font-black text-slate-900 tracking-tight mt-1">
                        {req.court_name}
                      </h3>
                      {req.display_name && (
                        <p className="text-xs text-slate-500 font-medium">Customer Facing: &quot;{req.display_name}&quot;</p>
                      )}
                    </div>
                  </div>

                  {/* Status Pill Badge */}
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    {isSubmitted && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                        <span>1st Submitted</span>
                      </span>
                    )}
                    {isResubmitted && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                        <RotateCcw className="h-3.5 w-3.5 text-blue-600" />
                        <span>Resubmitted (Round {req.submission_count || 2})</span>
                      </span>
                    )}
                    {isApproved && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Approved &amp; Live</span>
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="h-3.5 w-3.5 text-rose-600" />
                        <span>Rejected (Feedback Issued)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle Specifications Strip (From Screenshots) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sport &amp; Ground</span>
                    <p className="font-bold text-slate-800 mt-0.5">{req.sport}</p>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {req.same_physical_sports ? `Shared with ${req.parent_court_name}` : 'Separate Ground'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Standard Rate</span>
                    <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">₹{req.price_per_hour}/hr</p>
                    <span className="text-[10px] text-slate-500">Min: {req.min_booking_duration}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Peak &amp; Weekend</span>
                    <p className="font-mono font-bold text-[#F94001] text-sm mt-0.5">₹{req.peak_price}/hr</p>
                    <span className="text-[10px] text-amber-700 font-medium">Weekend: ₹{req.weekend_price}/hr</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cancellation Rule</span>
                    <p className="font-bold text-emerald-700 text-xs mt-0.5">{req.cancellation_window_hours}h notice buffer</p>
                    <span className="text-[10px] text-slate-500 font-medium">{req.refund_percentage}% refund</span>
                  </div>
                </div>

                {/* Rejection Note Alert if Rejected */}
                {isRejected && req.rejection_notes && (
                  <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-rose-900">Admin Rejection Feedback to Venue Owner:</p>
                      <p className="mt-0.5 text-rose-700 leading-relaxed">{req.rejection_notes}</p>
                    </div>
                  </div>
                )}

                {/* Resubmission Alert if Resubmitted */}
                {isResubmitted && (
                  <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-blue-800 flex items-start gap-2">
                    <RotateCcw className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <p>
                      Venue owner revised court specifications following feedback and resubmitted for Round {req.submission_count || 2} approval.
                    </p>
                  </div>
                )}

                {/* Bottom Action Row */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                  <div className="text-[11px] text-slate-400 font-medium">
                    Owner: <strong className="text-slate-700">{req.owner_name}</strong> ({req.owner_phone})
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Inspect Slide Bar Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRequestForDrawer(req);
                        setIsRejectFormOpen(false);
                      }}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-[#F94001] bg-white text-slate-800 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Eye className="h-3.5 w-3.5 text-[#F94001]" />
                      <span>Review Details (Slide Bar)</span>
                    </button>

                    {/* Quick Approve */}
                    {!isApproved && (
                      <button
                        type="button"
                        onClick={() => handleApproveRequest(req)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Approve Court</span>
                      </button>
                    )}

                    {/* If Rejected: Edit & Resubmit */}
                    {isRejected && (
                      <button
                        type="button"
                        onClick={() => handleOpenAddModal(req)}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Edit &amp; Resubmit</span>
                      </button>
                    )}

                    {/* Delete Request (Venue ID based action) */}
                    <button
                      type="button"
                      onClick={() => handleDeleteRequest(req)}
                      className="h-8.5 w-8.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                      title={`Delete request ${req.id} for ${req.venue_id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================
          RIGHT-SIDE SLIDE BAR (DRAWER) FOR COURT REQUEST INSPECTION
      ======================================================== */}
      {selectedRequestForDrawer && (
        <div
          className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
          onClick={() => setSelectedRequestForDrawer(null)}
        >
          <div
            className="w-full max-w-xl bg-white shadow-2xl h-full flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 border-l border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-[#091522] to-slate-900 text-white flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#F94001] uppercase tracking-wider font-extrabold bg-white/10 px-2 py-0.5 rounded">
                    {selectedRequestForDrawer.id}
                  </span>
                  <span className="text-[10px] font-mono text-slate-300 font-bold">
                    Venue: {selectedRequestForDrawer.venue_id}
                  </span>
                </div>
                <h3 className="text-lg font-black font-display mt-1">{selectedRequestForDrawer.court_name}</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {selectedRequestForDrawer.venue_name} &bull; {selectedRequestForDrawer.sport}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequestForDrawer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Body Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Status Banner */}
              <div
                className={`p-3 rounded-2xl border flex items-center justify-between ${
                  selectedRequestForDrawer.status === 'APPROVED'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : selectedRequestForDrawer.status === 'RESUBMITTED'
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : selectedRequestForDrawer.status === 'SUBMITTED'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                <div>
                  <span className="font-extrabold uppercase text-[10px] tracking-wider block">
                    Current Review State
                  </span>
                  <p className="font-black text-sm mt-0.5">
                    {selectedRequestForDrawer.status === 'SUBMITTED'
                      ? '1st Round Submitted (Awaiting Review)'
                      : selectedRequestForDrawer.status === 'RESUBMITTED'
                      ? `Resubmitted (Round ${selectedRequestForDrawer.submission_count || 2})`
                      : selectedRequestForDrawer.status === 'APPROVED'
                      ? 'Approved & Live on Venue'
                      : 'Rejected (Feedback Issued to Vendor)'}
                  </p>
                </div>
                <span className="font-mono text-[10px] px-2.5 py-1 rounded-full bg-white/80 font-bold border border-slate-200">
                  {selectedRequestForDrawer.status}
                </span>
              </div>

              {/* Venue & Owner Credentials */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Venue &amp; Partner Identification</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Venue ID:</span>
                    <strong className="text-slate-900 font-mono">{selectedRequestForDrawer.venue_id}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Venue Name:</span>
                    <strong className="text-slate-900">{selectedRequestForDrawer.venue_name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Owner / Licensee:</span>
                    <strong className="text-slate-900">{selectedRequestForDrawer.owner_name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Contact Mobile:</span>
                    <strong className="text-slate-900 font-mono">{selectedRequestForDrawer.owner_phone}</strong>
                  </div>
                </div>
              </div>

              {/* Court Specs (from Screenshot Form) */}
              <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Configured Specs (Form Submission)</span>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50">
                    <span className="text-slate-400 text-[10px] block">Physical Ground:</span>
                    <strong className="text-slate-800 font-medium">
                      {selectedRequestForDrawer.same_physical_sports
                        ? `Shared Ground (${selectedRequestForDrawer.parent_court_name})`
                        : 'No (Separate Ground)'}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50">
                    <span className="text-slate-400 text-[10px] block">Sport:</span>
                    <strong className="text-slate-800 font-bold">{selectedRequestForDrawer.sport}</strong>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 text-white space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Regular Hourly Price:</span>
                    <strong className="font-mono text-base font-bold text-white">₹{selectedRequestForDrawer.price_per_hour}/hr</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Peak Rate ({selectedRequestForDrawer.peak_hours_start}–{selectedRequestForDrawer.peak_hours_end}):</span>
                    <strong className="font-mono text-base font-bold text-[#F94001]">₹{selectedRequestForDrawer.peak_price}/hr</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Weekend Rate ({selectedRequestForDrawer.peak_days.join(', ')}):</span>
                    <strong className="font-mono text-base font-bold text-amber-400">₹{selectedRequestForDrawer.weekend_price}/hr</strong>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Cancellation Payout Policy</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Free cancellation permitted up to {selectedRequestForDrawer.cancellation_window_hours} Hours before kickoff with {selectedRequestForDrawer.refund_percentage}% refund.
                  </p>
                </div>
              </div>

              {/* Multi-Round Lifecycle & Review History Timeline */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-1.5">
                  <History className="h-4 w-4 text-slate-500" />
                  <span className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">
                    Multi-Round Submission &amp; Review History
                  </span>
                </div>

                <div className="space-y-3 pl-2 border-l-2 border-slate-300">
                  {selectedRequestForDrawer.history.map((h, idx) => (
                    <div key={idx} className="relative pl-3 space-y-0.5">
                      <div className="absolute -left-[19px] top-1 h-3 w-3 rounded-full bg-white border-2 border-slate-500" />
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                            h.action === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : h.action === 'RESUBMITTED'
                              ? 'bg-blue-100 text-blue-800'
                              : h.action === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {h.action} (Round {h.round})
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{h.timestamp}</span>
                      </div>
                      {h.reviewer && (
                        <p className="text-[10px] text-slate-500">
                          Reviewed by: <strong className="text-slate-700">{h.reviewer}</strong>
                        </p>
                      )}
                      {h.notes && (
                        <p className="text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200 mt-1 leading-relaxed">
                          {h.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Rejection Form Box (Expandable) */}
              {isRejectFormOpen && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                    <XCircle className="h-4 w-4 text-rose-600" />
                    <span>Issue Rejection Notes to Venue Owner</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                      Rejection Reason Category
                    </label>
                    <select
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-xl border border-rose-300 bg-white text-xs font-semibold text-slate-800 outline-none"
                    >
                      {REJECTION_REASONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                      Required Corrections / Instructions
                    </label>
                    <textarea
                      rows={3}
                      value={rejectionNote}
                      onChange={(e) => setRejectionNote(e.target.value)}
                      placeholder="e.g. Please reduce weekend rate to ₹1500 and verify minimum 1 hour booking..."
                      className="w-full p-2.5 rounded-xl border border-rose-300 bg-white text-xs text-slate-800 outline-none"
                    />
                  </div>

                  {actionError && (
                    <p className="text-xs text-rose-700 font-bold">{actionError}</p>
                  )}

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRejectFormOpen(false)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectRequest(selectedRequestForDrawer)}
                      className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Slide Bar Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
              {/* Delete Request with Venue ID based action */}
              <button
                type="button"
                onClick={() => handleDeleteRequest(selectedRequestForDrawer)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-100 font-bold text-xs transition-colors cursor-pointer"
                title={`Delete court request for ${selectedRequestForDrawer.venue_id}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Request</span>
              </button>

              <div className="flex items-center gap-2 ml-auto">
                {/* Edit & Resubmit if rejected */}
                {selectedRequestForDrawer.status === 'REJECTED' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenAddModal(selectedRequestForDrawer);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Edit &amp; Resubmit</span>
                  </button>
                )}

                {/* Reject Button (Toggle Form) */}
                {selectedRequestForDrawer.status !== 'REJECTED' && !isRejectFormOpen && (
                  <button
                    type="button"
                    onClick={() => setIsRejectFormOpen(true)}
                    className="px-3.5 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Reject with Notes</span>
                  </button>
                )}

                {/* Approve Button */}
                {selectedRequestForDrawer.status !== 'APPROVED' && (
                  <button
                    type="button"
                    onClick={() => handleApproveRequest(selectedRequestForDrawer)}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Check className="h-4 w-4" />
                    <span>Approve &amp; Activate</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          ADD NEW COURT / TURF MODAL (EXACT REPLICA OF SCREENSHOTS 1, 2, 3)
      ======================================================== */}
      {isFormModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsFormModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-orange-50 border border-orange-200/80 text-[#F94001] flex items-center justify-center shrink-0">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {editingRequestForResubmit ? 'Edit & Resubmit Court Request' : 'Add New Court / Turf'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Configure specs, pricing and cancellation policy
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              {/* Target Venue Selection */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Target Venue Arena *
                </label>
                <select
                  value={formVenueId}
                  onChange={(e) => setFormVenueId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 outline-none focus:border-[#F94001]"
                >
                  {INITIAL_VENUES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.venue_name} ({v.district}, {v.state}) — {v.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* ❶ SECTION 1: SAME PHYSICAL SPORTS FOR THIS TURF? (Screenshot 1) */}
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                      1
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs">Same physical sports for this turf?</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-orange-50 text-[#F94001] border border-orange-200 text-[10px] font-bold">
                    Required
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Select <strong>Yes</strong> if this sport will share the ground with an already live physical court (e.g. Football pitch also used for Box Cricket).
                </p>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setFormSamePhysicalSports(true)}
                    className={`h-11 rounded-2xl font-bold text-xs transition-all cursor-pointer border ${
                      formSamePhysicalSports
                        ? 'border-[#F94001] text-[#F94001] bg-white shadow-xs'
                        : 'border-slate-200 bg-white/60 text-slate-600 hover:bg-white'
                    }`}
                  >
                    Yes (Share Physical Ground)
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormSamePhysicalSports(false)}
                    className={`h-11 rounded-2xl font-bold text-xs transition-all cursor-pointer border ${
                      !formSamePhysicalSports
                        ? 'border-[#F94001] text-[#F94001] bg-white shadow-xs'
                        : 'border-slate-200 bg-white/60 text-slate-600 hover:bg-white'
                    }`}
                  >
                    {!formSamePhysicalSports && <span className="mr-1">&check;</span>} No (Separate Ground)
                  </button>
                </div>

                {formSamePhysicalSports && (
                  <div className="pt-2">
                    <label className="block text-slate-600 font-bold mb-1 text-[11px]">
                      Select Live Parent Court Shared:
                    </label>
                    <input
                      type="text"
                      value={formParentCourtName}
                      onChange={(e) => setFormParentCourtName(e.target.value)}
                      placeholder="e.g. Turf 1 Football"
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 outline-none"
                    />
                  </div>
                )}
              </div>

              {/* ❷ SECTION 2: COURT INFORMATION (Screenshot 1) */}
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                    2
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs">Court Information</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                      Select Sport <span className="text-[#F94001]">*</span>
                    </label>
                    <select
                      value={formSport}
                      onChange={(e) => setFormSport(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold outline-none focus:border-[#F94001]"
                    >
                      <option value="Football">Football</option>
                      <option value="Cricket">Cricket</option>
                      <option value="Box Cricket">Box Cricket</option>
                      <option value="Badminton">Badminton</option>
                      <option value="Pickleball">Pickleball</option>
                      <option value="Tennis">Tennis</option>
                      <option value="Basketball">Basketball</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                      Court Name <span className="text-[#F94001]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formCourtName}
                      onChange={(e) => setFormCourtName(e.target.value)}
                      placeholder="e.g. Turf 1A (5-a-side)"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold outline-none focus:border-[#F94001]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                    Display Name <span className="text-slate-400 font-normal">(Customer-Facing, optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formDisplayName}
                    onChange={(e) => setFormDisplayName(e.target.value)}
                    placeholder="e.g. Main Arena Pitch 1 (Floodlit Turf)"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:border-[#F94001]"
                  />
                </div>
              </div>

              {/* ❸ SECTION 3: BASE DURATION & RATE (Screenshot 1 & 2) */}
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                    3
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs">Base Duration &amp; Rate</h4>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1 text-[11px]">
                    Minimum Booking Duration
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {['30 Mins', '1 Hour', '1.5 Hours', '2 Hours', '3 Hours'].map((dur) => {
                      const isSelected = formMinDuration === dur;
                      return (
                        <button
                          key={dur}
                          type="button"
                          onClick={() => setFormMinDuration(dur)}
                          className={`h-9 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#F94001] text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {dur}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                    Regular Hourly Price (₹/hour) <span className="text-[#F94001]">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 font-bold text-slate-700">₹</span>
                    <input
                      type="number"
                      required
                      value={formPricePerHour}
                      onChange={(e) => setFormPricePerHour(Number(e.target.value))}
                      placeholder="1000"
                      className="w-full h-10 pl-8 pr-16 rounded-xl border border-slate-200 bg-white font-bold font-mono text-sm text-slate-900 outline-none focus:border-[#F94001]"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-slate-400">/ hour</span>
                  </div>
                </div>
              </div>

              {/* ❹ SECTION 4: PEAK SURCHARGE & WEEKEND RATES (Screenshot 2) */}
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                      4
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs">Peak Surcharge &amp; Weekend Rates</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-orange-50 text-[#F94001] border border-orange-200 text-[10px] font-bold">
                    High Demand
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">PEAK START</label>
                    <select
                      value={formPeakStart}
                      onChange={(e) => setFormPeakStart(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-800 font-bold outline-none"
                    >
                      <option value="05:00 PM">05:00 PM</option>
                      <option value="06:00 PM">06:00 PM</option>
                      <option value="07:00 PM">07:00 PM</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">PEAK END</label>
                    <select
                      value={formPeakEnd}
                      onChange={(e) => setFormPeakEnd(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-800 font-bold outline-none"
                    >
                      <option value="10:00 PM">10:00 PM</option>
                      <option value="11:00 PM">11:00 PM</option>
                      <option value="12:00 AM">12:00 AM</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1 text-[11px]">Peak Rate (₹/hr)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 font-bold text-slate-700">₹</span>
                      <input
                        type="number"
                        value={formPeakPrice}
                        onChange={(e) => setFormPeakPrice(Number(e.target.value))}
                        className="w-full h-9 pl-7 pr-3 rounded-xl border border-slate-200 bg-white font-bold font-mono text-xs text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1 text-[11px]">Weekend Rate (₹/hr)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 font-bold text-slate-700">₹</span>
                      <input
                        type="number"
                        value={formWeekendPrice}
                        onChange={(e) => setFormWeekendPrice(Number(e.target.value))}
                        className="w-full h-9 pl-7 pr-3 rounded-xl border border-slate-200 bg-white font-bold font-mono text-xs text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-slate-600">Active Peak Days</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200">
                      Fri-Sun Preset
                    </span>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                      const isSelected = formPeakDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleTogglePeakDay(day)}
                          className={`h-8 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#F94001] text-white shadow-2xs'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ❺ FREE CANCELLATION WINDOW (Screenshot 2 & 3) */}
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-orange-100 text-[#F94001] flex items-center justify-center">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Free Cancellation Window</h4>
                    <p className="text-[10px] text-slate-400">Minimum notice required for full or partial refund</p>
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] text-slate-600 font-medium mb-1">
                    Notice Buffer Before Match Kickoff:
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {[2, 4, 12, 24].map((hours) => {
                      const isSelected = formCancellationHours === hours;
                      return (
                        <button
                          key={hours}
                          type="button"
                          onClick={() => setFormCancellationHours(hours)}
                          className={`h-9 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#F94001] text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {hours} Hours
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ❻ REFUND PAYOUT PERCENTAGE (Screenshot 3) */}
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    %
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Refund Payout Percentage</h4>
                    <p className="text-[10px] text-slate-400">Amount returned to customer source account</p>
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] text-slate-600 font-medium mb-1">
                    Eligible Refund Value:
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {[50, 75, 90, 100].map((pct) => {
                      const isSelected = formRefundPercentage === pct;
                      return (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setFormRefundPercentage(pct)}
                          className={`h-9 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {pct}%
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ❼ CUSTOMER CANCELLATION RULE BANNER (Screenshot 3) */}
              <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-xl p-3 flex items-center gap-2 text-xs text-emerald-900 font-medium">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Customer Cancellation Rule:</strong> Free cancellation permitted up to{' '}
                  {formCancellationHours} Hours before kickoff with {formRefundPercentage}% refund.
                </span>
              </div>

              {/* ❽ SUBMIT BUTTON (Screenshot 3) */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-12 rounded-2xl bg-[#F94001] hover:bg-[#E03800] text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md active:scale-98"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>
                    {editingRequestForResubmit ? '✨ Resubmit Court for Approval' : '✨ Submit Court for Approval'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-2xl bg-[#091522] text-white border border-emerald-500/30 shadow-2xl flex items-start gap-3 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-bold text-sm text-white mb-0.5">{toastMessage.title}</p>
            <p className="text-slate-300 leading-relaxed">{toastMessage.description}</p>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
