'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Trophy,
  Landmark,
  CalendarCheck,
  Activity,
  KeyRound,
  Check,
} from 'lucide-react';
import { apiClient } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@ibooksports.com');
  const [password, setPassword] = useState('Admin@12345');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your administrator email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      // Direct call to Super Admin authentication endpoint
      const res = await apiClient.post('/admin/auth/login', {
        email: cleanEmail,
        password: password,
      });

      const token = res.data?.accessToken || res.data?.token;
      if (res.data?.success && token) {
        const adminData = res.data.admin || {
          email: cleanEmail,
          name: 'Super Admin',
          role: 'SUPER_ADMIN',
        };

        const sessionPayload = {
          authenticated: true,
          email: adminData.email,
          name: adminData.name,
          role: adminData.role || 'SUPER_ADMIN',
          token: token,
          user: adminData,
          logged_at: new Date().toISOString(),
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem('ibooksports_admin_auth', JSON.stringify(sessionPayload));
          if (rememberMe) {
            localStorage.setItem('ibooksports_admin_remember_email', cleanEmail);
          } else {
            localStorage.removeItem('ibooksports_admin_remember_email');
          }
        }

        setSuccessMsg('Access authorized! Launching Super Admin Operating System...');
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/admin';
          } else {
            router.push('/admin');
          }
        }, 400);
      } else {
        setError(res.data?.message || 'Authentication failed. Please check your credentials.');
        setIsLoading(false);
      }
    } catch (err: any) {
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        'Invalid email or password. Please verify your administrator credentials.';
      setError(errMsg);
      setIsLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setSuccessMsg(null);
  };

  return (
    <div suppressHydrationWarning className="min-h-screen w-full bg-[#021526] text-white flex flex-col justify-between relative overflow-hidden font-sans select-none">
      {/* Dynamic Background Ambient Gradients */}
      <div className="absolute top-0 right-1/4 w-[700px] h-[700px] bg-gradient-to-br from-[#F94001]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-[600px] h-[600px] bg-gradient-to-tr from-[#005580]/20 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* TOP HEADER */}
      <header className="w-full px-8 py-5 flex items-center justify-between border-b border-[#07243e]/80 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <Image
              src="/brand/ibooksports-logo.svg"
              alt="iBookSports"
              width={42}
              height={42}
              priority
              className="h-10 w-10 object-contain drop-shadow-md"
            />
            <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#021526]" />
          </div>
          <div className="flex flex-col">
            <Image
              src="/brand/light.svg"
              alt="iBookSports"
              width={140}
              height={18}
              priority
              style={{ height: '18px', width: 'auto' }}
              className="h-4.5 w-auto object-contain object-left"
            />
            <span className="text-[10px] text-slate-400 font-mono tracking-wider font-semibold uppercase mt-0.5">
              Super Admin Operating System
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#05213b] border border-[#0a355c] text-[11px] font-mono text-slate-300 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>256-Bit Hardware Cryptographic Gate</span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#F94001]/15 text-[#F94001] border border-[#F94001]/30 text-[10px] font-bold font-mono">
            v2.4 LTS
          </span>
        </div>
      </header>

      {/* MAIN TWO-COLUMN DESKTOP WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-8 py-8 flex items-center justify-center z-10">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-center">
          
          {/* LEFT COLUMN: BRAND OPERATING SYSTEM & TURF PULSE SHOWCASE (7 COLUMNS) */}
          <div className="hidden lg:flex lg:col-span-7 flex-col justify-center space-y-6 pr-4">
            
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#05233d] border border-[#0d406d] text-xs font-bold text-slate-200 w-fit shadow-inner">
              <Sparkles className="h-3.5 w-3.5 text-[#F94001]" />
              <span>Next-Gen Sports Venue & Turf Infrastructure</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-3">
              <h1 className="text-4xl xl:text-5xl font-black font-display tracking-tight text-white leading-tight">
                Complete Command of <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F94001] via-orange-400 to-amber-300">
                  Turfs, Bookings & Payouts.
                </span>
              </h1>
              <p className="text-sm xl:text-base text-slate-300 leading-relaxed max-w-xl">
                The centralized operational console for venue partner KYC, real-time floodlit court availability, player check-in verification, and automated T+2 banking settlements.
              </p>
            </div>

            {/* LIVE TURF METRIC COCKPIT CARDS */}
            <div className="grid grid-cols-3 gap-3.5 pt-2">
              <div className="p-4 rounded-2xl bg-[#041d33]/90 border border-[#0a355d] backdrop-blur-md shadow-lg space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase font-mono">Active Pitches</span>
                  <Trophy className="h-4 w-4 text-[#F94001]" />
                </div>
                <p className="text-2xl font-black font-display text-white">48+</p>
                <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  FIFA & BWF Certified
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#041d33]/90 border border-[#0a355d] backdrop-blur-md shadow-lg space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase font-mono">Monthly Disbursals</span>
                  <Landmark className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-black font-display text-white">₹14.8L</p>
                <p className="text-[10px] text-slate-400 font-semibold">T+2 IMPS Payouts</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#041d33]/90 border border-[#0a355d] backdrop-blur-md shadow-lg space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase font-mono">Slot Accuracy</span>
                  <CalendarCheck className="h-4 w-4 text-blue-400" />
                </div>
                <p className="text-2xl font-black font-display text-white">99.9%</p>
                <p className="text-[10px] text-blue-400 font-semibold">Zero Double-Bookings</p>
              </div>
            </div>

            {/* MINI TURF SCHEMATIC DIAGRAM PREVIEW */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#031d36] to-[#05284a] border border-[#0c3e6b] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#F94001]/20 border border-[#F94001]/40 flex items-center justify-center text-[#F94001]">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Live Ground Telemetry & Slot Matrix</h4>
                  <p className="text-[11px] text-slate-400">Coimbatore • Chennai • Bengaluru Hubs</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold font-mono">
                System Online
              </span>
            </div>

            {/* Security Guarantee Note */}
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              <span>Multi-tier administrator access protected by encrypted password & JWT credential headers.</span>
            </div>
          </div>

          {/* RIGHT COLUMN: HIGH-TECH GLASS AUTH CARD (5 COLUMNS) */}
          <div className="w-full lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md bg-[#041e36]/90 border border-[#0d3b66] rounded-3xl p-7 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl relative overflow-hidden">
              
              {/* Subtle Card Header Accents */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#0a355d]">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#F94001] animate-ping" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
                    Administrator Gate
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  256-Bit SSL
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5 mb-6">
                <h2 className="text-2xl font-black font-display tracking-tight text-white">
                  Super Admin Login
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your authorized Gmail / Enterprise email and password to access the command console.
                </p>
              </div>

              {/* Error and Success Alerts */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* EMAIL & PASSWORD LOGIN FORM */}
              <form onSubmit={handleLogin} suppressHydrationWarning className="space-y-4">
                
                {/* Email Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="admin-email-input" className="text-xs font-bold uppercase tracking-wider text-slate-300 cursor-pointer">
                      Email / Gmail Address
                    </label>
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => handleFillDemo('admin@ibooksports.com', 'Admin@12345')}
                      className="text-[11px] font-bold text-[#F94001] hover:underline cursor-pointer"
                    >
                      Fill Master Credentials
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 flex items-center text-slate-400 pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      id="admin-email-input"
                      name="admin_email"
                      autoComplete="username"
                      type="email"
                      value={email}
                      suppressHydrationWarning
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@ibooksports.com"
                      required
                      className="w-full bg-[#03182b] border border-[#0a3154] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#F94001] focus:ring-2 focus:ring-[#F94001]/30 transition-all font-sans"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label htmlFor="admin-password-input" className="text-xs font-bold uppercase tracking-wider text-slate-300 block cursor-pointer">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 flex items-center text-slate-400 pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      id="admin-password-input"
                      name="admin_password"
                      autoComplete="current-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      suppressHydrationWarning
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full bg-[#03182b] border border-[#0a3154] rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#F94001] focus:ring-2 focus:ring-[#F94001]/30 transition-all font-mono"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded bg-[#03182b] border-[#0a3154] text-[#F94001] focus:ring-[#F94001] accent-[#F94001]"
                    />
                    <span>Remember this device</span>
                  </label>

                  <span className="text-[11px] text-slate-400 font-mono">Role: Super Admin</span>
                </div>

                {/* Primary Action Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  suppressHydrationWarning
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#F94001] to-[#e03a00] hover:brightness-110 active:scale-[0.99] font-bold text-sm text-white shadow-lg shadow-[#F94001]/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-4"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Authenticating Credentials...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      <span>Sign In with Password</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Security Audit Footer */}
              <div className="mt-6 pt-4 border-t border-[#082a47] flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-slate-400" />
                  <span>Encrypted session</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-400">
                  <Check className="h-3 w-3" />
                  <span>Direct Auth Ready</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full py-4 px-8 border-t border-[#07243e]/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2 z-20">
        <span>© 2026 iBookSports Technology Solutions Private Limited</span>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Privacy Policy</span>
          <span>•</span>
          <span>Security Architecture</span>
          <span>•</span>
          <span>Platform Status: Operational</span>
        </div>
      </footer>
    </div>
  );
}
