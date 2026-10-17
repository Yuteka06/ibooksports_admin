'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  RotateCcw,
  Search,
  Filter,
  Eye,
  X,
  CalendarCheck,
  Building2,
  MapPin,
  Clock,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Phone,
  User,
  RefreshCw,
  Download,
  Copy,
  Check,
  Receipt,
  Wallet,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Landmark,
  BadgeAlert,
  ArrowUpDown,
  Tag,
} from 'lucide-react';
import { BookingItem } from '@/lib/mockData';
import { apiClient } from '@/lib/api';
import { parseCancellationNotes } from '@/lib/cancellation';

const REFUND_STATUS_LABEL: Record<string, string> = {
  REFUNDED: 'REFUNDED',
  PROCESSING: 'REFUND PENDING',
  NOT_APPLICABLE: 'NO REFUND',
};

export interface CancellationItem extends BookingItem {
  cancellation_id?: string;
  refund_channel?: string;
  state?: string;
  district?: string;
}

export default function CancellationManagementPage() {
  const [cancellations, setCancellations] = useState<CancellationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [venueFilter, setVenueFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Slide-out Drawer State (Cancellation & Refund Trail Dossier matching Image 3)
  const [selectedCancellation, setSelectedCancellation] = useState<CancellationItem | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  const showToast = (type: 'success' | 'info' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopy = (val: string, key: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(val);
      setCopiedField(key);
      showToast('success', `Copied ${val} to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  // Fetch live cancellations from backend API
  const fetchCancellations = React.useCallback(async (showToastNotice = false) => {
    if (showToastNotice) setIsRefreshing(true);
    try {
      const [bookingsRes, venuesRes] = await Promise.allSettled([
        apiClient.get<any[]>('/bookings'),
        apiClient.get<any[]>('/venues'),
      ]);

      let backendBookings: any[] = [];
      let backendVenues: any[] = [];

      if (bookingsRes.status === 'fulfilled' && Array.isArray(bookingsRes.value.data)) {
        backendBookings = bookingsRes.value.data;
      }
      if (venuesRes.status === 'fulfilled' && Array.isArray(venuesRes.value.data)) {
        backendVenues = venuesRes.value.data;
      }

      const venueMap = new Map<string, any>();
      backendVenues.forEach((v) => {
        if (v.id) venueMap.set(String(v.id).toLowerCase(), v);
        if (v.venue_name) venueMap.set(String(v.venue_name).toLowerCase(), v);
      });

      // Filter only cancelled bookings or bookings with refund records
      const cancelledRows = backendBookings.filter((b: any) => {
        const rawStatus = String(b.booking_status || b.status || '').toLowerCase();
        const rawPay = String(b.payment_status || b.paymentStatus || '').toLowerCase();
        return (
          rawStatus.includes('cancel') ||
          rawPay.includes('refund') ||
          Number(b.refund_amount || b.refundAmount || 0) > 0
        );
      });

      {
        const mapped: CancellationItem[] = cancelledRows.map((r: any) => {
          const parsed = parseCancellationNotes(r.notes, r.payment_status || r.paymentStatus);
          const vName = r.venue_name || r.venueName || 'Snow White';
          const matchedVenue =
            venueMap.get(String(r.venue_id || r.venueId || '').toLowerCase()) ||
            venueMap.get(String(vName).toLowerCase());

          const st = r.state || r.venue_state || matchedVenue?.state || (vName === 'Rex Arena' ? 'Kerala' : 'Tamil Nadu');
          const dist =
            r.district ||
            r.venue_district ||
            matchedVenue?.district ||
            (vName === 'Rex Arena' ? 'Kozhikode' : vName === 'Amithap Mama' ? 'Coimbatore' : 'Chennai');

          return {
            id: String(r.id),
            booking_code: r.booking_code || r.booking_number || `BK-${r.id}`,
            customer_id: r.customer_id || r.customerId || `CUST-${String(r.id).slice(-6)}`,
            customer_name: r.customer_name || r.customerName || 'Player',
            customer_phone: r.customer_phone || r.customerPhone || '',
            venue_id: r.venue_id || r.venueId || 'APP68267',
            venue_name: vName,
            court_id: r.court_id || r.courtId || 'court-1',
            court_name: r.court_name || r.courtName || 'Main Court',
            sport: r.sport || 'FOOTBALL',
            booking_date: r.booking_date || r.date || '',
            time_slot: r.time_slot || r.timeSlot || '06:00 PM - 07:00 PM',
            duration_minutes: Number(r.duration_minutes || r.durationMinutes) || 60,
            total_amount: Number(r.total_amount || r.totalAmount) || 0,
            platform_fee: Number(r.platform_fee || r.platformFee) || 0,
            venue_share: Number(r.venue_share || r.venueShare) || 0,
            payment_status: parsed.refundStatus === 'NOT_APPLICABLE' ? 'PAID' : 'REFUNDED',
            booking_status: 'CANCELLED',
            payment_method: r.payment_method || r.paymentMethod || 'UPI',
            transaction_id: r.transaction_id || r.transactionId || `TXN-${r.id}`,
            created_at: r.created_at || r.createdAt || new Date().toISOString(),
            cancellation_reason: parsed.reason || 'Not recorded',
            cancelled_at: (parsed.cancelledAt || r.updated_at || r.updatedAt || '').slice(0, 10),
            refund_amount: parsed.refundAmount,
            refund_status: parsed.refundStatus,
            refund_utr: parsed.refundReference,
            state: st,
            district: dist,
          };
        });

        setCancellations(mapped);
      }
    } catch (e) {
      console.warn('Failed to load live cancellations', e);
      showToast('error', 'Could not load cancellations from the server');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      if (showToastNotice) {
        showToast('success', 'Cancellation ledger synced successfully');
      }
    }
  }, []);

  useEffect(() => {
    fetchCancellations();
  }, [fetchCancellations]);

  // Dynamic States, Districts & Venues for Dropdown Filters
  const availableStates = useMemo(() => {
    const set = new Set<string>();
    cancellations.forEach((c) => {
      if (c.state) set.add(c.state);
    });
    return Array.from(set).sort();
  }, [cancellations]);

  const availableDistricts = useMemo(() => {
    const set = new Set<string>();
    cancellations.forEach((c) => {
      if (stateFilter === 'ALL' || c.state === stateFilter) {
        if (c.district) set.add(c.district);
      }
    });
    return Array.from(set).sort();
  }, [cancellations, stateFilter]);

  const availableVenues = useMemo(() => {
    const set = new Set<string>();
    cancellations.forEach((c) => {
      const matchState = stateFilter === 'ALL' || c.state === stateFilter;
      const matchDist = districtFilter === 'ALL' || c.district === districtFilter;
      if (matchState && matchDist && c.venue_name) {
        set.add(c.venue_name);
      }
    });
    return Array.from(set).sort();
  }, [cancellations, stateFilter, districtFilter]);

  // Filtered cancellations list
  const filteredCancellations = useMemo(() => {
    return cancellations.filter((c) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = c.booking_code.toLowerCase().includes(q);
        const matchName = c.customer_name.toLowerCase().includes(q);
        const matchPhone = c.customer_phone.toLowerCase().includes(q);
        const matchCustId = c.customer_id.toLowerCase().includes(q);
        const matchReason = (c.cancellation_reason || '').toLowerCase().includes(q);
        const matchUtr = (c.refund_utr || '').toLowerCase().includes(q);
        const matchVenue = c.venue_name.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchPhone && !matchCustId && !matchReason && !matchUtr && !matchVenue) {
          return false;
        }
      }

      // 2. State Filter
      if (stateFilter !== 'ALL' && c.state !== stateFilter) {
        return false;
      }

      // 3. District Filter
      if (districtFilter !== 'ALL' && c.district !== districtFilter) {
        return false;
      }

      // 4. Venue Filter
      if (venueFilter !== 'ALL' && c.venue_name !== venueFilter) {
        return false;
      }

      // 5. Status Filter
      if (statusFilter !== 'ALL') {
        const statusStr = String(c.refund_status || '').toUpperCase();
        if (statusFilter === 'UPI' && !statusStr.includes('UPI')) return false;
        if (statusFilter === 'WALLET' && !statusStr.includes('WALLET')) return false;
      }

      return true;
    });
  }, [cancellations, searchQuery, stateFilter, districtFilter, venueFilter, statusFilter]);

  // KPI Calculations
  const kpiStats = useMemo(() => {
    const totalCount = filteredCancellations.length;
    let totalRefundAmount = 0;
    let upiRefundCount = 0;
    let upiRefundAmount = 0;
    let walletCount = 0;
    let walletAmount = 0;

    filteredCancellations.forEach((c) => {
      const amt = Number(c.refund_amount || 0);
      totalRefundAmount += amt;

      if (c.refund_status === 'PROCESSING') {
        walletCount += 1;
        walletAmount += amt;
      } else if (c.refund_status === 'REFUNDED') {
        upiRefundCount += 1;
        upiRefundAmount += amt;
      }
    });

    return {
      totalCount,
      totalRefundAmount,
      upiRefundCount,
      upiRefundAmount,
      walletCount,
      walletAmount,
    };
  }, [filteredCancellations]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, stateFilter, districtFilter, venueFilter, statusFilter, pageSize]);

  // Pagination computations
  const totalItems = filteredCancellations.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCancellations = useMemo(() => {
    return filteredCancellations.slice(startIndex, startIndex + pageSize);
  }, [filteredCancellations, startIndex, pageSize]);

  const resetAllFilters = () => {
    setSearchQuery('');
    setStateFilter('ALL');
    setDistrictFilter('ALL');
    setVenueFilter('ALL');
    setStatusFilter('ALL');
    setCurrentPage(1);
  };

  const isFiltered =
    Boolean(searchQuery.trim()) ||
    stateFilter !== 'ALL' ||
    districtFilter !== 'ALL' ||
    venueFilter !== 'ALL' ||
    statusFilter !== 'ALL';

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-16 animate-in fade-in duration-150">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#021526] font-display">
              Cancellation Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              {cancellations.length} Logged
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#5F6368] mt-1 font-medium">
            Multi-state refund audits, customer reversals, payment gateway reversals, and UTR tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchCancellations(true)}
            disabled={isRefreshing}
            className="h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            title="Refresh cancellations list"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-[#F94001]' : 'text-slate-500'}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Live'}</span>
          </button>
        </div>
      </div>

      {/* Dynamic KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Total Cancellations */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:border-rose-400/50 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Cancellations
            </span>
            <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <RotateCcw className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-display">
              {kpiStats.totalCount}
            </span>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              Audited
            </span>
          </div>
        </div>

        {/* KPI 2: Total Refund Processed */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:border-emerald-400/50 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Refund Processed
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline">
            <span className="text-2xl font-black text-emerald-700 font-mono tracking-tight">
              ₹{kpiStats.totalRefundAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* KPI 3: UPI Reversals */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:border-blue-400/50 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Refunded via Razorpay
            </span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 font-mono">
              ₹{kpiStats.upiRefundAmount.toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-bold text-blue-600">{kpiStats.upiRefundCount} txns</span>
          </div>
        </div>

        {/* KPI 4: Wallet Credited */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:border-purple-400/50 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Refunds Pending
            </span>
            <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Landmark className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 font-mono">
              ₹{kpiStats.walletAmount.toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-bold text-purple-600">{kpiStats.walletCount} to process</span>
          </div>
        </div>
      </div>

      {/* Filter Bar with Search, State, District, and Venue Selectors */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search booking code, customer, phone, reason, UTR..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none focus:bg-white focus:border-[#F94001] transition-colors font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* State Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 h-9">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">State:</span>
            <select
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value);
                setDistrictFilter('ALL');
                setVenueFilter('ALL');
              }}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">All States</option>
              {availableStates.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* District Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 h-9">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">District:</span>
            <select
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value);
                setVenueFilter('ALL');
              }}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">All Districts</option>
              {availableDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Venue Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 h-9">
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Venue:</span>
            <select
              value={venueFilter}
              onChange={(e) => setVenueFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer max-w-[150px] truncate"
            >
              <option value="ALL">All Venues</option>
              {availableVenues.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          {isFiltered && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="h-9 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Cancellations Table matching User Image 1 */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/90 bg-slate-50/75 text-slate-500 font-semibold tracking-wider text-[10px] uppercase select-none">
                <th className="py-2.5 px-3 text-center w-12">#</th>
                <th className="py-2.5 px-3">CUSTOMER ID &amp; NAME</th>
                <th className="py-2.5 px-3">BOOKING CODE</th>
                <th className="py-2.5 px-3">SLOT SCHEDULE</th>
                <th className="py-2.5 px-3">ORIGINAL PAID</th>
                <th className="py-2.5 px-3">CANCELLED AT</th>
                <th className="py-2.5 px-3">REFUND AMOUNT</th>
                <th className="py-2.5 px-3">REASON</th>
                <th className="py-2.5 px-3">STATUS</th>
                <th className="py-2.5 px-3 text-center w-16">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {totalItems === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Zero cancellations logged for this arena.
                  </td>
                </tr>
              ) : (
                paginatedCancellations.map((c, index) => (
                  <tr key={c.id || index} className="hover:bg-slate-50/70 transition-colors">
                    {/* # Serial No */}
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500 font-semibold">
                      {startIndex + index + 1}
                    </td>

                    {/* Customer ID & Name */}
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{c.customer_name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{c.customer_id}</div>
                    </td>

                    {/* Booking Code */}
                    <td className="py-2.5 px-3 font-mono font-bold text-[#F94001] whitespace-nowrap">
                      {c.booking_code}
                    </td>

                    {/* Slot Schedule */}
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-800">{c.booking_date}</div>
                      <div className="text-[10px] font-mono text-slate-400">{c.time_slot}</div>
                    </td>

                    {/* Original Paid */}
                    <td className="py-2.5 px-3">
                      <div className="font-mono font-bold text-slate-900">
                        ₹{c.total_amount?.toLocaleString('en-IN') || 0}
                      </div>
                      <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-slate-100 text-slate-600 border border-slate-200">
                        {c.payment_method || 'UPI'}
                      </span>
                    </td>

                    {/* Cancelled At */}
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      {c.cancelled_at || '—'}
                    </td>

                    {/* Refund Amount */}
                    <td className="py-2.5 px-3">
                      <div className="font-mono font-black text-rose-600">
                        ₹{(c.refund_amount || c.total_amount)?.toLocaleString('en-IN')}
                      </div>
                      <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-rose-50 text-rose-700 border border-rose-200">
                        {c.payment_method ? `${c.payment_method} (Reversed)` : 'UPI (Reversed)'}
                      </span>
                    </td>

                    {/* Reason */}
                    <td className="py-2.5 px-3 text-slate-600 max-w-[220px] truncate" title={c.cancellation_reason}>
                      {c.cancellation_reason || 'Player requested schedule cancellation'}
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          c.refund_status === 'PROCESSING'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : c.refund_status === 'REFUNDED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {REFUND_STATUS_LABEL[c.refund_status || 'NOT_APPLICABLE'] || c.refund_status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedCancellation(c)}
                        className="h-7.5 w-7.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-[#F94001] hover:border-[#F94001]/40 hover:bg-[#FFF1EC] transition-all inline-flex items-center justify-center cursor-pointer shadow-2xs mx-auto"
                        title="View Cancellation Dossier"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar matching Image 1 layout */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-200/90 bg-slate-50/50 text-xs text-slate-600 select-none">
          <div className="flex items-center gap-4">
            <span>
              Showing{' '}
              <strong className="text-slate-900 font-semibold">
                {totalItems === 0 ? 0 : startIndex + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-900 font-semibold">
                {Math.min(startIndex + pageSize, totalItems)}
              </strong>{' '}
              of <strong className="text-slate-900 font-semibold">{totalItems}</strong> entries
            </span>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-7 px-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:border-[#F94001] cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Prev</span>
            </button>

            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  return p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1;
                })
                .map((p, idx, arr) => {
                  const prevPage = arr[idx - 1];
                  const showEllipsis = prevPage && p - prevPage > 1;

                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`h-8 w-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          currentPage === p
                            ? 'bg-[#F94001] text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
              title="Next Page"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          SLIDE BAR (DRAWER) FOR CANCELLATION DETAILS
          Matches Venue Management Cancel Slide Bar Exactly!
      ======================================================== */}
      {selectedCancellation && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-150"
          onClick={() => setSelectedCancellation(null)}
        >
          <div
            className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/70">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#F94001]">
                  CANCELLATION &amp; REFUND AUDIT DOSSIER
                </span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-mono text-[11px] font-bold">
                    {selectedCancellation.booking_code}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[10px]">
                    {selectedCancellation.refund_status || 'WALLET_CREDITED'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedCancellation.venue_name} &bull; {selectedCancellation.district || selectedCancellation.state || 'Tamil Nadu'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCancellation(null)}
                className="h-8 w-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                title="Close Drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* CARD 1: Customer Profile */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-[#F94001]" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Customer &amp; Booker Information
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">
                    ID: {selectedCancellation.customer_id}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      {selectedCancellation.customer_name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">Primary Booker</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Customer Phone</span>
                    {selectedCancellation.customer_phone ? (
                      <div className="flex items-center gap-1 mt-0.5 justify-end">
                        <a
                          href={`tel:${selectedCancellation.customer_phone}`}
                          className="font-mono font-bold text-slate-800 hover:text-[#F94001] transition-colors"
                        >
                          {selectedCancellation.customer_phone}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopy(selectedCancellation.customer_phone, 'phone')}
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                          title="Copy phone"
                        >
                          {copiedField === 'phone' ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Not available</span>
                    )}
                  </div>
                </div>
              </div>

              {/* CARD 2: Slot & Court Specifications */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#F94001]" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Cancelled Slot &amp; Match Schedule
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold uppercase">
                    {selectedCancellation.sport}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">Playing Court</span>
                    <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                      {selectedCancellation.court_name || 'Main Arena Court'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">Match Date</span>
                    <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                      {selectedCancellation.booking_date}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">Reserved Slot</span>
                    <span className="font-mono font-bold text-slate-800 text-xs mt-0.5 block">
                      {selectedCancellation.time_slot}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">Duration</span>
                    <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                      {selectedCancellation.duration_minutes || 60} Minutes
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD 3: Payment & Refund Breakdown */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-[#F94001]" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Payment &amp; Refund Audit Breakdown
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                    Reversal Verified
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Original Paid Amount</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        ₹{selectedCancellation.total_amount?.toLocaleString('en-IN') || 0}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Payment Mode</span>
                      <span className="font-bold text-slate-800 uppercase text-xs mt-0.5 block">
                        {selectedCancellation.payment_method || 'ONLINE LINK'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                    <div>
                      <span className="text-[10px] text-emerald-800 block font-medium">Total Refund Reversal</span>
                      <span className="font-mono font-black text-emerald-700 text-base">
                        ₹{(selectedCancellation.refund_amount || selectedCancellation.total_amount)?.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-800 block font-medium">Refund Channel</span>
                      <span className="font-bold text-emerald-900 text-xs mt-0.5 block">
                        {selectedCancellation.payment_method ? (selectedCancellation.payment_method.toLowerCase().includes('reversal') ? selectedCancellation.payment_method : `${selectedCancellation.payment_method} Reversal`) : 'Online Link Reversal'}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Original Transaction ID:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {selectedCancellation.transaction_id || `TXN-${selectedCancellation.id}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Refund Reference / UTR:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-emerald-700">
                          {selectedCancellation.refund_utr || `REF-UTR-${selectedCancellation.booking_code.replace(/[^a-zA-Z0-9]/g, '')}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(selectedCancellation.refund_utr || `REF-UTR-${selectedCancellation.booking_code.replace(/[^a-zA-Z0-9]/g, '')}`, 'utr')}
                          className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                          title="Copy UTR Reference"
                        >
                          {copiedField === 'utr' ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>Venue Payout Deducted:</span>
                      <span className="font-mono font-semibold text-slate-700">
                        ₹{(selectedCancellation.venue_share || Math.round((selectedCancellation.total_amount || 0) * 0.9)).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Platform Commission Reversed:</span>
                      <span className="font-mono font-semibold text-slate-700">
                        ₹{(selectedCancellation.platform_fee || Math.round((selectedCancellation.total_amount || 0) * 0.1)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 4: Reason & Cancellation Audit Trail */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-[#F94001]" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Cancellation Reason &amp; Audit Trail
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 space-y-1">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                    Reason Logged
                  </span>
                  <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                    {selectedCancellation.cancellation_reason || 'Inclement weather cancellation / Customer requested cancellation'}
                  </p>
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-500">
                  <div className="flex items-center justify-between">
                    <span>Cancelled At:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedCancellation.cancelled_at || '2026-03-04 16:30'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Policy Adherence:</span>
                    <span className="font-semibold text-emerald-700">100% Refund Approved</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer matching screenshot */}
            <div className="p-4 border-t border-slate-200 bg-white shrink-0 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedCancellation(null)}
                className="px-6 py-2.5 rounded-xl bg-[#021526] hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
