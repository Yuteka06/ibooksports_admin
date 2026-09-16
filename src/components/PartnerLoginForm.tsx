'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  CreditCard,
  Users,
  BarChart3,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Lock,
  Phone,
  AlertCircle,
  CheckCircle2,
  Building,
} from 'lucide-react';
import { onboardingApi } from '@/lib/api';

export default function PartnerLoginForm() {
  const router = useRouter();
  const [mobileNumber, setMobileNumber] = useState('');
  const [reqId, setReqId] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = mobileNumber.replace(/\D/g, '');
    if (cleanNumber.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const res = await onboardingApi.sendLoginOtp(cleanNumber);
      if (res.reqId) {
        setReqId(res.reqId);
      }
      setOtpSent(true);
      setCountdown(60);
      setSuccessMessage('A one-time verification passcode has been dispatched to your mobile number via SMS.');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(
        err.response?.data?.message || err.message || 'Unable to dispatch verification code. Please verify the mobile number.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.replace(/\D/g, '');
    if (cleanOtp.length < 4) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      const cleanNumber = mobileNumber.replace(/\D/g, '');
      const res = await onboardingApi.login(cleanNumber, cleanOtp, reqId || undefined);
      setSuccessMessage('Authentication successful. Redirecting to workspace...');
      if (res.onboarding_token) {
        localStorage.setItem(
          'ibooksports_onboarding_token',
          res.onboarding_token,
        );
      }
      localStorage.setItem('ibooksports_partner_mobile', cleanNumber);
      setTimeout(() => {
        router.push('/onboarding');
      }, 500);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(
        err.response?.data?.message || err.message || 'Invalid verification code. Please check and try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#F8F9FA] lg:bg-[#021526]">
      {/* ============================================================ */}
      {/* LEFT COLUMN: ENTERPRISE BRAND & VALUE PROPOSITION            */}
      {/* (Hidden on Tablet & Mobile, Visible on Desktop lg+)           */}
      {/* ============================================================ */}
      <div className="hidden lg:flex bg-[#021526] text-white p-8 sm:p-12 lg:p-16 xl:p-20 flex-col justify-between relative overflow-hidden border-r border-white/5">
        {/* Subtle Architectural Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-[#F94001]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-80 h-80 rounded-full bg-[#0052CC]/10 blur-3xl pointer-events-none" />

        {/* Top Header & Core Messaging */}
        <div className="relative z-10 my-auto space-y-5 sm:space-y-6">
          {/* Logo */}
          <div className="flex items-center">
            <Image
              src="/brand/logo-180.svg"
              alt="iBookSports"
              width={48}
              height={48}
              priority
              className="h-12 w-12 object-contain shrink-0"
            />
            <Image
              src="/brand/light.svg"
              alt="iBookSports"
              width={360}
              height={40}
              priority
              style={{ height: '40px', width: 'auto' }}
              className="h-10 w-auto object-contain object-left -ml-1"
            />
          </div>

          {/* Main Content Area: Core Messaging */}
          <div className="space-y-4 max-w-lg">
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-white leading-[1.15]">
              Manage your sports<br />
              venue smarter.
            </h1>
            <p className="text-sm sm:text-base text-slate-400 font-normal leading-relaxed">
              Real-time reservations, payment settlements, and customer analytics from a unified portal.
            </p>
          </div>
        </div>

        {/* Footer: Compliance and Security */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <span>&copy; {new Date().getFullYear()} iBookSports Technologies Private Limited.</span>
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="h-4 w-4 text-[#36B37E]" />
            <span>256-Bit Encrypted Partner Infrastructure</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* RIGHT COLUMN: ENTERPRISE AUTHENTICATION CARD                 */}
      {/* (Centered on Tablet and Mobile, 50% on Desktop)              */}
      {/* ============================================================ */}
      <div className="bg-[#F8F9FA] flex flex-col items-center justify-center p-4 sm:p-8 lg:p-12 min-h-screen">
        {/* Mobile & Tablet Brand Header */}
        <div className="lg:hidden flex items-center justify-center mb-6 sm:mb-8">
          <div className="flex items-center">
            <Image
              src="/brand/logo-180.svg"
              alt="iBookSports"
              width={44}
              height={44}
              priority
              className="h-11 w-11 object-contain shrink-0"
            />
            <Image
              src="/brand/Black_logo.svg"
              alt="iBookSports"
              width={180}
              height={32}
              priority
              style={{ height: '32px', width: 'auto' }}
              className="h-8 w-auto object-contain object-left -ml-1"
            />
          </div>
        </div>

        <div className="w-full max-w-md bg-white p-6 sm:p-10 rounded-2xl border border-[#E5E7EB] shadow-lg shadow-slate-200/60 space-y-7">
          {/* Form Header */}
          <div className="space-y-2 text-left border-b border-[#E5E7EB] pb-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#F94001]">
                AUTHENTICATION
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#5F6368]">
                <Lock className="h-3 w-3 text-[#5F6368]" /> Secure Session
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#021526] font-display tracking-tight">
              Partner Portal Access
            </h2>
            <p className="text-xs text-[#5F6368] leading-normal">
              Enter your registered mobile number to receive a secure one-time authentication code.
            </p>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMessage}</div>
            </div>
          )}

          {/* Authentication Step 1: Mobile Entry */}
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-5" suppressHydrationWarning>
              <div className="space-y-2">
                <label htmlFor="partner-phone-input" className="text-xs font-bold text-[#021526] flex items-center justify-between cursor-pointer">
                  <span>Registered Mobile Number</span>
                  <span className="text-[11px] text-[#5F6368] font-normal">India (+91)</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center text-xs font-mono font-bold text-[#021526] bg-[#F3F4F4] px-2 py-1 rounded-md border border-[#E5E7EB]">
                    +91
                  </div>
                  <input
                    id="partner-phone-input"
                    name="partner_mobile_number"
                    autoComplete="tel"
                    type="tel"
                    required
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="98765 43210"
                    suppressHydrationWarning
                    className="w-full rounded-xl border border-[#CBD5E1] bg-white pl-16 pr-4 py-3 text-sm font-mono tracking-wider text-[#021526] focus:border-[#F94001] focus:ring-2 focus:ring-[#F94001]/10 focus:outline-none transition-all placeholder:text-slate-400 placeholder:tracking-normal"
                  />
                </div>
                <p className="text-[11px] text-[#5F6368]">
                  Used for partner account verification and login authentication.
                </p>
              </div>

              <button
                type="submit"
                suppressHydrationWarning
                disabled={loading || mobileNumber.replace(/\D/g, '').length !== 10}
                className="w-full py-3.5 rounded-xl bg-[#F94001] hover:bg-[#D93600] text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-[#F94001]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:translate-y-[-1px] active:translate-y-[0px]"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Phone className="h-4 w-4" />
                    <span>Send Verification Code</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Authentication Step 2: OTP Verification */
            <form onSubmit={handleVerifyAndLogin} className="space-y-5" suppressHydrationWarning>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="partner-otp-input" className="text-xs font-bold text-[#021526] cursor-pointer">
                    6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                    }}
                    className="text-[11px] font-bold text-[#F94001] hover:underline"
                  >
                    Change Number
                  </button>
                </div>
                <div>
                  <input
                    id="partner-otp-input"
                    name="partner_otp"
                    autoComplete="one-time-code"
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="------"
                    suppressHydrationWarning
                    className="w-full text-center tracking-[0.6em] text-xl font-mono font-bold rounded-xl border border-[#CBD5E1] bg-white py-3 text-[#021526] focus:border-[#F94001] focus:ring-2 focus:ring-[#F94001]/10 focus:outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#5F6368] pt-1">
                  <span>Delivered to +91 {mobileNumber}</span>
                  {countdown > 0 ? (
                    <span className="font-mono text-[#021526] font-semibold">
                      Resend in {countdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      suppressHydrationWarning
                      disabled={loading}
                      onClick={handleSendOtp}
                      className="font-bold text-[#F94001] hover:underline"
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                suppressHydrationWarning
                disabled={loading || otp.replace(/\D/g, '').length < 4}
                className="w-full py-3.5 rounded-xl bg-[#F94001] hover:bg-[#D93600] text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-[#F94001]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:translate-y-[-1px] active:translate-y-[0px]"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Verify & Continue</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Registration Navigation */}
          <div className="pt-5 border-t border-[#E5E7EB] text-center space-y-2">
            <p className="text-xs text-[#5F6368]">
              Looking to register a new sports facility?
            </p>
            <Link
              href="/request-ibooksports"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F94001] hover:text-[#D93600] transition-colors"
            >
              <Building className="h-3.5 w-3.5" />
              <span>Submit Venue Partnership Application</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
