'use client';

import React, { useState, useEffect } from 'react';
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
  ChevronDown,
} from 'lucide-react';
import { SupportTicketItem, VenueDetail } from '@/lib/mockData';
import { apiClient } from '@/lib/api';

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

  // In-Drawer Resolution State
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [notifyRequester, setNotifyRequester] = useState(true);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [isEditingResolution, setIsEditingResolution] = useState(false);

  // Modal State for Raising New Ticket (Simulating Venue Side or Admin Entry)
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [newTicketVenueId, setNewTicketVenueId] = useState('');
  const [newTicketPersonName, setNewTicketPersonName] = useState('');
  const [newTicketContact, setNewTicketContact] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState<SupportTicketItem['category']>('PAYMENT');
  const [newTicketPriority, setNewTicketPriority] = useState<SupportTicketItem['priority']>('HIGH');

  // Fetch live venues for filter dropdowns
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const res = await apiClient.get<VenueDetail[]>('/venues');
        if (res.data && Array.isArray(res.data)) {
          setVenues(res.data);
          if (res.data.length > 0) {
            setNewTicketVenueId(res.data[0].id);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch live venues for support helpdesk', err);
      }
    };
    fetchVenues();
  }, []);
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

  // Live Backend Sync
  const fetchLiveTickets = async () => {
    try {
      const res = await apiClient.get('/support');
      if (res.data && Array.isArray(res.data)) {
        setTickets(res.data);
      } else {
        setTickets([]);
      }
    } catch (e) {
      // Clean empty state
      setTickets([]);
    }
  };

  useEffect(() => {
    fetchLiveTickets();
    const interval = setInterval(fetchLiveTickets, 10000);
    return () => clearInterval(interval);
  }, []);

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

  // Action: Open Slide-out Drawer
  const handleOpenDrawer = (t: SupportTicketItem, startResolve: boolean = false) => {
    setSelectedTicket(t);
    setResolutionNotes(t.resolution_notes || '');
    setResolveError(null);
    setIsEditingResolution(startResolve || t.status !== 'RESOLVED');
  };

  // Action: Move to IN_PROGRESS
  const handleMoveToInProgress = async (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: 'IN_PROGRESS' } : t))
    );

    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status: 'IN_PROGRESS' });
    }

    try {
      await fetch(`http://localhost:4000/api/v1/support/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      });
    } catch (e) {}

    const t = tickets.find((item) => item.id === ticketId);
    setToastMessage({
      type: 'info',
      title: 'Ticket marked In Progress',
      description: `${t?.ticket_number || 'Ticket'} is now under active investigation by admin team.`,
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Action: Submit Resolution Directly in Slide-out Drawer (No popup modal!)
  const handleConfirmResolutionInDrawer = async () => {
    if (!selectedTicket) return;
    if (!resolutionNotes.trim()) {
      setResolveError('Resolution notes are mandatory before marking this ticket as resolved.');
      return;
    }

    const resolvedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const resolvedDate = new Date().toISOString().split('T')[0];
    const resolvedStamp = `${resolvedDate} ${resolvedTime}`;

    const updatedTicket: SupportTicketItem = {
      ...selectedTicket,
      status: 'RESOLVED',
      resolution_notes: resolutionNotes.trim(),
      resolved_at: resolvedStamp,
      resolved_by: 'Super Admin',
    };

    setTickets((prev) =>
      prev.map((t) => (t.id === selectedTicket.id ? updatedTicket : t))
    );

    setSelectedTicket(updatedTicket);
    setIsEditingResolution(false);

    try {
      await fetch(`http://localhost:4000/api/v1/support/${selectedTicket.id}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolution_notes: resolutionNotes.trim(),
          resolved_by: 'Super Admin',
          notify_requester: notifyRequester,
        }),
      });
    } catch (e) {}

    setToastMessage({
      type: 'success',
      title: 'Ticket Resolved Successfully',
      description: `Resolution notes logged for ${selectedTicket.ticket_number}. ${
        notifyRequester ? `Notification dispatched to ${selectedTicket.contact_number}.` : ''
      }`,
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Action: Reopen Ticket
  const handleReopenTicket = async (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: 'OPEN' } : t))
    );

    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status: 'OPEN' });
    }

    try {
      await fetch(`http://localhost:4000/api/v1/support/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'OPEN' }),
      });
    } catch (e) {}

    setToastMessage({
      type: 'info',
      title: 'Ticket Reopened',
      description: `Ticket status reverted to OPEN for further review.`,
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Action: Raise New Inbound Ticket
  const handleCreateNewTicket = async (e: React.FormEvent) => {
    e.preventDefault();
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

    const matchedVenue = venues.find((v) => v.id === newTicketVenueId) || venues[0];
    const newSupportId = `SUP-2026-${100 + tickets.length + 1}`;

    const newTicket: SupportTicketItem = {
      id: `tkt_${Date.now()}`,
      ticket_number: newSupportId,
      venue_id: matchedVenue?.id || 'NO_VENUE',
      venue_name: matchedVenue?.venue_name || 'General Support',
      created_person_name: newTicketPersonName.trim(),
      contact_number: newTicketContact.startsWith('+91') ? newTicketContact.trim() : `+91 ${newTicketContact.trim()}`,
      category: newTicketCategory,
      priority: newTicketPriority,
      subject: newTicketSubject.trim(),
      description: newTicketDescription.trim(),
      related_booking_code: newTicketBookingId.trim() || undefined,
      attachment_name: newTicketAttachmentName.trim() || undefined,
      attachment_url: newTicketAttachmentName.trim() ? '#' : undefined,
      status: 'OPEN',
      source: 'VENUE_APP',
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
      conversation: [
        {
          sender: 'VENUE',
          sender_name: newTicketPersonName.trim(),
          message: newTicketDescription.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };

    setTickets([newTicket, ...tickets]);
    setIsRaiseModalOpen(false);
    setRaiseError(null);

    // Call Backend Endpoint
    try {
      const res = await fetch('http://localhost:4000/api/v1/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venue_id: matchedVenue?.id || 'ven_1001',
          venue_name: matchedVenue?.venue_name || 'Sky Sports Arena',
          person_name: newTicketPersonName.trim(),
          contact_number: newTicketContact.trim(),
          category: newTicketCategory,
          priority: newTicketPriority,
          subject: newTicketSubject.trim(),
          description: newTicketDescription.trim(),
          booking_id: newTicketBookingId.trim() || undefined,
          attachment_name: newTicketAttachmentName.trim() || undefined,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setTickets((prev) => [created, ...prev.filter((t) => t.id !== newTicket.id)]);
      }
    } catch (e) {}

    // Reset Form
    setNewTicketPersonName('');
    setNewTicketContact('');
    setNewTicketSubject('');
    setNewTicketDescription('');
    setNewTicketBookingId('');
    setNewTicketAttachmentName('');

    setToastMessage({
      type: 'success',
      title: 'Inbound Support Ticket Raised',
      description: `${newSupportId} registered from ${matchedVenue.venue_name} under OPEN status.`,
    });
    setTimeout(() => setToastMessage(null), 4500);
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

  // Mounted guard — prevents browser extension hydration mismatch
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

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
                <th className="py-3 px-4 w-[130px]">Ticket ID</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4 w-[130px]">Category</th>
                <th className="py-3 px-4 w-[230px]">Venue &amp; Partner</th>
                <th className="py-3 px-4 w-[100px]">Priority</th>
                <th className="py-3 px-4 w-[130px]">Status</th>
                <th className="py-3 px-4 w-[105px]">Reported</th>
                <th className="py-3 px-4 w-[85px] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F4]">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-[#5F6368]">
                    <Headphones className="h-9 w-9 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-sm text-[#021526]">No support tickets match criteria</p>
                    <p className="text-xs text-[#5F6368] mt-0.5">Try selecting a different filter or clearing search keywords.</p>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => handleOpenDrawer(t, false)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
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
                      {t.created_at.split(' ')[0]}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-slate-400 group-hover:text-[#021526] transition-colors">
                        Details <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-[#021526] block truncate max-w-[260px]">
                          {selectedTicket.attachment_name}
                        </span>
                        <span className="text-[10px] text-[#5F6368]">Attached Verification Proof</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                      Verified
                    </span>
                  </div>
                )}

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

                    {selectedTicket.status === 'RESOLVED' && !isEditingResolution && (
                      <button
                        type="button"
                        onClick={() => setIsEditingResolution(true)}
                        className="text-[11px] font-bold text-slate-700 hover:text-[#F94001] bg-white border border-slate-200 rounded-lg px-2.5 py-1 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Edit Notes</span>
                      </button>
                    )}
                  </div>

                  {/* Read-only notes display when resolved */}
                  {selectedTicket.status === 'RESOLVED' && !isEditingResolution ? (
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
                              + {preset.split(' ')[0]} {preset.split(' ')[1]} {preset.split(' ')[2]}
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
                          Dispatch automated resolution update to +91 {selectedTicket.contact_number}
                        </span>
                      </label>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleConfirmResolutionInDrawer}
                          className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Check className="h-4 w-4" />
                          <span>Mark as Resolved &amp; Update</span>
                        </button>
                        {selectedTicket.status === 'RESOLVED' && (
                          <button
                            type="button"
                            onClick={() => setIsEditingResolution(false)}
                            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
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
    </div>
  );
}
