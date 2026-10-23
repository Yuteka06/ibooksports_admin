/**
 * Vendor settlement display helpers. Fees are computed by the backend (backend/src/common/utils/settlement-fees.ts):
 * venue convenience fee 0.75% + 18% GST on everything the venue collected (online + cash), the cash already with the
 * venue is deducted, then Razorpay Route fee 0.25% + 18% GST on the balance that is transferred.
 */
/** All fees of a settlement batch or booking line: venue fee on online + on cash, and the Route fee. */
export const settlementDeduction = (s: { venue_platform_fee: number; total_deduction?: number }) =>
  s.total_deduction ?? s.venue_platform_fee;

/** ₹ amount with paise, e.g. 1234.5 → "1,234.50". */
export const formatInr = (value?: number) =>
  Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
