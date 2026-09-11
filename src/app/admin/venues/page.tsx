'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  ExternalLink,
  Eye,
  X,
  User,
  Trophy,
  CalendarCheck,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  ArrowUpDown,
  Copy,
  Check,
  Landmark,
  Activity,
  AlertCircle,
  Power,
  Wrench,
  ChevronDown,
} from 'lucide-react';
import {
  INITIAL_VENUES,
  INITIAL_BOOKINGS,
  VenueDetail,
} from '@/lib/mockData';

export default function VenuesManagementPage() {
  const [venues, setVenues] = useState<VenueDetail[]>(INITIAL_VENUES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedSport, setSelectedSport] = useState('ALL');
  const [sortBy, setSortBy] = useState<'bookings' | 'revenue' | 'courts' | 'name' | 'id'>('bookings');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<'state' | 'status' | 'sport' | 'sort' | null>(null);
  const [rowStatusMenuVenueId, setRowStatusMenuVenueId] = useState<string | null>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown-container]')) {
        setOpenDropdown(null);
      }
      if (!target.closest('[data-status-menu-container]')) {
        setRowStatusMenuVenueId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load converted live venues from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('ibooksports_live_venues');
        if (stored) {
          const parsed: VenueDetail[] = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const existingIds = new Set(parsed.map((p) => p.id));
            setVenues([...parsed, ...INITIAL_VENUES.filter((v) => !existingIds.has(v.id))]);
          }
        }
      } catch (err) {
        console.error('Failed to load live venues from local storage', err);
      }
    }
  }, []);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Toggle venue status (Active <-> Inactive <-> Maintenance)
  const handleUpdateVenueStatus = (venueId: string, newStatus: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE') => {
    setVenues((prev) => {
      const updated = prev.map((v) => (v.id === venueId ? { ...v, status: newStatus } : v));
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('ibooksports_live_venues', JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
      }
      return updated;
    });

    const label = newStatus === 'ACTIVE' ? 'Active' : newStatus === 'INACTIVE' ? 'Inactive' : 'Maintenance';
    setStatusNotification(`Venue status successfully updated to "${label}"`);
    setTimeout(() => setStatusNotification(null), 3500);
  };

  // Extract all unique states with venue counts
  const stateCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    venues.forEach((v) => {
      const st = v.state || 'Other';
      counts[st] = (counts[st] || 0) + 1;
    });
    return counts;
  }, [venues]);

  const uniqueStates = useMemo(() => {
    return Object.keys(stateCounts).sort();
  }, [stateCounts]);

  // Extract status counts
  const statusCounts = useMemo(() => {
    const counts = { ACTIVE: 0, INACTIVE: 0, MAINTENANCE: 0, ALL: venues.length };
    venues.forEach((v) => {
      if (v.status === 'INACTIVE') counts.INACTIVE += 1;
      else if (v.status === 'MAINTENANCE') counts.MAINTENANCE += 1;
      else counts.ACTIVE += 1;
    });
    return counts;
  }, [venues]);

  // Extract unique sports
  const uniqueSports = useMemo(() => {
    const sportsSet = new Set<string>();
    venues.forEach((v) => {
      if (v.sports_list && Array.isArray(v.sports_list)) {
        v.sports_list.forEach((s) => sportsSet.add(s.trim()));
      } else if (v.sports) {
        v.sports.split(',').forEach((s) => sportsSet.add(s.trim()));
      }
    });
    return Array.from(sportsSet).sort();
  }, [venues]);

  // Filter and Sort venues
  const filteredVenues = useMemo(() => {
    return venues
      .filter((v) => {
        const query = searchQuery.toLowerCase().trim();
        const formattedId = v.id.startsWith('ven_') ? `VEN-${v.id.replace('ven_', '')}` : v.id;
        
        const matchesQuery =
          !query ||
          v.venue_name.toLowerCase().includes(query) ||
          formattedId.toLowerCase().includes(query) ||
          v.id.toLowerCase().includes(query) ||
          v.address.toLowerCase().includes(query) ||
          v.district.toLowerCase().includes(query) ||
          v.state.toLowerCase().includes(query) ||
          v.name.toLowerCase().includes(query) ||
          String(v.mobile_number).includes(query) ||
          (v.staff_name && v.staff_name.toLowerCase().includes(query)) ||
          (v.staff_contact && v.staff_contact.includes(query));

        const matchesState = selectedState === 'ALL' || v.state.toLowerCase() === selectedState.toLowerCase();
        
        const matchesStatus =
          selectedStatus === 'ALL' ||
          (selectedStatus === 'ACTIVE' && (v.status === 'ACTIVE' || !v.status)) ||
          (selectedStatus === 'INACTIVE' && v.status === 'INACTIVE') ||
          (selectedStatus === 'MAINTENANCE' && v.status === 'MAINTENANCE');

        const matchesSport =
          selectedSport === 'ALL' ||
          (v.sports_list && v.sports_list.some((s) => s.toLowerCase() === selectedSport.toLowerCase())) ||
          (v.sports && v.sports.toLowerCase().includes(selectedSport.toLowerCase()));

        return matchesQuery && matchesState && matchesStatus && matchesSport;
      })
      .sort((a, b) => {
        if (sortBy === 'bookings') {
          return (b.today_bookings_count || 0) - (a.today_bookings_count || 0);
        }
        if (sortBy === 'revenue') {
          return (b.today_booking_revenue || 0) - (a.today_booking_revenue || 0);
        }
        if (sortBy === 'courts') {
          return (b.courts || 0) - (a.courts || 0);
        }
        if (sortBy === 'name') {
          return a.venue_name.localeCompare(b.venue_name);
        }
        if (sortBy === 'id') {
          return a.id.localeCompare(b.id);
        }
        return 0;
      });
  }, [venues, searchQuery, selectedState, selectedStatus, selectedSport, sortBy]);

  // Global KPIs calculated from all venues
  const totalLiveVenues = venues.length;
  const activeVenuesCount = statusCounts.ACTIVE;
  const inactiveVenuesCount = statusCounts.INACTIVE;
  const totalCourts = venues.reduce((acc, v) => acc + (v.courts || (v.court_list ? v.court_list.length : 0)), 0);
  const totalTodayBookings = venues.reduce((acc, v) => acc + (v.status === 'ACTIVE' ? (v.today_bookings_count || 12) : 0), 0);
  const totalTodayRevenue = venues.reduce((acc, v) => acc + (v.status === 'ACTIVE' ? (v.today_booking_revenue || 15000) : 0), 0);

  // Helper for formatted venue ID
  const formatVenueId = (id: string) => {
    if (id.startsWith('ven_')) {
      return `VEN-${id.replace('ven_', '')}`;
    }
    return id.toUpperCase();
  };

  // Shorten staff role cleanly
  const formatShortRole = (role?: string) => {
    if (!role) return 'Manager';
    if (role.toLowerCase().includes('incharge')) return 'Incharge';
    if (role.toLowerCase().includes('manager')) return 'Manager';
    if (role.toLowerCase().includes('supervisor')) return 'Supervisor';
    if (role.toLowerCase().includes('director')) return 'Director';
    return role.split(' ')[0];
  };

  const isAnyFilterActive = searchQuery || selectedState !== 'ALL' || selectedStatus !== 'ALL' || selectedSport !== 'ALL';

  return (
    <div className="animate-in fade-in duration-200 space-y-4 max-w-[1600px] mx-auto">
      {/* 1. MINIMAL HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-display">
              Venue Management
            </h1>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-bold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {activeVenuesCount} Active &bull; {inactiveVenuesCount} Inactive
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational turf directory &bull; Filter by state, live active/inactive status, sports, and view real-time booking performance.
          </p>
        </div>

        {/* Action button */}
        <Link
          href="/admin/onboarding"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#F94001] hover:bg-[#E03800] text-white px-3.5 py-2 text-xs font-bold shadow-xs active:scale-98 transition-all shrink-0 self-start sm:self-auto"
        >
          <span>+ Onboard Partner Turf</span>
        </Link>
      </div>

      {/* STATUS NOTIFICATION TOAST */}
      {statusNotification && (
        <div className="p-3 bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{statusNotification}</span>
          </div>
          <button type="button" onClick={() => setStatusNotification(null)} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 2. SLEEK MINIMAL KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Venues & Status */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium">
            <span>Registered Venues</span>
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 font-mono">{totalLiveVenues}</span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60">
              {activeVenuesCount} Active
            </span>
            {inactiveVenuesCount > 0 && (
              <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200/60">
                {inactiveVenuesCount} Inactive
              </span>
            )}
          </div>
        </div>

        {/* Metric 2: Pitches & Courts */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium">
            <span>Pitches & Courts</span>
            <Trophy className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 font-mono">{totalCourts}</span>
            <span className="text-[10px] font-medium text-slate-500">{uniqueSports.length} Sports Covered</span>
          </div>
        </div>

        {/* Metric 3: Today's Bookings */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium">
            <span>Today&apos;s Bookings</span>
            <CalendarCheck className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-black text-emerald-700 font-mono">{totalTodayBookings}</span>
            <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">Active Arenas</span>
          </div>
        </div>

        {/* Metric 4: Today's Revenue */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium">
            <span>Today&apos;s Gross GMV</span>
            <DollarSign className="h-3.5 w-3.5 text-[#F94001]" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 font-mono">₹{totalTodayRevenue.toLocaleString('en-IN')}</span>
            <span className="text-[10px] font-medium text-slate-500">Live Turnover</span>
          </div>
        </div>
      </div>

      {/* 3. BEST STATE & STATUS DROPDOWNS & FILTER TOOLBAR */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs space-y-3">
        {/* Row 1: Search & Quick Status Switcher Segmented Pills */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Live Search Input - fixed icon position with proper padding */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search venue ID, name, city, district, owner, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 rounded-xl bg-slate-50/70 border border-slate-200 pl-10 pr-9 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#F94001] focus:ring-1 focus:ring-[#F94001] transition-all outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick 1-Click Status Segmented Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/70 self-start md:self-auto shrink-0 overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setSelectedStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedStatus === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All ({venues.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('ACTIVE')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedStatus === 'ACTIVE'
                  ? 'bg-white text-emerald-700 shadow-2xs font-bold ring-1 ring-emerald-500/20'
                  : 'text-slate-500 hover:text-emerald-700'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active ({statusCounts.ACTIVE})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('INACTIVE')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedStatus === 'INACTIVE'
                  ? 'bg-white text-rose-700 shadow-2xs font-bold ring-1 ring-rose-500/20'
                  : 'text-slate-500 hover:text-rose-700'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              Inactive ({statusCounts.INACTIVE})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('MAINTENANCE')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedStatus === 'MAINTENANCE'
                  ? 'bg-white text-amber-700 shadow-2xs font-bold ring-1 ring-amber-500/20'
                  : 'text-slate-500 hover:text-amber-700'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Maintenance ({statusCounts.MAINTENANCE})
            </button>
          </div>
        </div>

        {/* Row 2: BEST CUSTOM DROPDOWNS: State + Status + Sport + Sort */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {/* BEST STATE DROPDOWN */}
            <div className="relative min-w-[170px]" data-dropdown-container>
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'state' ? null : 'state')}
                className={`w-full h-9.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer shadow-2xs ${
                  selectedState !== 'ALL'
                    ? 'border-[#F94001] bg-[#FFF8F5] text-[#F94001] ring-1 ring-[#F94001]/20'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                }`}
              >
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className={`h-3.5 w-3.5 shrink-0 ${selectedState !== 'ALL' ? 'text-[#F94001]' : 'text-slate-400'}`} />
                <span className="truncate">
                  {selectedState === 'ALL' ? 'State: All States' : selectedState}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                  {selectedState === 'ALL' ? venues.length : stateCounts[selectedState] || 0}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${openDropdown === 'state' ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* State Popover */}
            {openDropdown === 'state' && (
              <div className="absolute left-0 top-full mt-1.5 w-60 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl z-50 p-1.5 text-xs animate-in fade-in slide-in-from-top-1">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Filter by State</div>
                <button
                  type="button"
                  onClick={() => { setSelectedState('ALL'); setOpenDropdown(null); }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                    selectedState === 'ALL' ? 'bg-[#FFF1EC] text-[#F94001] font-bold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-slate-300" />
                    All States
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 font-semibold text-slate-600">{venues.length}</span>
                </button>

                <div className="my-1 border-t border-slate-100" />

                {uniqueStates.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => { setSelectedState(st); setOpenDropdown(null); }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                      selectedState.toLowerCase() === st.toLowerCase()
                        ? 'bg-[#FFF1EC] text-[#F94001] font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <span>{st}</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 font-semibold text-slate-600">
                      {stateCounts[st]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* BEST STATUS DROPDOWN */}
          <div className="relative min-w-[170px]" data-dropdown-container>
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
              className={`w-full h-9.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer shadow-2xs ${
                selectedStatus !== 'ALL'
                  ? selectedStatus === 'ACTIVE'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-800 ring-1 ring-emerald-400/30'
                    : selectedStatus === 'INACTIVE'
                    ? 'border-rose-300 bg-rose-50/70 text-rose-800 ring-1 ring-rose-300/30'
                    : 'border-amber-400 bg-amber-50/70 text-amber-800 ring-1 ring-amber-400/30'
                  : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                {selectedStatus === 'ACTIVE' && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
                {selectedStatus === 'INACTIVE' && <span className="h-2 w-2 rounded-full bg-rose-500" />}
                {selectedStatus === 'MAINTENANCE' && <span className="h-2 w-2 rounded-full bg-amber-500" />}
                {selectedStatus === 'ALL' && <Activity className="h-3.5 w-3.5 text-slate-400" />}
                <span className="truncate">
                  {selectedStatus === 'ALL' ? 'Status: All Statuses' : selectedStatus === 'ACTIVE' ? 'Active Venues' : selectedStatus === 'INACTIVE' ? 'Inactive Venues' : 'Maintenance'}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                  {selectedStatus === 'ALL' ? venues.length : statusCounts[selectedStatus as keyof typeof statusCounts] || 0}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${openDropdown === 'status' ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Status Popover */}
            {openDropdown === 'status' && (
              <div className="absolute left-0 top-full mt-1.5 w-56 rounded-xl border border-slate-200 bg-white shadow-xl z-50 p-1.5 text-xs animate-in fade-in slide-in-from-top-1">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Filter by Status</div>
                
                {/* All */}
                <button
                  type="button"
                  onClick={() => { setSelectedStatus('ALL'); setOpenDropdown(null); }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                    selectedStatus === 'ALL' ? 'bg-slate-100 font-bold text-slate-900' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                    All Statuses
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 font-semibold text-slate-600">{venues.length}</span>
                </button>

                {/* Active */}
                <button
                  type="button"
                  onClick={() => { setSelectedStatus('ACTIVE'); setOpenDropdown(null); }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                    selectedStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Active Arenas
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">{statusCounts.ACTIVE}</span>
                </button>

                {/* Inactive */}
                <button
                  type="button"
                  onClick={() => { setSelectedStatus('INACTIVE'); setOpenDropdown(null); }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                    selectedStatus === 'INACTIVE' ? 'bg-rose-50 text-rose-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    Inactive Arenas
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-bold">{statusCounts.INACTIVE}</span>
                </button>

                {/* Maintenance */}
                <button
                  type="button"
                  onClick={() => { setSelectedStatus('MAINTENANCE'); setOpenDropdown(null); }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                    selectedStatus === 'MAINTENANCE' ? 'bg-amber-50 text-amber-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Under Maintenance
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">{statusCounts.MAINTENANCE}</span>
                </button>
              </div>
            )}
          </div>

          {/* SPORT DROPDOWN */}
          <div className="relative min-w-[150px]" data-dropdown-container>
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'sport' ? null : 'sport')}
              className={`w-full h-9.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer shadow-2xs ${
                selectedSport !== 'ALL'
                  ? 'border-[#F94001] bg-[#FFF8F5] text-[#F94001] ring-1 ring-[#F94001]/20'
                  : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Trophy className={`h-3.5 w-3.5 shrink-0 ${selectedSport !== 'ALL' ? 'text-[#F94001]' : 'text-slate-400'}`} />
                <span className="truncate">
                  {selectedSport === 'ALL' ? 'Sport: All Sports' : selectedSport}
                </span>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform shrink-0 ${openDropdown === 'sport' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'sport' && (
              <div className="absolute left-0 top-full mt-1.5 w-52 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl z-50 p-1.5 text-xs animate-in fade-in slide-in-from-top-1">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Filter by Sport</div>
                <button
                  type="button"
                  onClick={() => { setSelectedSport('ALL'); setOpenDropdown(null); }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                    selectedSport === 'ALL' ? 'bg-[#FFF1EC] text-[#F94001] font-bold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>All Sports</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 font-semibold text-slate-600">{uniqueSports.length}</span>
                </button>
                <div className="my-1 border-t border-slate-100" />
                {uniqueSports.map((sp) => (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => { setSelectedSport(sp); setOpenDropdown(null); }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                      selectedSport.toLowerCase() === sp.toLowerCase() ? 'bg-[#FFF1EC] text-[#F94001] font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{sp}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SORT DROPDOWN */}
          <div className="relative min-w-[170px]" data-dropdown-container>
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
              className="w-full h-9.5 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 hover:border-slate-300 flex items-center justify-between gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-1.5 truncate">
                <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">
                  {sortBy === 'bookings'
                    ? 'Sort: Bookings'
                    : sortBy === 'revenue'
                    ? 'Sort: Revenue'
                    : sortBy === 'courts'
                    ? 'Sort: Courts Count'
                    : sortBy === 'name'
                    ? 'Sort: Name (A-Z)'
                    : 'Sort: Venue ID'}
                </span>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform shrink-0 ${openDropdown === 'sort' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'sort' && (
              <div className="absolute left-0 top-full mt-1.5 w-52 rounded-xl border border-slate-200 bg-white shadow-xl z-50 p-1.5 text-xs animate-in fade-in slide-in-from-top-1">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Order by</div>
                {[
                  { key: 'bookings', label: "Today's Bookings" },
                  { key: 'revenue', label: "Today's Revenue" },
                  { key: 'courts', label: 'Courts Count' },
                  { key: 'name', label: 'Venue Name (A-Z)' },
                  { key: 'id', label: 'Venue ID' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => { setSortBy(item.key as any); setOpenDropdown(null); }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                      sortBy === item.key ? 'bg-slate-100 font-bold text-slate-900' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{item.label}</span>
                    {sortBy === item.key && <Check className="h-3 w-3 text-[#F94001]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RESET ALL BUTTON */}
          {isAnyFilterActive && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedState('ALL');
                setSelectedStatus('ALL');
                setSelectedSport('ALL');
              }}
              className="h-9.5 px-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              title="Reset all filters"
            >
              <X className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}
          </div>

          <div className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 shrink-0">
            Showing <strong className="text-slate-900">{filteredVenues.length}</strong> of {venues.length} venues
          </div>
        </div>

        {/* Active Filters Tag Summary */}
        {isAnyFilterActive && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-100 text-xs text-slate-500">
            <span className="text-[11px] font-medium text-slate-400">Active Filters:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-semibold border border-slate-200">
                &ldquo;{searchQuery}&rdquo;
                <button type="button" onClick={() => setSearchQuery('')} className="hover:text-rose-600 cursor-pointer">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedState !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#FFF1EC] text-[#F94001] text-[11px] font-semibold border border-[#F94001]/20">
                State: {selectedState}
                <button type="button" onClick={() => setSelectedState('ALL')} className="hover:text-rose-600 cursor-pointer">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedStatus !== 'ALL' && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                selectedStatus === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : selectedStatus === 'INACTIVE'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                Status: {selectedStatus}
                <button type="button" onClick={() => setSelectedStatus('ALL')} className="hover:text-rose-600 cursor-pointer">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedSport !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-semibold border border-slate-200">
                Sport: {selectedSport}
                <button type="button" onClick={() => setSelectedSport('ALL')} className="hover:text-rose-600 cursor-pointer">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* 4. PERFECT MINIMAL VENUES DATA TABLE */}
      <div className="rounded-xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/90 bg-slate-50/75 text-slate-500 font-semibold tracking-wider text-[11px] uppercase select-none">
                <th className="py-3 px-3.5 w-[105px]">Venue ID</th>
                <th className="py-3 px-3.5 min-w-[220px]">Venue Name & Location</th>
                <th className="py-3 px-3.5 min-w-[150px]">Owner Contact</th>
                <th className="py-3 px-3.5 min-w-[140px]">Courts & Sports</th>
                <th className="py-3 px-3.5 min-w-[160px]">Today&apos;s Performance</th>
                <th className="py-3 px-3.5 min-w-[125px]">Status</th>
                <th className="py-3 px-3.5 text-center w-[75px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVenues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-xs text-slate-700">No matching venues found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting your search keyword, state, or status filter</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedState('ALL');
                        setSelectedStatus('ALL');
                        setSelectedSport('ALL');
                      }}
                      className="mt-2.5 px-3 py-1.5 rounded-lg bg-[#F94001] hover:bg-[#E03800] text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredVenues.map((v) => {
                  const displayId = formatVenueId(v.id);
                  const isCopied = copiedId === v.id;
                  const ownerPhone = v.owner?.phone || `+91 ${v.mobile_number}`;
                  const ownerName = v.owner?.full_name || v.name;
                  const isLiveActive = v.status === 'ACTIVE' || !v.status;
                  const isInactive = v.status === 'INACTIVE';
                  const isMaintenance = v.status === 'MAINTENANCE';
                  const todayCount = isLiveActive ? (v.today_bookings_count || 12) : 0;
                  const todayRevenue = isLiveActive ? (v.today_booking_revenue || (todayCount * 1300)) : 0;
                  const occupancy = isLiveActive ? (v.today_slot_occupancy_percent || 85) : 0;

                  // Clean sports list string
                  const sportsStr = (v.sports_list || v.sports.split(','))
                    .map((s) => s.trim())
                    .join(', ');

                  return (
                    <tr
                      key={v.id}
                      className={`hover:bg-slate-50/80 transition-colors group ${
                        isInactive ? 'bg-slate-50/40 text-slate-600' : ''
                      }`}
                    >
                      {/* 1. VENUE ID */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/80">
                            {displayId}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(displayId, v.id)}
                            className="text-slate-400 hover:text-slate-700 transition-colors p-0.5 cursor-pointer"
                            title="Copy ID"
                          >
                            {isCopied ? <Check className="h-2.5 w-2.5 text-emerald-600" /> : <Copy className="h-2.5 w-2.5" />}
                          </button>
                        </div>
                      </td>

                      {/* 2. VENUE NAME & LOCATION */}
                      <td className="py-3 px-3.5 align-middle">
                        <div className="space-y-0.5">
                          <Link
                            href={`/admin/venues/${v.id}`}
                            className="font-bold text-slate-900 text-xs tracking-tight group-hover:text-[#F94001] transition-colors line-clamp-1 block cursor-pointer"
                          >
                            {v.venue_name}
                          </Link>

                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[140px]">{v.district}</span>
                            <span className="text-slate-300">&bull;</span>
                            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200/60">
                              {v.state}
                            </span>
                            {v.venue_location_name && (
                              <a
                                href={v.venue_location_name}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-400 hover:text-[#F94001] transition-colors"
                                title="Open GPS Map"
                              >
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 3. OWNER CONTACT */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                        <div className="space-y-0.5">
                          <p className="font-medium text-slate-900 text-xs truncate max-w-[150px] flex items-center gap-1">
                            <User className="h-3 w-3 text-slate-400 shrink-0" />
                            {ownerName}
                          </p>
                          <p className="font-mono text-[11px] text-slate-500">
                            <a
                              href={`tel:${ownerPhone.replace(/\s+/g, '')}`}
                              className="hover:text-[#F94001] transition-colors flex items-center gap-1 font-mono"
                            >
                              <Phone className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
                              {ownerPhone}
                            </a>
                          </p>
                        </div>
                      </td>

                      {/* 4. COURTS & SPORTS */}
                      <td className="py-3 px-3.5 align-middle">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                            <Trophy className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>{v.courts} {v.courts === 1 ? 'Court' : 'Courts'}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate max-w-[150px]" title={sportsStr}>
                            {sportsStr}
                          </p>
                        </div>
                      </td>

                      {/* 5. TODAY'S PERFORMANCE */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                        {isLiveActive ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-slate-900">
                                ₹{todayRevenue.toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded">
                                {todayCount} bks
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                              <div className="w-14 h-1.5 rounded-full bg-slate-100 overflow-hidden shrink-0">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${Math.min(occupancy, 100)}%` }}
                                />
                              </div>
                              <span className="font-mono font-medium">{occupancy}%</span>
                            </div>
                          </div>
                        ) : isInactive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200/60 text-[10px] font-semibold">
                            <span className="h-1 w-1 rounded-full bg-rose-500" />
                            Offline &bull; Inactive
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/60 text-[10px] font-semibold">
                            <span className="h-1 w-1 rounded-full bg-amber-500" />
                            Under Renovation
                          </span>
                        )}
                      </td>

                      {/* 6. STATUS (INTERACTIVE BADGE BEFORE ACTION) */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap" data-status-menu-container>
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={() => setRowStatusMenuVenueId(rowStatusMenuVenueId === v.id ? null : v.id)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer shadow-2xs ${
                              isLiveActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100/70'
                                : isInactive
                                ? 'bg-rose-50 text-rose-700 border-rose-200/80 hover:bg-rose-100/70'
                                : 'bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100/70'
                            }`}
                            title="Click to change status"
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isLiveActive ? 'bg-emerald-500 animate-pulse' : isInactive ? 'bg-rose-500' : 'bg-amber-500'
                              }`}
                            />
                            <span>{isLiveActive ? 'Active' : isInactive ? 'Inactive' : 'Maintenance'}</span>
                            <ChevronDown className="h-2.5 w-2.5 opacity-60 ml-0.5" />
                          </button>

                          {/* Quick Row Status Popover */}
                          {rowStatusMenuVenueId === v.id && (
                            <div className="absolute right-0 top-full mt-1 w-36 rounded-xl border border-slate-200 bg-white shadow-xl z-40 p-1 text-xs animate-in fade-in slide-in-from-top-1">
                              <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">Set Status</div>
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateVenueStatus(v.id, 'ACTIVE');
                                  setRowStatusMenuVenueId(null);
                                }}
                                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-[11px] font-semibold transition-colors cursor-pointer ${
                                  isLiveActive ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <span>Active</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateVenueStatus(v.id, 'INACTIVE');
                                  setRowStatusMenuVenueId(null);
                                }}
                                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-[11px] font-semibold transition-colors cursor-pointer ${
                                  isInactive ? 'bg-rose-50 text-rose-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                <span>Inactive</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateVenueStatus(v.id, 'MAINTENANCE');
                                  setRowStatusMenuVenueId(null);
                                }}
                                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-[11px] font-semibold transition-colors cursor-pointer ${
                                  isMaintenance ? 'bg-amber-50 text-amber-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                <span>Maintenance</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 7. ACTION (EYE ICON -> DEDICATED MODULAR OVERVIEW SCREEN) */}
                      <td className="py-3 px-3.5 align-middle text-center whitespace-nowrap">
                        <Link
                          href={`/admin/venues/${v.id}`}
                          className="h-7.5 w-7.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-[#F94001] hover:border-[#F94001]/40 hover:bg-[#FFF1EC] transition-all inline-flex items-center justify-center cursor-pointer shadow-2xs"
                          title="Open Dedicated Modular Overview Screen"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
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
