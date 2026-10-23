'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  ChevronLeft,
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
  SettlementBatchItem,
  SettlementBookingItem,
} from '@/lib/mockData';
import { apiClient } from '@/lib/api';
import { formatInr, settlementDeduction } from '@/lib/settlementFees';

export default function SettlementManagementPage() {
  const [settlements, setSettlements] = useState<SettlementBatchItem[]>([]);

  const loadSettlements = useCallback(async (): Promise<SettlementBatchItem[]> => {
    let list: SettlementBatchItem[] = [];
    try {
      const res = await apiClient.get('/payments/settlements');
      if (res.data?.data && Array.isArray(res.data.data)) {
        list = res.data.data;
      } else if (Array.isArray(res.data)) {
        list = res.data;
      }
    } catch {
      list = [];
    }
    setSettlements(list);
    return list;
  }, []);

  useEffect(() => {
    loadSettlements();
  }, [loadSettlements]);

  // Bank UTR typed per batch in the drawer, and a lock while a settlement action is running
  const [utrInputs, setUtrInputs] = useState<Record<string, string>>({});
  const [actionBusy, setActionBusy] = useState(false);
  // "Link Razorpay account": an account made in the Razorpay dashboard (Route → Accounts) for the open batch's venue
  const [linkAccountId, setLinkAccountId] = useState('');
  const [linkBankConfirmed, setLinkBankConfirmed] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Date & Month Filter in Top Right Corner (User Requirement)
  const [filterType, setFilterType] = useState<'ALL' | 'DATE' | 'MONTH'>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD

  const [selectedMonth, setSelectedMonth] = useState<string>(''); // YYYY-MM

  // Slide-out Drawer (Slide Bar) State
  const [selectedBatch, setSelectedBatch] = useState<SettlementBatchItem | null>(null);
  // A typed account id belongs to one venue: clear it whenever another batch is opened
  const selectedVenueId = selectedBatch?.venue_id;
  useEffect(() => {
    setLinkAccountId('');
    setLinkBankConfirmed(false);
  }, [selectedVenueId]);
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
    () => dateOrMonthFilteredSettlements.reduce((acc, s) => acc + s.actual_court_price_total, 0),
    [dateOrMonthFilteredSettlements]
  );
  const totalSettledToBanks = useMemo(
    () => dateOrMonthFilteredSettlements.filter((s) => s.status === 'SETTLED').reduce((acc, s) => acc + s.actual_owner_payout, 0),
    [dateOrMonthFilteredSettlements]
  );
  const totalOnlineAdvanceHeld = useMemo(
    () => dateOrMonthFilteredSettlements.reduce((acc, s) => acc + (s.online_amount || 0), 0),
    [dateOrMonthFilteredSettlements]
  );
  const totalCashCollectedAtVenue = useMemo(
    () => dateOrMonthFilteredSettlements.reduce((acc, s) => acc + (s.cash_amount || 0), 0),
    [dateOrMonthFilteredSettlements]
  );
  const totalDeductions = useMemo(
    () => Math.round(dateOrMonthFilteredSettlements.reduce((acc, s) => acc + settlementDeduction(s), 0) * 100) / 100,
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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalItems = filteredSettlements.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedSettlements = useMemo(() => {
    return filteredSettlements.slice(startIndex, startIndex + pageSize);
  }, [filteredSettlements, startIndex, pageSize]);

  // Reset page when filter inputs change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, selectedDate, selectedMonth, statusFilter, searchQuery]);

  const handlePrintAdviceSlip = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Records the bank transfer the admin made for a batch. The UTR comes from the bank / Razorpay dashboard;
  // a live (not yet batched) row is turned into a batch by the backend first.
  const handleMarkPaid = async (batch: SettlementBatchItem) => {
    if (batch.status === 'SETTLED') {
      showToast('info', 'Already Settled', `Batch ${batch.batch_number} has already been settled via UTR ${batch.utr_number}.`);
      return;
    }
    const utr = (utrInputs[batch.id] || '').trim();
    // A cash-only batch has nothing to transfer and closes without a UTR
    if ((utr || batch.actual_owner_payout > 0) && !/^[A-Za-z0-9]{6,30}$/.test(utr)) {
      showToast('error', 'Bank UTR Required', 'Enter the UTR / reference number of the bank transfer (6–30 letters or digits).');
      return;
    }
    setActionBusy(true);
    try {
      const res = await apiClient.post(`/payments/settlements/${encodeURIComponent(batch.id)}/mark-settled`, utr ? { utrNumber: utr } : {});
      const settled = res.data?.data;
      showToast(
        'success',
        'Settlement Marked as Paid',
        `₹${formatInr(settled?.netPayoutAmount ?? batch.actual_owner_payout)} to ${batch.bank_name} (${batch.account_number_masked}) · UTR: ${utr}`
      );
      setUtrInputs((prev) => ({ ...prev, [batch.id]: '' }));
      setSelectedBatch(null);
      await loadSettlements();
    } catch (e) {
      showToast('error', 'Could Not Mark as Paid', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setActionBusy(false);
    }
  };

  // Runs a settlement action against the backend, then reloads the list
  const runBatchAction = async (
    request: () => Promise<{ data?: { message?: string } }>,
    success: { title: string; description: string },
    failureTitle: string,
    closeDrawer = true
  ) => {
    setActionBusy(true);
    try {
      const res = await request();
      showToast('success', success.title, res.data?.message || success.description);
      if (closeDrawer) setSelectedBatch(null);
      const list = await loadSettlements();
      if (!closeDrawer) setSelectedBatch((prev) => list.find((b) => b.id === prev?.id) ?? prev);
    } catch (e) {
      showToast('error', failureTitle, e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setActionBusy(false);
    }
  };

  // One Razorpay Route direct transfer of the batch's net amount to the venue's linked account
  const handlePayViaRoute = (batch: SettlementBatchItem) =>
    runBatchAction(
      () => apiClient.post(`/payments/settlements/${encodeURIComponent(batch.id)}/pay-route`, {}),
      { title: 'Razorpay Transfer Started', description: `₹${formatInr(batch.actual_owner_payout)} to ${batch.venue_name}` },
      'Razorpay Transfer Failed'
    );

  const handleRefreshTransfer = (batch: SettlementBatchItem) =>
    runBatchAction(
      () => apiClient.post(`/payments/settlements/${encodeURIComponent(batch.id)}/refresh-transfer`, {}),
      { title: 'Transfer Status Updated', description: batch.batch_number },
      'Could Not Read Transfer'
    );

  const handleReleaseTransfer = (batch: SettlementBatchItem) => {
    if (
      typeof window !== 'undefined' &&
      !window.confirm('Only release this batch if the Razorpay dashboard shows NO transfer for it. Release now?')
    ) {
      return;
    }
    return runBatchAction(
      () => apiClient.post(`/payments/settlements/${encodeURIComponent(batch.id)}/release-transfer`, {}),
      { title: 'Batch Released', description: `${batch.batch_number} can be paid again.` },
      'Could Not Release Batch'
    );
  };

  // Creates (or resumes) the venue's Razorpay linked account from its approved onboarding bank + PAN details
  const handleSetupLinkedAccount = (batch: SettlementBatchItem, refreshOnly: boolean) =>
    runBatchAction(
      () =>
        apiClient.post(
          `/payments/linked-accounts/${encodeURIComponent(batch.venue_id)}${refreshOnly ? '/refresh' : ''}`,
          {}
        ),
      { title: 'Linked Account Updated', description: batch.venue_name },
      'Linked Account Setup Failed',
      false
    );

  // Links a Razorpay dashboard-made account; the server accepts it only if Razorpay reports it activated
  const handleLinkAccount = async (batch: SettlementBatchItem) => {
    await runBatchAction(
      () =>
        apiClient.post(`/payments/linked-accounts/${encodeURIComponent(batch.venue_id)}/link`, {
          accountId: linkAccountId.trim(),
          bankConfirmed: linkBankConfirmed,
        }),
      { title: 'Razorpay Account Linked', description: `${linkAccountId.trim()} is now the payout account of ${batch.venue_name}` },
      'Could Not Link Account',
      false
    );
    setLinkAccountId('');
    setLinkBankConfirmed(false);
  };

  // Cancels a stored PENDING batch; its bookings go back to unsettled for the next batch
  const handleCancelBatch = async (batch: SettlementBatchItem) => {
    if (typeof window !== 'undefined' && !window.confirm(`Cancel batch ${batch.batch_number}? Its bookings will be settled in a later batch.`)) {
      return;
    }
    setActionBusy(true);
    try {
      await apiClient.post(`/payments/settlements/${encodeURIComponent(batch.id)}/cancel`, {});
      showToast('info', 'Batch Cancelled', `${batch.batch_number} cancelled. Its bookings are unsettled again.`);
      setSelectedBatch(null);
      await loadSettlements();
    } catch (e) {
      showToast('error', 'Could Not Cancel Batch', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setActionBusy(false);
    }
  };

  // Creates one PENDING batch per venue from bookings payable now (T+2 after match day, not yet in a batch)
  const handleGenerateTPlus2Batch = async () => {
    setActionBusy(true);
    try {
      const res = await apiClient.post('/payments/settlements/generate-batch', {});
      const created = Number(res.data?.total || 0);
      showToast(
        created ? 'success' : 'info',
        created ? 'T+2 Settlement Batches Created' : 'Nothing to Settle',
        res.data?.message || ''
      );
      await loadSettlements();
    } catch (e) {
      showToast('error', 'Could Not Create Batches', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setActionBusy(false);
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
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#021526] font-display">
            Settlement Management
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6368] mt-1 font-medium">
            Automated T+2 settlement cycles. On money collected online: venue convenience fee 0.1737% + GST, then Razorpay Route fee 0.25% + GST on the routed amount.
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${filterType === 'ALL'
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${filterType === 'DATE'
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${filterType === 'MONTH'
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
                    // cycle_month must be a valid YYYY-MM string before formatting it.
                    // Avoid calling split() here so an unexpected API value can never
                    // cause an undefined.split() production crash.
                    if (typeof m !== 'string' || !/^\d{4}-\d{2}$/.test(m)) {
                      return null;
                    }

                    const year = Number(m.slice(0, 4));
                    const month = Number(m.slice(5, 7));

                    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
                      return null;
                    }

                    const dateObj = new Date(year, month - 1, 1);
                    const label = isNaN(dateObj.getTime())
                      ? m
                      : dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
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

          {/* Run T+2 Settlement Button */}
          <button
            type="button"
            onClick={handleGenerateTPlus2Batch}
            disabled={actionBusy}
            className="inline-flex items-center gap-2 rounded-xl bg-[#021526] hover:bg-[#F94001] text-white px-3.5 py-2 text-xs font-bold shadow-xs transition-all cursor-pointer h-[42px] disabled:opacity-60 disabled:cursor-wait"
            title="Create settlement batches from bookings whose match day was at least 2 days ago"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Run T+2 Settlement</span>
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
              ₹{formatInr(totalSettledToBanks)}
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
              ₹{formatInr(totalDeductions)}
            </span>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              ≈0.5% of online
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
                <th className="py-3 px-3 w-[5%] text-center">#</th>
                <th className="py-3 px-3 w-[13%]">Settlement ID</th>
                <th className="py-3 px-3 w-[20%]">Venue &amp; Bank Account</th>
                <th className="py-3 px-3 w-[11%]">Cycle Date</th>
                <th className="py-3 px-3 w-[10%]">Court Price</th>
                <th className="py-3 px-3 w-[13%]">Online &amp; Cash Split</th>
                <th className="py-3 px-3 w-[12%]">Deductions (≈0.5%)</th>
                <th className="py-3 px-3 w-[10%]">Net Payout &amp; Status</th>
                <th className="py-3 px-3 text-left w-[6%]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSettlements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-400">
                    <Receipt className="h-9 w-9 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-sm text-[#021526]">No settlement batches found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Try adjusting your date picker, month filter, or search query
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedSettlements.map((s, index) => {
                  const isCopied = copiedText === s.batch_number;
                  const courtPrice = s.actual_court_price_total;
                  const totalDeduction = settlementDeduction(s);

                  return (
                    <tr
                      key={s.id}
                      onClick={() => {
                        setSelectedBatch(s);
                        setDrawerTab('summary');
                      }}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    >
                      {/* 0. SERIAL NUMBER */}
                      <td className="py-3 px-3 align-middle text-center font-mono text-[11px] font-bold text-slate-400">
                        {startIndex + index + 1}
                      </td>

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
                            <span>₹{(s.online_amount || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex items-center justify-between text-amber-700 font-semibold gap-1 text-[11px]">
                            <span className="text-[10px] font-sans text-slate-500 font-normal">Cash:</span>
                            <span>₹{(s.cash_amount || 0).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </td>

                      {/* 6. DEDUCTIONS (PLATFORM FEE & GST) */}
                      <td className="py-3 px-3 align-middle whitespace-nowrap font-mono">
                        <div className="space-y-0.5">
                          <p className="font-bold text-rose-600 text-xs">
                            - ₹{formatInr(totalDeduction)}
                          </p>
                          <p className="text-[10px] text-slate-400 font-sans truncate">
                            Platform ₹{formatInr(s.venue_convenience)} &bull; Route ₹{formatInr(s.razorpay_route)}
                          </p>
                        </div>
                      </td>

                      {/* 7. NET PAYOUT & STATUS */}
                      <td className="py-3 px-3 align-middle whitespace-nowrap">
                        <div className="space-y-1 font-mono">
                          <div>
                            <span className="font-black text-sm text-emerald-700 block leading-tight">
                              ₹{formatInr(s.actual_owner_payout)}
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

                      {/* 8. ACTION (EYE ICON BUTTON) */}
                      <td className="py-3 px-3 align-middle text-left whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBatch(s);
                              setDrawerTab('summary');
                            }}
                            className="h-7.5 w-7.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-[#F94001] hover:border-[#F94001]/40 hover:bg-[#FFF1EC] transition-all inline-flex items-center justify-center cursor-pointer shadow-2xs"
                            title="View Settlement Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {s.status !== 'SETTLED' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBatch(s);
                                setDrawerTab('summary');
                              }}
                              className="px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                              title="Record the bank transfer for this settlement"
                            >
                              <CreditCard className="h-3 w-3" />
                              <span>Pay</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3.5 border-t border-slate-200/90 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong className="text-slate-900">{totalItems === 0 ? 0 : startIndex + 1}</strong> to{' '}
              <strong className="text-slate-900">
                {Math.min(startIndex + pageSize, totalItems)}
              </strong>{' '}
              of <strong className="text-slate-900">{totalItems}</strong> settlements
            </span>
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <span className="text-[11px] text-slate-500">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none cursor-pointer hover:border-slate-300"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Prev</span>
            </button>
            <span className="px-2 text-xs font-bold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
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
                        <span>{selectedBatch.status === 'PROCESSING' ? 'Processing' : 'Pending'}</span>
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
                        className={`px-3 py-1.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${isActive
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
                        <span>₹{selectedBatch.actual_court_price_total.toLocaleString('en-IN')}</span>
                      </div>

                      {/* 2. Online Advance Held */}
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span className="font-sans">Online Advance Held by Platform</span>
                        <span>+ ₹{(selectedBatch.online_amount || 0).toLocaleString('en-IN')}</span>
                      </div>

                      {/* 3. Cash Collected at Venue Desk */}
                      <div className="flex justify-between text-amber-700 font-semibold">
                        <span className="font-sans">Cash Directly Collected by Venue Owner</span>
                        <span>+ ₹{(selectedBatch.cash_amount || 0).toLocaleString('en-IN')}</span>
                      </div>

                      {/* Deductions breakdown */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-[11px] text-slate-600">
                        <div className="flex justify-between">
                          <span className="font-sans">Venue Convenience Fee (0.1737% of online):</span>
                          <span className="text-rose-600 font-bold">- ₹{formatInr(selectedBatch.venue_convenience_fee)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-sans">GST on Venue Convenience Fee (18%):</span>
                          <span className="text-rose-600 font-bold">- ₹{formatInr(selectedBatch.venue_convenience_fee_gst)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-slate-700">
                          <span className="font-sans">Amount Routed to Vendor (online − fee − GST):</span>
                          <span>₹{formatInr(selectedBatch.route_amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-sans">Razorpay Route Fee (0.25% of routed amount):</span>
                          <span className="text-rose-600 font-bold">- ₹{formatInr(selectedBatch.route_fee)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-sans">GST on Route Fee (18%):</span>
                          <span className="text-rose-600 font-bold">- ₹{formatInr(selectedBatch.route_fee_gst)}</span>
                        </div>
                        <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold text-slate-700">
                          <span className="font-sans">Total Deduction (≈0.5% of online)</span>
                          <span className="text-rose-600">- ₹{formatInr(settlementDeduction(selectedBatch))}</span>
                        </div>
                        <div className="pt-1.5 border-t border-slate-200 text-[10px] text-slate-500 font-sans">
                          &bull; Fees apply only to money collected online through Razorpay. Cash collected at the venue carries no fee.
                        </div>
                      </div>

                      {/* Net Transferred to Bank */}
                      <div className="flex justify-between pt-2 border-t border-slate-200 text-base font-black text-emerald-700">
                        <span className="font-sans">Net Disbursed to Bank</span>
                        <span>₹{formatInr(selectedBatch.actual_owner_payout)}</span>
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
                            {(selectedBatch.itemized_bookings || []).map((item, idx) => {
                              const totalItemDeduction = settlementDeduction(item);
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
                                      Onl: ₹{item.online_amount}
                                    </p>
                                    {item.cash_amount > 0 && (
                                      <p
                                        className={`text-[10px] ${item.payment_mode === 'UNVERIFIED_ONLINE' ? 'text-rose-600 font-semibold' : 'text-amber-700'}`}
                                        title={item.payment_mode === 'UNVERIFIED_ONLINE' ? 'Marked paid online, but no Razorpay payment exists. Not paid out.' : undefined}
                                      >
                                        {item.payment_mode === 'UNVERIFIED_ONLINE' ? 'Unverified online' : 'Cash'}: ₹{item.cash_amount}
                                      </p>
                                    )}
                                  </td>

                                  {/* Deduction */}
                                  <td className="py-2.5 px-3 align-middle text-right text-rose-600 font-medium whitespace-nowrap">
                                    - ₹{formatInr(totalItemDeduction)}
                                  </td>

                                  {/* Net Share */}
                                  <td className="py-2.5 px-3 align-middle text-right font-bold text-emerald-700 whitespace-nowrap">
                                    ₹{formatInr(item.actual_owner_payout)}
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
                          <span className="text-[10px] text-slate-500">Date: {selectedBatch.settlement_date || '—'}</span>
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
                            <span>₹{selectedBatch.actual_court_price_total.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-emerald-700">
                            <span className="font-sans">2. Online Advance Held by Platform:</span>
                            <span>+ ₹{(selectedBatch.online_amount || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-amber-700">
                            <span className="font-sans">3. Cash Collected Directly at Venue:</span>
                            <span>+ ₹{(selectedBatch.cash_amount || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-rose-600">
                            <span className="font-sans">4. Less: Venue Convenience Fee (0.1737% of online):</span>
                            <span>- ₹{formatInr(selectedBatch.venue_convenience_fee)}</span>
                          </div>
                          <div className="flex justify-between text-rose-600">
                            <span className="font-sans">5. Less: GST on Venue Convenience Fee (18%):</span>
                            <span>- ₹{formatInr(selectedBatch.venue_convenience_fee_gst)}</span>
                          </div>
                          <div className="flex justify-between text-rose-600">
                            <span className="font-sans">6. Less: Razorpay Route Fee (0.25% of routed amount):</span>
                            <span>- ₹{formatInr(selectedBatch.route_fee)}</span>
                          </div>
                          <div className="flex justify-between text-rose-600">
                            <span className="font-sans">7. Less: GST on Route Fee (18%):</span>
                            <span>- ₹{formatInr(selectedBatch.route_fee_gst)}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-slate-300 font-black text-sm text-emerald-700">
                            <span className="font-sans">Net Disbursed via Bank IMPS:</span>
                            <span>₹{formatInr(selectedBatch.actual_owner_payout)}</span>
                          </div>
                        </div>
                      </div>

                      {/* UTR Reference & Official Seal */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between font-mono">
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-sans">Bank Transfer UTR</span>
                          <span className="font-bold text-slate-900">{selectedBatch.utr_number || '—'}</span>
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
                        onClick={async () => {
                          try {
                            const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
                            const targetVenueId = selectedBatch.venue_id || selectedBatch.id;
                            let adminToken = '';
                            try {
                              const adminAuth = JSON.parse(localStorage.getItem('ibooksports_admin_auth') || '{}');
                              adminToken = adminAuth?.accessToken || adminAuth?.token || '';
                            } catch { }
                            const res = await fetch(`${backendUrl}/onboarding/applications/${encodeURIComponent(targetVenueId)}/pdf`, {
                              headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : undefined,
                            });
                            if (res.ok) {
                              const blob = await res.blob();
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `Settlement_Advice_${selectedBatch.batch_number}.pdf`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              URL.revokeObjectURL(url);
                              showToast('success', 'PDF Downloaded', `Settlement advice for ${selectedBatch.batch_number} saved.`);
                              return;
                            }
                          } catch (e) {
                            console.warn('Backend PDF download error:', e);
                          }
                          handlePrintAdviceSlip();
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

              {/* RAZORPAY ROUTE: venue linked account + last transfer problem */}
              {(() => {
                const linked = selectedBatch.linked_account;
                const status = linked?.status || 'NOT_STARTED';
                const awaitingRazorpay = !!linked?.account_id && ['IN_PROGRESS', 'UNDER_REVIEW', 'NEEDS_CLARIFICATION'].includes(status);
                const statusTone =
                  status === 'ACTIVATED'
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : status === 'FAILED' || status === 'SUSPENDED'
                      ? 'text-rose-700 bg-rose-50 border-rose-200'
                      : 'text-amber-700 bg-amber-50 border-amber-200';
                return (
                  <div className="px-4 py-3 border-t border-[#E5E7EB] bg-white space-y-2 text-xs shrink-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Razorpay Linked Account</span>
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusTone}`}>
                          {status.replace(/_/g, ' ')}
                        </span>
                        {linked?.account_id && <span className="font-mono text-[10px] text-slate-500">{linked.account_id}</span>}
                      </div>
                      {status !== 'ACTIVATED' && (
                        <button
                          type="button"
                          disabled={actionBusy}
                          onClick={() => handleSetupLinkedAccount(selectedBatch, awaitingRazorpay)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-60"
                        >
                          {awaitingRazorpay ? 'Check Status' : status === 'NOT_STARTED' ? 'Create Linked Account' : 'Retry Setup'}
                        </button>
                      )}
                    </div>
                    {linked?.last_error && <p className="text-rose-600 text-[11px]">{linked.last_error}</p>}
                    {status !== 'ACTIVATED' && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 space-y-2">
                        <p className="text-[11px] font-bold text-slate-700">
                          Link an account made in the Razorpay dashboard{' '}
                          <span className="font-normal text-slate-500">(Route → Accounts → Add Account, KYC form submitted)</span>
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            value={linkAccountId}
                            onChange={(e) => setLinkAccountId(e.target.value)}
                            placeholder="acc_XXXXXXXXXXXXXX"
                            aria-label="Razorpay account id"
                            className="h-8 w-48 rounded-lg border border-slate-300 bg-white px-2.5 text-[11px] font-mono text-slate-800 focus:outline-none focus:border-[#F94001]"
                          />
                          <button
                            type="button"
                            disabled={actionBusy || !linkAccountId.trim() || !linkBankConfirmed}
                            onClick={() => handleLinkAccount(selectedBatch)}
                            className="px-3 py-1.5 rounded-lg bg-[#021526] hover:bg-[#F94001] text-white text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Link Account
                          </button>
                        </div>
                        <label className="flex items-start gap-2 text-[11px] text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={linkBankConfirmed}
                            onChange={(e) => setLinkBankConfirmed(e.target.checked)}
                            className="mt-0.5"
                          />
                          <span>
                            I checked that this Razorpay account&apos;s bank details are the venue&apos;s approved bank account:{' '}
                            <strong className="font-mono text-slate-800">
                              {selectedBatch.owner_name} · {selectedBatch.account_number_masked} · {selectedBatch.ifsc_code}
                            </strong>
                          </span>
                        </label>
                        <p className="text-[10px] text-slate-500">Only an account Razorpay shows as Activated is accepted.</p>
                      </div>
                    )}
                    {selectedBatch.failure_reason && (
                      <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 text-[11px]">
                        {selectedBatch.failure_reason}
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* DRAWER FOOTER */}
              <div className="p-4 bg-slate-50 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2 shrink-0">
                <span className="text-xs text-slate-500 font-medium">
                  {selectedBatch.status === 'SETTLED'
                    ? selectedBatch.transfer_id
                      ? `Transferred via Razorpay · ${selectedBatch.transfer_id}`
                      : 'Completed Disbursal'
                    : selectedBatch.status === 'PROCESSING'
                      ? `Razorpay transfer ${selectedBatch.transfer_id || '(unconfirmed)'} · ${selectedBatch.transfer_status || 'processing'}`
                      : selectedBatch.is_live
                        ? 'Payable now · not in a batch yet'
                        : 'Awaiting payout'}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedBatch.status === 'PROCESSING' && (
                    <>
                      <button
                        type="button"
                        disabled={actionBusy}
                        onClick={() => handleRefreshTransfer(selectedBatch)}
                        className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
                      >
                        Refresh Transfer Status
                      </button>
                      {selectedBatch.transfer_status === 'partial' && (
                        <button
                          type="button"
                          disabled={actionBusy || selectedBatch.linked_account?.status !== 'ACTIVATED'}
                          onClick={() => handlePayViaRoute(selectedBatch)}
                          title="Sends only the shares that were not transferred yet"
                          className="px-4 py-2 rounded-xl bg-[#021526] hover:bg-[#F94001] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CreditCard className="h-4 w-4" />
                          <span>Pay the Rest via Razorpay</span>
                        </button>
                      )}
                      {(!selectedBatch.transfer_id || selectedBatch.transfer_status === 'unknown') && (
                        <button
                          type="button"
                          disabled={actionBusy}
                          onClick={() => handleReleaseTransfer(selectedBatch)}
                          className="px-4 py-2 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
                        >
                          Release Batch
                        </button>
                      )}
                    </>
                  )}
                  {selectedBatch.status === 'PENDING_APPROVAL' && selectedBatch.actual_owner_payout > 0 && (
                    <button
                      type="button"
                      disabled={actionBusy || selectedBatch.linked_account?.status !== 'ACTIVATED'}
                      onClick={() => handlePayViaRoute(selectedBatch)}
                      title={
                        selectedBatch.linked_account?.status === 'ACTIVATED'
                          ? 'Razorpay Route transfers from the customers\' payments to the venue\'s linked account'
                          : 'The venue\'s Razorpay linked account must be activated first'
                      }
                      className="px-4 py-2 rounded-xl bg-[#021526] hover:bg-[#F94001] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Pay via Razorpay (₹{formatInr(selectedBatch.actual_owner_payout)})</span>
                    </button>
                  )}
                  {selectedBatch.status === 'PENDING_APPROVAL' && (
                    <>
                      <input
                        type="text"
                        value={utrInputs[selectedBatch.id] || ''}
                        onChange={(e) => setUtrInputs((prev) => ({ ...prev, [selectedBatch.id]: e.target.value }))}
                        placeholder={selectedBatch.actual_owner_payout > 0 ? 'Paid outside? Bank UTR' : 'UTR (not needed)'}
                        aria-label="Bank transfer UTR / reference number"
                        className="h-9 w-44 rounded-xl border border-slate-300 bg-white px-3 text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        disabled={actionBusy}
                        onClick={() => handleMarkPaid(selectedBatch)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-60 disabled:cursor-wait"
                      >
                        <CreditCard className="h-4 w-4" />
                        <span>Mark Paid Manually</span>
                      </button>
                      {!selectedBatch.is_live && (
                        <button
                          type="button"
                          disabled={actionBusy}
                          onClick={() => handleCancelBatch(selectedBatch)}
                          className="px-4 py-2 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
                        >
                          Cancel Batch
                        </button>
                      )}
                    </>
                  )}
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
        </div>
      )}
    </div>
  );
}
