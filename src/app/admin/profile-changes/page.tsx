'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock, Eye, Inbox, RefreshCw, UserCog, XCircle } from 'lucide-react';
import { apiClient, onboardingApi } from '@/lib/api';

type ChangeStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

interface ProfileChangeRequest {
  id: string;
  request_number: string;
  venue_id: string;
  venue_name: string;
  partner_name: string;
  partner_mobile: string;
  section: 'OWNER' | 'BUSINESS' | 'BANK';
  section_label: string;
  changes: Record<string, { from: string | boolean | null; to: string | boolean }>;
  vendor_note?: string;
  status: ChangeStatus;
  admin_note?: string;
  reviewed_at?: string;
  created_at?: string;
}

const STATUS_FILTERS: { id: ChangeStatus | 'ALL'; label: string }[] = [
  { id: 'PENDING', label: 'Pending' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'ALL', label: 'All' },
];

const STATUS_TONE: Record<ChangeStatus, string> = {
  PENDING: 'text-amber-700 bg-amber-50 border-amber-200',
  APPROVED: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  REJECTED: 'text-rose-700 bg-rose-50 border-rose-200',
  CANCELLED: 'text-slate-600 bg-slate-50 border-slate-200',
};

const fieldLabel = (field: string) =>
  field
    .replace(/_document_id$/, ' document')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const isDocField = (field: string) => field.endsWith('_document_id');

const showValue = (value: string | boolean | null) =>
  value === null || value === '' ? '—' : typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);

export default function ProfileChangesPage() {
  const [status, setStatus] = useState<ChangeStatus | 'ALL'>('PENDING');
  const [requests, setRequests] = useState<ProfileChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/onboarding/admin/profile-change-requests', { params: { status } });
      setRequests(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) {
      setRequests([]);
      setMessage({ tone: 'error', text: e instanceof Error ? e.message : 'Could not load change requests' });
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (request: ProfileChangeRequest, action: 'approve' | 'reject') => {
    const note = (notes[request.id] || '').trim();
    if (action === 'reject' && !note) {
      setMessage({ tone: 'error', text: `Write the reason for rejecting ${request.request_number} so the vendor knows what to fix.` });
      return;
    }
    setBusyId(request.id);
    try {
      await apiClient.post(`/onboarding/admin/profile-change-requests/${encodeURIComponent(request.id)}/${action}`, { note });
      setMessage({
        tone: 'success',
        text:
          action === 'approve'
            ? `${request.request_number} approved — ${request.venue_name}'s ${request.section_label} are updated${request.section === 'BANK' ? ' and sent to Razorpay' : ''}.`
            : `${request.request_number} rejected. The vendor was notified.`,
      });
      await load();
    } catch (e) {
      setMessage({ tone: 'error', text: e instanceof Error ? e.message : 'Action failed' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#021526] tracking-tight font-display">
            Profile Change Requests
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6368] mt-1 font-medium">
            Vendors edit contact details themselves. Owner, business / GST and bank / PAN changes wait here for approval.
            Approved bank changes are sent to the venue&apos;s Razorpay account.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#CBD5E1] text-[#021526] hover:bg-slate-50 px-3.5 py-2 text-xs font-bold shadow-xs cursor-pointer h-[38px] shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setStatus(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
              status === f.id ? 'bg-[#021526] text-white border-[#021526]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {message && (
        <div
          className={`px-4 py-2.5 rounded-xl border text-xs font-medium flex items-start justify-between gap-3 ${
            message.tone === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} className="font-bold cursor-pointer" aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      {!loading && requests.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] py-14 text-center">
          <Inbox className="h-9 w-9 mx-auto text-slate-300 mb-2" />
          <p className="font-bold text-sm text-[#021526]">No {status === 'ALL' ? '' : status.toLowerCase()} change requests</p>
        </div>
      )}

      <div className="space-y-4">
        {requests.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-bold text-[11px] text-[#F94001] bg-[#FFF1EC] px-1.5 py-0.5 rounded border border-[#F94001]/20">
                  {r.request_number}
                </span>
                <span className="font-bold text-sm text-[#021526]">{r.venue_name}</span>
                <span className="text-[11px] text-slate-500">
                  {r.partner_name} · {r.partner_mobile} · {r.venue_id}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{r.section_label}</span>
                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${STATUS_TONE[r.status]}`}>{r.status}</span>
              </div>
            </div>

            <div className="px-4 py-3 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[480px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    <th className="py-1.5 pr-3 w-[28%]">Field</th>
                    <th className="py-1.5 pr-3">Current</th>
                    <th className="py-1.5">Requested</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(r.changes).map(([field, change]) => (
                    <tr key={field}>
                      <td className="py-2 pr-3 font-semibold text-slate-700">{fieldLabel(field)}</td>
                      {isDocField(field) ? (
                        <>
                          <td className="py-2 pr-3">
                            {change.from ? (
                              <a href={onboardingApi.getDocumentUrl(String(change.from))} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-slate-500 hover:text-[#F94001]">
                                <Eye className="h-3.5 w-3.5" /> Current file
                              </a>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-2">
                            <a href={onboardingApi.getDocumentUrl(String(change.to))} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-[#021526] hover:text-[#F94001]">
                              <Eye className="h-3.5 w-3.5 text-[#F94001]" /> View new document
                            </a>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-2 pr-3 font-mono text-slate-500 line-through decoration-slate-300">{showValue(change.from)}</td>
                          <td className="py-2 font-mono font-bold text-[#021526]">{showValue(change.to)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {r.vendor_note && <p className="mt-2 text-[11px] text-slate-600">Vendor note: {r.vendor_note}</p>}
              {r.admin_note && r.status !== 'PENDING' && (
                <p className="mt-1 text-[11px] text-slate-600">Admin note: {r.admin_note}</p>
              )}
              {r.section === 'BANK' && r.status === 'PENDING' && (
                <p className="mt-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                  Check the new bank proof / PAN card matches before approving. On approval the venue&apos;s Razorpay account is pointed
                  at these details and payouts pause until Razorpay re-verifies them.
                </p>
              )}
            </div>

            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {r.created_at ? new Date(r.created_at).toLocaleString('en-IN') : ''}
                {r.reviewed_at ? ` · reviewed ${new Date(r.reviewed_at).toLocaleString('en-IN')}` : ''}
              </span>
              {r.status === 'PENDING' && (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={notes[r.id] || ''}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    placeholder="Note (required to reject)"
                    aria-label={`Review note for ${r.request_number}`}
                    className="h-9 w-56 rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:border-[#021526]"
                  />
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => review(r, 'reject')}
                    className="px-3.5 py-2 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => review(r, 'approve')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
