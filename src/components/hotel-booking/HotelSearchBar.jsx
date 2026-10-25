'use client';

import { useState, useRef, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  Users,
  Search,
  Clock,
  Car,
  Building2,
  CheckCircle2,
  X,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { POPULAR_DESTINATIONS } from '@/lib/hotelBookingData';

export default function HotelSearchBar({
  searchQuery,
  setSearchQuery,
  selectedTab,
  setSelectedTab,
  onSearch,
  activeQuickFilter,
  setActiveQuickFilter,
  isBn,
}) {
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showGuestsPopover, setShowGuestsPopover] = useState(false);

  // Search parameters
  const [roomsCount, setRoomsCount] = useState(1);
  const [adultsCount, setAdultsCount] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);

  // Dates
  const [checkIn, setCheckIn] = useState('2026-10-25');
  const [checkOut, setCheckOut] = useState('2026-10-26');
  const [hourlyDuration, setHourlyDuration] = useState('6h');

  const locationRef = useRef(null);
  const guestsRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (locationRef.current && !locationRef.current.contains(e.target)) {
        setShowLocationDropdown(false);
      }
      if (guestsRef.current && !guestsRef.current.contains(e.target)) {
        setShowGuestsPopover(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const quickFilters = [
    { id: 'zero-advance', label: isBn ? '⚡ জিরো অগ্রিম (হোটেল কাউন্টারে পে)' : '⚡ Zero Advance (Pay at Hotel)' },
    { id: 'shuttle', label: isBn ? '🚐 ফ্রি বিমানবন্দর পিকআপ' : '🚐 Free Airport Pickup' },
    { id: 'top-rated', label: isBn ? '⭐ সেরা রেটিং (৮.৫+)' : '⭐ Top Rated (8.5+)' },
    { id: 'nearby', label: isBn ? '⏱️ বিমানবন্দর থেকে <১০ মিনিট' : '⏱️ <10 Mins to DAC Airport' },
    { id: 'free-cancel', label: isBn ? '🔒 ফ্রি বাতিলকরণ' : '🔒 Free Cancellation' },
  ];

  return (
    <div className="relative pt-6 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#1e3a8a] via-[#1e40af] to-[#172554] text-white">
      {/* Decorative Grid */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#93c5fd_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-20">
        {/* Header Hero Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold backdrop-blur-md mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {isBn
                ? 'হযরত শাহজালাল আন্তর্জাতিক বিমানবন্দর (DAC) হোটেল বুকিং'
                : 'Dhaka Airport (DAC) Verified Transit Hotel Network'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            {isBn
              ? 'বিমানবন্দরের কাছে সেরা হোটেল ও রুম বুক করুন'
              : 'Book Verified Transit Hotels Around Dhaka Airport'}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-blue-100 max-w-2xl mx-auto font-normal">
            {isBn
              ? 'কোন অগ্রিম পেমেন্ট নেই। হোটেলে পৌঁছে পে করুন। ২৪/৭ ফ্রি বিমানবন্দর শাটল এবং ফ্লাইট-সিঙ্ক ওয়েক-আপ সাপোর্ট।'
              : 'Zero advance required. Pay at front desk upon arrival. 24/7 free airport pickup and automated flight departure wake-up calls.'}
          </p>
        </div>

        {/* ─── Interactive Hotel Search Container ─── */}
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl shadow-2xl p-3 sm:p-5 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-800 transition-all">
          {/* Stay Type Tabs: Overnight Stays vs Hourly Day-Use vs Shuttle */}
          <div className="flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-800 pb-3 mb-3.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedTab('overnight')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                selectedTab === 'overnight'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>{isBn ? 'রাতব্যাপী অবস্থান (Overnight Stay)' : 'Overnight Stay'}</span>
            </button>

            <button
              onClick={() => setSelectedTab('hourly')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                selectedTab === 'hourly'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{isBn ? 'ঘণ্টাভিত্তিক ট্রানজিট (Day-Use / 4h-8h)' : 'Day-Use & Hourly Stays'}</span>
              <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded font-extrabold uppercase">
                Save 50%
              </span>
            </button>

            <button
              onClick={() => setSelectedTab('shuttle')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                selectedTab === 'shuttle'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>{isBn ? 'ফ্রি বিমানবন্দর শাটল অন্তর্ভুক্ত' : 'Free Airport Shuttle Included'}</span>
            </button>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-0 bg-gray-50 dark:bg-[#1e293b]/50 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700">
            {/* 1. Destination / Area / Hotel Name (4 cols) */}
            <div
              ref={locationRef}
              className="relative lg:col-span-4 p-2.5 sm:p-3 bg-white dark:bg-[#0f172a] rounded-xl lg:rounded-r-none border border-gray-200 dark:border-gray-700 lg:border-r-0 hover:border-blue-500 transition-colors"
            >
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {isBn ? 'গন্তব্য বা হোটেল' : 'Destination or Hotel'}
              </label>
              <div className="mt-1 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setShowLocationDropdown(true)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isBn
                      ? 'ঢাকা বিমানবন্দর, আশকোনা, উত্তরা...'
                      : 'Dhaka Airport DAC, Ashkona, Uttara...'
                  }
                  className="w-full text-xs sm:text-sm font-semibold bg-transparent focus:outline-none text-gray-900 dark:text-white placeholder-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {showLocationDropdown && (
                <div className="absolute left-0 top-full mt-2 w-full sm:w-80 bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-2 z-50 animate-in fade-in">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {isBn ? 'জনপ্রিয় বিমানবন্দর ট্রানজিট জোন' : 'Popular Transit Areas'}
                  </div>
                  {POPULAR_DESTINATIONS.map((dest) => (
                    <button
                      key={dest.id}
                      onClick={() => {
                        setSearchQuery(dest.name.split('(')[0].trim());
                        setShowLocationDropdown(false);
                      }}
                      className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 text-left transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                          {dest.name}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{dest.subtext}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Dates or Hourly Duration (4 cols) */}
            <div className="lg:col-span-4 p-2.5 sm:p-3 bg-white dark:bg-[#0f172a] rounded-xl lg:rounded-none border border-gray-200 dark:border-gray-700 lg:border-r-0 hover:border-blue-500 transition-colors">
              {selectedTab === 'hourly' ? (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {isBn ? 'লে-ওভার সময়সীমা (ঘণ্টা)' : 'Layover Duration'}
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                    <select
                      value={hourlyDuration}
                      onChange={(e) => setHourlyDuration(e.target.value)}
                      className="w-full text-xs sm:text-sm font-semibold bg-transparent focus:outline-none text-gray-900 dark:text-white cursor-pointer"
                    >
                      <option value="4h">4 Hours Quick Nap & Shower (৳1,200)</option>
                      <option value="6h">6 Hours Transit Rest (৳1,600)</option>
                      <option value="8h">8 Hours Full Day Rest + Shuttle (৳2,000)</option>
                      <option value="12h">12 Hours Extended Layover (৳2,400)</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {isBn ? 'চেক-ইন' : 'Check-in'}
                    </label>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                      <input
                        type="date"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        className="w-full text-xs sm:text-sm font-semibold bg-transparent focus:outline-none text-gray-900 dark:text-white cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {isBn ? 'চেক-আউট' : 'Check-out'}
                    </label>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                      <input
                        type="date"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="w-full text-xs sm:text-sm font-semibold bg-transparent focus:outline-none text-gray-900 dark:text-white cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Guests & Rooms Selector (2 cols) */}
            <div
              ref={guestsRef}
              className="relative lg:col-span-2 p-2.5 sm:p-3 bg-white dark:bg-[#0f172a] rounded-xl lg:rounded-none border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors"
            >
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {isBn ? 'অতিথি ও রুম' : 'Guests & Rooms'}
              </label>
              <button
                type="button"
                onClick={() => setShowGuestsPopover(!showGuestsPopover)}
                className="mt-1 w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Users className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {adultsCount} Adults, {roomsCount} Room
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              </button>

              {/* Stepper Popover */}
              {showGuestsPopover && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 z-50 animate-in fade-in">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">Rooms</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setRoomsCount(Math.max(1, roomsCount - 1))}
                          className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="text-sm font-bold w-4 text-center">{roomsCount}</span>
                        <button
                          type="button"
                          onClick={() => setRoomsCount(roomsCount + 1)}
                          className="w-7 h-7 rounded-full border border-blue-600 text-blue-600 flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">Adults</span>
                        <span className="block text-[10px] text-gray-400">12+ years</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setAdultsCount(Math.max(1, adultsCount - 1))}
                          className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="text-sm font-bold w-4 text-center">{adultsCount}</span>
                        <button
                          type="button"
                          onClick={() => setAdultsCount(adultsCount + 1)}
                          className="w-7 h-7 rounded-full border border-blue-600 text-blue-600 flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowGuestsPopover(false)}
                      className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Search Action Button (2 cols) */}
            <div className="lg:col-span-2 p-1 flex">
              <button
                type="button"
                onClick={onSearch}
                className="w-full h-full min-h-[50px] bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
                <span>{isBn ? 'খুঁজুন' : 'SEARCH'}</span>
              </button>
            </div>
          </div>

          {/* Quick Filter Chips */}
          <div className="mt-3.5 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-bold text-gray-400 shrink-0 uppercase tracking-wider">
              Filter:
            </span>
            {quickFilters.map((qf) => (
              <button
                key={qf.id}
                type="button"
                onClick={() =>
                  setActiveQuickFilter(activeQuickFilter === qf.id ? 'all' : qf.id)
                }
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  activeQuickFilter === qf.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-400'
                }`}
              >
                {qf.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
