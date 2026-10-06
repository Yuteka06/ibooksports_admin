/**
 * Authoritative Auth & Vendor State Storage Utility
 * Ensures 100% data isolation between multiple vendor logins.
 */

export const VENDOR_AUTH_KEYS = [
  'accessToken',
  'auth_token',
  'bearerToken',
  'bearer_token',
  'token',
  'userToken',
  'ibooksports_token',
  'ibooksports_vendor_token',
  'ibooksports_onboarding_token',
  'turftown_token',
  'vendor_auth_token',
  'application_id',
  'vendor_login_phone',
  'vendor_otp_verification_id',
  'ibooksports_partner_mobile',
  'owner_name',
  'turftown_current_user',
  'ibooksports_current_user',
  'ibooksports_user',
  'turftown_pending_user',
  'ibooksports_bookings',
  'turftown_bookings',
  'ibooksports_payments',
  'turftown_payments',
  'ibooksports_vendor_courts',
  'ibooksports_courts',
  'turftown_courts',
  'ibooksports_staff_members',
  'turftown_staff_members',
  'ibooksports_amenities',
  'ibooksports_blocked_slots',
  'ibooksports_operating_hours',
  'turftown_operating_hours',
  'ibooksports_current_screen',
  'ibooksports_selected_court',
  'ibooksports_support_tickets',
  'ibooksports_live_venues',
  'ibooksports_court_requests',
];

/**
 * Completely purges all previous vendor identity, tokens, and cached datasets
 * from both sessionStorage and localStorage.
 */
export function purgeAllVendorSessionStorage() {
  if (typeof window === 'undefined') return;

  try {
    // 1. Explicitly remove all known auth and data keys
    VENDOR_AUTH_KEYS.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    // 2. Pattern-based purge for any dynamically prefixed keys
    const purgeDynamic = (storage: Storage) => {
      const keysToRemove: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (
          k &&
          (k.startsWith('ibooksports_') ||
            k.startsWith('turftown_') ||
            k.startsWith('vendor_') ||
            k.startsWith('onboarding_') ||
            k.toLowerCase().includes('token') ||
            k.toLowerCase().includes('booking') ||
            k.toLowerCase().includes('court') ||
            k.toLowerCase().includes('owner'))
        ) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => storage.removeItem(k));
    };

    purgeDynamic(localStorage);
    purgeDynamic(sessionStorage);
  } catch (err) {
    console.warn('[authStorage] Error purging vendor session storage:', err);
  }
}
