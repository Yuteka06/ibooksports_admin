'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Mail,
  Search,
  CheckCircle2,
  Eye,
  RefreshCw,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { adminApi, EmailLogItem } from '@/lib/api';

const TEMPLATE_TABS = [
  { id: 'ALL', label: 'All Templates (14)' },
  { id: 'SUBMITTED', label: '1. Request Received' },
  { id: 'APPROVED', label: '2. Request Approved' },
  { id: 'REJECTED', label: '3. Request Rejected' },
  { id: 'ONBOARDING_SUBMITTED', label: '4. Onboarding Dossier' },
  { id: 'VENUE_ACTIVATED', label: '5. Venue Live' },
  { id: 'ONBOARDING_REJECTED', label: '6. KYC Corrections' },
  { id: 'VENDOR_REQUEST_SUBMITTED', label: '7. Change Request Received' },
  { id: 'VENDOR_REQUEST_APPROVED', label: '8. Change Request Approved' },
  { id: 'VENDOR_REQUEST_REJECTED', label: '9. Change Request Rejected' },
  { id: 'SUPPORT_TICKET_SUBMITTED', label: '10. Support Ticket Acknowledged' },
  { id: 'SUPPORT_TICKET_RESOLVED', label: '11. Support Ticket Resolved' },
  { id: 'COURT_REQUEST_SUBMITTED', label: '12. Court Addition Request' },
  { id: 'COURT_REQUEST_APPROVED', label: '13. Court Addition Approved' },
  { id: 'COURT_REQUEST_REJECTED', label: '14. Court Addition Rejected' },
];

export default function EmailNotificationLogsPage() {
  const [emailLogs, setEmailLogs] = useState<EmailLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [previewEmail, setPreviewEmail] = useState<EmailLogItem | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getEmailLogs();
      setEmailLogs(data);
    } catch (e) {
      console.error('Failed to load email logs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmails();
  }, []);

  const filteredLogs = emailLogs.filter((log) => {
    const matchesType =
      selectedType === 'ALL' || log.template_type === selectedType;
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      log.recipient_email.toLowerCase().includes(query) ||
      log.recipient_name.toLowerCase().includes(query) ||
      log.request_id.toLowerCase().includes(query) ||
      log.subject.toLowerCase().includes(query);
    return matchesType && matchesQuery;
  });

  const renderBadge = (type: string) => {
    switch (type) {
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
            REQUEST RECEIVED
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            APPROVED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
            REJECTED
          </span>
        );
      case 'ONBOARDING_SUBMITTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
            ONBOARDING SUBMITTED
          </span>
        );
      case 'VENUE_ACTIVATED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60">
            VENUE ACTIVATED
          </span>
        );
      case 'ONBOARDING_REJECTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-700 border border-red-200/60">
            KYC CORRECTION
          </span>
        );
      case 'VENDOR_REQUEST_SUBMITTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
            CHANGE REQUESTED
          </span>
        );
      case 'VENDOR_REQUEST_APPROVED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200/60">
            CHANGE APPROVED
          </span>
        );
      case 'VENDOR_REQUEST_REJECTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200/60">
            CHANGE REJECTED
          </span>
        );
      case 'SUPPORT_TICKET_SUBMITTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200/60">
            TICKET OPENED
          </span>
        );
      case 'SUPPORT_TICKET_RESOLVED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-50 text-green-700 border border-green-200/60">
            TICKET RESOLVED
          </span>
        );
      case 'COURT_REQUEST_SUBMITTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-yellow-50 text-yellow-700 border border-yellow-200/60">
            COURT REQUESTED
          </span>
        );
      case 'COURT_REQUEST_APPROVED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            COURT APPROVED
          </span>
        );
      case 'COURT_REQUEST_REJECTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200/60">
            COURT REJECTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#021526] font-display flex items-center gap-2.5">
            <Mail className="h-6 w-6 text-[#F94001]" />
            Transactional Email Notification Outbox
          </h1>
          <p className="text-xs text-[#5F6368] mt-1">
            Real-time inspection of all 14 automated transactional HTML emails (Leads, Approvals, KYC, Live Credentials, Changes, Tickets, and Court Audits).
          </p>
        </div>

        <button
          type="button"
          onClick={loadEmails}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2 text-xs font-bold text-[#021526] hover:border-[#F94001] transition-all shadow-xs cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5 text-[#F94001]" />
          <span>Refresh Outbox</span>
        </button>
      </div>

      {/* 6 FILTER TABS & SEARCH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white border border-[#E5E7EB] shadow-xs overflow-x-auto max-w-full scrollbar-none">
          {TEMPLATE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedType === tab.id
                  ? 'bg-[#F94001] text-white shadow-xs'
                  : 'text-[#5F6368] hover:text-[#021526] hover:bg-[#F3F4F4]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#5F6368]" />
          <input
            type="text"
            placeholder="Search email, recipient, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-white border border-[#E5E7EB] pl-10 pr-4 py-2 text-xs text-[#021526] placeholder-[#5F6368] focus:border-[#F94001] focus:outline-none"
          />
        </div>
      </div>

      {/* EMAIL LOGS TABLE */}
      <div className="rounded-2xl bg-white border border-[#E5E7EB] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F8F9FA] text-[#5F6368] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Email ID</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Template Type</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#5F6368]">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#F94001] mb-2" />
                    Loading email dispatch logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#5F6368]">
                    No email notification logs found in this category. Submit or process an application to trigger emails.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FFF1EC]/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#5F6368]">
                      {log.id}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#F94001]">
                      {log.request_id}
                    </td>
                    <td className="py-3.5 px-4">
                      {renderBadge(log.template_type)}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-[#021526]">{log.recipient_name}</p>
                      <p className="text-[11px] text-[#5F6368] font-mono">
                        {log.recipient_email}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#021526] max-w-xs truncate">
                      {log.subject}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {log.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setPreviewEmail(log)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#021526] hover:bg-[#06243f] text-white px-3 py-1.5 text-xs font-semibold whitespace-nowrap shadow-xs transition-colors cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 text-[#FF7A00]" /> View Email
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EMAIL PREVIEW MODAL */}
      {mounted && previewEmail && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] top-0 left-0 right-0 bottom-0 w-screen h-screen bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-[#E2E8F0] animate-in zoom-in-95 duration-150">
            {/* Clean Light Header */}
            <div className="px-5 py-4 bg-white border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FFF1EC] flex items-center justify-center text-[#F94001] shrink-0">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#021526] text-white uppercase tracking-wider">
                      {previewEmail.template_type}
                    </span>
                    <h3 className="text-sm font-bold text-[#021526] truncate max-w-sm sm:max-w-md">
                      {previewEmail.subject}
                    </h3>
                  </div>
                  <p className="text-[11px] text-[#5F6368] mt-0.5 truncate">
                    Recipient: <strong className="text-[#021526]">{previewEmail.recipient_name}</strong> &lt;{previewEmail.recipient_email}&gt;
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewEmail(null)}
                className="w-8 h-8 rounded-lg bg-[#F8F9FA] hover:bg-[#E5E7EB] text-[#5F6368] hover:text-[#021526] flex items-center justify-center font-bold text-sm transition-colors cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Email Canvas */}
            <div className="flex-1 p-4 sm:p-6 bg-[#F1F5F9] overflow-y-auto scrollbar-none flex items-center justify-center">
              <iframe
                srcDoc={previewEmail.html_content}
                className="w-full max-w-[560px] h-[540px] border-0 rounded-2xl shadow-xl scrollbar-none bg-transparent"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                title="Email Preview"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-white border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#5F6368]">
              <span className="font-medium">
                Reference ID: <strong className="text-[#021526] font-mono">{previewEmail.request_id}</strong>
              </span>
              <button
                type="button"
                onClick={() => setPreviewEmail(null)}
                className="rounded-lg bg-[#021526] hover:bg-[#06243f] px-5 py-1.5 font-bold text-white cursor-pointer transition-colors shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
