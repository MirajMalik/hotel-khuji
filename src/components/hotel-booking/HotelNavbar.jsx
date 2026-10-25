'use client';

import { useState } from 'react';
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
} from 'lucide-react';

export default function HotelNavbar({
  currentUser,
  onOpenAuth,
  onSignOut,
  activeCurrency = 'BDT',
  onCurrencyChange,
}) {
  const { theme, toggleTheme, lang, toggleLang } = useHotelStore();
  const isBn = lang === 'bn';

  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#0f172a] border-b border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-200">
      {/* ─── Top Trust & Assistance Strip ─── */}
      <div className="hidden lg:flex items-center justify-between px-6 py-1.5 bg-blue-50 dark:bg-[#090e1a] text-xs text-gray-600 dark:text-gray-400 border-b border-blue-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            {isBn
              ? 'জিরো অগ্রিম বুকিং — হোটেলে পৌঁছে সরাসরি মূল্য পরিশোধ করুন'
              : 'Zero Advance Required — Book online & pay upon arrival at hotel reception'}
          </span>
          <span className="text-gray-300 dark:text-gray-700">|</span>
          <span className="text-gray-500">
            {isBn
              ? 'হযরত শাহজালাল বিমানবন্দর (DAC) টার্মিনাল ১, ২ ও ৩ থেকে ফ্রি শাটল'
              : 'Free 24/7 Shuttle to DAC Terminals 1, 2 & 3'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/counter-view"
            className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <span>🏨</span>
            <span>{isBn ? 'রিসেপশনিস্ট কাউন্টার ভিউ' : 'Receptionist Counter View'}</span>
          </Link>
          <span className="text-gray-300 dark:text-gray-700">|</span>
          <Link
            href="/owner/dashboard"
            className="font-medium hover:text-blue-600 dark:hover:text-blue-400"
          >
            {isBn ? 'হোটেল পার্টনার পোর্টাল' : 'Hotel Owner SaaS'}
          </Link>
        </div>
      </div>

      {/* ─── Main Brand Header ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Left: Hotel Khuji Brand Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                    Hotel Khuji
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    DAC Transit
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                  {isBn ? 'অনলাইন হোটেল বুকিং প্ল্যাটফর্ম' : 'Online Transit Hotel Booking'}
                </p>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-2">
              <Link
                href="/hotels"
                className="px-3 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 rounded-xl"
              >
                {isBn ? 'সকল হোটেল দেখুন' : 'Browse All Hotels'}
              </Link>

              <Link
                href="/hotels?filter=hourly"
                className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>{isBn ? 'ঘণ্টাভিত্তিক ট্রানজিট পড' : 'Hourly Layover Pods'}</span>
              </Link>
            </nav>
          </div>

          {/* Right Toolbar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Currency Selector */}
            <div className="relative">
              <button
                onClick={() => setCurrencyOpen(!currencyOpen)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors"
                title="Select Currency"
              >
                <span className="text-blue-600 dark:text-blue-400">
                  {HOTEL_CURRENCIES.find((c) => c.code === activeCurrency)?.symbol || '৳'}
                </span>
                <span>{activeCurrency}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {currencyOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 py-1.5 z-50 animate-in fade-in">
                  <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Currency
                  </div>
                  {HOTEL_CURRENCIES.map((cur) => (
                    <button
                      key={cur.code}
                      onClick={() => {
                        if (onCurrencyChange) onCurrencyChange(cur.code);
                        setCurrencyOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-left transition-colors ${
                        activeCurrency === cur.code
                          ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-bold text-blue-600">{cur.symbol}</span>
                        <span>{cur.code}</span>
                      </span>
                      <span className="text-[10px] text-gray-400">{cur.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-gray-500" />
              <span>{isBn ? '🇧🇩 বাংলা' : '🇬🇧 EN'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors"
              title={theme === 'day' ? 'Switch to Night Mode' : 'Switch to Day Mode'}
            >
              {theme === 'day' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-blue-400" />
              )}
            </button>

            {/* User Session Profile or Login */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px]">
                    {(currentUser.full_name || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                  <span className="max-w-[100px] truncate hidden sm:inline">
                    {currentUser.full_name || currentUser.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-blue-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50 animate-in fade-in">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {currentUser.full_name || 'Guest User'}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">{currentUser.email}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/hotels"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Building2 className="w-3.5 h-3.5 text-blue-500" />
                        <span>Browse Hotels</span>
                      </Link>

                      <Link
                        href="/counter-view"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <span>🏨</span>
                        <span>Reception Counter View</span>
                      </Link>
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-800 pt-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          if (onSignOut) onSignOut();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left"
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
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>{isBn ? 'লগইন / সাইন আপ' : 'Sign In / Register'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
