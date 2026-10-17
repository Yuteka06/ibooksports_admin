'use client';

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Sparkles,
  Zap,
  Target,
  Flame,
  Activity,
  Dribbble,
  Sun,
  Droplets,
  Car,
  HeartPulse,
  Coffee,
  ShieldCheck,
  Armchair,
  DoorOpen,
  SunMedium,
  Building2,
} from 'lucide-react';
import { adminApi, SportItem, AmenityItem } from '@/lib/api';

const ICON_MAP: Record<string, React.ElementType> = {
  Trophy,
  Target,
  Flame,
  Zap,
  Activity,
  Dribbble,
  Sparkles,
  Sun,
  SunMedium,
  Car,
  DoorOpen,
  Droplets,
  HeartPulse,
  Coffee,
  ShieldCheck,
  Armchair,
  Building2,
};

export default function SportsManagementPage() {
  const [activeTab, setActiveTab] = useState<'SPORTS' | 'AMENITIES'>('SPORTS');
  const [sports, setSports] = useState<SportItem[]>([]);
  const [amenities, setAmenities] = useState<AmenityItem[]>([]);

  useEffect(() => {
    async function loadSportsData() {
      try {
        const [sportsData, amenitiesData] = await Promise.all([
          adminApi.getSports().catch(() => []),
          adminApi.getAmenities().catch(() => []),
        ]);
        setSports(sportsData);
        setAmenities(amenitiesData);
      } catch (e) {
        console.error('Failed to load sports data', e);
      }
    }
    loadSportsData();
  }, []);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#021526] font-display flex items-center gap-2.5">
            <Trophy className="h-6 w-6 text-[#F94001]" />
            Sports &amp; Amenities Engine
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6368] mt-1 font-medium">
            Configure system sports definitions, playing formats, and facility amenities.
          </p>
        </div>
      </div>

      {/* SUB-TABS */}
      <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('SPORTS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'SPORTS'
              ? 'bg-[#021526] text-white shadow-xs'
              : 'bg-white text-[#5F6368] hover:bg-slate-100 border border-[#E5E7EB]'
          }`}
        >
          <Trophy className="h-4 w-4 text-[#F94001]" />
          <span>Sports &amp; Formats</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'SPORTS' ? 'bg-[#F94001] text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {sports.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('AMENITIES')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'AMENITIES'
              ? 'bg-[#021526] text-white shadow-xs'
              : 'bg-white text-[#5F6368] hover:bg-slate-100 border border-[#E5E7EB]'
          }`}
        >
          <Building2 className="h-4 w-4 text-[#F94001]" />
          <span>Facility Amenities</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'AMENITIES' ? 'bg-[#F94001] text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {amenities.length}
          </span>
        </button>
      </div>

      {/* 1. SPORTS */}
      {activeTab === 'SPORTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sports.map((sport) => (
            <div
              key={sport.sport_id}
              className="rounded-2xl bg-white p-5 border border-[#E5E7EB] shadow-xs space-y-3 hover:border-[#F94001]/50 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#021526]">
                    {sport.name}
                  </h3>
                  <p className="font-mono text-[10px] text-[#F94001] font-bold">
                    {sport.sport_id}
                  </p>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  ACTIVE
                </span>
              </div>

              <div className="space-y-1.5 text-xs pt-2 border-t border-[#F3F4F4]">
                <span className="text-[#5F6368] text-[11px] font-semibold">
                  Supported Match Formats:
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {sport.supported_formats.map((fmt) => (
                    <span
                      key={fmt}
                      className="px-2 py-0.5 rounded bg-[#F8F9FA] text-[#021526] font-semibold text-[10px] border border-[#E5E7EB]"
                    >
                      {fmt}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. AMENITIES */}
      {activeTab === 'AMENITIES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {amenities.map((amenity) => (
            <div
              key={amenity.amenity_id}
              className="rounded-2xl bg-white p-5 border border-[#E5E7EB] shadow-xs space-y-3 hover:border-[#F94001]/50 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  {amenity.category || 'Facility'}
                </span>
                <div>
                  <h3 className="font-bold text-sm text-[#021526]">
                    {amenity.name}
                  </h3>
                  <p className="font-mono text-[10px] text-[#F94001] font-bold mt-1">
                    {amenity.amenity_id}
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-[#F3F4F4] text-[11px] text-[#5F6368]">
                Category: <strong>{amenity.category || 'Facility'}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
