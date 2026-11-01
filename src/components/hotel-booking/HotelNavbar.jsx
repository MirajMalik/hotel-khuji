'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useHotelStore } from '@/lib/store';
import { HOTEL_CURRENCIES } from '@/lib/hotelBookingData';
import {
  Building2,
  MapPin,
  Clock,
  Globe,
  Sun,
  Moon,
  User,
  ChevronDown,
  LogOut,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  Shield,
  Layers,
} from 'lucide-react';

export default function HotelNavbar({
  currentUser: propUser,
  onOpenAuth,
  onSignOut,
  activeCurrency = 'BDT',
  onCurrencyChange,
}) {
  const { theme, toggleTheme, lang, toggleLang, currentUser: storeUser, setCurrentUser } = useHotelStore();
  const isBn = lang === 'bn';

  // Use either store user or prop user
  const effectiveUser = storeUser || propUser;

  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Sync session on mount and listen to auth changes in real-time
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hotel_user');
      if (stored && !storeUser) {
        try {
          const parsed = JSON.parse(stored);
          setCurrentUser(parsed);
        } catch (e) {}
      }

      const handleAuthEvent = (e) => {
        if (e.detail !== undefined) {
          setCurrentUser(e.detail);
        }
      };

      window.addEventListener('hotel_auth_change', handleAuthEvent);
      window.addEventListener('storage', (e) => {
        if (e.key === 'hotel_user') {
          try {
            setCurrentUser(e.newValue ? JSON.parse(e.newValue) : null);
          } catch {}
        }
      });

      return () => {
        window.removeEventListener('hotel_auth_change', handleAuthEvent);
      };
    }
  }, [setCurrentUser, storeUser]);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
      {/* ─── Top Trust & Assistance Strip ─── */}
      <div className="hidden lg:flex items-center justify-between px-6 py-2 bg-slate-50 dark:bg-slate-950/80 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200/60 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            {isBn
              ? 'জিরো অগ্রিম বুকিং — পৌঁছানোর পর কাউন্টারে বিল পরিশোধ করুন'
              : 'Zero Advance Required — Instant booking confirmation, pay at hotel front desk'}
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span>
            {isBn
              ? 'হযরত শাহজালাল বিমানবন্দর (DAC) টার্মিনাল ১, ২ ও ৩ থেকে ফ্রি শাটল'
              : 'Free 24/7 Airport Shuttle to Dhaka International (DAC)'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/counter-view"
            className="flex items-center gap-1.5 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>{isBn ? 'কাউন্টার ভিউ' : 'Front Desk Counter View'}</span>
          </Link>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <Link
            href="/owner/dashboard"
            className="flex items-center gap-1.5 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>{isBn ? 'হোটেল পার্টনার পোর্টাল' : 'Hotel Owner SaaS'}</span>
          </Link>
        </div>
      </div>

      {/* ─── Main Brand Header ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Left: Hotel Khuji Brand Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:bg-blue-700 transition-colors">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Hotel Khuji
                  </span>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    DAC
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {isBn ? 'বিমানবন্দর ট্রানজিট হোটেল' : 'Dhaka Airport Transit PMS'}
                </p>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/hotels"
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isBn ? 'সব হোটেল ব্রাউজ করুন' : 'Browse All Hotels'}
              </Link>
            </nav>
          </div>

          {/* Right: Controls & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Currency Selector */}
            <div className="relative">
              <button
                onClick={() => setCurrencyOpen(!currencyOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors"
              >
                <span>{activeCurrency}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {currencyOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50">
                  {HOTEL_CURRENCIES.map((cur) => (
                    <button
                      key={cur.code}
                      onClick={() => {
                        if (onCurrencyChange) onCurrencyChange(cur.code);
                        setCurrencyOpen(false);
                      }}
                      className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 ${
                        activeCurrency === cur.code ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="font-bold text-blue-600">{cur.symbol}</span>
                        <span>{cur.code}</span>
                      </span>
                      <span className="text-[10px] text-slate-400">{cur.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>{isBn ? 'বাংলা' : 'English'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors"
              title={theme === 'day' ? 'Switch to Night' : 'Switch to Day'}
            >
              {theme === 'day' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-blue-400" />
              )}
            </button>

            {/* User Session Profile or Login — Instant Real-Time Sync */}
            {effectiveUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px]">
                    {(effectiveUser.full_name || effectiveUser.email || 'U')[0].toUpperCase()}
                  </div>
                  <span className="max-w-[110px] truncate hidden sm:inline">
                    {effectiveUser.full_name || effectiveUser.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50">
                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {effectiveUser.full_name || 'Guest User'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{effectiveUser.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                        {effectiveUser.role || 'Guest'}
                      </span>
                    </div>

                    <div className="py-1">
                      {(effectiveUser.role === 'owner' || effectiveUser.role === 'admin') && (
                        <Link
                          href="/owner/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Owner Management Dashboard</span>
                        </Link>
                      )}

                      <Link
                        href="/hotels"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Browse Hotels</span>
                      </Link>

                      <Link
                        href="/counter-view"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>Front Desk Counter View</span>
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          if (onSignOut) {
                            onSignOut();
                          } else {
                            setCurrentUser(null);
                            localStorage.removeItem('hotel_user');
                            localStorage.removeItem('token');
                            document.cookie = 'demo_role=; path=/; max-age=0';
                            document.cookie = 'token=; path=/; max-age=0';
                          }
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>{isBn ? 'লগইন' : 'Sign In'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
