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
  ChevronDown,
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
  AlertTriangle,
  Download,
} from 'lucide-react';
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
  status: 'AVAILABLE' | 'HOLD' | 'UNAVAILABLE';
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

  // Selected Booking Drawer State (inside Bookings Tab)
  const [selectedBookingForDrawer, setSelectedBookingForDrawer] = useState<BookingItem | null>(null);

  // Staff state (view only)
  const [staffMembers, setStaffMembers] = useState<VenueStaffMember[]>([]);

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

  // Slots date selection
  const [selectedSlotDate, setSelectedSlotDate] = useState<'today' | 'tomorrow' | 'day_after'>('today');
  const [selectedCourtFilterForSlots, setSelectedCourtFilterForSlots] = useState<string>('ALL');
  const [slotsState, setSlotsState] = useState<Record<string, 'AVAILABLE' | 'HOLD' | 'UNAVAILABLE'>>({});

  // Filters inside Bookings tab
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('ALL');
  const [bookingSearchQuery, setBookingSearchQuery] = useState<string>('');

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
        const stored = localStorage.getItem('ibooksports_live_venues');
        if (stored) {
          const parsed: VenueDetail[] = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const existingIds = new Set(parsed.map((p) => p.id));
            setVenues((prev) => [...parsed, ...prev.filter((v) => !existingIds.has(v.id))]);
          }
        }
      } catch (err) {
        console.error('Failed to load live venues from local storage', err);
      }

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
              history: [
                {
                  round: 1,
                  action: (r.status === 'PENDING' ? 'SUBMITTED' : r.status) as any,
                  timestamp: r.created_at,
                  note: 'Inbound court extension request.',
                },
              ],
              created_at: r.created_at,
              submitted_at: r.created_at ? r.created_at.split('T')[0] : '2026-03-09',
            }));
          }
        } catch (err) {
          console.warn('Failed to load court requests from backend API', err);
        }

        try {
          const storedReqs = localStorage.getItem('ibooksports_court_requests');
          if (storedReqs) {
            const parsedReqs: CourtExtensionRequest[] = JSON.parse(storedReqs);
            if (Array.isArray(parsedReqs)) {
              parsedReqs.forEach((localReq) => {
                const existingIdx = mergedReqs.findIndex((m) => m.id === localReq.id);
                if (existingIdx === -1) {
                  mergedReqs.unshift(localReq);
                } else {
                  mergedReqs[existingIdx] = { ...mergedReqs[existingIdx], ...localReq };
                }
              });
            }
          }
        } catch (err) {
          console.error('Failed to load court requests from localStorage', err);
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

  const saveCourtRequestsToStorage = (updatedList: CourtExtensionRequest[]) => {
    setCourtRequests(updatedList);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ibooksports_court_requests', JSON.stringify(updatedList));
      } catch (err) {
        console.error('Failed to save court requests to localStorage', err);
      }
    }
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
    return venueCourtRequests.filter((r) => r.status === 'SUBMITTED' || r.status === 'RESUBMITTED').length;
  }, [venueCourtRequests]);

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
          history: [...r.history, historyItem],
        };
      }
      return r;
    });
    saveCourtRequestsToStorage(updated);
    adminApi.reviewCourtRequest(req.id, { status: 'APPROVED' }).catch((e) => console.warn(e));

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
          rejection_reason: REJECTION_REASONS.find((rr) => rr.value === drawerRejectionReason)?.label || drawerRejectionReason,
          rejection_note: drawerRejectionNote.trim(),
          history: [...r.history, historyItem],
        };
      }
      return r;
    });

    saveCourtRequestsToStorage(updated);
    adminApi.reviewCourtRequest(req.id, { status: 'REJECTED', rejection_reason: drawerRejectionNote.trim() }).catch((e) => console.warn(e));
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

      // Live Staff: Map from currentVenue.staff_members or fetch dynamically from backend API
      if (Array.isArray((currentVenue as any).staff_members) && (currentVenue as any).staff_members.length > 0) {
        setStaffMembers((currentVenue as any).staff_members);
      } else {
        adminApi.getVenueStaff(currentVenue.id).then((liveStaff) => {
          if (Array.isArray(liveStaff) && liveStaff.length > 0) {
            setStaffMembers(liveStaff);
          } else if (currentVenue.staff_name || currentVenue.owner?.full_name) {
            setStaffMembers([
              {
                id: 'STF-01',
                name: currentVenue.staff_name || currentVenue.owner?.full_name,
                mobile_number: currentVenue.staff_contact || currentVenue.owner?.phone || '',
                role: currentVenue.staff_role || 'VENUE_MANAGER',
                email: currentVenue.owner?.email || currentVenue.email || '',
                shift_hours: '06:00 AM - 10:00 PM',
                status: 'ACTIVE',
              },
            ]);
          } else {
            setStaffMembers([]);
          }
        }).catch(() => {
          setStaffMembers([]);
        });
      }
    }
  }, [currentVenue]);


  // Copy helper
  const handleCopy = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
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

  // Filtered Bookings for this venue (Real data only)
  const venueBookings = useMemo<BookingItem[]>(() => {
    return [];
  }, [currentVenue]);

  const filteredBookings = useMemo<BookingItem[]>(() => {
    return venueBookings.filter((b: BookingItem) => {
      const matchesStatus = bookingStatusFilter === 'ALL' || b.booking_status === bookingStatusFilter;
      const q = bookingSearchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        b.booking_code.toLowerCase().includes(q) ||
        b.customer_name.toLowerCase().includes(q) ||
        b.customer_phone.includes(q) ||
        b.sport.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [venueBookings, bookingStatusFilter, bookingSearchQuery]);

  // Filtered Cancellations
  const venueCancellations = useMemo<BookingItem[]>(() => {
    return venueBookings.filter((b: BookingItem) => b.booking_status === 'CANCELLED' || (b.refund_amount && b.refund_amount > 0));
  }, [venueBookings]);

  // Filtered Settlements
  const venueSettlements = useMemo<SettlementBatchItem[]>(() => {
    return [];
  }, [currentVenue]);

  // Filtered Support Tickets
  const venueSupportTickets = useMemo<SupportTicketItem[]>(() => {
    return [];
  }, [currentVenue]);

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
  const getSlotStatus = (courtId: string, hourIndex: number): { status: 'AVAILABLE' | 'HOLD' | 'UNAVAILABLE'; bookingCode?: string; bookedBy?: string } => {
    const key = `${courtId}-${selectedSlotDate}-${hourIndex}`;
    if (slotsState[key]) {
      return { status: slotsState[key] };
    }
    if (hourIndex === 12 || hourIndex === 13 || hourIndex === 14) {
      return { status: 'UNAVAILABLE', bookingCode: `IBS-${9001 + hourIndex}`, bookedBy: 'Confirmed Player' };
    }
    if (hourIndex === 11) {
      return { status: 'HOLD', bookingCode: 'HOLD-10M', bookedBy: 'Payment in Progress' };
    }
    return { status: 'AVAILABLE' };
  };

  const handleToggleTimelineSlot = (courtId: string, hourIndex: number) => {
    const key = `${courtId}-${selectedSlotDate}-${hourIndex}`;
    const current = getSlotStatus(courtId, hourIndex).status;
    const next = current === 'AVAILABLE' ? 'HOLD' : current === 'HOLD' ? 'UNAVAILABLE' : 'AVAILABLE';
    setSlotsState((prev) => ({ ...prev, [key]: next }));
    const label = next === 'AVAILABLE' ? 'Open for Bookings' : next === 'HOLD' ? 'Placed on Hold' : 'Marked Blocked';
    setStatusNotification(`Slot at ${timelineHours[hourIndex]} ${label}`);
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

          {/* Quick Status Changers & Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
            {/* Set Active Button */}
            {!isLiveActive && (
              <button
                type="button"
                onClick={() => handleUpdateVenueStatus('ACTIVE')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Power className="h-3.5 w-3.5" />
                <span>Set Live Active</span>
              </button>
            )}

            {/* Set Inactive Button */}
            {!isInactive && (
              <button
                type="button"
                onClick={() => handleUpdateVenueStatus('INACTIVE')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Power className="h-3.5 w-3.5" />
                <span>Set Inactive</span>
              </button>
            )}

            {/* Set Maintenance Button */}
            {!isMaintenance && (
              <button
                type="button"
                onClick={() => handleUpdateVenueStatus('MAINTENANCE')}
                className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Wrench className="h-3.5 w-3.5" />
                <span>Maintenance</span>
              </button>
            )}

            {currentVenue.venue_location_name && (
              <a
                href={currentVenue.venue_location_name}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 transition-all"
                title="Open GPS Google Map"
              >
                <span>GPS Map</span>
                <ExternalLink className="h-3 w-3 text-slate-400" />
              </a>
            )}
          </div>
        </div>
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
            { key: 'slots', label: 'Slots Timeline', icon: Clock, count: 'Live' },
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
                    <a
                      href={googleMapsLinkInput}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs shrink-0 self-start sm:self-auto"
                    >
                      <MapPin className="h-3 w-3 text-[#F94001]" />
                      <span>Open Map ↗</span>
                    </a>
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
                    <button
                      type="button"
                      onClick={handleOpenNewCourtRequestModal}
                      className="text-xs font-bold text-[#F94001] hover:underline cursor-pointer"
                    >
                      + Request Court Extension
                    </button>
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

              {/* 2. Bank Settlement Account Card */}
              <div className="bg-[#071322] text-white rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.03]">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
                      <Landmark className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-[11px] font-black text-white tracking-wider uppercase">Settlement Bank</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                    <CheckCircle2 className="h-2.5 w-2.5" /> Verified
                  </span>
                </div>

                <div className="p-4 space-y-3 text-xs">
                  {/* Bank & Account Number */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider">Bank Name</span>
                      <h4 className="text-lg font-black text-white mt-0.5 tracking-tight">
                        {currentVenue?.bank?.bank_name || 'HDFC Bank'}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider">Account</span>
                      <p className="text-sm font-mono font-bold text-white mt-0.5 tracking-wider">
                        {currentVenue?.bank?.account_number_masked || '•••• 4512'}
                      </p>
                    </div>
                  </div>

                  {/* IFSC & Account Type */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                      <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider block">IFSC Code</span>
                      <span className="font-mono font-bold text-white text-xs mt-0.5 block">
                        {currentVenue?.bank?.ifsc_code || 'HDFC0000123'}
                      </span>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                      <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider block">Branch / UPI</span>
                      <span className="font-bold text-white text-xs mt-0.5 block truncate">
                        {currentVenue?.bank?.branch_name || currentVenue?.bank?.upi_id || 'Coimbatore Branch'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                    <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider block">Account Holder</span>
                    <span className="font-bold text-white text-xs mt-0.5 block">
                      {currentVenue?.bank?.account_holder_name || ownerFullName || currentVenue?.name}
                    </span>
                  </div>

                  {/* Cheque / Passbook View */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-[11px] font-semibold text-slate-300">Bank Verification Status</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                      Penny Drop Success
                    </span>
                  </div>

                  {/* Payout note */}
                  <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium pt-1">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
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

              {/* Action: Request Court Extension */}
              <button
                type="button"
                onClick={handleOpenNewCourtRequestModal}
                className="px-3.5 py-1.5 rounded-xl bg-[#F94001] hover:bg-[#E03800] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98"
                title="Submit court addition extension request"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>+ Request Court Extension</span>
              </button>
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
              {/* Requests KPI Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs">
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block">Total Requests</span>
                  <span className="text-lg font-black text-slate-900 font-mono mt-0.5 block">{venueCourtRequests.length}</span>
                </div>
                <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-200/80 shadow-2xs">
                  <span className="text-[10px] font-mono text-amber-700 font-bold uppercase block">1st Submitted</span>
                  <span className="text-lg font-black text-amber-800 font-mono mt-0.5 block">
                    {venueCourtRequests.filter((r) => r.status === 'SUBMITTED').length}
                  </span>
                </div>
                <div className="bg-purple-50/60 rounded-xl p-3 border border-purple-200/80 shadow-2xs">
                  <span className="text-[10px] font-mono text-purple-700 font-bold uppercase block">Resubmitted</span>
                  <span className="text-lg font-black text-purple-800 font-mono mt-0.5 block">
                    {venueCourtRequests.filter((r) => r.status === 'RESUBMITTED').length}
                  </span>
                </div>
                <div className="bg-emerald-50/60 rounded-xl p-3 border border-emerald-200/80 shadow-2xs">
                  <span className="text-[10px] font-mono text-emerald-700 font-bold uppercase block">Approved</span>
                  <span className="text-lg font-black text-emerald-800 font-mono mt-0.5 block">
                    {venueCourtRequests.filter((r) => r.status === 'APPROVED').length}
                  </span>
                </div>
                <div className="bg-rose-50/60 rounded-xl p-3 border border-rose-200/80 shadow-2xs">
                  <span className="text-[10px] font-mono text-rose-700 font-bold uppercase block">Rejected</span>
                  <span className="text-lg font-black text-rose-800 font-mono mt-0.5 block">
                    {venueCourtRequests.filter((r) => r.status === 'REJECTED').length}
                  </span>
                </div>
              </div>

              {/* Empty State */}
              {venueCourtRequests.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/90 p-10 text-center space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#F94001] mx-auto">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900">No Court Extension Requests For This Venue</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    When the venue owner requests additional courts or pitches, they appear here for verification, approval, or feedback.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenNewCourtRequestModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F94001] hover:bg-[#E03800] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>+ Submit Court Request</span>
                  </button>
                </div>
              ) : (
                /* Request Cards Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {venueCourtRequests.map((req) => {
                    const isRejected = req.status === 'REJECTED';
                    const isApproved = req.status === 'APPROVED';
                    const isPending = req.status === 'SUBMITTED' || req.status === 'RESUBMITTED';

                    return (
                      <div
                        key={req.id}
                        className={`bg-white rounded-2xl border p-5 shadow-2xs space-y-4 transition-all hover:shadow-md ${
                          isRejected
                            ? 'border-rose-300 ring-1 ring-rose-200/50'
                            : isApproved
                            ? 'border-emerald-200 bg-emerald-50/10'
                            : req.status === 'RESUBMITTED'
                            ? 'border-purple-200 ring-1 ring-purple-100'
                            : 'border-slate-200/90'
                        }`}
                      >
                        {/* Header: ID, Round, Sport, Status */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-slate-500">{req.id}</span>
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                                Round {req.submission_round || 1}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-orange-50 text-[#F94001] border border-orange-200/60 text-[10px] font-extrabold uppercase">
                                {req.sport}
                              </span>
                            </div>
                            <h3 className="text-base font-black text-slate-900 tracking-tight mt-1">
                              {req.court_name}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">{req.display_name}</p>
                          </div>

                          {/* Status Badge */}
                          <div>
                            {req.status === 'SUBMITTED' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                                <Clock className="h-3 w-3 text-amber-600" />
                                <span>1st Submitted</span>
                              </span>
                            )}
                            {req.status === 'RESUBMITTED' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200/80">
                                <RotateCcw className="h-3 w-3 text-purple-600" />
                                <span>Resubmitted (R{req.submission_round})</span>
                              </span>
                            )}
                            {req.status === 'APPROVED' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                <span>Approved</span>
                              </span>
                            )}
                            {req.status === 'REJECTED' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200/80">
                                <X className="h-3 w-3 text-rose-600" />
                                <span>Rejected</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Specs Grid */}
                        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70 grid grid-cols-2 gap-2.5 text-xs">
                          <div>
                            <span className="text-slate-400 text-[10px] font-mono block uppercase">Ground Type</span>
                            <span className="font-bold text-slate-800">
                              {req.same_physical_sports ? 'Shared Physical Ground' : 'Separate Ground'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] font-mono block uppercase">Standard Rate</span>
                            <span className="font-mono font-bold text-slate-900">₹{req.regular_price}/hr</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] font-mono block uppercase">Peak Rate</span>
                            <span className="font-mono font-bold text-[#F94001]">
                              ₹{req.peak_price}/hr ({req.peak_hours_start}–{req.peak_hours_end})
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] font-mono block uppercase">Weekend Rate</span>
                            <span className="font-mono font-bold text-amber-800">
                              ₹{req.weekend_price}/hr ({req.peak_days?.join(', ') || 'Fri-Sun'})
                            </span>
                          </div>
                        </div>

                        {/* Cancellation Policy Chip */}
                        <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-2 text-xs flex items-center justify-between text-emerald-800">
                          <div className="flex items-center gap-1.5 font-medium">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>Cancel up to {req.cancellation_policy_hours}h notice</span>
                          </div>
                          <span className="font-bold font-mono">{req.refund_percentage}% Refund</span>
                        </div>

                        {/* IF REJECTED: Distinct Rejection Feedback Banner */}
                        {isRejected && (
                          <div className="bg-rose-50/90 border border-rose-200 rounded-xl p-3 space-y-1.5 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                                <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                                <span>Rejection Reason: {req.rejection_reason || 'Pricing/spec adjustment requested'}</span>
                              </span>
                            </div>
                            {req.rejection_note && (
                              <p className="text-xs text-rose-800 font-medium bg-white/80 p-2 rounded-lg border border-rose-100">
                                &ldquo;{req.rejection_note}&rdquo;
                              </p>
                            )}
                            <p className="text-[11px] text-rose-700">
                              Owner can click <strong>&ldquo;Fix &amp; Resubmit&rdquo;</strong> to change pricing/hours and resubmit for Round {(req.submission_round || 1) + 1} review.
                            </p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setSelectedCourtRequestForDrawer(req)}
                            className="flex-1 h-8.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-500" />
                            <span>Review in Slide Bar</span>
                          </button>

                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApproveCourtRequest(req)}
                                className="h-8.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
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
                                className="h-8.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                                title="Reject with Feedback Notes"
                              >
                                <X className="h-3.5 w-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {isRejected && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditCourtRequestModal(req)}
                              className="h-8.5 px-3 rounded-xl bg-[#F94001] hover:bg-[#E03800] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>Fix &amp; Resubmit</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmReqId(req.id)}
                            className="h-8.5 w-8.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                            title="Delete Request"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
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
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search booking code, customer name, phone, sport..."
                value={bookingSearchQuery}
                onChange={(e) => setBookingSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none focus:bg-white focus:border-[#F94001]"
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

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto shrink-0">
              {['ALL', 'CONFIRMED', 'IN_PLAY', 'COMPLETED', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setBookingStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    bookingStatusFilter === st
                      ? 'bg-slate-900 text-white font-bold shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Bookings Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/90 bg-slate-50/75 text-slate-500 font-semibold tracking-wider text-[10px] uppercase select-none">
                    <th className="py-2.5 px-3">Booking ID</th>
                    <th className="py-2.5 px-3">Customer ID & Name</th>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Sport & Court</th>
                    <th className="py-2.5 px-3">Slot Time & Duration</th>
                    <th className="py-2.5 px-3">Payable Amt</th>
                    <th className="py-2.5 px-3">Venue Share</th>
                    <th className="py-2.5 px-3">Platform Fee</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
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
                          <span className="text-[10px] text-slate-400 block">{b.sport}</span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="font-mono text-slate-700">{b.time_slot}</span>
                          <span className="text-[10px] text-slate-400 block">{b.duration_minutes / 60} hrs</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-black text-slate-900 whitespace-nowrap">
                          ₹{b.total_amount}
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
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedBookingForDrawer(b)}
                            className="h-7 px-2.5 rounded-lg border border-slate-200 hover:border-[#F94001] hover:text-[#F94001] bg-white text-slate-600 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            title="Inspect Booking Details"
                          >
                            <Eye className="h-3 w-3" />
                            <span>Inspect</span>
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
          TAB 5: STAFF (SCREENSHOT 2 EXACT REPLICA)
      ======================================================== */}
      {activeTab === 'staff' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#F94001]" />
                <h2 className="text-sm font-bold text-slate-900">Arena Staff &amp; Team Directory</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Authorized ground personnel, shift managers &amp; role hierarchy &bull; View-only (Managed via Venue Owner App)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                {staffMembers.filter((s) => s.status === 'ACTIVE').length} Active
              </span>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                {staffMembers.filter((s) => s.status === 'INACTIVE').length} Inactive
              </span>
            </div>
          </div>

          {/* Minimal View-Only Staff Table */}
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
                      <th className="py-3 px-4">Staff ID</th>
                      <th className="py-3 px-4">Member Name</th>
                      <th className="py-3 px-4">Designation / Role</th>
                      <th className="py-3 px-4">Mobile Number</th>
                      <th className="py-3 px-4">Email Address</th>
                      <th className="py-3 px-4 text-right">Account Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {staffMembers.map((staff) => {
                      const isStaffActive = staff.status === 'ACTIVE';
                      const initials =
                        staff.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .substring(0, 2)
                          .toUpperCase() || 'ST';

                      return (
                        <tr key={staff.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Staff ID */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2 py-1 rounded-md bg-slate-100 font-mono font-bold text-slate-700 text-[11px] border border-slate-200/60">
                              {staff.id}
                            </span>
                          </td>

                          {/* Name + Mini Avatar */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-[#091522] text-white font-black text-xs flex items-center justify-center shrink-0 tracking-tight shadow-2xs">
                                {initials}
                              </div>
                              <div>
                                <div className="font-extrabold text-slate-900 text-xs">{staff.name}</div>
                                {staff.shift_hours && (
                                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                    <Clock className="h-2.5 w-2.5" />
                                    <span>{staff.shift_hours}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-block px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/70 font-bold text-[10px] tracking-wider uppercase font-mono">
                              {staff.role}
                            </span>
                          </td>

                          {/* Mobile Number */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-[#F94001] shrink-0" />
                              <a
                                href={`tel:${staff.mobile_number}`}
                                className="text-slate-800 hover:text-[#F94001] font-semibold text-xs transition-colors font-sans"
                              >
                                {staff.mobile_number}
                              </a>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <a
                                href={`mailto:${staff.email}`}
                                className="text-slate-600 hover:text-slate-900 font-medium text-xs truncate max-w-[200px] block transition-colors"
                                title={staff.email}
                              >
                                {staff.email}
                              </a>
                            </div>
                          </td>

                          {/* Status Active / Inactive */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
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
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}


            {/* Table Footer */}
            <div className="p-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>Showing {staffMembers.length} authorized staff accounts for this venue</span>
              <span className="flex items-center gap-1 text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Staff accounts and access permissions are managed via Venue Partner App
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 6: SLOTS TIMELINE (INTERACTIVE GRID, DATE PICKER, AVAILABLE, HOLD, UNAVAILABLE)
      ======================================================== */}
      {activeTab === 'slots' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Controls Bar: Date Selector & Court Filter */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date:</span>
              <div className="flex items-center gap-1">
                {[
                  { key: 'today', label: 'Today (9 Mar)' },
                  { key: 'tomorrow', label: 'Tomorrow (10 Mar)' },
                  { key: 'day_after', label: 'Wed (11 Mar)' },
                ].map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setSelectedSlotDate(d.key as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      selectedSlotDate === d.key
                        ? 'bg-slate-900 text-white font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-emerald-500" />
                <span className="text-slate-700">Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-amber-400" />
                <span className="text-slate-700">Hold (10m)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-slate-800" />
                <span className="text-slate-700">Booked / Unavailable</span>
              </div>
            </div>
          </div>

          {/* Timeline Matrix Grid */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden p-4 space-y-4">
            <p className="text-xs text-slate-500">
              Click on any slot cell to toggle states: <strong className="text-emerald-700">Available</strong> &rarr; <strong className="text-amber-600">Hold</strong> &rarr; <strong className="text-slate-900">Unavailable / Blocked</strong>.
            </p>

            <div className="space-y-4">
              {courtsList.map((court) => (
                <div key={court.id} className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{court.name}</span>
                      <span className="text-[10px] font-bold text-[#F94001] bg-[#FFF1EC] px-2 py-0.5 rounded">
                        {court.sport}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">Rate: ₹{court.base_hourly_rate}/hr</span>
                  </div>

                  {/* Hourly slot buttons */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-8 gap-1.5">
                    {timelineHours.map((hourStr, hourIdx) => {
                      const slot = getSlotStatus(court.id, hourIdx);
                      return (
                        <button
                          key={hourStr}
                          type="button"
                          onClick={() => handleToggleTimelineSlot(court.id, hourIdx)}
                          className={`p-2 rounded-lg text-[11px] font-semibold text-center transition-all cursor-pointer border ${
                            slot.status === 'AVAILABLE'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : slot.status === 'HOLD'
                              ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                              : 'bg-slate-900 text-white border-slate-800 hover:bg-slate-800'
                          }`}
                          title={`Click to toggle: ${hourStr} (${slot.status})`}
                        >
                          <div className="font-mono">{hourStr}</div>
                          <div className="text-[9px] font-bold opacity-80 mt-0.5">
                            {slot.status === 'AVAILABLE'
                              ? '₹' + court.base_hourly_rate
                              : slot.status === 'HOLD'
                              ? 'HOLD'
                              : 'BOOKED'}
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
                    <th className="py-2.5 px-3">Customer ID & Name</th>
                    <th className="py-2.5 px-3">Booking Code</th>
                    <th className="py-2.5 px-3">Slot Schedule</th>
                    <th className="py-2.5 px-3">Original Paid</th>
                    <th className="py-2.5 px-3">Cancelled At</th>
                    <th className="py-2.5 px-3">Refund Amount</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {venueCancellations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Zero cancellations logged for this arena.
                      </td>
                    </tr>
                  ) : (
                    venueCancellations.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{b.customer_name}</div>
                          <div className="text-[10px] font-mono text-slate-400">{b.customer_id}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#F94001]">{b.booking_code}</td>
                        <td className="py-2.5 px-3">
                          <div>{b.booking_date}</div>
                          <div className="text-[10px] font-mono text-slate-400">{b.time_slot}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">₹{b.total_amount}</td>
                        <td className="py-2.5 px-3 text-slate-600">{b.cancelled_at || '2026-03-04 16:30'}</td>
                        <td className="py-2.5 px-3 font-mono font-black text-emerald-700">
                          ₹{b.refund_amount || b.total_amount}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-[200px] truncate" title={b.cancellation_reason}>
                          {b.cancellation_reason || 'Inclement weather cancellation'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            {b.refund_status || 'WALLET_CREDITED'}
                          </span>
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
          TAB 8: SUPPORT (SUPPORT REQUESTS, DISPUTES, TICKETS)
      ======================================================== */}
      {activeTab === 'support' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Partner Helpdesk & Support Requests</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tickets, maintenance complaints, customer dispute resolutions, and payout inquiries for this arena.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
              {venueSupportTickets.length} Tickets Found
            </span>
          </div>

          <div className="space-y-3">
            {venueSupportTickets.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                <LifeBuoy className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700 text-xs">No active support requests</p>
                <p className="text-[11px] text-slate-400 mt-0.5">All partner operational tickets for this venue are resolved.</p>
              </div>
            ) : (
              venueSupportTickets.map((ticket) => (
                <div key={ticket.id} className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-2.5">
                  <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {ticket.ticket_number}
                        </span>
                        <h3 className="font-bold text-xs text-slate-900">{ticket.subject}</h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ticket.priority === 'URGENT'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : ticket.priority === 'HIGH'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {ticket.priority} PRIORITY
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Filed by <strong className="text-slate-700">{ticket.created_person_name}</strong> ({ticket.contact_number}) on {ticket.created_at}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        ticket.status === 'OPEN'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : ticket.status === 'IN_PROGRESS'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {ticket.description}
                  </p>

                  {ticket.related_booking_code && (
                    <div className="text-[11px] text-slate-500 font-mono">
                      Associated Booking Code: <strong className="text-[#F94001]">{ticket.related_booking_code}</strong>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          SLIDE-OVER DRAWER FOR BOOKING DETAILS (INSIDE BOOKINGS TAB)
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
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#F94001] uppercase tracking-wider font-bold">
                  Booking Receipt
                </span>
                <h3 className="text-lg font-black font-display mt-0.5">{selectedBookingForDrawer.booking_code}</h3>
                <p className="text-xs text-slate-300 mt-0.5">{selectedBookingForDrawer.court_name} &bull; {selectedBookingForDrawer.sport}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookingForDrawer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-medium">Player Details</span>
                <p className="font-bold text-sm text-slate-900">{selectedBookingForDrawer.customer_name}</p>
                <p className="text-slate-600 font-mono">{selectedBookingForDrawer.customer_phone}</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-medium">Slot Times</span>
                <div className="flex items-center justify-between">
                  <span>Date:</span>
                  <strong className="text-slate-800">{selectedBookingForDrawer.booking_date}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Time Slot:</span>
                  <strong className="text-slate-800">{selectedBookingForDrawer.time_slot}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Duration:</span>
                  <strong className="text-slate-800">{selectedBookingForDrawer.duration_minutes} Minutes</strong>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-medium">Financial Split</span>
                <div className="flex items-center justify-between text-xs">
                  <span>Payable Amount:</span>
                  <strong className="text-white font-mono">₹{selectedBookingForDrawer.total_amount}</strong>
                </div>
                <div className="flex items-center justify-between text-xs text-emerald-400">
                  <span>Venue Share (90%):</span>
                  <strong className="font-mono">₹{selectedBookingForDrawer.venue_share}</strong>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Platform Commission (10%):</span>
                  <strong className="font-mono">₹{selectedBookingForDrawer.platform_fee}</strong>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedBookingForDrawer(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                Close Drawer
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
            className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/70">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-slate-200 font-mono text-[11px] font-bold text-slate-800">
                    {selectedCourtRequestForDrawer.id}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#F94001]/10 text-[#F94001] font-mono text-[10px] font-bold">
                    {selectedCourtRequestForDrawer.venue_id}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                    Round {selectedCourtRequestForDrawer.submission_round || 1}
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight mt-1">
                  {selectedCourtRequestForDrawer.court_name}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedCourtRequestForDrawer.venue_name} &bull; {selectedCourtRequestForDrawer.owner_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCourtRequestForDrawer(null);
                  setIsDrawerRejectOpen(false);
                  setDrawerActionError(null);
                }}
                className="h-8 w-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Status Header Box */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block">Current Workflow State</span>
                  <span className="text-sm font-black text-slate-900 mt-0.5 block">
                    {selectedCourtRequestForDrawer.status === 'SUBMITTED' && '1st Round Initial Submission'}
                    {selectedCourtRequestForDrawer.status === 'RESUBMITTED' && `Resubmitted (Round ${selectedCourtRequestForDrawer.submission_round})`}
                    {selectedCourtRequestForDrawer.status === 'APPROVED' && 'Approved & Added to Arena'}
                    {selectedCourtRequestForDrawer.status === 'REJECTED' && 'Rejected (Awaiting Owner Revisions)'}
                  </span>
                </div>
                <div>
                  {selectedCourtRequestForDrawer.status === 'SUBMITTED' && (
                    <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                      SUBMITTED
                    </span>
                  )}
                  {selectedCourtRequestForDrawer.status === 'RESUBMITTED' && (
                    <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-800 font-bold border border-purple-200">
                      RESUBMITTED
                    </span>
                  )}
                  {selectedCourtRequestForDrawer.status === 'APPROVED' && (
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                      APPROVED
                    </span>
                  )}
                  {selectedCourtRequestForDrawer.status === 'REJECTED' && (
                    <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-800 font-bold border border-rose-200">
                      REJECTED
                    </span>
                  )}
                </div>
              </div>

              {/* If Rejected: Show Rejection Callout */}
              {selectedCourtRequestForDrawer.status === 'REJECTED' && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>Rejection Reason: {selectedCourtRequestForDrawer.rejection_reason}</span>
                  </div>
                  {selectedCourtRequestForDrawer.rejection_note && (
                    <p className="bg-white/90 p-3 rounded-xl border border-rose-100 text-rose-900 font-medium">
                      &ldquo;{selectedCourtRequestForDrawer.rejection_note}&rdquo;
                    </p>
                  )}
                </div>
              )}

              {/* Court Specifications Summary */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4.5 space-y-3 shadow-2xs">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                  Configured Specifications
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 text-[10px] font-mono block">SPORT</span>
                    <span className="font-bold text-slate-900">{selectedCourtRequestForDrawer.sport}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] font-mono block">GROUND SHARING</span>
                    <span className="font-bold text-slate-900">
                      {selectedCourtRequestForDrawer.same_physical_sports ? 'Shares Physical Ground' : 'Separate Ground'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] font-mono block">MIN DURATION</span>
                    <span className="font-bold text-slate-900">{selectedCourtRequestForDrawer.min_booking_duration_label}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] font-mono block">STANDARD RATE</span>
                    <span className="font-mono font-bold text-slate-900">₹{selectedCourtRequestForDrawer.regular_price}/hr</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] font-mono block">PEAK HOURS &amp; RATE</span>
                    <span className="font-mono font-bold text-[#F94001]">
                      ₹{selectedCourtRequestForDrawer.peak_price}/hr ({selectedCourtRequestForDrawer.peak_hours_start}–{selectedCourtRequestForDrawer.peak_hours_end})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] font-mono block">WEEKEND RATE</span>
                    <span className="font-mono font-bold text-amber-700">
                      ₹{selectedCourtRequestForDrawer.weekend_price}/hr ({selectedCourtRequestForDrawer.peak_days?.join(', ') || 'Fri-Sun'})
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 text-[10px] font-mono block">CANCELLATION &amp; REFUND</span>
                    <span className="font-medium text-emerald-800">
                      Cancel up to {selectedCourtRequestForDrawer.cancellation_policy_hours}h notice with {selectedCourtRequestForDrawer.refund_percentage}% refund
                    </span>
                  </div>
                </div>
              </div>

              {/* Multi-Round Submission Timeline History */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4.5 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-slate-500" />
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                    Multi-Round Submission Timeline
                  </h4>
                </div>

                <div className="space-y-3 relative pl-4 border-l-2 border-slate-200">
                  {selectedCourtRequestForDrawer.history?.map((h, idx) => (
                    <div key={idx} className="relative space-y-1">
                      <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-slate-400 border-2 border-white" />
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">
                          Round {h.round}: {h.action}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {h.timestamp ? new Date(h.timestamp).toLocaleDateString('en-IN') : 'Recent'}
                        </span>
                      </div>
                      <p className="text-slate-600 font-medium text-[11px]">{h.note}</p>
                    </div>
                  ))}
                </div>
              </div>

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
                      className="text-rose-600 text-xs font-bold hover:underline"
                    >
                      Cancel
                    </button>
                  </div>

                  <div>
                    <label className="block text-rose-900 font-bold mb-1 text-xs">Rejection Reason Code</label>
                    <select
                      value={drawerRejectionReason}
                      onChange={(e) => setDrawerRejectionReason(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl border border-rose-300 bg-white text-slate-900 text-xs font-bold outline-none"
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

            {/* Drawer Bottom Sticky Action Bar */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0 flex items-center gap-2">
              {(selectedCourtRequestForDrawer.status === 'SUBMITTED' || selectedCourtRequestForDrawer.status === 'RESUBMITTED') && (
                <>
                  <button
                    type="button"
                    onClick={() => handleApproveCourtRequest(selectedCourtRequestForDrawer)}
                    className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Check className="h-4 w-4" />
                    <span>Approve Court &amp; Add to Arena</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDrawerRejectOpen(true)}
                    className="h-10 px-4 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                    <span>Reject with Notes</span>
                  </button>
                </>
              )}

              {selectedCourtRequestForDrawer.status === 'REJECTED' && (
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEditCourtRequestModal(selectedCourtRequestForDrawer);
                    setSelectedCourtRequestForDrawer(null);
                  }}
                  className="flex-1 h-10 rounded-xl bg-[#F94001] hover:bg-[#E03800] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Edit &amp; Resubmit Request (Round {(selectedCourtRequestForDrawer.submission_round || 1) + 1})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setDeleteConfirmReqId(selectedCourtRequestForDrawer.id)}
                className="h-10 px-3 rounded-xl border border-slate-300 hover:bg-rose-50 hover:border-rose-300 text-slate-500 hover:text-rose-600 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer shrink-0"
                title="Delete Court Request"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
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
    </div>
  );
}
