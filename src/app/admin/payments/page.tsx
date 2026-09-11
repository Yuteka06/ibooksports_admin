'use client';

import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  Eye,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Building2,
  FileText,
  ShieldCheck,
  Check,
  Copy,
  Phone,
  Calendar,
  MapPin,
  ExternalLink,
  Share2,
  Printer,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Percent,
  Wallet,
  AlertTriangle,
  Receipt,
  MessageSquare,
  BadgeCheck,
  RefreshCw,
  Landmark,
  Layers,
  CalendarDays,
  Trophy,
} from 'lucide-react';
import {
  INITIAL_PAYMENTS,
  PaymentTransactionItem,
  PaymentStatusType,
  PaymentMethodCategory,
} from '@/lib/mockData';

export default function PaymentManagementPage() {
  const [payments, setPayments] = useState<PaymentTransactionItem[]>(INITIAL_PAYMENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PaymentStatusType>('ALL');
  const [methodFilter, setMethodFilter] = useState<'ALL' | string>('ALL');
  const [selectedSport, setSelectedSport] = useState<string>('ALL');
  
  // Date Picker Filter - ON TOP RIGHT CORNER OF PAGE HEADER
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  
  // Slide-out Drawer State (Consolidated into 2 Tabs: Overview & Tax Invoice, Payment Link & Gateway Audit)
  const [selectedTxn, setSelectedTxn] = useState<PaymentTransactionItem | null>(null);
  const [drawerTab, setDrawerTab] = useState<'overview_invoice' | 'payment_link_audit'>('overview_invoice');
  
  // Interactive copy feedback
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  // Toast Notification
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
  const getCleanPaymentType = (p: PaymentTransactionItem): 'UPI' | 'Card' | 'Net Banking' => {
    if (p.payment_type === 'UPI' || p.payment_method?.toLowerCase().includes('upi')) {
      return 'UPI';
    }
    if (
      p.payment_type === 'CREDIT_CARD' ||
      p.payment_type === 'DEBIT_CARD' ||
      p.payment_method?.toLowerCase().includes('card')
    ) {
      return 'Card';
    }
    if (p.payment_type === 'NET_BANKING' || p.payment_method?.toLowerCase().includes('banking')) {
      return 'Net Banking';
    }
    return 'UPI';
  };

  // Quick Action: Mark pending balance as cleared at counter (Cash) or via Online Link
  const handleMarkBalanceCleared = (txnId: string, clearMode: 'CASH' | 'ONLINE' = 'CASH') => {
    setPayments((prev) =>
      prev.map((p) => {
        if (p.txn_id === txnId) {
          const updated: PaymentTransactionItem = {
            ...p,
            gross_amount: p.total_booking_amount,
            received_amount: p.total_booking_amount,
            balance_amount: 0,
            advance_percentage: 100,
            payment_status: 'FULLY_PAID',
            booking_status: 'CONFIRMED',
            due_mode: clearMode,
          };
          if (selectedTxn && selectedTxn.txn_id === txnId) {
            setSelectedTxn(updated);
          }
          return updated;
        }
        return p;
      })
    );

    showToast(
      'success',
      clearMode === 'CASH' ? 'Cash Received at Counter' : 'Online Payment Received',
      clearMode === 'CASH'
        ? `Balance of ₹${selectedTxn?.balance_amount || ''} collected in cash at venue. Marked Paid in Full.`
        : `Balance of ₹${selectedTxn?.balance_amount || ''} settled via Online Link. Marked Paid in Full.`
    );
  };

  // Extract unique sports
  const uniqueSports = useMemo(() => {
    const set = new Set<string>();
    payments.forEach((p) => {
      if (p.sport) set.add(p.sport);
    });
    return Array.from(set).sort();
  }, [payments]);

  // 1. DATE-FILTERED PAYMENTS (CRITICAL: BOTH KPIS AND TABLE ARE TIED TO THIS SO DATE UPDATES EVERYTHING!)
  const dateFilteredPayments = useMemo(() => {
    if (!selectedDate) return payments;
    return payments.filter((p) => {
      const itemDate = p.booking_date || p.timestamp.split(' ')[0];
      return itemDate === selectedDate;
    });
  }, [payments, selectedDate]);

  // 2. DYNAMIC KPIS CALCULATED FROM DATE-FILTERED PAYMENTS
  const totalVolume = useMemo(
    () => dateFilteredPayments.reduce((acc, p) => acc + (p.total_booking_amount || p.gross_amount), 0),
    [dateFilteredPayments]
  );
  const totalCollected = useMemo(
    () => dateFilteredPayments.reduce((acc, p) => (p.status === 'SUCCESS' ? acc + (p.received_amount || p.gross_amount) : acc), 0),
    [dateFilteredPayments]
  );
  const totalPendingBalance = useMemo(
    () => dateFilteredPayments.reduce((acc, p) => (p.payment_status === 'ADVANCE_PAID' ? acc + (p.balance_amount || 0) : acc), 0),
    [dateFilteredPayments]
  );
  const totalCommission = useMemo(
    () => dateFilteredPayments.reduce((acc, p) => (p.status === 'SUCCESS' ? acc + p.platform_commission : acc), 0),
    [dateFilteredPayments]
  );
  const paidCount = useMemo(
    () => dateFilteredPayments.filter((p) => p.payment_status === 'FULLY_PAID').length,
    [dateFilteredPayments]
  );
  const partialPaidCount = useMemo(
    () => dateFilteredPayments.filter((p) => p.payment_status === 'ADVANCE_PAID').length,
    [dateFilteredPayments]
  );
  const totalRefunded = useMemo(
    () => dateFilteredPayments.reduce((acc, p) => (p.payment_status === 'REFUNDED' || p.status === 'REFUNDED' ? acc + (p.received_amount || p.gross_amount) : acc), 0),
    [dateFilteredPayments]
  );

  // 3. FINAL FILTERED PAYMENTS FOR TABLE ROWS
  const filteredPayments = useMemo(() => {
    return dateFilteredPayments.filter((p) => {
      // Status filter: FULLY_PAID = 'Paid', ADVANCE_PAID = 'Partial Paid'
      if (statusFilter !== 'ALL' && p.payment_status !== statusFilter) {
        return false;
      }

      // Payment Method filter: 'UPI' | 'Card' | 'Net Banking'
      if (methodFilter !== 'ALL') {
        const cleanType = getCleanPaymentType(p);
        if (cleanType !== methodFilter) return false;
      }

      // Sport filter
      if (selectedSport !== 'ALL' && p.sport !== selectedSport) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          p.txn_id.toLowerCase().includes(q) ||
          p.booking_code.toLowerCase().includes(q) ||
          p.customer_name.toLowerCase().includes(q) ||
          p.customer_phone.includes(q) ||
          p.venue_name.toLowerCase().includes(q) ||
          (p.court_name && p.court_name.toLowerCase().includes(q)) ||
          (p.sport && p.sport.toLowerCase().includes(q));

        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [dateFilteredPayments, statusFilter, methodFilter, selectedSport, searchQuery]);

  const handlePrintInvoice = () => {
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

      {/* 1. PAGE HEADER (WITH DATE PICKER ON RIGHT TOP CORNER) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-[#F94001] bg-[#FFF1EC] border border-[#F94001]/20 px-3 py-1 rounded-full mb-2">
            <CreditCard className="h-3.5 w-3.5 text-[#F94001]" />
            <span>Gateway &amp; Transaction Ledger &bull; Razorpay Payment Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#021526] font-display">
            Payment Management
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6368] mt-1 font-medium">
            Real-time customer payment transactions, advance &amp; full payment tracking, settlement splits, tax invoices, and instant balance collection links.
          </p>
        </div>

        {/* RIGHT TOP CORNER: DATE PICKER & EXPORT BUTTON (CLEAN HORIZONTAL ALIGNMENT) */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
          {/* DATE PICKER ON RIGHT TOP CORNER */}
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
              showToast('info', 'Export Triggered', 'CSV Ledger generated with tax breakdowns and transaction UTRs.');
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#CBD5E1] text-[#021526] hover:bg-slate-50 px-3.5 py-2 text-xs font-bold shadow-xs transition-all cursor-pointer h-[42px] whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV Ledger</span>
          </button>
        </div>
      </div>

      {/* 2. FINANCIAL OVERVIEW KPI CARDS (CLEAN MINIMAL DESIGN - NO UNWANTED HELPER TEXT) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Booked Volume */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-2xs hover:border-slate-400/50 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
              Total Booking Value
            </span>
            <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Landmark className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline">
            <span className="text-2xl font-black text-[#021526] font-mono tracking-tight">
              ₹{totalVolume.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Received / Collected Amount */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-2xs hover:border-emerald-400/50 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
              Received Payments
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 font-mono tracking-tight">
              ₹{totalCollected.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Settled
            </span>
          </div>
        </div>

        {/* Pending Advance Balance */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-2xs hover:border-amber-400/50 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
              Pending Balances
            </span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700 font-mono tracking-tight">
              ₹{totalPendingBalance.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {partialPaidCount} slots
            </span>
          </div>
        </div>

        {/* Platform Revenue (10%) */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-2xs hover:border-blue-400/50 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
              Platform Fee (10%)
            </span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-700 font-mono tracking-tight">
              ₹{totalCommission.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              iBookSports Net
            </span>
          </div>
        </div>

        {/* Total Refunded */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-2xs hover:border-rose-400/50 transition-all flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
              Total Refunded
            </span>
            <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700 font-mono tracking-tight">
              ₹{totalRefunded.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              Cancellations
            </span>
          </div>
        </div>
      </div>

      {/* 3. SEARCH, STATUS TABS & DROPDOWN FILTERS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E5E7EB] shadow-xs">
        {/* Left: Payment Status Pills ("Paid" and "Partial Paid" only) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'ALL', label: 'All Payments', count: dateFilteredPayments.length },
            { id: 'FULLY_PAID', label: 'Paid', count: paidCount },
            { id: 'ADVANCE_PAID', label: 'Partial Paid', count: partialPaidCount },
            { id: 'REFUNDED', label: 'Refunded', count: dateFilteredPayments.filter((p) => p.payment_status === 'REFUNDED').length },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
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

        {/* Right: Search, Sport & Payment Type (UPI / Card / Net Banking) */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
          {/* Live Search */}
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#5F6368]" />
            <input
              type="text"
              placeholder="Search txn ID, booking, player, venue..."
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
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="w-full appearance-none pl-8 pr-7 py-2 rounded-xl border border-[#E5E7EB] bg-slate-50 text-xs font-bold text-[#021526] focus:outline-none focus:border-[#F94001] focus:ring-1 focus:ring-[#F94001] transition-colors cursor-pointer"
            >
              <option value="ALL">All Sports</option>
              {uniqueSports.map((sp) => (
                <option key={sp} value={sp}>
                  {sp}
                </option>
              ))}
            </select>
            <Trophy className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-amber-500 pointer-events-none" />
          </div>

          {/* Payment Type Filter: ONLY 'UPI' | 'Card' | 'Net Banking' */}
          <div className="relative min-w-[140px]">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full appearance-none pl-8 pr-7 py-2 rounded-xl border border-[#E5E7EB] bg-slate-50 text-xs font-bold text-[#021526] focus:outline-none focus:border-[#F94001] focus:ring-1 focus:ring-[#F94001] transition-colors cursor-pointer"
            >
              <option value="ALL">All Payment Types</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Net Banking">Net Banking</option>
            </select>
            <CreditCard className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-500 pointer-events-none" />
          </div>

          {/* Reset Filters */}
          {(searchQuery || selectedDate || statusFilter !== 'ALL' || methodFilter !== 'ALL' || selectedSport !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedDate('');
                setStatusFilter('ALL');
                setMethodFilter('ALL');
                setSelectedSport('ALL');
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

      {/* 4. PERFECT DATA TABLE - TIGHT LEFT-ALIGNED COLUMNS (NO OVER-SPACE) */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/90 bg-slate-50/75 text-slate-400 font-bold tracking-wider text-[11px] uppercase select-none">
                <th className="py-3 px-4 whitespace-nowrap">Transaction ID</th>
                <th className="py-3 px-4 whitespace-nowrap">Booking Ref</th>
                <th className="py-3 px-4 whitespace-nowrap">Player Details</th>
                <th className="py-3 px-4 min-w-[220px]">Venue &amp; Court</th>
                <th className="py-3 px-4 whitespace-nowrap">Payment Split</th>
                <th className="py-3 px-4 whitespace-nowrap">Payment &amp; Status</th>
                <th className="py-3 px-4 text-left whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400">
                    <Receipt className="h-9 w-9 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-sm text-[#021526]">No payment transactions found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Try adjusting your date picker, search query, or payment status filter
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const isCopied = copiedText === p.txn_id;
                  const isPartial = p.payment_status === 'ADVANCE_PAID';
                  const isPaid = p.payment_status === 'FULLY_PAID';
                  const isRefunded = p.payment_status === 'REFUNDED';
                  const bookingDate = p.booking_date || p.timestamp.split(' ')[0];
                  const cleanPaymentType = getCleanPaymentType(p);

                  // Booking Status color (colored text only - NO background as requested!)
                  const getBookingStatusTextColor = (status?: string) => {
                    switch (status) {
                      case 'CONFIRMED':
                        return 'text-emerald-600';
                      case 'IN_PLAY':
                        return 'text-blue-600 animate-pulse';
                      case 'COMPLETED':
                        return 'text-indigo-600';
                      case 'CANCELLED':
                        return 'text-rose-600';
                      default:
                        return 'text-emerald-600';
                    }
                  };

                  return (
                    <tr
                      key={p.id}
                      onClick={() => {
                        setSelectedTxn(p);
                        setDrawerTab('overview_invoice');
                      }}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    >
                      {/* 1. TRANSACTION ID (ONLY TRANSACTION ID - NO RAZORPAY REFERENCE ID AS REQUESTED) */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {p.txn_id}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(p.txn_id, p.txn_id);
                            }}
                            className="text-slate-400 hover:text-slate-700 transition-colors p-0.5 cursor-pointer"
                            title="Copy Transaction ID"
                          >
                            {isCopied ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* 2. BOOKING REF (CODE + DATE + BOOKING STATUS BELOW DATE WITH ONLY COLORED TEXT, NO BACKGROUND) */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-[11px] text-[#F94001] bg-[#FFF1EC] border border-[#F94001]/20 px-1.5 py-0.5 rounded inline-block">
                            {p.booking_code}
                          </span>
                          <p className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                            <Calendar className="h-2.5 w-2.5 text-slate-400" />
                            <span>{bookingDate}</span>
                          </p>
                          {/* Booking status below date: ONLY colored text, NO background! */}
                          <p className={`text-[10px] font-extrabold uppercase tracking-wide ${getBookingStatusTextColor(p.booking_status)}`}>
                            {p.booking_status || 'CONFIRMED'}
                          </p>
                        </div>
                      </td>

                      {/* 3. PLAYER DETAILS (NAME & PHONE ONLY - NO EMAIL FOR PERFECT ALIGNMENT) */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 text-xs tracking-tight group-hover:text-[#F94001] transition-colors whitespace-nowrap">
                            {p.customer_name}
                          </p>
                          <a
                            href={`tel:${p.customer_phone.replace(/\s+/g, '')}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-[#F94001] transition-colors inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-500 whitespace-nowrap"
                          >
                            <Phone className="h-3 w-3 text-emerald-600 shrink-0" />
                            <span>{p.customer_phone}</span>
                          </a>
                        </div>
                      </td>

                      {/* 4. VENUE & COURT (WITH SPORT BELOW IN ONLY ORANGE COLOR TEXT AS REQUESTED) */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 text-xs tracking-tight group-hover:text-[#F94001] transition-colors truncate max-w-[220px]">
                            {p.venue_name}
                          </p>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[190px]">
                              {p.court_name || 'Main Court'}
                            </span>
                          </div>
                          {/* SPORT UNDER COURT IN ONLY ORANGE COLOR TEXT */}
                          <p className="text-[11px] font-bold text-[#F94001] tracking-wide">
                            {p.sport || 'Sports'}
                          </p>
                        </div>
                      </td>

                      {/* 5. PAYMENT SPLIT (RECEIVED VS BALANCE) */}
                      {/* 5. PAYMENT SPLIT & AMOUNT COLLECTION TYPE (ADVANCE ONLINE, DUE CASH OR ONLINE) */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap font-mono">
                        <div className="space-y-0.5">
                          {isPaid && (
                            <>
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-xs text-emerald-700">
                                  ₹{(p.received_amount || p.gross_amount).toLocaleString('en-IN')}
                                </span>
                                <span className="text-[10px] font-sans font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  Full Online
                                </span>
                              </div>
                              <p className="text-[10px] font-sans text-slate-400">
                                Total ₹{p.total_booking_amount.toLocaleString('en-IN')} &bull; Cleared
                              </p>
                            </>
                          )}

                          {isPartial && (
                            <>
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-xs text-emerald-700">
                                  ₹{(p.received_amount || p.gross_amount).toLocaleString('en-IN')}
                                </span>
                                <span className="text-[10px] font-sans font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  Advance Online
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-[10px]">
                                <span className="font-bold font-mono text-slate-700">
                                  ₹{(p.balance_amount || 0).toLocaleString('en-IN')}
                                </span>
                                {p.due_mode === 'ONLINE' ? (
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
                                  ₹{(p.received_amount || p.gross_amount).toLocaleString('en-IN')}
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

                          {p.payment_status === 'FAILED' && (
                            <p className="text-[10px] text-red-600 font-sans font-bold">
                              Transaction Failed
                            </p>
                          )}
                        </div>
                      </td>

                      {/* 6. PAYMENT TYPE & STATUS COMBINED (ADVANCE ONLINE & DUE TYPE) */}
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
                            {p.payment_status === 'FAILED' && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                                <X className="h-3 w-3 text-red-600" />
                                <span>Failed</span>
                              </span>
                            )}
                          </div>

                          {/* Payment Channel: UPI, Card, Net Banking (pure text, no icon, no '(Online)') */}
                          <div className="text-[11px] font-bold text-slate-700">
                            {cleanPaymentType}
                          </div>
                        </div>
                      </td>

                      {/* 8. ACTIONS */}
                      <td className="py-3.5 px-4 align-middle text-left whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTxn(p);
                            setDrawerTab('overview_invoice');
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
      {/* 5. RIGHT SLIDE-OUT DRAWER (SLIDE BAR) - WITH INVOICE & PAYMENT LINK */}
      {/* ========================================================================= */}
      {selectedTxn && (
        <div className="fixed inset-0 z-[9999] top-0 left-0 right-0 bottom-0 w-screen h-screen overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setSelectedTxn(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
            <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
              {/* DRAWER TOP HEADER */}
              <div className="p-5 border-b border-[#E5E7EB] bg-white sticky top-0 z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#5F6368] uppercase tracking-wider font-mono">
                      Transaction Dossier
                    </span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="font-mono text-xs font-black text-[#F94001]">
                      {selectedTxn.txn_id}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTxn(null)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Close Drawer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-black text-[#021526] font-display">
                      {selectedTxn.customer_name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                      <span>Booking Code:</span>
                      <span className="font-mono font-bold text-[#F94001]">
                        {selectedTxn.booking_code}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedTxn.payment_status === 'FULLY_PAID' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Paid</span>
                      </span>
                    )}
                    {selectedTxn.payment_status === 'ADVANCE_PAID' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                        <span>Partial Paid</span>
                      </span>
                    )}
                    {selectedTxn.payment_status === 'REFUNDED' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                        <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                        <span>Refunded</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Sub-Tabs Bar inside Slide Bar: 2 Consolidated Tabs */}
                <div className="flex items-center gap-2 border-b border-slate-100 pt-1">
                  {[
                    { id: 'overview_invoice', label: 'Overview & Tax Invoice', icon: Receipt },
                    { id: 'payment_link_audit', label: 'Payment Link & Gateway Audit', icon: Share2 },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = drawerTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setDrawerTab(tab.id as any)}
                        className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                          isActive
                            ? 'border-[#F94001] text-[#F94001]'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DRAWER SCROLLABLE BODY */}
              <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs">
                {/* TAB 1: OVERVIEW & TAX INVOICE (COMBINED) */}
                {drawerTab === 'overview_invoice' && (
                  <div className="space-y-4">
                    {/* 1. PAYMENT SETTLEMENT PROGRESS CARD */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-[#FFF1EC]/30 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-[#F94001]" />
                          <span className="text-xs font-black uppercase tracking-wider text-[#021526]">
                            Payment Settlement Status
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-[#F94001] bg-white px-2 py-0.5 rounded border border-[#F94001]/20">
                          {selectedTxn.payment_status === 'ADVANCE_PAID' ? 'Partial Paid (50%)' : 'Paid in Full'}
                        </span>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-emerald-700">
                            ₹{selectedTxn.received_amount.toLocaleString('en-IN')} Received ({selectedTxn.payment_status === 'ADVANCE_PAID' ? '50%' : '100%'})
                          </span>
                          <span className={selectedTxn.balance_amount > 0 ? 'text-amber-700' : 'text-slate-400'}>
                            {selectedTxn.balance_amount > 0
                              ? `₹${selectedTxn.balance_amount.toLocaleString('en-IN')} Due (50%)`
                              : '₹0 Due'}
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{
                              width: selectedTxn.payment_status === 'ADVANCE_PAID' ? '50%' : '100%',
                            }}
                          />
                          {selectedTxn.balance_amount > 0 && (
                            <div className="bg-amber-400 h-full rounded-r-full w-1/2 opacity-75" />
                          )}
                        </div>
                      </div>

                      {/* 3 Metrics Row */}
                      <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Total Booking</span>
                          <p className="font-mono font-black text-sm text-[#021526] mt-0.5">
                            ₹{selectedTxn.total_booking_amount.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80">
                          <span className="text-[10px] text-emerald-700 font-bold uppercase">Amount Paid</span>
                          <p className="font-mono font-black text-sm text-emerald-800 mt-0.5">
                            ₹{selectedTxn.received_amount.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div className={`p-2.5 rounded-xl border ${selectedTxn.balance_amount > 0 ? 'bg-amber-50 border-amber-200/80' : 'bg-slate-50 border-slate-200'}`}>
                          <span className={`text-[10px] font-bold uppercase ${selectedTxn.balance_amount > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                            Balance Due
                          </span>
                          <p className={`font-mono font-black text-sm mt-0.5 ${selectedTxn.balance_amount > 0 ? 'text-amber-800' : 'text-slate-600'}`}>
                            ₹{selectedTxn.balance_amount.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>

                      {selectedTxn.balance_amount > 0 && (
                        <div className="p-3 rounded-xl bg-white border border-amber-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs text-amber-900 font-bold">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                              <span>₹{selectedTxn.balance_amount.toLocaleString('en-IN')} Due</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${selectedTxn.due_mode === 'ONLINE' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                              {selectedTxn.due_mode === 'ONLINE' ? 'Due via Online Link' : 'Due via Cash at Venue'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleMarkBalanceCleared(selectedTxn.txn_id, 'CASH')}
                              className="flex-1 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                            >
                              <Check className="h-3 w-3" />
                              <span>Mark Cash Received</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMarkBalanceCleared(selectedTxn.txn_id, 'ONLINE')}
                              className="flex-1 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                            >
                              <Check className="h-3 w-3" />
                              <span>Mark Online Paid</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. PLAYER & VENUE RESERVATION CARD */}
                    <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <span className="text-xs font-black uppercase tracking-wider text-[#021526]">
                          Reservation &amp; Venue Details
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">
                          Razorpay Processed
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Player Name</span>
                          <p className="font-bold text-slate-900 mt-0.5">{selectedTxn.customer_name}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Mobile Phone</span>
                          <p className="font-mono text-slate-700 mt-0.5 flex items-center gap-1">
                            <Phone className="h-3 w-3 text-emerald-600" />
                            {selectedTxn.customer_phone}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Venue</span>
                          <p className="font-bold text-slate-800 mt-0.5">{selectedTxn.venue_name}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Court &amp; Sport</span>
                          <p className="text-slate-700 mt-0.5 font-medium">
                            {selectedTxn.court_name || 'Main Court'} (<span className="text-[#F94001] font-bold">{selectedTxn.sport || 'Sports'}</span>)
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Slot Date &amp; Time</span>
                          <p className="font-mono text-slate-800 mt-0.5">
                            {selectedTxn.booking_date || '2026-03-08'} &bull; {selectedTxn.slot_time || 'Evening'}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Channel</span>
                          <p className="font-bold text-slate-800 mt-0.5">
                            {getCleanPaymentType(selectedTxn)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 3. COMMISSION & FINANCIAL SPLIT BREAKDOWN */}
                    <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-2.5 font-mono">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-black uppercase tracking-wider text-[#021526] font-display">
                          Revenue &amp; Payout Audit
                        </span>
                        <span className="text-[10px] text-slate-400">Razorpay MDR Split</span>
                      </div>

                      <div className="flex justify-between text-slate-600">
                        <span>Gross Collected via Razorpay</span>
                        <span className="font-black text-[#021526]">₹{selectedTxn.received_amount}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>Gateway MDR (2%)</span>
                        <span>- ₹{selectedTxn.gateway_fee}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>GST on MDR (18%)</span>
                        <span>- ₹{selectedTxn.tax_gst}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>iBookSports Commission (10%)</span>
                        <span>+ ₹{selectedTxn.platform_commission}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-200 text-slate-900 font-black text-sm">
                        <span>Net Payable to Venue Partner</span>
                        <span>₹{selectedTxn.net_venue_payout}</span>
                      </div>
                    </div>

                    {/* 4. OFFICIAL TAX INVOICE */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-300 shadow-sm space-y-4" id="tax-invoice-printable">
                      {/* Invoice Header */}
                      <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <div className="h-6 w-6 rounded-md bg-[#F94001] text-white flex items-center justify-center font-black text-xs">
                              iB
                            </div>
                            <span className="font-black text-sm text-[#021526] tracking-tight">
                              iBookSports Technologies Pvt Ltd
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">
                            GSTIN: 33AAACI1234F1Z8 &bull; SAC: 998599
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Bengaluru, Karnataka &bull; support@ibooksports.com
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Tax Invoice
                          </span>
                          <span className="font-mono font-bold text-xs text-[#021526]">
                            {selectedTxn.invoice_number || `INV-2026-${selectedTxn.booking_code}`}
                          </span>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Date: {selectedTxn.timestamp.split(' ')[0]}
                          </p>
                        </div>
                      </div>

                      {/* Billed To & Facility */}
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Billed To (Customer)</span>
                          <p className="font-bold text-slate-900 mt-0.5">{selectedTxn.customer_name}</p>
                          <p className="font-mono text-slate-600 text-[11px]">{selectedTxn.customer_phone}</p>
                          <p className="text-slate-500 text-[10px]">Booking Ref: {selectedTxn.booking_code}</p>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Venue Facility</span>
                          <p className="font-bold text-slate-900 mt-0.5">{selectedTxn.venue_name}</p>
                          <p className="text-slate-600 text-[11px]">{selectedTxn.court_name || 'Sports Arena Court'}</p>
                          <p className="text-slate-500 text-[10px]">Slot: {selectedTxn.slot_time || 'Confirmed Time'}</p>
                        </div>
                      </div>

                      {/* Line Items Table */}
                      <div className="rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                            <tr>
                              <th className="py-2 px-3">Item Description</th>
                              <th className="py-2 px-3 text-right">Qty</th>
                              <th className="py-2 px-3 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            <tr>
                              <td className="py-2.5 px-3">
                                <p className="font-bold text-slate-900">Court Slot Reservation</p>
                                <p className="text-[10px] text-slate-500 font-sans">
                                  {selectedTxn.sport || 'Sports'} Court Playtime &bull; {selectedTxn.venue_name}
                                </p>
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-600">1 Slot</td>
                              <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                                ₹{selectedTxn.total_booking_amount.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Financial Totals */}
                      <div className="space-y-1.5 text-xs font-mono border-t border-slate-200 pt-3">
                        <div className="flex justify-between text-slate-600">
                          <span>Subtotal</span>
                          <span>₹{selectedTxn.total_booking_amount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-emerald-700 font-bold">
                          <span>Amount Received (via {getCleanPaymentType(selectedTxn)})</span>
                          <span>- ₹{selectedTxn.received_amount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-black text-slate-900">
                          <span>
                            {selectedTxn.balance_amount > 0 ? 'Balance Due' : 'Net Balance Due'}
                          </span>
                          <span className={selectedTxn.balance_amount > 0 ? 'text-amber-600' : 'text-emerald-700'}>
                            ₹{selectedTxn.balance_amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Invoice Footer / Seal */}
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
                        <span>Digitally generated tax invoice &bull; Authorized by iBookSports</span>
                        <span className="font-mono text-emerald-700 font-bold">
                          {selectedTxn.payment_status === 'FULLY_PAID' ? 'PAID IN FULL' : 'PARTIALLY PAID'}
                        </span>
                      </div>
                    </div>

                    {/* Invoice Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handlePrintInvoice}
                        className="flex-1 py-2.5 rounded-xl bg-[#021526] hover:bg-[#F94001] text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Printer className="h-4 w-4" />
                        <span>Print Tax Invoice</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          showToast('success', 'Invoice Sent', `Digital tax invoice PDF emailed to player.`);
                        }}
                        className="flex-1 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Download className="h-4 w-4 text-slate-500" />
                        <span>Download PDF</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: PAYMENT LINK & RAZORPAY AUDIT (COMBINED) */}
                {drawerTab === 'payment_link_audit' && (
                  <div className="space-y-4">
                    {/* 1. PAYMENT LINK / RECEIPT LINK CARD */}
                    <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
                      <div className="flex items-center gap-2">
                        <Share2 className="h-4 w-4 text-[#F94001]" />
                        <h4 className="text-sm font-black text-[#021526]">
                          {selectedTxn.balance_amount > 0 ? 'Balance Payment Link' : 'Customer Receipt Link'}
                        </h4>
                      </div>
                      <p className="text-slate-600 text-xs">
                        {selectedTxn.balance_amount > 0
                          ? `This secure payment link allows the player to pay the remaining balance of ₹${selectedTxn.balance_amount} using UPI, Card, or Net Banking.`
                          : 'The booking is fully paid. Share the receipt and gate access voucher link with the player.'}
                      </p>

                      {/* Link Box */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-slate-700 truncate select-all">
                          {selectedTxn.balance_payment_link ||
                            selectedTxn.payment_link ||
                            `https://pay.ibooksports.com/bal/${selectedTxn.booking_code}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const link =
                              selectedTxn.balance_payment_link ||
                              selectedTxn.payment_link ||
                              `https://pay.ibooksports.com/bal/${selectedTxn.booking_code}`;
                            handleCopy(link, 'pay_link');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#021526] hover:bg-[#F94001] text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                        >
                          {copiedText === 'pay_link' ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Quick Share Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <a
                          href={`https://wa.me/${selectedTxn.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Hi ${selectedTxn.customer_name}, please pay your remaining balance of ₹${selectedTxn.balance_amount} for your court booking (${selectedTxn.booking_code}) at ${selectedTxn.venue_name}: https://pay.ibooksports.com/bal/${selectedTxn.booking_code}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <MessageSquare className="h-4 w-4 text-emerald-600" />
                          <span>Share via WhatsApp</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            showToast(
                              'success',
                              'SMS Sent',
                              `Payment reminder dispatched to ${selectedTxn.customer_phone}`
                            );
                          }}
                          className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Phone className="h-4 w-4 text-blue-600" />
                          <span>Send via SMS</span>
                        </button>
                      </div>
                    </div>

                    {/* 2. DIRECT DUE SETTLEMENT (CASH VS ONLINE) */}
                    {selectedTxn.balance_amount > 0 && (
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/40 border border-amber-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                            <BadgeCheck className="h-4 w-4 text-amber-700" />
                            <span>Due Balance Collection (₹{selectedTxn.balance_amount})</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedTxn.due_mode === 'ONLINE' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'}`}>
                            Customer Paying: {selectedTxn.due_mode === 'ONLINE' ? 'Online' : 'Cash at Venue'}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800">
                          Some customers give cash at the venue counter and some pay online through the payment link. Clear whichever payment mode the customer provided:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleMarkBalanceCleared(selectedTxn.txn_id, 'CASH')}
                            className="py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Mark Paid via Cash</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkBalanceCleared(selectedTxn.txn_id, 'ONLINE')}
                            className="py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Mark Paid via Online</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 3. RAZORPAY GATEWAY AUDIT */}
                    <div className="space-y-3 font-mono text-xs">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">{selectedTxn.txn_id}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                            {selectedTxn.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-sans">
                          Settled via Razorpay Gateway API with full webhook validation.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-2.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">
                          Razorpay Gateway Identifiers
                        </span>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-sans">Gateway</span>
                          <span className="font-bold text-slate-800">RAZORPAY</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-sans">Gateway Order ID</span>
                          <span className="font-bold text-slate-800">{selectedTxn.gateway_order_id}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-sans">Gateway Payment ID</span>
                          <span className="font-bold text-slate-800">{selectedTxn.gateway_payment_id}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-sans">Transaction Timestamp</span>
                          <span className="text-slate-700">{selectedTxn.timestamp}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-500 font-sans">Disbursal Method</span>
                          <span className="font-bold text-slate-800">Direct Venue Payout</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* DRAWER FOOTER */}
              <div className="p-4 bg-slate-50 border-t border-[#E5E7EB] flex items-center justify-between shrink-0">
                <span className="text-xs text-slate-500 font-medium">
                  {selectedTxn.payment_status === 'ADVANCE_PAID' ? 'Partial Paid (50%)' : 'Paid in Full'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTxn(null)}
                  className="px-4 py-2 rounded-xl bg-[#021526] hover:bg-[#F94001] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
