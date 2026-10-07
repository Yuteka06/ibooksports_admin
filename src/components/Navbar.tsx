'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E5E7EB] bg-white/90 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo with Official IBS Mark */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-11 w-11 rounded-2xl overflow-hidden shadow-mdp-1 border-[#F94001]/30 transition-all duration-300 group-hover:scale-105">
            <Image
              src="/brand/logo-180.svg"
              alt="iBookSports Logo"
              width={44}
              height={44}
              priority
              className="object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-[#021526] font-display">
                iBook<span className="text-[#F94001]">Sports</span>
              </span>
              <span className="rounded-full bg-[#FFF1EC] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#F94001] border border-[#F94001]/30">
                Partner
              </span>
            </div>
            <p className="text-xs font-medium text-[#5F6368]">
              Sports Venue Operating System
            </p>
          </div>
        </Link>

        {/* Navigation & Action */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/onboarding/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#021526] hover:text-[#F94001] bg-[#F3F4F4] hover:bg-[#FFF1EC] px-3.5 py-2 rounded-xl border border-[#E5E7EB] transition-all"
          >
            <span>Partner Login</span>
          </Link>

          <Link
            href="/admin"
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-[#021526] hover:text-[#F94001] bg-[#F3F4F4] hover:bg-[#FFF1EC] px-3.5 py-2 rounded-xl border border-[#E5E7EB] transition-all"
          >
            <LayoutDashboard className="h-3.5 w-3.5 text-[#F94001]" />
            <span>Admin Portal</span>
          </Link>

          <Link
            href="/request-ibooksports"
            className="inline-flex items-center gap-2 rounded-xl bg-[#F94001] hover:bg-[#D93600] text-white px-5 py-2.5 text-xs font-bold shadow-md shadow-[#F94001]/25 transition-all duration-300 hover:scale-[1.02] active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>List Your Turf</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
