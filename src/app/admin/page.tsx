'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  CreditCard,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
  Trophy,
  Activity,
  Flame,
  Layers,
  Percent,
  Download,
  CalendarDays,
  Sparkles,
  MapPin,
  ExternalLink,
  Receipt,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { INITIAL_BOOKINGS, INITIAL_PAYMENTS, INITIAL_VENUES } from '@/lib/mockData';

type TimeHorizon = 'day' | 'week' | 'month' | 'year';

interface ChartDataPoint {
  label: string;
  gross: number;
  online: number;
  cash: number;
  bookings: number;
}

interface HorizonDataset {
  periodLabel: string;
  totalGross: number;
  totalOnline: number;
  totalCash: number;
  totalBookings: number;
  growthPercentage: number;
  points: ChartDataPoint[];
}

export default function AdminDashboardPage() {
  const [horizon, setHorizon] = useState<TimeHorizon>('week');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Dynamic telemetry datasets for Day, Week, Month, Year
  const datasets: Record<TimeHorizon, HorizonDataset> = useMemo(
    () => ({
      day: {
        periodLabel: 'Today (Past 24 Hours)',
        totalGross: 37200,
        totalOnline: 25400,
        totalCash: 11800,
        totalBookings: 34,
        growthPercentage: 14.8,
        points: [
          { label: '06:00', gross: 2400, online: 1600, cash: 800, bookings: 2 },
          { label: '09:00', gross: 3800, online: 2600, cash: 1200, bookings: 3 },
          { label: '12:00', gross: 4200, online: 3000, cash: 1200, bookings: 4 },
          { label: '15:00', gross: 5600, online: 3800, cash: 1800, bookings: 5 },
          { label: '18:00', gross: 8400, online: 5800, cash: 2600, bookings: 8 },
          { label: '21:00', gross: 9600, online: 6400, cash: 3200, bookings: 9 },
          { label: '23:00', gross: 3200, online: 2200, cash: 1000, bookings: 3 },
        ],
      },
      week: {
        periodLabel: 'Past 7 Days (Rolling Week)',
        totalGross: 310000,
        totalOnline: 215000,
        totalCash: 95000,
        totalBookings: 241,
        growthPercentage: 18.4,
        points: [
          { label: 'Mon', gross: 24500, online: 16500, cash: 8000, bookings: 18 },
          { label: 'Tue', gross: 28200, online: 19200, cash: 9000, bookings: 21 },
          { label: 'Wed', gross: 31000, online: 21500, cash: 9500, bookings: 24 },
          { label: 'Thu', gross: 36800, online: 25600, cash: 11200, bookings: 28 },
          { label: 'Fri', gross: 48500, online: 33500, cash: 15000, bookings: 38 },
          { label: 'Sat', gross: 68400, online: 47800, cash: 20600, bookings: 54 },
          { label: 'Sun', gross: 72600, online: 50900, cash: 21700, bookings: 58 },
        ],
      },
      month: {
        periodLabel: 'Current Month (30 Days)',
        totalGross: 1360000,
        totalOnline: 946000,
        totalCash: 414000,
        totalBookings: 1065,
        growthPercentage: 22.1,
        points: [
          { label: 'Week 1', gross: 285000, online: 198000, cash: 87000, bookings: 220 },
          { label: 'Week 2', gross: 315000, online: 218000, cash: 97000, bookings: 245 },
          { label: 'Week 3', gross: 340000, online: 238000, cash: 102000, bookings: 268 },
          { label: 'Week 4', gross: 420000, online: 292000, cash: 128000, bookings: 332 },
        ],
      },
      year: {
        periodLabel: 'Annual Performance (12 Months)',
        totalGross: 16230000,
        totalOnline: 11290000,
        totalCash: 4940000,
        totalBookings: 12860,
        growthPercentage: 34.6,
        points: [
          { label: 'Jan', gross: 980000, online: 680000, cash: 300000, bookings: 780 },
          { label: 'Feb', gross: 1040000, online: 720000, cash: 320000, bookings: 830 },
          { label: 'Mar', gross: 1180000, online: 820000, cash: 360000, bookings: 940 },
          { label: 'Apr', gross: 1250000, online: 870000, cash: 380000, bookings: 990 },
          { label: 'May', gross: 1420000, online: 990000, cash: 430000, bookings: 1120 },
          { label: 'Jun', gross: 1380000, online: 960000, cash: 420000, bookings: 1080 },
          { label: 'Jul', gross: 1290000, online: 900000, cash: 390000, bookings: 1020 },
          { label: 'Aug', gross: 1340000, online: 930000, cash: 410000, bookings: 1060 },
          { label: 'Sep', gross: 1480000, online: 1030000, cash: 450000, bookings: 1170 },
          { label: 'Oct', gross: 1520000, online: 1060000, cash: 460000, bookings: 1210 },
          { label: 'Nov', gross: 1610000, online: 1120000, cash: 490000, bookings: 1280 },
          { label: 'Dec', gross: 1740000, online: 1210000, cash: 530000, bookings: 1380 },
        ],
      },
    }),
    []
  );

  const currentData = datasets[horizon];

  // SVG Chart Geometry Calculations
  const chartWidth = 700;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 30;

  const pointsCount = currentData.points.length;
  const maxGross = Math.max(...currentData.points.map((p) => p.gross)) * 1.15 || 1;

  const coordinates = useMemo(() => {
    return currentData.points.map((pt, idx) => {
      const x =
        pointsCount === 1
          ? chartWidth / 2
          : paddingX + (idx / (pointsCount - 1)) * (chartWidth - paddingX * 2);
      const yGross =
        chartHeight - paddingY - (pt.gross / maxGross) * (chartHeight - paddingY * 2);
      const yOnline =
        chartHeight - paddingY - (pt.online / maxGross) * (chartHeight - paddingY * 2);
      const yCash =
        chartHeight - paddingY - (pt.cash / maxGross) * (chartHeight - paddingY * 2);
      return { x, yGross, yOnline, yCash, ...pt };
    });
  }, [currentData, pointsCount, maxGross]);

  // Construct SVG paths
  const grossPathD = useMemo(() => {
    if (coordinates.length === 0) return '';
    return coordinates.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x},${curr.yGross}` : `${acc} L ${curr.x},${curr.yGross}`;
    }, '');
  }, [coordinates]);

  const grossAreaD = useMemo(() => {
    if (coordinates.length === 0) return '';
    const firstX = coordinates[0].x;
    const lastX = coordinates[coordinates.length - 1].x;
    const bottomY = chartHeight - paddingY;
    return `${grossPathD} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;
  }, [coordinates, grossPathD]);

  const onlinePathD = useMemo(() => {
    if (coordinates.length === 0) return '';
    return coordinates.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x},${curr.yOnline}` : `${acc} L ${curr.x},${curr.yOnline}`;
    }, '');
  }, [coordinates]);

  const cashPathD = useMemo(() => {
    if (coordinates.length === 0) return '';
    return coordinates.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x},${curr.yCash}` : `${acc} L ${curr.x},${curr.yCash}`;
    }, '');
  }, [coordinates]);

  // Selected or active hover point
  const activePoint =
    hoveredIndex !== null && coordinates[hoveredIndex]
      ? coordinates[hoveredIndex]
      : coordinates[coordinates.length - 1];

  // Sport distribution breakdown
  const sportsBreakdown = [
    { name: 'Box Cricket', share: 42, amount: '₹1.30L', color: 'bg-[#F94001]', textColor: 'text-[#F94001]' },
    { name: 'Football Turf', share: 31, amount: '₹96.1K', color: 'bg-emerald-500', textColor: 'text-emerald-600' },
    { name: 'Badminton', share: 18, amount: '₹55.8K', color: 'bg-blue-500', textColor: 'text-blue-600' },
    { name: 'Pickleball', share: 9, amount: '₹27.9K', color: 'bg-purple-500', textColor: 'text-purple-600' },
  ];

  // Payment method breakdown (UPI, Card, Net Banking pure text)
  const paymentMethods = [
    { name: 'UPI', share: 64, count: '154 Bookings', color: 'bg-purple-600' },
    { name: 'Card', share: 26, count: '63 Bookings', color: 'bg-blue-600' },
    { name: 'Net Banking', share: 10, count: '24 Bookings', color: 'bg-emerald-600' },
  ];

  // Top Venues Ranking
  const topVenues = [
    {
      name: 'Sky Sports Arena & Box Turf',
      city: 'Coimbatore, Tamil Nadu',
      occupancy: 94,
      revenue: '₹1.42L',
      courts: '3 Pitches',
      badge: 'TOP ARENA',
    },
    {
      name: 'Green Field Sports Park',
      city: 'Chennai, Tamil Nadu',
      occupancy: 86,
      revenue: '₹98.5K',
      courts: '2 Pitches',
      badge: 'HIGH OCCUPANCY',
    },
    {
      name: 'Apex Arena & Sports Club',
      city: 'Bengaluru, Karnataka',
      occupancy: 78,
      revenue: '₹69.5K',
      courts: '2 Pitches',
      badge: 'STEADY',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-[1440px] mx-auto pb-12 font-sans">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & COMMAND CENTER BANNER */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-[#F94001] bg-[#FFF1EC] px-3 py-1 rounded-full mb-2 border border-[#F94001]/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F94001] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F94001]" />
            </span>
            <span>iBookSports Command Center &bull; Live Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#021526] font-display">
            Executive Arena &amp; Revenue Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6368] mt-1 font-medium">
            Real-time court reservations, cash &amp; online collection telemetry, payout disbursals, and venue capacity.
          </p>
        </div>

        {/* Action Controls on Top Right */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs">
            <CalendarDays className="h-3.5 w-3.5 text-[#F94001]" />
            <span>Updated Today</span>
          </div>

          <Link
            href="/admin/bookings"
            className="inline-flex items-center gap-2 rounded-xl bg-[#021526] hover:bg-[#F94001] text-white px-4 py-2 text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Manage Bookings</span>
          </Link>

          <Link
            href="/admin/settlements"
            className="inline-flex items-center gap-2 rounded-xl bg-[#F94001] hover:bg-[#D93600] text-white px-4 py-2 text-xs font-bold shadow-md shadow-[#F94001]/20 transition-all active:scale-95"
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>T+2 Settlements</span>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CORE KPI METRICS (6 COMPREHENSIVE REVENUE & CAPACITY CARDS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Metric 1: Total Gross Revenue */}
        <div className="rounded-2xl bg-white p-4 border border-[#E5E7EB] shadow-2xs hover:shadow-md hover:border-slate-300 transition-all space-y-2 group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Total Revenue
            </span>
            <div className="h-7 w-7 rounded-lg bg-[#FFF1EC] text-[#F94001] flex items-center justify-center font-bold text-xs">
              ₹
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-[#021526] font-mono tracking-tight">
              ₹{currentData.totalGross.toLocaleString('en-IN')}
            </p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-0.5">
              <TrendingUp className="h-3 w-3" />
              <span>+{currentData.growthPercentage}% vs prev</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            All court slot charges
          </p>
        </div>

        {/* Metric 2: Advance Online Collected */}
        <div className="rounded-2xl bg-white p-4 border border-[#E5E7EB] shadow-2xs hover:shadow-md hover:border-slate-300 transition-all space-y-2 group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
              Collected Online
            </span>
            <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-emerald-700 font-mono tracking-tight">
              ₹{currentData.totalOnline.toLocaleString('en-IN')}
            </p>
            <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded mt-0.5">
              UPI &amp; Cards
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            Advance gateway funds
          </p>
        </div>

        {/* Metric 3: Cash Collected at Venue */}
        <div className="rounded-2xl bg-white p-4 border border-[#E5E7EB] shadow-2xs hover:shadow-md hover:border-slate-300 transition-all space-y-2 group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
              Cash at Venue
            </span>
            <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-amber-700 font-mono tracking-tight">
              ₹{currentData.totalCash.toLocaleString('en-IN')}
            </p>
            <span className="inline-block text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded mt-0.5">
              Counter Dues
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            Venue cash desk collections
          </p>
        </div>

        {/* Metric 4: Total Reservations */}
        <div className="rounded-2xl bg-white p-4 border border-[#E5E7EB] shadow-2xs hover:shadow-md hover:border-slate-300 transition-all space-y-2 group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Reservations
            </span>
            <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-[#021526] font-mono tracking-tight">
              {currentData.totalBookings.toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] font-semibold text-slate-500 block mt-0.5">
              Confirmed playtime slots
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            Avg ₹{Math.round(currentData.totalGross / (currentData.totalBookings || 1)).toLocaleString('en-IN')} / slot
          </p>
        </div>

        {/* Metric 5: Live In-Play Courts */}
        <div className="rounded-2xl bg-white p-4 border border-blue-200 shadow-2xs hover:shadow-md transition-all space-y-2 group relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
              Live In-Play
            </span>
            <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="h-3.5 w-3.5 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xl sm:text-2xl font-black text-blue-700 font-mono tracking-tight">
                6 Courts
              </p>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-100 text-blue-800 uppercase tracking-wide animate-pulse">
                Active
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              Players on court right now
            </p>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            3 arenas currently hosted
          </p>
        </div>

        {/* Metric 6: iBookSports Commission (10%) */}
        <div className="rounded-2xl bg-gradient-to-br from-[#021526] to-[#0A2540] text-white p-4 shadow-sm hover:shadow-md transition-all space-y-2 group">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#F94001]">
              Platform Share (10%)
            </span>
            <ShieldCheck className="h-3.5 w-3.5 text-[#F94001]" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
              ₹{Math.round(currentData.totalGross * 0.1).toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-slate-300 font-medium mt-0.5">
              Net platform commission
            </p>
          </div>
          <p className="text-[10px] text-slate-400">
            Venue payout: ₹{Math.round(currentData.totalGross * 0.9).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. HERO INTERACTIVE TELEMETRY GRAPH WITH DAY/WEEK/MONTH/YEAR HORIZONS */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-white p-5 sm:p-6 border border-[#E5E7EB] shadow-xs space-y-6">
        {/* Graph Header with Horizon Switcher Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-[#021526] font-display flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#F94001]" />
                <span>Court Revenue &amp; Playtime Trends</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFF1EC] text-[#F94001] border border-[#F94001]/20">
                {currentData.periodLabel}
              </span>
            </div>
            <p className="text-xs text-[#5F6368] mt-0.5 font-medium">
              Multi-dimensional telemetry tracking gross slot revenue, online advance, and venue cash collections.
            </p>
          </div>

          {/* DAY, WEEK, MONTH, YEAR SWITCHER */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
            {(['day', 'week', 'month', 'year'] as TimeHorizon[]).map((tab) => {
              const isActive = horizon === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setHorizon(tab);
                    setHoveredIndex(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#F94001] shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab === 'day' && 'Day'}
                  {tab === 'week' && 'Week'}
                  {tab === 'month' && 'Month'}
                  {tab === 'year' && 'Year'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend & Hover Data Point Highlight Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 text-xs">
          {/* Series Legend */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#F94001] border-2 border-white shadow-2xs" />
              <span className="font-bold text-slate-800">Gross Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500 border-2 border-white shadow-2xs" />
              <span className="font-bold text-slate-800">Online Advance</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber-400 border-2 border-white shadow-2xs" />
              <span className="font-bold text-slate-800">Cash at Venue</span>
            </div>
          </div>

          {/* Live Hover Telemetry Snapshot */}
          <div className="flex items-center gap-3 font-mono font-bold">
            <span className="text-slate-400 uppercase text-[11px] font-sans">Selected Period:</span>
            <span className="text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
              {activePoint.label}
            </span>
            <span className="text-[#F94001]">
              ₹{activePoint.gross.toLocaleString('en-IN')}
            </span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-slate-600 text-[11px]">
              {activePoint.bookings} Bookings
            </span>
          </div>
        </div>

        {/* RESPONSIVE SVG CHART CONTAINER */}
        <div className="w-full relative overflow-hidden select-none">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-48 sm:h-64 lg:h-72 overflow-visible"
          >
            <defs>
              {/* Gross Gradient */}
              <linearGradient id="grossGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F94001" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#F94001" stopOpacity="0.0" />
              </linearGradient>

              {/* Online Gradient */}
              <linearGradient id="onlineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines */}
            {[0.25, 0.5, 0.75, 1.0].map((ratio, i) => {
              const y = chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
              return (
                <line
                  key={i}
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke="#E5E7EB"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
              );
            })}

            {/* Bottom Base Axis */}
            <line
              x1={paddingX}
              y1={chartHeight - paddingY}
              x2={chartWidth - paddingX}
              y2={chartHeight - paddingY}
              stroke="#CBD5E1"
              strokeWidth="1.5"
            />

            {/* Area Fill for Gross Revenue */}
            {grossAreaD && (
              <path d={grossAreaD} fill="url(#grossGradient)" className="transition-all duration-500" />
            )}

            {/* Spline Line: Gross Revenue */}
            {grossPathD && (
              <path
                d={grossPathD}
                fill="none"
                stroke="#F94001"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-500"
              />
            )}

            {/* Spline Line: Online Advance */}
            {onlinePathD && (
              <path
                d={onlinePathD}
                fill="none"
                stroke="#10B981"
                strokeWidth="2"
                strokeDasharray="5 3"
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            )}

            {/* Spline Line: Cash at Venue */}
            {cashPathD && (
              <path
                d={cashPathD}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2"
                strokeDasharray="3 3"
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            )}

            {/* Interactive Nodes & Tooltip Anchors */}
            {coordinates.map((pt, idx) => {
              const isHovered = hoveredIndex === idx;
              return (
                <g
                  key={idx}
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredIndex(idx)}
                >
                  {/* Vertical Hover Guide Line */}
                  {isHovered && (
                    <line
                      x1={pt.x}
                      y1={paddingY}
                      x2={pt.x}
                      y2={chartHeight - paddingY}
                      stroke="#F94001"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                      opacity="0.75"
                    />
                  )}

                  {/* Invisible broad hover hitbox */}
                  <rect
                    x={pt.x - 25}
                    y={0}
                    width={50}
                    height={chartHeight}
                    fill="transparent"
                  />

                  {/* Gross Revenue Point */}
                  <circle
                    cx={pt.x}
                    cy={pt.yGross}
                    r={isHovered ? 6 : 4}
                    fill="#F94001"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    className="transition-all duration-200 drop-shadow-sm"
                  />

                  {/* Online Advance Point */}
                  <circle
                    cx={pt.x}
                    cy={pt.yOnline}
                    r={isHovered ? 4.5 : 3}
                    fill="#10B981"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    className="transition-all duration-200"
                  />

                  {/* Cash Point */}
                  <circle
                    cx={pt.x}
                    cy={pt.yCash}
                    r={isHovered ? 4.5 : 3}
                    fill="#F59E0B"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    className="transition-all duration-200"
                  />

                  {/* X Axis Label */}
                  <text
                    x={pt.x}
                    y={chartHeight - paddingY + 18}
                    textAnchor="middle"
                    fill={isHovered ? '#F94001' : '#64748B'}
                    fontSize="10"
                    fontWeight={isHovered ? 'bold' : 'normal'}
                    className="font-mono transition-colors"
                  >
                    {pt.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* 3 Quick Performance Highlights Under Graph */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#FFF1EC] text-[#F94001] flex items-center justify-center font-bold shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Peak Playtime Window</span>
              <p className="font-bold text-slate-900 mt-0.5">07:00 PM &ndash; 10:00 PM (Floodlight Slots)</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Top Grossing Sport</span>
              <p className="font-bold text-slate-900 mt-0.5">Box Cricket (42% of total booking revenue)</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Network Court Health</span>
              <p className="font-bold text-slate-900 mt-0.5">13 Active Venues &bull; 48 Courts Connected</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MID SECTION: SPORT BREAKDOWN, PAYMENT METHODS, & VENUE LEADERBOARD */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card A: Sport Distribution & Slot Share */}
        <div className="rounded-2xl bg-white p-5 border border-[#E5E7EB] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-[#021526] font-display flex items-center gap-2">
                <Trophy className="h-4 w-4 text-[#F94001]" />
                <span>Sport Playtime Share</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Revenue distribution across arena categories</p>
            </div>
            <Link
              href="/admin/sports"
              className="text-xs font-bold text-[#F94001] hover:underline flex items-center gap-0.5"
            >
              <span>Sports</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3.5 pt-1">
            {sportsBreakdown.map((s) => (
              <div key={s.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{s.name}</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-black text-slate-900">{s.amount}</span>
                    <span className={`font-bold ${s.textColor}`}>({s.share}%)</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`${s.color} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${s.share}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between font-bold text-slate-800">
              <span>Primary Driver:</span>
              <span className="text-[#F94001]">Weekend Night Box Cricket Tournaments</span>
            </div>
            <p className="text-slate-500">Highest court slot yield per hour across all facilities.</p>
          </div>
        </div>

        {/* Card B: Payment Channels Breakdown (UPI, Card, Net Banking) */}
        <div className="rounded-2xl bg-white p-5 border border-[#E5E7EB] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-[#021526] font-display flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#F94001]" />
                <span>Payment Channel Split</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">UPI, Card, Net Banking &amp; Due Mode</p>
            </div>
            <Link
              href="/admin/payments"
              className="text-xs font-bold text-[#F94001] hover:underline flex items-center gap-0.5"
            >
              <span>Payments</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3 pt-1">
            {paymentMethods.map((pm) => (
              <div key={pm.name} className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-900">{pm.name}</span>
                  <span className="font-mono font-bold text-slate-700">{pm.share}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`${pm.color} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${pm.share}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Volume: {pm.count}</span>
                  <span>Razorpay Processed</span>
                </div>
              </div>
            ))}
          </div>

          {/* Due Collection Channel Telemetry */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-amber-900">Due Collection Split:</span>
              <span className="font-mono text-amber-800">55% Cash &bull; 45% Online</span>
            </div>
            <div className="h-1.5 w-full bg-amber-200 rounded-full overflow-hidden flex">
              <div className="bg-amber-600 h-full w-[55%]" title="Due: Cash" />
              <div className="bg-sky-500 h-full w-[45%]" title="Due: Online" />
            </div>
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-amber-800">Due: Cash (Desk Counter)</span>
              <span className="text-sky-700">Due: Online (Payment Link)</span>
            </div>
          </div>
        </div>

        {/* Card C: Top Arenas & Venue Occupancy */}
        <div className="rounded-2xl bg-white p-5 border border-[#E5E7EB] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-[#021526] font-display flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#F94001]" />
                <span>Top Venue Performance</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Capacity occupancy &amp; slot revenue</p>
            </div>
            <Link
              href="/admin/venues"
              className="text-xs font-bold text-[#F94001] hover:underline flex items-center gap-0.5"
            >
              <span>Venues</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3 pt-1">
            {topVenues.map((v) => (
              <div
                key={v.name}
                className="p-3 rounded-xl border border-slate-200/90 hover:border-[#F94001]/40 transition-colors bg-white space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-xs text-slate-900 tracking-tight">
                      {v.name}
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>{v.city}</span>
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-[#FFF1EC] text-[#F94001] uppercase tracking-wide">
                    {v.badge}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 font-sans block">Occupancy</span>
                    <span className="font-bold text-emerald-700">{v.occupancy}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-sans block">Revenue</span>
                    <span className="font-bold text-slate-900">{v.revenue}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-sans block">Courts</span>
                    <span className="font-bold text-slate-700">{v.courts}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. LIVE ACTIVITY LEDGER: RECENT BOOKINGS & T+2 SETTLEMENT MONITOR */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Playtime Bookings Stream (2 Columns wide) */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-5 sm:p-6 border border-[#E5E7EB] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-[#021526] font-display flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-[#F94001]" />
                <span>Live Court Reservation Stream</span>
              </h3>
              <p className="text-xs text-[#5F6368] mt-0.5">
                Real-time booking codes, player check-in status, and due collection tracking
              </p>
            </div>
            <Link
              href="/admin/bookings"
              className="text-xs font-bold text-[#021526] hover:text-[#F94001] flex items-center gap-1 transition-colors"
            >
              <span>View All 12 Bookings</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0">
            <table className="w-full text-left text-xs min-w-[620px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                  <th className="pb-3 pr-3">Booking Code</th>
                  <th className="pb-3 pr-3">Player</th>
                  <th className="pb-3 pr-3">Venue &amp; Sport</th>
                  <th className="pb-3 pr-3">Slot Time</th>
                  <th className="pb-3 pr-3">Payment Split</th>
                  <th className="pb-3 pr-3">Payment Type</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {INITIAL_BOOKINGS.slice(0, 5).map((b) => {
                  const isPartial = b.payment_status === 'PARTIAL_PAID' || b.booking_code === 'IBS-2603-9002' || b.booking_code === 'IBS-2603-9004';
                  const cleanPayment = b.payment_method?.toLowerCase().includes('card')
                    ? 'Card'
                    : b.payment_method?.toLowerCase().includes('net') || b.payment_method?.toLowerCase().includes('banking')
                    ? 'Net Banking'
                    : 'UPI';

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 pr-3 font-mono font-bold text-[#F94001]">
                        {b.booking_code}
                      </td>
                      <td className="py-3 pr-3">
                        <p className="font-bold text-slate-900">{b.customer_name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{b.customer_phone}</p>
                      </td>
                      <td className="py-3 pr-3">
                        <p className="font-medium text-slate-800 truncate max-w-[170px]">{b.venue_name}</p>
                        <p className="text-[10px] font-bold text-[#F94001]">{b.sport}</p>
                      </td>
                      <td className="py-3 pr-3 font-mono text-[11px] text-slate-600">
                        {b.booking_date} &bull; {b.time_slot.split(' - ')[0]}
                      </td>
                      <td className="py-3 pr-3 font-mono">
                        {isPartial ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-emerald-700">₹{b.total_amount * 0.5}</span>
                            <div>
                              {b.due_mode === 'ONLINE' ? (
                                <span className="text-[9px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-1 py-0.2 rounded">
                                  Due: Online
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1 py-0.2 rounded">
                                  Due: Cash
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="font-bold text-emerald-700">₹{b.total_amount} Paid</span>
                        )}
                      </td>
                      <td className="py-3 pr-3 font-bold text-slate-800 text-[11px]">
                        {cleanPayment}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Settlement Telemetry & Payout Batches */}
        <div className="rounded-2xl bg-white p-5 sm:p-6 border border-[#E5E7EB] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-[#021526] font-display flex items-center gap-2">
                <Receipt className="h-4.5 w-4.5 text-[#F94001]" />
                <span>T+2 Settlement Cycle</span>
              </h3>
              <p className="text-xs text-[#5F6368] mt-0.5">Automated venue partner disbursals</p>
            </div>
            <Link
              href="/admin/settlements"
              className="text-xs font-bold text-[#F94001] hover:underline"
            >
              Audits
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Next Payout Batch</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  READY
                </span>
              </div>
              <p className="font-mono text-sm font-black text-[#021526]">
                ₹48,250.00 Net Payable
              </p>
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Disbursal Date: 2026-03-10</span>
                <span>T+2 Bank NEFT</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Partner Fee Deduction Policy
              </span>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Platform Commission:</span>
                  <span className="font-bold text-slate-800">10% Court Fee</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Due Cash at Venue:</span>
                  <span className="font-bold text-amber-700">Platform Fee Offset</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Razorpay MDR:</span>
                  <span className="font-bold text-slate-800">2% + 18% GST</span>
                </div>
              </div>
            </div>

            <Link
              href="/admin/settlements"
              className="w-full py-2.5 rounded-xl bg-[#021526] hover:bg-[#F94001] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Review Itemized Settlement Slips</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
