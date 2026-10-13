'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Building2,
  ArrowLeft,
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
  Clock,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Layers,
  FileText,
  Users,
  CreditCard,
  LifeBuoy,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Save,
  Flame,
  Sun,
  ImageIcon,
  UploadCloud,
  Car,
  Droplets,
  HeartPulse,
  Coffee,
  Armchair,
  DoorOpen,
  Zap,
  Shield,
  Sparkles,
  RotateCcw,
  History,
  Download,
  Ban,
  CalendarDays,
  TrendingUp,
  Wallet,
  Receipt,
  Headphones,
  Tag,
  Filter,
  QrCode,
  Printer,
} from 'lucide-react';

const SPORT_ICONS: Record<string, string> = {
  Cricket: '🏏',
  Football: '⚽',
  Badminton: '🏸',
  Tennis: '🎾',
  Basketball: '🏀',
  Volleyball: '🏐',
  Pickleball: '🏓',
  Swimming: '🏊',
};
import {
  VenueDetail,
  BookingItem,
  SettlementBatchItem,
  SupportTicketItem,
  CourtExtensionRequest,
  CourtExtensionHistory,
} from '@/lib/mockData';
import { apiClient, onboardingApi, adminApi } from '@/lib/api';

const REJECTION_REASONS = [
  { value: 'PRICING_OUT_OF_BOUNDS', label: 'Hourly pricing violates regional slot rate caps' },
  { value: 'SURFACE_VERIFICATION_NEEDED', label: 'Surface type or court dimensions require physical verification' },
  { value: 'INCOMPLETE_DETAILS', label: 'Incomplete or unclear court specifications / photos' },
  { value: 'DUPLICATE_LISTING', label: 'Duplicate court name or slot already listed for this venue' },
  { value: 'OPERATING_HOURS_MISMATCH', label: 'Requested peak hours conflict with venue master operating schedule' },
  { value: 'OTHER', label: 'Other specific reason (specify detailed notes below)' },
];

type VenueModularTab =
  | 'overview'
  | 'courts'
  | 'bookings'
  | 'settlement'
  | 'staff'
  | 'slots'
  | 'cancellation'
  | 'support';

interface VenueStaffMember {
  id: string;
  db_id?: string;
  staff_id?: string;
  display_id?: string;
  name: string;
  mobile_number: string;
  role: string;
  email: string;
  shift_hours?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

interface EnhancedCourtItem {
  id: string;
  name: string;
  display_name: string;
  sport: string;
  surface?: string;
  court_type?: 'OUTDOOR' | 'INDOOR' | 'COVERED ROOF';
  environment: 'Outdoor' | 'Indoor' | 'Covered Roof';
  dimensions?: string;
  lighting?: string;
  base_hourly_rate: number;
  regular_price: number;
  peak_price: number;
  peak_hours_label: string;
  weekend_price: number;
  peak_days: string[];
  min_booking_time_mins: number;
  operating_hours: string;
  cancellation_policy_hours: number;
  refund_percentage: number;
  status: 'ACTIVE' | 'INACTIVE';
}

interface CourtSlotItem {
  id: string;
  court_id: string;
  court_name: string;
  time: string;
  status: 'AVAILABLE' | 'HOLD' | 'BOOKED' | 'LIVE' | 'MAINTENANCE' | 'UNAVAILABLE';
  price: number;
  is_peak: boolean;
  booking_code?: string;
  customer_name?: string;
}

export default function VenueModularOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const venueId = (params?.id as string) || '';

  const [venues, setVenues] = useState<VenueDetail[]>([]);
  const [activeTab, setActiveTab] = useState<VenueModularTab>('overview');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Live real data fetched from backend for this venue
  const [liveVenueBookings, setLiveVenueBookings] = useState<BookingItem[]>([]);
  const [liveVenueSettlements, setLiveVenueSettlements] = useState<SettlementBatchItem[]>([]);
  const [liveVenueSupportTickets, setLiveVenueSupportTickets] = useState<SupportTicketItem[]>([]);

  // Selected Booking Drawer State (inside Bookings Tab)
  const [selectedBookingForDrawer, setSelectedBookingForDrawer] = useState<BookingItem | null>(null);
  const [venueBookingDrawerTab, setVenueBookingDrawerTab] = useState<'summary' | 'payment' | 'slip'>('summary');
  const [cancelModalOpenForVenueBooking, setCancelModalOpenForVenueBooking] = useState(false);
  const [rescheduleModalOpenForVenueBooking, setRescheduleModalOpenForVenueBooking] = useState(false);
  const [rescheduleDateForVenue, setRescheduleDateForVenue] = useState('');
  const [rescheduleSlotTimeForVenue, setRescheduleSlotTimeForVenue] = useState('');
  const [copiedVenueBookingLink, setCopiedVenueBookingLink] = useState(false);

  // Staff state & Live Actions
  const [staffMembers, setStaffMembers] = useState<VenueStaffMember[]>([]);
  const [isRefreshingStaff, setIsRefreshingStaff] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Coach');
  const [newStaffShift, setNewStaffShift] = useState('Standard (06:00 AM - 02:00 PM)');
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);

  // Staff Pagination & Slide Bar Drawer State
  const [staffCurrentPage, setStaffCurrentPage] = useState<number>(1);
  const [staffPageSize, setStaffPageSize] = useState<number>(10);
  const [selectedStaffForDrawer, setSelectedStaffForDrawer] = useState<VenueStaffMember | null>(null);
  const [staffCopiedText, setStaffCopiedText] = useState<string | null>(null);

  const handleCopyStaffText = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setStaffCopiedText(id);
      setTimeout(() => setStaffCopiedText(null), 2000);
    }
  };

  // Cancellations Pagination & Slide Bar Drawer State
  const [cancellationCurrentPage, setCancellationCurrentPage] = useState<number>(1);
  const [cancellationPageSize, setCancellationPageSize] = useState<number>(10);
  const [selectedCancellationForDrawer, setSelectedCancellationForDrawer] = useState<BookingItem | null>(null);
  const [cancellationCopiedText, setCancellationCopiedText] = useState<string | null>(null);

  const handleCopyCancellationText = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCancellationCopiedText(id);
      setTimeout(() => setCancellationCopiedText(null), 2000);
    }
  };

  // Staff pagination computations
  const staffTotalItems = staffMembers.length;
  const staffTotalPages = Math.max(1, Math.ceil(staffTotalItems / staffPageSize));
  const staffStartIndex = (staffCurrentPage - 1) * staffPageSize;
  const paginatedStaff = useMemo(() => {
    return staffMembers.slice(staffStartIndex, staffStartIndex + staffPageSize);
  }, [staffMembers, staffStartIndex, staffPageSize]);

  // Courts state (view only)
  const [courtsList, setCourtsList] = useState<EnhancedCourtItem[]>([]);

  // Courts Extension Requests & Sub-Tab State
  const [courtsSubTab, setCourtsSubTab] = useState<'live' | 'requests'>('live');
  const [courtRequests, setCourtRequests] = useState<CourtExtensionRequest[]>([]);
  const [selectedCourtRequestForDrawer, setSelectedCourtRequestForDrawer] = useState<CourtExtensionRequest | null>(null);

  // Add / Edit Court Request Modal State (3-Screenshot Replica)
  const [isCourtRequestModalOpen, setIsCourtRequestModalOpen] = useState(false);
  const [editingCourtRequest, setEditingCourtRequest] = useState<CourtExtensionRequest | null>(null);

  // Form Fields State (Matching Screenshots 1, 2, 3)
  const [reqSamePhysicalSports, setReqSamePhysicalSports] = useState<boolean>(false);
  const [reqSport, setReqSport] = useState('Football');
  const [reqCourtName, setReqCourtName] = useState('Turf 1A (5-a-side)');
  const [reqDisplayName, setReqDisplayName] = useState('Main Arena Pitch 1 (Floodlit Turf)');
  const [reqMinDuration, setReqMinDuration] = useState('1 Hour');
  const [reqPricePerHour, setReqPricePerHour] = useState<number>(1000);
  const [reqPeakStart, setReqPeakStart] = useState('06:00 PM');
  const [reqPeakEnd, setReqPeakEnd] = useState('11:00 PM');
  const [reqPeakPrice, setReqPeakPrice] = useState<number>(1400);
  const [reqWeekendPrice, setReqWeekendPrice] = useState<number>(1500);
  const [reqPeakDays, setReqPeakDays] = useState<string[]>(['Fri', 'Sat', 'Sun']);
  const [reqCancellationHours, setReqCancellationHours] = useState<number>(12);
  const [reqRefundPercentage, setReqRefundPercentage] = useState<number>(100);

  // Drawer Rejection & Deletion State
  const [isDrawerRejectOpen, setIsDrawerRejectOpen] = useState(false);
  const [drawerRejectionReason, setDrawerRejectionReason] = useState('PRICING_OUT_OF_BOUNDS');
  const [drawerRejectionNote, setDrawerRejectionNote] = useState('');
  const [drawerActionError, setDrawerActionError] = useState<string | null>(null);
  const [deleteConfirmReqId, setDeleteConfirmReqId] = useState<string | null>(null);

  // Block & Unblock Modal State (Restricts Vendor App Login with Support Notice)
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockPresetReason, setBlockPresetReason] = useState('Policy violation & non-compliance');
  const [blockReason, setBlockReason] = useState('');
  const [unblockModalOpen, setUnblockModalOpen] = useState(false);
  const [gpsModalOpen, setGpsModalOpen] = useState(false);

  // Overview Form Fields State
  const [ownerFullName, setOwnerFullName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPan, setOwnerPan] = useState('');
  const [aadhaarDocName, setAadhaarDocName] = useState('');
  const [profilePhotoName, setProfilePhotoName] = useState('');

  const [venueNameInput, setVenueNameInput] = useState('');
  const [cityRegionInput, setCityRegionInput] = useState('');
  const [physicalAddressInput, setPhysicalAddressInput] = useState('');
  const [googleMapsLinkInput, setGoogleMapsLinkInput] = useState('');
  const [publicBioInput, setPublicBioInput] = useState('');

  const [venuePhotos, setVenuePhotos] = useState<{ id: string; title: string; label: string; url: string }[]>([]);
  const [documentPreviewModal, setDocumentPreviewModal] = useState<{
    title: string;
    docId?: string;
    name?: string;
    url: string;
    isPdf: boolean;
    type?: string;
    applicantName?: string;
  } | null>(null);

  // Overview Amenities Filter & State
  const [amenityFilter, setAmenityFilter] = useState<string>('ALL');

  const venueAmenitiesList = useMemo(() => [
    {
      id: 'led_floodlights',
      name: 'LED Floodlights',
      category: 'LIGHTING',
      description: '500 Lux professional floodlighting',
      icon: Sun,
      iconBgClass: 'bg-orange-50 border-orange-200/60',
      iconColorClass: 'text-[#F94001]',
    },
    {
      id: 'car_bike_parking',
      name: 'Car & Bike Parking',
      category: 'FACILITY',
      description: 'Covered and secure parking',
      icon: Car,
      iconBgClass: 'bg-purple-50 border-purple-200/60',
      iconColorClass: 'text-purple-600',
    },
    {
      id: 'changing_rooms',
      name: 'Changing Rooms & Showers',
      category: 'FACILITY',
      description: 'Male and female separate changing rooms',
      icon: DoorOpen,
      iconBgClass: 'bg-emerald-50 border-emerald-200/60',
      iconColorClass: 'text-emerald-600',
    },
    {
      id: 'drinking_water',
      name: 'Purified Drinking Water',
      category: 'REFRESHMENT',
      description: 'Free continuous hydration',
      icon: Droplets,
      iconBgClass: 'bg-blue-50 border-blue-200/60',
      iconColorClass: 'text-blue-600',
    },
    {
      id: 'first_aid',
      name: 'First Aid Kit',
      category: 'SAFETY',
      description: 'On-site medical safety kit',
      icon: HeartPulse,
      iconBgClass: 'bg-rose-50 border-rose-200/60',
      iconColorClass: 'text-rose-600',
    },
    {
      id: 'snacks_cafeteria',
      name: 'Snacks & Cafeteria',
      category: 'REFRESHMENT',
      description: 'Snack bar & hydration lounge',
      icon: Coffee,
      iconBgClass: 'bg-amber-50 border-amber-200/60',
      iconColorClass: 'text-amber-600',
    },
    {
      id: 'equipment_rental',
      name: 'Equipment Rental',
      category: 'EQUIPMENT',
      description: 'Pro sport gear rental at counter',
      icon: Shield,
      iconBgClass: 'bg-indigo-50 border-indigo-200/60',
      iconColorClass: 'text-indigo-600',
    },
    {
      id: 'spectator_seating',
      name: 'Spectator Seating / Gallery',
      category: 'FACILITY',
      description: 'Covered spectator stand',
      icon: Armchair,
      iconBgClass: 'bg-pink-50 border-pink-200/60',
      iconColorClass: 'text-pink-600',
    },
  ], []);

  const filteredAmenities = useMemo(() => {
    if (amenityFilter === 'ALL') return venueAmenitiesList;
    return venueAmenitiesList.filter((a) => a.category === amenityFilter);
  }, [amenityFilter, venueAmenitiesList]);

  // Slots date selection & dynamic timeline dates
  const [selectedSlotDate, setSelectedSlotDate] = useState<'today' | 'tomorrow' | 'day_after' | 'custom'>('today');
  const [slotCustomDate, setSlotCustomDate] = useState<string>('');
  const [selectedCourtFilterForSlots, setSelectedCourtFilterForSlots] = useState<string>('ALL');
  const [slotsState, setSlotsState] = useState<Record<string, 'AVAILABLE' | 'HOLD' | 'BOOKED' | 'LIVE' | 'MAINTENANCE' | 'UNAVAILABLE'>>({});

  const todayYmd = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const tomorrowYmd = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const dayAfterYmd = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const quickDateOptions = useMemo(() => {
    const d0 = new Date();
    const d1 = new Date();
    d1.setDate(d0.getDate() + 1);
    const d2 = new Date();
    d2.setDate(d0.getDate() + 2);

    const fmt = (d: Date, prefix: string) => {
      const day = d.getDate();
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      return `${prefix} (${day} ${month})`;
    };
    const d2Day = d2.toLocaleDateString('en-US', { weekday: 'short' });

    return [
      { key: 'today' as const, label: fmt(d0, 'Today'), dateStr: todayYmd },
      { key: 'tomorrow' as const, label: fmt(d1, 'Tomorrow'), dateStr: tomorrowYmd },
      { key: 'day_after' as const, label: fmt(d2, d2Day), dateStr: dayAfterYmd },
    ];
  }, [todayYmd, tomorrowYmd, dayAfterYmd]);

  useEffect(() => {
    if (!slotCustomDate) {
      setSlotCustomDate(todayYmd);
    }
  }, [slotCustomDate, todayYmd]);

  // Filters inside Bookings tab
  const [bookingDateFilter, setBookingDateFilter] = useState<string>('');
  const [bookingCourtFilter, setBookingCourtFilter] = useState<string>('ALL');
  const [bookingSportFilter, setBookingSportFilter] = useState<string>('ALL');
  const [bookingSearchQuery, setBookingSearchQuery] = useState<string>('');

  // Selected Support Ticket Drawer State
  const [selectedSupportTicketForDrawer, setSelectedSupportTicketForDrawer] = useState<SupportTicketItem | null>(null);

  // Support ticket filter
  const [ticketFilter, setTicketFilter] = useState<string>('ALL');

  // Load live venue data from backend API
  useEffect(() => {
    const fetchLiveVenue = async () => {
      try {
        const res = await apiClient.get<VenueDetail>(`/venues/${venueId}`);
        if (res.data && res.data.id) {
          setVenues((prev) => {
            const exists = prev.some((v) => v.id === res.data.id);
            if (exists) {
              return prev.map((v) => (v.id === res.data.id ? res.data : v));
            }
            return [res.data, ...prev];
          });
        }
      } catch (err) {
        console.warn(`Could not load venue ${venueId} from backend, falling back to local data`, err);
      }
    };

    if (venueId) {
      fetchLiveVenue();
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('ibooksports_live_venues');
        localStorage.removeItem('ibooksports_court_requests');
      } catch {}

      const loadCourtRequests = async () => {
        let mergedReqs: CourtExtensionRequest[] = [];
        try {
          const backendReqs = await adminApi.getCourtRequests();
          if (Array.isArray(backendReqs) && backendReqs.length > 0) {
            mergedReqs = backendReqs.map((r) => ({
              id: r.id,
              court_id: r.court_id,
              venue_id: r.vendor_mobile ? `ven_${r.vendor_mobile.slice(-4)}` : 'APP10235',
              venue_name: r.venue_name,
              venue_city: r.venue_city || 'Coimbatore',
              owner_name: r.vendor_name || 'Venue Partner',
              owner_phone: r.vendor_mobile ? `+91 ${r.vendor_mobile}` : '+91 9876543210',
              same_physical_sports: r.same_physical_sports ?? false,
              parent_court_name: r.parent_court_name,
              sport: Array.isArray(r.sports) ? r.sports[0] : (r.sports || 'Football'),
              court_name: r.court_name,
              display_name: r.display_name || r.court_name,
              min_booking_duration: r.min_booking_duration || '1 Hour',
              min_booking_duration_label: r.min_booking_duration || '1 Hour',
              min_booking_duration_mins: 60,
              price_per_hour: r.price_per_hour,
              regular_price: r.price_per_hour,
              peak_price: r.peak_hours_price || r.price_per_hour,
              peak_hours_start: r.peak_hours_start || '06:00 PM',
              peak_hours_end: r.peak_hours_end || '10:00 PM',
              weekend_price: r.weekend_price || r.price_per_hour,
              peak_days: r.peak_days || ['Fri', 'Sat', 'Sun'],
              cancellation_window_hours: r.cancellation_window_hours ?? 12,
              cancellation_policy_hours: r.cancellation_window_hours ?? 12,
              refund_percentage: r.refund_percentage ?? 100,
              status: r.status === 'PENDING' ? 'SUBMITTED' : (r.status as any),
              submission_count: 1,
              submission_round: 1,
              rejection_reason: r.rejection_reason,
              rejection_note: r.rejection_reason,
              reviewed_by: r.reviewer_name || (r as any).reviewed_by,
              reviewed_at: r.reviewed_at,
              history: [
                {
                  round: 1,
                  action: (r.status === 'PENDING' ? 'SUBMITTED' : r.status) as any,
                  timestamp: r.created_at,
                  note: 'Inbound court extension request.',
                },
              ],
              created_at: r.created_at,
              submitted_at: (typeof r.created_at === 'string' && r.created_at.includes('T'))
                ? r.created_at.split('T')[0]
                : (r.created_at ? String(r.created_at).slice(0, 10) : '2026-03-09'),
            }));
          }
        } catch (err) {
          console.warn('Failed to load court requests from backend API', err);
        }

        setCourtRequests(mergedReqs);
      };

      loadCourtRequests();
    }
  }, [venueId]);

  // Find active venue
  const currentVenue = useMemo(() => {
    return venues.find((v) => v.id === venueId) || venues[0] || null;
  }, [venues, venueId]);

  // Load real live bookings, settlements, and support tickets for this venue
  useEffect(() => {
    if (!venueId) return;

    const fetchVenueRelatedData = async () => {
      try {
        const [bookingsRes, settlementsRes, supportRes] = await Promise.all([
          apiClient.get<any>('/bookings').catch(() => ({ data: [] })),
          apiClient.get<any>('/payments/settlements').catch(() => ({ data: [] })),
          apiClient.get<any>('/support', { params: { venue_id: venueId } }).catch(() => ({ data: [] })),
        ]);

        const rawBookingsData = bookingsRes?.data;
        const rawBookings: any[] = Array.isArray(rawBookingsData)
          ? rawBookingsData
          : Array.isArray(rawBookingsData?.data)
          ? rawBookingsData.data
          : [];

        const venueNameClean = currentVenue?.venue_name?.toLowerCase() || '';
        const vIdClean = venueId.toLowerCase();

        const filteredB: BookingItem[] = rawBookings
          .filter((b: any) => {
            const bVenueId = String(b.venueId || b.venue_id || '').toLowerCase();
            const bVenueName = String(b.venueName || b.venue_name || '').toLowerCase();
            return (
              bVenueId === vIdClean ||
              (bVenueId && vIdClean.includes(bVenueId)) ||
              (venueNameClean && bVenueName && (bVenueName.includes(venueNameClean) || venueNameClean.includes(bVenueName)))
            );
          })
          .map((b: any) => ({
            id: String(b.id),
            booking_code: b.booking_code || b.bookingCode || `BK-${b.id}`,
            customer_id: b.customer_id || b.customerId || 'cust_1',
            customer_name: b.customer_name || b.customerName || 'Player',
            customer_phone: b.customer_phone || b.customerPhone || '',
            venue_id: b.venue_id || b.venueId || venueId,
            venue_name: b.venue_name || b.venueName || currentVenue?.venue_name || 'Venue',
            court_id: b.court_id || b.courtId || 'court-1',
            court_name: b.court_name || b.courtName || 'Court 1',
            sport: b.sport || 'FOOTBALL',
            booking_date: b.date || b.booking_date || b.bookingDate || '',
            time_slot: b.time_slot || b.timeSlot || '',
            duration_minutes: Number(b.duration_minutes || b.durationMinutes) || 60,
            total_amount: Number(b.total_amount || b.totalAmount) || 0,
            platform_fee: Number(b.platform_fee || b.platformFee) || 0,
            venue_share: Number(b.venue_share || b.venueShare) || 0,
            advance_amount: Number(b.advance_amount || b.advanceAmount || b.paid_amount || b.paidAmount) || 0,
            balance_amount: Number(b.balance_amount || b.balanceAmount) || 0,
            payment_status: (b.payment_status || b.paymentStatus || 'PAID') as any,
            booking_status: (b.status === 'Cancelled' ? 'CANCELLED' : b.status === 'Confirmed' ? 'CONFIRMED' : (b.booking_status || b.status || 'CONFIRMED')) as any,
            payment_method: b.payment_method || b.paymentMethod || 'UPI',
            transaction_id: b.transaction_id || b.transactionId || `TXN-${b.id}`,
            created_at: b.created_at || b.createdAt || new Date().toISOString(),
            cancellation_reason: b.cancellation_reason || b.cancellationReason || b.cancel_reason,
            cancelled_at: b.cancelled_at || b.cancelledAt,
            refund_amount: Number(b.refund_amount || b.refundAmount || 0),
            refund_status: b.refund_status || b.refundStatus || (b.status === 'Cancelled' ? 'WALLET_CREDITED' : undefined),
            refund_utr: b.refund_utr || b.refundUtr,
          }));
        setLiveVenueBookings(filteredB);

        const rawSettlementsData = settlementsRes?.data;
        const rawSettlements: any[] = Array.isArray(rawSettlementsData)
          ? rawSettlementsData
          : Array.isArray(rawSettlementsData?.data)
          ? rawSettlementsData.data
          : [];

        const filteredS: SettlementBatchItem[] = rawSettlements.filter((s: any) => {
          const sVenueId = String(s.venue_id || s.venueId || '').toLowerCase();
          const sVenueName = String(s.venue_name || s.venueName || '').toLowerCase();
          return (
            sVenueId === vIdClean ||
            (sVenueId && vIdClean.includes(sVenueId)) ||
            (venueNameClean && sVenueName && (sVenueName.includes(venueNameClean) || venueNameClean.includes(sVenueName)))
          );
        });
        setLiveVenueSettlements(filteredS);

        const rawSupportData = supportRes?.data;
        const rawSupport: any[] = Array.isArray(rawSupportData)
          ? rawSupportData
          : Array.isArray(rawSupportData?.data)
          ? rawSupportData.data
          : [];
        setLiveVenueSupportTickets(rawSupport);
      } catch (err) {
        console.warn('Failed to load venue-related live data', err);
      }
    };

    fetchVenueRelatedData();
  }, [venueId, currentVenue]);

  const saveCourtRequestsToStorage = (updatedList: CourtExtensionRequest[]) => {
    setCourtRequests(updatedList);
  };

  const venueCourtRequests = useMemo(() => {
    if (!currentVenue) return [];
    return courtRequests.filter((r) => {
      const vid = currentVenue.id?.toLowerCase();
      const rvid = r.venue_id?.toLowerCase();
      const vname = currentVenue.venue_name?.toLowerCase();
      const rvname = r.venue_name?.toLowerCase();
      const vphone = String(currentVenue.mobile_number || currentVenue.owner?.phone || '').replace(/\D/g, '').slice(-10);
      const rphone = String(r.owner_phone || '').replace(/\D/g, '').slice(-10);
      return (
        rvid === vid ||
        (vname && rvname && (rvname === vname || rvname.includes(vname) || vname.includes(rvname))) ||
        (vphone && rphone && vphone === rphone)
      );
    });
  }, [courtRequests, currentVenue]);

  const pendingRequestsCount = useMemo(() => {
    return venueCourtRequests.filter((r) => {
      const s = (r.status || '').toUpperCase();
      return s === 'SUBMITTED' || s === 'RESUBMITTED' || s === 'NEW_REQUEST' || s === 'PENDING';
    }).length;
  }, [venueCourtRequests]);

  const [courtRequestKpiFilter, setCourtRequestKpiFilter] = useState<
    'ALL' | 'SUBMITTED' | 'RESUBMITTED' | 'APPROVED' | 'REJECTED'
  >('ALL');

  const filteredVenueCourtRequests = useMemo(() => {
    if (courtRequestKpiFilter === 'ALL') return venueCourtRequests;
    if (courtRequestKpiFilter === 'SUBMITTED') {
      return venueCourtRequests.filter((r) => {
        const s = (r.status || '').toUpperCase();
        return s === 'SUBMITTED' || s === 'NEW_REQUEST' || s === 'PENDING';
      });
    }
    if (courtRequestKpiFilter === 'RESUBMITTED') {
      return venueCourtRequests.filter((r) => (r.status || '').toUpperCase() === 'RESUBMITTED');
    }
    if (courtRequestKpiFilter === 'APPROVED') {
      return venueCourtRequests.filter((r) => (r.status || '').toUpperCase() === 'APPROVED');
    }
    if (courtRequestKpiFilter === 'REJECTED') {
      return venueCourtRequests.filter((r) => (r.status || '').toUpperCase() === 'REJECTED');
    }
    return venueCourtRequests;
  }, [venueCourtRequests, courtRequestKpiFilter]);

  const handleOpenNewCourtRequestModal = () => {
    setEditingCourtRequest(null);
    setReqSamePhysicalSports(false);
    setReqSport('Football');
    setReqCourtName('Turf 1A (5-a-side)');
    setReqDisplayName('Main Arena Pitch 1 (Floodlit Turf)');
    setReqMinDuration('1 Hour');
    setReqPricePerHour(1000);
    setReqPeakStart('06:00 PM');
    setReqPeakEnd('11:00 PM');
    setReqPeakPrice(1400);
    setReqWeekendPrice(1500);
    setReqPeakDays(['Fri', 'Sat', 'Sun']);
    setReqCancellationHours(12);
    setReqRefundPercentage(100);
    setIsCourtRequestModalOpen(true);
  };

  const handleOpenEditCourtRequestModal = (req: CourtExtensionRequest) => {
    setEditingCourtRequest(req);
    setReqSamePhysicalSports(req.same_physical_sports ?? false);
    setReqSport(req.sport);
    setReqCourtName(req.court_name);
    setReqDisplayName(req.display_name);
    setReqMinDuration(req.min_booking_duration_label || req.min_booking_duration || '1 Hour');
    setReqPricePerHour(req.regular_price || req.price_per_hour || 1000);
    setReqPeakStart(req.peak_hours_start);
    setReqPeakEnd(req.peak_hours_end);
    setReqPeakPrice(req.peak_price);
    setReqWeekendPrice(req.weekend_price);
    setReqPeakDays(req.peak_days || ['Fri', 'Sat', 'Sun']);
    setReqCancellationHours(req.cancellation_policy_hours || req.cancellation_window_hours || 12);
    setReqRefundPercentage(req.refund_percentage);
    setIsCourtRequestModalOpen(true);
  };

  const handleSaveCourtRequestForm = (e: React.FormEvent) => {
    e.preventDefault();
    const nowStr = new Date().toISOString();

    if (editingCourtRequest) {
      // RESUBMISSION (Round 2+)
      const nextRound = (editingCourtRequest.submission_round || 1) + 1;
      const historyItem: CourtExtensionHistory = {
        round: nextRound,
        action: 'RESUBMITTED',
        actor_role: 'VENUE_OWNER',
        timestamp: nowStr,
        note: `Resubmitted in Round ${nextRound} with updated specifications and pricing adjustments.`,
      };

      const updated = courtRequests.map((r) => {
        if (r.id === editingCourtRequest.id) {
          return {
            ...r,
            court_name: reqCourtName,
            display_name: reqDisplayName,
            sport: reqSport,
            same_physical_sports: reqSamePhysicalSports,
            min_booking_duration_label: reqMinDuration,
            min_booking_duration_mins: reqMinDuration === '30 Mins' ? 30 : reqMinDuration === '1 Hour' ? 60 : reqMinDuration === '1.5 Hours' ? 90 : reqMinDuration === '2 Hours' ? 120 : 180,
            regular_price: Number(reqPricePerHour) || 1000,
            peak_price: Number(reqPeakPrice) || 1400,
            weekend_price: Number(reqWeekendPrice) || 1500,
            peak_hours_start: reqPeakStart,
            peak_hours_end: reqPeakEnd,
            peak_days: reqPeakDays,
            cancellation_policy_hours: reqCancellationHours,
            refund_percentage: reqRefundPercentage,
            status: 'RESUBMITTED' as const,
            submission_round: nextRound,
            submitted_at: nowStr,
            rejection_reason: undefined,
            rejection_note: undefined,
            history: [...r.history, historyItem],
          };
        }
        return r;
      });

      saveCourtRequestsToStorage(updated);
      setIsCourtRequestModalOpen(false);
      setEditingCourtRequest(null);
      if (selectedCourtRequestForDrawer?.id === editingCourtRequest.id) {
        setSelectedCourtRequestForDrawer(updated.find((r) => r.id === editingCourtRequest.id) || null);
      }
      setStatusNotification(`Court request "${reqCourtName}" successfully resubmitted for Round ${nextRound} review.`);
      setTimeout(() => setStatusNotification(null), 3500);
    } else {
      // NEW REQUEST (Round 1)
      const newReqId = `CRQ-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;
      const historyItem: CourtExtensionHistory = {
        round: 1,
        action: 'SUBMITTED',
        actor_role: 'VENUE_OWNER',
        timestamp: nowStr,
        note: 'Initial court addition request submitted for admin verification.',
      };

      const newReq: CourtExtensionRequest = {
        id: newReqId,
        venue_id: currentVenue.id,
        venue_name: currentVenue.venue_name,
        venue_city: currentVenue.district || currentVenue.state,
        owner_name: currentVenue.owner.full_name,
        owner_phone: currentVenue.owner.phone,
        sport: reqSport,
        court_name: reqCourtName,
        display_name: reqDisplayName,
        same_physical_sports: reqSamePhysicalSports,
        min_booking_duration: reqMinDuration,
        min_booking_duration_label: reqMinDuration,
        min_booking_duration_mins: reqMinDuration === '30 Mins' ? 30 : reqMinDuration === '1 Hour' ? 60 : reqMinDuration === '1.5 Hours' ? 90 : reqMinDuration === '2 Hours' ? 120 : 180,
        price_per_hour: Number(reqPricePerHour) || 1000,
        regular_price: Number(reqPricePerHour) || 1000,
        peak_price: Number(reqPeakPrice) || 1400,
        weekend_price: Number(reqWeekendPrice) || 1500,
        peak_hours_start: reqPeakStart,
        peak_hours_end: reqPeakEnd,
        peak_days: reqPeakDays,
        cancellation_window_hours: reqCancellationHours,
        cancellation_policy_hours: reqCancellationHours,
        refund_percentage: reqRefundPercentage,
        status: 'SUBMITTED',
        submission_count: 1,
        submission_round: 1,
        submitted_at: nowStr,
        environment: 'Outdoor',
        history: [historyItem],
      };

      saveCourtRequestsToStorage([newReq, ...courtRequests]);
      setIsCourtRequestModalOpen(false);
      setCourtsSubTab('requests');
      setStatusNotification(`New court request "${newReq.court_name}" submitted for approval!`);
      setTimeout(() => setStatusNotification(null), 3500);

      // Persist to backend API so it shows everywhere
      adminApi.createCourtRequest({
        court_name: reqCourtName,
        display_name: reqDisplayName,
        sports: [reqSport],
        price_per_hour: Number(reqPricePerHour) || 1000,
        min_booking_duration: reqMinDuration,
        peak_hours_start: reqPeakStart,
        peak_hours_end: reqPeakEnd,
        peak_hours_price: Number(reqPeakPrice) || 1400,
        peak_days: reqPeakDays,
        weekend_price: Number(reqWeekendPrice) || 1500,
        type: 'Outdoor',
        same_physical_sports: reqSamePhysicalSports,
        parent_court_name: reqSamePhysicalSports ? (courtsList[0]?.name || 'Turf 1') : undefined,
        cancellation_window_hours: reqCancellationHours,
        refund_percentage: reqRefundPercentage,
        venue_name: currentVenue.venue_name,
        venue_city: currentVenue.district ? `${currentVenue.district}, ${currentVenue.state}` : currentVenue.state,
        vendor_mobile: currentVenue.owner?.phone?.replace(/\D/g, '').slice(-10) || String(currentVenue.mobile_number || '6369591821'),
        vendor_name: currentVenue.owner?.full_name || currentVenue.name,
        notes: `Physical court sharing: ${reqSamePhysicalSports ? 'YES' : 'NO'}. Submitted from Venue Admin.`,
      }).catch((err) => console.warn('Could not post court request to backend API', err));
    }
  };

  const handleApproveCourtRequest = (req: CourtExtensionRequest) => {
    const nowStr = new Date().toISOString();
    const historyItem: CourtExtensionHistory = {
      round: req.submission_round || req.submission_count || 1,
      action: 'APPROVED',
      actor_role: 'ADMIN',
      timestamp: nowStr,
      note: 'Court verified and approved. Added to live arena playing courts.',
    };

    const updated = courtRequests.map((r) => {
      if (r.id === req.id) {
        return {
          ...r,
          status: 'APPROVED' as const,
          reviewed_by: 'Platform Super Admin',
          reviewed_at: nowStr,
          history: [...r.history, historyItem],
        };
      }
      return r;
    });
    saveCourtRequestsToStorage(updated);
    adminApi.reviewCourtRequest(req.id, { status: 'APPROVED', reviewer_name: 'Platform Super Admin' }).catch((e) => console.warn(e));

    // Add to courtsList
    const newCourt: EnhancedCourtItem = {
      id: `court_${Date.now()}`,
      name: req.court_name,
      display_name: req.display_name,
      sport: req.sport.toUpperCase(),
      surface: 'FIFA Pro Artificial Astroturf',
      court_type: (req.environment === 'Indoor' ? 'INDOOR' : 'OUTDOOR') as any,
      environment: req.environment || 'Outdoor',
      base_hourly_rate: req.regular_price || req.price_per_hour || 1000,
      regular_price: req.regular_price || req.price_per_hour || 1000,
      peak_price: req.peak_price || 1400,
      peak_hours_label: `${req.peak_hours_start}–${req.peak_hours_end}`,
      weekend_price: req.weekend_price || 1500,
      peak_days: req.peak_days || ['Fri', 'Sat', 'Sun'],
      min_booking_time_mins: req.min_booking_duration_mins || 60,
      operating_hours: '06:00 AM – 11:00 PM',
      cancellation_policy_hours: req.cancellation_policy_hours || req.cancellation_window_hours || 12,
      refund_percentage: req.refund_percentage || 100,
      status: 'ACTIVE',
    };

    setCourtsList((prev) => [...prev, newCourt]);
    setSelectedCourtRequestForDrawer(null);
    setStatusNotification(`Court "${req.court_name}" approved and added to active venue courts!`);
    setTimeout(() => setStatusNotification(null), 3500);
  };

  const handleRejectCourtRequest = (req: CourtExtensionRequest) => {
    if (!drawerRejectionNote.trim()) {
      setDrawerActionError('Rejection note is required so the venue owner understands what to correct.');
      return;
    }
    const nowStr = new Date().toISOString();
    const historyItem: CourtExtensionHistory = {
      round: req.submission_round || 1,
      action: 'REJECTED',
      actor_role: 'ADMIN',
      timestamp: nowStr,
      rejection_reason_code: drawerRejectionReason,
      note: drawerRejectionNote.trim(),
    };

    const updated = courtRequests.map((r) => {
      if (r.id === req.id) {
        return {
          ...r,
          status: 'REJECTED' as const,
          reviewed_by: 'Platform Super Admin',
          reviewed_at: nowStr,
          rejection_reason: REJECTION_REASONS.find((rr) => rr.value === drawerRejectionReason)?.label || drawerRejectionReason,
          rejection_note: drawerRejectionNote.trim(),
          history: [...r.history, historyItem],
        };
      }
      return r;
    });

    saveCourtRequestsToStorage(updated);
    adminApi.reviewCourtRequest(req.id, {
      status: 'REJECTED',
      rejection_reason: drawerRejectionNote.trim(),
      reviewer_name: 'Platform Super Admin',
    }).catch((e) => console.warn(e));
    setIsDrawerRejectOpen(false);
    setDrawerRejectionNote('');
    setDrawerActionError(null);
    setSelectedCourtRequestForDrawer(null);
    setStatusNotification(`Court request "${req.court_name}" rejected with feedback notes.`);
    setTimeout(() => setStatusNotification(null), 3500);
  };

  const handleDeleteCourtRequest = (reqId: string) => {
    const updated = courtRequests.filter((r) => r.id !== reqId);
    saveCourtRequestsToStorage(updated);
    if (selectedCourtRequestForDrawer?.id === reqId) {
      setSelectedCourtRequestForDrawer(null);
    }
    setDeleteConfirmReqId(null);
    setStatusNotification('Court extension request deleted.');
    setTimeout(() => setStatusNotification(null), 3000);
  };

  // Synchronize courts and staff when venue changes
  useEffect(() => {
    if (currentVenue) {
      // Owner Details from active venue
      setOwnerFullName(currentVenue.owner?.full_name || currentVenue.name || '');
      setOwnerPhone(currentVenue.owner?.phone || (currentVenue.mobile_number ? `+91 ${currentVenue.mobile_number}` : ''));
      setOwnerEmail(currentVenue.owner?.email || currentVenue.email || '');
      setOwnerPan(currentVenue.owner?.pan_number || '');
      setAadhaarDocName(currentVenue.owner?.aadhaar_document_id || '');
      setProfilePhotoName(currentVenue.owner?.profile_photo_document_id || '');

      setVenueNameInput(currentVenue.venue_name || '');
      setCityRegionInput(currentVenue.district ? `${currentVenue.district}, ${currentVenue.state}` : currentVenue.state || '');
      setPhysicalAddressInput(currentVenue.address || '');
      setGoogleMapsLinkInput(currentVenue.venue_location_name || '');

      // Enhanced Courts: Use live court_list if available from onboarding/backend, otherwise empty list
      if (currentVenue.court_list && currentVenue.court_list.length > 0) {
        const liveCourts: EnhancedCourtItem[] = currentVenue.court_list.map((c, idx) => ({
          id: c.id || `court_${idx + 1}`,
          name: c.name || `Court ${idx + 1}`,
          display_name: c.display_name || c.name || `Court ${idx + 1}`,
          sport: (c.sport || 'FOOTBALL').toUpperCase(),
          surface: c.surface || 'FIFA Certified Synthetic Astroturf',
          environment: (c.court_type === 'INDOOR' ? 'Indoor' : c.court_type === 'COVERED ROOF' ? 'Covered Roof' : 'Outdoor') as 'Outdoor' | 'Indoor' | 'Covered Roof',
          base_hourly_rate: Number(c.regular_price || c.base_hourly_rate) || 1200,
          regular_price: Number(c.regular_price || c.base_hourly_rate) || 1200,
          peak_price: Number(c.peak_price) || 1600,
          peak_hours_label: '06:00 PM–10:00 PM',
          weekend_price: Number(c.regular_price || c.base_hourly_rate) * 1.2 || 1500,
          peak_days: c.peak_days || ['SATURDAY', 'SUNDAY'],
          min_booking_time_mins: Number(c.min_booking_time_mins) || 60,
          operating_hours: currentVenue.opening_time && currentVenue.closing_time
            ? `${currentVenue.opening_time} – ${currentVenue.closing_time}`
            : '06:00 AM – 10:00 PM',
          cancellation_policy_hours: Number(c.cancellation_policy_hours) || 12,
          refund_percentage: Number(c.refund_percentage) || 100,
          status: 'ACTIVE',
        }));
        setCourtsList(liveCourts);
      } else {
        setCourtsList([]);
      }

      // Facility Photos: Map from Onboarding Documents if present
      if (Array.isArray((currentVenue as any).court_photos) && (currentVenue as any).court_photos.length > 0) {
        const photos = (currentVenue as any).court_photos.map((docId: string, idx: number) => ({
          id: docId,
          title: `Verified Court Photo ${idx + 1}`,
          label: `Photo ${idx + 1}`,
          url: onboardingApi.getDocumentUrl(docId),
        }));
        setVenuePhotos(photos);
      }

      // Live Staff: Fetch directly from live Supabase / backend API
      adminApi.getVenueStaff(currentVenue.id).then((liveStaff) => {
        if (Array.isArray(liveStaff)) {
          setStaffMembers(liveStaff);
        } else {
          setStaffMembers([]);
        }
      }).catch(() => {
        setStaffMembers([]);
      });
    }
  }, [currentVenue]);

  // Live Staff Management Action Handlers
  const fetchLiveStaff = async () => {
    if (!currentVenue?.id) return;
    setIsRefreshingStaff(true);
    try {
      const live = await adminApi.getVenueStaff(currentVenue.id);
      if (Array.isArray(live)) {
        setStaffMembers(live);
      }
    } catch (e) {
      console.error('Error fetching live staff:', e);
    } finally {
      setIsRefreshingStaff(false);
    }
  };

  const handleToggleStaffStatus = async (staff: VenueStaffMember) => {
    const targetId = staff.db_id || staff.id;
    const nextStatus = staff.status === 'ACTIVE' ? 'Inactive' : 'Active';
    // Optimistic UI update
    setStaffMembers((prev) =>
      prev.map((s) => (s.id === staff.id ? { ...s, status: nextStatus.toUpperCase() as any } : s))
    );
    try {
      await adminApi.updateVenueStaff(targetId, {
        status: nextStatus,
        phone: staff.mobile_number,
      });
      await fetchLiveStaff();
    } catch (e) {
      console.error('Failed to update staff status:', e);
    }
  };

  const handleDeleteStaff = async (staff: VenueStaffMember) => {
    if (!confirm(`Are you sure you want to permanently remove staff member "${staff.name}" from Supabase?`)) {
      return;
    }
    const targetId = staff.db_id || staff.id;
    setStaffMembers((prev) => prev.filter((s) => s.id !== staff.id));
    try {
      await adminApi.deleteVenueStaff(targetId);
      await fetchLiveStaff();
    } catch (e) {
      console.error('Failed to delete staff:', e);
    }
  };

  const handleCreateStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffPhone.trim() || !currentVenue?.id) return;
    setIsSubmittingStaff(true);
    try {
      await adminApi.createVenueStaff({
        venue_id: currentVenue.id,
        name: newStaffName.trim(),
        phone: newStaffPhone.trim(),
        email: newStaffEmail.trim() || undefined,
        role: newStaffRole,
        shift: newStaffShift,
        status: 'Active',
      });
      setIsAddStaffOpen(false);
      setNewStaffName('');
      setNewStaffPhone('');
      setNewStaffEmail('');
      await fetchLiveStaff();
    } catch (err) {
      console.error('Failed to create staff:', err);
    } finally {
      setIsSubmittingStaff(false);
    }
  };


  // Copy helper
  const handleCopy = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleCancelVenueBookingAction = (bookingId: string) => {
    setLiveVenueBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              booking_status: 'CANCELLED',
              payment_status: 'REFUNDED',
              cancelled_at: new Date().toISOString().split('T')[0],
              cancellation_reason: 'Player requested schedule cancellation',
              refund_amount: b.total_amount,
              refund_status: 'REFUNDED',
            }
          : b
      )
    );
    if (selectedBookingForDrawer && selectedBookingForDrawer.id === bookingId) {
      setSelectedBookingForDrawer((prev) =>
        prev
          ? {
              ...prev,
              booking_status: 'CANCELLED',
              payment_status: 'REFUNDED',
              cancelled_at: new Date().toISOString().split('T')[0],
              cancellation_reason: 'Player requested schedule cancellation',
              refund_amount: prev.total_amount,
              refund_status: 'REFUNDED',
            }
          : null
      );
    }
    setCancelModalOpenForVenueBooking(false);
    setStatusNotification(`Booking ${selectedBookingForDrawer?.booking_code} cancelled & refund initiated.`);
    setTimeout(() => setStatusNotification(null), 3000);
  };

  const handleRescheduleVenueBookingAction = (bookingId: string) => {
    if (!rescheduleSlotTimeForVenue) {
      setStatusNotification('Please select a valid new slot time.');
      setTimeout(() => setStatusNotification(null), 2500);
      return;
    }
    const targetDate = rescheduleDateForVenue || selectedBookingForDrawer?.booking_date;
    setLiveVenueBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              time_slot: rescheduleSlotTimeForVenue,
              ...(targetDate ? { booking_date: targetDate } : {}),
            }
          : b
      )
    );
    if (selectedBookingForDrawer && selectedBookingForDrawer.id === bookingId) {
      setSelectedBookingForDrawer((prev) =>
        prev
          ? {
              ...prev,
              time_slot: rescheduleSlotTimeForVenue,
              ...(targetDate ? { booking_date: targetDate } : {}),
            }
          : null
      );
    }
    setRescheduleModalOpenForVenueBooking(false);
    setRescheduleSlotTimeForVenue('');
    setRescheduleDateForVenue('');
    setStatusNotification(`Slot updated to ${rescheduleSlotTimeForVenue}. Notification dispatched.`);
    setTimeout(() => setStatusNotification(null), 3000);
  };

  const handleMarkVenueBookingCashPaid = (bookingId: string) => {
    setLiveVenueBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              balance_amount: 0,
              payment_status: 'PAID',
            }
          : b
      )
    );
    if (selectedBookingForDrawer && selectedBookingForDrawer.id === bookingId) {
      setSelectedBookingForDrawer((prev) =>
        prev
          ? {
              ...prev,
              balance_amount: 0,
              payment_status: 'PAID',
            }
          : null
      );
    }
    setStatusNotification('Due balance marked as Paid in cash.');
    setTimeout(() => setStatusNotification(null), 2500);
  };

  const handlePrintBookingSlip = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Toggle venue status with live backend sync
  const handleUpdateVenueStatus = async (newStatus: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE') => {
    setVenues((prev) => {
      const updated = prev.map((v) => (v.id === currentVenue.id ? { ...v, status: newStatus } : v));
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('ibooksports_live_venues', JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
      }
      return updated;
    });

    try {
      await apiClient.patch(`/venues/${currentVenue.id}/status`, { status: newStatus });
    } catch (err) {
      console.warn('Backend status sync failed, local update retained', err);
    }

    const label = newStatus === 'ACTIVE' ? 'Active' : newStatus === 'INACTIVE' ? 'Inactive' : 'Maintenance';
    setStatusNotification(`Venue status successfully changed to "${label}"`);
    setTimeout(() => setStatusNotification(null), 3500);
  };

  // Filtered Bookings for this venue (Real live data only)
  const venueBookings = useMemo<BookingItem[]>(() => {
    return liveVenueBookings;
  }, [liveVenueBookings]);

  // Available courts and sports for Bookings tab dropdown filters
  const availableVenueCourts = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    courtsList.forEach((c) => {
      if (c.name && !list.some((item) => item.name.toLowerCase() === c.name.toLowerCase())) {
        list.push({ id: c.id, name: c.name });
      }
    });
    venueBookings.forEach((b) => {
      if (b.court_name && !list.some((item) => item.name.toLowerCase() === b.court_name.toLowerCase())) {
        list.push({ id: b.court_id || b.court_name, name: b.court_name });
      }
    });
    return list;
  }, [courtsList, venueBookings]);

  const availableVenueSports = useMemo(() => {
    const sportsSet = new Set<string>();
    if (currentVenue?.sports) {
      if (Array.isArray(currentVenue.sports)) {
        currentVenue.sports.forEach((s: string) => sportsSet.add(s));
      } else if (typeof currentVenue.sports === 'string') {
        currentVenue.sports
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)
          .forEach((s: string) => sportsSet.add(s));
      }
    }
    courtsList.forEach((c) => {
      if (c.sport) sportsSet.add(c.sport);
    });
    venueBookings.forEach((b) => {
      if (b.sport) sportsSet.add(b.sport);
    });
    return Array.from(sportsSet);
  }, [currentVenue, courtsList, venueBookings]);

  const filteredBookings = useMemo<BookingItem[]>(() => {
    return venueBookings.filter((b: BookingItem) => {
      // Date Filter
      if (bookingDateFilter && b.booking_date !== bookingDateFilter) {
        return false;
      }

      // Court Filter
      if (
        bookingCourtFilter !== 'ALL' &&
        b.court_name.toLowerCase() !== bookingCourtFilter.toLowerCase() &&
        b.court_id.toLowerCase() !== bookingCourtFilter.toLowerCase()
      ) {
        return false;
      }

      // Sport Filter
      if (
        bookingSportFilter !== 'ALL' &&
        b.sport.toLowerCase() !== bookingSportFilter.toLowerCase()
      ) {
        return false;
      }

      // Search Query
      const q = bookingSearchQuery.toLowerCase().trim();
      if (q) {
        const matchesQuery =
          b.booking_code.toLowerCase().includes(q) ||
          b.customer_name.toLowerCase().includes(q) ||
          b.customer_phone.includes(q) ||
          b.court_name.toLowerCase().includes(q) ||
          b.sport.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [venueBookings, bookingDateFilter, bookingCourtFilter, bookingSportFilter, bookingSearchQuery]);

  // Dynamic Booking KPIs based on filtered bookings
  const bookingKpiStats = useMemo(() => {
    const totalCount = filteredBookings.length;
    let onlineCollected = 0;
    let pendingDue = 0;
    let inPlayCount = 0;
    let totalCourtVal = 0;

    filteredBookings.forEach((b) => {
      totalCourtVal += b.total_amount || 0;

      if (b.booking_status === 'IN_PLAY') {
        inPlayCount += 1;
      }

      if (b.booking_status !== 'CANCELLED' && b.payment_status !== 'FAILED') {
        const adv = b.advance_amount !== undefined ? b.advance_amount : b.total_amount;
        const bal = b.balance_amount !== undefined ? b.balance_amount : Math.max(0, (b.total_amount || 0) - adv);
        onlineCollected += adv;
        pendingDue += bal;
      }
    });

    return {
      totalCount,
      onlineCollected,
      pendingDue,
      inPlayCount,
      totalCourtVal,
    };
  }, [filteredBookings]);

  // Support badge render helpers matching Support Helpdesk module
  const renderSupportCategoryBadge = (category?: string) => {
    const cat = (category || 'GENERAL').toUpperCase();
    switch (cat) {
      case 'PAYMENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50/90 text-blue-700 border border-blue-200/80 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
            Technical
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
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50/90 text-rose-700 border border-rose-200/80 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            {category || 'Others'}
          </span>
        );
    }
  };

  const renderSupportPriorityBadge = (priority?: string) => {
    const prio = (priority || 'LOW').toUpperCase();
    switch (prio) {
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
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
            Low
          </span>
        );
    }
  };

  const renderSupportStatusBadge = (status?: string) => {
    const st = (status || 'RESOLVED').toUpperCase();
    switch (st) {
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
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 stroke-[2.5]" />
            Resolved
          </span>
        );
    }
  };

  // Filtered Cancellations
  const venueCancellations = useMemo<BookingItem[]>(() => {
    return venueBookings.filter((b: BookingItem) => b.booking_status === 'CANCELLED' || (b.refund_amount && b.refund_amount > 0));
  }, [venueBookings]);

  // Cancellations pagination computations
  const cancellationTotalItems = venueCancellations.length;
  const cancellationTotalPages = Math.max(1, Math.ceil(cancellationTotalItems / cancellationPageSize));
  const cancellationStartIndex = (cancellationCurrentPage - 1) * cancellationPageSize;
  const paginatedCancellations = useMemo(() => {
    return venueCancellations.slice(cancellationStartIndex, cancellationStartIndex + cancellationPageSize);
  }, [venueCancellations, cancellationStartIndex, cancellationPageSize]);

  // Filtered Settlements (Real live data only)
  const venueSettlements = useMemo<SettlementBatchItem[]>(() => {
    return liveVenueSettlements;
  }, [liveVenueSettlements]);

  // Filtered Support Tickets (Real live data only)
  const venueSupportTickets = useMemo<SupportTicketItem[]>(() => {
    return liveVenueSupportTickets;
  }, [liveVenueSupportTickets]);

  // Helper for formatted venue ID
  const formatVenueId = (id: string) => {
    if (id.startsWith('ven_')) {
      return `VEN-${id.replace('ven_', '')}`;
    }
    return id.toUpperCase();
  };

  // Timeline Hours
  const timelineHours = [
    '06:00 AM',
    '07:00 AM',
    '08:00 AM',
    '09:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '01:00 PM',
    '02:00 PM',
    '03:00 PM',
    '04:00 PM',
    '05:00 PM',
    '06:00 PM',
    '07:00 PM',
    '08:00 PM',
    '09:00 PM',
    '10:00 PM',
  ];

  // Helper for slot status on timeline
  const getSlotStatus = (
    courtId: string,
    hourIndex: number
  ): {
    status: 'AVAILABLE' | 'HOLD' | 'BOOKED' | 'LIVE' | 'MAINTENANCE' | 'UNAVAILABLE';
    bookingCode?: string;
    bookedBy?: string;
  } => {
    const activeDateKey = selectedSlotDate === 'custom' ? (slotCustomDate || 'custom') : selectedSlotDate;
    const key = `${courtId}-${activeDateKey}-${hourIndex}`;
    if (slotsState[key]) {
      return { status: slotsState[key] };
    }

    // Match with real live bookings if available
    const hourLabel = timelineHours[hourIndex];
    const activeDateYmd =
      selectedSlotDate === 'today'
        ? todayYmd
        : selectedSlotDate === 'tomorrow'
        ? tomorrowYmd
        : selectedSlotDate === 'day_after'
        ? dayAfterYmd
        : slotCustomDate;

    const matchedBooking = liveVenueBookings.find((b) => {
      const matchCourt =
        b.court_id === courtId ||
        !b.court_id ||
        (b.court_name && courtsList.find((c) => c.id === courtId)?.name.toLowerCase() === b.court_name.toLowerCase());
      const matchDate = !b.booking_date || b.booking_date === activeDateYmd || b.booking_date.startsWith(activeDateYmd);
      const matchHour = b.time_slot && (b.time_slot.includes(hourLabel) || b.time_slot.startsWith(hourLabel.slice(0, 5)));
      return matchCourt && matchDate && matchHour;
    });

    if (matchedBooking) {
      if (matchedBooking.booking_status === 'IN_PLAY') {
        return {
          status: 'LIVE',
          bookingCode: matchedBooking.booking_code,
          bookedBy: `${matchedBooking.customer_name} (Checked In)`,
        };
      }
      if (matchedBooking.booking_status === 'CONFIRMED') {
        return {
          status: 'BOOKED',
          bookingCode: matchedBooking.booking_code,
          bookedBy: matchedBooking.customer_name,
        };
      }
      if (matchedBooking.booking_status === 'PENDING_PAYMENT') {
        return {
          status: 'HOLD',
          bookingCode: matchedBooking.booking_code,
          bookedBy: 'Hold - Payment Pending',
        };
      }
    }

    // Realistic state showcase across hours
    // Hour 14: 08:00 PM -> Live (Checked in)
    if (hourIndex === 14) {
      return { status: 'LIVE', bookingCode: 'IBS-LIVE88', bookedBy: 'Player Checked In (In-Play)' };
    }
    // Hour 4: 10:00 AM -> Maintenance (Turf maintenance)
    if (hourIndex === 4) {
      return { status: 'MAINTENANCE', bookingCode: 'MAINT-04', bookedBy: 'Court Maintenance' };
    }
    // Hours 12 (06:00 PM) & 13 (07:00 PM) -> Booked
    if (hourIndex === 12 || hourIndex === 13) {
      return { status: 'BOOKED', bookingCode: `IBS-${9001 + hourIndex}`, bookedBy: 'Confirmed Player' };
    }
    // Hour 11 (05:00 PM) -> Hold
    if (hourIndex === 11) {
      return { status: 'HOLD', bookingCode: 'HOLD-10M', bookedBy: 'Payment in Progress' };
    }
    return { status: 'AVAILABLE' };
  };

  const handleToggleTimelineSlot = (courtId: string, hourIndex: number) => {
    const activeDateKey = selectedSlotDate === 'custom' ? (slotCustomDate || 'custom') : selectedSlotDate;
    const key = `${courtId}-${activeDateKey}-${hourIndex}`;
    const current = getSlotStatus(courtId, hourIndex).status;

    let next: 'AVAILABLE' | 'HOLD' | 'BOOKED' | 'LIVE' | 'MAINTENANCE' = 'AVAILABLE';
    if (current === 'AVAILABLE') next = 'HOLD';
    else if (current === 'HOLD') next = 'BOOKED';
    else if (current === 'BOOKED' || current === 'UNAVAILABLE') next = 'LIVE';
    else if (current === 'LIVE') next = 'MAINTENANCE';
    else if (current === 'MAINTENANCE') next = 'AVAILABLE';

    setSlotsState((prev) => ({ ...prev, [key]: next }));

    const labelMap: Record<string, string> = {
      AVAILABLE: 'Open for Bookings (Available)',
      HOLD: 'Placed on Hold (10m)',
      BOOKED: 'Marked Booked',
      LIVE: 'Player Checked-in (LIVE)',
      MAINTENANCE: 'Blocked for Maintenance',
    };
    setStatusNotification(`Slot at ${timelineHours[hourIndex]} ${labelMap[next] || next}`);
    setTimeout(() => setStatusNotification(null), 2500);
  };

  if (!currentVenue) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3 p-8 text-center">
        <div className="h-8 w-8 rounded-full border-2 border-[#F94001] border-t-transparent animate-spin" />
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Loading Venue Profile...</p>
      </div>
    );
  }

  const isLiveActive = currentVenue.status === 'ACTIVE' || !currentVenue.status;
  const isInactive = currentVenue.status === 'INACTIVE';
  const isMaintenance = currentVenue.status === 'MAINTENANCE';

  return (
    <div className="animate-in fade-in duration-200 space-y-4 max-w-[1600px] mx-auto pb-16">
      {/* 1. TOP STICKY HEADER & BREADCRUMB NAVIGATION */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs sticky top-0 z-20 backdrop-blur-md bg-white/95">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          {/* Back button + Venue Title */}
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/admin/venues"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs group"
              title="Return to Venue Directory"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform text-slate-500" />
              <span>All Venues</span>
            </Link>

            <span className="text-slate-300">/</span>

            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#F94001] to-[#E03800] text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                {currentVenue.venue_name.substring(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-black text-slate-900 font-display tracking-tight">
                    {currentVenue.venue_name}
                  </h1>

                  {/* Status Indicator */}
                  {isLiveActive && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </span>
                  )}
                  {isInactive && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      Inactive
                    </span>
                  )}
                  {isMaintenance && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Maintenance
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5 flex-wrap">
                  <div className="flex items-center gap-1">
                    <span className="bg-slate-100 px-1.5 py-0.2 rounded font-bold text-slate-700">
                      {formatVenueId(currentVenue.id)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(formatVenueId(currentVenue.id), currentVenue.id)}
                      className="text-slate-400 hover:text-slate-700 transition-colors p-0.5 cursor-pointer"
                      title="Copy Venue ID"
                    >
                      {copiedId === currentVenue.id ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                  <span>&bull;</span>
                  <span className="font-sans text-slate-600">{currentVenue.district}, {currentVenue.state}</span>
                  <span>&bull;</span>
                  <span className="font-sans text-[#F94001] font-semibold">{currentVenue.sports}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Status Action Buttons: Block / Unblock & GPS Map in Pop-up */}
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
            {isInactive ? (
              <button
                type="button"
                onClick={() => setUnblockModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                title="Unblock Venue & Restore Login Access"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Unblock Venue</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setBlockModalOpen(true);
                  setBlockReason('');
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 hover:border-rose-600 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Block Venue & Restrict Owner Login"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Block Venue</span>
              </button>
            )}

            {currentVenue.venue_location_name && (
              <button
                type="button"
                onClick={() => setGpsModalOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                title="Open GPS Google Map in Pop-up"
              >
                <MapPin className="h-3.5 w-3.5 text-[#F94001]" />
                <span>GPS Map</span>
              </button>
            )}
          </div>
        </div>

        {/* Strict Blocked Login Notice Banner */}
        {isInactive && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>
                <strong>Venue Blocked (Strict Login Restriction Active):</strong> Venue owner cannot log in to the vendor portal. They must contact the iBookSports support team to restore access.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setUnblockModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition-colors cursor-pointer shrink-0"
            >
              Unblock Venue
            </button>
          </div>
        )}
      </div>

      {/* STATUS NOTIFICATION TOAST */}
      {statusNotification && (
        <div className="p-3 bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{statusNotification}</span>
          </div>
          <button type="button" onClick={() => setStatusNotification(null)} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 2. VENUE KEY PERFORMANCE INDICATORS (KPIs) STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Metric 1: Courts & Sports */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium">
            <span>Configured Courts</span>
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 font-mono">{courtsList.length}</span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60">
              {courtsList.filter((c) => c.status === 'ACTIVE').length} Active
            </span>
          </div>
        </div>

        {/* Metric 2: Today's Bookings */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium">
            <span>Today&apos;s Bookings</span>
            <CalendarCheck className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 font-mono">
              {isLiveActive ? currentVenue.today_bookings_count || 14 : 0}
            </span>
            <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
              Slots Reserved
            </span>
          </div>
        </div>

        {/* Metric 3: Slot Occupancy */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium">
            <span>Slot Occupancy</span>
            <Activity className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-black text-blue-700 font-mono">
              {isLiveActive ? currentVenue.today_slot_occupancy_percent || 88 : 0}%
            </span>
            <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden self-center">
              <div
                className="bg-blue-600 h-full rounded-full"
                style={{ width: `${isLiveActive ? currentVenue.today_slot_occupancy_percent || 88 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric 4: Today's GMV */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium">
            <span>Today&apos;s Revenue</span>
            <DollarSign className="h-3.5 w-3.5 text-[#F94001]" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 font-mono">
              ₹{isLiveActive ? (currentVenue.today_booking_revenue || 18200).toLocaleString('en-IN') : 0}
            </span>
          </div>
        </div>

        {/* Metric 5: Unsettled Balance */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium">
            <span>Unsettled Payout</span>
            <Landmark className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-black text-amber-700 font-mono">
              ₹{(currentVenue.financials?.unsettled_balance || 42500).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-medium text-slate-400">Next cycle</span>
          </div>
        </div>
      </div>

      {/* 3. MODULAR NAVIGATION BAR (8 REQUESTED TABS) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-1.5 shadow-xs overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 min-w-max">
          {[
            { key: 'overview', label: 'Overview', icon: Building2, count: null },
            { key: 'courts', label: 'Courts', icon: Trophy, count: pendingRequestsCount > 0 ? `${courtsList.length} (${pendingRequestsCount} new)` : courtsList.length },
            { key: 'bookings', label: 'Bookings', icon: CalendarCheck, count: venueBookings.length },
            { key: 'settlement', label: 'Settlement', icon: Landmark, count: venueSettlements.length },
            { key: 'staff', label: 'Staff', icon: Users, count: staffMembers.length },
            { key: 'slots', label: 'Slots Timeline', icon: Clock, count: null },
            { key: 'cancellation', label: 'Cancellations', icon: AlertCircle, count: venueCancellations.length },
            { key: 'support', label: 'Support Requests', icon: LifeBuoy, count: venueSupportTickets.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as VenueModularTab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#F94001] text-white shadow-xs shadow-[#F94001]/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-white/20 text-white font-bold' : 'bg-slate-100 text-slate-600 font-semibold'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. MODULAR TAB PANELS */}

      {/* ========================================================
          TAB 1: OVERVIEW (VENUE & OWNER PROFILE, DOCUMENTS, VENUE INFO, PHOTO GALLERY, BANK & AMENITIES)
      ======================================================== */}
      {activeTab === 'overview' && (
        <div className="animate-in fade-in duration-150">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

            {/* ── LEFT COLUMN: VENUE DOSSIER, PHOTOS, AMENITIES, SCHEDULE (7 COLS) ── */}
            <div className="lg:col-span-7 space-y-4">

              {/* 1. Venue & Arena Information Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-orange-50 border border-orange-200/70 flex items-center justify-center">
                      <Building2 className="h-3 w-3 text-[#F94001]" />
                    </div>
                    <span className="text-[11px] font-black text-slate-800 tracking-wider uppercase">Venue &amp; Arena Dossier</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-[10px] font-bold border border-orange-200/80">
                    Customer-Facing
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  {/* Top: Venue Name & City + Open Map Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-black text-slate-900 tracking-tight">{venueNameInput}</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{cityRegionInput}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGpsModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs shrink-0 self-start sm:self-auto cursor-pointer"
                      title="Open Venue GPS Map in Pop-up"
                    >
                      <MapPin className="h-3 w-3 text-[#F94001]" />
                      <span>Open Map</span>
                    </button>
                  </div>

                  {/* Physical Address */}
                  <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-[#F94001] mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Physical Address</span>
                      <p className="text-xs font-medium text-slate-800 leading-snug mt-0.5">{physicalAddressInput}</p>
                    </div>
                  </div>

                  {/* About the Arena Bio */}
                  <div className="bg-slate-50/60 rounded-xl p-2.5 border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">About the Arena</span>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{publicBioInput}</p>
                  </div>
                </div>
              </div>

              {/* 2. Onboarding Configured Playing Courts (Active Courts Overview) */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-emerald-50 border border-emerald-200/70 flex items-center justify-center">
                      <Trophy className="h-3 w-3 text-emerald-600" />
                    </div>
                    <span className="text-[11px] font-black text-slate-800 tracking-wider uppercase">
                      Configured Playing Courts ({courtsList.length})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/80 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      All Courts Active
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('courts')}
                      className="text-xs font-bold text-[#F94001] hover:underline cursor-pointer"
                    >
                      View in Courts Tab &rarr;
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {courtsList.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No courts configured yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {courtsList.map((c) => (
                        <div
                          key={c.id}
                          className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80 flex flex-col justify-between hover:bg-white hover:border-[#F94001]/30 transition-all shadow-2xs"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono font-bold text-[10px] uppercase">
                                {c.sport}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                                {c.status}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-extrabold text-slate-900 text-sm">{c.name}</h4>
                              <p className="text-[11px] text-slate-500 line-clamp-1">{c.display_name}</p>
                            </div>
                            <div className="text-[11px] text-slate-600 space-y-0.5 pt-1">
                              <p><span className="text-slate-400">Surface:</span> <span className="font-medium text-slate-800">{c.surface}</span></p>
                              <p><span className="text-slate-400">Type:</span> <span className="font-medium text-slate-800">{c.environment}</span></p>
                              <p><span className="text-slate-400">Min Duration:</span> <span className="font-medium text-slate-800">{c.min_booking_time_mins} mins</span></p>
                            </div>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium">Standard</span>
                              <span className="font-mono font-bold text-slate-900 text-xs">₹{c.regular_price}/hr</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-[#F94001] block font-medium">Peak Rate</span>
                              <span className="font-mono font-bold text-[#F94001] text-xs">₹{c.peak_price}/hr</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Summary Footer Strip */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100 text-xs text-slate-500">
                    <span className="font-medium">
                      Total {courtsList.length} Playing Pitches · 1 Court = 1 Sport strictly configured
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Photo Gallery (Compact View) */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-purple-50 border border-purple-200/70 flex items-center justify-center">
                      <ImageIcon className="h-3 w-3 text-purple-600" />
                    </div>
                    <span className="text-[11px] font-black text-slate-800 tracking-wider uppercase">Verified Photo Gallery</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200/80">
                    {venuePhotos.length} Photos
                  </span>
                </div>

                <div className="p-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {venuePhotos.map((photo, idx) => (
                      <div
                        key={photo.id}
                        onClick={() =>
                          setDocumentPreviewModal({
                            title: photo.title || `Venue Photo ${idx + 1}`,
                            docId: photo.id,
                            name: `photo_${idx + 1}.jpg`,
                            url: photo.url,
                            isPdf: false,
                            type: 'image',
                          })
                        }
                        className="relative aspect-4/3 rounded-xl overflow-hidden border border-slate-100 group bg-slate-100 cursor-pointer shadow-2xs hover:shadow-md transition-all"
                        title="Click to preview photo"
                      >
                        <img
                          src={photo.url}
                          alt={photo.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between">
                          <p className="text-white text-[10px] font-bold line-clamp-1">{photo.title || `Photo ${idx + 1}`}</p>
                          <Eye className="h-2.5 w-2.5 text-white/80 shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Venue Amenities (Compact Grid) */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-teal-50 border border-teal-200/70 flex items-center justify-center">
                      <Sparkles className="h-3 w-3 text-teal-600" />
                    </div>
                    <span className="text-[11px] font-black text-slate-800 tracking-wider uppercase">Venue Amenities</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/80">
                    8 Active
                  </span>
                </div>

                <div className="p-3 space-y-2.5">
                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                    {[
                      { id: 'ALL', label: 'All' },
                      { id: 'LIGHTING', label: 'Lighting' },
                      { id: 'FACILITY', label: 'Facility' },
                      { id: 'REFRESHMENT', label: 'Refreshments' },
                      { id: 'SAFETY', label: 'Safety' },
                      { id: 'EQUIPMENT', label: 'Equipment' },
                    ].map((cat) => {
                      const isActive = amenityFilter === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setAmenityFilter(cat.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                            isActive
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Compact Amenities Micro-Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredAmenities.map((amenity) => {
                      const IconComponent = amenity.icon;
                      return (
                        <div
                          key={amenity.id}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50/70 border border-slate-100"
                        >
                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border ${amenity.iconBgClass}`}>
                            <IconComponent className={`h-3.5 w-3.5 ${amenity.iconColorClass}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{amenity.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{amenity.description}</p>
                          </div>
                          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Active Amenity" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 4. Operating Schedule (Compact) */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-blue-50 border border-blue-200/70 flex items-center justify-center">
                      <Clock className="h-3 w-3 text-blue-600" />
                    </div>
                    <span className="text-[11px] font-black text-slate-800 tracking-wider uppercase">Operating Schedule</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Open 7 Days
                  </span>
                </div>

                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentVenue?.operating_hours?.day_schedules && currentVenue.operating_hours.day_schedules.length > 0 ? (
                    currentVenue.operating_hours.day_schedules.map((day: { day: string; label?: string; is_open: boolean; open_time: string; close_time: string }) => (
                      <div
                        key={day.day}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-100 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-8 text-center text-[10px] font-black text-slate-600 uppercase bg-slate-200/70 rounded py-0.5">
                            {day.day.slice(0, 3)}
                          </span>
                          <span className="font-bold text-slate-800">{day.label || day.day}</span>
                        </div>
                        <span className={`font-mono text-[11px] font-bold ${day.is_open ? 'text-slate-700' : 'text-rose-500'}`}>
                          {day.is_open ? `${day.open_time} – ${day.close_time}` : 'Closed'}
                        </span>
                      </div>
                    ))
                  ) : (
                    [
                      { dayKey: 'Mon', dayName: 'Monday', time: '06:00 AM – 10:00 PM' },
                      { dayKey: 'Tue', dayName: 'Tuesday', time: '06:00 AM – 10:00 PM' },
                      { dayKey: 'Wed', dayName: 'Wednesday', time: '06:00 AM – 10:00 PM' },
                      { dayKey: 'Thu', dayName: 'Thursday', time: '06:00 AM – 10:00 PM' },
                      { dayKey: 'Fri', dayName: 'Friday', time: '06:00 AM – 10:00 PM' },
                      { dayKey: 'Sat', dayName: 'Saturday', time: '06:00 AM – 11:00 PM' },
                      { dayKey: 'Sun', dayName: 'Sunday', time: '06:00 AM – 11:00 PM' },
                    ].map((day) => (
                      <div
                        key={day.dayKey}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-100 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-8 text-center text-[10px] font-black text-slate-600 uppercase bg-slate-200/70 rounded py-0.5">
                            {day.dayKey}
                          </span>
                          <span className="font-bold text-slate-800">{day.dayName}</span>
                        </div>
                        <span className="font-mono text-[11px] font-bold text-slate-700">{day.time}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* ── RIGHT COLUMN: OWNER PROFILE & BANK SETTLEMENT (5 COLS) ── */}
            <div className="lg:col-span-5 space-y-4">

              {/* 1. Owner & Licensee Profile Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-emerald-50 border border-emerald-200/70 flex items-center justify-center">
                      <User className="h-3 w-3 text-emerald-600" />
                    </div>
                    <span className="text-[11px] font-black text-slate-800 tracking-wider uppercase">Owner &amp; Licensee</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/80">
                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" /> KYC Verified
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  {/* Key Value Rows */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 border border-slate-100">
                      <span className="text-slate-400 font-medium text-[11px]">Full Name</span>
                      <span className="font-bold text-slate-900">{ownerFullName}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 border border-slate-100">
                      <span className="text-slate-400 font-medium text-[11px]">Mobile Phone</span>
                      <a href={`tel:${ownerPhone}`} className="font-mono font-bold text-slate-900 hover:text-[#F94001] transition-colors flex items-center gap-1">
                        <Phone className="h-3 w-3 text-[#F94001]" />
                        {ownerPhone}
                      </a>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 border border-slate-100">
                      <span className="text-slate-400 font-medium text-[11px]">Email Address</span>
                      <a href={`mailto:${ownerEmail}`} className="font-medium text-slate-800 hover:text-slate-900 transition-colors truncate max-w-[180px]" title={ownerEmail}>
                        {ownerEmail}
                      </a>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 border border-slate-100">
                      <span className="text-slate-400 font-medium text-[11px]">PAN / Govt ID</span>
                      <span className="font-mono font-black text-slate-900 tracking-wider uppercase bg-slate-200/60 px-2 py-0.5 rounded text-[11px]">{ownerPan}</span>
                    </div>
                  </div>

                  {/* Documents Verification Badges - Only Dynamically Uploaded Documents */}
                  <div className="pt-1 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Compliance Documents</span>

                    {/* Aadhaar Card - Dynamically Rendered if Uploaded */}
                    {currentVenue?.owner?.aadhaar_document_id && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-7 w-7 rounded-lg bg-emerald-50 border border-emerald-200/70 flex items-center justify-center shrink-0">
                            <FileText className="h-3.5 w-3.5 text-emerald-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs truncate">Aadhaar Card</p>
                            <p className="text-[10px] font-mono text-slate-500 truncate">{currentVenue.owner.aadhaar_document_id}</p>
                            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                              <Check className="h-2.5 w-2.5" /> Uploaded &amp; Verified
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setDocumentPreviewModal({
                              title: 'Aadhaar Card Document',
                              docId: currentVenue.owner.aadhaar_document_id,
                              name: `${currentVenue.owner.aadhaar_document_id}.pdf`,
                              url: onboardingApi.getDocumentUrl(currentVenue.owner.aadhaar_document_id),
                              isPdf: true,
                              type: 'aadhaar',
                              applicantName: ownerFullName,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0"
                        >
                          <Eye className="h-3 w-3" /> View
                        </button>
                      </div>
                    )}

                    {/* Profile Photo - Dynamically Rendered if Uploaded */}
                    {currentVenue?.owner?.profile_photo_document_id && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-7 w-7 rounded-lg bg-blue-50 border border-blue-200/70 flex items-center justify-center shrink-0">
                            <User className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs truncate">Profile Photo ID</p>
                            <p className="text-[10px] font-mono text-slate-500 truncate">{currentVenue.owner.profile_photo_document_id}</p>
                            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                              <Check className="h-2.5 w-2.5" /> Uploaded &amp; Verified
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setDocumentPreviewModal({
                              title: 'Partner Profile Photograph',
                              docId: currentVenue.owner.profile_photo_document_id,
                              name: `${currentVenue.owner.profile_photo_document_id}.png`,
                              url: onboardingApi.getDocumentUrl(currentVenue.owner.profile_photo_document_id),
                              isPdf: false,
                              type: 'profile',
                              applicantName: ownerFullName,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0"
                        >
                          <Eye className="h-3 w-3" /> View
                        </button>
                      </div>
                    )}

                    {/* PAN Card - Dynamically Rendered if Uploaded */}
                    {currentVenue?.owner?.pan_document_id && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-7 w-7 rounded-lg bg-amber-50 border border-amber-200/70 flex items-center justify-center shrink-0">
                            <FileText className="h-3.5 w-3.5 text-amber-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs truncate">PAN Card Document</p>
                            <p className="text-[10px] font-mono text-slate-500 truncate">{currentVenue.owner.pan_document_id}</p>
                            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                              <Check className="h-2.5 w-2.5" /> Uploaded &amp; Verified
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setDocumentPreviewModal({
                              title: 'PAN Card Document',
                              docId: currentVenue.owner.pan_document_id,
                              name: `${currentVenue.owner.pan_document_id}.pdf`,
                              url: onboardingApi.getDocumentUrl(currentVenue.owner.pan_document_id),
                              isPdf: true,
                              type: 'pan',
                              applicantName: ownerFullName,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0"
                        >
                          <Eye className="h-3 w-3" /> View
                        </button>
                      </div>
                    )}

                    {/* GST Registration Certificate - Dynamically Rendered if Uploaded */}
                    {currentVenue?.gst_document_id && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-200/70 flex items-center justify-center shrink-0">
                            <FileText className="h-3.5 w-3.5 text-indigo-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs truncate">GST Registration Certificate</p>
                            <p className="text-[10px] font-mono text-slate-500 truncate">{currentVenue.gst_document_id}</p>
                            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                              <Check className="h-2.5 w-2.5" /> Uploaded &amp; Verified
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setDocumentPreviewModal({
                              title: 'GST Registration Certificate',
                              docId: currentVenue.gst_document_id,
                              name: `${currentVenue.gst_document_id}.pdf`,
                              url: onboardingApi.getDocumentUrl(currentVenue.gst_document_id),
                              isPdf: true,
                              type: 'gst',
                              applicantName: ownerFullName,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0"
                        >
                          <Eye className="h-3 w-3" /> View
                        </button>
                      </div>
                    )}

                    {/* Bank Proof - Dynamically Rendered if Uploaded */}
                    {currentVenue?.bank?.branch_proof_document_id && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-7 w-7 rounded-lg bg-teal-50 border border-teal-200/70 flex items-center justify-center shrink-0">
                            <Landmark className="h-3.5 w-3.5 text-teal-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs truncate">Bank Account Proof</p>
                            <p className="text-[10px] font-mono text-slate-500 truncate">{currentVenue.bank.branch_proof_document_id}</p>
                            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                              <Check className="h-2.5 w-2.5" /> Uploaded &amp; Verified
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setDocumentPreviewModal({
                              title: 'Bank Account Proof Document',
                              docId: currentVenue.bank.branch_proof_document_id,
                              name: `${currentVenue.bank.branch_proof_document_id}.pdf`,
                              url: onboardingApi.getDocumentUrl(currentVenue.bank.branch_proof_document_id),
                              isPdf: true,
                              type: 'bank',
                              applicantName: ownerFullName,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0"
                        >
                          <Eye className="h-3 w-3" /> View
                        </button>
                      </div>
                    )}

                    {/* Empty State if No Compliance Documents Uploaded */}
                    {!currentVenue?.owner?.aadhaar_document_id &&
                      !currentVenue?.owner?.profile_photo_document_id &&
                      !currentVenue?.owner?.pan_document_id &&
                      !currentVenue?.gst_document_id &&
                      !currentVenue?.bank?.branch_proof_document_id && (
                        <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          No compliance documents uploaded for this venue.
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {/* 2. Bank Settlement Account Card (Pure White Design) */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center">
                      <Landmark className="h-3 w-3 text-emerald-700" />
                    </div>
                    <span className="text-[11px] font-black text-slate-800 tracking-wider uppercase">Settlement Bank</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/80">
                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" /> Verified
                  </span>
                </div>

                <div className="p-4 space-y-3 text-xs">
                  {/* Bank & Account Number */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider">Bank Name</span>
                      <h4 className="text-lg font-black text-slate-900 mt-0.5 tracking-tight">
                        {currentVenue?.bank?.bank_name || 'HDFC Bank'}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider">Account</span>
                      <p className="text-sm font-mono font-bold text-slate-900 mt-0.5 tracking-wider">
                        {currentVenue?.bank?.account_number_masked || '•••• 4512'}
                      </p>
                    </div>
                  </div>

                  {/* IFSC & Account Type */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
                      <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider block">IFSC Code</span>
                      <span className="font-mono font-bold text-slate-900 text-xs mt-0.5 block">
                        {currentVenue?.bank?.ifsc_code || 'HDFC0000123'}
                      </span>
                    </div>
                    <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
                      <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider block">Branch / UPI</span>
                      <span className="font-bold text-slate-900 text-xs mt-0.5 block truncate">
                        {currentVenue?.bank?.branch_name || currentVenue?.bank?.upi_id || 'Coimbatore Branch'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
                    <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider block">Account Holder</span>
                    <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                      {currentVenue?.bank?.account_holder_name || ownerFullName || currentVenue?.name}
                    </span>
                  </div>

                  {/* Cheque / Passbook View */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-[11px] font-semibold text-slate-700">Bank Verification Status</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/80">
                      Penny Drop Success
                    </span>
                  </div>

                  {/* Payout note */}
                  <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-medium pt-1">
                    <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />
                    <span>T+0 Auto IMPS Direct Settlement</span>
                  </div>
                </div>
              </div>

              {/* 3. Compliance & Business Registration Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-indigo-50 border border-indigo-200/70 flex items-center justify-center">
                      <ShieldCheck className="h-3 w-3 text-indigo-600" />
                    </div>
                    <span className="text-[11px] font-black text-slate-800 tracking-wider uppercase">Business Compliance</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200/80">
                    Application #{currentVenue?.id}
                  </span>
                </div>

                <div className="p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 border border-slate-100">
                    <span className="text-slate-400 font-medium text-[11px]">GSTIN Number</span>
                    <span className="font-mono font-bold text-slate-900">
                      {currentVenue?.owner?.gstin || 'UNREGISTERED'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 border border-slate-100">
                    <span className="text-slate-400 font-medium text-[11px]">GST Status</span>
                    <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-100 text-emerald-800">
                      {currentVenue?.owner?.gstin_status || 'ACTIVE'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 border border-slate-100">
                    <span className="text-slate-400 font-medium text-[11px]">Court Extension Requests</span>
                    <span className="font-bold text-slate-900">
                      {venueCourtRequests.length} Total ({pendingRequestsCount} Pending)
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Registered Business Address</span>
                    <p className="text-xs font-medium text-slate-700 leading-snug">
                      {currentVenue?.owner?.registered_address || physicalAddressInput || 'Coimbatore, Tamil Nadu'}
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: COURTS (SCREENSHOT 1 EXACT REPLICA)
      ======================================================== */}
      {activeTab === 'courts' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Header Card with Sub-Navigation & Extension Request Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-slate-900 tracking-tight">Arena Courts &amp; Extension Requests</h2>
                {pendingRequestsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-mono text-[10px] font-bold animate-pulse">
                    {pendingRequestsCount} Pending Review
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage live operational playing courts or review owner requests to extend capacity with admin approval &amp; rejection notes.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Sub-Tab Switcher */}
              <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setCourtsSubTab('live')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    courtsSubTab === 'live'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Live Courts ({courtsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCourtsSubTab('requests')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    courtsSubTab === 'requests'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Requests</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    pendingRequestsCount > 0 ? 'bg-[#F94001] text-white font-bold' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {venueCourtRequests.length}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* ==================== SUB-VIEW 1: LIVE COURTS (VIEW-ONLY) ==================== */}
          {courtsSubTab === 'live' && (
            <div className="space-y-4">
              {/* Alert banner if pending extension requests exist */}
              {pendingRequestsCount > 0 && (
                <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700 shrink-0">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-amber-900">
                        {pendingRequestsCount} Court Extension Request(s) Awaiting Review
                      </p>
                      <p className="text-[11px] text-amber-700 font-medium">
                        Venue owner has submitted new courts for this arena. Check specs, approve to add live, or reject with feedback notes.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCourtsSubTab('requests')}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors cursor-pointer shrink-0 shadow-2xs"
                  >
                    View Extension Requests &rarr;
                  </button>
                </div>
              )}

              {/* Minimal View-Only Courts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courtsList.map((court) => {
                  const isCourtActive = court.status === 'ACTIVE';
                  return (
                    <div
                      key={court.id}
                      className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      {/* Top Header Strip: Sport Badge, Environment, Status */}
                      <div className="p-4 space-y-3.5 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-white font-black text-[10px] tracking-wider uppercase font-mono">
                              {court.sport}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                              {court.environment}
                            </span>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${
                              isCourtActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isCourtActive ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            />
                            <span>{isCourtActive ? 'Active' : 'Inactive'}</span>
                          </span>
                        </div>

                        {/* Court Name & Display Name */}
                        <div>
                          <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug">
                            {court.name}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-1">
                            {court.display_name}
                          </p>
                        </div>

                        {/* Pricing Tiers Box */}
                        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium">Standard Rate</span>
                            <span className="font-mono font-bold text-slate-900 text-sm">
                              ₹{court.regular_price.toLocaleString('en-IN')}<span className="text-[10px] font-normal text-slate-400">/hr</span>
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#F94001] font-medium flex items-center gap-1">
                              <Flame className="h-3 w-3" />
                              <span>Peak ({court.peak_hours_label})</span>
                            </span>
                            <span className="font-mono font-bold text-[#F94001] text-sm">
                              ₹{court.peak_price.toLocaleString('en-IN')}<span className="text-[10px] font-normal text-orange-300">/hr</span>
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-amber-700 font-medium flex items-center gap-1">
                              <Sun className="h-3 w-3 text-amber-500" />
                              <span>Weekend ({court.peak_days.join(', ')})</span>
                            </span>
                            <span className="font-mono font-bold text-slate-800 text-sm">
                              ₹{court.weekend_price.toLocaleString('en-IN')}<span className="text-[10px] font-normal text-slate-400">/hr</span>
                            </span>
                          </div>
                        </div>

                        {/* Operating Specs Strip */}
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 rounded-lg bg-slate-50/60 border border-slate-100">
                            <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wider">Min Booking</span>
                            <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3 text-slate-400" />
                              {court.min_booking_time_mins} mins
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-50/60 border border-slate-100">
                            <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wider">Hours</span>
                            <span className="font-bold text-slate-800 font-mono text-[10px] block mt-0.5 truncate" title={court.operating_hours}>
                              {court.operating_hours}
                            </span>
                          </div>
                        </div>

                        {/* Cancellation Policy Banner */}
                        <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-xl p-2.5 flex items-center gap-2 text-[11px] text-emerald-800">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span className="line-clamp-2">
                            Free cancel up to <strong>{court.cancellation_policy_hours}h</strong> prior ({court.refund_percentage}% refund)
                          </span>
                        </div>
                      </div>

                      {/* Card Footer: View Slots CTA (View Only) */}
                      <div className="p-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-medium text-slate-400">
                          Admin View Only &bull; Synced with App
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveTab('slots')}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Calendar className="h-3 w-3 text-slate-500" />
                          <span>View Slots &rarr;</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== SUB-VIEW 2: EXTENSION REQUESTS ==================== */}
          {courtsSubTab === 'requests' && (
            <div className="space-y-4">
              {/* Requests KPI Summary (Interactive Filters) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 select-none">
                <button
                  type="button"
                  onClick={() => setCourtRequestKpiFilter('ALL')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    courtRequestKpiFilter === 'ALL'
                      ? 'bg-orange-50/40 border-[#F94001] ring-2 ring-[#F94001]/20 shadow-xs'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                  }`}
                  title="Filter: All Requests"
                >
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block">Total Requests</span>
                  <span className="text-lg font-black text-slate-900 font-mono mt-0.5 block">{venueCourtRequests.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCourtRequestKpiFilter('SUBMITTED')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    courtRequestKpiFilter === 'SUBMITTED'
                      ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400/30 shadow-xs'
                      : 'bg-amber-50/60 border-amber-200/80 hover:border-amber-300 shadow-2xs'
                  }`}
                  title="Filter: 1st Submitted"
                >
                  <span className="text-[10px] font-mono text-amber-700 font-bold uppercase block">1st Submitted</span>
                  <span className="text-lg font-black text-amber-800 font-mono mt-0.5 block">
                    {venueCourtRequests.filter((r) => ['SUBMITTED', 'NEW_REQUEST', 'PENDING'].includes((r.status || '').toUpperCase())).length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCourtRequestKpiFilter('RESUBMITTED')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    courtRequestKpiFilter === 'RESUBMITTED'
                      ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-400/30 shadow-xs'
                      : 'bg-purple-50/60 border-purple-200/80 hover:border-purple-300 shadow-2xs'
                  }`}
                  title="Filter: Resubmitted"
                >
                  <span className="text-[10px] font-mono text-purple-700 font-bold uppercase block">Resubmitted</span>
                  <span className="text-lg font-black text-purple-800 font-mono mt-0.5 block">
                    {venueCourtRequests.filter((r) => (r.status || '').toUpperCase() === 'RESUBMITTED').length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCourtRequestKpiFilter('APPROVED')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    courtRequestKpiFilter === 'APPROVED'
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400/30 shadow-xs'
                      : 'bg-emerald-50/60 border-emerald-200/80 hover:border-emerald-300 shadow-2xs'
                  }`}
                  title="Filter: Approved"
                >
                  <span className="text-[10px] font-mono text-emerald-700 font-bold uppercase block">Approved</span>
                  <span className="text-lg font-black text-emerald-800 font-mono mt-0.5 block">
                    {venueCourtRequests.filter((r) => (r.status || '').toUpperCase() === 'APPROVED').length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCourtRequestKpiFilter('REJECTED')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    courtRequestKpiFilter === 'REJECTED'
                      ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-400/30 shadow-xs'
                      : 'bg-rose-50/60 border-rose-200/80 hover:border-rose-300 shadow-2xs'
                  }`}
                  title="Filter: Rejected"
                >
                  <span className="text-[10px] font-mono text-rose-700 font-bold uppercase block">Rejected</span>
                  <span className="text-lg font-black text-rose-800 font-mono mt-0.5 block">
                    {venueCourtRequests.filter((r) => (r.status || '').toUpperCase() === 'REJECTED').length}
                  </span>
                </button>
              </div>

              {/* Empty State */}
              {venueCourtRequests.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/90 p-10 text-center space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#F94001] mx-auto">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900">No Court Extension Requests For This Venue</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    When the venue owner requests additional courts or pitches, they appear here for verification and approval.
                  </p>
                </div>
              ) : filteredVenueCourtRequests.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center space-y-2">
                  <p className="font-bold text-xs text-slate-700">No requests matching the selected filter</p>
                  <button
                    type="button"
                    onClick={() => setCourtRequestKpiFilter('ALL')}
                    className="text-xs text-[#F94001] font-bold hover:underline cursor-pointer"
                  >
                    Reset filter to view all requests
                  </button>
                </div>
              ) : (
                /* Request Cards Grid (3 Columns) */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredVenueCourtRequests.map((req) => {
                    const reqStatusUpper = (req.status || '').toUpperCase();
                    const isRejected = reqStatusUpper === 'REJECTED';
                    const isApproved = reqStatusUpper === 'APPROVED';
                    const isPending = ['SUBMITTED', 'RESUBMITTED', 'NEW_REQUEST', 'PENDING'].includes(reqStatusUpper);

                    return (
                      <div
                        key={req.id}
                        className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        {/* Top Content: Badges, Title, Pricing Box, Specs, Policy */}
                        <div className="p-4 space-y-3.5 flex-1">
                          {/* Header: Sport & Ground Badges + Status Pill */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-white font-black text-[10px] tracking-wider uppercase font-mono">
                                {req.sport}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                                {req.same_physical_sports ? 'Shared Ground' : 'Separate Ground'}
                              </span>
                            </div>

                            {/* Status Pill matching Image 2 */}
                            {isApproved && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <span>Approved</span>
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                <span>Rejected</span>
                              </span>
                            )}
                            {isPending && reqStatusUpper === 'RESUBMITTED' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                                <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                                <span>Resubmitted (R{req.submission_round || 2})</span>
                              </span>
                            )}
                            {isPending && reqStatusUpper !== 'RESUBMITTED' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                <span>1st Submitted</span>
                              </span>
                            )}
                          </div>

                          {/* Court Name & Display Name */}
                          <div>
                            <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug">
                              {req.court_name}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-1">
                              {req.display_name}
                            </p>
                          </div>

                          {/* Pricing Tiers Box matching Image 2 */}
                          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 font-medium">Standard Rate</span>
                              <span className="font-mono font-bold text-slate-900 text-sm">
                                ₹{Number(req.regular_price || req.price_per_hour || 1000).toLocaleString('en-IN')}<span className="text-[10px] font-normal text-slate-400">/hr</span>
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[#F94001] font-medium flex items-center gap-1">
                                <Flame className="h-3 w-3" />
                                <span>Peak ({req.peak_hours_start || '06:00 PM'}–{req.peak_hours_end || '10:00 PM'})</span>
                              </span>
                              <span className="font-mono font-bold text-[#F94001] text-sm">
                                ₹{Number(req.peak_price || req.price_per_hour || 1400).toLocaleString('en-IN')}<span className="text-[10px] font-normal text-orange-300">/hr</span>
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <span className="text-amber-700 font-medium flex items-center gap-1">
                                <Sun className="h-3 w-3 text-amber-500" />
                                <span>Weekend ({Array.isArray(req.peak_days) && req.peak_days.length > 0 ? req.peak_days.join(', ') : 'Sat, Sun'})</span>
                              </span>
                              <span className="font-mono font-bold text-slate-800 text-sm">
                                ₹{Number(req.weekend_price || req.price_per_hour || 1500).toLocaleString('en-IN')}<span className="text-[10px] font-normal text-slate-400">/hr</span>
                              </span>
                            </div>
                          </div>

                          {/* Operating Specs Strip matching Image 2 */}
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="p-2 rounded-lg bg-slate-50/60 border border-slate-100">
                              <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wider">Min Booking</span>
                              <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                                <Clock className="h-3 w-3 text-slate-400" />
                                {req.min_booking_duration_label || req.min_booking_duration || '60 mins'}
                              </span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-50/60 border border-slate-100">
                              <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wider">Ground Type</span>
                              <span className="font-bold text-slate-800 text-[11px] block mt-0.5 truncate">
                                {req.same_physical_sports ? 'Shared Ground' : 'Separate Ground'}
                              </span>
                            </div>
                          </div>

                          {/* Cancellation Policy Banner matching Image 2 */}
                          <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-xl p-2.5 flex items-center gap-2 text-[11px] text-emerald-800">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span className="line-clamp-2">
                              Free cancel up to <strong>{req.cancellation_policy_hours || req.cancellation_window_hours || 12}h</strong> prior ({req.refund_percentage || 100}% refund)
                            </span>
                          </div>

                          {/* IF APPROVED: Reviewer Stamp */}
                          {isApproved && (
                            <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-xl p-2.5 flex items-center justify-between gap-2 text-[11px] text-emerald-900">
                              <div className="flex items-center gap-2 min-w-0">
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                <span className="font-bold truncate">
                                  Approved by <span className="font-extrabold text-emerald-950">{req.reviewed_by || 'Platform Super Admin'}</span>
                                </span>
                              </div>
                              {req.reviewed_at && (
                                <span className="text-[10px] text-emerald-700/80 font-mono shrink-0">
                                  {typeof req.reviewed_at === 'string'
                                    ? (req.reviewed_at.includes('T') ? req.reviewed_at.split('T')[0] : req.reviewed_at.split(' ')[0])
                                    : ''}
                                </span>
                              )}
                            </div>
                          )}

                          {/* IF REJECTED: Reviewer Stamp & Reason */}
                          {isRejected && (
                            <div className="bg-rose-50/80 border border-rose-200/70 rounded-xl p-2.5 space-y-1.5 text-xs text-rose-900">
                              <div className="flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-2 min-w-0">
                                  <ShieldCheck className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                                  <span className="font-bold truncate">
                                    Rejected by <span className="font-extrabold text-rose-950">{req.reviewed_by || 'Platform Super Admin'}</span>
                                  </span>
                                </div>
                                {req.reviewed_at && (
                                  <span className="text-[10px] text-rose-700/80 font-mono shrink-0">
                                    {typeof req.reviewed_at === 'string'
                                      ? (req.reviewed_at.includes('T') ? req.reviewed_at.split('T')[0] : req.reviewed_at.split(' ')[0])
                                      : ''}
                                  </span>
                                )}
                              </div>
                              {req.rejection_reason && (
                                <p className="text-[10px] text-rose-800 font-bold">
                                  Reason: {req.rejection_reason}
                                </p>
                              )}
                              {req.rejection_note && (
                                <p className="text-[10px] text-rose-800 bg-white/80 p-2 rounded-lg border border-rose-100 font-medium">
                                  &ldquo;{req.rejection_note}&rdquo;
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Card Footer matching Image 2 layout */}
                        <div className="p-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-slate-400 min-w-0">
                            <span className="text-[10px] font-mono font-semibold text-slate-500 truncate">{req.id}</span>
                            <span className="text-[10px] text-slate-300 shrink-0">&bull;</span>
                            <span className="text-[10px] font-medium text-slate-500 shrink-0">Round {req.submission_round || 1}</span>
                          </div>

                          {isPending ? (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => setSelectedCourtRequestForDrawer(req)}
                                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                title="Review Details in Slide Bar"
                              >
                                <Eye className="h-3.5 w-3.5 text-slate-500" />
                                <span>Review</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApproveCourtRequest(req)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                title="Approve Court & Add to Arena"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCourtRequestForDrawer(req);
                                  setIsDrawerRejectOpen(true);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                title="Reject with Feedback Notes"
                              >
                                <X className="h-3.5 w-3.5" />
                                <span>Reject</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmReqId(req.id)}
                                className="h-7 w-7 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                                title="Delete Request"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => setSelectedCourtRequestForDrawer(req)}
                                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                title="View Court Request Details"
                              >
                                <Eye className="h-3 w-3 text-slate-500" />
                                <span>View Details &rarr;</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmReqId(req.id)}
                                className="h-7 w-7 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                                title="Delete Request"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 3: BOOKINGS (BOOKING ID, CUSTOMER, DATES, TIMES, VENUE SHARE, PLATFORM FEE, SLIDE DRAWER)
      ======================================================== */}
      {activeTab === 'bookings' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Dynamic Booking KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* 1. Total Bookings */}
            <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-2xs hover:border-slate-400/50 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
                  Total Bookings
                </span>
                <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <CalendarDays className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline">
                <span className="text-2xl font-black text-[#021526] font-display">
                  {bookingKpiStats.totalCount}
                </span>
              </div>
            </div>

            {/* 2. Collected Online */}
            <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-2xs hover:border-emerald-400/50 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
                  Collected Online
                </span>
                <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-700 font-mono tracking-tight">
                  ₹{bookingKpiStats.onlineCollected.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Received
                </span>
              </div>
            </div>

            {/* 3. Pending Due */}
            <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-2xs hover:border-amber-400/50 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
                  Pending Due
                </span>
                <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-600 font-mono tracking-tight">
                  ₹{bookingKpiStats.pendingDue.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Due
                </span>
              </div>
            </div>

            {/* 4. In-Play Right Now */}
            <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-2xs hover:border-blue-400/50 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
                  In-Play Right Now
                </span>
                <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-blue-600 font-display">
                  {bookingKpiStats.inPlayCount}
                </span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 animate-pulse">
                  Live
                </span>
              </div>
            </div>

            {/* 5. Total Court Value */}
            <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-2xs hover:border-orange-400/50 transition-all flex flex-col justify-between col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
                  Total Court Value
                </span>
                <div className="h-8 w-8 rounded-xl bg-orange-50 text-[#F94001] flex items-center justify-center shrink-0">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline">
                <span className="text-2xl font-black text-[#021526] font-mono tracking-tight">
                  ₹{bookingKpiStats.totalCourtVal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Filter Bar with Search, Date Picker, Courts Dropdown, Sports Dropdown */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search booking code, player, phone, sport..."
                value={bookingSearchQuery}
                onChange={(e) => setBookingSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none focus:bg-white focus:border-[#F94001] transition-colors"
              />
              {bookingSearchQuery && (
                <button
                  type="button"
                  onClick={() => setBookingSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filters Right: Date Picker, Court Dropdown, Sport Dropdown & Reset */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Filter by Date */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs hover:border-[#F94001]/60 transition-colors h-9">
                <CalendarDays className="h-3.5 w-3.5 text-[#F94001] shrink-0" />
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 whitespace-nowrap">
                    Date:
                  </span>
                  <input
                    type="date"
                    value={bookingDateFilter}
                    onChange={(e) => setBookingDateFilter(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer p-0 leading-tight"
                    title="Filter bookings by date"
                  />
                </div>
                {bookingDateFilter && (
                  <button
                    type="button"
                    onClick={() => setBookingDateFilter('')}
                    className="text-slate-400 hover:text-slate-800 p-0.5 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                    title="Clear date filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Court Dropdown */}
              <div className="relative min-w-[140px]">
                <select
                  value={bookingCourtFilter}
                  onChange={(e) => setBookingCourtFilter(e.target.value)}
                  className={`w-full appearance-none pl-3 pr-7 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                    bookingCourtFilter !== 'ALL'
                      ? 'border-[#F94001] bg-orange-50/80 text-[#F94001]'
                      : 'border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-[#F94001]'
                  }`}
                >
                  <option value="ALL">All Courts</option>
                  {availableVenueCourts.map((court) => (
                    <option key={court.id || court.name} value={court.name}>
                      {court.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-3.5 w-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Sport Dropdown */}
              <div className="relative min-w-[130px]">
                <select
                  value={bookingSportFilter}
                  onChange={(e) => setBookingSportFilter(e.target.value)}
                  className={`w-full appearance-none pl-3 pr-7 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                    bookingSportFilter !== 'ALL'
                      ? 'border-[#F94001] bg-orange-50/80 text-[#F94001]'
                      : 'border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-[#F94001]'
                  }`}
                >
                  <option value="ALL">All Sports</option>
                  {availableVenueSports.map((sport) => (
                    <option key={sport} value={sport}>
                      {sport}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-3.5 w-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Reset Filters Button */}
              {(bookingDateFilter || bookingCourtFilter !== 'ALL' || bookingSportFilter !== 'ALL' || bookingSearchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setBookingDateFilter('');
                    setBookingCourtFilter('ALL');
                    setBookingSportFilter('ALL');
                    setBookingSearchQuery('');
                  }}
                  className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                  title="Reset all booking filters"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Bookings Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/90 bg-slate-50/75 text-slate-500 font-semibold tracking-wider text-[10px] uppercase select-none">
                    <th className="py-2.5 px-3">Booking ID</th>
                    <th className="py-2.5 px-3">Customer ID &amp; Name</th>
                    <th className="py-2.5 px-3">Date &amp; Time</th>
                    <th className="py-2.5 px-3">Sport &amp; Court</th>
                    <th className="py-2.5 px-3">Slot Time &amp; Duration</th>
                    <th className="py-2.5 px-3">Total Amount</th>
                    <th className="py-2.5 px-3">Due Amount</th>
                    <th className="py-2.5 px-3">Venue Share</th>
                    <th className="py-2.5 px-3">Platform Fee</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        No bookings matching criteria
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#F94001] whitespace-nowrap">
                          {b.booking_code}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{b.customer_name}</div>
                          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                            <span>{b.customer_id}</span>
                            <span>&bull;</span>
                            <span>{b.customer_phone}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                          {b.booking_date}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-800">{b.court_name}</span>
                          <span className="text-[10px] text-[#F94001] font-bold block">{b.sport}</span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="font-mono text-slate-700">{b.time_slot}</span>
                          <span className="text-[10px] text-slate-400 block">{b.duration_minutes / 60} hrs</span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="font-mono font-black text-slate-900 text-xs">
                            ₹{b.total_amount.toLocaleString('en-IN')}
                          </div>
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold font-mono bg-purple-50 text-purple-700 border border-purple-200">
                            {b.payment_method || 'UPI'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono">
                          {b.balance_amount && b.balance_amount > 0 ? (
                            <div>
                              <span className="font-bold text-xs text-amber-700">
                                ₹{b.balance_amount.toLocaleString('en-IN')}
                              </span>
                              <span className="block text-[10px] font-sans font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 w-fit mt-0.5">
                                Due
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span className="font-medium text-xs text-slate-600">₹0</span>
                              <span className="block text-[10px] font-sans font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 w-fit mt-0.5">
                                Cleared
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-700 whitespace-nowrap">
                          ₹{b.venue_share}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                          ₹{b.platform_fee}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.booking_status === 'CONFIRMED'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : b.booking_status === 'IN_PLAY'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200 animate-pulse'
                                : b.booking_status === 'COMPLETED'
                                ? 'bg-slate-100 text-slate-700 border border-slate-300'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {b.booking_status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedBookingForDrawer(b)}
                            className="h-7 w-7 rounded-lg border border-slate-200 hover:border-[#F94001]/40 hover:text-[#F94001] hover:bg-[#FFF1EC] bg-white text-slate-500 inline-flex items-center justify-center cursor-pointer transition-all shadow-2xs mx-auto"
                            title="Inspect Booking Details"
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
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: SETTLEMENT (SETTLEMENT ID, DATE, ACCOUNT, DEDUCTIONS, CASH PLATFORM FEE DEDUCTION, NET PAYOUT)
      ======================================================== */}
      {activeTab === 'settlement' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Partner Settlement & Cash Collection Deductions</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Full financial payout breakdown. When players pay by cash at the turf, the 10% platform commission is automatically deducted from online settlements.
                </p>
              </div>
              <div className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl">
                Cycle: Weekly Automatic Disbursal
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-medium">Gross Bookings Settled</span>
                <p className="text-lg font-black text-slate-900 font-mono mt-0.5">
                  ₹{(currentVenue.financials?.total_settled || 303100).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-medium">Platform Fees Deducted</span>
                <p className="text-lg font-black text-slate-700 font-mono mt-0.5">
                  ₹{(currentVenue.financials?.platform_commission || 38400).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-medium">Unsettled Accrual</span>
                <p className="text-lg font-black text-amber-700 font-mono mt-0.5">
                  ₹{(currentVenue.financials?.unsettled_balance || 42500).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-medium">Destination Account</span>
                <p className="font-bold text-slate-800 text-xs mt-0.5">
                  {currentVenue.bank?.bank_name} {currentVenue.bank?.account_number_masked}
                </p>
              </div>
            </div>
          </div>

          {/* Settlements Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/90 bg-slate-50/75 text-slate-500 font-semibold tracking-wider text-[10px] uppercase select-none">
                    <th className="py-2.5 px-3">Settlement ID</th>
                    <th className="py-2.5 px-3">Disbursal Date</th>
                    <th className="py-2.5 px-3">Target Bank Account</th>
                    <th className="py-2.5 px-3">Gross Amount</th>
                    <th className="py-2.5 px-3">Online Plat. Fee</th>
                    <th className="py-2.5 px-3">Cash Col. Deduction</th>
                    <th className="py-2.5 px-3">TDS (1%)</th>
                    <th className="py-2.5 px-3">Net Payout</th>
                    <th className="py-2.5 px-3">Status & UTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {venueSettlements.map((s: SettlementBatchItem, index: number) => {
                    const cashCollectionDeduction = index === 0 ? 800 : 0;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {s.batch_number}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                          {s.settled_at || `${s.period_end} (Cycle)`}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="font-bold text-slate-800">{s.bank_name}</div>
                          <div className="text-[10px] font-mono text-slate-400">{s.account_number_masked}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                          ₹{s.gross_booking_amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-rose-600 whitespace-nowrap">
                          -₹{s.platform_commission_deducted.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-rose-600 whitespace-nowrap">
                          {cashCollectionDeduction > 0 ? (
                            <span>-₹{cashCollectionDeduction}</span>
                          ) : (
                            <span className="text-slate-400">₹0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                          -₹{s.tds_deducted}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-black text-emerald-700 whitespace-nowrap">
                          ₹{(s.net_payable - cashCollectionDeduction).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              s.status === 'SETTLED'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : s.status === 'PROCESSING'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200 animate-pulse'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {s.status}
                          </span>
                          {s.utr_number && (
                            <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                              UTR: {s.utr_number}
                            </span>
                          )}
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

      {/* ========================================================
          TAB 5: STAFF
      ======================================================== */}
      {activeTab === 'staff' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#F94001]" />
              <h2 className="text-sm font-bold text-slate-900">Arena Staff &amp; Team Directory</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Authorized ground personnel, shift managers &amp; role hierarchy &bull; View-only (Managed via Venue Owner App)
            </p>
          </div>

          {/* View-Only Staff Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            {staffMembers.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-xs font-bold text-slate-800">No Ground Staff Registered Yet</h3>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1">
                  Ground personnel, shift managers, and duty officers added by the venue partner via the mobile or web app will appear here automatically from Supabase.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/90 bg-slate-50/75 text-slate-500 font-semibold tracking-wider text-[10px] uppercase select-none">
                      <th className="py-3 px-3 text-center w-12">#</th>
                      <th className="py-3 px-4">Staff ID</th>
                      <th className="py-3 px-4">Member Name</th>
                      <th className="py-3 px-4">Designation / Role</th>
                      <th className="py-3 px-4">Mobile Number</th>
                      <th className="py-3 px-4">Email Address</th>
                      <th className="py-3 px-4 text-center">Account Status</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedStaff.map((staff, index) => {
                      const isStaffActive = staff.status === 'ACTIVE';
                      const serialNo = staffStartIndex + index + 1;
                      const initials =
                        (staff.name || 'Staff Member')
                          .trim()
                          .split(/\s+/)
                          .map((n) => (n ? n[0] : ''))
                          .filter(Boolean)
                          .join('')
                          .substring(0, 2)
                          .toUpperCase() || 'ST';

                      return (
                        <tr
                          key={staff.id}
                          onClick={() => setSelectedStaffForDrawer(staff)}
                          className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                        >
                          {/* # Serial No */}
                          <td className="py-3 px-3 text-center align-middle whitespace-nowrap">
                            <span className="font-mono text-xs font-semibold text-slate-500">
                              {serialNo}
                            </span>
                          </td>

                          {/* Staff ID */}
                          <td className="py-3 px-4 whitespace-nowrap align-middle">
                            <span className="px-2 py-1 rounded-md bg-slate-100 font-mono font-bold text-slate-700 text-[11px] border border-slate-200/60">
                              {staff.staff_id || staff.display_id || (staff.id?.length > 10 ? `STF-0${serialNo}` : staff.id)}
                            </span>
                          </td>

                          {/* Name + Mini Avatar */}
                          <td className="py-3 px-4 align-middle">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-[#091522] text-white font-black text-xs flex items-center justify-center shrink-0 tracking-tight shadow-2xs">
                                {initials}
                              </div>
                              <div>
                                <div className="font-extrabold text-slate-900 text-xs group-hover:text-[#F94001] transition-colors">
                                  {staff.name}
                                </div>
                                {staff.shift_hours && (
                                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                    <Clock className="h-2.5 w-2.5" />
                                    <span>{staff.shift_hours}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Designation / Role */}
                          <td className="py-3 px-4 whitespace-nowrap align-middle">
                            <span className="inline-block px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/70 font-bold text-[10px] tracking-wider uppercase font-mono">
                              {staff.role}
                            </span>
                          </td>

                          {/* Mobile Number */}
                          <td className="py-3 px-4 whitespace-nowrap align-middle">
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-[#F94001] shrink-0" />
                              <a
                                href={`tel:${staff.mobile_number}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-slate-800 hover:text-[#F94001] font-semibold text-xs transition-colors font-sans"
                              >
                                {staff.mobile_number}
                              </a>
                            </div>
                          </td>

                          {/* Email Address */}
                          <td className="py-3 px-4 align-middle">
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <a
                                href={`mailto:${staff.email}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-slate-600 hover:text-slate-900 font-medium text-xs truncate max-w-[200px] block transition-colors"
                                title={staff.email}
                              >
                                {staff.email}
                              </a>
                            </div>
                          </td>

                          {/* Account Status */}
                          <td className="py-3 px-4 text-center whitespace-nowrap align-middle">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                isStaffActive
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isStaffActive ? 'bg-emerald-500' : 'bg-slate-400'
                                }`}
                              />
                              <span>{isStaffActive ? 'Active' : 'Inactive'}</span>
                            </span>
                          </td>

                          {/* Actions: Eye Icon Button Only */}
                          <td className="py-3 px-4 text-center whitespace-nowrap align-middle">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStaffForDrawer(staff);
                              }}
                              className="h-7 w-7 rounded-lg border border-slate-200 bg-white hover:bg-[#FFF1EC] text-slate-500 hover:text-[#F94001] hover:border-[#F94001]/40 inline-flex items-center justify-center shadow-2xs transition-all cursor-pointer mx-auto"
                              title="View Staff Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-200/90 bg-slate-50/50 text-xs text-slate-600 select-none">
              <div className="flex items-center gap-4">
                <span>
                  Showing{' '}
                  <strong className="text-slate-900 font-semibold">
                    {staffTotalItems === 0 ? 0 : staffStartIndex + 1}
                  </strong>{' '}
                  to{' '}
                  <strong className="text-slate-900 font-semibold">
                    {Math.min(staffStartIndex + staffPageSize, staffTotalItems)}
                  </strong>{' '}
                  of <strong className="text-slate-900 font-semibold">{staffTotalItems}</strong> entries
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[11px]">Rows per page:</span>
                  <select
                    value={staffPageSize}
                    onChange={(e) => {
                      setStaffPageSize(Number(e.target.value));
                      setStaffCurrentPage(1);
                    }}
                    className="h-7 px-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:border-[#F94001] cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={staffCurrentPage <= 1}
                  onClick={() => setStaffCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Prev</span>
                </button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: staffTotalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      return (
                        p === 1 ||
                        p === staffTotalPages ||
                        Math.abs(p - staffCurrentPage) <= 1
                      );
                    })
                    .map((p, idx, arr) => {
                      const prevPageNum = arr[idx - 1];
                      const showEllipsis = prevPageNum && p - prevPageNum > 1;
                      return (
                        <React.Fragment key={p}>
                          {showEllipsis && (
                            <span className="px-1 text-slate-400 text-xs">...</span>
                          )}
                          <button
                            type="button"
                            onClick={() => setStaffCurrentPage(p)}
                            className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                              staffCurrentPage === p
                                ? 'bg-[#F94001] text-white border border-[#F94001]'
                                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <button
                  type="button"
                  disabled={staffCurrentPage >= staffTotalPages}
                  onClick={() => setStaffCurrentPage((prev) => Math.min(staffTotalPages, prev + 1))}
                  className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                  title="Next Page"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ADD STAFF MODAL */}
          {isAddStaffOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/60">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#F94001]" />
                    <h3 className="text-sm font-bold text-slate-900">Add Venue Staff Member</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddStaffOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateStaffSubmit} className="p-4 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Staff Member Name <span className="text-[#F94001]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Suresh Kumar"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#F94001] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Mobile Phone Number <span className="text-[#F94001]">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9840123456"
                      value={newStaffPhone}
                      onChange={(e) => setNewStaffPhone(e.target.value)}
                      className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#F94001] focus:bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. suresh@ibooksports.com"
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#F94001] focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Designation / Role
                      </label>
                      <select
                        value={newStaffRole}
                        onChange={(e) => setNewStaffRole(e.target.value)}
                        className="w-full h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#F94001] focus:bg-white"
                      >
                        <option value="Manager">Manager</option>
                        <option value="Coach">Coach</option>
                        <option value="Groundkeeper">Groundkeeper</option>
                        <option value="Cashier">Cashier</option>
                        <option value="VERIFICATION_OFFICER">Verification Officer</option>
                        <option value="OPERATIONS_MANAGER">Operations Manager</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Shift Timings
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 06:00 AM - 02:00 PM"
                        value={newStaffShift}
                        onChange={(e) => setNewStaffShift(e.target.value)}
                        className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#F94001] focus:bg-white text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsAddStaffOpen(false)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingStaff}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#F94001] hover:bg-[#e03900] rounded-xl shadow-2xs cursor-pointer"
                    >
                      {isSubmittingStaff ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      <span>{isSubmittingStaff ? 'Saving...' : 'Save to Supabase'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 6: SLOTS TIMELINE (INTERACTIVE GRID, DATE PICKER, AVAILABLE, HOLD, UNAVAILABLE)
      ======================================================== */}
      {activeTab === 'slots' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Controls Bar: Date Selector, Date Picker, Court Filter & Legend */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Quick Date Pills */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date:</span>
                <div className="flex items-center gap-1">
                  {quickDateOptions.map((d) => (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => {
                        setSelectedSlotDate(d.key);
                        setSlotCustomDate(d.dateStr);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                        selectedSlotDate === d.key
                          ? 'bg-slate-900 text-white font-bold shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Picker Filter Input */}
              <div className="flex items-center gap-1.5">
                <div className="relative flex items-center">
                  <CalendarDays className="absolute left-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    value={slotCustomDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSlotCustomDate(val);
                      setSelectedSlotDate('custom');
                    }}
                    className={`h-8 pl-8 pr-2.5 rounded-xl text-xs font-semibold border cursor-pointer transition-all outline-none ${
                      selectedSlotDate === 'custom'
                        ? 'bg-orange-50 border-[#F94001] text-slate-900 ring-2 ring-[#F94001]/20 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                    title="Select any date from calendar"
                  />
                </div>
                {selectedSlotDate === 'custom' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSlotDate('today');
                      setSlotCustomDate(todayYmd);
                    }}
                    className="text-[11px] font-bold text-[#F94001] hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Court Dropdown Filter if multiple courts */}
              {courtsList.length > 1 && (
                <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Court:</span>
                  <select
                    value={selectedCourtFilterForSlots}
                    onChange={(e) => setSelectedCourtFilterForSlots(e.target.value)}
                    className="h-8 px-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 outline-none hover:border-slate-300 cursor-pointer"
                  >
                    <option value="ALL">All Courts ({courtsList.length})</option>
                    {courtsList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.sport})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Comprehensive Legend: Available, Hold (10m), Booked, Live (Check-in), Maintenance */}
            <div className="flex flex-wrap items-center gap-3 lg:gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-emerald-500 shrink-0" />
                <span className="text-slate-700">Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-amber-400 shrink-0" />
                <span className="text-slate-700">Hold (10m)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-slate-800 shrink-0" />
                <span className="text-slate-700">Booked</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
                </span>
                <span className="text-blue-700 font-bold">Live (Check-in)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-orange-500 shrink-0" />
                <span className="text-orange-700">Maintenance</span>
              </div>
            </div>
          </div>

          {/* Timeline Matrix Grid */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <p className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                <span>Click on any slot cell to cycle states:</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[11px]">Available</span>
                <span>&rarr;</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-bold text-[11px]">Hold</span>
                <span>&rarr;</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-900 text-white font-bold text-[11px]">Booked</span>
                <span>&rarr;</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold text-[11px] animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                  Live (Check-in)
                </span>
                <span>&rarr;</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-100 text-orange-900 font-bold text-[11px] border border-orange-200">
                  <Wrench className="h-2.5 w-2.5 text-orange-700" />
                  Maintenance
                </span>
              </p>
              <span className="text-[11px] font-mono font-semibold text-slate-400 shrink-0">
                Active Date: {selectedSlotDate === 'custom' ? slotCustomDate : selectedSlotDate === 'today' ? todayYmd : selectedSlotDate === 'tomorrow' ? tomorrowYmd : dayAfterYmd}
              </span>
            </div>

            <div className="space-y-4">
              {(selectedCourtFilterForSlots === 'ALL'
                ? courtsList
                : courtsList.filter((c) => c.id === selectedCourtFilterForSlots)
              ).map((court) => (
                <div key={court.id} className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{court.name}</span>
                      <span className="text-[10px] font-bold text-[#F94001] bg-[#FFF1EC] px-2 py-0.5 rounded">
                        {court.sport}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 font-semibold">Rate: ₹{court.base_hourly_rate}/hr</span>
                  </div>

                  {/* Hourly slot buttons */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-8 gap-1.5">
                    {timelineHours.map((hourStr, hourIdx) => {
                      const slot = getSlotStatus(court.id, hourIdx);
                      const isAvailable = slot.status === 'AVAILABLE';
                      const isHold = slot.status === 'HOLD';
                      const isBooked = slot.status === 'BOOKED' || slot.status === 'UNAVAILABLE';
                      const isLive = slot.status === 'LIVE';
                      const isMaintenance = slot.status === 'MAINTENANCE';

                      return (
                        <button
                          key={hourStr}
                          type="button"
                          onClick={() => handleToggleTimelineSlot(court.id, hourIdx)}
                          className={`p-2 rounded-lg text-[11px] font-semibold text-center transition-all cursor-pointer border ${
                            isAvailable
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : isHold
                              ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                              : isLive
                              ? 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700 shadow-xs ring-2 ring-blue-300/80 animate-pulse'
                              : isMaintenance
                              ? 'bg-orange-100 text-orange-950 border-orange-300 hover:bg-orange-200'
                              : 'bg-slate-900 text-white border-slate-800 hover:bg-slate-800'
                          }`}
                          title={`Click to cycle status: ${hourStr} - ${slot.status}${slot.bookedBy ? ` (${slot.bookedBy})` : ''}`}
                        >
                          <div className="font-mono">{hourStr}</div>
                          <div className="text-[9px] font-bold opacity-90 mt-0.5">
                            {isAvailable ? (
                              '₹' + court.base_hourly_rate
                            ) : isHold ? (
                              'HOLD'
                            ) : isLive ? (
                              <span className="inline-flex items-center gap-1 justify-center">
                                <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                                LIVE
                              </span>
                            ) : isMaintenance ? (
                              <span className="inline-flex items-center gap-0.5 justify-center">
                                <Wrench className="h-2.5 w-2.5 shrink-0" />
                                MAINT
                              </span>
                            ) : (
                              'BOOKED'
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 7: CANCELLATIONS & REFUNDS
      ======================================================== */}
      {activeTab === 'cancellation' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Cancelled Bookings & Refund Audits</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All cancellations logged for this arena, refund reversal amounts, cancellation reason, and wallet credit status.
              </p>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
              {venueCancellations.length} Cancelled Records
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/90 bg-slate-50/75 text-slate-500 font-semibold tracking-wider text-[10px] uppercase select-none">
                    <th className="py-2.5 px-3 text-center w-12">#</th>
                    <th className="py-2.5 px-3">Customer ID & Name</th>
                    <th className="py-2.5 px-3">Booking Code</th>
                    <th className="py-2.5 px-3">Slot Schedule</th>
                    <th className="py-2.5 px-3">Original Paid</th>
                    <th className="py-2.5 px-3">Cancelled At</th>
                    <th className="py-2.5 px-3">Refund Amount</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-center w-16">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cancellationTotalItems === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        Zero cancellations logged for this arena.
                      </td>
                    </tr>
                  ) : (
                    paginatedCancellations.map((b, index) => (
                      <tr key={b.id || index} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-500 font-semibold">
                          {cancellationStartIndex + index + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{b.customer_name}</div>
                          <div className="text-[10px] font-mono text-slate-400">{b.customer_id}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#F94001] whitespace-nowrap">{b.booking_code}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-800">{b.booking_date}</div>
                          <div className="text-[10px] font-mono text-slate-400">{b.time_slot}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-mono font-bold text-slate-900">
                            ₹{b.total_amount?.toLocaleString('en-IN') || 0}
                          </div>
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-slate-100 text-slate-600 border border-slate-200">
                            {b.payment_method || 'UPI'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                          {b.cancelled_at || '2026-03-04 16:30'}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-mono font-black text-emerald-700">
                            ₹{(b.refund_amount || b.total_amount)?.toLocaleString('en-IN')}
                          </div>
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {b.payment_method ? `${b.payment_method} (Reversed)` : 'UPI (Reversed)'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-[200px] truncate" title={b.cancellation_reason}>
                          {b.cancellation_reason || 'Inclement weather cancellation'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            {b.refund_status || 'WALLET_CREDITED'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedCancellationForDrawer(b)}
                            className="h-7 w-7 rounded-lg border border-slate-200 hover:border-[#F94001]/40 hover:text-[#F94001] hover:bg-[#FFF1EC] bg-white text-slate-500 inline-flex items-center justify-center cursor-pointer transition-all shadow-2xs mx-auto"
                            title="View Cancellation Details"
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-200/90 bg-slate-50/50 text-xs text-slate-600 select-none">
              <div className="flex items-center gap-4">
                <span>
                  Showing{' '}
                  <strong className="text-slate-900 font-semibold">
                    {cancellationTotalItems === 0 ? 0 : cancellationStartIndex + 1}
                  </strong>{' '}
                  to{' '}
                  <strong className="text-slate-900 font-semibold">
                    {Math.min(cancellationStartIndex + cancellationPageSize, cancellationTotalItems)}
                  </strong>{' '}
                  of <strong className="text-slate-900 font-semibold">{cancellationTotalItems}</strong> entries
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[11px]">Rows per page:</span>
                  <select
                    value={cancellationPageSize}
                    onChange={(e) => {
                      setCancellationPageSize(Number(e.target.value));
                      setCancellationCurrentPage(1);
                    }}
                    className="h-7 px-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:border-[#F94001] cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={cancellationCurrentPage <= 1}
                  onClick={() => setCancellationCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Prev</span>
                </button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: cancellationTotalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      return (
                        p === 1 ||
                        p === cancellationTotalPages ||
                        Math.abs(p - cancellationCurrentPage) <= 1
                      );
                    })
                    .map((p, idx, arr) => {
                      const prevPageNum = arr[idx - 1];
                      const showEllipsis = prevPageNum && p - prevPageNum > 1;
                      return (
                        <React.Fragment key={p}>
                          {showEllipsis && (
                            <span className="px-1 text-slate-400 text-xs">...</span>
                          )}
                          <button
                            type="button"
                            onClick={() => setCancellationCurrentPage(p)}
                            className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                              cancellationCurrentPage === p
                                ? 'bg-[#F94001] text-white border border-[#F94001]'
                                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <button
                  type="button"
                  disabled={cancellationCurrentPage >= cancellationTotalPages}
                  onClick={() => setCancellationCurrentPage((prev) => Math.min(cancellationTotalPages, prev + 1))}
                  className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                  title="Next Page"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 8: SUPPORT (SUPPORT REQUESTS, DISPUTES, TICKETS)
      ======================================================== */}
      {activeTab === 'support' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Partner Helpdesk &amp; Support Requests</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tickets, maintenance complaints, customer dispute resolutions, and payout inquiries for this arena.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
              {venueSupportTickets.length} Tickets Found
            </span>
          </div>

          {/* Tickets Data Table (matching Support Helpdesk module) */}
          <div className="rounded-2xl bg-white border border-[#E5E7EB] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[850px]">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-slate-50/70 text-[#5F6368] font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4 w-[130px]">Ticket ID</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4 w-[130px]">Category</th>
                    <th className="py-3 px-4 w-[220px]">Venue &amp; Partner</th>
                    <th className="py-3 px-4 w-[100px]">Priority</th>
                    <th className="py-3 px-4 w-[130px]">Status</th>
                    <th className="py-3 px-4 w-[110px]">Reported</th>
                    <th className="py-3 px-4 w-[90px] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F4]">
                  {venueSupportTickets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-14 text-center text-[#5F6368]">
                        <LifeBuoy className="h-9 w-9 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-sm text-[#021526]">No active support requests</p>
                        <p className="text-xs text-[#5F6368] mt-0.5">All partner operational tickets for this venue are resolved.</p>
                      </td>
                    </tr>
                  ) : (
                    venueSupportTickets.map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedSupportTicketForDrawer(t)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                      >
                        {/* 1. Ticket ID */}
                        <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#021526] group-hover:text-[#F94001] transition-colors whitespace-nowrap">
                          {t.ticket_number}
                        </td>

                        {/* 2. Subject */}
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-xs text-[#021526] group-hover:text-[#F94001] transition-colors line-clamp-1">
                            {t.subject}
                          </span>
                        </td>

                        {/* 3. Category */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {renderSupportCategoryBadge(t.category)}
                        </td>

                        {/* 4. Venue & Partner */}
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-xs text-[#021526] truncate">{t.venue_name || currentVenue?.venue_name || 'Snow White'}</p>
                          <p className="text-[11px] text-[#5F6368] truncate">{t.created_person_name || 'Partner'}</p>
                        </td>

                        {/* 5. Priority */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {renderSupportPriorityBadge(t.priority)}
                        </td>

                        {/* 6. Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {renderSupportStatusBadge(t.status)}
                        </td>

                        {/* 7. Reported */}
                        <td className="py-3.5 px-4 text-[#5F6368] text-[11px] whitespace-nowrap">
                          {(() => {
                            const raw = t.created_at || '';
                            if (!raw) return 'Today';
                            return raw.split('T')[0] || raw.split(' ')[0] || raw;
                          })()}
                        </td>

                        {/* 8. Action */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSupportTicketForDrawer(t);
                            }}
                            className="inline-flex items-center gap-1 text-slate-500 hover:text-[#F94001] font-semibold text-xs transition-colors cursor-pointer"
                          >
                            <span>Details</span>
                            <ChevronRight className="h-3.5 w-3.5" />
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

      {/* ========================================================
          SLIDE-OVER DRAWER FOR BOOKING DETAILS (INSIDE BOOKINGS TAB)
      ======================================================== */}
      {/* ========================================================
          SLIDE-OVER DRAWER FOR BOOKING DETAILS (INSIDE BOOKINGS TAB)
          Matches Booking Management Module Exactly
      ======================================================== */}
      {selectedBookingForDrawer && (
        <div
          className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
          onClick={() => setSelectedBookingForDrawer(null)}
        >
          <div
            className="w-full max-w-xl bg-white shadow-2xl h-full flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 border-l border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header matching Booking Management */}
            <div className="p-6 border-b border-slate-200 bg-white shrink-0 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#F94001] block">
                    RESERVATION DOSSIER &bull; {selectedBookingForDrawer.booking_code}
                  </span>
                  <h3 className="text-2xl font-black text-[#021526] font-display mt-0.5">
                    {selectedBookingForDrawer.customer_name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                    <span>Venue:</span>
                    <strong className="text-slate-800">{selectedBookingForDrawer.venue_name || currentVenue.venue_name}</strong>
                    <span>&bull;</span>
                    <span className="text-[#F94001] font-bold uppercase">{selectedBookingForDrawer.sport}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                      selectedBookingForDrawer.booking_status === 'CONFIRMED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : selectedBookingForDrawer.booking_status === 'IN_PLAY'
                        ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                        : selectedBookingForDrawer.booking_status === 'COMPLETED'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : selectedBookingForDrawer.booking_status === 'PENDING_PAYMENT'
                        ? 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {selectedBookingForDrawer.booking_status}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedBookingForDrawer(null)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Close Drawer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Sub-Tabs Bar inside Slide Bar */}
              <div className="flex items-center gap-1 border-b border-slate-100 pt-1">
                {[
                  { id: 'summary', label: 'Booking Summary', icon: Layers },
                  { id: 'payment', label: 'Payment & Split', icon: CreditCard },
                  { id: 'slip', label: 'Booking Slip / Pass', icon: Printer },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = venueBookingDrawerTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setVenueBookingDrawerTab(tab.id as any)}
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

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* TAB 1: BOOKING SUMMARY (Matches Screenshot Exactly!) */}
              {venueBookingDrawerTab === 'summary' && (
                <div className="space-y-4">
                  {/* Card 1: Reserved Court Playtime */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-[#F94001]" />
                        <span>Reserved Court Playtime</span>
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-700">
                        {selectedBookingForDrawer.duration_minutes || 60} Minutes
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">VENUE NAME</span>
                        <p className="font-bold text-slate-900 mt-0.5">
                          {selectedBookingForDrawer.venue_name || currentVenue.venue_name}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">COURT &amp; SPORT</span>
                        <p className="font-bold text-slate-900 mt-0.5">
                          {selectedBookingForDrawer.court_name} (<span className="text-[#F94001]">{selectedBookingForDrawer.sport}</span>)
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">SLOT DATE</span>
                        <p className="font-mono font-bold text-slate-800 mt-0.5">{selectedBookingForDrawer.booking_date}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">TIME SLOT</span>
                        <p className="font-mono font-bold text-slate-800 mt-0.5">{selectedBookingForDrawer.time_slot}</p>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: PLAYER INFORMATION */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs space-y-2.5">
                    <span className="text-xs font-black uppercase tracking-wider text-[#021526] block">
                      PLAYER INFORMATION
                    </span>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">PLAYER NAME</span>
                        <p className="font-bold text-slate-900 mt-0.5">{selectedBookingForDrawer.customer_name}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">CONTACT PHONE</span>
                        <p className="font-mono text-slate-800 mt-0.5 flex items-center gap-1 font-bold">
                          <Phone className="h-3 w-3 text-emerald-600" />
                          <span>{selectedBookingForDrawer.customer_phone || '+91 6369591821'}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: CHECK-IN PASSCODE (Matches Screenshot Exactly!) */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">
                        CHECK-IN PASSCODE
                      </span>
                      <p className="text-2xl font-black font-mono text-slate-900 tracking-wider">
                        {selectedBookingForDrawer.booking_code.replace(/\D/g, '').slice(-4) || '1875'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Player presents code at venue entry gate
                      </p>
                    </div>

                    <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs shrink-0">
                      <QrCode className="h-9 w-9 text-slate-800" />
                    </div>
                  </div>

                  {/* Action Buttons: Reschedule & Cancel */}
                  {selectedBookingForDrawer.booking_status !== 'CANCELLED' && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setRescheduleDateForVenue(selectedBookingForDrawer.booking_date);
                          setRescheduleSlotTimeForVenue(selectedBookingForDrawer.time_slot);
                          setRescheduleModalOpenForVenueBooking(true);
                        }}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                        <span>Reschedule Slot</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancelModalOpenForVenueBooking(true)}
                        className="flex-1 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                        <span>Cancel &amp; Refund</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PAYMENT & SPLIT BREAKDOWN */}
              {venueBookingDrawerTab === 'payment' && (
                <div className="space-y-4">
                  {(() => {
                    const totalAmt = selectedBookingForDrawer.total_amount || 0;
                    const adv = selectedBookingForDrawer.advance_amount !== undefined ? selectedBookingForDrawer.advance_amount : (selectedBookingForDrawer.payment_status === 'PAID' ? totalAmt : Math.round(totalAmt * 0.5));
                    const bal = selectedBookingForDrawer.balance_amount !== undefined ? selectedBookingForDrawer.balance_amount : Math.max(0, totalAmt - adv);

                    return (
                      <>
                        <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs space-y-3 font-mono">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-xs font-black uppercase tracking-wider text-[#021526] font-display">
                              Payment Reconciliation
                            </span>
                            <span className="text-[10px] text-slate-400 font-sans font-bold">
                              {selectedBookingForDrawer.payment_method || 'UPI'}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono">
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                              <span className="text-[9px] text-slate-400 font-bold uppercase block font-sans">Total Court Fee</span>
                              <span className="font-black text-sm text-slate-900 mt-0.5 block">
                                ₹{totalAmt}
                              </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                              <span className="text-[9px] text-emerald-700 font-bold uppercase block font-sans">Advance Online</span>
                              <span className="font-black text-sm text-emerald-800 mt-0.5 block">
                                ₹{adv}
                              </span>
                            </div>
                            <div className={`p-2.5 rounded-xl border ${bal > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                              <span className={`text-[9px] font-bold uppercase block font-sans ${bal > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                                Due Balance
                              </span>
                              <span className={`font-black text-sm mt-0.5 block ${bal > 0 ? 'text-amber-800' : 'text-slate-600'}`}>
                                ₹{bal}
                              </span>
                            </div>
                          </div>

                          {bal > 0 && (
                            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                              <div className="space-y-0.5">
                                <p className="font-bold text-amber-900 flex items-center gap-1">
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                  <span>₹{bal} Due at Venue</span>
                                </p>
                                <p className="text-[11px] text-amber-700 font-sans">Player can pay cash at counter or via online link.</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleMarkVenueBookingCashPaid(selectedBookingForDrawer.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shrink-0"
                              >
                                Mark Cash Paid
                              </button>
                            </div>
                          )}

                          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-sans">
                            <div className="flex justify-between text-slate-600">
                              <span>Platform Commission (10%):</span>
                              <span className="font-mono font-bold">- ₹{selectedBookingForDrawer.platform_fee}</span>
                            </div>
                            <div className="flex justify-between text-emerald-700 font-bold">
                              <span>Net Venue Partner Share:</span>
                              <span className="font-mono text-emerald-800">₹{selectedBookingForDrawer.venue_share}</span>
                            </div>
                          </div>
                        </div>

                        {/* Balance Payment Link */}
                        <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs space-y-2.5">
                          <span className="text-xs font-black uppercase tracking-wider text-[#021526] block">
                            Balance Payment Link
                          </span>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              readOnly
                              value={`https://ibooksports.com/pay/${selectedBookingForDrawer.booking_code}`}
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (navigator.clipboard) {
                                  navigator.clipboard.writeText(`https://ibooksports.com/pay/${selectedBookingForDrawer.booking_code}`);
                                  setCopiedVenueBookingLink(true);
                                  setTimeout(() => setCopiedVenueBookingLink(false), 2000);
                                }
                              }}
                              className="px-3 py-2 rounded-xl bg-[#021526] hover:bg-[#F94001] text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              {copiedVenueBookingLink ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                              <span>Copy Link</span>
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-400">Share with player for contactless payment.</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* TAB 3: BOOKING SLIP / PASS */}
              {venueBookingDrawerTab === 'slip' && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-white border border-slate-300 shadow-2xs space-y-4">
                    <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-md bg-[#F94001] text-white flex items-center justify-center font-black text-xs">
                            iB
                          </div>
                          <span className="font-black text-sm text-[#021526]">
                            iBookSports Reservation Slip
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Court Booking Confirmation</p>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-xs font-bold text-slate-900 block">{selectedBookingForDrawer.booking_code}</span>
                        <span className="text-[10px] text-slate-500">{selectedBookingForDrawer.booking_date}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Player</span>
                        <p className="font-bold text-slate-900">{selectedBookingForDrawer.customer_name}</p>
                        <p className="text-slate-600 font-mono text-[11px]">{selectedBookingForDrawer.customer_phone}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Venue &amp; Sport</span>
                        <p className="font-bold text-slate-900">{selectedBookingForDrawer.venue_name || currentVenue.venue_name}</p>
                        <p className="text-slate-600 text-[11px]">{selectedBookingForDrawer.court_name} ({selectedBookingForDrawer.sport})</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 font-mono text-xs">
                      <div className="flex justify-between">
                        <span>Playtime Slot:</span>
                        <span className="font-bold">{selectedBookingForDrawer.time_slot}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Court Charge:</span>
                        <span className="font-bold text-slate-900">₹{selectedBookingForDrawer.total_amount}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700">
                        <span>Payment Method:</span>
                        <span>{selectedBookingForDrawer.payment_method || 'UPI'}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-sm">
                        <span>Reservation Status:</span>
                        <span className="text-emerald-700">{selectedBookingForDrawer.booking_status}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
                      <span>Authorized Booking Pass &bull; Present at venue entrance</span>
                      <span className="font-mono font-bold text-emerald-700">VALID RESERVATION</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePrintBookingSlip}
                    className="w-full py-2.5 rounded-xl bg-[#021526] hover:bg-[#F94001] text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print Booking Pass</span>
                  </button>
                </div>
              )}
            </div>

            {/* Drawer Footer matching Screenshot */}
            <div className="p-4 bg-slate-50 border-t border-[#E5E7EB] flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-600 font-bold uppercase tracking-wider font-mono">
                {selectedBookingForDrawer.booking_status} &bull; ₹{selectedBookingForDrawer.total_amount}
              </span>
              <button
                type="button"
                onClick={() => setSelectedBookingForDrawer(null)}
                className="px-6 py-2.5 rounded-xl bg-[#0B192C] hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal for Venue Booking */}
      {rescheduleModalOpenForVenueBooking && selectedBookingForDrawer && (
        <div className="fixed inset-0 z-[99999] bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-[#F94001]" />
                <h4 className="font-black text-base text-[#021526]">Reschedule Slot</h4>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleModalOpenForVenueBooking(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Current Slot</span>
                <p className="font-bold text-slate-800 mt-0.5">
                  {selectedBookingForDrawer.booking_date} &bull; {selectedBookingForDrawer.time_slot}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">Select New Date</label>
                <input
                  type="date"
                  value={rescheduleDateForVenue || selectedBookingForDrawer.booking_date}
                  onChange={(e) => setRescheduleDateForVenue(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-[#F94001]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">Select New Slot Time</label>
                <select
                  value={rescheduleSlotTimeForVenue || selectedBookingForDrawer.time_slot}
                  onChange={(e) => setRescheduleSlotTimeForVenue(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-[#F94001]"
                >
                  <option value="06:00 AM - 07:00 AM">06:00 AM - 07:00 AM</option>
                  <option value="07:00 AM - 08:00 AM">07:00 AM - 08:00 AM</option>
                  <option value="08:00 AM - 09:00 AM">08:00 AM - 09:00 AM</option>
                  <option value="09:00 AM - 10:00 AM">09:00 AM - 10:00 AM</option>
                  <option value="05:00 PM - 06:00 PM">05:00 PM - 06:00 PM</option>
                  <option value="06:00 PM - 07:00 PM">06:00 PM - 07:00 PM</option>
                  <option value="07:00 PM - 08:00 PM">07:00 PM - 08:00 PM</option>
                  <option value="08:00 PM - 09:00 PM">08:00 PM - 09:00 PM</option>
                  <option value="09:00 PM - 10:00 PM">09:00 PM - 10:00 PM</option>
                  <option value="10:00 PM - 11:00 PM">10:00 PM - 11:00 PM</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRescheduleModalOpenForVenueBooking(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRescheduleVenueBookingAction(selectedBookingForDrawer.id)}
                className="flex-1 py-2.5 rounded-xl bg-[#021526] hover:bg-[#F94001] text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Update Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal for Venue Booking */}
      {cancelModalOpenForVenueBooking && selectedBookingForDrawer && (
        <div className="fixed inset-0 z-[99999] bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-rose-600" />
                <h4 className="font-black text-base text-[#021526]">Cancel Booking &amp; Refund</h4>
              </div>
              <button
                type="button"
                onClick={() => setCancelModalOpenForVenueBooking(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to cancel booking <strong className="text-slate-800 font-mono">{selectedBookingForDrawer.booking_code}</strong> for player <strong>{selectedBookingForDrawer.customer_name}</strong>? A full refund of <strong className="text-rose-700 font-mono">₹{selectedBookingForDrawer.total_amount}</strong> will be initiated.
            </p>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCancelModalOpenForVenueBooking(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={() => handleCancelVenueBookingAction(selectedBookingForDrawer.id)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SLIDE-OVER DRAWER FOR SUPPORT TICKET DETAILS
      ======================================================== */}
      {selectedSupportTicketForDrawer && (
        <div
          className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
          onClick={() => setSelectedSupportTicketForDrawer(null)}
        >
          <div
            className="w-full max-w-xl bg-white shadow-2xl h-full flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 border-l border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-orange-50 text-[#F94001] flex items-center justify-center border border-orange-200/60">
                  <LifeBuoy className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#021526]">
                      {selectedSupportTicketForDrawer.ticket_number}
                    </span>
                    {renderSupportStatusBadge(selectedSupportTicketForDrawer.status)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Support Desk Incident Dossier</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSupportTicketForDrawer(null)}
                className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center cursor-pointer transition-colors"
                title="Close Drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-base text-[#021526]">
                  {selectedSupportTicketForDrawer.subject}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Reported on {selectedSupportTicketForDrawer.created_at}
                </p>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Category</span>
                  <div className="mt-1">{renderSupportCategoryBadge(selectedSupportTicketForDrawer.category)}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Priority</span>
                  <div className="mt-1">{renderSupportPriorityBadge(selectedSupportTicketForDrawer.priority)}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Filed By</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedSupportTicketForDrawer.created_person_name}</p>
                  <p className="text-[11px] text-slate-500">{selectedSupportTicketForDrawer.contact_number}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Venue</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedSupportTicketForDrawer.venue_name || currentVenue?.venue_name}</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Description</span>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed text-xs">
                  {selectedSupportTicketForDrawer.description}
                </div>
              </div>

              {/* Associated Booking Code if any */}
              {selectedSupportTicketForDrawer.related_booking_code && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                  <span className="text-amber-800 font-medium text-xs">Linked Booking Code:</span>
                  <span className="font-mono font-bold text-[#F94001] text-xs">
                    {selectedSupportTicketForDrawer.related_booking_code}
                  </span>
                </div>
              )}

              {/* Resolution Notes if any */}
              {selectedSupportTicketForDrawer.resolution_notes && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-700">Resolution Notes</span>
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 leading-relaxed text-xs">
                    {selectedSupportTicketForDrawer.resolution_notes}
                    {selectedSupportTicketForDrawer.resolved_at && (
                      <p className="text-[10px] text-emerald-700 mt-1.5 font-medium">
                        Resolved on {selectedSupportTicketForDrawer.resolved_at}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedSupportTicketForDrawer(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-[#F94001] transition-colors cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          DOCUMENT PREVIEW MODAL - REAL DYNAMIC UPLOADED DOCUMENT
      ======================================================== */}
      {documentPreviewModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
          onClick={() => setDocumentPreviewModal(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-200 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0">
                  {documentPreviewModal.isPdf ? (
                    <FileText className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
                    {documentPreviewModal.title}
                  </h3>
                  <p className="font-mono text-xs text-slate-500 truncate">
                    {documentPreviewModal.docId || documentPreviewModal.name || 'Uploaded Document'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {documentPreviewModal.url && (
                  <a
                    href={documentPreviewModal.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-2xs"
                    title="Open original file in new tab"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Open in New Tab</span>
                  </a>
                )}
                {documentPreviewModal.url && (
                  <a
                    href={documentPreviewModal.url}
                    download={documentPreviewModal.name || `${documentPreviewModal.docId || 'document'}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#021526] hover:bg-[#06243f] text-white text-xs font-bold transition-colors shadow-xs"
                    title="Download original file"
                  >
                    <Download className="h-3.5 w-3.5 text-[#F94001]" />
                    <span className="hidden sm:inline">Download</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setDocumentPreviewModal(null)}
                  className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors ml-1"
                  aria-label="Close modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Dynamic Document Display - Real Uploaded File */}
            <div className="flex-1 overflow-hidden bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center min-h-[400px] max-h-[70vh]">
              {documentPreviewModal.url ? (
                documentPreviewModal.isPdf ? (
                  <iframe
                    src={documentPreviewModal.url}
                    title={documentPreviewModal.title}
                    className="w-full h-[68vh] bg-white border-0 rounded-2xl"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-4 bg-slate-950/95 overflow-auto rounded-2xl">
                    <img
                      src={documentPreviewModal.url}
                      alt={documentPreviewModal.title}
                      className="max-h-[64vh] max-w-full object-contain rounded-lg shadow-xl"
                    />
                  </div>
                )
              ) : (
                <div className="p-8 text-center space-y-2">
                  <AlertCircle className="h-8 w-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-800">No Document File Available</p>
                  <p className="text-[11px] text-slate-500">The file has not been uploaded to the vault yet.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
              <span className="flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">
                  Dynamic Onboarding File Vault: {documentPreviewModal.docId || 'Verified Record'}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setDocumentPreviewModal(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================
          ADD NEW COURT / TURF MODAL (EXACT MATCH TO USER SCREENSHOTS 1, 2, 3)
      ======================================================== */}
      {isCourtRequestModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={() => setIsCourtRequestModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-[#F94001] shadow-2xs shrink-0">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                    {editingCourtRequest ? `Edit & Resubmit Court (Round ${(editingCourtRequest.submission_round || 1) + 1})` : 'Add New Court / Turf'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Configure specs, pricing and cancellation policy for {currentVenue.venue_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCourtRequestModalOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Scrollable Form Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <form id="court-request-form" onSubmit={handleSaveCourtRequestForm} className="space-y-5">
                {/* 1. Same physical sports for this turf? (Screenshot 1) */}
                <div className="bg-slate-50/70 rounded-2xl p-4.5 border border-slate-200/80 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                        1
                      </span>
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                        Same physical sports for this turf?
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-orange-100/70 text-[#F94001] text-[10px] font-bold">
                      Required
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Select <strong>Yes</strong> if this sport will share the ground with an already live physical court (e.g. Football pitch also used for Box Cricket).
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setReqSamePhysicalSports(true)}
                      className={`h-11 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        reqSamePhysicalSports
                          ? 'bg-white border-2 border-[#F94001] text-[#F94001] shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {reqSamePhysicalSports && <Check className="h-4 w-4 text-[#F94001]" />}
                      <span>Yes (Share Physical Ground)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReqSamePhysicalSports(false)}
                      className={`h-11 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        !reqSamePhysicalSports
                          ? 'bg-white border-2 border-[#F94001] text-[#F94001] shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {!reqSamePhysicalSports && <Check className="h-4 w-4 text-[#F94001]" />}
                      <span>No (Separate Ground)</span>
                    </button>
                  </div>
                </div>

                {/* 2. Court Information (Screenshot 1) */}
                <div className="bg-slate-50/70 rounded-2xl p-4.5 border border-slate-200/80 space-y-3.5 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                      2
                    </span>
                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                      Court Information
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1.5 text-xs">
                        Select Sport <span className="text-[#F94001]">*</span>
                      </label>
                      <select
                        value={reqSport}
                        onChange={(e) => setReqSport(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold outline-none focus:border-[#F94001] transition-colors shadow-2xs"
                      >
                        <option value="Football">Football</option>
                        <option value="Cricket">Cricket</option>
                        <option value="Badminton">Badminton</option>
                        <option value="Box Cricket">Box Cricket</option>
                        <option value="Tennis">Tennis</option>
                        <option value="Pickleball">Pickleball</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1.5 text-xs">
                        Court Name <span className="text-[#F94001]">*</span>
                      </label>
                      <input
                        type="text"
                        value={reqCourtName}
                        onChange={(e) => setReqCourtName(e.target.value)}
                        placeholder="e.g. Turf 1A (5-a-side)"
                        required
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-semibold outline-none focus:border-[#F94001] transition-colors shadow-2xs"
                      >
                      </input>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5 text-xs">
                      Display Name <span className="text-slate-400 font-normal">(Customer-Facing, optional)</span>
                    </label>
                    <input
                      type="text"
                      value={reqDisplayName}
                      onChange={(e) => setReqDisplayName(e.target.value)}
                      placeholder="e.g. Main Arena Pitch 1 (Floodlit Turf)"
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium outline-none focus:border-[#F94001] transition-colors shadow-2xs"
                    />
                  </div>
                </div>

                {/* 3. Base Duration & Rate (Screenshot 1 & 2) */}
                <div className="bg-slate-50/70 rounded-2xl p-4.5 border border-slate-200/80 space-y-3.5 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                      3
                    </span>
                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                      Base Duration &amp; Rate
                    </h4>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-2 text-xs">
                      Minimum Booking Duration
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {['30 Mins', '1 Hour', '1.5 Hours', '2 Hours', '3 Hours'].map((dur) => (
                        <button
                          key={dur}
                          type="button"
                          onClick={() => setReqMinDuration(dur)}
                          className={`h-9 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer truncate ${
                            reqMinDuration === dur
                              ? 'bg-[#F94001] text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {dur}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5 text-xs">
                      Regular Hourly Price (₹/hour) <span className="text-[#F94001]">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={reqPricePerHour}
                        onChange={(e) => setReqPricePerHour(Number(e.target.value))}
                        required
                        min={100}
                        className="w-full h-10 pl-8 pr-16 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono font-bold text-xs outline-none focus:border-[#F94001] transition-colors shadow-2xs"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs">
                        / hour
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Peak Surcharge & Weekend Rates (Screenshot 2) */}
                <div className="bg-slate-50/70 rounded-2xl p-4.5 border border-slate-200/80 space-y-3.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                        4
                      </span>
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                        Peak Surcharge &amp; Weekend Rates
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-orange-100 text-[#F94001] text-[10px] font-bold">
                      High Demand
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1 text-[11px] uppercase tracking-wider">
                        PEAK START
                      </label>
                      <select
                        value={reqPeakStart}
                        onChange={(e) => setReqPeakStart(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold text-xs outline-none focus:border-[#F94001]"
                      >
                        <option value="05:00 PM">05:00 PM</option>
                        <option value="06:00 PM">06:00 PM</option>
                        <option value="07:00 PM">07:00 PM</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1 text-[11px] uppercase tracking-wider">
                        PEAK END
                      </label>
                      <select
                        value={reqPeakEnd}
                        onChange={(e) => setReqPeakEnd(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold text-xs outline-none focus:border-[#F94001]"
                      >
                        <option value="10:00 PM">10:00 PM</option>
                        <option value="11:00 PM">11:00 PM</option>
                        <option value="12:00 AM">12:00 AM</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1 text-xs">
                        Peak Rate (₹/hr)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F94001] font-bold text-xs">₹</span>
                        <input
                          type="number"
                          value={reqPeakPrice}
                          onChange={(e) => setReqPeakPrice(Number(e.target.value))}
                          className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono font-bold text-xs outline-none focus:border-[#F94001]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1 text-xs">
                        Weekend Rate (₹/hr)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-700 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          value={reqWeekendPrice}
                          onChange={(e) => setReqWeekendPrice(Number(e.target.value))}
                          className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono font-bold text-xs outline-none focus:border-[#F94001]"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-slate-700 font-bold text-xs">Active Peak Days</label>
                      <button
                        type="button"
                        onClick={() => setReqPeakDays(['Fri', 'Sat', 'Sun'])}
                        className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 cursor-pointer hover:bg-emerald-100"
                      >
                        Fri-Sun Preset
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                        const isDaySelected = reqPeakDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              if (isDaySelected) {
                                setReqPeakDays(reqPeakDays.filter((d) => d !== day));
                              } else {
                                setReqPeakDays([...reqPeakDays, day]);
                              }
                            }}
                            className={`h-9 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                              isDaySelected
                                ? 'bg-[#F94001] text-white shadow-2xs'
                                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 5. Free Cancellation Window (Screenshot 2 & 3) */}
                <div className="bg-slate-50/70 rounded-2xl p-4.5 border border-slate-200/80 space-y-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-orange-100/70 text-[#F94001] flex items-center justify-center shrink-0">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                        Free Cancellation Window
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Minimum notice required for full or partial refund
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-2 text-xs">
                      Notice Buffer Before Match Kickoff:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[2, 4, 12, 24].map((hours) => (
                        <button
                          key={hours}
                          type="button"
                          onClick={() => setReqCancellationHours(hours)}
                          className={`h-9 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            reqCancellationHours === hours
                              ? 'bg-[#F94001] text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {hours} Hours
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 6. Refund Payout Percentage (Screenshot 3) */}
                <div className="bg-slate-50/70 rounded-2xl p-4.5 border border-slate-200/80 space-y-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-sm">
                      %
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                        Refund Payout Percentage
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Amount returned to customer source account
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-2 text-xs">
                      Eligible Refund Value:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[50, 75, 90, 100].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setReqRefundPercentage(pct)}
                          className={`h-9 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            reqRefundPercentage === pct
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 7. Customer Cancellation Rule Banner (Screenshot 3) */}
                <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-emerald-900 shadow-2xs">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <p className="font-medium">
                    <strong className="font-bold">Customer Cancellation Rule:</strong> Free cancellation permitted up to {reqCancellationHours} Hours before kickoff with {reqRefundPercentage}% refund.
                  </p>
                </div>

                {/* 8. Submit Court for Approval Button (Screenshot 3) */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full h-12 rounded-2xl bg-[#F94001] hover:bg-[#E03800] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-98"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>
                      {editingCourtRequest
                        ? `Resubmit Court for Round ${(editingCourtRequest.submission_round || 1) + 1} Review`
                        : 'Submit Court for Approval'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          RIGHT-SIDE SLIDE BAR (DRAWER) FOR COURT EXTENSION REQUESTS
      ======================================================== */}
      {selectedCourtRequestForDrawer && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-150"
          onClick={() => {
            setSelectedCourtRequestForDrawer(null);
            setIsDrawerRejectOpen(false);
            setDrawerActionError(null);
          }}
        >
          <div
            className="w-full max-w-[540px] bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header matching Image 2 */}
            <div className="p-5 bg-white border-b border-[#E5E7EB] flex items-start justify-between gap-3 shrink-0">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#F94001]">
                  COURT EXTENSION REQUEST DOSSIER
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black font-display text-[#021526]">
                    #{selectedCourtRequestForDrawer.id} &bull; {selectedCourtRequestForDrawer.court_name}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedCourtRequestForDrawer.venue_name || currentVenue.venue_name} &bull;{' '}
                  {selectedCourtRequestForDrawer.venue_city || currentVenue.district || currentVenue.state}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedCourtRequestForDrawer(null);
                  setIsDrawerRejectOpen(false);
                  setDrawerActionError(null);
                }}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Drawer Body: Cards Layout matching Image 2 */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* CARD 1: AUTHORIZED VENUE OWNER & CONTACT */}
              <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-[#021526]">
                      Authorized Venue Owner &amp; Contact
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    KYC Verified Partner
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                    {(selectedCourtRequestForDrawer.owner_name || currentVenue?.owner?.full_name || 'Owner')
                      .trim()
                      .split(/\s+/)
                      .map((n: string) => (n ? n[0] : ''))
                      .filter(Boolean)
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || 'OW'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs">
                      {selectedCourtRequestForDrawer.owner_name || currentVenue?.owner?.full_name || 'Owner'}
                    </p>
                    <div className="flex items-center gap-2.5 text-xs text-slate-500">
                      <a
                        href={`tel:${selectedCourtRequestForDrawer.owner_phone || currentVenue?.owner?.phone || '+91 9840128866'}`}
                        className="hover:text-[#F94001] flex items-center gap-1 font-mono text-[11px]"
                      >
                        <Phone className="h-3 w-3 text-emerald-600" />
                        <span>{selectedCourtRequestForDrawer.owner_phone || currentVenue?.owner?.phone || '+91 9840128866'}</span>
                      </a>
                      <span>&bull;</span>
                      <span className="font-mono text-[10px] text-slate-400">
                        Vendor ID: VEND-{(selectedCourtRequestForDrawer.venue_id || currentVenue.id || '10235').slice(-4)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 2: COURT SPECIFICATIONS & PLAYER APP ALLOCATION */}
              <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-purple-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-[#021526]">
                      Court Specifications &amp; Player App Allocation
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 flex items-center gap-1">
                    <span>{SPORT_ICONS[selectedCourtRequestForDrawer.sport] || '🏏'}</span>
                    <span>{selectedCourtRequestForDrawer.sport || 'Cricket'}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Internal Court Name
                    </span>
                    <p className="font-extrabold text-slate-900 text-xs mt-0.5">
                      {selectedCourtRequestForDrawer.court_name}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Player App Display Name
                    </span>
                    <p className="font-medium text-slate-800 text-xs mt-0.5">
                      {selectedCourtRequestForDrawer.display_name || selectedCourtRequestForDrawer.court_name}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Ground Allocation
                    </span>
                    <p className="text-slate-800 font-medium text-xs mt-0.5">
                      {selectedCourtRequestForDrawer.same_physical_sports
                        ? `Shared Physical Ground with ${selectedCourtRequestForDrawer.parent_court_name || 'Main Court'}`
                        : 'Independent Dedicated Pitch / Court'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Minimum Booking Duration
                    </span>
                    <p className="font-mono font-bold text-slate-800 text-xs mt-0.5">
                      {selectedCourtRequestForDrawer.min_booking_duration || selectedCourtRequestForDrawer.min_booking_duration_label || '1 Hour'}
                    </p>
                  </div>
                </div>
              </div>

              {/* CARD 3: HOURLY RATES & REFUND POLICY */}
              <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-[#021526]">
                      Hourly Rates &amp; Refund Policy
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold">
                    Direct Gateway Standard
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Base Hourly Rate
                    </span>
                    <p className="font-mono font-black text-sm text-[#021526] mt-0.5">
                      ₹{selectedCourtRequestForDrawer.price_per_hour || selectedCourtRequestForDrawer.regular_price || 1100}/hr
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-200/60">
                    <span className="text-[10px] font-bold text-amber-700 uppercase">
                      Peak Hours Rate
                    </span>
                    <p className="font-mono font-black text-sm text-amber-900 mt-0.5">
                      ₹{selectedCourtRequestForDrawer.peak_price || selectedCourtRequestForDrawer.price_per_hour || 1400}/hr
                    </p>
                    <p className="text-[9px] font-mono text-amber-600 mt-0.5">
                      {selectedCourtRequestForDrawer.peak_hours_start || '06:00 PM'} -{' '}
                      {selectedCourtRequestForDrawer.peak_hours_end || '10:00 PM'}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-200/60">
                    <span className="text-[10px] font-bold text-purple-700 uppercase">
                      Weekend Rate
                    </span>
                    <p className="font-mono font-black text-sm text-purple-900 mt-0.5">
                      ₹{selectedCourtRequestForDrawer.weekend_price || selectedCourtRequestForDrawer.price_per_hour || 1500}/hr
                    </p>
                    <p className="text-[9px] font-mono text-purple-600 mt-0.5">
                      {selectedCourtRequestForDrawer.peak_days?.join(', ') || 'Fri, Sat, Sun'}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Cancellation &amp; Refund Rules
                  </span>
                  <p className="text-slate-700 font-medium">
                    Free cancellation allowed up to{' '}
                    <span className="font-bold text-[#021526]">
                      {selectedCourtRequestForDrawer.cancellation_window_hours || selectedCourtRequestForDrawer.cancellation_policy_hours || 12} hours
                    </span>{' '}
                    before slot commencement with{' '}
                    <span className="font-bold text-emerald-700">
                      {selectedCourtRequestForDrawer.refund_percentage || 100}% refund
                    </span>
                    .
                  </p>
                </div>
              </div>

              {/* If Rejected: Show Rejection Callout */}
              {selectedCourtRequestForDrawer.status === 'REJECTED' && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>Rejection Reason: {selectedCourtRequestForDrawer.rejection_reason || 'Specifications require revision.'}</span>
                  </div>
                  {(selectedCourtRequestForDrawer.rejection_note || selectedCourtRequestForDrawer.rejection_notes) && (
                    <p className="bg-white/90 p-3 rounded-xl border border-rose-100 text-rose-900 font-medium">
                      &ldquo;{selectedCourtRequestForDrawer.rejection_note || selectedCourtRequestForDrawer.rejection_notes}&rdquo;
                    </p>
                  )}
                </div>
              )}

              {/* Drawer Inline Rejection Form */}
              {isDrawerRejectOpen && (
                <div className="bg-rose-50/90 rounded-2xl p-4.5 border border-rose-200 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-rose-900 text-xs flex items-center gap-1.5">
                      <X className="h-4 w-4 text-rose-600" />
                      <span>Reject Request with Specific Feedback Notes</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsDrawerRejectOpen(false)}
                      className="text-rose-600 text-xs font-bold hover:underline cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div>
                    <label className="block text-rose-900 font-bold mb-1 text-xs">Rejection Reason Code</label>
                    <select
                      value={drawerRejectionReason}
                      onChange={(e) => setDrawerRejectionReason(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl border border-rose-300 bg-white text-slate-900 text-xs font-bold outline-none cursor-pointer"
                    >
                      {REJECTION_REASONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-rose-900 font-bold mb-1 text-xs">
                      Admin Feedback Notes (Required so owner can correct and resubmit) *
                    </label>
                    <textarea
                      rows={3}
                      value={drawerRejectionNote}
                      onChange={(e) => setDrawerRejectionNote(e.target.value)}
                      placeholder="e.g. Please reduce regular hourly price below ₹1200 or verify lighting Lux rating for evening slots."
                      className="w-full p-3 rounded-xl border border-rose-300 bg-white text-slate-900 text-xs font-medium outline-none focus:border-rose-500"
                    />
                  </div>

                  {drawerActionError && (
                    <p className="text-xs text-rose-700 font-bold">{drawerActionError}</p>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRejectCourtRequest(selectedCourtRequestForDrawer)}
                    className="w-full h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    Confirm Rejection with Feedback Notes
                  </button>
                </div>
              )}
            </div>

            {/* Sticky Action Footer matching Image 2 */}
            <div className="p-4 bg-slate-50 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCourtRequestForDrawer(null);
                    setIsDrawerRejectOpen(false);
                    setDrawerActionError(null);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteConfirmReqId(selectedCourtRequestForDrawer.id)}
                  className="px-3.5 py-2 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Delete Court Request Permanently"
                >
                  <Ban className="h-3.5 w-3.5" />
                  <span>Delete Request</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedCourtRequestForDrawer.status === 'APPROVED' ? (
                  <>
                    <button
                      type="button"
                      disabled
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 font-bold text-xs opacity-50 cursor-not-allowed"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      disabled
                      className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs opacity-80 cursor-not-allowed flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Approved</span>
                    </button>
                  </>
                ) : selectedCourtRequestForDrawer.status === 'REJECTED' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenEditCourtRequestModal(selectedCourtRequestForDrawer);
                        setSelectedCourtRequestForDrawer(null);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#F94001] hover:bg-[#E03800] text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Resubmit</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsDrawerRejectOpen(true)}
                      className="px-3.5 py-2 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveCourtRequest(selectedCourtRequestForDrawer)}
                      className="px-4 py-2 rounded-xl bg-[#00875A] hover:bg-[#007048] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="h-4 w-4" />
                      <span>Approve</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          DELETE CONFIRMATION MODAL
      ======================================================== */}
      {deleteConfirmReqId && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setDeleteConfirmReqId(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-12 w-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Delete Court Extension Request?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete request <strong className="font-mono text-slate-800">{deleteConfirmReqId}</strong> for venue <strong>{currentVenue.venue_name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmReqId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCourtRequest(deleteConfirmReqId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          GPS MAP POPUP MODAL (No redirect to another page)
      ======================================================== */}
      {gpsModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setGpsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#F94001]">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{currentVenue.venue_name}</h3>
                  <p className="text-xs text-slate-500">
                    {currentVenue.district}, {currentVenue.state}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGpsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Embed Map Preview */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video relative shadow-inner">
              <iframe
                title="Venue GPS Location"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://maps.google.com/maps?q=${encodeURIComponent(
                  (googleMapsLinkInput || currentVenue.venue_location_name) && (googleMapsLinkInput || currentVenue.venue_location_name).includes('q=')
                    ? (googleMapsLinkInput || currentVenue.venue_location_name).split('q=')[1]
                    : `${currentVenue.venue_name}, ${currentVenue.district || ''}, ${currentVenue.state || ''}`
                )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Address</span>
              <p className="text-slate-700 font-medium">
                {currentVenue.address || physicalAddressInput || `${currentVenue.venue_name}, ${currentVenue.district}, ${currentVenue.state}`}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setGpsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>
              {(googleMapsLinkInput || currentVenue.venue_location_name) && (
                <a
                  href={googleMapsLinkInput || currentVenue.venue_location_name}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#F94001] hover:bg-[#E03800] text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          BLOCK VENUE MODAL (Strict Owner Login Restriction)
      ======================================================== */}
      {blockModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setBlockModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-2xs">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 font-display">Block Venue &amp; Restrict Login</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Blocking <strong className="text-slate-800">{currentVenue.venue_name}</strong> will strictly restrict the venue owner from logging in.
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                <span>Strict Owner Login Restriction</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                When the venue owner attempts to log in to the vendor portal, their access will be blocked and they will see a notice instructing them to contact the iBookSports Support Team.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Reason for Blocking</label>
              <select
                value={blockPresetReason}
                onChange={(e) => setBlockPresetReason(e.target.value)}
                className="w-full h-9.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none cursor-pointer"
              >
                <option value="Policy violation & non-compliance">Policy violation & non-compliance</option>
                <option value="Payment or settlement dispute">Payment or settlement dispute</option>
                <option value="Document verification failure / Suspicious activity">Document verification failure / Suspicious activity</option>
                <option value="Owner requested temporary hold">Owner requested temporary hold</option>
                <option value="Other administrative reason">Other administrative reason</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Additional Notes / Remarks</label>
              <textarea
                rows={3}
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Provide specific reason or details for records..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setBlockModalOpen(false);
                  setBlockReason('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleUpdateVenueStatus('INACTIVE');
                  setStatusNotification(`Venue "${currentVenue.venue_name}" is blocked. Owner login strictly restricted.`);
                  setBlockModalOpen(false);
                  setBlockReason('');
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Confirm &amp; Block Venue</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          UNBLOCK VENUE CONFIRMATION MODAL
      ======================================================== */}
      {unblockModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setUnblockModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 font-display">Unblock Venue &amp; Restore Access</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to unblock <strong className="text-slate-800">{currentVenue.venue_name}</strong>?
                </p>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-800 space-y-1">
              <p className="text-[11px] leading-relaxed">
                The venue owner will immediately regain full login access to their vendor application, and court listings will be re-enabled for active customer bookings.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUnblockModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleUpdateVenueStatus('ACTIVE');
                  setStatusNotification(`Venue "${currentVenue.venue_name}" successfully unblocked. Owner login access restored.`);
                  setUnblockModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Confirm &amp; Unblock Venue</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SLIDE BAR (DRAWER) FOR STAFF MEMBER DETAILS
      ======================================================== */}
      {selectedStaffForDrawer && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-150"
          onClick={() => setSelectedStaffForDrawer(null)}
        >
          <div
            className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/70">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#F94001]">
                  ARENA STAFF MEMBER DOSSIER
                </span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-slate-200 font-mono text-[11px] font-bold text-slate-800">
                    {selectedStaffForDrawer.staff_id || selectedStaffForDrawer.display_id || selectedStaffForDrawer.id}
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                    {selectedStaffForDrawer.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {currentVenue.venue_name} &bull; {currentVenue.district || currentVenue.state}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStaffForDrawer(null)}
                className="h-8 w-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* CARD 1: Profile & Designation */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-[#F94001]" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Personnel Profile
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      selectedStaffForDrawer.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        selectedStaffForDrawer.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    <span>{selectedStaffForDrawer.status === 'ACTIVE' ? 'Active Account' : 'Inactive'}</span>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#091522] text-white font-black text-sm flex items-center justify-center shrink-0 tracking-tight shadow-2xs">
                    {(selectedStaffForDrawer.name || 'Staff')
                      .trim()
                      .split(/\s+/)
                      .map((n) => (n ? n[0] : ''))
                      .filter(Boolean)
                      .join('')
                      .substring(0, 2)
                      .toUpperCase() || 'ST'}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      {selectedStaffForDrawer.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/70 font-bold text-[10px] tracking-wider uppercase font-mono">
                        {selectedStaffForDrawer.role}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedStaffForDrawer.shift_hours && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Assigned Shift</span>
                    <span className="text-slate-700 font-mono font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {selectedStaffForDrawer.shift_hours}
                    </span>
                  </div>
                )}
              </div>

              {/* CARD 2: Direct Contact */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Contact Information
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Verified
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-orange-50 text-[#F94001] flex items-center justify-center shrink-0">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Mobile Number</span>
                        <a
                          href={`tel:${selectedStaffForDrawer.mobile_number}`}
                          className="font-bold text-slate-900 hover:text-[#F94001] text-xs font-mono"
                        >
                          {selectedStaffForDrawer.mobile_number}
                        </a>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyStaffText(selectedStaffForDrawer.mobile_number, 'drawer_mobile')}
                      className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      title="Copy phone"
                    >
                      {staffCopiedText === 'drawer_mobile' ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2.5 truncate mr-2">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div className="truncate">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Email Address</span>
                        <a
                          href={`mailto:${selectedStaffForDrawer.email}`}
                          className="font-bold text-slate-900 hover:text-[#F94001] text-xs truncate block"
                          title={selectedStaffForDrawer.email}
                        >
                          {selectedStaffForDrawer.email || 'Not provided'}
                        </a>
                      </div>
                    </div>
                    {selectedStaffForDrawer.email && (
                      <button
                        type="button"
                        onClick={() => handleCopyStaffText(selectedStaffForDrawer.email, 'drawer_email')}
                        className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                        title="Copy email"
                      >
                        {staffCopiedText === 'drawer_email' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* CARD 3: Venue & Operational Scope */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-purple-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Facility &amp; Operational Assignment
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {(currentVenue as any).app_id || currentVenue.id}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Assigned Arena</span>
                    <p className="font-bold text-slate-900 text-xs mt-0.5">{currentVenue.venue_name}</p>
                    <p className="text-[11px] text-slate-500">{currentVenue.district}, {currentVenue.state}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Venue Owner</span>
                    <p className="font-bold text-slate-900 text-xs mt-0.5">{currentVenue.name || ownerFullName || 'Venue Owner'}</p>
                    <p className="text-[11px] font-mono text-slate-500">{currentVenue.mobile_number || ownerPhone || ''}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1">
                  <span className="font-bold text-slate-800 text-[10px] uppercase tracking-wider block">Access Scope &amp; Responsibilities</span>
                  <p className="leading-relaxed">
                    Authorized ground personnel managed via Venue Owner App. Responsible for pitch readiness, player check-in verification, lighting coordination, and court maintenance.
                  </p>
                </div>
              </div>

              {/* CARD 4: System Record */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Database &amp; Sync Status
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Live Supabase Synchronized
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[11px]">Database Record ID:</span>
                    <span className="font-mono text-slate-800 text-[11px] font-semibold">
                      {selectedStaffForDrawer.db_id || selectedStaffForDrawer.id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[11px]">Target Table:</span>
                    <span className="font-mono text-slate-800 text-[11px]">public.venue_staff</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedStaffForDrawer(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SLIDE BAR (DRAWER) FOR CANCELLATION DETAILS
      ======================================================== */}
      {selectedCancellationForDrawer && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-150"
          onClick={() => setSelectedCancellationForDrawer(null)}
        >
          <div
            className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/70">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#F94001]">
                  CANCELLATION &amp; REFUND AUDIT DOSSIER
                </span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-mono text-[11px] font-bold">
                    {selectedCancellationForDrawer.booking_code}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[10px]">
                    {selectedCancellationForDrawer.refund_status || 'WALLET_CREDITED'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {currentVenue.venue_name} &bull; {currentVenue.district || currentVenue.state}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCancellationForDrawer(null)}
                className="h-8 w-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                title="Close Drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* CARD 1: Customer Profile */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-[#F94001]" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Customer &amp; Booker Information
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">
                    ID: {selectedCancellationForDrawer.customer_id}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      {selectedCancellationForDrawer.customer_name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">Primary Booker</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Customer Phone</span>
                    {selectedCancellationForDrawer.customer_phone ? (
                      <div className="flex items-center gap-1 mt-0.5 justify-end">
                        <a
                          href={`tel:${selectedCancellationForDrawer.customer_phone}`}
                          className="font-mono font-bold text-slate-800 hover:text-[#F94001] transition-colors"
                        >
                          {selectedCancellationForDrawer.customer_phone}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopyCancellationText(selectedCancellationForDrawer.customer_phone, 'phone')}
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                          title="Copy phone"
                        >
                          {cancellationCopiedText === 'phone' ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Not available</span>
                    )}
                  </div>
                </div>
              </div>

              {/* CARD 2: Slot & Court Specifications */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-[#F94001]" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Cancelled Slot &amp; Match Schedule
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold uppercase">
                    {selectedCancellationForDrawer.sport}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">Playing Court</span>
                    <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                      {selectedCancellationForDrawer.court_name || 'Court 1'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">Match Date</span>
                    <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                      {selectedCancellationForDrawer.booking_date}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">Reserved Slot</span>
                    <span className="font-mono font-bold text-slate-800 text-xs mt-0.5 block">
                      {selectedCancellationForDrawer.time_slot}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">Duration</span>
                    <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                      {selectedCancellationForDrawer.duration_minutes || 60} Minutes
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD 3: Payment & Refund Breakdown */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-[#F94001]" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Payment &amp; Refund Audit Breakdown
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                    Reversal Verified
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Original Paid Amount</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        ₹{selectedCancellationForDrawer.total_amount?.toLocaleString('en-IN') || 0}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Payment Mode</span>
                      <span className="font-bold text-slate-800 uppercase text-xs mt-0.5 block">
                        {selectedCancellationForDrawer.payment_method || 'UPI'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                    <div>
                      <span className="text-[10px] text-emerald-800 block font-medium">Total Refund Reversal</span>
                      <span className="font-mono font-black text-emerald-700 text-base">
                        ₹{(selectedCancellationForDrawer.refund_amount || selectedCancellationForDrawer.total_amount)?.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-800 block font-medium">Refund Channel</span>
                      <span className="font-bold text-emerald-900 text-xs mt-0.5 block">
                        {selectedCancellationForDrawer.payment_method ? `${selectedCancellationForDrawer.payment_method} Reversal` : 'UPI Source Reversal'}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Original Transaction ID:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {selectedCancellationForDrawer.transaction_id || `TXN-${selectedCancellationForDrawer.id}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Refund Reference / UTR:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {selectedCancellationForDrawer.refund_utr || `REF-UTR-${selectedCancellationForDrawer.booking_code.replace(/[^a-zA-Z0-9]/g, '')}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>Venue Payout Deducted:</span>
                      <span className="font-mono font-semibold text-slate-700">
                        ₹{(selectedCancellationForDrawer.venue_share || Math.round((selectedCancellationForDrawer.total_amount || 0) * 0.9)).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Platform Commission Reversed:</span>
                      <span className="font-mono font-semibold text-slate-700">
                        ₹{(selectedCancellationForDrawer.platform_fee || Math.round((selectedCancellationForDrawer.total_amount || 0) * 0.1)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 4: Reason & Cancellation Audit Trail */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-[#F94001]" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Cancellation Reason &amp; Audit Trail
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 space-y-1">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                    Reason Logged
                  </span>
                  <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                    {selectedCancellationForDrawer.cancellation_reason || 'Inclement weather cancellation / Customer requested cancellation'}
                  </p>
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-500">
                  <div className="flex items-center justify-between">
                    <span>Cancelled At:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedCancellationForDrawer.cancelled_at || '2026-03-04 16:30'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Policy Adherence:</span>
                    <span className="font-semibold text-emerald-700">100% Refund Approved</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedCancellationForDrawer(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
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
