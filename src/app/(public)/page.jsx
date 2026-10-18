'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import AuthForm from '@/components/auth/AuthForm';
import { useHotelStore } from '@/lib/store';

// Curated fallback hotel imagery
const DEFAULT_COVER_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';

export default function MarketplaceHomePage() {
  const { theme, toggleTheme } = useHotelStore();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAmenity, setSelectedAmenity] = useState('all');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Check current session via Express + PostgreSQL
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await api.get('/auth/me');
        if (res?.user) {
          setCurrentUser(res.user);
          localStorage.setItem('hotel_user', JSON.stringify(res.user));
          return;
        }
      } catch (err) {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('hotel_user') : null;
        if (stored) {
          try {
            setCurrentUser(JSON.parse(stored));
          } catch (e) {}
        }
      }
    }
    checkSession();
  }, []);

  // Fetch all active subscription hotels + rooms
  useEffect(() => {
    async function fetchActiveHotels() {
      try {
        // 1. Try Express + PostgreSQL endpoint
        try {
          const res = await api.get('/hotels');
          if (res?.data && res.data.length > 0) {
            setHotels(res.data);
            setLoading(false);
            return;
          }
        } catch (expressErr) {
          // Express server not responding, fallback to Supabase
        }

        // 2. Supabase Fallback
        const { data, error } = await supabase
          .from('hotels')
          .select('*, rooms(*)')
          .eq('subscription_status', 'active')
          .order('name', { ascending: true });

        if (error) {
          console.warn('Subscription column query fallback:', error.message);
          const fallbackRes = await supabase.from('hotels').select('*, rooms(*)');
          if (fallbackRes.data) {
            setHotels(fallbackRes.data);
          }
        } else if (data && data.length > 0) {
          setHotels(data);
        } else {
          const allHotels = await supabase.from('hotels').select('*, rooms(*)');
          if (allHotels.data) {
            setHotels(allHotels.data);
          }
        }
      } catch (err) {
        console.error('Failed to load marketplace hotels:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchActiveHotels();
  }, []);

  // Extract all unique amenities across all hotels
  const allAmenities = useMemo(() => {
    const set = new Set();
    hotels.forEach((h) => {
      if (Array.isArray(h.amenities)) {
        h.amenities.forEach((a) => set.add(a));
      }
    });
    return ['all', ...Array.from(set)];
  }, [hotels]);

  // Filtered hotels based on search & amenity
  const filteredHotels = useMemo(() => {
    return hotels.filter((hotel) => {
      const matchesSearch =
        hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hotel.address.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesAmenity =
        selectedAmenity === 'all' ||
        (Array.isArray(hotel.amenities) && hotel.amenities.includes(selectedAmenity));

      return matchesSearch && matchesAmenity;
    });
  }, [hotels, searchQuery, selectedAmenity]);

  const handleSignOut = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}
    localStorage.removeItem('hotel_user');
    document.cookie = 'demo_role=; path=/; max-age=0';
    document.cookie = 'token=; path=/; max-age=0';
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-surface-0 text-zinc-100 flex flex-col">
      {/* ─── Top Marketplace Navigation ─── */}
      <nav className="sticky top-0 z-40 bg-surface-1/90 backdrop-blur-xl border-b border-zinc-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008V7.5z" />
              </svg>
            </div>
            <div>
              <span className="text-base font-extrabold text-white tracking-tight block leading-tight">
                Hotel Khuji
              </span>
              <span className="text-[10px] text-brand-400 font-semibold uppercase tracking-wider block">
                Dhaka Airport Transit Marketplace
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Global Day / Night Mode Button on first appearing site */}
            <button
              onClick={toggleTheme}
              className="px-3.5 py-1.5 rounded-xl font-bold text-xs border border-zinc-700 bg-surface-2 hover:bg-surface-3 text-amber-300 flex items-center gap-1.5 shadow-sm transition-all"
              title="Click to switch theme globally across all pages"
            >
              <span>{theme === 'day' ? '☀️ Day Mode' : '🌙 Night Mode'}</span>
            </button>

            <Link
              href="/counter-view"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white px-3.5 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 border border-zinc-800 transition-colors"
            >
              <span>🏨</span>
              <span>Owner Counter View</span>
            </Link>

            {currentUser ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/hotels"
                  className="text-xs font-bold text-white px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 shadow-md shadow-brand-600/30 transition-all flex items-center gap-1.5"
                >
                  <span>🏨</span>
                  <span>Go to Hotels</span>
                </Link>
                <span className="text-xs text-zinc-400 hidden md:inline">
                  {currentUser.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-xs font-semibold text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-lg border border-rose-950 bg-rose-950/30 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="text-xs font-bold text-white px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 shadow-md shadow-brand-600/30 transition-all flex items-center gap-1.5"
              >
                <span>👤</span>
                <span>Sign In / Register</span>
              </button>
            )}
          </div>

        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden py-14 sm:py-20 px-4 sm:px-6 bg-gradient-to-b from-surface-1 to-surface-0 border-b border-zinc-800/60">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-600/10 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            Verified Transit Hotels Around Hazrat Shahjalal International Airport (DAC)
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Rest &amp; Refresh During Your Layover.{' '}
            <span className="bg-gradient-to-r from-brand-400 to-emerald-400 bg-clip-text text-transparent">
              Zero Advance Required.
            </span>
          </h1>

          <p className="mt-5 text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Discover verified transit hotels in Ashkona and Uttara within 5 to 10 minutes of Dhaka
            Airport. Hourly pods, overnight suites, and complimentary airport shuttle.
          </p>

          {/* Search & Filter Bar */}
          <div className="mt-8 max-w-2xl mx-auto flex flex-col sm:flex-row gap-2.5 p-2 bg-surface-2/80 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl">
            <div className="relative flex-1 flex items-center">
              <span className="absolute left-3.5 text-zinc-500">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hotel name, Ashkona, Uttara Sector..."
                className="w-full pl-10 pr-4 py-2.5 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
              />
            </div>
            <button
              onClick={() => {}}
              className="px-6 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-colors shadow-md"
            >
              Search Hotels
            </button>
          </div>

          {/* Amenities Quick Filters */}
          {allAmenities.length > 1 && (
            <div className="mt-5 flex items-center justify-center gap-1.5 flex-wrap">
              {allAmenities.map((amenity) => (
                <button
                  key={amenity}
                  onClick={() => setSelectedAmenity(amenity)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedAmenity === amenity
                      ? 'bg-brand-600 text-white'
                      : 'bg-surface-2 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  {amenity === 'all' ? 'All Amenities' : amenity}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Active Hotels Aggregator Grid ─── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Verified Active Hotels
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Real-time room availability &amp; instant reservation
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-surface-1 border border-zinc-800 text-zinc-400">
            {filteredHotels.length} {filteredHotels.length === 1 ? 'Hotel' : 'Hotels'} Listed
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-surface-1 border border-zinc-850 rounded-3xl p-4 animate-pulse space-y-4"
              >
                <div className="aspect-[16/10] bg-surface-2 rounded-2xl" />
                <div className="h-5 bg-surface-2 rounded w-3/4" />
                <div className="h-4 bg-surface-2 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredHotels.length === 0 ? (
          <div className="text-center py-16 px-4 bg-surface-1/50 rounded-3xl border border-zinc-800/80">
            <span className="text-4xl block mb-3">🏨</span>
            <h3 className="text-lg font-bold text-zinc-200">No active hotels match your criteria</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
              Try adjusting your search query or reset the amenity filter to view all transit hotels.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedAmenity('all');
              }}
              className="mt-4 px-4 py-2 text-xs font-semibold bg-brand-600 text-white rounded-xl"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredHotels.map((hotel) => {
              // Extract rooms info
              const rooms = Array.isArray(hotel.rooms) ? hotel.rooms : [];
              const availableRooms = rooms.filter((r) => r.current_status === 'available');
              const minPrice = rooms.length > 0
                ? Math.min(...rooms.map((r) => Number(r.base_price) || 99999))
                : 1800;

              const coverImage = hotel.cover_image_url || DEFAULT_COVER_IMAGE;
              const amenities = Array.isArray(hotel.amenities) && hotel.amenities.length > 0
                ? hotel.amenities
                : ['Free Airport Shuttle', '24/7 Check-in', 'High-Speed Wi-Fi', 'Soundproof'];

              return (
                <div
                  key={hotel.id}
                  className="group flex flex-col bg-surface-1 border border-zinc-800/80 hover:border-zinc-700 rounded-3xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-brand-500/10 hover:-translate-y-1"
                >
                  {/* Hotel Cover Image */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-zinc-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverImage}
                      alt={hotel.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-transparent to-black/30" />

                    {/* Top status badges */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                      <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/90 text-white shadow-md flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Verified Partner
                      </span>
                      <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-surface-0/80 backdrop-blur-md text-amber-400 border border-zinc-700/60">
                        ⭐ 4.9 (95+)
                      </span>
                    </div>

                    {/* Available rooms counter */}
                    <div className="absolute bottom-3 left-4">
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-surface-0/90 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
                        {availableRooms.length} Rooms Available Today
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-brand-400 transition-colors tracking-tight">
                        {hotel.name}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
                        <span>📍</span>
                        <span className="truncate">{hotel.address}</span>
                      </p>

                      {/* Amenities Chips */}
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {amenities.slice(0, 4).map((amenity, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-surface-2 text-zinc-300 rounded-lg border border-zinc-800"
                          >
                            ✓ {amenity}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Pricing & CTA */}
                    <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-zinc-500 block font-medium">Starting from</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-black text-white">
                            {formatCurrency(minPrice)}
                          </span>
                          <span className="text-xs text-zinc-500">/ night</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/${hotel.id}/book`}
                          className="px-4 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-colors shadow-md shadow-brand-600/30"
                        >
                          Book Online →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── Two-Sided Platform Banner: Customer + Owner SaaS ─── */}
      <section className="bg-surface-1 border-t border-zinc-800 py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Guest Perks */}
          <div className="p-8 rounded-3xl bg-surface-2/60 border border-zinc-800 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
                For Transit Passengers
              </span>
              <h3 className="text-2xl font-black text-white mt-1">
                Zero Advance Booking. Free Airport Pickup.
              </h3>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                Delayed flights or long transits in Dhaka? Book your room in 30 seconds. Pay
                conveniently upon arrival at the front desk with cash or mobile banking.
              </p>
            </div>
            <button
              onClick={() => setShowAuthModal(true)}
              className="mt-6 self-start px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-colors"
            >
              Create Free Guest Account
            </button>
          </div>

          {/* Hotel Owner SaaS Perks */}
          <div className="p-8 rounded-3xl bg-surface-2/60 border border-brand-500/20 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                For Hotel Owners &amp; Receptionists
              </span>
              <h3 className="text-2xl font-black text-white mt-1">
                Owner SaaS &amp; Digital Counter Brochure
              </h3>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                Equip your reception desk with a dedicated walk-in brochure view. Instant 1-click
                check-ins, real-time occupancy synchronization, and zero commission leakages.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <Link
                href="/counter-view"
                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-lg shadow-emerald-600/20"
              >
                Open Receptionist Counter View →
              </Link>
              <Link
                href="/login?redirect=/counter-view"
                className="px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white bg-surface-3 rounded-xl transition-colors"
              >
                Owner Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Customer / Owner Auth Modal ─── */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-surface-3 hover:bg-surface-2 text-white flex items-center justify-center border border-zinc-700 shadow-xl transition-colors"
            >
              ✕
            </button>
            <AuthForm
              defaultRole="customer"
              onSuccess={() => setShowAuthModal(false)}
              redirectPath="/hotels"
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-8 px-6 text-center text-xs text-zinc-500">
        <p>© 2026 Hotel Khuji Platform • Hazrat Shahjalal International Airport Transit Network</p>
      </footer>
    </div>
  );
}
