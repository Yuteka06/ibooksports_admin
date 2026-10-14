// Parses the cancellation/refund tags the backend appends to booking notes:
//   "Cancelled: <reason> (<policy>) [CANCELLED_AT:<iso>] [REFUND:<amount>:<Refunded|Refund Pending>:<refs|MANUAL>]"
export interface ParsedCancellation {
  reason?: string;
  cancelledAt?: string;
  refundAmount: number;
  refundStatus: 'REFUNDED' | 'PROCESSING' | 'NOT_APPLICABLE';
  refundReference?: string;
}

export function parseCancellationNotes(notes?: string | null, paymentStatus?: string | null): ParsedCancellation {
  const text = notes || '';
  const reasonMatch = text.match(/Cancelled:\s*([^\[;]*?)\s*(?:\(|\[|;|$)/);
  const cancelledAtMatch = text.match(/\[CANCELLED_AT:([^\]]+)\]/);
  const refundMatch = text.match(/\[REFUND:([\d.]+):([^:\]]+):([^\]]*)\]/);

  const rawPay = (paymentStatus || '').toLowerCase();
  let refundStatus: ParsedCancellation['refundStatus'] = 'NOT_APPLICABLE';
  if (refundMatch) {
    refundStatus = refundMatch[2].toLowerCase() === 'refunded' ? 'REFUNDED' : 'PROCESSING';
  } else if (rawPay.includes('refund pending')) {
    refundStatus = 'PROCESSING';
  } else if (rawPay.includes('refunded')) {
    refundStatus = 'REFUNDED';
  }

  const refundRef = refundMatch?.[3];
  return {
    reason: reasonMatch?.[1]?.trim() || undefined,
    cancelledAt: cancelledAtMatch?.[1],
    refundAmount: refundMatch ? Number(refundMatch[1]) : 0,
    refundStatus,
    refundReference: refundRef && refundRef !== 'MANUAL' ? refundRef : undefined,
  };
}
