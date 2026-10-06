'use client';

import React, { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('🔥 ERROR BOUNDARY TRIGGERED');
    console.error('🔥 Message:', error?.message);
    console.error('🔥 Digest:', error?.digest);
    console.error('🔥 Stack:', error?.stack);
    console.error('🔥 Full Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 text-center">
      <div className="space-y-4 max-w-md bg-white p-8 rounded-2xl border border-[#E5E7EB] shadow-md">
        <h2 className="text-xl font-bold text-[#021526]">
          Something went wrong!
        </h2>

        <p className="text-xs text-[#5F6368]">
          {error?.message || 'An unexpected error occurred.'}
        </p>

        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F94001] text-white font-bold text-xs shadow-md hover:bg-[#D93600] transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  );
}