import React from 'react';
import Navbar from '@/components/Navbar';
import WebsiteLeadForm from '@/components/WebsiteLeadForm';

export const metadata = {
  title: 'Request iBookSports Partnership | Register Your Turf & Sports Arena',
  description:
    'Join iBookSports to automate slot bookings, collect advance payments via WhatsApp payment links, and eliminate double-booking at your sports arena.',
};

export default function RequestIBookingPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#021526] flex flex-col font-sans" suppressHydrationWarning>
      <Navbar />

      {/* Main Centered Form Section */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 w-full" suppressHydrationWarning>
        <WebsiteLeadForm />
      </main>

      {/* Clean Light Footer */}
      <footer className="border-t border-[#E5E7EB] bg-white py-6 text-center text-xs text-[#5F6368] mt-auto" suppressHydrationWarning>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3" suppressHydrationWarning>
          <p suppressHydrationWarning>© {new Date().getFullYear()} iBookSports Technologies. All rights reserved.</p>
          <p className="text-[#5F6368]">
            Partner Registration &amp; Venue Onboarding Portal
          </p>
        </div>
      </footer>
    </div>
  );
}
