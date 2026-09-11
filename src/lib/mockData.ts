// Comprehensive Realistic Mock Data for iBookSports Super Admin Suite

export interface VenueDetail {
  id: string;
  venue_name: string;
  tagline: string;
  name: string; // Owner Name
  mobile_number: number;
  email: string;
  venue_location_name: string; // Maps URL
  address: string;
  state: string;
  district: string;
  pincode: string;
  sports: string;
  sports_list: string[];
  courts: number;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'MAINTENANCE';
  rating: number;
  total_reviews: number;
  opening_time: string;
  closing_time: string;
  created_at?: string;
  
  // Staff & Management Contact Details
  staff_name?: string;
  staff_contact?: string;
  staff_role?: string;

  // Today's Live Performance Metrics
  today_bookings_count?: number;
  today_booking_revenue?: number;
  today_slot_occupancy_percent?: number;

  // Owner & KYC Details
  owner: {
    full_name: string;
    phone: string;
    email: string;
    pan_number: string;
    pan_status: 'VERIFIED' | 'PENDING';
    aadhaar_masked: string;
    aadhaar_status: 'VERIFIED' | 'PENDING';
    gstin: string;
    gstin_status: 'ACTIVE' | 'UNREGISTERED';
    registered_address: string;
    kyc_verified_date: string;
  };

  // Bank & Payout Details
  bank: {
    account_holder_name: string;
    bank_name: string;
    account_number_masked: string;
    ifsc_code: string;
    branch_name: string;
    upi_id: string;
    verification_status: 'VERIFIED' | 'PENDING';
    penny_drop_status: 'SUCCESS' | 'FAILED';
    last_payout_date: string;
  };

  // Courts
  court_list: {
    id: string;
    name: string;
    display_name?: string;
    sport: string;
    surface: string; // e.g. 'FIFA Pro 50mm Astroturf', 'BWF Synthetic Mat'
    court_type: 'OUTDOOR' | 'INDOOR' | 'COVERED ROOF';
    environment?: 'OUTDOOR' | 'INDOOR' | 'COVERED ROOF';
    dimensions: string;
    lighting: string; // e.g. '400 Lux Commercial LED'
    base_hourly_rate: number;
    regular_price?: number;
    peak_price?: number;
    peak_days?: string[];
    min_booking_time_mins?: number;
    operating_hours?: string;
    cancellation_policy_hours?: number;
    refund_percentage?: number;
    status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  }[];

  // Staff Directory
  staff_list?: {
    id: string;
    name: string;
    mobile_number: string;
    role: string;
    email: string;
    shift_hours: string;
    status: 'ACTIVE' | 'INACTIVE';
  }[];

  // Slots
  slot_rules: {
    slot_duration_minutes: number;
    peak_morning_hours: string;
    peak_morning_price: number;
    regular_day_hours: string;
    regular_day_price: number;
    prime_night_hours: string;
    prime_night_price: number;
    weekend_surge_percent: number;
    instant_booking_enabled: boolean;
  };

  // Financial Stats
  financials: {
    gross_volume: number;
    platform_commission: number;
    unsettled_balance: number;
    total_settled: number;
  };

  // Amenities
  amenities: string[];
}

export interface CustomerItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  district?: string;
  state?: string;
  registered_at: string;
  tier: 'PLATINUM' | 'GOLD' | 'SILVER' | 'REGULAR';
  status: 'ACTIVE' | 'SUSPENDED';
  total_bookings: number;
  total_spent: number;
  total_hours_spent: number;
  wallet_balance?: number;
  preferred_sports: string[];
  favorite_venues: string[];
  cancellation_count: number;
  recent_booking?: {
    booking_code: string;
    venue_name: string;
    court_name: string;
    sport: string;
    booking_date: string;
    time_slot: string;
    total_amount: number;
    booking_status: 'CONFIRMED' | 'IN_PLAY' | 'COMPLETED' | 'CANCELLED';
    payment_status: 'PAID' | 'REFUNDED' | 'FAILED';
  };
}

export interface BookingItem {
  id: string;
  booking_code: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  venue_id: string;
  venue_name: string;
  court_id: string;
  court_name: string;
  sport: string;
  booking_date: string;
  time_slot: string;
  duration_minutes: number;
  total_amount: number;
  platform_fee: number;
  venue_share: number;
  payment_status: 'PAID' | 'PARTIAL_PAID' | 'ADVANCE_PAID' | 'REFUNDED' | 'FAILED';
  booking_status: 'CONFIRMED' | 'IN_PLAY' | 'COMPLETED' | 'CANCELLED';
  payment_method: 'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'NET_BANKING' | 'WALLET' | string;
  transaction_id: string;
  created_at: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  refund_amount?: number;
  refund_status?: 'REFUNDED' | 'PROCESSING' | 'WALLET_CREDITED' | 'NOT_APPLICABLE';
  refund_utr?: string;
  advance_amount?: number;
  balance_amount?: number;
  due_mode?: 'CASH' | 'ONLINE';
}

export type PaymentStatusType = 'FULLY_PAID' | 'ADVANCE_PAID' | 'REFUNDED' | 'FAILED';
export type PaymentMethodCategory = 'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'NET_BANKING' | 'CASH';

export interface PaymentTransactionItem {
  id: string;
  txn_id: string;
  gateway_order_id: string;
  gateway_payment_id: string;
  booking_code: string;
  booking_status?: 'CONFIRMED' | 'IN_PLAY' | 'COMPLETED' | 'CANCELLED';
  venue_name: string;
  court_name?: string;
  sport?: string;
  customer_name: string;
  customer_phone: string;
  
  // Amounts & Advance Breakdown (iBookSports 50% Advance Policy)
  total_booking_amount: number; // Full booking amount e.g. 2800
  gross_amount: number; // Received payment amount e.g. 1400 (50% advance) or 2800 (100% full)
  received_amount: number; // Synonym for gross_amount for clarity
  balance_amount: number; // Remaining due amount e.g. 1400 or 0
  advance_percentage?: number; // 50 or 100
  payment_status: PaymentStatusType; // 'FULLY_PAID' | 'ADVANCE_PAID' | 'REFUNDED' | 'FAILED'
  
  // Financial Splits
  gateway_fee: number;
  platform_commission: number;
  tax_gst: number;
  net_venue_payout: number;
  
  // Method & Gateway
  payment_type: PaymentMethodCategory;
  payment_method: string;
  gateway: 'RAZORPAY' | 'PHONEPE' | 'CASHFREE' | 'DIRECT_VENUE';
  status: 'SUCCESS' | 'REFUNDED' | 'FAILED' | 'PROCESSING'; // Gateway status
  timestamp: string;
  
  // Invoice & Payment Link Details
  invoice_number?: string;
  payment_link?: string;
  balance_payment_link?: string;
  slot_time?: string;
  booking_date?: string;
  due_mode?: 'CASH' | 'ONLINE';
}

export interface SettlementBookingItem {
  booking_code: string;
  slot_date: string;
  slot_time: string;
  court_name: string;
  sport: string;
  actual_court_price: number;
  online_advance_paid: number;
  cash_collected_at_venue: number;
  payment_mode: 'ONLINE_FULL' | 'ONLINE_ADVANCE_PLUS_CASH' | 'ONLINE_ADVANCE_PLUS_ONLINE';
  platform_fee: number;
  platform_fee_gst: number;
  net_venue_share: number;
}

export interface SettlementBatchItem {
  id: string;
  batch_number: string;
  venue_id: string;
  venue_name: string;
  owner_name: string;
  bank_name: string;
  account_number_masked: string;
  ifsc_code: string;
  period_start: string;
  period_end: string;
  settlement_date: string; // T+2 settlement date, e.g. '2026-03-08'
  cycle_month: string; // e.g. '2026-03'
  cycle_year: number; // e.g. 2026
  t_plus_days: number; // 2
  bookings_count: number;
  
  // Amounts
  actual_court_price_total: number; // Total actual court slot price
  gross_booking_amount: number; // Synonym
  online_advance_held: number; // Collected online by iBookSports
  cash_collected_at_venue: number; // Cash received directly by venue owner
  platform_commission_deducted: number; // 10% platform fee
  platform_fee_gst: number; // 18% GST on platform fee
  tds_deducted: number; // 1% TDS Sec 194O
  net_payable: number; // Final net amount transferred to owner's bank
  
  status: 'SETTLED' | 'PROCESSING' | 'PENDING_APPROVAL';
  utr_number?: string;
  settled_at?: string;
  
  // Itemized bookings in this batch
  itemized_bookings?: SettlementBookingItem[];
}

export interface SupportTicketItem {
  id: string;
  ticket_number: string; // Support ID, e.g. SUP-2026-101
  category: 'PAYMENT' | 'BOOKING' | 'TECHNICAL' | 'SETTLEMENTS' | 'GENERAL' | 'OTHERS';
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  subject: string;
  description: string;
  related_booking_code?: string; // Optional booking ID
  attachment_url?: string; // Optional attachment link / file
  attachment_name?: string; // Optional attachment file name
  venue_id: string; // Venue ID
  venue_name: string; // Venue Name
  created_person_name: string; // Created person name
  contact_number: string; // Contact phone number
  created_at: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  resolution_notes?: string; // Resolution notes entered when resolving
  resolved_at?: string;
  resolved_by?: string;
  source?: 'VENUE_APP' | 'CUSTOMER_APP' | 'ADMIN_PORTAL';
  conversation: {
    sender: 'VENUE' | 'CUSTOMER' | 'ADMIN';
    sender_name: string;
    message: string;
    timestamp: string;
  }[];
}

// --------------------------------------------------------------------------
// MOCK DATA INSTANCES
// --------------------------------------------------------------------------

export const INITIAL_VENUES: VenueDetail[] = [
  {
    id: 'ven_1001',
    venue_name: 'Sky Sports Arena & Box Turf',
    tagline: 'Coimbatore Premier 7v7 Astroturf & Floodlit Cricket Arena',
    name: 'Karthik Rajan',
    mobile_number: 9876543210,
    email: 'karthik@skysportsarena.com',
    venue_location_name: 'https://www.google.com/maps?q=11.0283,77.0012',
    address: 'Survey 142, Avinashi Road, Near CIT College, Peelamedu',
    district: 'Coimbatore',
    state: 'Tamil Nadu',
    pincode: '641014',
    sports: 'FOOTBALL, CRICKET, BADMINTON',
    sports_list: ['Football', 'Box Cricket', 'Badminton'],
    courts: 4,
    status: 'ACTIVE',
    rating: 4.8,
    total_reviews: 342,
    opening_time: '05:00 AM',
    closing_time: '11:30 PM',
    created_at: '2025-01-15T10:00:00Z',
    staff_name: 'Suresh Kumar',
    staff_contact: '+91 94432 11220',
    staff_role: 'Operations & Turf Manager',
    today_bookings_count: 14,
    today_booking_revenue: 18200,
    today_slot_occupancy_percent: 88,
    owner: {
      full_name: 'Karthik Rajan',
      phone: '+91 98765 43210',
      email: 'karthik@skysportsarena.com',
      pan_number: 'ABCDE1234F',
      pan_status: 'VERIFIED',
      aadhaar_masked: 'XXXX-XXXX-4891',
      aadhaar_status: 'VERIFIED',
      gstin: '33AABCS1429L1Z5',
      gstin_status: 'ACTIVE',
      registered_address: '14/B, Avinashi Road, Peelamedu, Coimbatore 641014',
      kyc_verified_date: '2025-01-18',
    },
    bank: {
      account_holder_name: 'Sky Sports Arena Ventures LLP',
      bank_name: 'HDFC Bank Ltd',
      account_number_masked: '•••• •••• 9012',
      ifsc_code: 'HDFC0001248',
      branch_name: 'Peelamedu Branch, Coimbatore',
      upi_id: 'skysportsarena@okhdfcbank',
      verification_status: 'VERIFIED',
      penny_drop_status: 'SUCCESS',
      last_payout_date: '2026-03-05',
    },
    court_list: [
      {
        id: 'crt_101',
        name: 'Turf A (Camp Nou 7v7)',
        sport: 'Football',
        surface: 'FIFA Quality Pro 50mm Monofilament Astroturf',
        court_type: 'OUTDOOR',
        dimensions: '110ft x 65ft',
        lighting: '450 Lux Philips Arena Floodlights',
        base_hourly_rate: 1400,
        status: 'ACTIVE',
      },
      {
        id: 'crt_102',
        name: 'Turf B (Bernabeu 5v5)',
        sport: 'Football',
        surface: '40mm High-Density Rubber Infill Turf',
        court_type: 'OUTDOOR',
        dimensions: '85ft x 50ft',
        lighting: '350 Lux Floodlights',
        base_hourly_rate: 1000,
        status: 'ACTIVE',
      },
      {
        id: 'crt_103',
        name: 'Pitch C (Thunder Box Cricket)',
        sport: 'Box Cricket',
        surface: 'Enclosed Nylon Turf with Full Top Netting',
        court_type: 'COVERED ROOF',
        dimensions: '90ft x 45ft',
        lighting: '400 Lux Shadowless LED',
        base_hourly_rate: 1200,
        status: 'ACTIVE',
      },
      {
        id: 'crt_104',
        name: 'Court 1 (Indoor Badminton)',
        sport: 'Badminton',
        surface: 'BWF Grade 1 Synthetic Vinyl Mat over Teakwood',
        court_type: 'INDOOR',
        dimensions: '44ft x 20ft',
        lighting: '500 Lux Anti-Glare LED',
        base_hourly_rate: 450,
        status: 'ACTIVE',
      },
    ],
    slot_rules: {
      slot_duration_minutes: 60,
      peak_morning_hours: '06:00 AM - 09:00 AM',
      peak_morning_price: 1300,
      regular_day_hours: '09:00 AM - 05:00 PM',
      regular_day_price: 1000,
      prime_night_hours: '05:00 PM - 11:30 PM',
      prime_night_price: 1600,
      weekend_surge_percent: 15,
      instant_booking_enabled: true,
    },
    financials: {
      gross_volume: 384000,
      platform_commission: 38400,
      unsettled_balance: 42500,
      total_settled: 303100,
    },
    amenities: [
      'Free Parking (50 Cars)',
      'Changing Rooms (M/F)',
      'Hot Showers',
      'Drinking Water Station',
      'Sports Café & Snack Bar',
      'First Aid Kit',
      'CCTV Surveillance',
      'Wi-Fi (Free)',
      'Equipment Rental',
      'Floodlights',
    ],
  },
  {
    id: 'ven_1002',
    venue_name: 'Green Field Sports Park',
    tagline: 'Chennai Largest Multi-Sport Complex & Badminton Hub',
    name: 'Vignesh Sundaram',
    mobile_number: 9845123456,
    email: 'vignesh@greenfieldsportspark.in',
    venue_location_name: 'https://www.google.com/maps?q=13.0827,80.2707',
    address: 'Plot 88, 200 Feet Radial Road, Thoraipakkam, OMR',
    district: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600097',
    sports: 'BADMINTON, FOOTBALL, PICKLEBALL',
    sports_list: ['Badminton', 'Football', 'Pickleball'],
    courts: 6,
    status: 'ACTIVE',
    rating: 4.9,
    total_reviews: 512,
    opening_time: '05:30 AM',
    closing_time: '12:00 AM',
    created_at: '2025-02-01T08:30:00Z',
    staff_name: 'Ramesh Sundaram',
    staff_contact: '+91 98410 88771',
    staff_role: 'Operations Lead & Duty Incharge',
    today_bookings_count: 22,
    today_booking_revenue: 28600,
    today_slot_occupancy_percent: 92,
    owner: {
      full_name: 'Vignesh Sundaram',
      phone: '+91 98451 23456',
      email: 'vignesh@greenfieldsportspark.in',
      pan_number: 'FGHIJ5678K',
      pan_status: 'VERIFIED',
      aadhaar_masked: 'XXXX-XXXX-9124',
      aadhaar_status: 'VERIFIED',
      gstin: '33AACCB8942Q1Z9',
      gstin_status: 'ACTIVE',
      registered_address: 'Plot 88, 200 Feet Radial Road, Thoraipakkam, Chennai 600097',
      kyc_verified_date: '2025-02-04',
    },
    bank: {
      account_holder_name: 'Green Field Sports Enterprises',
      bank_name: 'ICICI Bank',
      account_number_masked: '•••• •••• 4421',
      ifsc_code: 'ICIC0000412',
      branch_name: 'OMR Thoraipakkam Branch, Chennai',
      upi_id: 'greenfieldomr@icici',
      verification_status: 'VERIFIED',
      penny_drop_status: 'SUCCESS',
      last_payout_date: '2026-03-06',
    },
    court_list: [
      {
        id: 'crt_201',
        name: 'Badminton Court 1',
        sport: 'Badminton',
        surface: 'BWF Certified 5mm Mat',
        court_type: 'INDOOR',
        dimensions: '44ft x 20ft',
        lighting: '450 Lux LED',
        base_hourly_rate: 500,
        status: 'ACTIVE',
      },
      {
        id: 'crt_202',
        name: 'Badminton Court 2',
        sport: 'Badminton',
        surface: 'BWF Certified 5mm Mat',
        court_type: 'INDOOR',
        dimensions: '44ft x 20ft',
        lighting: '450 Lux LED',
        base_hourly_rate: 500,
        status: 'ACTIVE',
      },
      {
        id: 'crt_203',
        name: 'Badminton Court 3',
        sport: 'Badminton',
        surface: 'BWF Certified 5mm Mat',
        court_type: 'INDOOR',
        dimensions: '44ft x 20ft',
        lighting: '450 Lux LED',
        base_hourly_rate: 500,
        status: 'ACTIVE',
      },
      {
        id: 'crt_204',
        name: 'Pickleball Pro Court A',
        sport: 'Pickleball',
        surface: 'Cushioned Acrylic Surface USAPA Spec',
        court_type: 'COVERED ROOF',
        dimensions: '44ft x 20ft',
        lighting: '400 Lux LED',
        base_hourly_rate: 650,
        status: 'ACTIVE',
      },
      {
        id: 'crt_205',
        name: 'OMR Grand Turf 7v7',
        sport: 'Football',
        surface: 'FIFA Pro 55mm Turf with Coconut Fibre Infill',
        court_type: 'OUTDOOR',
        dimensions: '120ft x 70ft',
        lighting: '500 Lux Arena Floodlights',
        base_hourly_rate: 1800,
        status: 'ACTIVE',
      },
      {
        id: 'crt_206',
        name: 'OMR Mini Turf 5v5',
        sport: 'Football',
        surface: '40mm Monofilament',
        court_type: 'OUTDOOR',
        dimensions: '80ft x 45ft',
        lighting: '350 Lux Floodlights',
        base_hourly_rate: 1100,
        status: 'ACTIVE',
      },
    ],
    slot_rules: {
      slot_duration_minutes: 60,
      peak_morning_hours: '06:00 AM - 09:30 AM',
      peak_morning_price: 1500,
      regular_day_hours: '09:30 AM - 04:30 PM',
      regular_day_price: 1100,
      prime_night_hours: '04:30 PM - 12:00 AM',
      prime_night_price: 1900,
      weekend_surge_percent: 20,
      instant_booking_enabled: true,
    },
    financials: {
      gross_volume: 612000,
      platform_commission: 61200,
      unsettled_balance: 78200,
      total_settled: 472600,
    },
    amenities: [
      'Covered Parking (80 Cars)',
      'AC Changing Rooms (M/F)',
      'Hot & Cold Showers',
      'RO Drinking Water',
      'Sports Lounge & Café',
      'Physiotherapy Room',
      'CCTV Surveillance',
      'Wi-Fi (Free)',
      'Racket & Shoe Rental',
      'Pro Shop',
      'Floodlights',
      'Air-Conditioned Courts',
    ],
  },
  {
    id: 'ven_1003',
    venue_name: 'Apex Arena & Sports Club',
    tagline: 'Bengaluru Premier Rooftop Turf & Floodlit Cricket Arena',
    name: 'Ananya Sharma',
    mobile_number: 9711223344,
    email: 'ananya@apexarena.com',
    venue_location_name: 'https://www.google.com/maps?q=12.9716,77.5946',
    address: '7th Floor, Phoenix Mall Terrace, Whitefield',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    pincode: '560066',
    sports: 'CRICKET, FOOTBALL, TENNIS',
    sports_list: ['Box Cricket', 'Football', 'Tennis'],
    courts: 3,
    status: 'ACTIVE',
    rating: 4.7,
    total_reviews: 289,
    opening_time: '06:00 AM',
    closing_time: '11:00 PM',
    created_at: '2025-02-10T11:15:00Z',
    staff_name: 'Deepak Gowda',
    staff_contact: '+91 99801 33442',
    staff_role: 'Duty Manager & Senior Coach',
    today_bookings_count: 16,
    today_booking_revenue: 21800,
    today_slot_occupancy_percent: 84,
    owner: {
      full_name: 'Ananya Sharma',
      phone: '+91 97112 23344',
      email: 'ananya@apexarena.com',
      pan_number: 'KLMNO9012P',
      pan_status: 'VERIFIED',
      aadhaar_masked: 'XXXX-XXXX-3341',
      aadhaar_status: 'VERIFIED',
      gstin: '29AAAPL4412R1Z3',
      gstin_status: 'ACTIVE',
      registered_address: 'Flat 402, Prestige Palms, Whitefield, Bengaluru 560066',
      kyc_verified_date: '2025-02-14',
    },
    bank: {
      account_holder_name: 'Apex Arena Sports Private Limited',
      bank_name: 'Axis Bank',
      account_number_masked: '•••• •••• 6789',
      ifsc_code: 'UTIB0000843',
      branch_name: 'Whitefield Main Road, Bengaluru',
      upi_id: 'apexarena@axisbank',
      verification_status: 'VERIFIED',
      penny_drop_status: 'SUCCESS',
      last_payout_date: '2026-03-04',
    },
    court_list: [
      {
        id: 'crt_301',
        name: 'Pitch 1 (Rooftop Box Cricket Arena)',
        sport: 'Box Cricket',
        surface: 'Professional Green ShockPad Turf with Net Enclosure',
        court_type: 'COVERED ROOF',
        dimensions: '95ft x 50ft',
        lighting: '450 Lux LED',
        base_hourly_rate: 1300,
        status: 'ACTIVE',
      },
      {
        id: 'crt_302',
        name: 'Turf 2 (Skyline 5v5 Football)',
        sport: 'Football',
        surface: 'FIFA Quality 45mm Turf',
        court_type: 'OUTDOOR',
        dimensions: '85ft x 45ft',
        lighting: '400 Lux Floodlights',
        base_hourly_rate: 1200,
        status: 'ACTIVE',
      },
      {
        id: 'crt_303',
        name: 'Court 3 (Synthetic Lawn Tennis)',
        sport: 'Tennis',
        surface: 'ITF Level 3 Hardcourt Cushion',
        court_type: 'OUTDOOR',
        dimensions: '78ft x 36ft',
        lighting: '500 Lux Championship Grade',
        base_hourly_rate: 800,
        status: 'ACTIVE',
      },
    ],
    slot_rules: {
      slot_duration_minutes: 60,
      peak_morning_hours: '06:00 AM - 09:00 AM',
      peak_morning_price: 1200,
      regular_day_hours: '09:00 AM - 05:00 PM',
      regular_day_price: 900,
      prime_night_hours: '05:00 PM - 11:00 PM',
      prime_night_price: 1500,
      weekend_surge_percent: 25,
      instant_booking_enabled: true,
    },
    financials: {
      gross_volume: 420000,
      platform_commission: 42000,
      unsettled_balance: 31000,
      total_settled: 347000,
    },
    amenities: [
      'Rooftop Open Air Setting',
      'Valet Parking',
      'Changing Rooms',
      'Showers',
      'Hydration Station',
      'Sky Lounge & Bar',
      'CCTV Surveillance',
      'Wi-Fi (Free)',
      'Equipment Rental',
      'Floodlights',
    ],
  },
  {
    id: 'ven_1004',
    venue_name: 'Kochi United Turf & Arena',
    tagline: 'Kochi Premier FIFA Certified 7v7 Football Turf & Badminton Hub',
    name: 'Fahad Aliyar',
    mobile_number: 9745122334,
    email: 'fahad@kochiunitedturf.in',
    venue_location_name: 'https://www.google.com/maps?q=10.0159,76.3419',
    address: 'Near Infopark Expressway, Kakkanad, Kochi',
    district: 'Ernakulam',
    state: 'Kerala',
    pincode: '682030',
    sports: 'FOOTBALL, BADMINTON',
    sports_list: ['Football', 'Badminton'],
    courts: 4,
    status: 'ACTIVE',
    rating: 4.9,
    total_reviews: 418,
    opening_time: '05:00 AM',
    closing_time: '12:00 AM',
    created_at: '2025-02-15T09:00:00Z',
    staff_name: 'Praveen Nair',
    staff_contact: '+91 98470 55432',
    staff_role: 'Arena Operations Incharge',
    today_bookings_count: 14,
    today_booking_revenue: 17800,
    today_slot_occupancy_percent: 82,
    owner: {
      full_name: 'Fahad Aliyar',
      phone: '+91 97451 22334',
      email: 'fahad@kochiunitedturf.in',
      pan_number: 'KLMNA5432B',
      pan_status: 'VERIFIED',
      aadhaar_masked: 'XXXX-XXXX-6612',
      aadhaar_status: 'VERIFIED',
      gstin: '32AAAFK5432M1Z2',
      gstin_status: 'ACTIVE',
      registered_address: 'Door 12/445, Seaport-Airport Road, Kakkanad, Kochi 682030',
      kyc_verified_date: '2025-02-18',
    },
    bank: {
      account_holder_name: 'Kochi United Arena LLP',
      bank_name: 'Federal Bank Ltd',
      account_number_masked: '•••• •••• 8821',
      ifsc_code: 'FDRL0001342',
      branch_name: 'Kakkanad Branch, Kochi',
      upi_id: 'kochiunited@federal',
      verification_status: 'VERIFIED',
      penny_drop_status: 'SUCCESS',
      last_payout_date: '2026-03-05',
    },
    court_list: [
      {
        id: 'crt_401',
        name: 'Malabar Turf 7v7',
        sport: 'Football',
        surface: 'FIFA Pro 50mm Astroturf',
        court_type: 'OUTDOOR',
        dimensions: '115ft x 65ft',
        lighting: '450 Lux LED Floodlights',
        base_hourly_rate: 1500,
        status: 'ACTIVE',
      },
      {
        id: 'crt_402',
        name: 'Thunder Turf 5v5',
        sport: 'Football',
        surface: '45mm Monofilament Turf',
        court_type: 'OUTDOOR',
        dimensions: '80ft x 45ft',
        lighting: '350 Lux Floodlights',
        base_hourly_rate: 1100,
        status: 'ACTIVE',
      },
      {
        id: 'crt_403',
        name: 'Badminton Court 1',
        sport: 'Badminton',
        surface: 'BWF Grade 1 Synthetic Vinyl Mat',
        court_type: 'INDOOR',
        dimensions: '44ft x 20ft',
        lighting: '500 Lux Anti-Glare LED',
        base_hourly_rate: 450,
        status: 'ACTIVE',
      },
      {
        id: 'crt_404',
        name: 'Badminton Court 2',
        sport: 'Badminton',
        surface: 'BWF Grade 1 Synthetic Vinyl Mat',
        court_type: 'INDOOR',
        dimensions: '44ft x 20ft',
        lighting: '500 Lux Anti-Glare LED',
        base_hourly_rate: 450,
        status: 'ACTIVE',
      },
    ],
    slot_rules: {
      slot_duration_minutes: 60,
      peak_morning_hours: '05:30 AM - 09:00 AM',
      peak_morning_price: 1300,
      regular_day_hours: '09:00 AM - 05:00 PM',
      regular_day_price: 1000,
      prime_night_hours: '05:00 PM - 12:00 AM',
      prime_night_price: 1600,
      weekend_surge_percent: 20,
      instant_booking_enabled: true,
    },
    financials: {
      gross_volume: 345000,
      platform_commission: 34500,
      unsettled_balance: 38200,
      total_settled: 272300,
    },
    amenities: [
      'Covered Parking',
      'Air-Conditioned Lounge',
      'Showers & Lockers',
      'Purified Water Station',
      'Juice Bar & Café',
      'Floodlights',
      'Equipment Rental',
      'Wi-Fi (Free)',
    ],
  },
  {
    id: 'ven_1005',
    venue_name: 'Hyderabad Smashers & Turf Hub',
    tagline: 'High-Tech Floodlit Box Cricket, Badminton & Pickleball Center',
    name: 'Venkat Rao',
    mobile_number: 9123456789,
    email: 'venkat@smashershub.com',
    venue_location_name: 'https://www.google.com/maps?q=17.4401,78.3489',
    address: 'Financial District, Behind Waverock SEZ, Gachibowli',
    district: 'Hyderabad',
    state: 'Telangana',
    pincode: '500032',
    sports: 'CRICKET, BADMINTON, PICKLEBALL',
    sports_list: ['Box Cricket', 'Badminton', 'Pickleball'],
    courts: 5,
    status: 'ACTIVE',
    rating: 4.8,
    total_reviews: 388,
    opening_time: '05:00 AM',
    closing_time: '01:00 AM',
    created_at: '2025-02-20T10:30:00Z',
    staff_name: 'Kiran Reddy',
    staff_contact: '+91 90001 77654',
    staff_role: 'Senior Turf Supervisor',
    today_bookings_count: 20,
    today_booking_revenue: 26400,
    today_slot_occupancy_percent: 91,
    owner: {
      full_name: 'Venkat Rao',
      phone: '+91 91234 56789',
      email: 'venkat@smashershub.com',
      pan_number: 'TYUIO9876Q',
      pan_status: 'VERIFIED',
      aadhaar_masked: 'XXXX-XXXX-7723',
      aadhaar_status: 'VERIFIED',
      gstin: '36AAAPV8912T1Z6',
      gstin_status: 'ACTIVE',
      registered_address: 'Plot 45, Nanakramguda, Financial District, Hyderabad 500032',
      kyc_verified_date: '2025-02-22',
    },
    bank: {
      account_holder_name: 'Smashers Sports Hub Private Limited',
      bank_name: 'State Bank of India',
      account_number_masked: '•••• •••• 9934',
      ifsc_code: 'SBIN0011663',
      branch_name: 'Gachibowli Branch, Hyderabad',
      upi_id: 'smashershub@sbi',
      verification_status: 'VERIFIED',
      penny_drop_status: 'SUCCESS',
      last_payout_date: '2026-03-06',
    },
    court_list: [
      {
        id: 'crt_501',
        name: 'Gachibowli Box Pitch 1',
        sport: 'Box Cricket',
        surface: 'Professional ShockPad Turf with Ceiling Net',
        court_type: 'COVERED ROOF',
        dimensions: '90ft x 45ft',
        lighting: '450 Lux LED',
        base_hourly_rate: 1300,
        status: 'ACTIVE',
      },
      {
        id: 'crt_502',
        name: 'Gachibowli Box Pitch 2',
        sport: 'Box Cricket',
        surface: 'Professional ShockPad Turf with Ceiling Net',
        court_type: 'COVERED ROOF',
        dimensions: '90ft x 45ft',
        lighting: '450 Lux LED',
        base_hourly_rate: 1300,
        status: 'ACTIVE',
      },
      {
        id: 'crt_503',
        name: 'Badminton Arena A',
        sport: 'Badminton',
        surface: 'BWF Certified 5mm Mat',
        court_type: 'INDOOR',
        dimensions: '44ft x 20ft',
        lighting: '500 Lux Anti-Glare',
        base_hourly_rate: 550,
        status: 'ACTIVE',
      },
      {
        id: 'crt_504',
        name: 'Badminton Arena B',
        sport: 'Badminton',
        surface: 'BWF Certified 5mm Mat',
        court_type: 'INDOOR',
        dimensions: '44ft x 20ft',
        lighting: '500 Lux Anti-Glare',
        base_hourly_rate: 550,
        status: 'ACTIVE',
      },
      {
        id: 'crt_505',
        name: 'Pickleball Court Pro',
        sport: 'Pickleball',
        surface: 'USAPA Cushioned Acrylic Court',
        court_type: 'COVERED ROOF',
        dimensions: '44ft x 20ft',
        lighting: '400 Lux Commercial LED',
        base_hourly_rate: 650,
        status: 'ACTIVE',
      },
    ],
    slot_rules: {
      slot_duration_minutes: 60,
      peak_morning_hours: '06:00 AM - 09:30 AM',
      peak_morning_price: 1400,
      regular_day_hours: '09:30 AM - 05:00 PM',
      regular_day_price: 1100,
      prime_night_hours: '05:00 PM - 01:00 AM',
      prime_night_price: 1700,
      weekend_surge_percent: 25,
      instant_booking_enabled: true,
    },
    financials: {
      gross_volume: 520000,
      platform_commission: 52000,
      unsettled_balance: 62000,
      total_settled: 406000,
    },
    amenities: [
      'Valet Parking (100 Cars)',
      'AC Lounge with Live Streaming',
      'Separate Changing Rooms & Showers',
      'Sports Energy Bar',
      'RO Drinking Water',
      'Pro Racket Stringing & Shop',
      'CCTV & Security',
    ],
  },
  {
    id: 'ven_1006',
    venue_name: 'Mumbai Champions Turf & Arena',
    tagline: 'Andheri Flagship Rooftop Multi-Sport Turf & Tennis Arena',
    name: 'Rohit Sawant',
    mobile_number: 9819988776,
    email: 'rohit@mumbaichampionsturf.com',
    venue_location_name: 'https://www.google.com/maps?q=19.1363,72.8277',
    address: 'New Link Road, Adjacent to Infinity Mall, Andheri West',
    district: 'Mumbai Suburban',
    state: 'Maharashtra',
    pincode: '400053',
    sports: 'FOOTBALL, CRICKET, TENNIS',
    sports_list: ['Football', 'Box Cricket', 'Tennis'],
    courts: 4,
    status: 'MAINTENANCE',
    rating: 4.9,
    total_reviews: 620,
    opening_time: '06:00 AM',
    closing_time: '01:30 AM',
    created_at: '2025-01-20T12:00:00Z',
    staff_name: 'Amol Deshmukh',
    staff_contact: '+91 98200 44556',
    staff_role: 'Operations Head & Turf Manager',
    today_bookings_count: 18,
    today_booking_revenue: 27900,
    today_slot_occupancy_percent: 94,
    owner: {
      full_name: 'Rohit Sawant',
      phone: '+91 98199 88776',
      email: 'rohit@mumbaichampionsturf.com',
      pan_number: 'ZXCVB1234N',
      pan_status: 'VERIFIED',
      aadhaar_masked: 'XXXX-XXXX-2244',
      aadhaar_status: 'VERIFIED',
      gstin: '27AAACR7891P1Z8',
      gstin_status: 'ACTIVE',
      registered_address: 'Suite 401, Crystal Plaza, New Link Road, Andheri West, Mumbai 400053',
      kyc_verified_date: '2025-01-25',
    },
    bank: {
      account_holder_name: 'Champions Turf Mumbai Private Limited',
      bank_name: 'Kotak Mahindra Bank',
      account_number_masked: '•••• •••• 5519',
      ifsc_code: 'KKBK0000654',
      branch_name: 'Andheri West Branch, Mumbai',
      upi_id: 'championsturf@kotak',
      verification_status: 'VERIFIED',
      penny_drop_status: 'SUCCESS',
      last_payout_date: '2026-03-05',
    },
    court_list: [
      {
        id: 'crt_601',
        name: 'Wembley Turf 7v7',
        sport: 'Football',
        surface: 'FIFA Pro Monofilament 55mm Turf',
        court_type: 'OUTDOOR',
        dimensions: '110ft x 65ft',
        lighting: '500 Lux Arena Floodlights',
        base_hourly_rate: 1900,
        status: 'ACTIVE',
      },
      {
        id: 'crt_602',
        name: 'Maracana Turf 5v5',
        sport: 'Football',
        surface: 'High Density 40mm Astroturf',
        court_type: 'OUTDOOR',
        dimensions: '80ft x 45ft',
        lighting: '400 Lux Floodlights',
        base_hourly_rate: 1300,
        status: 'ACTIVE',
      },
      {
        id: 'crt_603',
        name: 'Wankhede Box Cricket Pitch',
        sport: 'Box Cricket',
        surface: 'Cushioned ShockPad Turf with Full Net Enclosure',
        court_type: 'COVERED ROOF',
        dimensions: '90ft x 45ft',
        lighting: '450 Lux LED',
        base_hourly_rate: 1400,
        status: 'ACTIVE',
      },
      {
        id: 'crt_604',
        name: 'Wimbledon Hardcourt Tennis',
        sport: 'Tennis',
        surface: 'ITF Level 3 Acrylic Cushion Hardcourt',
        court_type: 'OUTDOOR',
        dimensions: '78ft x 36ft',
        lighting: '500 Lux Commercial Stadium Grade',
        base_hourly_rate: 950,
        status: 'ACTIVE',
      },
    ],
    slot_rules: {
      slot_duration_minutes: 60,
      peak_morning_hours: '06:00 AM - 09:30 AM',
      peak_morning_price: 1600,
      regular_day_hours: '09:30 AM - 05:00 PM',
      regular_day_price: 1200,
      prime_night_hours: '05:00 PM - 01:30 AM',
      prime_night_price: 2100,
      weekend_surge_percent: 25,
      instant_booking_enabled: true,
    },
    financials: {
      gross_volume: 780000,
      platform_commission: 78000,
      unsettled_balance: 94000,
      total_settled: 608000,
    },
    amenities: [
      'Rooftop Panoramic View',
      'Valet Parking Service',
      'Air-Conditioned Locker Rooms & Showers',
      'Live Match Screening Lounge',
      'Hydration & Juice Bar',
      'Equipment & Sneaker Rental',
      'Floodlights',
      'Wi-Fi (Free)',
    ],
  },
  {
    id: 'ven_1007',
    venue_name: 'Madurai Royal Sports Turf',
    tagline: 'South Tamil Nadu Premier 7v7 Football & Cricket Ground',
    name: 'Saravanan Muthu',
    mobile_number: 9842165432,
    email: 'saravanan@madurairoyalturf.in',
    venue_location_name: 'https://www.google.com/maps?q=9.9252,78.1198',
    address: '80 Feet Road, Near Mattuthavani Bus Terminus, KK Nagar',
    district: 'Madurai',
    state: 'Tamil Nadu',
    pincode: '625020',
    sports: 'FOOTBALL, CRICKET',
    sports_list: ['Football', 'Box Cricket'],
    courts: 3,
    status: 'INACTIVE',
    rating: 4.7,
    total_reviews: 245,
    opening_time: '05:30 AM',
    closing_time: '11:00 PM',
    created_at: '2025-02-25T11:00:00Z',
    staff_name: 'Muthuvel P',
    staff_contact: '+91 94860 12345',
    staff_role: 'Operations & Duty Incharge',
    today_bookings_count: 10,
    today_booking_revenue: 12200,
    today_slot_occupancy_percent: 76,
    owner: {
      full_name: 'Saravanan Muthu',
      phone: '+91 98421 65432',
      email: 'saravanan@madurairoyalturf.in',
      pan_number: 'QWERT6789Y',
      pan_status: 'VERIFIED',
      aadhaar_masked: 'XXXX-XXXX-5511',
      aadhaar_status: 'VERIFIED',
      gstin: '33AABCM9012N1Z4',
      gstin_status: 'ACTIVE',
      registered_address: '42, KK Nagar West Cross, Madurai 625020',
      kyc_verified_date: '2025-02-28',
    },
    bank: {
      account_holder_name: 'Royal Sports Madurai LLP',
      bank_name: 'Canara Bank',
      account_number_masked: '•••• •••• 3341',
      ifsc_code: 'CNRB0001890',
      branch_name: 'KK Nagar Branch, Madurai',
      upi_id: 'royalturf@canara',
      verification_status: 'VERIFIED',
      penny_drop_status: 'SUCCESS',
      last_payout_date: '2026-03-04',
    },
    court_list: [
      {
        id: 'crt_701',
        name: 'Meenakshi Arena 7v7',
        sport: 'Football',
        surface: 'FIFA Standard 50mm Astroturf',
        court_type: 'OUTDOOR',
        dimensions: '105ft x 60ft',
        lighting: '400 Lux Floodlights',
        base_hourly_rate: 1200,
        status: 'ACTIVE',
      },
      {
        id: 'crt_702',
        name: 'Pandya Pitch (Box Cricket)',
        sport: 'Box Cricket',
        surface: 'Enclosed Nylon Turf with Full Netting',
        court_type: 'COVERED ROOF',
        dimensions: '85ft x 45ft',
        lighting: '350 Lux LED',
        base_hourly_rate: 1000,
        status: 'ACTIVE',
      },
      {
        id: 'crt_703',
        name: 'Sprint Turf 5v5',
        sport: 'Football',
        surface: '40mm High Durability Turf',
        court_type: 'OUTDOOR',
        dimensions: '75ft x 42ft',
        lighting: '350 Lux LED',
        base_hourly_rate: 900,
        status: 'ACTIVE',
      },
    ],
    slot_rules: {
      slot_duration_minutes: 60,
      peak_morning_hours: '05:30 AM - 09:00 AM',
      peak_morning_price: 1100,
      regular_day_hours: '09:00 AM - 05:00 PM',
      regular_day_price: 900,
      prime_night_hours: '05:00 PM - 11:00 PM',
      prime_night_price: 1400,
      weekend_surge_percent: 15,
      instant_booking_enabled: true,
    },
    financials: {
      gross_volume: 240000,
      platform_commission: 24000,
      unsettled_balance: 28500,
      total_settled: 187500,
    },
    amenities: [
      'Two-Wheeler & Car Parking',
      'Changing Rooms',
      'Showers',
      'Cold Drinking Water',
      'Floodlights',
      'Equipment Rental',
    ],
  },
  {
    id: 'ven_1008',
    venue_name: 'Capital Sports Village & Arena',
    tagline: 'NCR Flagship Floodlit Tennis, Football & Basketball Complex',
    name: 'Vikramaditya Oberoi',
    mobile_number: 9910088990,
    email: 'vikram@capitalsportsvillage.com',
    venue_location_name: 'https://www.google.com/maps?q=28.4595,77.0266',
    address: 'Golf Course Extension Road, Sector 62, Gurugram',
    district: 'Gurugram',
    state: 'Delhi NCR',
    pincode: '122005',
    sports: 'TENNIS, FOOTBALL, BASKETBALL',
    sports_list: ['Tennis', 'Football', 'Basketball'],
    courts: 5,
    status: 'ACTIVE',
    rating: 4.9,
    total_reviews: 495,
    opening_time: '05:00 AM',
    closing_time: '12:00 AM',
    created_at: '2025-01-10T08:00:00Z',
    staff_name: 'Harpreet Singh',
    staff_contact: '+91 98110 34567',
    staff_role: 'Operations & Sports Director',
    today_bookings_count: 17,
    today_booking_revenue: 24200,
    today_slot_occupancy_percent: 87,
    owner: {
      full_name: 'Vikramaditya Oberoi',
      phone: '+91 99100 88990',
      email: 'vikram@capitalsportsvillage.com',
      pan_number: 'POIUY5432L',
      pan_status: 'VERIFIED',
      aadhaar_masked: 'XXXX-XXXX-8899',
      aadhaar_status: 'VERIFIED',
      gstin: '06AAACV1234K1Z9',
      gstin_status: 'ACTIVE',
      registered_address: 'Estate House 12, Golf Course Ext Road, Sector 62, Gurugram 122005',
      kyc_verified_date: '2025-01-15',
    },
    bank: {
      account_holder_name: 'Capital Sports Village India Private Limited',
      bank_name: 'Standard Chartered Bank',
      account_number_masked: '•••• •••• 7120',
      ifsc_code: 'SCBL0036001',
      branch_name: 'DLF Cyber City Branch, Gurugram',
      upi_id: 'capitalsports@scb',
      verification_status: 'VERIFIED',
      penny_drop_status: 'SUCCESS',
      last_payout_date: '2026-03-05',
    },
    court_list: [
      {
        id: 'crt_801',
        name: 'Centre Court Tennis 1',
        sport: 'Tennis',
        surface: 'ITF Level 4 Grand Slam Cushion Acrylic',
        court_type: 'OUTDOOR',
        dimensions: '78ft x 36ft',
        lighting: '600 Lux Tournament Grade LED',
        base_hourly_rate: 1100,
        status: 'ACTIVE',
      },
      {
        id: 'crt_802',
        name: 'Court Tennis 2',
        sport: 'Tennis',
        surface: 'ITF Level 4 Grand Slam Cushion Acrylic',
        court_type: 'OUTDOOR',
        dimensions: '78ft x 36ft',
        lighting: '500 Lux Tournament Grade LED',
        base_hourly_rate: 1000,
        status: 'ACTIVE',
      },
      {
        id: 'crt_803',
        name: 'Capital 7v7 Astroturf',
        sport: 'Football',
        surface: 'FIFA Quality Pro 50mm Infill Turf',
        court_type: 'OUTDOOR',
        dimensions: '110ft x 65ft',
        lighting: '450 Lux LED Floodlights',
        base_hourly_rate: 1800,
        status: 'ACTIVE',
      },
      {
        id: 'crt_804',
        name: 'Arena Basketball Court',
        sport: 'Basketball',
        surface: 'FIBA Approved Cushioned Polyurethane Surface',
        court_type: 'COVERED ROOF',
        dimensions: '94ft x 50ft',
        lighting: '500 Lux LED',
        base_hourly_rate: 900,
        status: 'ACTIVE',
      },
      {
        id: 'crt_805',
        name: 'Mini Turf 5v5',
        sport: 'Football',
        surface: '40mm Monofilament Turf',
        court_type: 'OUTDOOR',
        dimensions: '80ft x 45ft',
        lighting: '350 Lux Floodlights',
        base_hourly_rate: 1200,
        status: 'ACTIVE',
      },
    ],
    slot_rules: {
      slot_duration_minutes: 60,
      peak_morning_hours: '06:00 AM - 09:30 AM',
      peak_morning_price: 1500,
      regular_day_hours: '09:30 AM - 05:00 PM',
      regular_day_price: 1100,
      prime_night_hours: '05:00 PM - 12:00 AM',
      prime_night_price: 1900,
      weekend_surge_percent: 20,
      instant_booking_enabled: true,
    },
    financials: {
      gross_volume: 640000,
      platform_commission: 64000,
      unsettled_balance: 71000,
      total_settled: 505000,
    },
    amenities: [
      'Valet & Covered Parking (120 Cars)',
      'Clubhouse & Sports Café',
      'Luxury Locker Rooms & Showers',
      'Physiotherapy & Recovery Zone',
      'Floodlit Courts',
      'Pro Equipment Store',
      'High-Speed Wi-Fi',
      '24/7 Security & CCTV',
    ],
  },
];

export const INITIAL_CUSTOMERS: CustomerItem[] = [
  {
    id: 'cust_501',
    name: 'Rahul Krishnan',
    phone: '+91 98401 23456',
    email: 'rahul.krishnan@gmail.com',
    city: 'Chennai',
    district: 'Chennai',
    state: 'Tamil Nadu',
    registered_at: '2025-03-12',
    tier: 'PLATINUM',
    status: 'ACTIVE',
    total_bookings: 28,
    total_hours_spent: 36,
    total_spent: 42500,
    preferred_sports: ['Football', 'Badminton'],
    favorite_venues: ['Green Field Sports Park', 'Sky Sports Arena'],
    cancellation_count: 1,
    recent_booking: {
      booking_code: 'IBS-2603-9001',
      venue_name: 'Sky Sports Arena & Box Turf',
      court_name: 'Turf A (Camp Nou 7v7)',
      sport: 'Football',
      booking_date: '2026-03-08',
      time_slot: '07:00 PM - 08:00 PM',
      total_amount: 1600,
      booking_status: 'IN_PLAY',
      payment_status: 'PAID',
    },
  },
  {
    id: 'cust_502',
    name: 'Dinesh Karthik',
    phone: '+91 97910 87654',
    email: 'dk.sportsfan@yahoo.com',
    city: 'Coimbatore',
    district: 'Coimbatore',
    state: 'Tamil Nadu',
    registered_at: '2025-04-05',
    tier: 'GOLD',
    status: 'ACTIVE',
    total_bookings: 19,
    total_hours_spent: 26,
    total_spent: 26800,
    preferred_sports: ['Box Cricket', 'Football'],
    favorite_venues: ['Sky Sports Arena & Box Turf'],
    cancellation_count: 0,
    recent_booking: {
      booking_code: 'IBS-2603-9002',
      venue_name: 'Sky Sports Arena & Box Turf',
      court_name: 'Pitch C (Thunder Box Cricket)',
      sport: 'Box Cricket',
      booking_date: '2026-03-08',
      time_slot: '08:00 PM - 10:00 PM',
      total_amount: 2800,
      booking_status: 'CONFIRMED',
      payment_status: 'PAID',
    },
  },
  {
    id: 'cust_503',
    name: 'Pooja Sundaram',
    phone: '+91 98845 11223',
    email: 'pooja.sundaram@techcorp.in',
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    registered_at: '2025-05-19',
    tier: 'GOLD',
    status: 'ACTIVE',
    total_bookings: 14,
    total_hours_spent: 18,
    total_spent: 18900,
    preferred_sports: ['Badminton', 'Pickleball'],
    favorite_venues: ['Apex Arena & Sports Club'],
    cancellation_count: 2,
    recent_booking: {
      booking_code: 'IBS-2603-9003',
      venue_name: 'Green Field Sports Park',
      court_name: 'Badminton Court 1',
      sport: 'Badminton',
      booking_date: '2026-03-08',
      time_slot: '06:00 PM - 07:00 PM',
      total_amount: 500,
      booking_status: 'COMPLETED',
      payment_status: 'PAID',
    },
  },
  {
    id: 'cust_504',
    name: 'Senthil Kumar',
    phone: '+91 94432 99881',
    email: 'senthil.k@autotech.co',
    city: 'Coimbatore',
    district: 'Coimbatore',
    state: 'Tamil Nadu',
    registered_at: '2025-06-01',
    tier: 'SILVER',
    status: 'ACTIVE',
    total_bookings: 8,
    total_hours_spent: 10,
    total_spent: 9800,
    preferred_sports: ['Football'],
    favorite_venues: ['Sky Sports Arena & Box Turf'],
    cancellation_count: 0,
    recent_booking: {
      booking_code: 'IBS-2603-9005',
      venue_name: 'Sky Sports Arena & Box Turf',
      court_name: 'Turf B (Bernabeu 5v5)',
      sport: 'Football',
      booking_date: '2026-03-07',
      time_slot: '07:00 PM - 08:00 PM',
      total_amount: 1100,
      booking_status: 'COMPLETED',
      payment_status: 'PAID',
    },
  },
  {
    id: 'cust_505',
    name: 'Arjun Nambiar',
    phone: '+91 99001 54321',
    email: 'arjun.nambiar@startup.io',
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    registered_at: '2025-07-22',
    tier: 'PLATINUM',
    status: 'ACTIVE',
    total_bookings: 34,
    total_hours_spent: 48,
    total_spent: 51200,
    preferred_sports: ['Tennis', 'Box Cricket'],
    favorite_venues: ['Apex Arena & Sports Club'],
    cancellation_count: 1,
    recent_booking: {
      booking_code: 'IBS-2603-9004',
      venue_name: 'Apex Arena & Sports Club',
      court_name: 'Pitch 1 (Rooftop Box Cricket Arena)',
      sport: 'Box Cricket',
      booking_date: '2026-03-09',
      time_slot: '06:00 AM - 08:00 AM',
      total_amount: 2400,
      booking_status: 'CONFIRMED',
      payment_status: 'PAID',
    },
  },
  {
    id: 'cust_506',
    name: 'Kavitha Ramachandran',
    phone: '+91 98411 77665',
    email: 'kavitha.r@outlook.com',
    city: 'Chennai',
    district: 'Chennai',
    state: 'Tamil Nadu',
    registered_at: '2025-08-14',
    tier: 'REGULAR',
    status: 'ACTIVE',
    total_bookings: 4,
    total_hours_spent: 5,
    total_spent: 3600,
    preferred_sports: ['Badminton'],
    favorite_venues: ['Green Field Sports Park'],
    cancellation_count: 0,
    recent_booking: {
      booking_code: 'IBS-2603-9007',
      venue_name: 'Green Field Sports Park',
      court_name: 'Pickleball Pro Court A',
      sport: 'Pickleball',
      booking_date: '2026-03-08',
      time_slot: '05:00 PM - 06:00 PM',
      total_amount: 650,
      booking_status: 'COMPLETED',
      payment_status: 'PAID',
    },
  },
  {
    id: 'cust_507',
    name: 'Nikhil Mathew',
    phone: '+91 98471 66778',
    email: 'nikhil.mathew@keralafc.com',
    city: 'Kochi',
    district: 'Ernakulam',
    state: 'Kerala',
    registered_at: '2025-09-02',
    tier: 'PLATINUM',
    status: 'ACTIVE',
    total_bookings: 22,
    total_hours_spent: 30,
    total_spent: 33000,
    preferred_sports: ['Football', 'Badminton'],
    favorite_venues: ['Kochi United Turf & Arena'],
    cancellation_count: 1,
    recent_booking: {
      booking_code: 'IBS-2603-9008',
      venue_name: 'Kochi United Turf & Arena',
      court_name: 'Malabar Turf 7v7',
      sport: 'Football',
      booking_date: '2026-03-08',
      time_slot: '06:00 PM - 07:00 PM',
      total_amount: 1500,
      booking_status: 'IN_PLAY',
      payment_status: 'PAID',
    },
  },
  {
    id: 'cust_508',
    name: 'Rohit Varma',
    phone: '+91 90002 88991',
    email: 'rohit.varma@techie.org',
    city: 'Hyderabad',
    district: 'Hyderabad',
    state: 'Telangana',
    registered_at: '2025-10-18',
    tier: 'GOLD',
    status: 'ACTIVE',
    total_bookings: 17,
    total_hours_spent: 24,
    total_spent: 22100,
    preferred_sports: ['Box Cricket', 'Pickleball'],
    favorite_venues: ['Hyderabad Smashers & Turf Hub'],
    cancellation_count: 0,
    recent_booking: {
      booking_code: 'IBS-2603-9009',
      venue_name: 'Hyderabad Smashers & Turf Hub',
      court_name: 'Gachibowli Box Pitch 1',
      sport: 'Box Cricket',
      booking_date: '2026-03-09',
      time_slot: '07:00 PM - 09:00 PM',
      total_amount: 2600,
      booking_status: 'CONFIRMED',
      payment_status: 'PAID',
    },
  },
  {
    id: 'cust_509',
    name: 'Sameer Merchant',
    phone: '+91 98201 55667',
    email: 'sameer.m@fintechmumbai.com',
    city: 'Mumbai',
    district: 'Mumbai Suburban',
    state: 'Maharashtra',
    registered_at: '2025-11-05',
    tier: 'PLATINUM',
    status: 'ACTIVE',
    total_bookings: 31,
    total_hours_spent: 44,
    total_spent: 58900,
    preferred_sports: ['Football', 'Tennis'],
    favorite_venues: ['Mumbai Champions Turf & Arena'],
    cancellation_count: 2,
    recent_booking: {
      booking_code: 'IBS-2603-9010',
      venue_name: 'Mumbai Champions Turf & Arena',
      court_name: 'Wembley Turf 7v7',
      sport: 'Football',
      booking_date: '2026-03-08',
      time_slot: '09:00 PM - 10:00 PM',
      total_amount: 1900,
      booking_status: 'CONFIRMED',
      payment_status: 'PAID',
    },
  },
];

export const INITIAL_BOOKINGS: BookingItem[] = [
  {
    id: 'bkg_9001',
    booking_code: 'IBS-2603-9001',
    customer_id: 'cust_501',
    customer_name: 'Rahul Krishnan',
    customer_phone: '+91 98401 23456',
    venue_id: 'ven_1001',
    venue_name: 'Sky Sports Arena & Box Turf',
    court_id: 'crt_101',
    court_name: 'Turf A (Camp Nou 7v7)',
    sport: 'Football',
    booking_date: '2026-03-08',
    time_slot: '07:00 PM - 08:00 PM',
    duration_minutes: 60,
    total_amount: 1600,
    platform_fee: 160,
    venue_share: 1440,
    payment_status: 'PAID',
    booking_status: 'IN_PLAY',
    payment_method: 'UPI',
    transaction_id: 'pay_rzp_981240981',
    created_at: '2026-03-07T14:20:00Z',
  },
  {
    id: 'bkg_9002',
    booking_code: 'IBS-2603-9002',
    customer_id: 'cust_502',
    customer_name: 'Dinesh Karthik',
    customer_phone: '+91 97910 87654',
    venue_id: 'ven_1001',
    venue_name: 'Sky Sports Arena & Box Turf',
    court_id: 'crt_103',
    court_name: 'Pitch C (Thunder Box Cricket)',
    sport: 'Box Cricket',
    booking_date: '2026-03-08',
    time_slot: '08:00 PM - 10:00 PM',
    duration_minutes: 120,
    total_amount: 2800,
    platform_fee: 280,
    venue_share: 2520,
    payment_status: 'PARTIAL_PAID',
    booking_status: 'CONFIRMED',
    payment_method: 'CREDIT_CARD',
    due_mode: 'CASH',
    transaction_id: 'pay_rzp_981240994',
    created_at: '2026-03-08T09:12:00Z',
  },
  {
    id: 'bkg_9003',
    booking_code: 'IBS-2603-9003',
    customer_id: 'cust_503',
    customer_name: 'Pooja Sundaram',
    customer_phone: '+91 98845 11223',
    venue_id: 'ven_1002',
    venue_name: 'Green Field Sports Park',
    court_id: 'crt_201',
    court_name: 'Badminton Court 1',
    sport: 'Badminton',
    booking_date: '2026-03-08',
    time_slot: '06:00 PM - 07:00 PM',
    duration_minutes: 60,
    total_amount: 500,
    platform_fee: 50,
    venue_share: 450,
    payment_status: 'PAID',
    booking_status: 'COMPLETED',
    payment_method: 'UPI',
    transaction_id: 'pay_rzp_981241011',
    created_at: '2026-03-06T19:00:00Z',
  },
  {
    id: 'bkg_9004',
    booking_code: 'IBS-2603-9004',
    customer_id: 'cust_505',
    customer_name: 'Arjun Nambiar',
    customer_phone: '+91 99001 54321',
    venue_id: 'ven_1003',
    venue_name: 'Apex Arena & Sports Club',
    court_id: 'crt_301',
    court_name: 'Pitch 1 (Rooftop Box Cricket Arena)',
    sport: 'Box Cricket',
    booking_date: '2026-03-09',
    time_slot: '06:00 AM - 08:00 AM',
    duration_minutes: 120,
    total_amount: 2400,
    platform_fee: 240,
    venue_share: 2160,
    payment_status: 'PARTIAL_PAID',
    booking_status: 'CONFIRMED',
    payment_method: 'UPI',
    due_mode: 'ONLINE',
    transaction_id: 'pay_rzp_981241045',
    created_at: '2026-03-08T07:45:00Z',
  },
  {
    id: 'bkg_9005',
    booking_code: 'IBS-2603-9005',
    customer_id: 'cust_504',
    customer_name: 'Senthil Kumar',
    customer_phone: '+91 94432 99881',
    venue_id: 'ven_1001',
    venue_name: 'Sky Sports Arena & Box Turf',
    court_id: 'crt_102',
    court_name: 'Turf B (Bernabeu 5v5)',
    sport: 'Football',
    booking_date: '2026-03-07',
    time_slot: '07:00 PM - 08:00 PM',
    duration_minutes: 60,
    total_amount: 1100,
    platform_fee: 110,
    venue_share: 990,
    payment_status: 'PAID',
    booking_status: 'COMPLETED',
    payment_method: 'DEBIT_CARD',
    transaction_id: 'pay_rzp_981240801',
    created_at: '2026-03-06T11:10:00Z',
  },
  {
    id: 'bkg_9006',
    booking_code: 'IBS-2603-9006',
    customer_id: 'cust_501',
    customer_name: 'Rahul Krishnan',
    customer_phone: '+91 98401 23456',
    venue_id: 'ven_1002',
    venue_name: 'Green Field Sports Park',
    court_id: 'crt_205',
    court_name: 'OMR Grand Turf 7v7',
    sport: 'Football',
    booking_date: '2026-03-06',
    time_slot: '08:00 PM - 09:00 PM',
    duration_minutes: 60,
    total_amount: 1900,
    platform_fee: 190,
    venue_share: 1710,
    payment_status: 'REFUNDED',
    booking_status: 'CANCELLED',
    payment_method: 'UPI',
    transaction_id: 'pay_rzp_981240672',
    created_at: '2026-03-05T16:30:00Z',
    cancellation_reason: 'Player personal conflict / schedule clash',
    cancelled_at: '2026-03-05 18:45:10',
    refund_amount: 1900,
    refund_status: 'REFUNDED',
    refund_utr: 'UTR-RZP-992140182',
  },
  {
    id: 'bkg_9007',
    booking_code: 'IBS-2603-9007',
    customer_id: 'cust_506',
    customer_name: 'Kavitha Ramachandran',
    customer_phone: '+91 98411 77665',
    venue_id: 'ven_1002',
    venue_name: 'Green Field Sports Park',
    court_id: 'crt_204',
    court_name: 'Pickleball Pro Court A',
    sport: 'Pickleball',
    booking_date: '2026-03-08',
    time_slot: '05:00 PM - 06:00 PM',
    duration_minutes: 60,
    total_amount: 650,
    platform_fee: 65,
    venue_share: 585,
    payment_status: 'PAID',
    booking_status: 'COMPLETED',
    payment_method: 'UPI',
    transaction_id: 'pay_rzp_981241088',
    created_at: '2026-03-08T12:00:00Z',
  },
  {
    id: 'bkg_9008',
    booking_code: 'IBS-2603-9008',
    customer_id: 'cust_507',
    customer_name: 'Nikhil Mathew',
    customer_phone: '+91 98471 66778',
    venue_id: 'ven_1004',
    venue_name: 'Kochi United Turf & Arena',
    court_id: 'crt_401',
    court_name: 'Malabar Turf 7v7',
    sport: 'Football',
    booking_date: '2026-03-08',
    time_slot: '06:00 PM - 07:00 PM',
    duration_minutes: 60,
    total_amount: 1500,
    platform_fee: 150,
    venue_share: 1350,
    payment_status: 'PAID',
    booking_status: 'IN_PLAY',
    payment_method: 'UPI',
    transaction_id: 'pay_rzp_981241102',
    created_at: '2026-03-08T10:00:00Z',
  },
  {
    id: 'bkg_9009',
    booking_code: 'IBS-2603-9009',
    customer_id: 'cust_508',
    customer_name: 'Rohit Varma',
    customer_phone: '+91 90002 88991',
    venue_id: 'ven_1005',
    venue_name: 'Hyderabad Smashers & Turf Hub',
    court_id: 'crt_501',
    court_name: 'Gachibowli Box Pitch 1',
    sport: 'Box Cricket',
    booking_date: '2026-03-09',
    time_slot: '07:00 PM - 09:00 PM',
    duration_minutes: 120,
    total_amount: 2600,
    platform_fee: 260,
    venue_share: 2340,
    payment_status: 'PAID',
    booking_status: 'CONFIRMED',
    payment_method: 'UPI',
    transaction_id: 'pay_rzp_981241123',
    created_at: '2026-03-08T11:15:00Z',
  },
  {
    id: 'bkg_9010',
    booking_code: 'IBS-2603-9010',
    customer_id: 'cust_509',
    customer_name: 'Sameer Merchant',
    customer_phone: '+91 98201 55667',
    venue_id: 'ven_1006',
    venue_name: 'Mumbai Champions Turf & Arena',
    court_id: 'crt_601',
    court_name: 'Wembley Turf 7v7',
    sport: 'Football',
    booking_date: '2026-03-08',
    time_slot: '09:00 PM - 10:00 PM',
    duration_minutes: 60,
    total_amount: 1900,
    platform_fee: 190,
    venue_share: 1710,
    payment_status: 'PAID',
    booking_status: 'CONFIRMED',
    payment_method: 'CREDIT_CARD',
    transaction_id: 'pay_rzp_981241154',
    created_at: '2026-03-08T13:30:00Z',
  },
  {
    id: 'bkg_9011',
    booking_code: 'IBS-2603-9011',
    customer_id: 'cust_503',
    customer_name: 'Pooja Sundaram',
    customer_phone: '+91 98845 11223',
    venue_id: 'ven_1003',
    venue_name: 'Apex Arena & Sports Club',
    court_id: 'crt_302',
    court_name: 'Turf 2 (Skyline 5v5 Football)',
    sport: 'Football',
    booking_date: '2026-03-04',
    time_slot: '06:00 PM - 07:00 PM',
    duration_minutes: 60,
    total_amount: 1200,
    platform_fee: 120,
    venue_share: 1080,
    payment_status: 'REFUNDED',
    booking_status: 'CANCELLED',
    payment_method: 'UPI',
    transaction_id: 'pay_rzp_981240411',
    created_at: '2026-03-03T15:00:00Z',
    cancellation_reason: 'Rainfall / outdoor wet turf cancellation',
    cancelled_at: '2026-03-04 16:30:00',
    refund_amount: 1200,
    refund_status: 'WALLET_CREDITED',
    refund_utr: 'WLT-REF-20260304-89',
  },
  {
    id: 'bkg_9012',
    booking_code: 'IBS-2603-9012',
    customer_id: 'cust_509',
    customer_name: 'Sameer Merchant',
    customer_phone: '+91 98201 55667',
    venue_id: 'ven_1006',
    venue_name: 'Mumbai Champions Turf & Arena',
    court_id: 'crt_604',
    court_name: 'Wimbledon Hardcourt Tennis',
    sport: 'Tennis',
    booking_date: '2026-03-02',
    time_slot: '07:00 AM - 08:00 AM',
    duration_minutes: 60,
    total_amount: 950,
    platform_fee: 95,
    venue_share: 855,
    payment_status: 'REFUNDED',
    booking_status: 'CANCELLED',
    payment_method: 'CREDIT_CARD',
    transaction_id: 'pay_rzp_981240219',
    created_at: '2026-03-01T20:10:00Z',
    cancellation_reason: 'Customer requested cancellation 24h prior',
    cancelled_at: '2026-03-01 22:15:00',
    refund_amount: 950,
    refund_status: 'REFUNDED',
    refund_utr: 'UTR-HDFC-991204812',
  },
];

export const INITIAL_PAYMENTS: PaymentTransactionItem[] = [
  {
    id: 'txn_7001',
    txn_id: 'TXN-20260308-01',
    gateway_order_id: 'order_rZP_9918231',
    gateway_payment_id: 'pay_rzp_981240981',
    booking_code: 'IBS-2603-9001',
    booking_status: 'CONFIRMED',
    venue_name: 'Sky Sports Arena & Box Turf',
    court_name: 'Main Football Turf A',
    sport: 'Football',
    customer_name: 'Rahul Krishnan',
    customer_phone: '+91 98401 23456',
    total_booking_amount: 1600,
    gross_amount: 1600,
    received_amount: 1600,
    balance_amount: 0,
    advance_percentage: 100,
    payment_status: 'FULLY_PAID',
    gateway_fee: 32,
    platform_commission: 160,
    tax_gst: 28.8,
    net_venue_payout: 1379.2,
    payment_type: 'UPI',
    payment_method: 'UPI (GooglePay)',
    gateway: 'RAZORPAY',
    status: 'SUCCESS',
    timestamp: '2026-03-07 14:21:05',
    invoice_number: 'INV-2026-IBS-9001',
    payment_link: 'https://pay.ibooksports.com/rec/IBS-2603-9001',
    booking_date: '2026-03-08',
    slot_time: '06:00 PM - 07:00 PM',
  },
  {
    id: 'txn_7002',
    txn_id: 'TXN-20260308-02',
    gateway_order_id: 'order_rZP_9918244',
    gateway_payment_id: 'pay_rzp_981240994',
    booking_code: 'IBS-2603-9002',
    booking_status: 'CONFIRMED',
    venue_name: 'Sky Sports Arena & Box Turf',
    court_name: 'Box Cricket Pitch 1',
    sport: 'Cricket',
    customer_name: 'Dinesh Karthik',
    customer_phone: '+91 97910 87654',
    total_booking_amount: 2800,
    gross_amount: 1400,
    received_amount: 1400,
    balance_amount: 1400,
    advance_percentage: 50,
    payment_status: 'ADVANCE_PAID',
    gateway_fee: 28,
    platform_commission: 140,
    tax_gst: 25.2,
    net_venue_payout: 1206.8,
    payment_type: 'CREDIT_CARD',
    payment_method: 'HDFC Visa Credit Card',
    gateway: 'RAZORPAY',
    status: 'SUCCESS',
    timestamp: '2026-03-08 09:12:44',
    invoice_number: 'INV-2026-IBS-9002',
    balance_payment_link: 'https://pay.ibooksports.com/bal/IBS-2603-9002',
    due_mode: 'CASH',
    booking_date: '2026-03-08',
    slot_time: '07:00 PM - 09:00 PM',
  },
  {
    id: 'txn_7003',
    txn_id: 'TXN-20260308-03',
    gateway_order_id: 'order_rZP_9918289',
    gateway_payment_id: 'pay_rzp_981241011',
    booking_code: 'IBS-2603-9003',
    booking_status: 'COMPLETED',
    venue_name: 'Green Field Sports Park',
    court_name: 'Synthetic Badminton Court 2',
    sport: 'Badminton',
    customer_name: 'Pooja Sundaram',
    customer_phone: '+91 98845 11223',
    total_booking_amount: 1000,
    gross_amount: 500,
    received_amount: 500,
    balance_amount: 500,
    advance_percentage: 50,
    payment_status: 'ADVANCE_PAID',
    gateway_fee: 10,
    platform_commission: 50,
    tax_gst: 9.0,
    net_venue_payout: 431.0,
    payment_type: 'UPI',
    payment_method: 'UPI (PhonePe)',
    gateway: 'PHONEPE',
    status: 'SUCCESS',
    timestamp: '2026-03-06 19:01:12',
    invoice_number: 'INV-2026-IBS-9003',
    balance_payment_link: 'https://pay.ibooksports.com/bal/IBS-2603-9003',
    due_mode: 'ONLINE',
    booking_date: '2026-03-07',
    slot_time: '05:00 PM - 06:00 PM',
  },
  {
    id: 'txn_7004',
    txn_id: 'TXN-20260308-04',
    gateway_order_id: 'order_rZP_9918301',
    gateway_payment_id: 'pay_rzp_981241045',
    booking_code: 'IBS-2603-9004',
    booking_status: 'CONFIRMED',
    venue_name: 'Apex Arena & Sports Club',
    court_name: 'Main Turf Pitch 1',
    sport: 'Cricket',
    customer_name: 'Arjun Nambiar',
    customer_phone: '+91 99001 54321',
    total_booking_amount: 2400,
    gross_amount: 2400,
    received_amount: 2400,
    balance_amount: 0,
    advance_percentage: 100,
    payment_status: 'FULLY_PAID',
    gateway_fee: 48,
    platform_commission: 240,
    tax_gst: 43.2,
    net_venue_payout: 2068.8,
    payment_type: 'NET_BANKING',
    payment_method: 'SBI Net Banking',
    gateway: 'RAZORPAY',
    status: 'SUCCESS',
    timestamp: '2026-03-08 07:46:20',
    invoice_number: 'INV-2026-IBS-9004',
    payment_link: 'https://pay.ibooksports.com/rec/IBS-2603-9004',
    booking_date: '2026-03-09',
    slot_time: '06:30 AM - 08:30 AM',
  },
  {
    id: 'txn_7005',
    txn_id: 'TXN-20260308-05',
    gateway_order_id: 'order_rZP_9918112',
    gateway_payment_id: 'pay_rzp_981240672',
    booking_code: 'IBS-2603-9006',
    booking_status: 'CANCELLED',
    venue_name: 'Green Field Sports Park',
    court_name: 'Astroturf Pitch 2',
    sport: 'Football',
    customer_name: 'Rahul Krishnan',
    customer_phone: '+91 98401 23456',
    total_booking_amount: 1900,
    gross_amount: 1900,
    received_amount: 1900,
    balance_amount: 0,
    advance_percentage: 100,
    payment_status: 'REFUNDED',
    gateway_fee: 38,
    platform_commission: 190,
    tax_gst: 34.2,
    net_venue_payout: 0,
    payment_type: 'UPI',
    payment_method: 'UPI (GooglePay)',
    gateway: 'RAZORPAY',
    status: 'REFUNDED',
    timestamp: '2026-03-05 16:32:00',
    invoice_number: 'INV-2026-IBS-9006',
    booking_date: '2026-03-06',
    slot_time: '08:00 PM - 09:00 PM',
  },
  {
    id: 'txn_7006',
    txn_id: 'TXN-20260308-06',
    gateway_order_id: 'order_rZP_9918355',
    gateway_payment_id: 'pay_rzp_981241102',
    booking_code: 'IBS-2603-9007',
    booking_status: 'IN_PLAY',
    venue_name: 'Strike Velocity Arena',
    court_name: 'Padel Glass Court 1',
    sport: 'Pickleball',
    customer_name: 'Nikhil Mathew',
    customer_phone: '+91 98471 66778',
    total_booking_amount: 3200,
    gross_amount: 1600,
    received_amount: 1600,
    balance_amount: 1600,
    advance_percentage: 50,
    payment_status: 'ADVANCE_PAID',
    gateway_fee: 32,
    platform_commission: 160,
    tax_gst: 28.8,
    net_venue_payout: 1379.2,
    payment_type: 'CREDIT_CARD',
    payment_method: 'ICICI Coral Credit Card',
    gateway: 'RAZORPAY',
    status: 'SUCCESS',
    timestamp: '2026-03-08 17:30:10',
    invoice_number: 'INV-2026-IBS-9007',
    balance_payment_link: 'https://pay.ibooksports.com/bal/IBS-2603-9007',
    booking_date: '2026-03-08',
    slot_time: '06:00 PM - 08:00 PM',
  },
  {
    id: 'txn_7007',
    txn_id: 'TXN-20260308-07',
    gateway_order_id: 'order_rZP_9918378',
    gateway_payment_id: 'pay_rzp_981241150',
    booking_code: 'IBS-2603-9008',
    booking_status: 'CONFIRMED',
    venue_name: 'SmashZone Badminton Hub',
    court_name: 'BWF Court 3',
    sport: 'Badminton',
    customer_name: 'Rohit Varma',
    customer_phone: '+91 90002 88991',
    total_booking_amount: 1200,
    gross_amount: 1200,
    received_amount: 1200,
    balance_amount: 0,
    advance_percentage: 100,
    payment_status: 'FULLY_PAID',
    gateway_fee: 24,
    platform_commission: 120,
    tax_gst: 21.6,
    net_venue_payout: 1034.4,
    payment_type: 'NET_BANKING',
    payment_method: 'HDFC Net Banking',
    gateway: 'RAZORPAY',
    status: 'SUCCESS',
    timestamp: '2026-03-08 18:45:00',
    invoice_number: 'INV-2026-IBS-9008',
    payment_link: 'https://pay.ibooksports.com/rec/IBS-2603-9008',
    booking_date: '2026-03-09',
    slot_time: '07:00 PM - 08:00 PM',
  },
  {
    id: 'txn_7008',
    txn_id: 'TXN-20260308-08',
    gateway_order_id: 'order_rZP_9918412',
    gateway_payment_id: 'pay_rzp_981241220',
    booking_code: 'IBS-2603-9009',
    booking_status: 'CONFIRMED',
    venue_name: 'Decathlon United Turf Complex',
    court_name: 'Tennis Court 1 (Clay)',
    sport: 'Tennis',
    customer_name: 'Sameer Merchant',
    customer_phone: '+91 98201 55667',
    total_booking_amount: 2000,
    gross_amount: 1000,
    received_amount: 1000,
    balance_amount: 1000,
    advance_percentage: 50,
    payment_status: 'ADVANCE_PAID',
    gateway_fee: 20,
    platform_commission: 100,
    tax_gst: 18.0,
    net_venue_payout: 862.0,
    payment_type: 'UPI',
    payment_method: 'UPI (Paytm)',
    gateway: 'RAZORPAY',
    status: 'SUCCESS',
    timestamp: '2026-03-08 19:10:30',
    invoice_number: 'INV-2026-IBS-9009',
    balance_payment_link: 'https://pay.ibooksports.com/bal/IBS-2603-9009',
    booking_date: '2026-03-09',
    slot_time: '05:00 PM - 06:00 PM',
  },
];

export const INITIAL_SETTLEMENTS: SettlementBatchItem[] = [
  {
    id: 'stl_401',
    batch_number: 'STL-202603-001',
    venue_id: 'ven_1001',
    venue_name: 'Sky Sports Arena & Box Turf',
    owner_name: 'Karthik Rajan',
    bank_name: 'HDFC Bank Ltd',
    account_number_masked: '•••• •••• 9012',
    ifsc_code: 'HDFC0001248',
    period_start: '2026-03-06',
    period_end: '2026-03-06',
    settlement_date: '2026-03-08', // T+2 after 06 March match
    cycle_month: '2026-03',
    cycle_year: 2026,
    t_plus_days: 2,
    bookings_count: 48,
    actual_court_price_total: 76800,
    gross_booking_amount: 76800,
    online_advance_held: 46000,
    cash_collected_at_venue: 30800,
    platform_commission_deducted: 7680, // 10%
    platform_fee_gst: 1382.4, // 18% of fee
    tds_deducted: 768, // 1%
    net_payable: 36169.6, // Online Advance (46,000) - Fee (7,680) - GST (1,382.4) - TDS (768)
    status: 'SETTLED',
    utr_number: 'HDFCR20260308912048',
    settled_at: '2026-03-08 11:30 AM',
    itemized_bookings: [
      {
        booking_code: 'IBS-2603-9001',
        slot_date: '2026-03-06',
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
        slot_date: '2026-03-06',
        slot_time: '07:00 PM - 09:00 PM',
        court_name: 'Box Cricket Pitch 1',
        sport: 'Cricket',
        actual_court_price: 2800,
        online_advance_paid: 1400,
        cash_collected_at_venue: 1400,
        payment_mode: 'ONLINE_ADVANCE_PLUS_CASH',
        platform_fee: 280,
        platform_fee_gst: 50.4,
        net_venue_share: 1041.6, // Transferred from online advance after cash offset
      },
      {
        booking_code: 'IBS-2603-9015',
        slot_date: '2026-03-06',
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
    ],
  },
  {
    id: 'stl_402',
    batch_number: 'STL-202603-002',
    venue_id: 'ven_1002',
    venue_name: 'Green Field Sports Park',
    owner_name: 'Vignesh Sundaram',
    bank_name: 'ICICI Bank',
    account_number_masked: '•••• •••• 4421',
    ifsc_code: 'ICIC0000412',
    period_start: '2026-03-05',
    period_end: '2026-03-05',
    settlement_date: '2026-03-07', // T+2
    cycle_month: '2026-03',
    cycle_year: 2026,
    t_plus_days: 2,
    bookings_count: 72,
    actual_court_price_total: 115200,
    gross_booking_amount: 115200,
    online_advance_held: 72000,
    cash_collected_at_venue: 43200,
    platform_commission_deducted: 11520,
    platform_fee_gst: 2073.6,
    tds_deducted: 1152,
    net_payable: 57254.4,
    status: 'SETTLED',
    utr_number: 'ICICR20260307884102',
    settled_at: '2026-03-07 11:45 AM',
    itemized_bookings: [
      {
        booking_code: 'IBS-2603-9003',
        slot_date: '2026-03-05',
        slot_time: '05:00 PM - 06:00 PM',
        court_name: 'Synthetic Badminton Court 2',
        sport: 'Badminton',
        actual_court_price: 1000,
        online_advance_paid: 500,
        cash_collected_at_venue: 500,
        payment_mode: 'ONLINE_ADVANCE_PLUS_CASH',
        platform_fee: 100,
        platform_fee_gst: 18.0,
        net_venue_share: 372.0,
      },
    ],
  },
  {
    id: 'stl_403',
    batch_number: 'STL-202603-003',
    venue_id: 'ven_1003',
    venue_name: 'Apex Arena & Sports Club',
    owner_name: 'Ananya Sharma',
    bank_name: 'Axis Bank',
    account_number_masked: '•••• •••• 6789',
    ifsc_code: 'UTIB0000843',
    period_start: '2026-03-06',
    period_end: '2026-03-06',
    settlement_date: '2026-03-08', // T+2
    cycle_month: '2026-03',
    cycle_year: 2026,
    t_plus_days: 2,
    bookings_count: 38,
    actual_court_price_total: 54000,
    gross_booking_amount: 54000,
    online_advance_held: 42000,
    cash_collected_at_venue: 12000,
    platform_commission_deducted: 5400,
    platform_fee_gst: 972.0,
    tds_deducted: 540,
    net_payable: 35088.0,
    status: 'SETTLED',
    utr_number: 'AXISR20260308774910',
    settled_at: '2026-03-08 12:10 PM',
  },
  {
    id: 'stl_404',
    batch_number: 'STL-202603-004',
    venue_id: 'ven_1001',
    venue_name: 'Sky Sports Arena & Box Turf',
    owner_name: 'Karthik Rajan',
    bank_name: 'HDFC Bank Ltd',
    account_number_masked: '•••• •••• 9012',
    ifsc_code: 'HDFC0001248',
    period_start: '2026-03-07',
    period_end: '2026-03-07',
    settlement_date: '2026-03-09', // T+2
    cycle_month: '2026-03',
    cycle_year: 2026,
    t_plus_days: 2,
    bookings_count: 32,
    actual_court_price_total: 47200,
    gross_booking_amount: 47200,
    online_advance_held: 28000,
    cash_collected_at_venue: 19200,
    platform_commission_deducted: 4720,
    platform_fee_gst: 849.6,
    tds_deducted: 472,
    net_payable: 21958.4,
    status: 'PENDING_APPROVAL',
  },
  {
    id: 'stl_405',
    batch_number: 'STL-202603-005',
    venue_id: 'ven_1002',
    venue_name: 'Green Field Sports Park',
    owner_name: 'Vignesh Sundaram',
    bank_name: 'ICICI Bank',
    account_number_masked: '•••• •••• 4421',
    ifsc_code: 'ICIC0000412',
    period_start: '2026-03-07',
    period_end: '2026-03-07',
    settlement_date: '2026-03-09', // T+2
    cycle_month: '2026-03',
    cycle_year: 2026,
    t_plus_days: 2,
    bookings_count: 51,
    actual_court_price_total: 82400,
    gross_booking_amount: 82400,
    online_advance_held: 51000,
    cash_collected_at_venue: 31400,
    platform_commission_deducted: 8240,
    platform_fee_gst: 1483.2,
    tds_deducted: 824,
    net_payable: 40452.8,
    status: 'PROCESSING',
  },
  {
    id: 'stl_406',
    batch_number: 'STL-202602-012',
    venue_id: 'ven_1001',
    venue_name: 'Sky Sports Arena & Box Turf',
    owner_name: 'Karthik Rajan',
    bank_name: 'HDFC Bank Ltd',
    account_number_masked: '•••• •••• 9012',
    ifsc_code: 'HDFC0001248',
    period_start: '2026-02-26',
    period_end: '2026-02-26',
    settlement_date: '2026-02-28', // T+2
    cycle_month: '2026-02',
    cycle_year: 2026,
    t_plus_days: 2,
    bookings_count: 60,
    actual_court_price_total: 96000,
    gross_booking_amount: 96000,
    online_advance_held: 58000,
    cash_collected_at_venue: 38000,
    platform_commission_deducted: 9600,
    platform_fee_gst: 1728.0,
    tds_deducted: 960,
    net_payable: 45712.0,
    status: 'SETTLED',
    utr_number: 'HDFCR20260228941019',
    settled_at: '2026-02-28 10:20 AM',
  },
  {
    id: 'stl_407',
    batch_number: 'STL-202512-045',
    venue_id: 'ven_1003',
    venue_name: 'Apex Arena & Sports Club',
    owner_name: 'Ananya Sharma',
    bank_name: 'Axis Bank',
    account_number_masked: '•••• •••• 6789',
    ifsc_code: 'UTIB0000843',
    period_start: '2025-12-28',
    period_end: '2025-12-28',
    settlement_date: '2025-12-30', // T+2
    cycle_month: '2025-12',
    cycle_year: 2025,
    t_plus_days: 2,
    bookings_count: 45,
    actual_court_price_total: 67500,
    gross_booking_amount: 67500,
    online_advance_held: 45000,
    cash_collected_at_venue: 22500,
    platform_commission_deducted: 6750,
    platform_fee_gst: 1215.0,
    tds_deducted: 675,
    net_payable: 36360.0,
    status: 'SETTLED',
    utr_number: 'AXISR20251230114992',
    settled_at: '2025-12-30 02:15 PM',
  },
];

export const INITIAL_SUPPORT_TICKETS: SupportTicketItem[] = [
  {
    id: 'tkt_801',
    ticket_number: 'SUP-2026-101',
    venue_id: 'ven_1001',
    venue_name: 'Sky Sports Arena & Box Turf',
    created_person_name: 'Karthik Rajan',
    contact_number: '+91 98765 43210',
    category: 'PAYMENT',
    priority: 'URGENT',
    subject: 'Double deduction on Razorpay UPI checkout for customer slot booking',
    description: 'Customer Rahul Verma was charged twice (₹1,400 x 2) for Turf A slot at 7 PM. Slot was locked once, but amount was debited twice from his bank. Please reverse the duplicate payment.',
    related_booking_code: 'BK-2026-8901',
    attachment_name: 'razorpay_duplicate_txn.png',
    attachment_url: '#',
    status: 'OPEN',
    source: 'VENUE_APP',
    created_at: '2026-03-08 09:15',
    conversation: [
      {
        sender: 'VENUE',
        sender_name: 'Karthik Rajan (Turf Owner)',
        message: 'Customer is waiting at the counter. The payment gateway debited him twice for booking BK-2026-8901. Requesting immediate refund reversal.',
        timestamp: '09:15 AM',
      },
    ],
  },
  {
    id: 'tkt_802',
    ticket_number: 'SUP-2026-102',
    venue_id: 'ven_1002',
    venue_name: 'Green Field Sports Park',
    created_person_name: 'Vignesh Sundaram',
    contact_number: '+91 98401 23456',
    category: 'BOOKING',
    priority: 'HIGH',
    subject: 'Rain cancellation refund processing needed for 4 consecutive evening slots',
    description: 'Heavy rain flooded our 7v7 outdoor football ground between 6:00 PM and 10:00 PM. We marked cancellations in our venue app. Please disburse platform refunds to affected customer wallets.',
    related_booking_code: 'BK-2026-8904',
    attachment_name: 'rain_waterlogged_pitch.jpg',
    attachment_url: '#',
    status: 'IN_PROGRESS',
    source: 'VENUE_APP',
    created_at: '2026-03-07 19:40',
    conversation: [
      {
        sender: 'VENUE',
        sender_name: 'Vignesh Sundaram (Manager)',
        message: 'Unseasonal storm waterlogged Pitch 1. 4 bookings could not proceed. We coordinated with teams to cancel.',
        timestamp: '07:40 PM',
      },
      {
        sender: 'ADMIN',
        sender_name: 'Super Admin',
        message: 'Weather logs verified against venue geo-tag. Processing batch wallet credits for all 4 impacted teams now.',
        timestamp: '08:10 PM',
      },
    ],
  },
  {
    id: 'tkt_803',
    ticket_number: 'SUP-2026-103',
    venue_id: 'ven_1003',
    venue_name: 'Apex Arena & Sports Club',
    created_person_name: 'Ananya Sharma',
    contact_number: '+91 99001 54321',
    category: 'SETTLEMENTS',
    priority: 'HIGH',
    subject: 'Weekly payout mismatch for Batch STL-202603-004 (TDS clarification)',
    description: 'Our account team noticed a ₹472 difference between our ERP ledger and Batch STL-202603-004 net disbursal. Need formal breakdown of whether this is 1% Sec 194-O TDS or gateway surcharge.',
    related_booking_code: undefined,
    attachment_name: 'settlement_ledger_audit.pdf',
    attachment_url: '#',
    status: 'OPEN',
    source: 'VENUE_APP',
    created_at: '2026-03-08 10:30',
    conversation: [
      {
        sender: 'VENUE',
        sender_name: 'Ananya Sharma (Finance Lead)',
        message: 'Need GST invoice & TDS breakdown statement for batch STL-202603-004 for our CA audit submission.',
        timestamp: '10:30 AM',
      },
    ],
  },
  {
    id: 'tkt_804',
    ticket_number: 'SUP-2026-104',
    venue_id: 'ven_1004',
    venue_name: 'Decathlon United Turf Complex',
    created_person_name: 'Sneha Hegde',
    contact_number: '+91 98801 32910',
    category: 'TECHNICAL',
    priority: 'HIGH',
    subject: 'Vendor App slot scheduler calendar freeze on Android 14 devices',
    description: 'When tapping on Court 3 slot schedule grid after 9:00 PM, the vendor management app crashes back to home screen on staff OnePlus devices. App build v2.4.1.',
    related_booking_code: undefined,
    attachment_name: 'crash_log_logcat.txt',
    attachment_url: '#',
    status: 'IN_PROGRESS',
    source: 'VENUE_APP',
    created_at: '2026-03-06 14:20',
    conversation: [
      {
        sender: 'VENUE',
        sender_name: 'Sneha Hegde (Operations)',
        message: 'Our ground staff cannot lock offline walk-in slots on Android 14 because the calendar picker crashes.',
        timestamp: '02:20 PM',
      },
      {
        sender: 'ADMIN',
        sender_name: 'Super Admin',
        message: 'Our mobile team identified the timezone parsing exception on Android 14. Patch v2.4.2 is pushed to Play Console internal track.',
        timestamp: '03:45 PM',
      },
    ],
  },
  {
    id: 'tkt_805',
    ticket_number: 'SUP-2026-105',
    venue_id: 'ven_1005',
    venue_name: 'SmashZone Badminton Hub',
    created_person_name: 'S. Karthik',
    contact_number: '+91 94440 18233',
    category: 'GENERAL',
    priority: 'LOW',
    subject: 'Requesting high-resolution iBookSports QR acrylic counter stands for reception',
    description: 'We recently added Court 7 and 8 and require 2 extra branded acrylic QR stands for walk-in players to scan and pay with app booking discounts.',
    related_booking_code: undefined,
    attachment_name: 'reception_counter_photo.jpg',
    attachment_url: '#',
    status: 'RESOLVED',
    resolution_notes: 'Branded QR counter standees (Pack of 2) with NFC tap enabled dispatched via BlueDart courier AWB #78192033. Delivered and installed at reception desk.',
    resolved_at: '2026-03-07 16:30',
    resolved_by: 'Super Admin',
    source: 'VENUE_APP',
    created_at: '2026-03-05 11:00',
    conversation: [
      {
        sender: 'VENUE',
        sender_name: 'S. Karthik (Owner)',
        message: 'Need additional official counter QR standees for our new reception annex.',
        timestamp: '11:00 AM',
      },
      {
        sender: 'ADMIN',
        sender_name: 'Super Admin',
        message: 'Dispatched 2 acrylic QR stands with your venue slug pre-encoded. Tracking AWB #78192033.',
        timestamp: '04:30 PM',
      },
    ],
  },
  {
    id: 'tkt_806',
    ticket_number: 'SUP-2026-106',
    venue_id: 'ven_1006',
    venue_name: 'Strike Velocity Padel & Turf',
    created_person_name: 'Vikram Reddy',
    contact_number: '+91 99081 44520',
    category: 'OTHERS',
    priority: 'MEDIUM',
    subject: 'GST registration certificate update and commercial name amendment',
    description: 'We converted our business entity from Sole Proprietorship to LLP. Uploading fresh GSTIN registration certificate and PAN for platform billing update.',
    related_booking_code: undefined,
    attachment_name: 'gst_certificate_llp.pdf',
    attachment_url: '#',
    status: 'RESOLVED',
    resolution_notes: 'Verified legal documents against MCA and GSTIN portal. Legal entity updated to Strike Velocity Sports Ventures LLP. Tax invoice profile synchronized.',
    resolved_at: '2026-03-08 10:15',
    resolved_by: 'Super Admin',
    source: 'VENUE_APP',
    created_at: '2026-03-06 09:30',
    conversation: [
      {
        sender: 'VENUE',
        sender_name: 'Vikram Reddy (Partner)',
        message: 'Please update our business entity name on invoices from sole proprietorship to LLP.',
        timestamp: '09:30 AM',
      },
      {
        sender: 'ADMIN',
        sender_name: 'Super Admin',
        message: 'GSTIN verification completed. Payouts and commission invoices are now registered under Strike Velocity Sports Ventures LLP.',
        timestamp: '10:15 AM',
      },
    ],
  },
];

export const INITIAL_AUDIT_LOGS = [
  {
    id: 'aud_1',
    timestamp: '2026-03-08 11:42:15',
    admin_user: 'Super Admin (admin@ibooksports.com)',
    action: 'DISBURSED_SETTLEMENT',
    module: 'Settlement Management',
    ip_address: '103.212.144.18',
    details: 'Triggered IMPS batch payout of ₹68,352 to Sky Sports Arena Ventures LLP',
    status: 'SUCCESS',
  },
  {
    id: 'aud_2',
    timestamp: '2026-03-08 10:15:30',
    admin_user: 'Operations Lead (ops@ibooksports.com)',
    action: 'APPROVED_COURT_REQUEST',
    module: 'Court Requests',
    ip_address: '103.212.144.20',
    details: 'Approved additional Pickleball Pro Court A addition for Green Field Sports Park',
    status: 'SUCCESS',
  },
  {
    id: 'aud_3',
    timestamp: '2026-03-07 16:22:04',
    admin_user: 'Super Admin (admin@ibooksports.com)',
    action: 'SYSTEM_SETTINGS_UPDATE',
    module: 'Settings (Module Config)',
    ip_address: '103.212.144.18',
    details: 'Updated maximum advance booking horizon from 14 days to 30 days',
    status: 'SUCCESS',
  },
  {
    id: 'aud_4',
    timestamp: '2026-03-07 11:05:49',
    admin_user: 'Finance Admin (finance@ibooksports.com)',
    action: 'REFUND_APPROVED',
    module: 'Payment Management',
    ip_address: '49.207.199.52',
    details: 'Processed weather refund for Booking IBS-2603-9006 (₹1,900)',
    status: 'SUCCESS',
  },
  {
    id: 'aud_5',
    timestamp: '2026-03-06 09:30:11',
    admin_user: 'Super Admin (admin@ibooksports.com)',
    action: 'ADMIN_OTP_LOGIN',
    module: 'Authentication',
    ip_address: '103.212.144.18',
    details: 'Admin session authorized via 6-digit email OTP verification',
    status: 'SUCCESS',
  },
];

export interface CourtExtensionHistory {
  round: number;
  action: 'NEW_REQUEST' | 'SUBMITTED' | 'RESUBMITTED' | 'APPROVED' | 'REJECTED';
  timestamp: string;
  notes?: string;
  note?: string;
  reviewer?: string;
  actor_role?: string;
  rejection_reason_code?: string;
}

export interface CourtExtensionRequest {
  id: string;
  venue_id: string;
  venue_name: string;
  venue_city: string;
  owner_name: string;
  owner_phone: string;

  // Section 1: Same physical sports for this turf?
  same_physical_sports: boolean;
  parent_court_name?: string;

  // Section 2: Court Information
  sport: string;
  court_name: string;
  display_name: string;

  // Section 3: Base Duration & Rate
  min_booking_duration: string;
  min_booking_duration_label?: string;
  min_booking_duration_mins?: number;
  price_per_hour: number;
  regular_price?: number;

  // Section 4: Peak Surcharge & Weekend Rates
  peak_hours_start: string;
  peak_hours_end: string;
  peak_price: number;
  weekend_price: number;
  peak_days: string[];

  // Section 5: Free Cancellation Window
  cancellation_window_hours: number;
  cancellation_policy_hours?: number;

  // Section 6: Refund Payout Percentage
  refund_percentage: number;

  // Review & Lifecycle State
  status: 'NEW_REQUEST' | 'SUBMITTED' | 'RESUBMITTED' | 'APPROVED' | 'REJECTED';
  submission_count: number;
  submission_round?: number;
  rejection_reason?: string;
  rejection_notes?: string;
  rejection_note?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  submitted_at?: string;
  environment?: 'Outdoor' | 'Indoor' | 'Covered Roof';
  history: CourtExtensionHistory[];
  created_at?: string;
  updated_at?: string;
}

export const INITIAL_COURT_REQUESTS: CourtExtensionRequest[] = [
  {
    id: 'CRQ-2603-101',
    venue_id: 'ven_1001',
    venue_name: 'skywalk sports',
    venue_city: 'Coimbatore, Tamil Nadu',
    owner_name: 'Shruthi jayamadhu',
    owner_phone: '+91 6369591821',
    same_physical_sports: false,
    sport: 'Football',
    court_name: 'Turf 1A (5-a-side)',
    display_name: 'Main Arena Pitch 1 (Floodlit Turf)',
    min_booking_duration: '1 Hour',
    price_per_hour: 1000,
    peak_hours_start: '06:00 PM',
    peak_hours_end: '11:00 PM',
    peak_price: 1400,
    weekend_price: 1500,
    peak_days: ['Fri', 'Sat', 'Sun'],
    cancellation_window_hours: 12,
    refund_percentage: 100,
    status: 'RESUBMITTED',
    submission_count: 2,
    rejection_reason: 'PRICING_OUT_OF_BOUNDS',
    rejection_notes:
      'Weekend rate was set at ₹2,400 which violates the regional cap of ₹1,800. Please adjust weekend pricing and ensure min booking time is set to 1 hour.',
    history: [
      {
        round: 1,
        action: 'NEW_REQUEST',
        timestamp: '2026-03-06 14:20:00',
        notes: 'Initial court addition request submitted by venue owner.',
      },
      {
        round: 1,
        action: 'REJECTED',
        timestamp: '2026-03-07 10:15:00',
        reviewer: 'Admin Operations',
        notes:
          'Weekend rate was set at ₹2,400 which violates the regional cap of ₹1,800. Please adjust weekend pricing and ensure min booking time is set to 1 hour.',
      },
      {
        round: 2,
        action: 'RESUBMITTED',
        timestamp: '2026-03-08 11:30:00',
        notes:
          'Adjusted weekend rate to ₹1,500 and verified 1-hour minimum booking duration as requested.',
      },
    ],
    created_at: '2026-03-06 14:20:00',
    updated_at: '2026-03-08 11:30:00',
  },
  {
    id: 'CRQ-2603-102',
    venue_id: 'ven_1002',
    venue_name: 'Green Field Sports Park',
    venue_city: 'Kochi, Kerala',
    owner_name: 'Rahul Varma',
    owner_phone: '+91 98470 12345',
    same_physical_sports: true,
    parent_court_name: 'Main Football Turf',
    sport: 'Box Cricket',
    court_name: 'Pitch B (Cricket Box)',
    display_name: 'Floodlit Box Cricket Pitch 2',
    min_booking_duration: '1 Hour',
    price_per_hour: 1200,
    peak_hours_start: '06:00 PM',
    peak_hours_end: '10:00 PM',
    peak_price: 1600,
    weekend_price: 1800,
    peak_days: ['Sat', 'Sun'],
    cancellation_window_hours: 12,
    refund_percentage: 100,
    status: 'NEW_REQUEST',
    submission_count: 1,
    history: [
      {
        round: 1,
        action: 'NEW_REQUEST',
        timestamp: '2026-03-09 09:15:00',
        notes: 'New physical shared pitch request for weekend box cricket.',
      },
    ],
    created_at: '2026-03-09 09:15:00',
    updated_at: '2026-03-09 09:15:00',
  },
  {
    id: 'CRQ-2603-103',
    venue_id: 'ven_1003',
    venue_name: 'Metro Arena',
    venue_city: 'Bengaluru, Karnataka',
    owner_name: 'Anand Kumar',
    owner_phone: '+91 94432 99881',
    same_physical_sports: false,
    sport: 'Badminton',
    court_name: 'Court 3 (BWF Synthetic)',
    display_name: 'BWF Wooden Floor Court 3',
    min_booking_duration: '30 Mins',
    price_per_hour: 700,
    peak_hours_start: '05:00 PM',
    peak_hours_end: '09:00 PM',
    peak_price: 950,
    weekend_price: 900,
    peak_days: ['Sat', 'Sun'],
    cancellation_window_hours: 4,
    refund_percentage: 75,
    status: 'REJECTED',
    submission_count: 1,
    rejection_reason: 'SURFACE_VERIFICATION_NEEDED',
    rejection_notes:
      'BWF mat thickness certification and clear floodlight lux test report missing. Please re-upload verified technical specs.',
    history: [
      {
        round: 1,
        action: 'SUBMITTED',
        timestamp: '2026-03-05 16:40:00',
        notes: 'Indoor badminton expansion.',
      },
      {
        round: 1,
        action: 'REJECTED',
        timestamp: '2026-03-06 12:10:00',
        reviewer: 'Admin Compliance',
        notes:
          'BWF mat thickness certification and clear floodlight lux test report missing. Please re-upload verified technical specs.',
      },
    ],
    created_at: '2026-03-05 16:40:00',
    updated_at: '2026-03-06 12:10:00',
  },
  {
    id: 'CRQ-2603-104',
    venue_id: 'ven_1001',
    venue_name: 'skywalk sports',
    venue_city: 'Coimbatore, Tamil Nadu',
    owner_name: 'Shruthi jayamadhu',
    owner_phone: '+91 6369591821',
    same_physical_sports: false,
    sport: 'Pickleball',
    court_name: 'Pickleball Pro Court 1',
    display_name: 'Tournament Grade Pickleball Court A',
    min_booking_duration: '1 Hour',
    price_per_hour: 800,
    peak_hours_start: '06:00 PM',
    peak_hours_end: '10:00 PM',
    peak_price: 1100,
    weekend_price: 1000,
    peak_days: ['Sat', 'Sun'],
    cancellation_window_hours: 12,
    refund_percentage: 100,
    status: 'APPROVED',
    submission_count: 1,
    reviewed_by: 'Super Admin',
    reviewed_at: '2026-03-08 10:15:30',
    history: [
      {
        round: 1,
        action: 'SUBMITTED',
        timestamp: '2026-03-07 14:00:00',
        notes: 'Dedicated pickleball court.',
      },
      {
        round: 1,
        action: 'APPROVED',
        timestamp: '2026-03-08 10:15:30',
        reviewer: 'Super Admin',
        notes: 'Specs verified against tournament standards. Activated.',
      },
    ],
    created_at: '2026-03-07 14:00:00',
    updated_at: '2026-03-08 10:15:30',
  },
];
