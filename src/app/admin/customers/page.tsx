'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Eye,
  X,
  Phone,
  Mail,
  MapPin,
  CalendarCheck,
  CreditCard,
  CheckCircle2,
  Filter,
  ArrowUpDown,
  Copy,
  Check,
  Clock,
  Ban,
  Trophy,
  DollarSign,
  ArrowLeft,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Activity,
  Receipt,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  INITIAL_CUSTOMERS,
  INITIAL_BOOKINGS,
  INITIAL_PAYMENTS,
  CustomerItem,
  BookingItem,
  PaymentTransactionItem,
} from '@/lib/mockData';

type CustomerDetailTab = 'overview' | 'bookings' | 'payments' | 'cancellations';

type DrawerItem =
  | { type: 'booking'; data: BookingItem }
  | { type: 'payment'; data: PaymentTransactionItem }
  | { type: 'cancellation'; data: BookingItem };

export default function CustomerManagementPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>(INITIAL_CUSTOMERS);
  const [allBookings, setAllBookings] = useState<BookingItem[]>(INITIAL_BOOKINGS);
  const [allPayments, setAllPayments] = useState<PaymentTransactionItem[]>(INITIAL_PAYMENTS);

  // Filter state for main customers list
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'spend' | 'hours' | 'bookings' | 'name' | 'id'>('spend');

  // Customer Detail View State (Full Page View like Venue Detail)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [detailTab, setDetailTab] = useState<CustomerDetailTab>('overview');

  // Slide Bar Drawer State (opens when clicking a Booking, Payment, or Cancellation row inside Detail View)
  const [drawerItem, setDrawerItem] = useState<DrawerItem | null>(null);

  // Quick feedback states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Helper for customer ID formatting
  const formatCustomerId = (id: string) => {
    if (id.startsWith('cust_')) {
      return `CUST-${id.replace('cust_', '')}`;
    }
    return id.toUpperCase();
  };

  // Filtered and Sorted Customers for main list
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        const q = searchQuery.toLowerCase().trim();
        const formattedId = formatCustomerId(c.id).toLowerCase();

        const matchesSearch =
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          (c.district && c.district.toLowerCase().includes(q)) ||
          (c.state && c.state.toLowerCase().includes(q)) ||
          formattedId.includes(q) ||
          c.id.toLowerCase().includes(q);

        const matchesTier = tierFilter === 'ALL' || c.tier === tierFilter;

        return matchesSearch && matchesTier;
      })
      .sort((a, b) => {
        if (sortBy === 'spend') return b.total_spent - a.total_spent;
        if (sortBy === 'hours') return (b.total_hours_spent || 0) - (a.total_hours_spent || 0);
        if (sortBy === 'bookings') return b.total_bookings - a.total_bookings;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'id') return a.id.localeCompare(b.id);
        return 0;
      });
  }, [customers, searchQuery, tierFilter, sortBy]);

  // Overall KPIs for main list (NO WALLET)
  const totalPlayers = customers.length;
  const totalPlayerGMV = customers.reduce((acc, c) => acc + c.total_spent, 0);
  const totalReservations = customers.reduce((acc, c) => acc + c.total_bookings, 0);
  const totalHoursSpent = customers.reduce(
    (acc, c) => acc + (c.total_hours_spent || Math.round(c.total_bookings * 1.4)),
    0
  );
  const totalCancellations = customers.reduce((acc, c) => acc + c.cancellation_count, 0);

  // Specific customer's Bookings
  const customerBookings = useMemo(() => {
    if (!selectedCustomer) return [];
    return allBookings.filter(
      (b) =>
        b.customer_id === selectedCustomer.id ||
        b.customer_name.toLowerCase() === selectedCustomer.name.toLowerCase()
    );
  }, [selectedCustomer, allBookings]);

  // Specific customer's Payments
  const customerPayments = useMemo(() => {
    if (!selectedCustomer) return [];
    return allPayments.filter(
      (p) =>
        p.customer_name.toLowerCase() === selectedCustomer.name.toLowerCase() ||
        p.customer_phone === selectedCustomer.phone
    );
  }, [selectedCustomer, allPayments]);

  // Specific customer's Cancellations
  const customerCancelledBookings = useMemo(() => {
    return customerBookings.filter(
      (b) => b.booking_status === 'CANCELLED' || b.payment_status === 'REFUNDED'
    );
  }, [customerBookings]);

  // Cancel & Direct Refund Action Handler (from Booking Drawer)
  const handleCancelAndRefundBooking = (bookingId: string) => {
    const targetBooking = allBookings.find((b) => b.id === bookingId);
    if (!targetBooking || !selectedCustomer) return;

    const refundAmount = targetBooking.total_amount;
    const utrRef = `UTR-UPI-${Date.now().toString().slice(-8)}`;

    // 1. Update Bookings state
    setAllBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              booking_status: 'CANCELLED' as const,
              payment_status: 'REFUNDED' as const,
              cancellation_reason: 'Admin processed direct cancellation & UPI refund',
              cancelled_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
              refund_amount: refundAmount,
              refund_status: 'REFUNDED' as const,
              refund_utr: utrRef,
            }
          : b
      )
    );

    // 2. Update Customer record
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === selectedCustomer.id
          ? {
              ...c,
              cancellation_count: c.cancellation_count + 1,
            }
          : c
      )
    );

    // Update selectedCustomer copy
    setSelectedCustomer((prev) =>
      prev
        ? {
            ...prev,
            cancellation_count: prev.cancellation_count + 1,
          }
        : null
    );

    // If drawer is showing this booking, update drawer data
    setDrawerItem((prev) =>
      prev && prev.type === 'booking' && prev.data.id === bookingId
        ? {
            ...prev,
            data: {
              ...prev.data,
              booking_status: 'CANCELLED',
              payment_status: 'REFUNDED',
              cancellation_reason: 'Admin processed direct cancellation & UPI refund',
              refund_amount: refundAmount,
              refund_status: 'REFUNDED',
              refund_utr: utrRef,
            },
          }
        : prev
    );

    setActionSuccessMsg(
      `Booking ${targetBooking.booking_code} cancelled. ₹${refundAmount} refunded directly to customer's source account (Ref: ${utrRef})!`
    );
    setTimeout(() => setActionSuccessMsg(null), 5000);
  };

  // =========================================================================
  // VIEW 2: CUSTOMER DETAIL PAGE VIEW (MATCHING VENUE MANAGEMENT FULL VIEW)
  // =========================================================================
  if (selectedCustomer) {
    const formattedId = formatCustomerId(selectedCustomer.id);
    const hoursSpent =
      selectedCustomer.total_hours_spent || Math.round(selectedCustomer.total_bookings * 1.4);

    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
        {/* TOP BREADCRUMB & HEADER (MATCHING GREEN FIELD SPORTS PARK VENUE HEADER) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Back Button */}
            <button
              type="button"
              onClick={() => {
                setSelectedCustomer(null);
                setDrawerItem(null);
              }}
              className="h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>All Customers</span>
            </button>

            <span className="text-slate-300 font-mono">/</span>

            {/* Customer Initials Circle Badge */}
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-tr from-[#F94001] to-[#E03800] text-white flex items-center justify-center font-black text-sm sm:text-base shadow-xs shrink-0">
              {selectedCustomer.name.slice(0, 2).toUpperCase()}
            </div>

            {/* Customer Name & Subtitle */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-[#021526] tracking-tight font-display">
                  {selectedCustomer.name}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                  {selectedCustomer.tier} TIER
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-slate-500 mt-1 flex-wrap font-medium">
                <span className="font-mono font-bold text-slate-700">{formattedId}</span>
                <span>&bull;</span>
                <a
                  href={`tel:${selectedCustomer.phone.replace(/\s+/g, '')}`}
                  className="hover:text-[#F94001] flex items-center gap-1 font-mono text-[11px]"
                >
                  <Phone className="h-3 w-3 text-emerald-600" />
                  <span>{selectedCustomer.phone}</span>
                </a>
                <span>&bull;</span>
                <a
                  href={`mailto:${selectedCustomer.email}`}
                  className="hover:text-[#F94001] flex items-center gap-1 text-[11px]"
                >
                  <Mail className="h-3 w-3 text-blue-600" />
                  <span>{selectedCustomer.email}</span>
                </a>
                <span>&bull;</span>
                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  <MapPin className="h-3 w-3 text-slate-400" />
                  <span>
                    {selectedCustomer.district || selectedCustomer.city},{' '}
                    {selectedCustomer.state || 'Tamil Nadu'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Top Right Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Verified Customer</span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(formattedId, selectedCustomer.id)}
              className="h-8.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              {copiedId === selectedCustomer.id ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  <span>Copy ID</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* NOTIFICATION ALERT BANNER */}
        {actionSuccessMsg && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3 text-xs font-bold text-emerald-800 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
            <button type="button" onClick={() => setActionSuccessMsg(null)}>
              <X className="h-4 w-4 text-emerald-600" />
            </button>
          </div>
        )}

        {/* KPI METRICS ROW FOR THIS SPECIFIC CUSTOMER (MATCHING VENUE DETAIL STATS CARDS) */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Total Bookings */}
          <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
                Total Bookings
              </span>
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CalendarCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-[#021526] font-mono">
                {selectedCustomer.total_bookings}
              </span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                Slots Reserved
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Turf and pitch court bookings</p>
          </div>

          {/* Total Hours Spent */}
          <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
                Total Hours Spent
              </span>
              <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-700 font-mono">{hoursSpent} hrs</span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                Playtime
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Total hours on venue courts</p>
          </div>

          {/* Total Cost Paid */}
          <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
                Total Cost Paid
              </span>
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-700 font-mono">
                ₹{selectedCustomer.total_spent.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Direct payment gateway receipts</p>
          </div>

          {/* Cancellations */}
          <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
                Cancellations
              </span>
              <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Ban className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-700 font-mono">
                {selectedCustomer.cancellation_count}
              </span>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                Refunds Logged
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Handled via direct UPI refund</p>
          </div>

          {/* Transactions Logged */}
          <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-xs col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
                Transactions
              </span>
              <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-purple-700 font-mono">
                {customerPayments.length}
              </span>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                Receipts Logged
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Direct gateway receipts</p>
          </div>
        </div>

        {/* NAVIGATION PILL TABS (MATCHING USER SCREENSHOT: Overview, Bookings, Payment Transactions, Cancellations) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setDetailTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              detailTab === 'overview'
                ? 'bg-[#F94001] text-white shadow-sm shadow-[#F94001]/30'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-[#E5E7EB]'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setDetailTab('bookings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              detailTab === 'bookings'
                ? 'bg-[#F94001] text-white shadow-sm shadow-[#F94001]/30'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-[#E5E7EB]'
            }`}
          >
            <CalendarCheck className="h-3.5 w-3.5" />
            <span>Bookings</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                detailTab === 'bookings' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {customerBookings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setDetailTab('payments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              detailTab === 'payments'
                ? 'bg-[#F94001] text-white shadow-sm shadow-[#F94001]/30'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-[#E5E7EB]'
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Payment Transactions</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                detailTab === 'payments' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {customerPayments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setDetailTab('cancellations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              detailTab === 'cancellations'
                ? 'bg-[#F94001] text-white shadow-sm shadow-[#F94001]/30'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-[#E5E7EB]'
            }`}
          >
            <Ban className="h-3.5 w-3.5" />
            <span>Cancellations &amp; Refunds</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                detailTab === 'cancellations'
                  ? 'bg-white/25 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {customerCancelledBookings.length}
            </span>
          </button>
        </div>

        {/* TAB CONTENT AREA */}

        {/* 1. OVERVIEW TAB */}
        {detailTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Player Information Dossier */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#F94001]" />
                  <h3 className="text-sm font-black text-[#021526] uppercase tracking-wider">
                    Customer Profile Dossier
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  KYC Verified
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Full Name
                  </span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedCustomer.name}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Customer ID
                  </span>
                  <p className="font-mono font-bold text-slate-800 text-sm mt-0.5">{formattedId}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Mobile Phone
                  </span>
                  <p className="font-mono text-slate-700 mt-0.5 flex items-center gap-1">
                    <Phone className="h-3 w-3 text-emerald-600" />
                    {selectedCustomer.phone}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Email Address
                  </span>
                  <p className="text-slate-700 mt-0.5 truncate flex items-center gap-1">
                    <Mail className="h-3 w-3 text-blue-600" />
                    {selectedCustomer.email}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    District &amp; State
                  </span>
                  <p className="text-slate-800 font-medium mt-0.5">
                    {selectedCustomer.district || selectedCustomer.city},{' '}
                    {selectedCustomer.state || 'Tamil Nadu'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Registered On
                  </span>
                  <p className="font-mono text-slate-700 mt-0.5">
                    {selectedCustomer.registered_at}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: Sports & Venue Preferences */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-black text-[#021526] uppercase tracking-wider">
                    Sports &amp; Venue Preferences
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400 font-semibold">
                  Multi-Sport Profile
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Preferred Sports
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                    {selectedCustomer.preferred_sports.map((sp) => (
                      <span
                        key={sp}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs"
                      >
                        {sp}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Favorite Venues Booked
                  </span>
                  <div className="space-y-1.5 mt-1.5">
                    {selectedCustomer.favorite_venues.map((ven) => (
                      <div
                        key={ven}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold flex items-center justify-between"
                      >
                        <span>{ven}</span>
                        <span className="text-[10px] font-mono text-emerald-600 font-bold">
                          Frequent Play
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. BOOKINGS TAB (TABLE BASED WITH DETAIL DRAWER TRIGGER) */}
        {detailTab === 'bookings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#021526]">Customer Venue Reservations</h3>
                <p className="text-xs text-slate-500">
                  Click on any booking row to inspect complete slot dossier in the slide bar.
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-mono font-bold text-xs">
                {customerBookings.length} Bookings
              </span>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4">Booking ID</th>
                      <th className="py-3 px-4">Venue &amp; Court</th>
                      <th className="py-3 px-4">Sport</th>
                      <th className="py-3 px-4">Date &amp; Slot</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4">Amount Paid</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerBookings.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          No bookings recorded for this customer.
                        </td>
                      </tr>
                    ) : (
                      customerBookings.map((b) => {
                        const durationHours = (b.duration_minutes / 60).toFixed(1).replace('.0', '');
                        return (
                          <tr
                            key={b.id}
                            onClick={() => setDrawerItem({ type: 'booking', data: b })}
                            className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                          >
                            <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#F94001]">
                              <span className="bg-[#FFF1EC] px-2 py-0.5 rounded border border-[#F94001]/20">
                                {b.booking_code}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-slate-900 text-xs group-hover:text-[#F94001] transition-colors">
                                {b.venue_name}
                              </p>
                              <p className="text-[11px] text-slate-500">{b.court_name}</p>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                {b.sport}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-semibold text-slate-800 text-[11px]">
                                {b.booking_date}
                              </p>
                              <p className="font-mono text-slate-500 text-[10px]">{b.time_slot}</p>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-700 font-semibold">
                              {durationHours} hr ({b.duration_minutes}m)
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-xs text-emerald-700">
                              ₹{b.total_amount}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-black ${
                                  b.booking_status === 'COMPLETED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : b.booking_status === 'IN_PLAY'
                                    ? 'bg-blue-100 text-blue-800 animate-pulse'
                                    : b.booking_status === 'CONFIRMED'
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {b.booking_status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDrawerItem({ type: 'booking', data: b });
                                }}
                                className="h-7 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
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
          </div>
        )}

        {/* 3. PAYMENT TRANSACTIONS TAB (TABLE BASED WITH DETAIL DRAWER TRIGGER) */}
        {detailTab === 'payments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#021526]">Payment Transactions &amp; Receipts</h3>
                <p className="text-xs text-slate-500">
                  Click on any transaction row to inspect gateway receipt in the slide bar.
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-mono font-bold text-xs">
                {customerPayments.length} Transactions
              </span>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4">Txn ID</th>
                      <th className="py-3 px-4">Gateway Reference</th>
                      <th className="py-3 px-4">Booking Ref</th>
                      <th className="py-3 px-4">Venue</th>
                      <th className="py-3 px-4">Gross Amount</th>
                      <th className="py-3 px-4">Payment Mode</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerPayments.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          No payment transactions recorded for this customer.
                        </td>
                      </tr>
                    ) : (
                      customerPayments.map((p) => (
                        <tr
                          key={p.id}
                          onClick={() => setDrawerItem({ type: 'payment', data: p })}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-900">
                            {p.txn_id}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500">
                            {p.gateway_payment_id}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-[#F94001] text-xs">
                            {p.booking_code}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-800 text-xs">
                            {p.venue_name}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-black text-xs text-slate-900">
                            ₹{p.gross_amount}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 text-xs font-medium">
                            {p.payment_method}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500">
                            {p.timestamp}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDrawerItem({ type: 'payment', data: p });
                              }}
                              className="h-7 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                            >
                              <Eye className="h-3 w-3 text-slate-500" />
                              <span>Details &gt;</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. CANCELLATIONS & REFUNDS TAB (TABLE BASED WITH DETAIL DRAWER TRIGGER) */}
        {detailTab === 'cancellations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#021526]">Cancellations &amp; Refund Audit</h3>
                <p className="text-xs text-slate-500">
                  Click on any cancellation record to inspect refund trail and source bank reference.
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-mono font-bold text-xs">
                {customerCancelledBookings.length} Cancelled
              </span>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4">Booking ID</th>
                      <th className="py-3 px-4">Venue &amp; Court</th>
                      <th className="py-3 px-4">Cancellation Reason</th>
                      <th className="py-3 px-4">Cancelled At</th>
                      <th className="py-3 px-4">Refund Amount</th>
                      <th className="py-3 px-4">Refund Status</th>
                      <th className="py-3 px-4">Bank UTR Ref</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerCancelledBookings.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          No cancellations or refunds logged for this customer.
                        </td>
                      </tr>
                    ) : (
                      customerCancelledBookings.map((cb) => (
                        <tr
                          key={cb.id}
                          onClick={() => setDrawerItem({ type: 'cancellation', data: cb })}
                          className="hover:bg-rose-50/40 transition-colors cursor-pointer group"
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#F94001]">
                            <span className="bg-[#FFF1EC] px-2 py-0.5 rounded border border-[#F94001]/20">
                              {cb.booking_code}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-slate-900 text-xs">{cb.venue_name}</p>
                            <p className="text-[11px] text-slate-500">{cb.court_name}</p>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 text-xs font-medium max-w-[200px] truncate">
                            {cb.cancellation_reason || 'Player schedule conflict'}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500">
                            {cb.cancelled_at || cb.booking_date}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-xs text-rose-600">
                            ₹{cb.refund_amount || cb.total_amount}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              <span>{cb.refund_status || 'REFUNDED VIA UPI'}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[10px] text-slate-600 truncate max-w-[120px]">
                            {cb.refund_utr || 'UTR-RZP-992140182'}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDrawerItem({ type: 'cancellation', data: cb });
                              }}
                              className="h-7 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                            >
                              <Eye className="h-3 w-3 text-slate-500" />
                              <span>Details &gt;</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            SLIDE BAR DRAWER: Opens when clicking a Booking, Payment, or Cancellation row
            ===================================================================== */}
        {drawerItem && (
          <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-white shadow-2xl h-full flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 border-l border-[#E5E7EB]">
              {/* Drawer Header */}
              <div className="p-5 bg-white border-b border-[#E5E7EB] flex items-start justify-between gap-3 shrink-0">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#F94001]">
                    {drawerItem.type === 'booking' && 'BOOKING DOSSIER &bull; RESERVATION AUDIT'}
                    {drawerItem.type === 'payment' && 'PAYMENT RECEIPT &bull; GATEWAY AUDIT'}
                    {drawerItem.type === 'cancellation' && 'CANCELLATION &bull; REFUND TRAIL'}
                  </span>
                  <h3 className="text-lg font-black text-[#021526] font-display mt-0.5">
                    {drawerItem.type === 'booking' && drawerItem.data.booking_code}
                    {drawerItem.type === 'payment' && drawerItem.data.txn_id}
                    {drawerItem.type === 'cancellation' && drawerItem.data.booking_code}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Customer: {selectedCustomer.name} ({formattedId})
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setDrawerItem(null)}
                  className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-5 overflow-y-auto flex-1 space-y-4">
                {/* 1. BOOKING SLIDE BAR CONTENT */}
                {drawerItem.type === 'booking' && (
                  <div className="space-y-4 text-xs">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-[#F94001] bg-[#FFF1EC] px-2 py-0.5 rounded">
                          {drawerItem.data.booking_code}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                          {drawerItem.data.booking_status}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Venue &amp; Court
                        </span>
                        <p className="text-sm font-extrabold text-[#021526] mt-0.5">
                          {drawerItem.data.venue_name}
                        </p>
                        <p className="text-slate-600 font-medium">{drawerItem.data.court_name}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            Date &amp; Slot
                          </span>
                          <p className="font-bold text-slate-900 mt-0.5">
                            {drawerItem.data.booking_date}
                          </p>
                          <p className="font-mono text-slate-500 text-[11px]">
                            {drawerItem.data.time_slot}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            Duration &amp; Sport
                          </span>
                          <p className="font-bold text-slate-900 mt-0.5">
                            {drawerItem.data.sport}
                          </p>
                          <p className="font-mono text-slate-500 text-[11px]">
                            {drawerItem.data.duration_minutes} mins
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Payment &amp; Financials
                      </span>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-slate-600">Total Amount Paid</span>
                        <span className="font-mono font-black text-sm text-[#021526]">
                          ₹{drawerItem.data.total_amount}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Payment Mode</span>
                        <span className="font-bold text-slate-700">
                          {drawerItem.data.payment_method}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Transaction Ref</span>
                        <span className="font-mono text-slate-600 truncate max-w-[180px]">
                          {drawerItem.data.transaction_id}
                        </span>
                      </div>
                    </div>

                    {/* Action: Cancel & Direct Refund if Live/Confirmed */}
                    {(drawerItem.data.booking_status === 'CONFIRMED' ||
                      drawerItem.data.booking_status === 'IN_PLAY') && (
                      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                        <span className="text-[11px] font-bold text-rose-800">
                          Direct Cancellation &amp; Source UPI Refund
                        </span>
                        <p className="text-[10px] text-rose-600">
                          Cancelling this reservation will directly refund ₹
                          {drawerItem.data.total_amount} back to customer&apos;s source account.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleCancelAndRefundBooking(drawerItem.data.id)}
                          className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Ban className="h-3.5 w-3.5" />
                          <span>Cancel &amp; Direct Refund ₹{drawerItem.data.total_amount}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. PAYMENT SLIDE BAR CONTENT */}
                {drawerItem.type === 'payment' && (
                  <div className="space-y-4 text-xs">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {drawerItem.data.txn_id}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                          {drawerItem.data.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Gross Amount
                        </span>
                        <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                          ₹{drawerItem.data.gross_amount}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-2.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Gateway Receipt Data
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Gateway</span>
                        <span className="font-bold text-slate-800">{drawerItem.data.gateway}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Gateway Payment ID</span>
                        <span className="font-mono text-slate-700">
                          {drawerItem.data.gateway_payment_id}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Payment Mode</span>
                        <span className="font-medium text-slate-800">
                          {drawerItem.data.payment_method}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Linked Booking Code</span>
                        <span className="font-mono font-bold text-[#F94001]">
                          {drawerItem.data.booking_code}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Timestamp</span>
                        <span className="font-mono text-slate-600">{drawerItem.data.timestamp}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. CANCELLATION SLIDE BAR CONTENT */}
                {drawerItem.type === 'cancellation' && (
                  <div className="space-y-4 text-xs">
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-[#F94001] bg-white px-2 py-0.5 rounded border border-rose-200">
                          {drawerItem.data.booking_code}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-200 text-rose-900">
                          CANCELLED
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Refund Processed
                        </span>
                        <p className="text-2xl font-black text-rose-700 font-mono mt-0.5">
                          ₹{drawerItem.data.refund_amount || drawerItem.data.total_amount}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-2.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Cancellation Audit Details
                      </span>
                      <div>
                        <span className="text-slate-400">Reason</span>
                        <p className="font-semibold text-slate-800 mt-0.5">
                          {drawerItem.data.cancellation_reason ||
                            'Player requested schedule cancellation'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-slate-500">Cancelled At</span>
                        <span className="font-mono text-slate-700">
                          {drawerItem.data.cancelled_at || drawerItem.data.booking_date}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Refund Status</span>
                        <span className="font-bold text-emerald-700">
                          {drawerItem.data.refund_status || 'REFUNDED VIA UPI'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Bank UTR Reference</span>
                        <span className="font-mono font-bold text-slate-700">
                          {drawerItem.data.refund_utr || 'UTR-RZP-992140182'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 bg-slate-50 border-t border-[#E5E7EB] flex items-center justify-between shrink-0">
                <span className="text-xs text-slate-500 font-medium">Customer: {formattedId}</span>
                <button
                  type="button"
                  onClick={() => setDrawerItem(null)}
                  className="px-4 py-2 rounded-xl bg-[#021526] hover:bg-[#F94001] text-white text-xs font-bold transition-colors cursor-pointer"
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

  // =========================================================================
  // VIEW 1: MAIN CUSTOMER MANAGEMENT TABLE (CLEAN, MINIMAL, SATISFYING)
  // =========================================================================
  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-[#F94001] bg-[#FFF1EC] border border-[#F94001]/20 px-3 py-1 rounded-full mb-2">
            <Users className="h-3.5 w-3.5 text-[#F94001]" />
            <span>Player &amp; Customer Directory &bull; Multi-State Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#021526] font-display">
            Customer Management
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6368] mt-1 font-medium">
            Registered customer IDs, contact details, venue reservations, court hours spent, total booking pay, and real-time reservation history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-white border border-[#E5E7EB] shadow-xs flex items-center gap-2 text-xs font-bold text-slate-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{customers.length} Verified Players</span>
          </div>
        </div>
      </div>

      {/* 2. OPERATIONAL KPI METRICS ROW (CLEAN & SATISFYING - NO WALLET!) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Players */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-xs hover:border-[#F94001]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">Total Players</span>
            <div className="h-8 w-8 rounded-xl bg-[#FFF1EC] text-[#F94001] flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#021526] font-mono">{totalPlayers}</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Verified
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">100% phone verified players</p>
        </div>

        {/* Total Player Spend */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">Total Player Spend</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-700 font-mono">
              ₹{totalPlayerGMV.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Gross player booking payments</p>
        </div>

        {/* Total Bookings */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">Total Bookings</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[#021526] font-mono">{totalReservations}</span>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              Slots Reserved
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Turf and pitch court bookings</p>
        </div>

        {/* Total Hours Spent (Replacing Wallet) */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">Total Hours Spent</span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-700 font-mono">{totalHoursSpent} hrs</span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              Court Playtime
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Total hours spent on venue courts</p>
        </div>

        {/* Cancellations & Refunds */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-xs hover:border-rose-300 transition-all col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">Cancellations</span>
            <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Ban className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700 font-mono">{totalCancellations}</span>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
              Refunds Logged
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Handled via direct UPI refund</p>
        </div>
      </div>

      {/* 3. SEARCH, TIER AND SORT CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E5E7EB] shadow-xs">
        {/* Live Search Input */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#5F6368]" />
          <input
            type="text"
            placeholder="Search customer ID, name, phone, email, district, state..."
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

        {/* Dropdown Filters & Sorters */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
          {/* Tier Selector */}
          <div className="relative min-w-[140px] flex-1 sm:flex-none">
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="w-full appearance-none pl-8 pr-8 py-2 rounded-xl border border-[#E5E7EB] bg-slate-50 text-xs font-bold text-[#021526] focus:outline-none focus:border-[#F94001] focus:ring-1 focus:ring-[#F94001] transition-colors cursor-pointer"
            >
              <option value="ALL">All Loyalty Tiers</option>
              <option value="PLATINUM">Platinum Tier</option>
              <option value="GOLD">Gold Tier</option>
              <option value="SILVER">Silver Tier</option>
              <option value="REGULAR">Regular Tier</option>
            </select>
            <Trophy className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-amber-500 pointer-events-none" />
          </div>

          {/* Sort Selector */}
          <div className="relative min-w-[170px] flex-1 sm:flex-none">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full appearance-none pl-8 pr-8 py-2 rounded-xl border border-[#E5E7EB] bg-slate-50 text-xs font-bold text-[#021526] focus:outline-none focus:border-[#F94001] focus:ring-1 focus:ring-[#F94001] transition-colors cursor-pointer"
            >
              <option value="spend">Sort: Highest Total Pay</option>
              <option value="hours">Sort: Most Hours Spent</option>
              <option value="bookings">Sort: Most Bookings</option>
              <option value="name">Sort: Player Name (A-Z)</option>
              <option value="id">Sort: Customer ID</option>
            </select>
            <ArrowUpDown className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-500 pointer-events-none" />
          </div>

          {/* Reset Filters */}
          {(searchQuery || tierFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setTierFilter('ALL');
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

      {/* 5. MINIMAL & MAIN CONTENT DATA TABLE (WITH LAST BOOKING ID & DATE) */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/90 bg-slate-50/75 text-slate-500 font-semibold tracking-wider text-[11px] uppercase select-none">
                <th className="py-3 px-4 w-[110px]">Customer ID</th>
                <th className="py-3 px-4 min-w-[220px]">Customer Details</th>
                <th className="py-3 px-4 min-w-[120px]">Total Bookings</th>
                <th className="py-3 px-4 min-w-[130px]">Total Hours Spent</th>
                <th className="py-3 px-4 min-w-[130px]">Total Cost Paid</th>
                <th className="py-3 px-4 min-w-[170px]">Last Booking</th>
                <th className="py-3 px-4 text-center w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-xs text-slate-700">No matching customers found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Try adjusting your search query or tier filter
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const displayId = formatCustomerId(cust.id);
                  const isCopied = copiedId === cust.id;
                  const hoursSpent = cust.total_hours_spent || Math.round(cust.total_bookings * 1.4);
                  const recent = cust.recent_booking;

                  return (
                    <tr
                      key={cust.id}
                      onClick={() => {
                        setSelectedCustomer(cust);
                        setDetailTab('overview');
                      }}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    >
                      {/* 1. CUSTOMER ID */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {displayId}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(displayId, cust.id);
                            }}
                            className="text-slate-400 hover:text-slate-700 transition-colors p-0.5 cursor-pointer"
                            title="Copy ID"
                          >
                            {isCopied ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* 2. CUSTOMER DETAILS (NAME & PHONE ONLY - NO EMAIL FOR CLEAN TABLE ALIGNMENT) */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 text-xs tracking-tight group-hover:text-[#F94001] transition-colors whitespace-nowrap">
                            {cust.name}
                          </p>
                          <a
                            href={`tel:${cust.phone.replace(/\s+/g, '')}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-[#F94001] transition-colors inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-500 whitespace-nowrap"
                          >
                            <Phone className="h-3 w-3 text-emerald-600 shrink-0" />
                            <span>{cust.phone}</span>
                          </a>
                        </div>
                      </td>

                      {/* 3. TOTAL BOOKINGS */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-xs text-slate-900">
                            {cust.total_bookings} slots
                          </span>
                          {cust.cancellation_count > 0 ? (
                            <p className="text-[10px] text-rose-600 font-medium">
                              {cust.cancellation_count} cancelled
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-400 font-medium">0 cancelled</p>
                          )}
                        </div>
                      </td>

                      {/* 4. TOTAL HOURS SPENT */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <div>
                            <span className="font-mono font-bold text-xs text-slate-900">
                              {hoursSpent} hrs
                            </span>
                            <p className="text-[10px] text-slate-400 font-medium">Court playtime</p>
                          </div>
                        </div>
                      </td>

                      {/* 5. TOTAL COST PAID (NO WALLET - DIRECT PAYMENT) */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <div className="space-y-0.5">
                          <p className="font-mono font-black text-xs text-emerald-700">
                            ₹{cust.total_spent.toLocaleString('en-IN')}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">Direct payment</p>
                        </div>
                      </td>

                      {/* 6. LAST BOOKING (ID & DATE) */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        {recent ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-[11px] text-[#F94001] bg-[#FFF1EC] border border-[#F94001]/20 px-1.5 py-0.5 rounded">
                                {recent.booking_code}
                              </span>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                                  recent.booking_status === 'COMPLETED'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                    : recent.booking_status === 'IN_PLAY'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200/60 animate-pulse'
                                    : recent.booking_status === 'CONFIRMED'
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                                }`}
                              >
                                {recent.booking_status}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                              <CalendarCheck className="h-3 w-3 text-slate-400 shrink-0" />
                              <span>{recent.booking_date}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No bookings</span>
                        )}
                      </td>

                      {/* 7. ACTIONS (OPENS CUSTOMER DETAIL VIEW) */}
                      <td className="py-3.5 px-4 align-middle text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(cust);
                            setDetailTab('overview');
                          }}
                          className="h-7.5 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#F94001] hover:border-[#F94001]/40 hover:bg-[#FFF1EC] text-xs font-semibold inline-flex items-center gap-1 shadow-2xs transition-all cursor-pointer active:scale-95"
                          title="Open Customer Details &amp; Venue Management"
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
    </div>
  );
}
