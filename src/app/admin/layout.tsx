'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Inbox,
  UserCheck,
  Building2,
  Trophy,
  Mail,
  Settings,
  FileText,
  Menu,
  X,
  Search,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Bell,
  CheckCheck,
  Clock,
  Sparkles,
  Users,
  CalendarCheck,
  CreditCard,
  Landmark,
  Headphones,
  LogOut,
} from 'lucide-react';
import { adminApi } from '@/lib/api';

interface AdminNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  link: string;
  badge: string;
}

function getRelativeTime(timestamp?: string | Date): string {
  if (!timestamp) return 'Just now';
  try {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export interface NavItemConfig {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | null;
}

export interface NavSectionConfig {
  title: string;
  items: NavItemConfig[];
}

const NAV_SECTIONS: NavSectionConfig[] = [
  {
    title: 'Core Operations',
    items: [
      {
        label: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
        badge: null,
      },
      {
        label: 'Partner Requests',
        href: '/admin/requests',
        icon: Inbox,
        badge: '4 New',
      },
      {
        label: 'Partner Onboarding',
        href: '/admin/onboarding',
        icon: UserCheck,
        badge: null,
      },
      {
        label: 'Venue Management',
        href: '/admin/venues',
        icon: Building2,
        badge: '3 Active',
      },
      {
        label: 'Court Requests',
        href: '/admin/court-requests',
        icon: Trophy,
        badge: null,
      },
    ],
  },
  {
    title: 'Turf & Business',
    items: [
      {
        label: 'Customer Management',
        href: '/admin/customers',
        icon: Users,
        badge: '6 Users',
      },
      {
        label: 'Booking Management',
        href: '/admin/bookings',
        icon: CalendarCheck,
        badge: 'Live',
      },
      {
        label: 'Payment Management',
        href: '/admin/payments',
        icon: CreditCard,
        badge: null,
      },
      {
        label: 'Settlement Management',
        href: '/admin/settlements',
        icon: Landmark,
        badge: '2 Due',
      },
      {
        label: 'Support Helpdesk',
        href: '/admin/support',
        icon: Headphones,
        badge: '2 Open',
      },
    ],
  },
  {
    title: 'Platform & Settings',
    items: [
      {
        label: 'Settings & Config',
        href: '/admin/settings',
        icon: Settings,
        badge: '8 Tabs',
      },
      {
        label: 'CMS & Policies',
        href: '/admin/cms',
        icon: FileText,
        badge: 'Live',
      },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  const [submittedCount, setSubmittedCount] = useState<number | null>(null);
  const [courtRequestsCount, setCourtRequestsCount] = useState<number | null>(null);

  // Fetch real-time count & live notifications from backend
  useEffect(() => {
    let isMounted = true;
    async function loadLiveNotifications() {
      try {
        const [allRequests, courtRequests] = await Promise.all([
          adminApi.getRequests().catch(() => []),
          adminApi.getCourtRequests().catch(() => []),
        ]);

        if (isMounted) {
          const liveNotifs: AdminNotification[] = [];

          if (Array.isArray(allRequests)) {
            const submitted = allRequests.filter((r) => r.request_status === 'SUBMITTED' || r.status === 'SUBMITTED');
            setSubmittedCount(submitted.length);

            // Add real partner requests to notifications
            allRequests.slice(0, 8).forEach((r) => {
              const name = r.partner_details?.name || r.owner_details?.name || r.business_details?.venue_name || 'New Partner';
              const district = r.business_details?.district || r.business_details?.venue_city || 'Coimbatore';
              const isNew = r.request_status === 'SUBMITTED' || r.status === 'SUBMITTED';

              liveNotifs.push({
                id: `lead_${r.id || r.request_id}`,
                title: isNew ? 'New Partner Registration Request' : `Partner Request (${r.request_status || r.status || 'Received'})`,
                description: `${name} submitted a partner registration inquiry for ${district}.`,
                time: getRelativeTime(r.created_at || r.submitted_at),
                read: !isNew,
                link: '/admin/requests',
                badge: isNew ? 'New Request' : (r.request_status || 'Reviewed'),
              });
            });
          }

          if (Array.isArray(courtRequests)) {
            const pendingCourts = courtRequests.filter((c) => c.status === 'PENDING' || c.status === 'NEW_REQUEST');
            setCourtRequestsCount(pendingCourts.length);

            // Add real court requests to notifications
            courtRequests.slice(0, 6).forEach((cr) => {
              const isPending = cr.status === 'PENDING' || cr.status === 'NEW_REQUEST';
              liveNotifs.push({
                id: `court_${cr.id}`,
                title: 'New Court Addition Request',
                description: `${cr.court_name || 'New Court'} at ${cr.venue_name || 'Sports Venue'} submitted for review.`,
                time: getRelativeTime(cr.submitted_at || cr.created_at),
                read: !isPending,
                link: '/admin/court-requests',
                badge: isPending ? 'Court Request' : (cr.status || 'Active'),
              });
            });
          }

          if (liveNotifs.length > 0) {
            setNotifications(liveNotifs);
          }
        }
      } catch {
        // Silently retain current notifications during transient network lag
      }
    }

    loadLiveNotifications();
    const interval = setInterval(loadLiveNotifications, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [pathname]);

  const getBadgeText = (item: NavItemConfig) => {
    if (item.href === '/admin/requests') {
      if (submittedCount !== null && submittedCount > 0) {
        return `${submittedCount} NEW`;
      }
      return '4 NEW';
    }
    if (item.href === '/admin/court-requests') {
      if (courtRequestsCount !== null && courtRequestsCount > 0) {
        return `${courtRequestsCount} NEW`;
      }
      return null;
    }
    return item.badge;
  };

  // Close notifications on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Do not render admin header or sidebar on login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#021526] flex flex-col font-sans antialiased" suppressHydrationWarning>
      {/* TOP HEADER - FULL WIDTH */}
      <header className="sticky top-0 z-40 w-full bg-[#021526] text-white border-b border-[#06243f] shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 focus:outline-none transition-colors"
              aria-label="Toggle Navigation Menu"
              suppressHydrationWarning
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            <Link href="/admin" className="flex items-center gap-3 group">
              <Image
                src="/brand/ibooksports-logo.svg"
                alt="iBookSports"
                width={36}
                height={36}
                priority
                className="h-9 w-9 object-contain shrink-0 transition-transform duration-300 group-hover:scale-105"
              />
              <div className="flex flex-col justify-center">
                <Image
                  src="/brand/light.svg"
                  alt="iBookSports"
                  width={140}
                  height={16}
                  priority
                  style={{ height: '16px', width: 'auto' }}
                  className="h-4 w-auto object-contain object-left"
                />
                <span className="hidden sm:inline text-[10px] text-slate-400 font-medium tracking-wide mt-1">
                  Super Admin Management Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Quick Search */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
            <div className="relative w-full flex items-center">
              <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search requests, venues, partners..."
                className="w-full rounded-xl bg-[#06243f] border border-[#0a2e4e] pl-10 pr-12 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#F94001] focus:ring-1 focus:ring-[#F94001] transition-all"
                suppressHydrationWarning
              />
              <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[9px] font-mono font-semibold bg-[#021526] text-slate-400 rounded border border-slate-700 select-none pointer-events-none">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications Bell & Dropdown */}
            <div className="relative" ref={notifDropdownRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-slate-300 hover:text-white bg-[#06243f] hover:bg-[#0a2e4e] rounded-xl border border-[#0a2e4e] transition-all cursor-pointer shadow-xs focus:outline-none"
                aria-label="Notifications"
                title="Partner Requests Notifications"
                suppressHydrationWarning
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#F94001] text-[9px] font-black text-white shadow-xs">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F94001] opacity-75" />
                    <span className="relative">{unreadCount}</span>
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white text-[#021526] shadow-2xl border border-[#CBD5E1] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  {/* Dropdown Header */}
                  <div className="p-3.5 bg-[#021526] text-white flex items-center justify-between border-b border-[#06243f]">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-[#F94001]" />
                      <span className="font-bold text-xs font-display">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-[#F94001] text-white text-[10px] font-bold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllAsRead}
                          className="text-[10px] text-slate-300 hover:text-white font-medium flex items-center gap-1 transition-colors cursor-pointer"
                          title="Mark all as read"
                        >
                          <CheckCheck className="h-3 w-3 text-emerald-400" />
                          <span>Mark all read</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setNotificationsOpen(false)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        title="Close notifications"
                        aria-label="Close notifications"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Notification List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-[#E5E7EB]">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#5F6368]">
                        No notifications found
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <Link
                          key={notif.id}
                          href={notif.link}
                          onClick={() => {
                            markAsRead(notif.id);
                            setNotificationsOpen(false);
                          }}
                          className={`p-3 sm:p-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors block ${
                            !notif.read ? 'bg-orange-50/40' : ''
                          }`}
                        >
                          <div className="h-8 w-8 rounded-xl bg-orange-100 text-[#F94001] flex items-center justify-center shrink-0 mt-0.5">
                            <Inbox className="h-4 w-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded font-mono bg-orange-100 text-orange-800">
                                {notif.badge}
                              </span>
                              <span className="text-[10px] text-[#5F6368] font-mono">
                                {notif.time}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-[#021526] leading-tight">
                              {notif.title}
                            </h4>
                            <p className="text-[11px] text-[#5F6368] mt-0.5 line-clamp-2 leading-relaxed">
                              {notif.description}
                            </p>
                          </div>

                          {!notif.read && (
                            <span className="h-2 w-2 rounded-full bg-[#F94001] shrink-0 mt-1.5" />
                          )}
                        </Link>
                      ))
                    )}
                  </div>

                  {/* Dropdown Footer */}
                  <div className="p-3 bg-[#F8F9FA] border-t border-[#E5E7EB] flex items-center justify-center text-xs font-bold">
                    <Link
                      href="/admin/requests"
                      onClick={() => {
                        setNotificationsOpen(false);
                        setTimeout(() => {
                          const tableEl = document.getElementById('partner-requests-table');
                          if (tableEl) {
                            tableEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            tableEl.classList.add('ring-2', 'ring-[#F94001]', 'shadow-lg');
                            setTimeout(() => {
                              tableEl.classList.remove('ring-2', 'ring-[#F94001]', 'shadow-lg');
                            }, 2000);
                          }
                        }, 50);
                      }}
                      className="text-[#F94001] hover:text-[#D93600] no-underline transition-colors flex items-center gap-1.5 cursor-pointer py-1 px-3 rounded-lg hover:bg-orange-50"
                    >
                      <span>View All Partner Requests</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="h-5 w-px bg-slate-700 hidden sm:block" />

            {/* Admin Profile & Logout */}
            <div className="flex items-center gap-2 pl-1">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[#F94001] to-[#D93600] flex items-center justify-center text-white text-xs font-black shadow-sm shrink-0">
                  SA
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-white leading-tight">
                    Super Admin
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />{' '}
                    Live Session
                  </span>
                </div>
              </div>

              <Link
                href="/admin/login"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('ibooksports_admin_auth');
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/10 transition-colors ml-1"
                title="Sign out of admin console"
              >
                <LogOut className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* FULL-WIDTH BODY CONTAINER */}
      <div className="flex-1 flex w-full">
        {/* SIDEBAR NAVIGATION (DESKTOP) - FLUSH LEFT */}
        <aside className="hidden lg:block w-64 xl:w-72 shrink-0 bg-white border-r border-[#E5E7EB] min-h-[calc(100vh-4rem)]">
          <div className="p-4 xl:p-5 space-y-5 sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto">
            {NAV_SECTIONS.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#5F6368] mb-2 font-display">
                  {section.title}
                </p>

                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === '/admin'
                      ? pathname === '/admin'
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-[#021526] text-white font-semibold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`h-4 w-4 ${
                            isActive ? 'text-[#F94001]' : 'text-slate-400'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>

                      {getBadgeText(item) && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono ${
                            isActive
                              ? 'bg-[#F94001] text-white'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {getBadgeText(item)}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}

            {/* Minimal SaaS System Status Box */}
            <div className="pt-3 border-t border-slate-100">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live Network</span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    99.9% Uptime
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  All 4 Arena clusters operational
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* MOBILE MENU DRAWER */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden bg-black/60 backdrop-blur-xs flex">
            <div className="w-72 max-w-[85vw] bg-white h-full p-5 space-y-4 shadow-2xl flex flex-col justify-between animate-in slide-in-from-left overflow-y-auto">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-2.5">
                    <Image
                      src="/brand/ibooksports-logo.svg"
                      alt="iBookSports"
                      width={30}
                      height={30}
                      className="h-7 w-7 object-contain shrink-0"
                    />
                    <span className="font-display font-black text-base text-[#021526]">
                      iBook<span className="text-[#F94001]">Sports</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  {NAV_SECTIONS.map((section, sIdx) => (
                    <div key={sIdx} className="space-y-1">
                      <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#5F6368] mb-1.5 font-display">
                        {section.title}
                      </p>
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive =
                          item.href === '/admin'
                            ? pathname === '/admin'
                            : pathname.startsWith(item.href);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                              isActive
                                ? 'bg-[#FFF1EC] text-[#F94001] font-bold border-l-4 border-[#F94001]'
                                : 'text-[#021526] hover:bg-[#F3F4F4]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon
                                className={`h-4 w-4 ${
                                  isActive ? 'text-[#F94001]' : 'text-[#5F6368]'
                                }`}
                              />
                              <span>{item.label}</span>
                            </div>
                            {getBadgeText(item) && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#F94001] text-white font-bold">
                                {getBadgeText(item)}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  iBookSports v2.4 Admin
                </span>
                <Link
                  href="/admin/login"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('ibooksports_admin_auth');
                    }
                  }}
                  className="text-rose-600 font-bold flex items-center gap-1 hover:underline text-[11px]"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </Link>
              </div>
            </div>
            <div
              className="flex-1"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          </div>
        )}

        {/* MAIN CONTENT AREA - FLUID FULL WIDTH */}
        <main className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-8 bg-[#F8F9FA] overflow-y-auto">
          <div className="w-full max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
