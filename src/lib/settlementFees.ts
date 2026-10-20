/**
 * Vendor settlement display helpers. Fees are computed by the backend
 * (backend/src/common/utils/settlement-fees.ts), on the amount paid ONLINE: venue convenience fee 0.1737% (admin
 * income) + 18% GST, then Razorpay Route fee 0.25% + 18% GST on what is left (≈0.5% in all). Cash carries no fee.
 */
const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

/** Total fee deducted from a settlement batch or booking line (venue convenience + Route). */
export const settlementDeduction = (s: {
  venue_platform_fee?: number;
  total_deduction?: number;
  platform_fee?: number;
  platform_commission_deducted?: number;
  platform_fee_gst?: number;
  route_fee?: number;
  route_fee_gst?: number;
  tds_deducted?: number;
}) =>
  s.venue_platform_fee ??
  round2(
    (s.platform_fee ?? s.platform_commission_deducted ?? 0) +
      (s.platform_fee_gst || 0) +
      (s.route_fee || 0) +
      (s.route_fee_gst || 0) +
      (s.tds_deducted || 0),
  );

/** ₹ amount with paise, e.g. 1234.5 → "1,234.50". */
export const formatInr = (value?: number) =>
  Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
