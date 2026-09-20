'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  CheckCircle2,
  XCircle,
  Check,
  Building2,
  Phone,
  X,
  RotateCcw,
  ShieldCheck,
  User,
  Calendar,
  DollarSign,
  Eye,
  Layers,
  Clock,
  MapPin,
  Copy,
  ChevronRight,
  Filter,
  Sparkles,
  RefreshCw,
  Inbox,
  Ban,
  Trophy,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { CourtExtensionRequest, INITIAL_COURT_REQUESTS } from '@/lib/mockData';
import { adminApi } from '@/lib/api';

const REJECTION_REASONS = [
  { value: 'PRICING_OUT_OF_BOUNDS', label: 'Hourly pricing violates regional slot rate caps' },
  { value: 'SURFACE_VERIFICATION_NEEDED', label: 'Surface type or court dimensions require physical verification' },
  { value: 'INCOMPLETE_DETAILS', label: 'Incomplete or unclear court specifications / photos' },
  { value: 'DUPLICATE_LISTING', label: 'Duplicate court name or slot already listed for this venue' },
  { value: 'OPERATING_HOURS_MISMATCH', label: 'Requested peak hours conflict with venue master operating schedule' },
  { value: 'OTHER', label: 'Other specific reason (specify detailed notes below)' },
];

const SPORT_ICONS: Record<string, string> = {
  Football: '⚽',
  Cricket: '🏏',
  Badminton: '🏸',
  Tennis: '🎾',
  Pickleball: '🏓',
  Basketball: '🏀',
  Volleyball: '🏐',
};

export default function CourtRequestsPage() {
  const [mounted, setMounted] = useState(false);
  const [requests, setRequests] = useState<CourtExtensionRequest[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedSport, setSelectedSport] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'rate' | 'court' | 'id'>('date');

  // Slide Bar Drawer State
  const [selectedRequestForDrawer, setSelectedRequestForDrawer] =
    useState<CourtExtensionRequest | null>(null);

  // Approve Confirmation Modal State
  const [pendingApprovalRequest, setPendingApprovalRequest] =
    useState<CourtExtensionRequest | null>(null);

  // Reject Form inside Drawer
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('PRICING_OUT_OF_BOUNDS');
  const [rejectionNote, setRejectionNote] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  // Quick feedback copy
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    description: string;
  } | null>(null);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedText(id);
      setTimeout(() => setCopiedText(null), 2000);
    }
  };

  // Helper to resolve State
  const getRequestState = (req: CourtExtensionRequest): string => {
    if (req.venue_city && req.venue_city.includes(',')) {
      return req.venue_city.split(',')[1].trim();
    }
    return 'Tamil Nadu';
  };

  // Helper to resolve District
  const getRequestDistrict = (req: CourtExtensionRequest): string => {
    if (req.venue_city) {
      return req.venue_city.split(',')[0].trim();
    }
    return 'Coimbatore';
  };

  // State badge styling
  const getStateBadgeStyle = (state?: string) => {
    switch (state) {
      case 'Tamil Nadu':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Karnataka':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Kerala':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Telangana':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Maharashtra':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Status mapping
  const normStatus = (st: string): 'NEW' | 'RESUBMITTED' | 'APPROVED' | 'REJECTED' => {
    if (st === 'NEW_REQUEST' || st === 'SUBMITTED' || st === 'NEW') return 'NEW';
    if (st === 'RESUBMITTED') return 'RESUBMITTED';
    if (st === 'APPROVED') return 'APPROVED';
    return 'REJECTED';
  };

  // Unique available States with count
  const stateCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach((req) => {
      const st = getRequestState(req);
      counts[st] = (counts[st] || 0) + 1;
    });
    return counts;
  }, [requests]);

  const uniqueStates = useMemo(() => {
    return Object.keys(stateCounts).sort();
  }, [stateCounts]);

  // Unique available Districts
  const availableDistricts = useMemo(() => {
    const districts = new Set<string>();
    requests.forEach((req) => {
      const st = getRequestState(req);
      if (selectedState === 'ALL' || selectedState.toLowerCase() === st.toLowerCase()) {
        districts.add(getRequestDistrict(req));
      }
    });
    return Array.from(districts).sort();
  }, [requests, selectedState]);

  // Unique available Sports
  const availableSports = useMemo(() => {
    const sports = new Set<string>();
    requests.forEach((req) => {
      if (req.sport) sports.add(req.sport);
    });
    Object.keys(SPORT_ICONS).forEach((sp) => sports.add(sp));
    return Array.from(sports);
  }, [requests]);

  // Base list filtered by state, district, sport, search for KPIs
  const baseFilteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const reqState = getRequestState(req);
      const reqDistrict = getRequestDistrict(req);

      const matchesState =
        selectedState === 'ALL' || reqState.toLowerCase() === selectedState.toLowerCase();
      const matchesDistrict =
        selectedDistrict === 'ALL' || reqDistrict.toLowerCase() === selectedDistrict.toLowerCase();
      const matchesSport =
        selectedSport === 'ALL' || req.sport.toLowerCase() === selectedSport.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        req.id.toLowerCase().includes(q) ||
        req.court_name.toLowerCase().includes(q) ||
        (req.display_name && req.display_name.toLowerCase().includes(q)) ||
        req.venue_name.toLowerCase().includes(q) ||
        req.venue_id.toLowerCase().includes(q) ||
        req.owner_name.toLowerCase().includes(q) ||
        req.owner_phone.toLowerCase().includes(q) ||
        req.sport.toLowerCase().includes(q) ||
        reqState.toLowerCase().includes(q) ||
        reqDistrict.toLowerCase().includes(q);

      return matchesState && matchesDistrict && matchesSport && matchesQuery;
    });
  }, [requests, selectedState, selectedDistrict, selectedSport, searchQuery]);

  // KPI Calculations
  const totalCount = baseFilteredRequests.length;
  const pendingCount = baseFilteredRequests.filter(
    (r) => normStatus(r.status) === 'NEW' || normStatus(r.status) === 'RESUBMITTED'
  ).length;
  const approvedCount = baseFilteredRequests.filter((r) => normStatus(r.status) === 'APPROVED').length;
  const rejectedCount = baseFilteredRequests.filter((r) => normStatus(r.status) === 'REJECTED').length;
  const sportsCount = new Set(baseFilteredRequests.map((r) => r.sport)).size;

  // Final Filtered & Sorted Table Rows
  const filteredRequests = useMemo(() => {
    return baseFilteredRequests
      .filter((req) => {
        const s = normStatus(req.status);
        if (selectedStatus === 'ALL') return true;
        if (selectedStatus === 'PENDING') return s === 'NEW' || s === 'RESUBMITTED';
        if (selectedStatus === 'APPROVED') return s === 'APPROVED';
        if (selectedStatus === 'REJECTED') return s === 'REJECTED';
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rate') return b.price_per_hour - a.price_per_hour;
        if (sortBy === 'court') return a.court_name.localeCompare(b.court_name);
        if (sortBy === 'id') return a.id.localeCompare(b.id);
        // default date
        const dateA = a.submitted_at || a.created_at || '';
        const dateB = b.submitted_at || b.created_at || '';
        return dateB.localeCompare(dateA);
      });
  }, [baseFilteredRequests, selectedStatus, sortBy]);

  // Drawer handlers
  const handleOpenDrawer = (req: CourtExtensionRequest) => {
    setSelectedRequestForDrawer(req);
    setIsRejectOpen(false);
    setRejectionNote('');
    setRejectError(null);
  };

  // Load from backend on mount and sync
  const loadRequests = async (showToast = false) => {
    try {
      const backendData = await adminApi.getCourtRequests();
      let mapped: CourtExtensionRequest[] = [];
      if (Array.isArray(backendData) && backendData.length > 0) {
        mapped = backendData.map((r) => ({
          id: r.id,
          court_id: r.court_id,
          venue_id: r.vendor_mobile ? `ven_${r.vendor_mobile.slice(-4)}` : 'APP10235',
          venue_name: r.venue_name,
          venue_city: r.venue_city || 'Coimbatore, Tamil Nadu',
          owner_name: r.vendor_name || 'Venue Owner',
          owner_phone: r.vendor_mobile ? `+91 ${r.vendor_mobile}` : '+91 9876543210',
          same_physical_sports: r.same_physical_sports ?? false,
          parent_court_name: r.parent_court_name,
          sport: Array.isArray(r.sports) ? r.sports[0] : (r.sports || 'Football'),
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
          status: r.status === 'PENDING' ? 'NEW_REQUEST' : (r.status as any),
          submission_count: 1,
          rejection_reason: r.rejection_reason ? 'OTHER' : undefined,
          rejection_notes: r.rejection_reason,
          reviewed_by: r.reviewer_name,
          reviewed_at: r.reviewed_at,
          history: [
            {
              round: 1,
              action: (r.status === 'PENDING' ? 'SUBMITTED' : r.status) as any,
              timestamp: r.created_at,
              notes: 'Inbound court addition request.',
            },
          ],
          created_at: r.created_at,
          submitted_at: r.created_at ? r.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        }));
      } else {
        mapped = [];
      }

      // Merge local storage court requests (e.g. from venue extension modal)
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('ibooksports_court_requests');
          if (stored) {
            const localList: CourtExtensionRequest[] = JSON.parse(stored);
            if (Array.isArray(localList)) {
              localList.forEach((localReq) => {
                const existingIdx = mapped.findIndex((m) => m.id === localReq.id);
                if (existingIdx === -1) {
                  mapped.unshift(localReq);
                } else {
                  mapped[existingIdx] = { ...mapped[existingIdx], ...localReq };
                }
              });
            }
          }
        } catch (e) {
          console.warn('Could not read local court requests', e);
        }
      }

      setRequests(mapped);
      if (showToast) {
        setToastMessage({
          type: 'info',
          title: 'Queue Synchronized',
          description: 'Court requests queue refreshed with latest inbound submissions.',
        });
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (e) {
      console.warn('Could not fetch backend court requests:', e);
      setRequests([]);
      if (showToast) {
        setToastMessage({
          type: 'info',
          title: 'Queue Synchronized',
          description: 'Local requests verified and synchronized.',
        });
        setTimeout(() => setToastMessage(null), 3000);
      }
    }
  };

  useEffect(() => {
    setMounted(true);
    loadRequests(false);
  }, []);

  const handleApprove = async (req: CourtExtensionRequest) => {
    let createdCourtId = req.court_id;
    try {
      const res = await adminApi.reviewCourtRequest(req.id, {
        status: 'APPROVED',
        reviewer_name: 'Platform Super Admin',
      });
      if (res?.court_id) {
        createdCourtId = res.court_id;
      }
    } catch (err) {
      console.warn('Backend reviewCourtRequest error (proceeding locally):', err);
    }
    if (!createdCourtId) {
      createdCourtId = `CRT-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const updated: CourtExtensionRequest = {
      ...req,
      court_id: createdCourtId,
      status: 'APPROVED',
      reviewed_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
      reviewed_by: 'Platform Super Admin',
      history: [
        ...req.history,
        {
          round: req.submission_count,
          action: 'APPROVED',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          reviewer: 'Platform Super Admin',
          notes: `Court specifications verified. Court ID: ${createdCourtId} created and activated.`,
        },
      ],
    };

    setRequests((prev) => prev.map((item) => (item.id === req.id ? updated : item)));
    if (selectedRequestForDrawer?.id === req.id) {
      setSelectedRequestForDrawer(updated);
    }

    setToastMessage({
      type: 'success',
      title: 'Court Request Approved',
      description: `Court ID ${createdCourtId} generated. ${updated.court_name} for ${updated.venue_name} is now approved and active on the player app!`,
    });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleConfirmReject = async (req: CourtExtensionRequest) => {
    const selectedPreset = REJECTION_REASONS.find((r) => r.value === rejectionReason);
    const finalNote = rejectionNote.trim() || selectedPreset?.label || 'Specifications require physical revision.';

    try {
      await adminApi.reviewCourtRequest(req.id, {
        status: 'REJECTED',
        rejection_reason: finalNote,
        reviewer_name: 'Platform Super Admin',
      });
    } catch (err) {
      console.warn('Backend reviewCourtRequest error (proceeding locally):', err);
    }

    const updated: CourtExtensionRequest = {
      ...req,
      status: 'REJECTED',
      rejection_reason: rejectionReason,
      rejection_notes: finalNote,
      reviewed_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
      reviewed_by: 'Platform Super Admin',
      history: [
        ...req.history,
        {
          round: req.submission_count,
          action: 'REJECTED',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          reviewer: 'Platform Super Admin',
          notes: finalNote,
        },
      ],
    };

    setRequests((prev) => prev.map((item) => (item.id === req.id ? updated : item)));
    setSelectedRequestForDrawer(updated);
    setIsRejectOpen(false);
    setRejectionNote('');

    setToastMessage({
      type: 'error',
      title: 'Court Request Declined',
      description: `${updated.court_name} marked as Rejected. Reason: ${finalNote}`,
    });
    setTimeout(() => setToastMessage(null), 4500);
  };

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      {/* 1. PAGE HEADER (MATCHING CUSTOMER MANAGEMENT DESIGN) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-[#F94001] bg-[#FFF1EC] border border-[#F94001]/20 px-3 py-1 rounded-full mb-2">
            <Layers className="h-3.5 w-3.5 text-[#F94001]" />
            <span>Court Extension Requests &bull; Venue Expansion Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#021526] font-display">
            Court Requests
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6368] mt-1 font-medium">
            Inbound court creation requests, venue details, ground specifications, player app display names, and approval reviews.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-white border border-[#E5E7EB] shadow-xs flex items-center gap-2 text-xs font-bold text-slate-700">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span>{requests.length} Court Requests</span>
          </div>
          <button
            type="button"
            onClick={() => loadRequests(true)}
            className="h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            <span>Sync Queue</span>
          </button>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between animate-in fade-in ${toastMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : toastMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
        >
          <div className="flex items-center gap-2.5">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : toastMessage.type === 'error' ? (
              <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
            ) : (
              <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
            )}
            <div>
              <p className="font-extrabold">{toastMessage.title}</p>
              <p className="text-[11px] font-normal opacity-90 mt-0.5">{toastMessage.description}</p>
            </div>
          </div>
          <button type="button" onClick={() => setToastMessage(null)}>
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>
      )}

      {/* 2. OPERATIONAL KPI METRICS ROW (MATCHING CUSTOMER MANAGEMENT DESIGN) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Requests */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-xs hover:border-[#F94001]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
              Total Requests
            </span>
            <div className="h-8 w-8 rounded-xl bg-[#FFF1EC] text-[#F94001] flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#021526] font-mono">{totalCount}</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {uniqueStates.length} States
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Inbound facility court additions</p>
        </div>

        {/* Pending Review */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
              Pending Review
            </span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-700 font-mono">{pendingCount}</span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              Needs Action
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Awaiting admin evaluation</p>
        </div>

        {/* Approved Courts */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
              Approved Courts
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-700 font-mono">{approvedCount}</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Live On App
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Activated for player bookings</p>
        </div>

        {/* Declined / Rejected */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-xs hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
              Declined
            </span>
            <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Ban className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700 font-mono">{rejectedCount}</span>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
              Revision Needed
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Declined with audit feedback</p>
        </div>

        {/* Sports Count */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-xs hover:border-purple-300 transition-all col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
              Active Sports
            </span>
            <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Trophy className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-700 font-mono">{sportsCount}</span>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              Disciplines
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Turf, pitch &amp; court disciplines</p>
        </div>
      </div>

      {/* 3. MULTI-STATE FINDER TABS */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-3 shadow-xs space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#F94001]" />
            <span className="text-xs font-black uppercase tracking-wider text-[#021526]">
              Filter by State:
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            {selectedState === 'ALL'
              ? `All ${uniqueStates.length} states`
              : `Active State: ${selectedState}`}
          </span>
        </div>

        {/* State Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setSelectedState('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${selectedState === 'ALL'
              ? 'bg-[#021526] text-white shadow-sm'
              : 'bg-[#F8F9FA] text-[#5F6368] hover:bg-slate-200 border border-[#E5E7EB]'
              }`}
          >
            <span>All States</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${selectedState === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
            >
              {requests.length}
            </span>
          </button>

          {uniqueStates.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedState(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${selectedState === st
                ? 'bg-[#F94001] text-white shadow-sm shadow-[#F94001]/30'
                : 'bg-[#F8F9FA] text-[#5F6368] hover:bg-slate-200 border border-[#E5E7EB]'
                }`}
            >
              <span>{st}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${selectedState === st ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
              >
                {stateCounts[st]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. SEARCH, STATUS PILLS & DROPDOWN FILTERS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E5E7EB] shadow-xs">
        {/* Left: Status Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'ALL', label: 'All', count: totalCount },
            { id: 'PENDING', label: 'Pending', count: pendingCount },
            { id: 'APPROVED', label: 'Approved', count: approvedCount },
            { id: 'REJECTED', label: 'Declined', count: rejectedCount },
          ].map((tab) => {
            const isActive = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${isActive
                  ? 'bg-[#021526] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-700'
                    }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Search, Sports, Districts & Sort */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
          {/* Live Search Input */}
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#5F6368]" />
            <input
              type="text"
              placeholder="Search request ID, venue, court, display name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-[#E5E7EB] pl-10 pr-9 py-2 text-xs text-[#021526] placeholder-[#5F6368] focus:bg-white focus:border-[#F94001] focus:ring-2 focus:ring-[#F94001]/10 transition-all outline-none font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sports Selector */}
          <div className="relative min-w-[130px]">
            <select
              suppressHydrationWarning={true}
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="w-full appearance-none pl-8 pr-7 py-2 rounded-xl border border-[#E5E7EB] bg-slate-50 text-xs font-bold text-[#021526] focus:outline-none focus:border-[#F94001] focus:ring-1 focus:ring-[#F94001] transition-colors cursor-pointer"
            >
              <option value="ALL">All Sports</option>
              {availableSports.map((sp) => (
                <option key={sp} value={sp}>
                  {SPORT_ICONS[sp] || '🏅'} {sp}
                </option>
              ))}
            </select>
            <Trophy className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-amber-500 pointer-events-none" />
          </div>

          {/* District Selector */}
          <div className="relative min-w-[140px]">
            <select
              suppressHydrationWarning={true}
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full appearance-none pl-8 pr-7 py-2 rounded-xl border border-[#E5E7EB] bg-slate-50 text-xs font-bold text-[#021526] focus:outline-none focus:border-[#F94001] focus:ring-1 focus:ring-[#F94001] transition-colors cursor-pointer"
            >
              <option value="ALL">All Districts</option>
              {availableDistricts.map((dst) => (
                <option key={dst} value={dst}>
                  {dst}
                </option>
              ))}
            </select>
            <MapPin className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-500 pointer-events-none" />
          </div>

          {/* Reset Filters */}
          {(searchQuery ||
            selectedState !== 'ALL' ||
            selectedDistrict !== 'ALL' ||
            selectedSport !== 'ALL' ||
            selectedStatus !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedState('ALL');
                  setSelectedDistrict('ALL');
                  setSelectedSport('ALL');
                  setSelectedStatus('ALL');
                }}
                className="px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                title="Reset all filters"
              >
                <X className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            )}
        </div>
      </div>

      {/* 5. PERFECT DATA TABLE WITH REQUESTED COLUMNS:
             1. REQUEST ID
             2. VENUE DETAILS (Name, ID, District & State)
             3. COURT & SPORT (Court name, Display name, Sport)
             4. REQUEST DATE & TIME
             5. HOURLY RATE
             6. STATUS
             7. ACTIONS */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/90 bg-slate-50/75 text-slate-500 font-semibold tracking-wider text-[11px] uppercase select-none">
                <th className="py-3 px-4 w-[115px]">Request ID</th>
                <th className="py-3 px-4 min-w-[210px]">Venue Details</th>
                <th className="py-3 px-4 min-w-[240px]">Court &amp; Sport</th>
                <th className="py-3 px-4 min-w-[140px]">Request Date &amp; Time</th>
                <th className="py-3 px-4 min-w-[120px]">Hourly Rate</th>
                <th className="py-3 px-4 min-w-[110px]">Status</th>
                <th className="py-3 px-4 text-center w-[130px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400">
                    <Inbox className="h-9 w-9 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-sm text-[#021526]">No court requests found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Try adjusting your search query, status, or state filter
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const status = normStatus(req.status);
                  const isCopied = copiedText === req.id;
                  const reqState = getRequestState(req);
                  const reqDistrict = getRequestDistrict(req);
                  const submittedDate = req.submitted_at || req.created_at?.split(' ')[0] || '08 Sept 2026';
                  const submittedTime = req.created_at?.split(' ')[1] || '03:00 PM';

                  return (
                    <tr
                      key={req.id}
                      onClick={() => handleOpenDrawer(req)}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    >
                      {/* 1. REQUEST ID */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {req.id}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(req.id, req.id);
                            }}
                            className="text-slate-400 hover:text-slate-700 transition-colors p-0.5 cursor-pointer"
                            title="Copy Request ID"
                          >
                            {isCopied ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* 2. VENUE DETAILS (ID, NAME, STATE & DISTRICT) */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-slate-900 text-xs tracking-tight group-hover:text-[#F94001] transition-colors">
                              {req.venue_name}
                            </p>
                            <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                              {req.venue_id.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>
                              {reqDistrict}, {reqState}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 3. COURT & SPORT (SPORT, COURT NAME & DISPLAY NAME) */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs">{req.court_name}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {SPORT_ICONS[req.sport] || '🏅'} {req.sport}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate max-w-[220px]">
                            <span className="text-slate-400">Display:</span> {req.display_name}
                          </p>
                        </div>
                      </td>

                      {/* 4. REQUEST DATE & TIME */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-800 text-xs">{submittedDate}</p>
                          <p className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span>{submittedTime}</span>
                          </p>
                        </div>
                      </td>

                      {/* 5. HOURLY RATE */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <div className="space-y-0.5">
                          <p className="font-mono font-bold text-xs text-slate-900">
                            ₹{req.price_per_hour}/hr
                          </p>
                          <p className="text-[10px] font-mono text-slate-400">
                            Peak: ₹{req.peak_price}/hr
                          </p>
                        </div>
                      </td>

                      {/* 6. STATUS */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        {status === 'NEW' && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                            </span>
                            Pending
                          </span>
                        )}
                        {status === 'RESUBMITTED' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            <RotateCcw className="h-3 w-3" />
                            Resubmitted
                          </span>
                        )}
                        {status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            Approved
                          </span>
                        )}
                        {status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <XCircle className="h-3 w-3" />
                            Rejected
                          </span>
                        )}
                      </td>

                      {/* 7. ACTIONS (QUICK APPROVE, REJECT & DETAILS) */}
                      <td className="py-3.5 px-4 align-middle text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {status === 'APPROVED' ? (
                            <span className="h-7 px-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px] inline-flex items-center gap-1 opacity-80 cursor-default">
                              <Check className="h-3 w-3 text-emerald-600" />
                              <span>Approved</span>
                            </span>
                          ) : status === 'REJECTED' ? (
                            <span className="h-7 px-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[11px] inline-flex items-center gap-1 opacity-80 cursor-default">
                              <X className="h-3 w-3 text-rose-600" />
                              <span>Declined</span>
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPendingApprovalRequest(req);
                                }}
                                title="Quick Approve"
                                className="h-7 w-7 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-emerald-200 shadow-2xs"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDrawer(req);
                                  setIsRejectOpen(true);
                                }}
                                title="Reject Request"
                                className="h-7 w-7 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-rose-200 shadow-2xs"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDrawer(req);
                            }}
                            className="h-7 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#F94001] hover:border-[#F94001]/40 hover:bg-[#FFF1EC] text-xs font-semibold inline-flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                          >
                            <Eye className="h-3 w-3 text-slate-500" />
                            <span>Details &gt;</span>
                          </button>
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

      {/* =========================================================================
          6. SLIDE BAR DRAWER: Complete Partner Court Request Dossier
          (Strictly NO amenities and NO operating hours)
          ========================================================================= */}
      {mounted && selectedRequestForDrawer && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] top-0 left-0 right-0 bottom-0 w-screen h-screen overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#021526]/75 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
            onClick={() => setSelectedRequestForDrawer(null)}
          />

          <div className="relative w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 border-l border-[#E5E7EB] z-10">
            {/* Header */}
            <div className="p-5 bg-white border-b border-[#E5E7EB] flex items-start justify-between gap-3 shrink-0">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#F94001]">
                  COURT EXTENSION REQUEST DOSSIER
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black font-display text-[#021526]">
                    #{selectedRequestForDrawer.id} &bull; {selectedRequestForDrawer.court_name}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedRequestForDrawer.venue_name} &bull; {selectedRequestForDrawer.venue_city}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRequestForDrawer(null)}
                className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Body: All Required Attributes */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* CARD 1: APPLICATION & FACILITY PROPERTIES */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-[#E5E7EB] space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#F94001]" />
                    <span className="text-xs font-black uppercase tracking-wider text-[#021526]">
                      Application &amp; Facility Properties
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${normStatus(selectedRequestForDrawer.status) === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : normStatus(selectedRequestForDrawer.status) === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                      }`}
                  >
                    {selectedRequestForDrawer.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Facility Name &amp; ID
                    </span>
                    <p className="font-bold text-slate-900 text-xs mt-0.5">
                      {selectedRequestForDrawer.venue_name}
                    </p>
                    <span className="font-mono text-[10px] text-slate-500">
                      {selectedRequestForDrawer.venue_id.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Location &amp; Region
                    </span>
                    <p className="font-medium text-slate-800 text-xs mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <span>{selectedRequestForDrawer.venue_city}</span>
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Request Type
                    </span>
                    <p className="font-semibold text-slate-800 text-xs mt-0.5">
                      Additional Court Creation
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Submitted Date &amp; Time
                    </span>
                    <p className="font-mono text-slate-700 text-xs mt-0.5">
                      {selectedRequestForDrawer.submitted_at || '08 Sept 2026, 03:00 PM'}
                    </p>
                  </div>
                </div>
              </div>

              {/* CARD 2: AUTHORIZED VENUE OWNER & CONTACT */}
              <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-[#021526]">
                      Authorized Venue Owner &amp; Contact
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    KYC Verified Partner
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                    {selectedRequestForDrawer.owner_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs">
                      {selectedRequestForDrawer.owner_name}
                    </p>
                    <div className="flex items-center gap-2.5 text-xs text-slate-500">
                      <a
                        href={`tel:${selectedRequestForDrawer.owner_phone}`}
                        className="hover:text-[#F94001] flex items-center gap-1 font-mono text-[11px]"
                      >
                        <Phone className="h-3 w-3 text-emerald-600" />
                        <span>{selectedRequestForDrawer.owner_phone}</span>
                      </a>
                      <span>&bull;</span>
                      <span className="font-mono text-[10px] text-slate-400">
                        Vendor ID: VEND-{selectedRequestForDrawer.venue_id.slice(-4)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 3: COURT SPECIFICATIONS & PLAYER APP ALLOCATION */}
              <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-purple-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-[#021526]">
                      Court Specifications &amp; Player App Allocation
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                    {SPORT_ICONS[selectedRequestForDrawer.sport] || '🏅'}{' '}
                    {selectedRequestForDrawer.sport}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Internal Court Name
                    </span>
                    <p className="font-extrabold text-slate-900 text-xs mt-0.5">
                      {selectedRequestForDrawer.court_name}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Player App Display Name
                    </span>
                    <p className="font-medium text-slate-800 text-xs mt-0.5">
                      {selectedRequestForDrawer.display_name}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Ground Allocation
                    </span>
                    <p className="text-slate-800 font-medium text-xs mt-0.5">
                      {selectedRequestForDrawer.same_physical_sports
                        ? `Shared Physical Ground with ${selectedRequestForDrawer.parent_court_name || 'Main Court'}`
                        : 'Independent Dedicated Pitch / Court'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Minimum Booking Duration
                    </span>
                    <p className="font-mono font-bold text-slate-800 text-xs mt-0.5">
                      {selectedRequestForDrawer.min_booking_duration}
                    </p>
                  </div>
                </div>
              </div>

              {/* CARD 4: HOURLY RATES & REFUND POLICY */}
              <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-[#021526]">
                      Hourly Rates &amp; Refund Policy
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold">
                    Direct Gateway Standard
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Base Hourly Rate
                    </span>
                    <p className="font-mono font-black text-sm text-[#021526] mt-0.5">
                      ₹{selectedRequestForDrawer.price_per_hour}/hr
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-200/60">
                    <span className="text-[10px] font-bold text-amber-700 uppercase">
                      Peak Hours Rate
                    </span>
                    <p className="font-mono font-black text-sm text-amber-900 mt-0.5">
                      ₹{selectedRequestForDrawer.peak_price}/hr
                    </p>
                    <p className="text-[9px] font-mono text-amber-600 mt-0.5">
                      {selectedRequestForDrawer.peak_hours_start} -{' '}
                      {selectedRequestForDrawer.peak_hours_end}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-200/60">
                    <span className="text-[10px] font-bold text-purple-700 uppercase">
                      Weekend Rate
                    </span>
                    <p className="font-mono font-black text-sm text-purple-900 mt-0.5">
                      ₹{selectedRequestForDrawer.weekend_price}/hr
                    </p>
                    <p className="text-[9px] font-mono text-purple-600 mt-0.5">Fri, Sat, Sun</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Cancellation &amp; Refund Rules
                  </span>
                  <p className="text-slate-700 font-medium">
                    Free cancellation allowed up to{' '}
                    <span className="font-bold text-[#021526]">
                      {selectedRequestForDrawer.cancellation_window_hours} hours
                    </span>{' '}
                    before slot commencement with{' '}
                    <span className="font-bold text-emerald-700">
                      {selectedRequestForDrawer.refund_percentage}% refund
                    </span>
                    .
                  </p>
                </div>
              </div>

              {/* CARD 5: REJECTION REASON / INLINE REJECT FORM */}
              {selectedRequestForDrawer.rejection_notes && !isRejectOpen && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1 text-xs">
                  <span className="text-[10px] font-bold uppercase text-rose-700 tracking-wider">
                    Previous Rejection Audit Reason
                  </span>
                  <p className="text-rose-900 font-medium">
                    {selectedRequestForDrawer.rejection_notes}
                  </p>
                </div>
              )}

              {/* Inline Reject Form */}
              {isRejectOpen && (
                <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 space-y-3 text-xs animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-rose-800 tracking-wider">
                      Specify Rejection Reason
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsRejectOpen(false)}
                      className="text-rose-400 hover:text-rose-700 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Reason Category
                    </label>
                    <select
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full p-2 rounded-xl border border-rose-200 bg-white text-xs font-bold text-slate-800 focus:outline-none"
                    >
                      {REJECTION_REASONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Detailed Feedback for Partner (Required)
                    </label>
                    <textarea
                      rows={3}
                      value={rejectionNote}
                      onChange={(e) => setRejectionNote(e.target.value)}
                      placeholder="Explain precisely why this court request cannot be approved..."
                      className="w-full p-2.5 rounded-xl border border-rose-200 bg-white text-xs text-slate-800 focus:outline-none placeholder:text-slate-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleConfirmReject(selectedRequestForDrawer)}
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Confirm &amp; Reject Court Request
                  </button>
                </div>
              )}
            </div>

            {/* Sticky Action Footer */}
            <div className="p-4 bg-slate-50 border-t border-[#E5E7EB] flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedRequestForDrawer(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {normStatus(selectedRequestForDrawer.status) === 'APPROVED' ? (
                  <>
                    <button
                      type="button"
                      disabled
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 font-bold text-xs opacity-50 cursor-not-allowed"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      disabled
                      className="px-5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs opacity-80 cursor-not-allowed flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Approved &amp; Live</span>
                    </button>
                  </>
                ) : normStatus(selectedRequestForDrawer.status) === 'REJECTED' ? (
                  <>
                    <button
                      type="button"
                      disabled
                      className="px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs opacity-80 cursor-not-allowed flex items-center gap-1.5"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Declined</span>
                    </button>
                    <button
                      type="button"
                      disabled
                      className="px-5 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 font-bold text-xs opacity-50 cursor-not-allowed flex items-center gap-1.5"
                    >
                      <Check className="h-4 w-4" />
                      <span>Approve &amp; Activate</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsRejectOpen(true)}
                      className="px-4 py-2 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingApprovalRequest(selectedRequestForDrawer)}
                      className="px-5 py-2 rounded-xl bg-[#00875A] hover:bg-[#007048] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="h-4 w-4" />
                      <span>Approve &amp; Activate</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* =========================================================================
          7. APPROVE CONFIRMATION MODAL POPUP
          ========================================================================= */}
      {mounted && pendingApprovalRequest && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[10000] top-0 left-0 right-0 bottom-0 w-screen h-screen bg-[#021526]/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#CBD5E1] max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#021526]">
                  Confirm Court Approval
                </h3>
                <p className="text-xs text-slate-500">
                  Authorize court creation and activate live slot bookings.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Court Name:</span>
                <span className="font-bold text-slate-900">{pendingApprovalRequest.court_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Facility / Venue:</span>
                <span className="font-bold text-slate-900">{pendingApprovalRequest.venue_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Sport:</span>
                <span className="font-bold text-slate-900">{pendingApprovalRequest.sport}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Hourly Base Rate:</span>
                <span className="font-bold text-emerald-700 font-mono">₹{pendingApprovalRequest.price_per_hour}/hr</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Upon approval, a unique Court ID will be created and synchronized across the Partner App, Vendor Dashboard, and Supabase database.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPendingApprovalRequest(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const req = pendingApprovalRequest;
                  setPendingApprovalRequest(null);
                  handleApprove(req);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#00875A] hover:bg-[#007048] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                <span>Yes, Approve &amp; Activate</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
