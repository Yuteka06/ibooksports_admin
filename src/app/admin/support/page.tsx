'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Headphones,
  Search,
  Filter,
  Eye,
  X,
  Send,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Building2,
  Phone,
  Paperclip,
  Plus,
  Tag,
  ArrowRight,
  Check,
  FileText,
  Download,
  Calendar,
  Layers,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Edit3,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
} from 'lucide-react';
import { SupportTicketItem, VenueDetail } from '@/lib/mockData';
import { apiClient, onboardingApi } from '@/lib/api';
import DocumentPreview from '@/components/admin/DocumentPreview';

/** The server's own error message, so the admin sees why an action failed. */
const apiErrorMessage = (e: any, fallback: string): string => {
  const m = e?.response?.data?.message;
  if (Array.isArray(m)) return m.join(', ');
  return (typeof m === 'string' && m) || e?.message || fallback;
};

/** Where the admin can fetch a ticket's attachment: the uploaded document, or a plain web link. */
const attachmentViewUrl = (t: SupportTicketItem): string => {
  if (t.attachment_id) return onboardingApi.getDocumentUrl(t.attachment_id);
  return t.attachment_url && /^https?:\/\//i.test(t.attachment_url) ? t.attachment_url : '';
};

const isPdfName = (name?: string) => /\.pdf$/i.test(name || '');

export default function SupportHelpdeskPage() {
  const [mounted, setMounted] = useState(false);
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [venues, setVenues] = useState<VenueDetail[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [venueFilter, setVenueFilter] = useState<string>('ALL');

  // Selected Ticket for Details / Conversation Drawer
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketItem | null>(null);
  const [isAttachmentPreviewOpen, setIsAttachmentPreviewOpen] = useState(false);

  // In-Drawer Resolution State
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [notifyRequester, setNotifyRequester] = useState(true);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [isEditingResolution, setIsEditingResolution] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  // Admin reply in the conversation
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRaising, setIsRaising] = useState(false);

  // Modal State for Raising New Ticket (Simulating Venue Side or Admin Entry)
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [newTicketVenueId, setNewTicketVenueId] = useState('');
  const [newTicketPersonName, setNewTicketPersonName] = useState('');
  const [newTicketContact, setNewTicketContact] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState<SupportTicketItem['category']>('PAYMENT');
  const [newTicketPriority, setNewTicketPriority] = useState<SupportTicketItem['priority']>('HIGH');
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketDescription, setNewTicketDescription] = useState('');
  const [newTicketBookingId, setNewTicketBookingId] = useState('');
  const [newTicketAttachmentName, setNewTicketAttachmentName] = useState('');
  const [raiseError, setRaiseError] = useState<string | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'info' | 'error';
    title: string;
    description: string;
  } | null>(null);

  // Fetch live venues for filter dropdowns
  useEffect(() => {
    setMounted(true);
    const fetchVenues = async () => {
      try {
        const res = await apiClient.get<VenueDetail[]>('/venues');
        if (res.data && Array.isArray(res.data)) {
          setVenues(res.data);
        }
      } catch (err) {
        console.warn('Failed to fetch live venues for support helpdesk', err);
      }
    };
    fetchVenues();
  }, []);

  // Live Backend Sync
  const fetchLiveTickets = async () => {
    try {
      const res = await apiClient.get('/support');
      if (res.data && Array.isArray(res.data)) {
        setTickets(res.data);
        // Keep the open drawer in step (new vendor replies, status changes).
        setSelectedTicket((cur) => (cur ? res.data.find((t: SupportTicketItem) => t.id === cur.id) || cur : cur));
      }
      setLoadError(null);
    } catch (e) {
      // Keep the last loaded list; an empty list would look like "no tickets".
      setLoadError(apiErrorMessage(e, 'Support tickets could not be loaded.'));
    }
  };

  useEffect(() => {
    fetchLiveTickets();
    const interval = setInterval(fetchLiveTickets, 10000);
    return () => clearInterval(interval);
  }, []);

  // A different (or no) ticket closes the attachment preview.
  useEffect(() => {
    setIsAttachmentPreviewOpen(false);
  }, [selectedTicket?.id]);

  // KPI Statistics
  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED').length;

  // Filtered Tickets
  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    if (venueFilter !== 'ALL' && t.venue_id !== venueFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = t.ticket_number.toLowerCase().includes(q);
      const matchSubject = t.subject.toLowerCase().includes(q);
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchVenue = t.venue_name.toLowerCase().includes(q) || t.venue_id.toLowerCase().includes(q);
      const matchPerson = t.created_person_name.toLowerCase().includes(q);
      const matchPhone = t.contact_number.includes(q);
      const matchBooking = t.related_booking_code ? t.related_booking_code.toLowerCase().includes(q) : false;
      return matchId || matchSubject || matchDesc || matchVenue || matchPerson || matchPhone || matchBooking;
    }
    return true;
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalItems = filteredTickets.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTickets = useMemo(() => {
    return filteredTickets.slice(startIndex, startIndex + pageSize);
  }, [filteredTickets, startIndex, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, categoryFilter, priorityFilter, venueFilter, searchQuery]);

  // Action: Open Slide-out Drawer
  const handleOpenDrawer = (t: SupportTicketItem, startResolve: boolean = false) => {
    setSelectedTicket(t);
    setResolutionNotes(t.resolution_notes || '');
    setResolveError(null);
    setIsEditingResolution(startResolve || t.status !== 'RESOLVED');
  };

  /** Put the server's version of a ticket into the list and the open drawer. */
  const applyTicket = (updated: SupportTicketItem) => {
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTicket((cur) => (cur && cur.id === updated.id ? updated : cur));
  };

  const showToast = (type: 'success' | 'info' | 'error', title: string, description: string) => {
    setToastMessage({ type, title, description });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Action: change status (OPEN / IN_PROGRESS / CLOSED) - only after the server confirms
  const changeStatus = async (ticketId: string, status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED') => {
    try {
      const res = await apiClient.patch(`/support/${ticketId}/status`, { status });
      applyTicket(res.data);
      const label = status === 'IN_PROGRESS' ? 'In Progress' : status === 'OPEN' ? 'reopened' : 'closed';
      showToast('info', `Ticket ${label}`, `${res.data?.ticket_number || 'Ticket'} is now ${status.replace('_', ' ')}.`);
    } catch (e) {
      showToast('error', 'Status not changed', apiErrorMessage(e, 'The ticket status could not be updated.'));
    }
  };
  const handleMoveToInProgress = (ticketId: string) => changeStatus(ticketId, 'IN_PROGRESS');
  const handleReopenTicket = (ticketId: string) => changeStatus(ticketId, 'OPEN');

  // Action: resolve with notes (+ email) - only after the server confirms
  const handleConfirmResolutionInDrawer = async () => {
    if (!selectedTicket || isResolving) return;
    if (!resolutionNotes.trim()) {
      setResolveError('Resolution notes are mandatory before marking this ticket as resolved.');
      return;
    }
    setIsResolving(true);
    try {
      const res = await apiClient.patch(`/support/${selectedTicket.id}/resolve`, {
        resolution_notes: resolutionNotes.trim(),
        resolved_by: 'Super Admin',
        notify_requester: notifyRequester,
      });
      applyTicket(res.data);
      setIsEditingResolution(false);
      setResolveError(null);
      const emailedTo: string | undefined = res.data?.email_sent_to;
      showToast(
        'success',
        'Ticket Resolved',
        `${res.data?.ticket_number || selectedTicket.ticket_number} resolved. ${
          !notifyRequester ? 'No email sent.' : emailedTo ? `Resolution email sent to ${emailedTo}.` : 'No email on file, so no email was sent.'
        }`,
      );
    } catch (e) {
      setResolveError(apiErrorMessage(e, 'The ticket could not be resolved.'));
    } finally {
      setIsResolving(false);
    }
  };

  // Action: admin reply in the conversation (an OPEN ticket moves to IN PROGRESS)
  const handleSendReply = async () => {
    if (!selectedTicket || isSendingReply) return;
    const text = replyText.trim();
    if (!text) return;
    setIsSendingReply(true);
    try {
      const res = await apiClient.post(`/support/${selectedTicket.id}/messages`, { text });
      applyTicket(res.data);
      setReplyText('');
    } catch (e) {
      showToast('error', 'Reply not sent', apiErrorMessage(e, 'Your reply could not be sent.'));
    } finally {
      setIsSendingReply(false);
    }
  };

  // Action: Raise New Inbound Ticket (admin portal) - added to the list only after the server saves it
  const handleCreateNewTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRaising) return;
    const matchedVenue = venues.find((v) => v.id === newTicketVenueId);
    if (!matchedVenue) {
      setRaiseError('Please select the venue this ticket is about.');
      return;
    }
    if (!newTicketPersonName.trim()) {
      setRaiseError('Please specify the contact person name.');
      return;
    }
    if (!newTicketContact.trim()) {
      setRaiseError('Please provide a contact phone number.');
      return;
    }
    if (!newTicketSubject.trim()) {
      setRaiseError('Please enter a ticket subject.');
      return;
    }
    if (!newTicketDescription.trim()) {
      setRaiseError('Please enter detailed description of the issue.');
      return;
    }

    setIsRaising(true);
    let created: SupportTicketItem;
    try {
      const res = await apiClient.post('/support', {
        venue_id: matchedVenue.id,
        venue_name: matchedVenue.venue_name,
        person_name: newTicketPersonName.trim(),
        contact_number: newTicketContact.trim(),
        email: matchedVenue.email || undefined,
        category: newTicketCategory,
        priority: newTicketPriority,
        subject: newTicketSubject.trim(),
        description: newTicketDescription.trim(),
        booking_id: newTicketBookingId.trim() || undefined,
        attachment_name: newTicketAttachmentName.trim() || undefined,
      });
      created = res.data;
    } catch (err) {
      setRaiseError(apiErrorMessage(err, 'The ticket could not be created.'));
      setIsRaising(false);
      return;
    }
    setIsRaising(false);
    setTickets((prev) => [created, ...prev]);
    setIsRaiseModalOpen(false);
    setRaiseError(null);

    // Reset Form
    setNewTicketVenueId('');
    setNewTicketPersonName('');
    setNewTicketContact('');
    setNewTicketSubject('');
    setNewTicketDescription('');
    setNewTicketBookingId('');
    setNewTicketAttachmentName('');

    showToast('success', 'Support Ticket Raised', `${created.ticket_number} registered for ${created.venue_name} under OPEN status.`);
  };

  const renderCategoryBadge = (category: SupportTicketItem['category']) => {
    switch (category) {
      case 'PAYMENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50/90 text-blue-700 border border-blue-200/80 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
            Payment
          </span>
        );
      case 'BOOKING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50/90 text-purple-700 border border-purple-200/80 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span>
            Booking
          </span>
        );
      case 'TECHNICAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50/90 text-amber-800 border border-amber-200/80 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            Technical
          </span>
        );
      case 'SETTLEMENTS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50/90 text-emerald-800 border border-emerald-200/80 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            Settlements
          </span>
        );
      case 'GENERAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500"></span>
            General
          </span>
        );
      case 'OTHERS':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50/90 text-rose-700 border border-rose-200/80 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            Others
          </span>
        );
    }
  };

  const renderPriorityBadge = (priority: SupportTicketItem['priority']) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
            Urgent
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            High
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
            Medium
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
            Low
          </span>
        );
    }
  };

  const renderStatusBadge = (status: SupportTicketItem['status']) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            Open
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200/80 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
            In Progress
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 stroke-[2.5]" />
            Resolved
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADER (SIMPLE & MINIMAL) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-black tracking-tight text-[#021526] font-display">
            Support Desk
          </h1>
          <p className="text-xs text-[#5F6368] mt-1 max-w-xl leading-relaxed">
            Manage inbound disputes, slot cancellations, technical glitches, and settlement adjustments raised by turf partners.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsRaiseModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F94001] hover:bg-[#d83500] text-white text-xs font-bold transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Raise Venue Ticket</span>
          </button>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100000] max-w-md p-4 rounded-2xl bg-[#021526] text-white border border-emerald-500/40 shadow-2xl flex items-start gap-3.5 animate-in slide-in-from-bottom duration-300 pointer-events-auto">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs">
            <p className="font-bold text-sm text-white mb-0.5">{toastMessage.title}</p>
            <p className="text-slate-300 leading-relaxed">{toastMessage.description}</p>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* TOP KPI SUMMARY CARDS (SENIOR SAAS AESTHETIC WITH TOP ACCENT LINE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inquiries Card */}
        <div
          onClick={() => {
            setStatusFilter('ALL');
            setCategoryFilter('ALL');
            setPriorityFilter('ALL');
            setVenueFilter('ALL');
          }}
          className={`relative p-4 rounded-2xl bg-white border transition-all duration-200 cursor-pointer overflow-hidden ${
            statusFilter === 'ALL'
              ? 'border-[#021526] shadow-md ring-2 ring-[#021526]/10 -translate-y-0.5'
              : 'border-[#E5E7EB] hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          {/* Top accent line */}
          <div
            className={`absolute top-0 left-0 right-0 h-1 transition-all duration-200 ${
              statusFilter === 'ALL' ? 'bg-[#021526]' : 'bg-slate-200'
            }`}
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6368]">
              Total Inquiries
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-[#021526] text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              <Headphones className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-3xl font-black font-display text-[#021526] tracking-tight tabular-nums">
              {totalCount}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80">
              100% Tracked
            </span>
          </div>
          <p className="text-[11px] text-[#5F6368] mt-1.5 truncate">
            All inbound dispute &amp; support cases
          </p>
        </div>

        {/* Open Queue Card */}
        <div
          onClick={() => setStatusFilter('OPEN')}
          className={`relative p-4 rounded-2xl bg-white border transition-all duration-200 cursor-pointer overflow-hidden ${
            statusFilter === 'OPEN'
              ? 'border-amber-500 shadow-md ring-2 ring-amber-500/15 -translate-y-0.5'
              : 'border-[#E5E7EB] hover:border-amber-300 hover:shadow-xs'
          }`}
        >
          {/* Top accent line */}
          <div
            className={`absolute top-0 left-0 right-0 h-1 transition-all duration-200 ${
              statusFilter === 'OPEN' ? 'bg-amber-500' : 'bg-amber-200'
            }`}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                Open Queue
              </span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            </div>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                statusFilter === 'OPEN'
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-50 text-amber-600 border border-amber-200/50'
              }`}
            >
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-3xl font-black font-display text-[#021526] tracking-tight tabular-nums">
              {openCount}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Action Required
            </span>
          </div>
          <p className="text-[11px] text-[#5F6368] mt-1.5 truncate">
            Awaiting admin intake &amp; action
          </p>
        </div>

        {/* In Progress Card */}
        <div
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className={`relative p-4 rounded-2xl bg-white border transition-all duration-200 cursor-pointer overflow-hidden ${
            statusFilter === 'IN_PROGRESS'
              ? 'border-blue-600 shadow-md ring-2 ring-blue-600/15 -translate-y-0.5'
              : 'border-[#E5E7EB] hover:border-blue-300 hover:shadow-xs'
          }`}
        >
          {/* Top accent line */}
          <div
            className={`absolute top-0 left-0 right-0 h-1 transition-all duration-200 ${
              statusFilter === 'IN_PROGRESS' ? 'bg-blue-600' : 'bg-blue-200'
            }`}
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
              In Progress
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                statusFilter === 'IN_PROGRESS'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-600 border border-blue-200/50'
              }`}
            >
              <Tag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-3xl font-black font-display text-[#021526] tracking-tight tabular-nums">
              {inProgressCount}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Investigating
            </span>
          </div>
          <p className="text-[11px] text-[#5F6368] mt-1.5 truncate">
            Admin resolving root cause
          </p>
        </div>

        {/* Resolved Cases Card */}
        <div
          onClick={() => setStatusFilter('RESOLVED')}
          className={`relative p-4 rounded-2xl bg-white border transition-all duration-200 cursor-pointer overflow-hidden ${
            statusFilter === 'RESOLVED'
              ? 'border-emerald-600 shadow-md ring-2 ring-emerald-600/15 -translate-y-0.5'
              : 'border-[#E5E7EB] hover:border-emerald-300 hover:shadow-xs'
          }`}
        >
          {/* Top accent line */}
          <div
            className={`absolute top-0 left-0 right-0 h-1 transition-all duration-200 ${
              statusFilter === 'RESOLVED' ? 'bg-emerald-600' : 'bg-emerald-200'
            }`}
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Resolved Cases
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                statusFilter === 'RESOLVED'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-200/50'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-3xl font-black font-display text-[#021526] tracking-tight tabular-nums">
              {resolvedCount}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Notes Logged
            </span>
          </div>
          <p className="text-[11px] text-[#5F6368] mt-1.5 truncate">
            Audit documented &amp; closed
          </p>
        </div>
      </div>

      {/* MINIMAL FILTER & SEARCH TOOLBAR (COMPACT SINGLE LINE WITH CHEVRONS) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E5E7EB] shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Segmented Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB]">
            {[
              { id: 'ALL', label: 'All Tickets', count: totalCount },
              { id: 'OPEN', label: 'Open', count: openCount, pulse: true },
              { id: 'IN_PROGRESS', label: 'In Progress', count: inProgressCount },
              { id: 'RESOLVED', label: 'Resolved', count: resolvedCount },
            ].map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#021526] text-white shadow-xs'
                      : 'text-[#5F6368] hover:text-[#021526] hover:bg-white'
                  }`}
                >
                  {tab.pulse && !isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  )}
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Category Dropdown with custom chevron and active theme styling */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`appearance-none pl-3 pr-7 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all shadow-2xs ${
                categoryFilter !== 'ALL'
                  ? 'border-[#F94001] bg-orange-50/90 text-[#F94001] font-bold ring-2 ring-[#F94001]/15'
                  : 'border-[#E5E7EB] bg-[#F8F9FA] text-[#021526] hover:bg-white focus:outline-none focus:border-[#F94001]'
              }`}
            >
              <option value="ALL" className="bg-white text-[#021526]">All Categories</option>
              <option value="PAYMENT" className="bg-white text-[#021526]">Payment</option>
              <option value="BOOKING" className="bg-white text-[#021526]">Booking</option>
              <option value="TECHNICAL" className="bg-white text-[#021526]">Technical</option>
              <option value="SETTLEMENTS" className="bg-white text-[#021526]">Settlements</option>
              <option value="GENERAL" className="bg-white text-[#021526]">General</option>
              <option value="OTHERS" className="bg-white text-[#021526]">Others</option>
            </select>
            <ChevronDown className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 transition-colors ${
              categoryFilter !== 'ALL' ? 'text-[#F94001]' : 'text-slate-400'
            }`} />
          </div>

          {/* Priority Dropdown with custom chevron and active theme styling */}
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className={`appearance-none pl-3 pr-7 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all shadow-2xs ${
                priorityFilter !== 'ALL'
                  ? 'border-[#F94001] bg-orange-50/90 text-[#F94001] font-bold ring-2 ring-[#F94001]/15'
                  : 'border-[#E5E7EB] bg-[#F8F9FA] text-[#021526] hover:bg-white focus:outline-none focus:border-[#F94001]'
              }`}
            >
              <option value="ALL" className="bg-white text-[#021526]">All Priorities</option>
              <option value="URGENT" className="bg-white text-[#021526]">Urgent</option>
              <option value="HIGH" className="bg-white text-[#021526]">High</option>
              <option value="MEDIUM" className="bg-white text-[#021526]">Medium</option>
              <option value="LOW" className="bg-white text-[#021526]">Low</option>
            </select>
            <ChevronDown className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 transition-colors ${
              priorityFilter !== 'ALL' ? 'text-[#F94001]' : 'text-slate-400'
            }`} />
          </div>

          {/* Venue Dropdown with custom chevron and active theme styling */}
          <div className="relative">
            <select
              value={venueFilter}
              onChange={(e) => setVenueFilter(e.target.value)}
              className={`appearance-none pl-3 pr-7 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer max-w-[150px] truncate transition-all shadow-2xs ${
                venueFilter !== 'ALL'
                  ? 'border-[#F94001] bg-orange-50/90 text-[#F94001] font-bold ring-2 ring-[#F94001]/15'
                  : 'border-[#E5E7EB] bg-[#F8F9FA] text-[#021526] hover:bg-white focus:outline-none focus:border-[#F94001]'
              }`}
            >
              <option value="ALL" className="bg-white text-[#021526]">All Venues</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id} className="bg-white text-[#021526]">
                  {v.venue_name}
                </option>
              ))}
            </select>
            <ChevronDown className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 transition-colors ${
              venueFilter !== 'ALL' ? 'text-[#F94001]' : 'text-slate-400'
            }`} />
          </div>

          {/* Reset Filters Shortcut */}
          {(statusFilter !== 'ALL' || categoryFilter !== 'ALL' || priorityFilter !== 'ALL' || venueFilter !== 'ALL' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('ALL');
                setCategoryFilter('ALL');
                setPriorityFilter('ALL');
                setVenueFilter('ALL');
                setSearchQuery('');
              }}
              className="text-xs text-[#F94001] font-bold hover:underline px-2 py-1 cursor-pointer flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" /> Reset
            </button>
          )}
        </div>

        {/* Real-time Search Input */}
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#5F6368]" />
          <input
            type="text"
            placeholder="Search ticket, venue, partner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] pl-10 pr-9 py-2 text-xs text-[#021526] placeholder-[#5F6368] focus:bg-white focus:border-[#F94001] focus:outline-none transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* TICKETS DATA TABLE (MINIMAL & SCAN-OPTIMIZED) */}
      <div className="rounded-2xl bg-white border border-[#E5E7EB] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[950px]" suppressHydrationWarning>
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-slate-50/70 text-[#5F6368] font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-4 w-[130px]">Ticket ID</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4 w-[130px]">Category</th>
                <th className="py-3 px-4 w-[230px]">Venue &amp; Partner</th>
                <th className="py-3 px-4 w-[100px]">Priority</th>
                <th className="py-3 px-4 w-[130px]">Status</th>
                <th className="py-3 px-4 w-[105px]">Reported</th>
                <th className="py-3 px-4 w-[85px] text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F4]">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-[#5F6368]">
                    <Headphones className="h-9 w-9 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-sm text-[#021526]">No support tickets match criteria</p>
                    <p className="text-xs text-[#5F6368] mt-0.5">Try selecting a different filter or clearing search keywords.</p>
                  </td>
                </tr>
              ) : (
                paginatedTickets.map((t: SupportTicketItem, index: number) => (
                  <tr
                    key={t.id}
                    onClick={() => handleOpenDrawer(t, false)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    {/* 0. SERIAL NUMBER */}
                    <td className="py-3.5 px-3 font-mono text-center font-bold text-xs text-slate-400">
                      {startIndex + index + 1}
                    </td>

                    {/* Support ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#021526] group-hover:text-[#F94001] transition-colors">
                      {t.ticket_number}
                    </td>

                    {/* Subject */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-xs text-[#021526] group-hover:text-[#F94001] transition-colors line-clamp-1">
                        {t.subject}
                      </span>
                    </td>

                    {/* Category with Dedicated Badge */}
                    <td className="py-3.5 px-4">
                      {renderCategoryBadge(t.category)}
                    </td>

                    {/* Venue & Requester */}
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-xs text-[#021526] truncate">{t.venue_name}</p>
                      <p className="text-[11px] text-[#5F6368]">{t.created_person_name}</p>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4">
                      {renderPriorityBadge(t.priority)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {renderStatusBadge(t.status)}
                    </td>

                    {/* Reported */}
                    <td className="py-3.5 px-4 text-[#5F6368] text-[11px]">
                      {(() => {
                        const raw = t.created_at || '';
                        if (!raw) return 'Today';
                        return typeof raw === 'string'
                          ? (raw.includes(' ') ? raw.split(' ')[0] : (raw.includes('T') ? raw.split('T')[0] : raw))
                          : 'Today';
                      })()}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDrawer(t, false);
                        }}
                        className="h-7.5 w-7.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-[#F94001] hover:border-[#F94001]/40 hover:bg-[#FFF1EC] transition-all inline-flex items-center justify-center cursor-pointer shadow-2xs mx-auto"
                        title="View Support Ticket Details"
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

        {/* Pagination Bar */}
        <div className="p-3.5 border-t border-slate-200/90 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong className="text-slate-900">{totalItems === 0 ? 0 : startIndex + 1}</strong> to{' '}
              <strong className="text-slate-900">
                {Math.min(startIndex + pageSize, totalItems)}
              </strong>{' '}
              of <strong className="text-slate-900">{totalItems}</strong> tickets
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
      {/* 2. RAISE SUPPORT TICKET SLIDE-OUT DRAWER (SLIDE BAR) */}
      {/* ========================================================================= */}
      {isRaiseModalOpen && (
        <div className="fixed inset-0 z-[9999] top-0 left-0 right-0 bottom-0 w-screen h-screen overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity"
            onClick={() => setIsRaiseModalOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200 border-l border-slate-200">
              {/* Drawer Header */}
              <div className="p-5 border-b border-[#E5E7EB] bg-white sticky top-0 z-10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-orange-50 text-[#F94001] border border-orange-200/60">
                    <Headphones className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#021526] font-display">Raise Inbound Support Ticket</h3>
                    <p className="text-[11px] text-[#5F6368]">
                      Log new dispute or inquiry on behalf of venue partner
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRaiseModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Form */}
              <form onSubmit={handleCreateNewTicket} id="raise-ticket-form" className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
                {raiseError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{raiseError}</span>
                  </div>
                )}

                {/* Venue Selection */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#021526]">Select Sports Venue &amp; Facility *</label>
                  <select
                    value={newTicketVenueId}
                    onChange={(e) => setNewTicketVenueId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-[#021526] focus:border-[#F94001] focus:outline-none"
                  >
                    <option value="" disabled>
                      {venues.length ? 'Select a venue…' : 'No approved venues yet'}
                    </option>
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.venue_name} ({v.id}) — {v.district}, {v.state}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Requester Person Name & Contact Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#021526]">Created Person Name *</label>
                    <input
                      type="text"
                      value={newTicketPersonName}
                      onChange={(e) => setNewTicketPersonName(e.target.value)}
                      placeholder="e.g. Karthik Rajan (Owner)"
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-[#021526] focus:border-[#F94001] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#021526]">Contact Phone Number *</label>
                    <input
                      type="tel"
                      value={newTicketContact}
                      onChange={(e) => setNewTicketContact(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-[#021526] focus:border-[#F94001] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Category & Priority */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#021526]">Category *</label>
                    <select
                      value={newTicketCategory}
                      onChange={(e) => setNewTicketCategory(e.target.value as SupportTicketItem['category'])}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-[#021526] focus:border-[#F94001] focus:outline-none"
                    >
                      <option value="PAYMENT">Payment</option>
                      <option value="BOOKING">Booking</option>
                      <option value="TECHNICAL">Technical</option>
                      <option value="SETTLEMENTS">Settlements</option>
                      <option value="GENERAL">General</option>
                      <option value="OTHERS">Others</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#021526]">Priority Level *</label>
                    <select
                      value={newTicketPriority}
                      onChange={(e) => setNewTicketPriority(e.target.value as SupportTicketItem['priority'])}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-[#021526] focus:border-[#F94001] focus:outline-none"
                    >
                      <option value="URGENT">Urgent (SLA &lt; 2h)</option>
                      <option value="HIGH">High (SLA &lt; 6h)</option>
                      <option value="MEDIUM">Medium (SLA 24h)</option>
                      <option value="LOW">Low (SLA 48h)</option>
                    </select>
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#021526]">Subject *</label>
                  <input
                    type="text"
                    value={newTicketSubject}
                    onChange={(e) => setNewTicketSubject(e.target.value)}
                    placeholder="Concise summary of dispute or request"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-[#021526] focus:border-[#F94001] focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#021526]">Detailed Description *</label>
                  <textarea
                    rows={3}
                    value={newTicketDescription}
                    onChange={(e) => setNewTicketDescription(e.target.value)}
                    placeholder="Provide complete breakdown of the error, affected slots, player numbers, or equipment specifics..."
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-[#021526] focus:border-[#F94001] focus:outline-none leading-relaxed"
                  />
                </div>

                {/* Booking Code & Attachment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#021526]">
                      Linked Booking Code <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={newTicketBookingId}
                      onChange={(e) => setNewTicketBookingId(e.target.value)}
                      placeholder="e.g. BK-2026-8902"
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-[#021526] font-mono focus:border-[#F94001] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#021526]">
                      Attachment File Name <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={newTicketAttachmentName}
                      onChange={(e) => setNewTicketAttachmentName(e.target.value)}
                      placeholder="e.g. upi_payment_proof.png"
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-[#021526] focus:border-[#F94001] focus:outline-none"
                    />
                  </div>
                </div>
              </form>

              {/* Drawer Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-[#E5E7EB] flex items-center justify-end gap-2.5 sticky bottom-0">
                <button
                  type="button"
                  onClick={() => setIsRaiseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="raise-ticket-form"
                  className="px-5 py-2 rounded-xl bg-[#F94001] hover:bg-[#d83500] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Register Ticket</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SLIDE-OUT DOSSIER & CHAT DRAWER */}
      {/* ========================================================================= */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[9999] top-0 left-0 right-0 bottom-0 w-screen h-screen overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedTicket(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200 border-l border-slate-200">
              {/* Top Drawer Header Bar */}
              <div className="p-5 border-b border-[#E5E7EB] bg-white sticky top-0 z-10 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#021526] bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      {selectedTicket.ticket_number}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60">
                      Venue App
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Minimal 3-stage Status Switcher */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleReopenTicket(selectedTicket.id)}
                        className={`py-1 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          selectedTicket.status === 'OPEN'
                            ? 'bg-amber-500 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                        }`}
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveToInProgress(selectedTicket.id)}
                        className={`py-1 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          selectedTicket.status === 'IN_PROGRESS'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                        }`}
                      >
                        In Progress
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingResolution(true)}
                        className={`py-1 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          selectedTicket.status === 'RESOLVED'
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                        }`}
                      >
                        Resolved
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedTicket(null)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Close drawer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Ticket Title & Timestamp */}
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#021526] leading-snug font-display">
                    {selectedTicket.subject}
                  </h2>
                  <p className="text-[11px] text-[#5F6368] mt-1">
                    Reported on {selectedTicket.created_at}
                  </p>
                </div>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                {/* 1. SaaS Properties Inspector (Clean Key-Value Grid) */}
                <div className="rounded-2xl bg-slate-50/70 border border-slate-200/80 p-4 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Ticket Properties
                  </span>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Associated Venue</span>
                      <p className="font-bold text-[#021526] text-xs truncate mt-0.5">{selectedTicket.venue_name}</p>
                      <span className="font-mono text-[10px] text-slate-500">{selectedTicket.venue_id}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Dispute Category</span>
                      <div className="mt-0.5">{renderCategoryBadge(selectedTicket.category)}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Requester Name</span>
                      <p className="font-bold text-[#021526] text-xs mt-0.5">{selectedTicket.created_person_name}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Priority Level</span>
                      <div className="mt-0.5">{renderPriorityBadge(selectedTicket.priority)}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Contact Phone</span>
                      <a
                        href={`tel:${selectedTicket.contact_number}`}
                        className="font-mono text-[#F94001] hover:underline font-bold text-xs mt-0.5 inline-block"
                      >
                        {selectedTicket.contact_number.startsWith('+91')
                          ? selectedTicket.contact_number
                          : `+91 ${selectedTicket.contact_number}`}
                      </a>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Linked Booking ID</span>
                      <p className="font-mono text-xs font-semibold text-[#021526] mt-0.5">
                        {selectedTicket.related_booking_code || 'None'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Issue Description */}
                <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] space-y-1.5 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Dispute / Request Details
                  </span>
                  <p className="text-slate-800 leading-relaxed font-medium text-xs">
                    {selectedTicket.description}
                  </p>
                </div>

                {/* 3. Attachment Proof (if present) */}
                {selectedTicket.attachment_name && (
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                        <Paperclip className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-[#021526] block truncate max-w-[260px]">
                          {selectedTicket.attachment_name}
                        </span>
                        <span className="text-[10px] text-[#5F6368]">
                          {attachmentViewUrl(selectedTicket) ? 'Attached by the venue' : 'File was not uploaded'}
                        </span>
                      </div>
                    </div>
                    {attachmentViewUrl(selectedTicket) && (
                      <button
                        type="button"
                        onClick={() => setIsAttachmentPreviewOpen(true)}
                        className="inline-flex items-center gap-1.5 shrink-0 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                    )}
                  </div>
                )}

                {/* Conversation with the venue + admin reply */}
                <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 space-y-3 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" /> Conversation ({selectedTicket.conversation?.length || 0})
                  </span>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {(selectedTicket.conversation || []).map((m, idx) => (
                      <div key={idx} className={`flex ${m.sender === 'ADMIN' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                            m.sender === 'ADMIN'
                              ? 'bg-[#021526] text-white'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.message}</p>
                          <p className={`mt-1 text-[10px] ${m.sender === 'ADMIN' ? 'text-slate-300' : 'text-slate-500'}`}>
                            {m.sender === 'ADMIN' ? 'You' : m.sender_name} · {m.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedTicket.status !== 'CLOSED' && (
                    <div className="flex items-end gap-2 pt-1">
                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSendReply();
                        }}
                        placeholder="Reply to the venue… (Ctrl+Enter to send)"
                        className="flex-1 rounded-xl border border-[#CBD5E1] bg-white p-2.5 text-xs text-[#021526] placeholder-slate-400 focus:outline-none focus:border-[#F94001]"
                      />
                      <button
                        type="button"
                        onClick={handleSendReply}
                        disabled={!replyText.trim() || isSendingReply}
                        className="px-3 py-2.5 rounded-xl bg-[#F94001] hover:bg-[#e03a00] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>{isSendingReply ? 'Sending…' : 'Send'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 4. Resolution Console (Directly inside Drawer) */}
                <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${selectedTicket.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-[#021526] text-white'}`}>
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-[#021526] block font-display">
                          Resolution Outcome &amp; Notes
                        </span>
                        <span className="text-[10px] text-[#5F6368]">
                          {selectedTicket.status === 'RESOLVED'
                            ? 'Audit documented and ticket marked resolved'
                            : 'Log mandatory audit notes directly here to resolve ticket'}
                        </span>
                      </div>
                    </div>

                    {selectedTicket.status === 'RESOLVED' && (
                      <button
                        type="button"
                        onClick={() => handleReopenTicket(selectedTicket.id)}
                        className="text-[11px] font-bold text-slate-700 hover:text-[#F94001] bg-white border border-slate-200 rounded-lg px-2.5 py-1 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Reopen</span>
                      </button>
                    )}
                  </div>

                  {/* Read-only notes display when resolved */}
                  {selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED' ? (
                    <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-2">
                      <p className="text-emerald-950 text-xs leading-relaxed font-medium">
                        {selectedTicket.resolution_notes}
                      </p>
                      <div className="flex flex-wrap items-center justify-between text-[10px] text-emerald-700 font-mono pt-1.5 border-t border-emerald-200/60">
                        <span>Resolved by: {selectedTicket.resolved_by || 'Super Admin'}</span>
                        {selectedTicket.resolved_at && <span>{selectedTicket.resolved_at}</span>}
                      </div>
                    </div>
                  ) : (
                    /* Edit / Log resolution notes */
                    <div className="space-y-3 pt-1">
                      <div className="space-y-1">
                        <textarea
                          rows={3}
                          value={resolutionNotes}
                          onChange={(e) => {
                            setResolutionNotes(e.target.value);
                            if (resolveError) setResolveError(null);
                          }}
                          placeholder="Enter resolution notes: refund UTR number, reschedule booking code, bug patch deployed, or outcome communicated..."
                          className="w-full rounded-xl border border-[#CBD5E1] bg-white p-3 text-xs text-[#021526] placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 leading-relaxed shadow-2xs"
                        />
                        {resolveError && (
                          <p className="text-rose-600 font-semibold text-[11px] flex items-center gap-1 pt-0.5">
                            <AlertCircle className="h-3.5 w-3.5" /> {resolveError}
                          </p>
                        )}
                      </div>

                      {/* Quick Presets */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                          Quick Presets:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {[
                            'Refund UTR reference credited to customer bank account.',
                            'Slot rescheduled on venue calendar with customer consent.',
                            'TDS statement & tax reconciliation verified with finance.',
                            'Software bug patch deployed on Vendor App v2.4.2.',
                          ].map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setResolutionNotes(preset)}
                              className="text-[10px] bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 rounded-md px-2 py-0.5 transition-colors text-left cursor-pointer"
                            >
                              + {typeof preset === 'string' ? preset.split(' ').slice(0, 3).join(' ') : 'Preset note'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Notify Checkbox */}
                      <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                        <input
                          type="checkbox"
                          checked={notifyRequester}
                          onChange={(e) => setNotifyRequester(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-[11px] text-slate-600 font-medium">
                          Email the resolution to the venue{selectedTicket.email ? ` (${selectedTicket.email})` : ' (onboarding email)'}
                        </span>
                      </label>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleConfirmResolutionInDrawer}
                          disabled={isResolving}
                          className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Check className="h-4 w-4" />
                          <span>{isResolving ? 'Resolving…' : 'Mark as Resolved & Notify'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Clean Drawer Footer */}
              <div className="p-4 bg-slate-50 border-t border-[#E5E7EB] flex items-center justify-between sticky bottom-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#5F6368] font-medium">Current Status:</span>
                  {renderStatusBadge(selectedTicket.status)}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-[#021526] hover:bg-slate-100 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  Close Drawer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attachment preview popup (above the drawer) */}
      {selectedTicket && isAttachmentPreviewOpen && attachmentViewUrl(selectedTicket) && (
        <div
          className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
          onClick={() => setIsAttachmentPreviewOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-200 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                  {isPdfName(selectedTicket.attachment_name) ? (
                    <FileText className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Paperclip className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
                    {selectedTicket.attachment_name || 'Attachment'}
                  </h3>
                  <p className="font-mono text-xs text-slate-500 truncate">
                    {selectedTicket.ticket_number} · {selectedTicket.venue_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={attachmentViewUrl(selectedTicket)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-2xs"
                  title="Open original file in new tab"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Open in New Tab</span>
                </a>
                {selectedTicket.attachment_id && (
                  <a
                    href={attachmentViewUrl(selectedTicket).replace('/view', '/download')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#021526] hover:bg-[#06243f] text-white text-xs font-bold transition-colors shadow-xs"
                    title="Download original file"
                  >
                    <Download className="h-3.5 w-3.5 text-[#F94001]" />
                    <span className="hidden sm:inline">Download</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setIsAttachmentPreviewOpen(false)}
                  className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors ml-1"
                  aria-label="Close preview"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center min-h-[400px] max-h-[70vh]">
              <DocumentPreview
                url={attachmentViewUrl(selectedTicket)}
                title={selectedTicket.attachment_name || 'Attachment'}
                imageClassName="max-h-[64vh] max-w-full object-contain rounded-lg shadow-xl"
                frameClassName="w-full h-[68vh] bg-white border-0 rounded-2xl"
              />
            </div>

            <div className="flex justify-end pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAttachmentPreviewOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
