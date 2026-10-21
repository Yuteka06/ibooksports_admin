/**
 * Vendor settlement display helpers. Fees are computed by the backend
 * (backend/src/common/utils/settlement-fees.ts), on the amount paid ONLINE: venue convenience fee 0.1737% (admin
 * income) + 18% GST, then Razorpay Route fee 0.25% + 18% GST on what is left (≈0.5% in all). Cash carries no fee.
 */
/** Total fee deducted from a settlement batch or booking line (venue convenience + Route). */
export const settlementDeduction = (s: { venue_platform_fee: number }) => s.venue_platform_fee;

/** ₹ amount with paise, e.g. 1234.5 → "1,234.50". */
export const formatInr = (value?: number) =>
  Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
