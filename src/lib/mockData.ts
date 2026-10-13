// Production TypeScript Type Definitions for iBookSports Super Admin Suite

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
  operating_hours?: {
    working_days?: string[];
    operating_time?: string;
    closing_time?: string;
    day_schedules?: {
      day: string;
      label?: string;
      is_open: boolean;
      open_time: string;
      close_time: string;
    }[];
  };

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
    pan_document_id?: string;
    aadhaar_masked: string;
    aadhaar_status: 'VERIFIED' | 'PENDING';
    aadhaar_document_id?: string;
    profile_photo_document_id?: string;
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
    branch_proof_document_id?: string;
    upi_id: string;
    verification_status: 'VERIFIED' | 'PENDING';
    penny_drop_status: 'SUCCESS' | 'FAILED';
    last_payout_date: string;
  };

  gst_document_id?: string;
  court_photos?: string[];

  // Courts
  court_list: {
    id: string;
    name: string;
    display_name?: string;
    sport: string;
    surface: string;
    court_type: 'OUTDOOR' | 'INDOOR' | 'COVERED ROOF';
    environment?: 'OUTDOOR' | 'INDOOR' | 'COVERED ROOF';
    dimensions: string;
    lighting: string;
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
  payment_status: 'PAID' | 'PARTIAL_PAID' | 'ADVANCE_PAID' | 'PENDING' | 'REFUNDED' | 'FAILED';
  booking_status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'IN_PLAY' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  payment_method: 'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'NET_BANKING' | 'WALLET' | 'ONLINE_LINK' | 'CASH' | string;
  transaction_id: string;
  created_at: string;
  hold_started_at?: string;
  hold_expires_at?: string;
  expired_at?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  refund_amount?: number;
  refund_status?: 'REFUNDED' | 'PROCESSING' | 'WALLET_CREDITED' | 'NOT_APPLICABLE';
  refund_utr?: string;
  advance_amount?: number;
  balance_amount?: number;
  due_mode?: 'CASH' | 'ONLINE';
  state?: string;
  district?: string;
}

export type PaymentStatusType = 'FULLY_PAID' | 'ADVANCE_PAID' | 'PENDING' | 'REFUNDED' | 'FAILED';
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
  total_booking_amount: number;
  gross_amount: number;
  received_amount: number;
  balance_amount: number;
  advance_percentage?: number;
  payment_status: PaymentStatusType;
  gateway_fee: number;
  platform_commission: number;
  tax_gst: number;
  net_venue_payout: number;
  payment_type: PaymentMethodCategory;
  payment_method: string;
  gateway: 'RAZORPAY' | 'PHONEPE' | 'CASHFREE' | 'DIRECT_VENUE';
  status: 'SUCCESS' | 'REFUNDED' | 'FAILED' | 'PROCESSING';
  timestamp: string;
  invoice_number?: string;
  payment_link?: string;
  balance_payment_link?: string;
  slot_time?: string;
  booking_date?: string;
  due_mode?: 'CASH' | 'ONLINE';
  created_at?: string;
  state?: string;
  district?: string;
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
  settlement_date: string;
  cycle_month: string;
  cycle_year: number;
  t_plus_days: number;
  bookings_count: number;
  actual_court_price_total: number;
  gross_booking_amount: number;
  online_advance_held: number;
  cash_collected_at_venue: number;
  platform_commission_deducted: number;
  platform_fee_gst: number;
  tds_deducted: number;
  net_payable: number;
  status: 'SETTLED' | 'PROCESSING' | 'PENDING_APPROVAL';
  utr_number?: string;
  settled_at?: string;
  itemized_bookings?: SettlementBookingItem[];
}

export interface SupportTicketItem {
  id: string;
  ticket_number: string;
  category: 'PAYMENT' | 'BOOKING' | 'TECHNICAL' | 'SETTLEMENTS' | 'GENERAL' | 'OTHERS';
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  subject: string;
  description: string;
  related_booking_code?: string;
  attachment_url?: string;
  attachment_name?: string;
  venue_id: string;
  venue_name: string;
  created_person_name: string;
  contact_number: string;
  created_at: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  resolution_notes?: string;
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
  court_id?: string;
  venue_id: string;
  venue_name: string;
  venue_city: string;
  owner_name: string;
  owner_phone: string;
  same_physical_sports: boolean;
  parent_court_name?: string;
  sport: string;
  court_name: string;
  display_name: string;
  min_booking_duration: string;
  min_booking_duration_label?: string;
  min_booking_duration_mins?: number;
  price_per_hour: number;
  regular_price?: number;
  peak_hours_start: string;
  peak_hours_end: string;
  peak_price: number;
  weekend_price: number;
  peak_days: string[];
  cancellation_window_hours: number;
  cancellation_policy_hours?: number;
  refund_percentage: number;
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

// Clean production empty initial state constants (no mock data)
export const INITIAL_VENUES: VenueDetail[] = [];
export const INITIAL_CUSTOMERS: CustomerItem[] = [];
export const INITIAL_BOOKINGS: BookingItem[] = [];
export const INITIAL_PAYMENTS: PaymentTransactionItem[] = [];
export const INITIAL_SETTLEMENTS: SettlementBatchItem[] = [];
export const INITIAL_SUPPORT_TICKETS: SupportTicketItem[] = [];
export const INITIAL_AUDIT_LOGS: any[] = [];
export const INITIAL_COURT_REQUESTS: CourtExtensionRequest[] = [];
