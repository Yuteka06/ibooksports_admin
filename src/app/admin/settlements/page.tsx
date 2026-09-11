'use client';

import React, { useState, useMemo } from 'react';
import {
  Landmark,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Download,
  Building2,
  Check,
  X,
  AlertCircle,
  Eye,
  ShieldCheck,
  DollarSign,
  Calendar,
  CalendarDays,
  CalendarRange,
  Layers,
  Copy,
  Receipt,
  FileText,
  Printer,
  ChevronRight,
  TrendingUp,
  Percent,
  Wallet,
  CreditCard,
  AlertTriangle,
  Info,
  MapPin,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import {
  INITIAL_SETTLEMENTS,
  SettlementBatchItem,
  SettlementBookingItem,
} from '@/lib/mockData';

export default function SettlementManagementPage() {
  const [settlements, setSettlements] = useState<SettlementBatchItem[]>(INITIAL_SETTLEMENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Date & Month Filter in Top Right Corner (User Requirement)
  const [filterType, setFilterType] = useState<'ALL' | 'DATE' | 'MONTH'>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // YYYY-MM
  
  // Slide-out Drawer (Slide Bar) State
  const [selectedBatch, setSelectedBatch] = useState<SettlementBatchItem | null>(null);
  const [drawerTab, setDrawerTab] = useState<'summary' | 'bookings' | 'slip'>('summary');
  
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

  // Available unique months from dataset
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    settlements.forEach((s) => {
      if (s.cycle_month) set.add(s.cycle_month);
    });
    return Array.from(set).sort().reverse();
  }, [settlements]);

  // 1. PRIMARY DATE OR MONTH FILTER (CRITICAL: BOTH KPIS AND TABLE ARE TIED TO THIS!)
  const dateOrMonthFilteredSettlements = useMemo(() => {
    return settlements.filter((s) => {
      if (filterType === 'DATE' && selectedDate) {
        return s.settlement_date === selectedDate || s.period_end === selectedDate;
      }
      if (filterType === 'MONTH' && selectedMonth) {
        return s.cycle_month === selectedMonth;
      }
      return true;
    });
  }, [settlements, filterType, selectedDate, selectedMonth]);

  // 2. DYNAMIC KPIS CALCULATED FROM DATE/MONTH FILTERED SETTLEMENTS
  const totalActualCourtPrice = useMemo(
    () => dateOrMonthFilteredSettlements.reduce((acc, s) => acc + (s.actual_court_price_total || s.gross_booking_amount), 0),
    [dateOrMonthFilteredSettlements]
  );
  const totalSettledToBanks = useMemo(
    () => dateOrMonthFilteredSettlements.filter((s) => s.status === 'SETTLED').reduce((acc, s) => acc + s.net_payable, 0),
    [dateOrMonthFilteredSettlements]
  );
  const totalOnlineAdvanceHeld = useMemo(
    () => dateOrMonthFilteredSettlements.reduce((acc, s) => acc + (s.online_advance_held || 0), 0),
    [dateOrMonthFilteredSettlements]
  );
  const totalCashCollectedAtVenue = useMemo(
    () => dateOrMonthFilteredSettlements.reduce((acc, s) => acc + (s.cash_collected_at_venue || 0), 0),
    [dateOrMonthFilteredSettlements]
  );
  const totalDeductions = useMemo(
    () => dateOrMonthFilteredSettlements.reduce((acc, s) => acc + s.platform_commission_deducted + (s.platform_fee_gst || 0) + s.tds_deducted, 0),
    [dateOrMonthFilteredSettlements]
  );

  // 3. FINAL FILTERED DATA FOR TABLE ROWS
  const filteredSettlements = useMemo(() => {
    return dateOrMonthFilteredSettlements.filter((s) => {
      // Status Filter
      if (statusFilter !== 'ALL' && s.status !== statusFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchBatch = s.batch_number.toLowerCase().includes(q);
        const matchVenue = s.venue_name.toLowerCase().includes(q);
        const matchOwner = s.owner_name.toLowerCase().includes(q);
        const matchUtr = (s.utr_number || '').toLowerCase().includes(q);
        const matchBank = s.bank_name.toLowerCase().includes(q);
        if (!matchBatch && !matchVenue && !matchOwner && !matchUtr && !matchBank) {
          return false;
        }
      }

      return true;
    });
  }, [dateOrMonthFilteredSettlements, statusFilter, searchQuery]);

  const handlePrintAdviceSlip = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* TOAST NOTIFICATION */}
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

      {/* 1. PAGE HEADER (WITH DATE & MONTH PICKER IN TOP RIGHT CORNER) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-[#F94001] bg-[#FFF1EC] border border-[#F94001]/20 px-3 py-1 rounded-full mb-2">
            <Landmark className="h-3.5 w-3.5 text-[#F94001]" />
            <span>Partner Disbursal Console &bull; Automated Settlement Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#021526] font-display">
            Settlement Management
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6368] mt-1 font-medium">
            Automated settlement cycles, platform fee deductions on cash &amp; advance bookings, TDS compliance, and direct bank disbursals.
          </p>
        </div>

        {/* TOP RIGHT CORNER: DATE PICKER & MONTH PICKER & EXPORT */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Filter Mode Selector (All / By Date / By Month) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setFilterType('ALL');
                setSelectedDate('');
                setSelectedMonth('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-white text-[#021526] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterType('DATE');
                if (!selectedDate) setSelectedDate('2026-03-08');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterType === 'DATE'
                  ? 'bg-white text-[#F94001] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Date</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterType('MONTH');
                if (!selectedMonth) setSelectedMonth('2026-03');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterType === 'MONTH'
                  ? 'bg-white text-[#F94001] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Month</span>
            </button>
          </div>

          {/* DATE PICKER (Active when Date is selected) */}
          {filterType === 'DATE' && (
            <div className="flex items-center gap-2 bg-white border border-[#CBD5E1] px-3 py-2 rounded-xl shadow-2xs hover:border-[#F94001]/60 transition-colors">
              <Calendar className="h-4 w-4 text-[#F94001] shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 leading-tight">
                  Settlement Date
                </span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[#021526] outline-none cursor-pointer p-0 leading-tight"
                  title="Filter settlements by date"
                />
              </div>
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  className="text-slate-400 hover:text-slate-800 ml-1 p-0.5"
                  title="Clear date"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {/* MONTH PICKER (Active when Month is selected) */}
          {filterType === 'MONTH' && (
            <div className="flex items-center gap-2 bg-white border border-[#CBD5E1] px-3 py-2 rounded-xl shadow-2xs hover:border-[#F94001]/60 transition-colors">
              <CalendarDays className="h-4 w-4 text-[#F94001] shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 leading-tight">
                  Cycle Month
                </span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[#021526] outline-none cursor-pointer p-0 leading-tight"
                >
                  <option value="">All Months</option>
                  {availableMonths.map((m) => {
                    const [year, month] = m.split('-');
                    const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
                    const label = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                    return (
                      <option key={m} value={m}>
                        {label} ({m})
                      </option>
                    );
                  })}
                </select>
              </div>
              {selectedMonth && (
                <button
                  type="button"
                  onClick={() => setSelectedMonth('')}
                  className="text-slate-400 hover:text-slate-800 ml-1 p-0.5"
                  title="Clear month"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Export Button */}
          <button
            type="button"
            onClick={() => {
              showToast('info', 'Export Triggered', 'Settlement ledger exported with UTRs and tax deductions.');
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#CBD5E1] text-[#021526] hover:bg-slate-50 px-3.5 py-2 text-xs font-bold shadow-xs transition-all cursor-pointer h-[42px]"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export Disbursal CSV</span>
          </button>
        </div>
      </div>

      {/* 2. FINANCIAL OVERVIEW KPI CARDS (CLEAN MINIMAL DESIGN - NO UNWANTED HELPER TEXT) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Court Value */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-2xs hover:border-slate-400/50 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
              Total Court Value
            </span>
            <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Landmark className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline">
            <span className="text-2xl font-black text-[#021526] font-mono tracking-tight">
              ₹{totalActualCourtPrice.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Settled to Banks */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-2xs hover:border-emerald-400/50 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
              Settled to Banks
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 font-mono tracking-tight">
              ₹{totalSettledToBanks.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Settled
            </span>
          </div>
        </div>

        {/* Online Advance Held */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-2xs hover:border-blue-400/50 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
              Online Advance Held
            </span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline">
            <span className="text-2xl font-black text-blue-700 font-mono tracking-tight">
              ₹{totalOnlineAdvanceHeld.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Cash at Venue Desk */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-2xs hover:border-amber-400/50 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
              Cash at Venue Desk
            </span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700 font-mono tracking-tight">
              ₹{totalCashCollectedAtVenue.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Venue Cash
            </span>
          </div>
        </div>

        {/* Fee & Tax Deductions */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-2xs hover:border-rose-400/50 transition-all flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
              Fee &amp; Tax Deductions
            </span>
            <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700 font-mono tracking-tight">
              ₹{totalDeductions.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              10% + GST
            </span>
          </div>
        </div>
      </div>

      {/* 3. SEARCH & STATUS FILTER TOOLBAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E5E7EB] shadow-xs">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'ALL', label: 'All Batches', count: dateOrMonthFilteredSettlements.length },
            { id: 'SETTLED', label: 'Settled', count: dateOrMonthFilteredSettlements.filter((s) => s.status === 'SETTLED').length },
            { id: 'PROCESSING', label: 'Processing', count: dateOrMonthFilteredSettlements.filter((s) => s.status === 'PROCESSING').length },
            { id: 'PENDING_APPROVAL', label: 'Pending', count: dateOrMonthFilteredSettlements.filter((s) => s.status === 'PENDING_APPROVAL').length },
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

        {/* Search & Reset */}
        <div className="flex items-center gap-2.5">
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#5F6368]" />
            <input
              type="text"
              placeholder="Search settlement ID, venue, bank, UTR..."
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

          {(searchQuery || selectedDate || selectedMonth || statusFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedDate('');
                setSelectedMonth('');
                setFilterType('ALL');
                setStatusFilter('ALL');
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

      {/* 4. PERFECT FIXED DATA TABLE (ALL COLUMNS VISIBLE, ACTIONS PERFECTLY ALIGNED) */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full table-fixed text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/90 bg-slate-50/75 text-slate-400 font-bold tracking-wider text-[11px] uppercase select-none">
                <th className="py-3 px-3 w-[13%]">Settlement ID</th>
                <th className="py-3 px-3 w-[21%]">Venue &amp; Bank Account</th>
                <th className="py-3 px-3 w-[11%]">Cycle Date</th>
                <th className="py-3 px-3 w-[10%]">Court Price</th>
                <th className="py-3 px-3 w-[13%]">Online &amp; Cash Split</th>
                <th className="py-3 px-3 w-[13%]">Deductions (Fee + GST)</th>
                <th className="py-3 px-3 w-[11%]">Net Payout &amp; Status</th>
                <th className="py-3 px-3 text-left w-[8%]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSettlements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-400">
                    <Receipt className="h-9 w-9 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-sm text-[#021526]">No settlement batches found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Try adjusting your date picker, month filter, or search query
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSettlements.map((s) => {
                  const isCopied = copiedText === s.batch_number;
                  const courtPrice = s.actual_court_price_total || s.gross_booking_amount;
                  const totalDeduction = s.platform_commission_deducted + (s.platform_fee_gst || 0) + s.tds_deducted;

                  return (
                    <tr
                      key={s.id}
                      onClick={() => {
                        setSelectedBatch(s);
                        setDrawerTab('summary');
                      }}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    >
                      {/* 1. SETTLEMENT ID */}
                      <td className="py-3 px-3 align-middle whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {s.batch_number}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(s.batch_number, s.batch_number);
                            }}
                            className="text-slate-400 hover:text-slate-700 transition-colors p-0.5 cursor-pointer"
                            title="Copy Settlement ID"
                          >
                            {isCopied ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* 2. VENUE NAME, CREDIT/ACCOUNT HOLDER NAME & BANK */}
                      <td className="py-3 px-3 align-middle">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 text-xs tracking-tight group-hover:text-[#F94001] transition-colors truncate">
                            {s.venue_name}
                          </p>
                          <p className="text-[11px] text-slate-700 font-semibold truncate">
                            {s.owner_name}
                          </p>
                          <p className="font-mono text-[10px] text-slate-400 flex items-center gap-1 truncate">
                            <Landmark className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate">{s.bank_name} &bull; {s.account_number_masked}</span>
                          </p>
                        </div>
                      </td>

                      {/* 3. CYCLE DATE */}
                      <td className="py-3 px-3 align-middle whitespace-nowrap">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-800 text-xs flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-[#F94001] shrink-0" />
                            <span>{s.settlement_date || s.period_end}</span>
                          </p>
                          <p className="text-[10px] font-mono text-slate-500">
                            Play: {s.period_start}
                          </p>
                        </div>
                      </td>

                      {/* 4. COURT PRICE */}
                      <td className="py-3 px-3 align-middle whitespace-nowrap font-mono">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 text-xs">
                            ₹{courtPrice.toLocaleString('en-IN')}
                          </p>
                          <p className="text-[10px] text-slate-500 font-sans">
                            {s.bookings_count} slots played
                          </p>
                        </div>
                      </td>

                      {/* 5. ONLINE AND CASH SPLIT */}
                      <td className="py-3 px-3 align-middle whitespace-nowrap font-mono">
                        <div className="space-y-0.5 text-xs">
                          <div className="flex items-center justify-between text-emerald-700 font-bold gap-1">
                            <span className="text-[10px] font-sans text-slate-500 font-normal">Online:</span>
                            <span>₹{(s.online_advance_held || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex items-center justify-between text-amber-700 font-semibold gap-1 text-[11px]">
                            <span className="text-[10px] font-sans text-slate-500 font-normal">Cash:</span>
                            <span>₹{(s.cash_collected_at_venue || 0).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </td>

                      {/* 6. DEDUCTIONS (PLATFORM FEE & GST) */}
                      <td className="py-3 px-3 align-middle whitespace-nowrap font-mono">
                        <div className="space-y-0.5">
                          <p className="font-bold text-rose-600 text-xs">
                            - ₹{totalDeduction.toLocaleString('en-IN')}
                          </p>
                          <p className="text-[10px] text-slate-400 font-sans truncate">
                            Fee ₹{s.platform_commission_deducted} &bull; GST ₹{s.platform_fee_gst || 0}
                          </p>
                        </div>
                      </td>

                      {/* 7. NET PAYOUT & STATUS */}
                      <td className="py-3 px-3 align-middle whitespace-nowrap">
                        <div className="space-y-1 font-mono">
                          <div>
                            <span className="font-black text-sm text-emerald-700 block leading-tight">
                              ₹{s.net_payable.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] font-sans text-slate-400">
                              Bank IMPS
                            </span>
                          </div>
                          <div>
                            {s.status === 'SETTLED' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-sans">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                <span>Settled</span>
                              </span>
                            )}
                            {s.status === 'PROCESSING' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 font-sans">
                                <Clock className="h-3 w-3 text-blue-600 animate-spin" />
                                <span>Processing</span>
                              </span>
                            )}
                            {s.status === 'PENDING_APPROVAL' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-sans">
                                <Clock className="h-3 w-3 text-amber-600" />
                                <span>Pending</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 8. ACTION (LEFT ALIGNED & COMPACT) */}
                      <td className="py-3 px-3 align-middle text-left whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            setSelectedBatch(s);
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
      {/* 5. RIGHT SLIDE-OUT DRAWER (SLIDE BAR): SUMMARY, ITEMIZED BOOKINGS, PAYSLIP */}
      {/* ========================================================================= */}
      {selectedBatch && (
        <div className="fixed inset-0 z-[9999] top-0 left-0 right-0 bottom-0 w-screen h-screen overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setSelectedBatch(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
            <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
              {/* DRAWER TOP HEADER */}
              <div className="p-5 border-b border-[#E5E7EB] bg-white sticky top-0 z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#5F6368] uppercase tracking-wider font-mono">
                      Settlement Dossier
                    </span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="font-mono text-xs font-black text-[#F94001]">
                      {selectedBatch.batch_number}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedBatch(null)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Close Drawer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-black text-[#021526] font-display">
                      {selectedBatch.venue_name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                      <span>Beneficiary:</span>
                      <span className="font-bold text-slate-800">{selectedBatch.owner_name}</span>
                      <span>&bull;</span>
                      <span className="font-mono text-slate-600">{selectedBatch.bank_name}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedBatch.status === 'SETTLED' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Settled</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                        <span>Processing</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Sub-Tabs Bar inside Slide Bar */}
                <div className="flex items-center gap-1 border-b border-slate-100 pt-1">
                  {[
                    { id: 'summary', label: 'Settlement Summary', icon: Layers },
                    { id: 'bookings', label: 'Itemized Bookings', icon: Receipt },
                    { id: 'slip', label: 'Payout Advice Slip', icon: Printer },
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
                {/* TAB 1: SETTLEMENT SUMMARY */}
                {drawerTab === 'summary' && (
                  <div className="space-y-4">
                    {/* Financial Summary Card */}
                    <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-3 font-mono">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-black uppercase tracking-wider text-[#021526] font-display">
                          Financial Reconciliation Summary
                        </span>
                        <span className="text-[10px] text-slate-500 font-sans">
                          {selectedBatch.bookings_count} Total Slots
                        </span>
                      </div>

                      {/* 1. Actual Court Price Total */}
                      <div className="flex justify-between text-slate-800 font-bold text-sm">
                        <span className="font-sans">Actual Court Price Total</span>
                        <span>₹{(selectedBatch.actual_court_price_total || selectedBatch.gross_booking_amount).toLocaleString('en-IN')}</span>
                      </div>

                      {/* 2. Online Advance Held */}
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span className="font-sans">Online Advance Held by Platform</span>
                        <span>+ ₹{(selectedBatch.online_advance_held || 0).toLocaleString('en-IN')}</span>
                      </div>

                      {/* 3. Cash Collected at Venue Desk */}
                      <div className="flex justify-between text-amber-700 font-semibold">
                        <span className="font-sans">Cash Directly Collected by Venue Owner</span>
                        <span>+ ₹{(selectedBatch.cash_collected_at_venue || 0).toLocaleString('en-IN')}</span>
                      </div>

                      {/* Deductions breakdown */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-[11px] text-slate-600">
                        <div className="flex justify-between">
                          <span className="font-sans">Platform Fee (10% of court price):</span>
                          <span className="text-rose-600 font-bold">- ₹{selectedBatch.platform_commission_deducted.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-sans">GST on Platform Fee (18%):</span>
                          <span className="text-rose-600 font-bold">- ₹{(selectedBatch.platform_fee_gst || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-sans">TDS Under Sec 194O (1%):</span>
                          <span className="text-rose-600 font-bold">- ₹{selectedBatch.tds_deducted.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="pt-1.5 border-t border-slate-200 text-[10px] text-slate-500 font-sans">
                          &bull; Platform commission &amp; GST for cash bookings are automatically deducted from the online advance balance before bank transfer.
                        </div>
                      </div>

                      {/* Net Transferred to Bank */}
                      <div className="flex justify-between pt-2 border-t border-slate-200 text-base font-black text-emerald-700">
                        <span className="font-sans">Net Disbursed to Bank</span>
                        <span>₹{selectedBatch.net_payable.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Venue Bank Account Details Card */}
                    <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-3 font-mono text-xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-bold text-slate-900 font-sans flex items-center gap-1.5">
                          <Landmark className="h-4 w-4 text-[#F94001]" />
                          <span>Venue Beneficiary Account</span>
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                          KYC Verified
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Account Holder:</span>
                          <span className="font-bold text-slate-800">{selectedBatch.owner_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Bank Name:</span>
                          <span className="font-bold text-slate-800">{selectedBatch.bank_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Account Number:</span>
                          <span className="font-bold text-slate-800">{selectedBatch.account_number_masked}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">IFSC Code:</span>
                          <span className="font-bold text-slate-800">{selectedBatch.ifsc_code}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-100">
                          <span className="text-slate-500 font-sans">UTR Reference:</span>
                          <span className="font-bold text-[#F94001]">
                            {selectedBatch.utr_number || 'Auto-generated on transfer'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Settlement Timestamp:</span>
                          <span className="text-slate-600">{selectedBatch.settled_at || 'Completed'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: TABLE-BASED ITEMIZED BOOKINGS (REQUESTED BY USER) */}
                {drawerTab === 'bookings' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-[#021526]">
                        Itemized Booking Slots ({selectedBatch.itemized_bookings?.length || selectedBatch.bookings_count} reservations)
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Cycle: {selectedBatch.settlement_date || selectedBatch.period_end}
                      </span>
                    </div>

                    {/* Table-based Itemized Bookings */}
                    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                              <th className="py-2.5 px-3">Booking Ref</th>
                              <th className="py-2.5 px-3">Slot &amp; Court</th>
                              <th className="py-2.5 px-3 text-right">Court Price</th>
                              <th className="py-2.5 px-3 text-right">Online / Cash</th>
                              <th className="py-2.5 px-3 text-right">Deduction</th>
                              <th className="py-2.5 px-3 text-right">Net Share</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                            {(selectedBatch.itemized_bookings || [
                              {
                                booking_code: 'IBS-2603-9001',
                                slot_date: selectedBatch.period_start,
                                slot_time: '06:00 PM - 07:00 PM',
                                court_name: 'Main Football Turf A',
                                sport: 'Football',
                                actual_court_price: 1600,
                                online_advance_paid: 1600,
                                cash_collected_at_venue: 0,
                                payment_mode: 'ONLINE_FULL',
                                platform_fee: 160,
                                platform_fee_gst: 28.8,
                                net_venue_share: 1379.2,
                              },
                              {
                                booking_code: 'IBS-2603-9002',
                                slot_date: selectedBatch.period_start,
                                slot_time: '07:00 PM - 09:00 PM',
                                court_name: 'Box Cricket Pitch 1',
                                sport: 'Cricket',
                                actual_court_price: 2800,
                                online_advance_paid: 1400,
                                cash_collected_at_venue: 1400,
                                payment_mode: 'ONLINE_ADVANCE_PLUS_CASH',
                                platform_fee: 280,
                                platform_fee_gst: 50.4,
                                net_venue_share: 1041.6,
                              },
                              {
                                booking_code: 'IBS-2603-9015',
                                slot_date: selectedBatch.period_start,
                                slot_time: '09:00 PM - 10:00 PM',
                                court_name: 'Main Football Turf A',
                                sport: 'Football',
                                actual_court_price: 1800,
                                online_advance_paid: 900,
                                cash_collected_at_venue: 900,
                                payment_mode: 'ONLINE_ADVANCE_PLUS_CASH',
                                platform_fee: 180,
                                platform_fee_gst: 32.4,
                                net_venue_share: 669.6,
                              },
                            ]).map((item, idx) => {
                              const totalItemDeduction = (item.platform_fee || 0) + (item.platform_fee_gst || 0);
                              return (
                                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                  {/* Booking Ref */}
                                  <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                                    <span className="font-mono font-bold text-[10px] text-[#F94001] bg-[#FFF1EC] px-1.5 py-0.5 rounded border border-[#F94001]/20">
                                      {item.booking_code}
                                    </span>
                                  </td>

                                  {/* Slot & Court */}
                                  <td className="py-2.5 px-3 align-middle font-sans">
                                    <p className="font-semibold text-slate-800 text-[11px] truncate max-w-[150px]">
                                      {item.court_name}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-mono">
                                      {item.slot_time} &bull; <span className="text-[#F94001] font-bold">{item.sport}</span>
                                    </p>
                                  </td>

                                  {/* Court Price */}
                                  <td className="py-2.5 px-3 align-middle text-right font-bold text-slate-900 whitespace-nowrap">
                                    ₹{item.actual_court_price.toLocaleString('en-IN')}
                                  </td>

                                  {/* Online vs Cash */}
                                  <td className="py-2.5 px-3 align-middle text-right whitespace-nowrap">
                                    <p className="text-emerald-700 font-semibold text-[11px]">
                                      Onl: ₹{item.online_advance_paid}
                                    </p>
                                    {item.cash_collected_at_venue > 0 && (
                                      <p className="text-amber-700 text-[10px]">
                                        Cash: ₹{item.cash_collected_at_venue}
                                      </p>
                                    )}
                                  </td>

                                  {/* Deduction */}
                                  <td className="py-2.5 px-3 align-middle text-right text-rose-600 font-medium whitespace-nowrap">
                                    - ₹{totalItemDeduction.toFixed(1)}
                                  </td>

                                  {/* Net Share */}
                                  <td className="py-2.5 px-3 align-middle text-right font-bold text-emerald-700 whitespace-nowrap">
                                    ₹{item.net_venue_share.toLocaleString('en-IN')}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: PERFECT OFFICIAL PAYSLIP (PAYOUT ADVICE VOUCHER) */}
                {drawerTab === 'slip' && (
                  <div className="space-y-4">
                    {/* Printable Payslip Card */}
                    <div className="p-6 rounded-2xl bg-white border border-slate-300 shadow-sm space-y-5" id="payout-advice-slip">
                      {/* Payslip Header */}
                      <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-[#F94001] text-white flex items-center justify-center font-black text-sm">
                              iB
                            </div>
                            <div>
                              <span className="font-black text-base text-[#021526] tracking-tight">
                                iBookSports Technologies Private Limited
                              </span>
                              <p className="text-[10px] text-slate-500 font-mono">
                                Partner Settlement &amp; Disbursal Advice
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-xs font-bold text-[#021526] block">{selectedBatch.batch_number}</span>
                          <span className="text-[10px] text-slate-500">Date: {selectedBatch.settlement_date || '08 Mar 2026'}</span>
                        </div>
                      </div>

                      {/* Beneficiary & Venue Info */}
                      <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Beneficiary Venue Partner
                          </span>
                          <p className="font-bold text-slate-900 text-xs mt-0.5">{selectedBatch.venue_name}</p>
                          <p className="text-slate-600 text-[11px] mt-0.5">Account Holder: {selectedBatch.owner_name}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Bank Account Details
                          </span>
                          <p className="font-mono text-slate-900 text-xs mt-0.5">{selectedBatch.bank_name}</p>
                          <p className="font-mono text-slate-600 text-[11px] mt-0.5">
                            A/C: {selectedBatch.account_number_masked} &bull; IFSC: {selectedBatch.ifsc_code}
                          </p>
                        </div>
                      </div>

                      {/* Itemized Financial Breakdown Table */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Disbursal Computation Statement
                        </span>
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 font-mono text-xs">
                          <div className="flex justify-between text-slate-800 font-bold">
                            <span className="font-sans">1. Actual Court Playtime Cost:</span>
                            <span>₹{(selectedBatch.actual_court_price_total || selectedBatch.gross_booking_amount).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-emerald-700">
                            <span className="font-sans">2. Online Advance Held by Platform:</span>
                            <span>+ ₹{(selectedBatch.online_advance_held || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-amber-700">
                            <span className="font-sans">3. Cash Collected Directly at Venue:</span>
                            <span>+ ₹{(selectedBatch.cash_collected_at_venue || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-rose-600">
                            <span className="font-sans">4. Less: Platform Fee (10% on Court Value):</span>
                            <span>- ₹{selectedBatch.platform_commission_deducted.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-rose-600">
                            <span className="font-sans">5. Less: GST on Platform Fee (18%):</span>
                            <span>- ₹{(selectedBatch.platform_fee_gst || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-rose-600">
                            <span className="font-sans">6. Less: TDS Under Section 194O (1%):</span>
                            <span>- ₹{selectedBatch.tds_deducted.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-slate-300 font-black text-sm text-emerald-700">
                            <span className="font-sans">Net Disbursed via Bank IMPS:</span>
                            <span>₹{selectedBatch.net_payable.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>

                      {/* UTR Reference & Official Seal */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between font-mono">
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-sans">Bank Transfer UTR</span>
                          <span className="font-bold text-slate-900">{selectedBatch.utr_number || 'HDFCR20260308912048'}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 block text-[9px] uppercase font-sans">Status</span>
                          <span className="font-bold text-emerald-700 font-sans">Disbursed &amp; Reconciled</span>
                        </div>
                      </div>

                      {/* Legal Footer */}
                      <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span>Digitally verified payment voucher &bull; No physical signature required</span>
                        <span className="font-mono font-bold text-slate-500">iBookSports Finance Core</span>
                      </div>
                    </div>

                    {/* Payslip Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handlePrintAdviceSlip}
                        className="flex-1 py-2.5 rounded-xl bg-[#021526] hover:bg-[#F94001] text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                      >
                        <Printer className="h-4 w-4" />
                        <span>Print Settlement Advice Slip</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          showToast('success', 'PDF Downloaded', `Settlement advice for ${selectedBatch.batch_number} saved.`);
                        }}
                        className="flex-1 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Download className="h-4 w-4 text-slate-500" />
                        <span>Download PDF</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* DRAWER FOOTER */}
              <div className="p-4 bg-slate-50 border-t border-[#E5E7EB] flex items-center justify-between shrink-0">
                <span className="text-xs text-slate-500 font-medium">
                  {selectedBatch.status === 'SETTLED' ? 'Completed Disbursal' : 'Processing Settlement'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedBatch(null)}
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
