'use client';

import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  Search,
  Filter,
  Eye,
  X,
  MapPin,
  Clock,
  CreditCard,
  QrCode,
  AlertCircle,
  CheckCircle2,
  Calendar,
  CalendarDays,
  Sparkles,
  Phone,
  User,
  Building2,
  ArrowRight,
  RefreshCw,
  Download,
  Copy,
  Check,
  Printer,
  Share2,
  Receipt,
  Layers,
  TrendingUp,
  AlertTriangle,
  Wallet,
  ShieldCheck,
} from 'lucide-react';
import { INITIAL_BOOKINGS, BookingItem } from '@/lib/mockData';

export default function BookingManagementPage() {
  const [bookings, setBookings] = useState<BookingItem[]>(INITIAL_BOOKINGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sportFilter, setSportFilter] = useState('ALL');
  
  // Date Picker in Right Top Corner of Page Header
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  
  // Slide-out Drawer (Slide Bar) State
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [drawerTab, setDrawerTab] = useState<'summary' | 'payment' | 'slip'>('summary');
  
  // Cancel & Reschedule Modals
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleSlotTime, setRescheduleSlotTime] = useState('');
  
  // Interactive copy feedback
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  // Toast Alert Notification
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'info' | 'error';
    title: string;
    description: string;
  } | null>(null);

  const showToast = (type: 'success' | 'info' | 'error', title: string, description: string) => {
    setToastMessage({ type, title, description });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCopy = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedText(id);
      setTimeout(() => setCopiedText(null), 2000);
      showToast('info', 'Copied to clipboard', text);
    }
  };

  // Helper to normalize payment type into strictly: 'UPI' | 'Card' | 'Net Banking'
  const getCleanPaymentType = (method?: string): 'UPI' | 'Card' | 'Net Banking' => {
    if (!method) return 'UPI';
    const m = method.toLowerCase();
    if (m.includes('upi')) return 'UPI';
    if (m.includes('card')) return 'Card';
    if (m.includes('banking') || m.includes('net')) return 'Net Banking';
    return 'UPI';
  };

  // Helper for advance & balance amounts
  const getAdvanceAndBalance = (b: BookingItem) => {
    if (b.payment_status === 'REFUNDED') {
      return { advance: b.total_amount, balance: 0, isPartial: false, isRefunded: true, due_mode: b.due_mode || 'CASH' };
    }
    // Check if partial (either marked in mock data or half amount)
    if (b.booking_code === 'IBS-2603-9002' || b.booking_code === 'IBS-2603-9004' || b.payment_status === 'PARTIAL_PAID') {
      const advance = b.advance_amount || Math.round(b.total_amount * 0.5);
      const balance = b.balance_amount || (b.total_amount - advance);
      const due_mode = b.due_mode || (b.booking_code === 'IBS-2603-9004' ? 'ONLINE' : 'CASH');
      return { advance, balance, isPartial: true, isRefunded: false, due_mode };
    }
    return { advance: b.total_amount, balance: 0, isPartial: false, isRefunded: false, due_mode: b.due_mode || 'CASH' };
  };

  // Mark pending balance as collected at counter (Cash) or via Online Link
  const handleMarkBalancePaid = (bookingId: string, clearMode: 'CASH' | 'ONLINE' = 'CASH') => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          const updated: BookingItem = {
            ...b,
            payment_status: 'PAID',
            advance_amount: b.total_amount,
            balance_amount: 0,
            due_mode: clearMode,
          };
          if (selectedBooking && selectedBooking.id === bookingId) {
            setSelectedBooking(updated);
          }
          return updated;
        }
        return b;
      })
    );
    showToast(
      'success',
      clearMode === 'CASH' ? 'Cash Collected at Venue' : 'Online Payment Settled',
      clearMode === 'CASH'
        ? `Remaining balance collected in cash at venue. Booking marked as Paid in Full.`
        : `Remaining balance settled via online payment link. Booking marked as Paid in Full.`
    );
  };

  // Cancel Booking Action
  const handleCancelBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, booking_status: 'CANCELLED', payment_status: 'REFUNDED' }
          : b
      )
    );
    if (selectedBooking && selectedBooking.id === bookingId) {
      setSelectedBooking({
        ...selectedBooking,
        booking_status: 'CANCELLED',
        payment_status: 'REFUNDED',
      });
    }
    setCancelModalOpen(false);
    showToast(
      'error',
      'Booking Cancelled',
      `Reservation cancelled and full refund of ₹${selectedBooking?.total_amount} initiated.`
    );
  };

  // Reschedule Booking Action
  const handleRescheduleBooking = (bookingId: string) => {
    if (!rescheduleSlotTime.trim()) {
      showToast('error', 'Select Slot Time', 'Please provide a valid time slot for rescheduling.');
      return;
    }
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, time_slot: rescheduleSlotTime }
          : b
      )
    );
    if (selectedBooking && selectedBooking.id === bookingId) {
      setSelectedBooking({
        ...selectedBooking,
        time_slot: rescheduleSlotTime,
      });
    }
    setRescheduleModalOpen(false);
    setRescheduleSlotTime('');
    showToast(
      'success',
      'Slot Rescheduled',
      `Reservation updated to ${rescheduleSlotTime}. Confirmation SMS sent to player.`
    );
  };

  // 1. PRIMARY DATE-FILTERED BOOKINGS (BOTH KPIS AND TABLE ARE TIED TO THIS!)
  const dateFilteredBookings = useMemo(() => {
    if (!selectedDate) return bookings;
    return bookings.filter((b) => b.booking_date === selectedDate);
  }, [bookings, selectedDate]);

  // 2. DYNAMIC KPIS CALCULATED FROM DATE-FILTERED BOOKINGS
  const totalVolume = useMemo(
    () => dateFilteredBookings.reduce((acc, b) => acc + b.total_amount, 0),
    [dateFilteredBookings]
  );
  const totalOnlineCollected = useMemo(() => {
    return dateFilteredBookings.reduce((acc, b) => {
      if (b.payment_status === 'REFUNDED') return acc;
      const { advance } = getAdvanceAndBalance(b);
      return acc + advance;
    }, 0);
  }, [dateFilteredBookings]);
  const totalPendingDue = useMemo(() => {
    return dateFilteredBookings.reduce((acc, b) => {
      if (b.payment_status === 'REFUNDED') return acc;
      const { balance } = getAdvanceAndBalance(b);
      return acc + balance;
    }, 0);
  }, [dateFilteredBookings]);
  const inPlayCount = useMemo(
    () => dateFilteredBookings.filter((b) => b.booking_status === 'IN_PLAY').length,
    [dateFilteredBookings]
  );
  const confirmedCount = useMemo(
    () => dateFilteredBookings.filter((b) => b.booking_status === 'CONFIRMED').length,
    [dateFilteredBookings]
  );

  // 3. FINAL FILTERED BOOKINGS FOR TABLE ROWS
  const filteredBookings = useMemo(() => {
    return dateFilteredBookings.filter((b) => {
      // Status Filter
      if (statusFilter !== 'ALL' && b.booking_status !== statusFilter) {
        return false;
      }

      // Sport Filter
      if (sportFilter !== 'ALL' && b.sport.toLowerCase() !== sportFilter.toLowerCase()) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          b.booking_code.toLowerCase().includes(q) ||
          b.customer_name.toLowerCase().includes(q) ||
          b.customer_phone.includes(q) ||
          b.venue_name.toLowerCase().includes(q) ||
          b.court_name.toLowerCase().includes(q) ||
          b.sport.toLowerCase().includes(q);

        if (!matches) return false;
      }

      return true;
    });
  }, [dateFilteredBookings, statusFilter, sportFilter, searchQuery]);

  const handlePrintSlip = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* TOAST ALERT NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[99999] flex items-center gap-3 bg-[#021526] text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom duration-300">
          {toastMessage.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />}
          {toastMessage.type === 'info' && <Receipt className="h-5 w-5 text-[#F94001] shrink-0" />}
          {toastMessage.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />}
          <div className="text-xs">
            <p className="font-bold">{toastMessage.title}</p>
            <p className="text-slate-300 text-[11px] mt-0.5">{toastMessage.description}</p>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 1. PAGE HEADER (WITH DATE PICKER IN TOP RIGHT CORNER) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-[#F94001] bg-[#FFF1EC] border border-[#F94001]/20 px-3 py-1 rounded-full mb-2">
            <CalendarCheck className="h-3.5 w-3.5 text-[#F94001]" />
            <span>Turf Booking Registry &bull; Real-Time Playtime Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#021526] font-display">
            Booking Management
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6368] mt-1 font-medium">
            Real-time court reservations, advance &amp; due payment tracking, player check-in codes, and slot rescheduling.
          </p>
        </div>

        {/* TOP RIGHT CORNER: DATE PICKER & EXPORT BUTTON (HORIZONTAL ALIGNMENT) */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
          {/* DATE PICKER */}
          <div className="flex items-center gap-2 bg-white border border-[#CBD5E1] px-3.5 py-1.5 rounded-xl shadow-2xs hover:border-[#F94001]/60 transition-colors h-[42px]">
            <CalendarDays className="h-4 w-4 text-[#F94001] shrink-0" />
            <div className="flex flex-col text-left justify-center">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 leading-none">
                Filter by Date
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#021526] outline-none cursor-pointer p-0 leading-tight"
                title="Select booking date to update KPIs and table"
              />
            </div>
            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className="text-slate-400 hover:text-slate-800 ml-1 p-0.5 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                title="Reset to all dates"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              showToast('info', 'Export Triggered', 'Booking registry exported with player & payment details.');
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#CBD5E1] text-[#021526] hover:bg-slate-50 px-3.5 py-2 text-xs font-bold shadow-xs transition-all cursor-pointer h-[42px] whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC KPI CARDS (CLEAN MINIMAL DESIGN - NO UNWANTED HELPER TEXT) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Bookings */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-2xs hover:border-slate-400/50 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
              Total Bookings
            </span>
            <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline">
            <span className="text-2xl font-black text-[#021526] font-display">
              {dateFilteredBookings.length}
            </span>
          </div>
        </div>

        {/* Online Advance Received */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-2xs hover:border-emerald-400/50 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
              Collected Online
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 font-mono tracking-tight">
              ₹{totalOnlineCollected.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Received
            </span>
          </div>
        </div>

        {/* Pending Due Balances */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-2xs hover:border-amber-400/50 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
              Pending Due
            </span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 font-mono tracking-tight">
              ₹{totalPendingDue.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Due
            </span>
          </div>
        </div>

        {/* In-Play Right Now */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-2xs hover:border-blue-400/50 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
              In-Play Right Now
            </span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-600 font-display">
              {inPlayCount}
            </span>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 animate-pulse">
              Live
            </span>
          </div>
        </div>

        {/* Total Volume Booked */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-2xs hover:border-orange-400/50 transition-all flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
              Total Court Value
            </span>
            <div className="h-8 w-8 rounded-xl bg-[#FFF1EC] text-[#F94001] flex items-center justify-center shrink-0">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline">
            <span className="text-2xl font-black text-[#021526] font-mono tracking-tight">
              ₹{totalVolume.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* 3. FILTER, SPORT SELECTOR & SEARCH BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E5E7EB] shadow-xs">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'ALL', label: 'All Bookings', count: dateFilteredBookings.length },
            { id: 'CONFIRMED', label: 'Confirmed', count: confirmedCount },
            { id: 'IN_PLAY', label: 'In Play', count: inPlayCount },
            { id: 'COMPLETED', label: 'Completed', count: dateFilteredBookings.filter((b) => b.booking_status === 'COMPLETED').length },
            { id: 'CANCELLED', label: 'Cancelled', count: dateFilteredBookings.filter((b) => b.booking_status === 'CANCELLED').length },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#021526] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Search, Sport & Reset */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
          {/* Search */}
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#5F6368]" />
            <input
              type="text"
              placeholder="Search booking code, player, venue..."
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

          {/* Sport Selector */}
          <div className="relative min-w-[130px]">
            <select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="w-full appearance-none pl-8 pr-7 py-2 rounded-xl border border-[#E5E7EB] bg-slate-50 text-xs font-bold text-[#021526] focus:outline-none focus:border-[#F94001] transition-colors cursor-pointer"
            >
              <option value="ALL">All Sports</option>
              <option value="Football">Football</option>
              <option value="Box Cricket">Box Cricket</option>
              <option value="Badminton">Badminton</option>
              <option value="Pickleball">Pickleball</option>
            </select>
            <Filter className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Reset Filters */}
          {(searchQuery || selectedDate || statusFilter !== 'ALL' || sportFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedDate('');
                setStatusFilter('ALL');
                setSportFilter('ALL');
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

      {/* 4. BOOKINGS TABLE - TIGHT LEFT-ALIGNED COLUMNS (NO OVER-SPACE) */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/90 bg-slate-50/75 text-slate-400 font-bold tracking-wider text-[11px] uppercase select-none">
                <th className="py-3 px-4 whitespace-nowrap">Booking Code</th>
                <th className="py-3 px-4 whitespace-nowrap">Player</th>
                <th className="py-3 px-4 min-w-[200px]">Venue &amp; Court</th>
                <th className="py-3 px-4 whitespace-nowrap">Slot Time</th>
                <th className="py-3 px-4 whitespace-nowrap">Payment Split</th>
                <th className="py-3 px-4 whitespace-nowrap">Payment &amp; Status</th>
                <th className="py-3 px-4 whitespace-nowrap">Booking Status</th>
                <th className="py-3 px-4 text-left whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-400">
                    <Receipt className="h-9 w-9 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-sm text-[#021526]">No booking reservations found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Try adjusting your date picker, search query, or status filter
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const isCopied = copiedText === b.booking_code;
                  const { advance, balance, isPartial, isRefunded, due_mode } = getAdvanceAndBalance(b);
                  const isPaid = !isPartial && !isRefunded && b.payment_status !== 'FAILED';
                  const cleanPaymentType = getCleanPaymentType(b.payment_method);

                  return (
                    <tr
                      key={b.id}
                      onClick={() => {
                        setSelectedBooking(b);
                        setDrawerTab('summary');
                      }}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    >
                      {/* 1. BOOKING CODE */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-[#F94001] bg-[#FFF1EC] border border-[#F94001]/20 px-2 py-0.5 rounded">
                            {b.booking_code}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(b.booking_code, b.booking_code);
                            }}
                            className="text-slate-400 hover:text-slate-700 transition-colors p-0.5 cursor-pointer"
                            title="Copy Booking Code"
                          >
                            {isCopied ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* 2. PLAYER (NAME + PHONE ONLY, NO EMAIL) */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 text-xs tracking-tight group-hover:text-[#F94001] transition-colors whitespace-nowrap">
                            {b.customer_name}
                          </p>
                          <a
                            href={`tel:${b.customer_phone.replace(/\s+/g, '')}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-[#F94001] transition-colors inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-500 whitespace-nowrap"
                          >
                            <Phone className="h-3 w-3 text-emerald-600 shrink-0" />
                            <span>{b.customer_phone}</span>
                          </a>
                        </div>
                      </td>

                      {/* 3. VENUE & COURT (SPORT IN ORANGE COLOR TEXT DIRECTLY BELOW) */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 text-xs tracking-tight group-hover:text-[#F94001] transition-colors truncate max-w-[220px]">
                            {b.venue_name}
                          </p>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[190px]">
                              {b.court_name}
                            </span>
                          </div>
                          {/* SPORT IN ONLY ORANGE COLOR TEXT */}
                          <p className="text-[11px] font-bold text-[#F94001] tracking-wide">
                            {b.sport}
                          </p>
                        </div>
                      </td>

                      {/* 4. SLOT TIME & DATE */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 text-xs flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-[#F94001] shrink-0" />
                            <span>{b.booking_date}</span>
                          </p>
                          <p className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>{b.time_slot}</span>
                          </p>
                        </div>
                      </td>

                      {/* 5. PAYMENT SPLIT & AMOUNT COLLECT TYPE */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap font-mono">
                        <div className="space-y-0.5">
                          {isPaid && (
                            <>
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-xs text-emerald-700">
                                  ₹{b.total_amount.toLocaleString('en-IN')}
                                </span>
                                <span className="text-[10px] font-sans font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  Full Online
                                </span>
                              </div>
                              <p className="text-[10px] font-sans text-slate-400">
                                Total ₹{b.total_amount.toLocaleString('en-IN')} &bull; Cleared
                              </p>
                            </>
                          )}

                          {isPartial && (
                            <>
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-xs text-emerald-700">
                                  ₹{advance.toLocaleString('en-IN')}
                                </span>
                                <span className="text-[10px] font-sans font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  Advance Online
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-[10px]">
                                <span className="font-bold font-mono text-slate-700">
                                  ₹{balance.toLocaleString('en-IN')}
                                </span>
                                {due_mode === 'ONLINE' ? (
                                  <span className="font-sans font-semibold text-sky-800 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200">
                                    Due: Online
                                  </span>
                                ) : (
                                  <span className="font-sans font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                    Due: Cash
                                  </span>
                                )}
                              </div>
                            </>
                          )}

                          {isRefunded && (
                            <>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-rose-700">
                                  ₹{b.total_amount.toLocaleString('en-IN')}
                                </span>
                                <span className="text-[10px] font-sans font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                  Refunded
                                </span>
                              </div>
                              <p className="text-[10px] font-sans text-slate-400">
                                Returned to source
                              </p>
                            </>
                          )}
                        </div>
                      </td>

                      {/* 6. PAYMENT TYPE & STATUS COMBINED */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <div className="space-y-1.5">
                          {/* Payment Status Badge */}
                          <div>
                            {isPaid && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                <span>Paid</span>
                              </span>
                            )}
                            {isPartial && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                                <Clock className="h-3 w-3 text-amber-600" />
                                <span>Partial Paid</span>
                              </span>
                            )}
                            {isRefunded && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                                <AlertCircle className="h-3 w-3 text-rose-600" />
                                <span>Refunded</span>
                              </span>
                            )}
                          </div>

                          {/* Payment Channel: UPI, Card, Net Banking (pure text, no icon, no '(Online)') */}
                          <div className="text-[11px] font-bold text-slate-700">
                            {cleanPaymentType}
                          </div>
                        </div>
                      </td>

                      {/* 7. BOOKING STATUS */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1 ${
                            b.booking_status === 'COMPLETED'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : b.booking_status === 'IN_PLAY'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                              : b.booking_status === 'CONFIRMED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {b.booking_status}
                        </span>
                      </td>

                      {/* 8. ACTIONS */}
                      <td className="py-3.5 px-4 align-middle text-left whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBooking(b);
                            setDrawerTab('summary');
                          }}
                          className="px-2.5 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#F94001] hover:border-[#F94001]/40 text-xs font-semibold inline-flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                        >
                          <Eye className="h-3 w-3 text-slate-500" />
                          <span>Details &gt;</span>
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
      {/* 5. RIGHT SLIDE-OUT DRAWER (SLIDE BAR): SUMMARY, PAYMENT, BOOKING SLIP */}
      {/* ========================================================================= */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[9999] top-0 left-0 right-0 bottom-0 w-screen h-screen overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setSelectedBooking(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
            <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
              {/* DRAWER TOP HEADER */}
              <div className="p-5 border-b border-[#E5E7EB] bg-white sticky top-0 z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#5F6368] uppercase tracking-wider font-mono">
                      Reservation Dossier
                    </span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="font-mono text-xs font-black text-[#F94001]">
                      {selectedBooking.booking_code}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedBooking(null)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Close Drawer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-black text-[#021526] font-display">
                      {selectedBooking.customer_name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                      <span>Venue:</span>
                      <span className="font-bold text-slate-800">{selectedBooking.venue_name}</span>
                      <span>&bull;</span>
                      <span className="text-[#F94001] font-semibold">{selectedBooking.sport}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                        selectedBooking.booking_status === 'COMPLETED'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : selectedBooking.booking_status === 'IN_PLAY'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                          : selectedBooking.booking_status === 'CONFIRMED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {selectedBooking.booking_status}
                    </span>
                  </div>
                </div>

                {/* Sub-Tabs Bar inside Slide Bar */}
                <div className="flex items-center gap-1 border-b border-slate-100 pt-1">
                  {[
                    { id: 'summary', label: 'Booking Summary', icon: Layers },
                    { id: 'payment', label: 'Payment & Split', icon: CreditCard },
                    { id: 'slip', label: 'Booking Slip / Pass', icon: Printer },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = drawerTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setDrawerTab(tab.id as any)}
                        className={`px-3 py-1.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                          isActive
                            ? 'border-[#F94001] text-[#F94001]'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DRAWER SCROLLABLE BODY */}
              <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
                {/* TAB 1: BOOKING SUMMARY */}
                {drawerTab === 'summary' && (
                  <div className="space-y-4">
                    {/* Court Playtime Schedule */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                        <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-[#F94001]" />
                          <span>Reserved Court Playtime</span>
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-700">
                          {selectedBooking.duration_minutes} Minutes
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Venue Name</span>
                          <p className="font-bold text-slate-900 mt-0.5">{selectedBooking.venue_name}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Court &amp; Sport</span>
                          <p className="font-bold text-slate-900 mt-0.5">
                            {selectedBooking.court_name} (<span className="text-[#F94001]">{selectedBooking.sport}</span>)
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Slot Date</span>
                          <p className="font-mono font-bold text-slate-800 mt-0.5">{selectedBooking.booking_date}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Time Slot</span>
                          <p className="font-mono font-bold text-slate-800 mt-0.5">{selectedBooking.time_slot}</p>
                        </div>
                      </div>
                    </div>

                    {/* Player Details Card */}
                    <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-2.5">
                      <span className="text-xs font-black uppercase tracking-wider text-[#021526] block">
                        Player Information
                      </span>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Player Name</span>
                          <p className="font-bold text-slate-900 mt-0.5">{selectedBooking.customer_name}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Contact Phone</span>
                          <p className="font-mono text-slate-800 mt-0.5 flex items-center gap-1">
                            <Phone className="h-3 w-3 text-emerald-600" />
                            <span>{selectedBooking.customer_phone}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* QR Check-in Code */}
                    <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Check-in Passcode</span>
                        <p className="font-mono font-black text-lg text-slate-900">
                          {selectedBooking.booking_code.split('-').pop()}
                        </p>
                        <p className="text-[10px] text-slate-500">Player presents code at venue entry gate</p>
                      </div>
                      <div className="h-16 w-16 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center text-slate-700">
                        <QrCode className="h-10 w-10" />
                      </div>
                    </div>

                    {/* Slot Actions: Reschedule or Cancel */}
                    {selectedBooking.booking_status !== 'CANCELLED' && (
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setRescheduleModalOpen(true)}
                          className="flex-1 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                          <span>Reschedule Slot</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCancelModalOpen(true)}
                          className="flex-1 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                          <span>Cancel &amp; Refund</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: PAYMENT & SPLIT BREAKDOWN (REQUESTED BY USER) */}
                {drawerTab === 'payment' && (
                  <div className="space-y-4">
                    {(() => {
                      const { advance, balance, isPartial, isRefunded } = getAdvanceAndBalance(selectedBooking);
                      return (
                        <>
                          {/* Financial Reconciliation Cards */}
                          <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-3 font-mono">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="text-xs font-black uppercase tracking-wider text-[#021526] font-display">
                                Payment Reconciliation
                              </span>
                              <span className="text-[10px] text-slate-400 font-sans">
                                {selectedBooking.payment_method}
                              </span>
                            </div>

                            {/* 3 Metrics Row */}
                            <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono">
                              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                                <span className="text-[9px] text-slate-400 font-bold uppercase block font-sans">Total Court Fee</span>
                                <span className="font-black text-sm text-slate-900 mt-0.5 block">
                                  ₹{selectedBooking.total_amount}
                                </span>
                              </div>
                              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                                <span className="text-[9px] text-emerald-700 font-bold uppercase block font-sans">Advance Online</span>
                                <span className="font-black text-sm text-emerald-800 mt-0.5 block">
                                  ₹{advance}
                                </span>
                              </div>
                              <div className={`p-2.5 rounded-xl border ${balance > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                                <span className={`text-[9px] font-bold uppercase block font-sans ${balance > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                                  Due Balance
                                </span>
                                <span className={`font-black text-sm mt-0.5 block ${balance > 0 ? 'text-amber-800' : 'text-slate-600'}`}>
                                  ₹{balance}
                                </span>
                              </div>
                            </div>

                            {/* Balance Notification & Quick Action */}
                            {balance > 0 && (
                              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                                <div className="space-y-0.5">
                                  <p className="font-bold text-amber-900 flex items-center gap-1">
                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                    <span>₹{balance} Due at Venue</span>
                                  </p>
                                  <p className="text-[11px] text-amber-700">Player can pay cash at counter or via online link.</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleMarkBalancePaid(selectedBooking.id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shrink-0"
                                >
                                  Mark Cash Paid
                                </button>
                              </div>
                            )}

                            {/* Revenue & Commission Split */}
                            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                              <div className="flex justify-between text-slate-600">
                                <span className="font-sans">Platform Commission (10%):</span>
                                <span>- ₹{selectedBooking.platform_fee}</span>
                              </div>
                              <div className="flex justify-between text-emerald-700 font-bold">
                                <span className="font-sans">Net Venue Partner Share:</span>
                                <span>₹{selectedBooking.venue_share}</span>
                              </div>
                            </div>
                          </div>

                          {/* Instant Balance Payment Link */}
                          <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-2.5">
                            <span className="text-xs font-black uppercase tracking-wider text-[#021526] block">
                              Balance Payment Link
                            </span>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                readOnly
                                value={`https://ibooksports.com/pay/${selectedBooking.booking_code}`}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleCopy(`https://ibooksports.com/pay/${selectedBooking.booking_code}`, 'paylink')}
                                className="px-3 py-2 rounded-xl bg-[#021526] hover:bg-[#F94001] text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                              >
                                {copiedText === 'paylink' ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                                <span>Copy Link</span>
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-400">Share via WhatsApp or SMS for contactless online settlement.</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* TAB 3: BOOKING SLIP / INVOICE */}
                {drawerTab === 'slip' && (
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-white border border-slate-300 shadow-sm space-y-4" id="booking-reservation-slip">
                      <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-md bg-[#F94001] text-white flex items-center justify-center font-black text-xs">
                              iB
                            </div>
                            <span className="font-black text-sm text-[#021526]">
                              iBookSports Reservation Slip
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">Court Booking Confirmation</p>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-xs font-bold text-slate-900 block">{selectedBooking.booking_code}</span>
                          <span className="text-[10px] text-slate-500">{selectedBooking.booking_date}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Player</span>
                          <p className="font-bold text-slate-900">{selectedBooking.customer_name}</p>
                          <p className="text-slate-600 font-mono text-[11px]">{selectedBooking.customer_phone}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Venue &amp; Sport</span>
                          <p className="font-bold text-slate-900">{selectedBooking.venue_name}</p>
                          <p className="text-slate-600 text-[11px]">{selectedBooking.court_name} ({selectedBooking.sport})</p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 font-mono text-xs">
                        <div className="flex justify-between">
                          <span>Playtime Slot:</span>
                          <span className="font-bold">{selectedBooking.time_slot}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Court Charge:</span>
                          <span className="font-bold text-slate-900">₹{selectedBooking.total_amount}</span>
                        </div>
                        <div className="flex justify-between text-emerald-700">
                          <span>Payment Method:</span>
                          <span>{selectedBooking.payment_method}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-sm">
                          <span>Reservation Status:</span>
                          <span className="text-emerald-700">{selectedBooking.booking_status}</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
                        <span>Authorized Booking Pass &bull; Present at venue entrance</span>
                        <span className="font-mono font-bold text-emerald-700">VALID RESERVATION</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handlePrintSlip}
                      className="w-full py-2.5 rounded-xl bg-[#021526] hover:bg-[#F94001] text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Printer className="h-4 w-4" />
                      <span>Print Booking Pass</span>
                    </button>
                  </div>
                )}
              </div>

              {/* DRAWER FOOTER */}
              <div className="p-4 bg-slate-50 border-t border-[#E5E7EB] flex items-center justify-between shrink-0">
                <span className="text-xs text-slate-500 font-medium">
                  {selectedBooking.booking_status} &bull; ₹{selectedBooking.total_amount}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2 rounded-xl bg-[#021526] hover:bg-[#F94001] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL BOOKING MODAL */}
      {cancelModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-[99999] bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-black text-[#021526]">Cancel Reservation?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to cancel booking <span className="font-mono font-bold text-slate-800">{selectedBooking.booking_code}</span>? An instant refund of ₹{selectedBooking.total_amount} will be processed.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={() => handleCancelBooking(selectedBooking.id)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 cursor-pointer"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESCHEDULE BOOKING MODAL */}
      {rescheduleModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-[99999] bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-[#F94001]" />
                <h4 className="font-black text-base text-[#021526]">Reschedule Slot</h4>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Current Slot</span>
                <p className="font-bold text-slate-800 mt-0.5">
                  {selectedBooking.booking_date} &bull; {selectedBooking.time_slot}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Select New Slot Time
                </label>
                <select
                  value={rescheduleSlotTime}
                  onChange={(e) => setRescheduleSlotTime(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-[#F94001]"
                >
                  <option value="">Select available slot...</option>
                  <option value="05:00 PM - 06:00 PM">05:00 PM - 06:00 PM</option>
                  <option value="06:00 PM - 07:00 PM">06:00 PM - 07:00 PM</option>
                  <option value="07:00 PM - 08:00 PM">07:00 PM - 08:00 PM</option>
                  <option value="08:00 PM - 09:00 PM">08:00 PM - 09:00 PM</option>
                  <option value="09:00 PM - 10:00 PM">09:00 PM - 10:00 PM</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRescheduleModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRescheduleBooking(selectedBooking.id)}
                className="flex-1 py-2.5 rounded-xl bg-[#021526] hover:bg-[#F94001] text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Update Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
