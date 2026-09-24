import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://ibooksports-backend.onrender.com/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

// Rule 11 & Rule 8: Request Interceptor for Auth & Debug Logging
apiClient.interceptors.request.use(
  (config) => {
      let token =
        localStorage.getItem('ibooksports_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('onboarding_token');

      if (!token) {
        try {
          const adminAuth = localStorage.getItem('ibooksports_admin_auth');
          if (adminAuth) {
            const parsed = JSON.parse(adminAuth);
            token = parsed?.token;
          }
        } catch {}
      }

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    // Rule 19: Log API calls during development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API ${config.method?.toUpperCase()}]`, config.url);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Rule 11, 12, 6: Response Interceptor handling status codes & meaningful errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    let customErrorMsg = '';

    if (status === 400) {
      customErrorMsg = error.response?.data?.message || 'Bad Request: Please verify submitted information.';
    } else if (status === 401) {
      customErrorMsg = 'Unauthorized: Session expired or invalid credentials.';
    } else if (status === 403) {
      customErrorMsg = 'Forbidden: You do not have permission to access this resource.';
    } else if (status === 404) {
      customErrorMsg = error.response?.data?.message || 'Requested resource not found.';
    } else if (status === 409) {
      customErrorMsg = error.response?.data?.message || 'Conflict: Slot or resource is already locked or booked.';
    } else if (status >= 500) {
      customErrorMsg = 'Internal Server Error: Backend service is experiencing temporary issues. Please retry.';
    } else {
      customErrorMsg =
        error.response?.data?.message ||
        error.message ||
        'An unexpected network error occurred. Please check your connection.';
    }

    const messageStr = Array.isArray(customErrorMsg)
      ? customErrorMsg.join(', ')
      : String(customErrorMsg);

    return Promise.reject(new Error(messageStr));
  },
);

export interface SendWebsiteOtpPayload {
  mobile_number: string;
}

export interface VerifyWebsiteOtpPayload {
  verification_id: string;
  mobile_number: string;
  otp: string;
}

export interface SubmitLeadPayload {
  verification_token: string;
  full_name?: string;
  business_name: string;
  venue_name: string;
  email: string;
  mobile_number: string;
  venue_location: {
    address: string;
    state?: string;
    district?: string;
    latitude?: number;
    longitude?: number;
    google_maps_url?: string;
  };
  sports_provided: string[];
  number_of_courts: number;
}

export interface SubmitVenueDetailsPayload {
  name: string;
  email?: string;
  mobile_number: number;
  venue_name: string;
  venue_location_name: string;
  state: string;
  district: string;
  sports: string;
}

export interface VenueResponse {
  success: boolean;
  message: string;
  data: {
    id?: string;
    requestId?: string;
    request_id?: string;
    name: string;
    email?: string;
    mobile_number: number;
    venue_name: string;
    venue_location_name: string;
    state: string;
    district: string;
    sports: string;
  };
}

export interface CorrectionItemPayload {
  step_number: number;
  section_name: string;
  field_name: string;
  rejection_reason: string;
  correction_instruction: string;
}

export interface UpdateRequestStatusPayload {
  request_status: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  approval_access_link?: string;
  correction_items?: CorrectionItemPayload[];
  // Fallback fields — sent so backend can email even if request isn't in memory
  requester_name?: string;
  requester_email?: string;
  venue_name?: string;
  mobile_number?: string;
}

export interface BankDetailsItem {
  account_holder_name: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  account_type: string;
  branch_name?: string;
  cancelled_cheque_url?: string;
  reason_for_change: string;
}

export interface CourtDetailsItem {
  court_name: string;
  sport_type: string;
  surface_type: string;
  hourly_rate: number;
  court_dimensions?: string;
  lighting_available?: boolean;
  indoor_outdoor?: 'INDOOR' | 'OUTDOOR';
  remarks?: string;
}

export interface PartnerRequestItem {
  request_id: string;
  request_type?: 'ONBOARDING' | 'BANK_CHANGE' | 'COURT_CHANGE';
  requester_name: string;
  requester_email: string;
  mobile_number: string;
  venue_name: string;
  venue_location: string;
  state: string;
  district: string;
  sports: string[];
  number_of_courts: number;
  request_status: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  status_updated_at: string;
  created_at: string;
  approval_access_link?: string;
  onboarding_token_hash?: string;
  onboarding_token_expiry?: string;
  onboarding_token_used_at?: string;
  onboarding_link_sent_at?: string;
  raw_onboarding_token?: string;
  bank_details?: BankDetailsItem;
  court_details?: CourtDetailsItem;
  rejection_reason?:
  | 'SUSPICIOUS'
  | 'FAKE'
  | 'INCOMPLETE'
  | 'NOT_ELIGIBLE'
  | 'OTHER';
  rejection_note?: string;
  rejected_by_admin_id?: string;
  rejected_at?: string;
  correction_items?: CorrectionItemPayload[];
}

export interface EmailLogItem {
  id: string;
  request_id: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  template_type:
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'ONBOARDING_SUBMITTED'
  | 'VENUE_ACTIVATED'
  | 'ONBOARDING_REJECTED';
  html_content: string;
  sent_at: string;
  status: 'SENT' | 'DELIVERED';
}

export interface DashboardStats {
  total_leads: number;
  pending_review: number;
  approved_partners: number;
  rejected_leads: number;
  active_venues: number;
  total_courts: number;
  monthly_booking_volume: string;
}

export interface AmenityItem {
  amenity_id: string;
  name: string;
  category: string;
  icon?: string;
}

export interface SportCategoryItem {
  category_id: string;
  name: string;
  description: string;
}

export interface SportItem {
  sport_id: string;
  name: string;
  category_id: string;
  category_name: string;
  icon: string;
  supported_formats: string[];
  amenities: AmenityItem[];
  is_active: boolean;
}

export interface VenueItem {
  id: string;
  venue_name: string;
  name: string;
  mobile_number: number;
  venue_location_name: string;
  state: string;
  district: string;
  sports: string;
  courts?: number;
  status?: string;
}

export const websiteApi = {
  sendOtp: async (data: SendWebsiteOtpPayload) => {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      verification_id: string;
    }>('/website/request/send-otp', data);
    return response.data;
  },

  verifyOtp: async (data: VerifyWebsiteOtpPayload) => {
    const response = await apiClient.post<{
      verified: boolean;
      verification_token: string;
      message: string;
    }>('/website/request/verify-otp', data);
    return response.data;
  },

  submitLead: async (data: SubmitLeadPayload) => {
    const response = await apiClient.post<{
      success: boolean;
      application_id: string;
      status: string;
      message: string;
    }>('/website/request-ibooksports', data);
    return response.data;
  },

  submitVenueDetails: async (
    data: SubmitVenueDetailsPayload,
    token?: string,
  ) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const response = await apiClient.post<VenueResponse>('/venues', data, {
      headers,
    });
    return response.data;
  },
};

export const adminApi = {
  // Requests Management
  getRequests: async (status?: string) => {
    try {
      const params = status && status !== 'ALL' ? { status } : {};
      const response = await apiClient.get<PartnerRequestItem[]>('/requests', {
        params,
      });
      return response.data || [];
    } catch {
      return [];
    }
  },

  getRequestById: async (id: string) => {
    const response = await apiClient.get<PartnerRequestItem>(`/requests/${id}`);
    return response.data;
  },

  updateRequestStatus: async (
    id: string,
    payload: UpdateRequestStatusPayload & {
      rejection_reason?: string;
      rejection_note?: string;
      admin_id?: string;
    },
  ) => {
    const response = await apiClient.patch<{
      success: boolean;
      request_id: string;
      request_status: string;
      notification: { email_queued: boolean; recipient: string };
    }>(`/requests/${id}/status`, payload);
    return response.data;
  },

  resendOnboardingLink: async (id: string) => {
    const response = await apiClient.post<{
      success: boolean;
      request_id: string;
      onboarding_link: string;
      raw_token: string;
      expires_at: string;
      link_sent_at: string;
      email_log_id: string;
    }>(`/requests/${id}/resend-link`);
    return response.data;
  },

  getDashboardStats: async () => {
    try {
      const response = await apiClient.get<DashboardStats>(
        '/requests/stats/overview',
      );
      return response.data;
    } catch (e) {
      console.warn('Could not fetch dashboard stats:', (e as Error).message);
      return {
        total_leads: 0,
        pending_review: 0,
        approved_partners: 0,
        rejected_leads: 0,
        active_venues: 0,
        total_courts: 0,
        monthly_booking_volume: '₹0',
      };
    }
  },

  // Email Logs
  getEmailLogs: async () => {
    try {
      const response = await apiClient.get<EmailLogItem[]>(
        '/requests/emails/logs',
      );
      return response.data || [];
    } catch (e) {
      console.warn('Could not fetch email logs:', (e as Error).message);
      return [];
    }
  },

  getEmailById: async (id: string) => {
    const response = await apiClient.get<EmailLogItem>(
      `/requests/emails/${id}`,
    );
    return response.data;
  },

  // Venues Management
  getVenues: async () => {
    try {
      const response = await apiClient.get<VenueItem[]>('/venues');
      return response.data || [];
    } catch (e) {
      console.warn('Could not fetch venues:', (e as Error).message);
      return [];
    }
  },

  getVenueById: async (id: string) => {
    const response = await apiClient.get<any>(`/venues/${id}`);
    return response.data;
  },

  getVenueStaff: async (venueId: string) => {
    try {
      const response = await apiClient.get<any[]>(`/venues/${venueId}/staff`);
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data.map((s, idx) => ({
          id: s.id || s.db_id,
          db_id: s.db_id || s.id,
          staff_id: s.staff_id || s.display_id || `STF-${String(idx + 1).padStart(2, '0')}`,
          display_id: s.display_id || s.staff_id || `STF-${String(idx + 1).padStart(2, '0')}`,
          venue_id: s.venue_id || s.venueId || venueId,
          name: s.name || s.staff_name,
          role: s.role || s.staff_role || 'Staff',
          phone: s.phone || s.mobile_number || s.staff_contact || '',
          mobile_number: s.mobile_number || s.phone || s.staff_contact || '',
          email: s.email || '',
          shift: s.shift || s.shift_hours || 'Full Day',
          shift_hours: s.shift_hours || s.shift || 'Full Day',
          status: (s.status?.toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE') as 'ACTIVE' | 'INACTIVE',
          manage_bookings: s.manage_bookings ?? s.manageBookings ?? true,
          collect_cash: s.collect_cash ?? s.collectCash ?? false,
          block_slots: s.block_slots ?? s.blockSlots ?? false,
          view_finances: s.view_finances ?? s.viewFinances ?? false,
          edit_pricing: s.edit_pricing ?? s.editPricing ?? false,
        }));
      }
    } catch (e) {
      console.warn('Could not fetch venue staff from backend:', (e as Error).message);
    }
    return [];
  },

  createVenueStaff: async (payload: {
    venue_id: string;
    name: string;
    role: string;
    phone: string;
    email?: string;
    shift?: string;
    status?: string;
  }) => {
    try {
      const res = await apiClient.post('/vendor-staff', payload);
      return res.data;
    } catch (e) {
      console.warn('createVenueStaff backend error:', e);
      throw e;
    }
  },

  updateVenueStaff: async (staffId: string, data: any) => {
    try {
      const res = await apiClient.patch(`/vendor-staff/${staffId}`, data);
      return res.data;
    } catch (e) {
      console.warn('updateVenueStaff backend error:', e);
      throw e;
    }
  },

  deleteVenueStaff: async (staffId: string) => {
    try {
      const res = await apiClient.delete(`/vendor-staff/${staffId}`);
      return res.data;
    } catch (e) {
      console.warn('deleteVenueStaff backend error:', e);
      throw e;
    }
  },



  // Sports & Amenities
  getSports: async () => {
    try {
      const response = await apiClient.get<SportItem[]>('/sports');
      return response.data || [];
    } catch (e) {
      console.warn('Could not fetch sports:', (e as Error).message);
      return [];
    }
  },

  createSport: async (data: {
    sport_id: string;
    name: string;
    supported_formats: string[];
    is_active?: boolean;
  }) => {
    const response = await apiClient.post<SportItem>('/sports', data);
    return response.data;
  },

  updateSport: async (
    id: string,
    data: {
      sport_id?: string;
      name?: string;
      supported_formats?: string[];
      is_active?: boolean;
    },
  ) => {
    const response = await apiClient.patch<SportItem>(`/sports/${id}`, data);
    return response.data;
  },

  deleteSport: async (id: string) => {
    const response = await apiClient.delete<{
      success: boolean;
      deleted_id: string;
      message: string;
    }>(`/sports/${id}`);
    return response.data;
  },

  getAmenities: async () => {
    try {
      const response = await apiClient.get<AmenityItem[]>('/sports/amenities');
      return response.data || [];
    } catch (e) {
      console.warn('Could not fetch amenities:', (e as Error).message);
      return [];
    }
  },

  createAmenity: async (data: {
    amenity_id?: string;
    name: string;
    category?: string;
    icon?: string;
  }) => {
    const response = await apiClient.post<AmenityItem>('/sports/amenities', data);
    return response.data;
  },

  updateAmenity: async (
    id: string,
    data: { name?: string; category?: string; icon?: string },
  ) => {
    const response = await apiClient.patch<AmenityItem>(`/sports/amenities/${id}`, data);
    return response.data;
  },

  deleteAmenity: async (id: string) => {
    const response = await apiClient.delete<{
      success: boolean;
      deleted_id: string;
      message: string;
    }>(`/sports/amenities/${id}`);
    return response.data;
  },

  getCategories: async () => {
    try {
      const response = await apiClient.get<SportCategoryItem[]>('/sports/categories');
      return response.data || [];
    } catch (e) {
      console.warn('Could not fetch categories:', (e as Error).message);
      return [];
    }
  },

  createCategory: async (data: {
    category_id?: string;
    name: string;
    description?: string;
  }) => {
    const response = await apiClient.post<SportCategoryItem>('/sports/categories', data);
    return response.data;
  },

  updateCategory: async (
    id: string,
    data: { name?: string; description?: string },
  ) => {
    const response = await apiClient.patch<SportCategoryItem>(`/sports/categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id: string) => {
    const response = await apiClient.delete<{
      success: boolean;
      deleted_id: string;
      message: string;
    }>(`/sports/categories/${id}`);
    return response.data;
  },

  // CMS & Policies Management
  getCmsDocuments: async () => {
    try {
      const response = await apiClient.get<CmsDocumentItem[]>('/cms/admin/documents');
      return response.data || [];
    } catch (e) {
      console.warn('Could not fetch CMS documents:', (e as Error).message);
      return [];
    }
  },

  getCmsDocument: async (slug: string) => {
    const response = await apiClient.get<CmsDocumentItem>(`/cms/admin/documents/${slug}`);
    return response.data;
  },

  updateCmsDocument: async (slug: string, data: Partial<CmsDocumentItem>) => {
    const response = await apiClient.put<CmsDocumentItem>(`/cms/admin/documents/${slug}`, data);
    return response.data;
  },

  getPublicCmsDocument: async (slug: string) => {
    const response = await apiClient.get<CmsDocumentItem>(`/cms/public/${slug}`);
    return response.data;
  },

  // Court Requests Management
  getCourtRequests: async (status?: string) => {
    try {
      const params = status && status !== 'ALL' ? { status } : {};
      const response = await apiClient.get<CourtRequestItem[]>('/court-requests', { params });
      return response.data || [];
    } catch (e) {
      console.warn('Could not fetch court requests:', (e as Error).message);
      return [];
    }
  },

  getCourtRequestById: async (id: string) => {
    const response = await apiClient.get<CourtRequestItem>(`/court-requests/${id}`);
    return response.data;
  },

  createCourtRequest: async (payload: {
    court_name: string;
    display_name?: string;
    sports: string[];
    price_per_hour: number;
    min_booking_duration?: string;
    peak_hours_start?: string;
    peak_hours_end?: string;
    peak_hours_price?: number;
    peak_days?: string[];
    weekend_price?: number;
    type?: 'Outdoor' | 'Indoor' | 'Covered';
    same_physical_sports?: boolean;
    parent_court_name?: string;
    cancellation_window_hours?: number;
    refund_percentage?: number;
    venue_name: string;
    venue_city?: string;
    vendor_mobile: string;
    vendor_name?: string;
    notes?: string;
  }) => {
    const response = await apiClient.post<CourtRequestItem>('/court-requests', payload);
    return response.data;
  },

  reviewCourtRequest: async (
    id: string,
    payload: { status: 'APPROVED' | 'REJECTED'; rejection_reason?: string; reviewer_name?: string },
  ) => {
    const response = await apiClient.patch<CourtRequestItem>(`/court-requests/${id}/review`, payload);
    return response.data;
  },
};

export interface CourtRequestItem {
  id: string;
  court_id?: string;
  court_name: string;
  display_name?: string;
  sports: string[];
  price_per_hour: number;
  min_booking_duration?: string;
  peak_hours_start?: string;
  peak_hours_end?: string;
  peak_hours_price?: number;
  peak_days?: string[];
  weekend_price?: number;
  type?: 'Outdoor' | 'Indoor' | 'Covered';
  same_physical_sports?: boolean;
  parent_court_id?: string;
  parent_court_name?: string;
  cancellation_window_hours?: number;
  refund_percentage?: number;
  cancellation_policy_label?: string;
  venue_name: string;
  venue_city?: string;
  vendor_mobile: string;
  vendor_name?: string;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason?: string;
  reviewer_name?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CmsFaqItem {
  id: string;
  category: string;
  category_label: string;
  question: string;
  answer: string;
  tags?: string[];
  order?: number;
}

export interface CmsDocumentItem {
  slug: string;
  title: string;
  submodule: 'faq' | 'privacy' | 'terms';
  version: string;
  effective_date: string;
  status: 'DRAFT' | 'PUBLISHED';
  rich_text_html: string;
  faqs?: CmsFaqItem[];
  updated_at: string;
  updated_by?: string;
}

export interface OnboardingRejectionReason {
  step: number;
  section: string;
  field: string;
  reason: string;
}

export interface OnboardingStatusResponse {
  application_id: string;
  status: 'DRAFT' | 'SUBMITTED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  current_step: number;
  updated_at: string;
  message: string;
  app_access_link?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejection_reasons?: OnboardingRejectionReason[];
}

export interface OnboardingSessionData {
  session_id: string;
  application_id: string;
  onboarding_token: string;
  current_step: number;
  mobile_number: string;
  mobile_verified: boolean;
  partner_details?: {
    name: string;
    mobile_number: string;
    email: string;
    aadhaar_document_id: string;
    profile_photo_document_id: string;
    address: string;
    state: string;
    district: string;
    pincode: string;
  };
  business_details?: {
    venue_name: string;
    venue_email: string;
    venue_mobile_number: string;
    venue_address: string;
    venue_google_maps_link: string;
    has_gst: boolean;
    gst_number?: string;
    gst_document_id?: string;
  };
  court_photos?: string[];
  operating_hours?: {
    working_days: string[];
    operating_time: string;
    closing_time: string;
    starting_time: string;
    day_schedules?: Array<{
      day: string;
      is_open: boolean;
      open_time?: string;
      close_time?: string;
    }>;
  };
  courts_config?: {
    number_of_sports: number;
    sports: string[];
    courts: Array<{
      court_name: string;
      display_name: string;
      sports: string[];
      minimum_booking_time_minutes: number;
      regular_price: number;
      peak_days: string[];
      peak_hours: Array<{ start_time: string; end_time: string }>;
      peak_hour_price: number;
      weekend_price: number;
      advance_booking_price: number;
      use_one_physical_court_for_two_sports: boolean;
      is_same_sport_as_above?: boolean;
      shared_with_court_index?: number;
      cancellation_window_hours?: number;
      refund_percentage?: number;
    }>;
    cancellation_window_hours?: number;
    refund_percentage?: number;
  };
  bank_details?: {
    account_holder_name: string;
    bank_name: string;
    account_number: string;
    confirm_account_number: string;
    branch_name: string;
    ifsc_code: string;
    account_type: string;
    branch_proof_document_id: string;
  };
  status: 'DRAFT' | 'SUBMITTED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  rejection_reasons?: OnboardingRejectionReason[];
  app_access_link?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  created_at: string;
  updated_at: string;
}

export const onboardingApi = {
  // Dedicated Partner Login - Send OTP
  sendLoginOtp: async (mobile_number: string) => {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      verification_id: string;
      reqId?: string;
      expires_in_seconds: number;
    }>('/onboarding/auth/send-otp', { mobile_number });
    return response.data;
  },

  // Dedicated Partner Login - Verify OTP & Login
  login: async (mobile_number: string, otp: string, verification_id?: string) => {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      onboarding_token: string;
      application_id: string;
      current_step: number;
      session?: OnboardingSessionData;
    }>('/onboarding/auth/login', { mobile_number, otp, verification_id });
    return response.data;
  },

  // Step 1: Send OTP
  sendOtp: async (mobile_number: string) => {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      verification_id: string;
      expires_in_seconds: number;
    }>('/onboarding/send-otp', { mobile_number });
    return response.data;
  },

  // Step 1: Verify OTP
  verifyOtp: async (verification_id: string, mobile_number: string, otp: string) => {
    const response = await apiClient.post<{
      success: boolean;
      mobile_verified: boolean;
      onboarding_token: string;
      application_id: string;
      current_step: number;
    }>('/onboarding/verify-otp', { verification_id, mobile_number, otp });
    return response.data;
  },

  // Step 1: Resend OTP
  resendOtp: async (mobile_number: string, verification_id: string) => {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      verification_id: string;
      expires_in_seconds: number;
    }>('/onboarding/resend-otp', { mobile_number, verification_id });
    return response.data;
  },

  // Document Upload
  uploadDocument: async (token: string, file: File, document_type: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', document_type);

    const response = await apiClient.post<{
      success: boolean;
      document_id: string;
      document_type: string;
      file_name: string;
      file_size_bytes: number;
      file_url?: string;
      message: string;
    }>('/onboarding/documents/upload', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get viewable URL for an uploaded document or photo
  getDocumentUrl: (docId?: string | null) => {
    if (!docId) return '';
    if (docId.startsWith('http') || docId.startsWith('data:') || docId.startsWith('blob:')) return docId;
    return `${API_BASE_URL}/onboarding/documents/${docId}/view`;
  },

  // Step 2: Save Partner Details
  savePartnerDetails: async (token: string, data: OnboardingSessionData['partner_details']) => {
    const response = await apiClient.put<{
      success: boolean;
      message: string;
      current_step: number;
    }>('/onboarding/partner-details', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Step 3: Save Business Details
  saveBusinessDetails: async (token: string, data: OnboardingSessionData['business_details']) => {
    const response = await apiClient.put<{
      success: boolean;
      message: string;
      current_step: number;
    }>('/onboarding/business-details', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Step 4: Save Court Photos
  saveCourtPhotos: async (token: string, court_photo_document_ids: string[]) => {
    const response = await apiClient.put<{
      success: boolean;
      message: string;
      photos_count: number;
      current_step: number;
    }>('/onboarding/court-photos', { court_photo_document_ids }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Step 5: Save Operating Hours
  saveOperatingHours: async (token: string, data: OnboardingSessionData['operating_hours']) => {
    const response = await apiClient.put<{
      success: boolean;
      message: string;
      current_step: number;
    }>('/onboarding/operating-hours', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Step 5: Save Sports and Courts
  saveCourts: async (token: string, data: OnboardingSessionData['courts_config']) => {
    const response = await apiClient.put<{
      success: boolean;
      message: string;
      courts_count: number;
      current_step: number;
    }>('/onboarding/courts', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  saveCourtsConfig: async (token: string, data: OnboardingSessionData['courts_config']) => {
    const response = await apiClient.put<{
      success: boolean;
      message: string;
      courts_count: number;
      current_step: number;
    }>('/onboarding/courts', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Step 6: Save Bank Details
  saveBankDetails: async (token: string, data: OnboardingSessionData['bank_details']) => {
    const response = await apiClient.put<{
      success: boolean;
      message: string;
      current_step: number;
    }>('/onboarding/bank-details', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Step 7: Submit Application
  submitApplication: async (
    token: string,
    payload: boolean | { declaration_accepted: boolean },
  ) => {
    const declaration_accepted =
      typeof payload === 'boolean' ? payload : payload.declaration_accepted;
    const response = await apiClient.post<{
      success: boolean;
      application_id: string;
      status: 'PENDING_REVIEW';
      message: string;
      updated_at: string;
    }>('/onboarding/submit', { declaration_accepted }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Step 8: Get Status
  getStatus: async (token: string) => {
    const response = await apiClient.get<OnboardingStatusResponse>('/onboarding/status', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Get Saved Session Data
  getSession: async (token: string) => {
    const response = await apiClient.get<OnboardingSessionData>('/onboarding/session', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Super Admin: List all onboarding applications
  listAdminApplications: async () => {
    const response = await apiClient.get<OnboardingSessionData[]>('/onboarding/admin/applications');
    return response.data;
  },

  // Super Admin: Review Application
  reviewApplication: async (
    applicationId: string,
    action: 'APPROVE' | 'REJECT',
    payload?: {
      rejection_reasons?: OnboardingRejectionReason[];
      app_access_link?: string;
      admin_id?: string;
    },
  ) => {
    const response = await apiClient.post<OnboardingStatusResponse>(
      `/onboarding/admin/review/${applicationId}`,
      { action, ...payload },
    );
    return response.data;
  },
};

export interface RoleMetadata {
  key: string;
  title: string;
  badge_color: string;
  description: string;
  permissions: string[];
}

export interface StaffItem {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  role: string;
  role_title: string;
  department: string;
  status: 'ACTIVE' | 'INACTIVE';
  avatar_color: string;
  created_at: string;
  last_login_at: string;
}

export interface StaffStats {
  total_staff: number;
  active_staff: number;
  inactive_staff: number;
  verification_officers: number;
  support_agents: number;
}

export interface CreateStaffPayload {
  name: string;
  email: string;
  phone_number: string;
  role: string;
  department?: string;
}

export interface UpdateStaffPayload {
  name?: string;
  email?: string;
  phone_number?: string;
  role?: string;
  department?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export const staffApi = {
  getRoles: async () => {
    const response = await apiClient.get<RoleMetadata[]>('/staff/roles');
    return response.data;
  },

  getStats: async () => {
    const response = await apiClient.get<StaffStats>('/staff/stats');
    return response.data;
  },

  getAllStaff: async (query?: string, role?: string, status?: string) => {
    const params: Record<string, string> = {};
    if (query) params.query = query;
    if (role && role !== 'ALL') params.role = role;
    if (status && status !== 'ALL') params.status = status;
    const response = await apiClient.get<StaffItem[]>('/staff', { params });
    return response.data;
  },

  getStaffById: async (id: string) => {
    const response = await apiClient.get<StaffItem>(`/staff/${id}`);
    return response.data;
  },

  createStaff: async (data: CreateStaffPayload) => {
    const response = await apiClient.post<StaffItem>('/staff', data);
    return response.data;
  },

  updateStaff: async (id: string, data: UpdateStaffPayload) => {
    const response = await apiClient.patch<StaffItem>(`/staff/${id}`, data);
    return response.data;
  },

  toggleStatus: async (id: string) => {
    const response = await apiClient.patch<StaffItem>(`/staff/${id}/status`);
    return response.data;
  },

  deleteStaff: async (id: string) => {
    const response = await apiClient.delete<{
      success: boolean;
      message: string;
      deleted_id: string;
    }>(`/staff/${id}`);
    return response.data;
  },
};

export const customerApi = {
  getCustomers: async (params?: { query?: string; tier?: string; sortBy?: string }) => {
    const response = await apiClient.get('/customers', { params });
    return response.data || [];
  },

  getCustomerStats: async () => {
    const response = await apiClient.get('/customers/stats/overview');
    return response.data;
  },

  getCustomerById: async (id: string) => {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data;
  },

  getAllBookings: async () => {
    const response = await apiClient.get('/customers/bookings/all');
    return response.data || [];
  },

  getAllPayments: async () => {
    const response = await apiClient.get('/customers/payments/all');
    return response.data || [];
  },

  cancelAndRefundBooking: async (bookingId: string, reason?: string) => {
    const response = await apiClient.post(`/customers/bookings/${bookingId}/cancel-refund`, {
      reason,
    });
    return response.data;
  },

  createCustomer: async (data: any) => {
    const response = await apiClient.post('/customers', data);
    return response.data;
  },

  updateCustomer: async (id: string, data: any) => {
    const response = await apiClient.patch(`/customers/${id}`, data);
    return response.data;
  },
};

export const vendorStaffApi = {
  getStaff: async (params?: {
    venueId?: string;
    courtId?: string;
    role?: string;
    status?: string;
    query?: string;
  }) => {
    const response = await apiClient.get<any[]>('/vendor/staff', { params });
    return response.data || [];
  },

  getStaffById: async (id: string) => {
    const response = await apiClient.get<any>(`/vendor-staff/${id}`);
    return response.data;
  },

  createStaff: async (data: {
    venueId?: string;
    name: string;
    role: string;
    phone: string;
    email?: string;
    shift?: string;
    courtId?: string;
    status?: string;
    manageBookings?: boolean;
    collectCash?: boolean;
    blockSlots?: boolean;
    viewFinances?: boolean;
    editPricing?: boolean;
  }) => {
    const response = await apiClient.post<any>('/vendor/staff', data);
    return response.data;
  },

  updateStaff: async (id: string, data: any) => {
    const response = await apiClient.patch<any>(`/vendor-staff/${id}`, data);
    return response.data;
  },

  deleteStaff: async (id: string) => {
    const response = await apiClient.delete<any>(`/vendor-staff/${id}`);
    return response.data;
  },
};


