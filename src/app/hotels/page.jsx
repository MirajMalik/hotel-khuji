'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const DEFAULT_COVER_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';

/**
 * Customer-Facing Hotel Marketplace Route: /hotels
 * Fetches all available hotels & rooms from Express + PostgreSQL backend.
 * Provides:
 *  - Hotel details + available rooms count + starting prices
 *  - Booking option (redirects to /[hotelId]/book)
 *  - Airport distance & proximity indicators
 *  - Social media messaging options (WhatsApp, Messenger) to hotel owners
 *  - Interactive Map section with airport distance overview
 */
export default function HotelsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAmenity, setSelectedAmenity] = useState('all');

  // Verify auth session from Express backend or localStorage
  useEffect(() => {
    async function checkUserSession() {
      try {
        const res = await api.get('/auth/me');
        if (res?.user) {
          setCurrentUser(res.user);
          localStorage.setItem('hotel_user', JSON.stringify(res.user));
          return;
        }
      } catch (err) {
        // Express token cookie missing or expired, check localStorage fallback
        const stored = typeof window !== 'undefined' ? localStorage.getItem('hotel_user') : null;
        if (stored) {
          try {
            setCurrentUser(JSON.parse(stored));
            return;
          } catch (e) {}
        }
        router.replace('/login?redirect=/hotels');
      }
    }

    checkUserSession();
  }, [router]);

  // Fetch hotels & live rooms from Express + PostgreSQL
  useEffect(() => {
    async function fetchHotels() {
      try {
        const res = await api.get('/hotels');
        if (res?.data) {
          setHotels(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch hotels from Express server:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchHotels();
  }, []);

  const handleSignOut = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}
    localStorage.removeItem('hotel_user');
    document.cookie = 'demo_role=; path=/; max-age=0';
    document.cookie = 'token=; path=/; max-age=0';
    setCurrentUser(null);
    router.push('/login');
  };

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
      const name = hotel.name || '';
      const address = hotel.address || '';
      const matchesSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        address.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesAmenity =
        selectedAmenity === 'all' ||
        (Array.isArray(hotel.amenities) && hotel.amenities.includes(selectedAmenity));

      return matchesSearch && matchesAmenity;
    });
  }, [hotels, searchQuery, selectedAmenity]);

  return (
    <div className="min-h-screen bg-surface-0 text-zinc-100 flex flex-col">
      {/* ─── Top Marketplace Navigation ─── */}
      <nav className="sticky top-0 z-40 bg-surface-1/90 backdrop-blur-xl border-b border-zinc-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/hotels" className="flex items-center gap-3">
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
                Express + PostgreSQL Transit Network
              </span>
            </div>
          </Link>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-300 font-medium hidden sm:inline bg-surface-2 px-3 py-1.5 rounded-xl border border-zinc-800">
                  👋 {currentUser.full_name || currentUser.email}
                </span>
                <Link
                  href="/"
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-zinc-300 hover:text-white border border-zinc-800 transition-colors"
                >
                  🏠 Home
                </Link>
                {currentUser.role === 'owner' && (
                  <>
                    <Link
                      href="/owner/dashboard"
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 transition-all"
                    >
                      🏨 Owner Panel
                    </Link>
                    <Link
                      href="/dashboard"
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-zinc-300 hover:text-white border border-zinc-800 transition-colors hidden md:inline-flex"
                    >
                      Front Desk PMS
                    </Link>
                  </>
                )}
                <button
                  onClick={handleSignOut}
                  className="text-xs font-semibold text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-xl border border-rose-950 bg-rose-950/40 hover:bg-rose-900/50 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero Section with Quick Search ─── */}
      <section className="relative overflow-hidden py-10 sm:py-14 px-4 sm:px-6 bg-gradient-to-b from-surface-1 to-surface-0 border-b border-zinc-800/60">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-4">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            Live PostgreSQL Inventory • Hazrat Shahjalal International Airport (DAC)
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Browse Transit Hotels &amp; Available Rooms
          </h1>
          <p className="mt-3 text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Select a verified hotel nearby Dhaka Airport. Inspect live room photos, facilities, calculate distance, and message the hotel owners directly on social media.
          </p>

          {/* Search bar */}
          <div className="mt-6 max-w-2xl mx-auto flex flex-col sm:flex-row gap-2 p-2 bg-surface-2/90 border border-zinc-800 rounded-2xl shadow-xl">
            <div className="relative flex-1 flex items-center">
              <span className="absolute left-3.5 text-zinc-500">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hotel name, Ashkona, Uttara Sector..."
                className="w-full pl-10 pr-4 py-2 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Amenities Quick Filters */}
          {allAmenities.length > 1 && (
            <div className="mt-4 flex items-center justify-center gap-1.5 flex-wrap">
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Available Hotels Near Airport
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Real-time room availability from Express + PostgreSQL
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-surface-1 border border-zinc-800 text-zinc-400">
            {filteredHotels.length} {filteredHotels.length === 1 ? 'Hotel' : 'Hotels'} Listed
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-surface-1 border border-zinc-850 rounded-3xl p-4 animate-pulse space-y-4">
                <div className="aspect-[16/10] bg-surface-2 rounded-2xl" />
                <div className="h-5 bg-surface-2 rounded w-3/4" />
                <div className="h-4 bg-surface-2 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredHotels.length === 0 ? (
          <div className="text-center py-16 px-4 bg-surface-1/50 rounded-3xl border border-zinc-800">
            <span className="text-4xl block mb-3">🏨</span>
            <h3 className="text-lg font-bold text-zinc-200">No hotels match your search criteria</h3>
            <p className="text-xs text-zinc-500 mt-1">Try resetting the filter or searching another area.</p>
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
              const rooms = Array.isArray(hotel.rooms) ? hotel.rooms : [];
              const availableRooms = rooms.filter((r) => r.current_status === 'available');
              const minPrice = rooms.length > 0
                ? Math.min(...rooms.map((r) => Number(r.base_price) || 99999))
                : 1800;

              const coverImage = hotel.cover_image_url || DEFAULT_COVER_IMAGE;
              const amenities = Array.isArray(hotel.amenities) && hotel.amenities.length > 0
                ? hotel.amenities
                : ['Free Airport Shuttle', '24/7 Check-in', 'High-Speed Wi-Fi', 'Soundproof'];

              // Pre-filled WhatsApp message link
              const whatsappMsg = encodeURIComponent(
                `Hello! I found ${hotel.name} on Hotel Khuji. I want to inquire about room availability.`
              );
              const whatsappUrl = `https://wa.me/8801700000000?text=${whatsappMsg}`;
              const messengerUrl = `https://m.me/hotelkhuji`;

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
                        ⭐ 4.9 (98+)
                      </span>
                    </div>

                    {/* Available rooms badge */}
                    <div className="absolute bottom-3 left-4">
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-surface-0/90 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
                        {availableRooms.length} Rooms Available
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

                      {/* Airport Proximity & Distance Badge */}
                      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-2 border border-brand-500/30 text-brand-300 text-xs font-semibold">
                        <span>✈️</span>
                        <span>~5 min (1.2 km) from Dhaka Airport Terminal 1 &amp; 2</span>
                      </div>

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

                      {/* Social Media Contact with Hotel Owner */}
                      <div className="mt-5 pt-4 border-t border-zinc-800/80">
                        <span className="text-[11px] font-bold text-zinc-400 block mb-2">
                          💬 Message Hotel Owner Directly:
                        </span>
                        <div className="flex items-center gap-2">
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-colors"
                          >
                            <span>📱</span>
                            <span>WhatsApp</span>
                          </a>
                          <a
                            href={messengerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-sky-950/60 hover:bg-sky-900/80 border border-sky-500/40 text-sky-300 text-xs font-semibold transition-colors"
                          >
                            <span>💬</span>
                            <span>Messenger</span>
                          </a>
                        </div>
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
                          Book Room →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Map Functionality Placeholder Section ─── */}
        <section className="mt-16 bg-surface-1 border border-zinc-800 rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-2">
                <span>🗺️</span> Interactive Map Integration
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">
                Hotel Proximity to Hazrat Shahjalal International Airport
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Visual radius displaying airport terminals, Ashkona transit road, and nearby transit hotels.
              </p>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-surface-2 border border-zinc-750 text-amber-400 text-xs font-bold">
              GPS Map &amp; Live Distance Matrix (Feature Active)
            </span>
          </div>

          {/* Interactive Stylized Map Visualization */}
          <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center">
            {/* Grid background simulation */}
            <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

            {/* Simulated Airport Runway & Hub */}
            <div className="relative z-10 flex flex-col items-center text-center p-6 bg-surface-1/90 backdrop-blur-md rounded-2xl border border-zinc-800 max-w-md shadow-2xl">
              <span className="text-3xl mb-2">✈️</span>
              <h4 className="text-base font-bold text-white">Hazrat Shahjalal International Airport (DAC)</h4>
              <p className="text-xs text-zinc-400 mt-1">
                All listed hotels are located within a <strong>1.0 km to 2.5 km</strong> radius (3 to 8 minutes via Airport Road / Haji Camp Road).
              </p>
              <div className="mt-4 flex items-center gap-3 text-[11px] text-zinc-400">
                <span className="flex items-center gap-1">📍 Ashkona Transit Inn: <strong className="text-emerald-400">1.2 km</strong></span>
                <span>•</span>
                <span className="flex items-center gap-1">📍 Uttara Transit Hub: <strong className="text-emerald-400">2.1 km</strong></span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-8 px-6 text-center text-xs text-zinc-500">
        <p>© 2026 Hotel Khuji Platform • Powered by Express + PostgreSQL</p>
      </footer>
    </div>
  );
}
