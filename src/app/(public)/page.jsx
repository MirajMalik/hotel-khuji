'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useHotelStore } from '@/lib/store';
import { VERIFIED_HOTELS, HOTEL_CURRENCIES } from '@/lib/hotelBookingData';
import AuthForm from '@/components/auth/AuthForm';

// Hotel Booking Components
import HotelNavbar from '@/components/hotel-booking/HotelNavbar';
import HotelSearchBar from '@/components/hotel-booking/HotelSearchBar';
import HotelTrustBanner from '@/components/hotel-booking/HotelTrustBanner';
import HotelCategoryFilter from '@/components/hotel-booking/HotelCategoryFilter';
import HotelFilters from '@/components/hotel-booking/HotelFilters';
import HotelCard from '@/components/hotel-booking/HotelCard';
import AirportProximityMap from '@/components/hotel-booking/AirportProximityMap';
import HotelBookingModal from '@/components/hotel-booking/HotelBookingModal';
import HotelFAQ from '@/components/hotel-booking/HotelFAQ';
import HotelFooter from '@/components/hotel-booking/HotelFooter';

export default function HotelBookingHomePage() {
  const { lang } = useHotelStore();
  const isBn = lang === 'bn';

  // State
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Active Booking Flow State
  const [activeBooking, setActiveBooking] = useState(null); // { hotel, room }

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('overnight');
  const [activeQuickFilter, setActiveQuickFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('recommended');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid' | 'map'
  const [selectedAmenity, setSelectedAmenity] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');

  // Currency
  const [activeCurrency, setActiveCurrency] = useState('BDT');
  const currentCurrencyObj = useMemo(() => {
    return HOTEL_CURRENCIES.find((c) => c.code === activeCurrency) || HOTEL_CURRENCIES[0];
  }, [activeCurrency]);

  // Check user session
  useEffect(() => {
    let isMounted = true;
    async function checkSession() {
      try {
        const res = await api.get('/auth/me');
        if (isMounted && res?.user) {
          setCurrentUser(res.user);
          localStorage.setItem('hotel_user', JSON.stringify(res.user));
          return;
        }
      } catch {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('hotel_user') : null;
        if (stored && isMounted) {
          try {
            setCurrentUser(JSON.parse(stored));
          } catch {}
        }
      }
    }
    checkSession();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch hotels from backend, enriched with verified transit catalog
  useEffect(() => {
    let isMounted = true;

    async function loadHotels() {
      try {
        let loaded = [];

        // 1. Try Express API
        try {
          const res = await api.get('/hotels');
          if (res?.data && res.data.length > 0) {
            loaded = res.data;
          }
        } catch {}

        // 2. Supabase Fallback if Express didn't return data
        if (loaded.length === 0) {
          const { data } = await supabase
            .from('hotels')
            .select('*, rooms(*)')
            .eq('subscription_status', 'active');
          if (data && data.length > 0) {
            loaded = data;
          }
        }

        // 3. Fallback or merge with verified catalog
        if (loaded.length === 0) {
          if (isMounted) setHotels(VERIFIED_HOTELS);
        } else {
          const liveIds = new Set(loaded.map((h) => h.id));
          const enrichedFallback = VERIFIED_HOTELS.filter((f) => !liveIds.has(f.id));
          if (isMounted) {
            setHotels([...loaded, ...enrichedFallback]);
          }
        }
      } catch (err) {
        console.error('Failed to load hotels:', err);
        if (isMounted) setHotels(VERIFIED_HOTELS);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadHotels();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    localStorage.removeItem('hotel_user');
    document.cookie = 'demo_role=; path=/; max-age=0';
    document.cookie = 'token=; path=/; max-age=0';
    setCurrentUser(null);
  }, []);

  // Amenities List
  const allAmenities = useMemo(() => {
    const set = new Set();
    hotels.forEach((h) => {
      if (Array.isArray(h.amenities)) {
        h.amenities.forEach((a) => set.add(a));
      }
    });
    return Array.from(set).slice(0, 8);
  }, [hotels]);

  // Filtering & Sorting
  const filteredAndSortedHotels = useMemo(() => {
    let result = hotels.filter((hotel) => {
      const name = (hotel.name || '').toLowerCase();
      const address = (hotel.address || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch = !query || name.includes(query) || address.includes(query);

      const matchesAmenity =
        selectedAmenity === 'all' ||
        (Array.isArray(hotel.amenities) && hotel.amenities.includes(selectedAmenity));

      let matchesCategory = true;
      if (selectedCategory === 'walking-distance') {
        matchesCategory = (hotel.airportWalkMinutes || 10) <= 8 || address.includes('ashkona');
      } else if (selectedCategory === 'hourly-pods') {
        matchesCategory =
          name.includes('pod') ||
          (Array.isArray(hotel.amenities) &&
            hotel.amenities.some((a) => a.toLowerCase().includes('hourly')));
      } else if (selectedCategory === 'free-shuttle') {
        matchesCategory =
          Array.isArray(hotel.amenities) &&
          hotel.amenities.some((a) => a.toLowerCase().includes('shuttle'));
      } else if (selectedCategory === 'uttara-suites') {
        matchesCategory = address.toLowerCase().includes('uttara') || name.toLowerCase().includes('uttara');
      } else if (selectedCategory === 'budget') {
        const minP = Number(hotel.base_price || 2800);
        matchesCategory = minP <= 2000;
      }

      let matchesQuick = true;
      if (activeQuickFilter === 'shuttle') {
        matchesQuick =
          Array.isArray(hotel.amenities) &&
          hotel.amenities.some((a) => a.toLowerCase().includes('shuttle'));
      } else if (activeQuickFilter === 'top-rated') {
        matchesQuick = Number(hotel.rating || 9.0) >= 8.8;
      } else if (activeQuickFilter === 'nearby') {
        matchesQuick = (hotel.airportDriveMinutes || 5) <= 5;
      }

      let matchesPrice = true;
      const price = Number(hotel.base_price || 2800);
      if (priceFilter === 'under-2000') {
        matchesPrice = price < 2000;
      } else if (priceFilter === '2000-3500') {
        matchesPrice = price >= 2000 && price <= 3500;
      } else if (priceFilter === 'luxury') {
        matchesPrice = price > 3500;
      }

      return matchesSearch && matchesAmenity && matchesCategory && matchesQuick && matchesPrice;
    });

    result.sort((a, b) => {
      const priceA = Number(a.base_price || 2800);
      const priceB = Number(b.base_price || 2800);
      const ratingA = Number(a.rating || 9.0);
      const ratingB = Number(b.rating || 9.0);
      const driveA = Number(a.airportDriveMinutes || 5);
      const driveB = Number(b.airportDriveMinutes || 5);

      if (sortBy === 'price-low') return priceA - priceB;
      if (sortBy === 'rating') return ratingB - ratingA;
      if (sortBy === 'distance') return driveA - driveB;
      return 0; // recommended
    });

    return result;
  }, [
    hotels,
    searchQuery,
    selectedAmenity,
    selectedCategory,
    activeQuickFilter,
    priceFilter,
    sortBy,
  ]);

  const handleOpenBooking = (hotel, room) => {
    const selectedRoom = room || (Array.isArray(hotel.rooms) ? hotel.rooms[0] : null);
    setActiveBooking({ hotel, room: selectedRoom });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-gray-900 dark:text-zinc-50 flex flex-col font-sans transition-colors duration-200">
      {/* ─── 1. Navigation Header ─── */}
      <HotelNavbar
        currentUser={currentUser}
        onOpenAuth={() => setShowAuthModal(true)}
        onSignOut={handleSignOut}
        activeCurrency={activeCurrency}
        onCurrencyChange={setActiveCurrency}
      />

      {/* ─── 2. Hotel Search Engine Bar ─── */}
      <HotelSearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        onSearch={() => {}}
        activeQuickFilter={activeQuickFilter}
        setActiveQuickFilter={setActiveQuickFilter}
        isBn={isBn}
      />

      {/* ─── 3. Hotel Trust & Guarantee Strip ─── */}
      <HotelTrustBanner isBn={isBn} />

      {/* ─── 4. Category Filter Bar ─── */}
      <HotelCategoryFilter
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        isBn={isBn}
      />

      {/* ─── 5. Hotel Listings & Room Selection Flow ─── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <HotelFilters
          totalCount={filteredAndSortedHotels.length}
          sortBy={sortBy}
          setSortBy={setSortBy}
          viewMode={viewMode}
          setViewMode={setViewMode}
          selectedAmenity={selectedAmenity}
          setSelectedAmenity={setSelectedAmenity}
          amenities={allAmenities}
          priceFilter={priceFilter}
          setPriceFilter={setPriceFilter}
          isBn={isBn}
        />

        {/* Loading State */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 animate-pulse flex flex-col md:flex-row gap-6"
              >
                <div className="w-full md:w-72 aspect-[16/10] bg-gray-200 dark:bg-gray-800 rounded-2xl" />
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-lg w-2/3" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-lg w-1/3" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-lg w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredAndSortedHotels.length === 0 ? (
          /* Empty Search State */
          <div className="text-center py-16 px-4 bg-white dark:bg-[#1e293b] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <span className="text-5xl block mb-3">🏨</span>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">
              {isBn ? 'কোন হোটেল পাওয়া যায়নি' : 'No Hotels Match Your Search Criteria'}
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto leading-relaxed">
              Try adjusting your area query or reset the filters to browse all verified Dhaka Airport hotels.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedAmenity('all');
                setSelectedCategory(null);
                setActiveQuickFilter('all');
                setPriceFilter('all');
              }}
              className="mt-5 px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === 'map' ? (
          /* Interactive Airport Proximity Map */
          <AirportProximityMap
            hotels={filteredAndSortedHotels}
            onSelectHotel={(h) => handleOpenBooking(h, null)}
            isBn={isBn}
            currencySymbol={currentCurrencyObj.symbol}
          />
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedHotels.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                viewMode="grid"
                currencySymbol={currentCurrencyObj.symbol}
                currencyRate={currentCurrencyObj.rate}
                onBookRoom={handleOpenBooking}
                isBn={isBn}
              />
            ))}
          </div>
        ) : (
          /* List View with Room Selection Drawer */
          <div className="space-y-5">
            {filteredAndSortedHotels.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                viewMode="list"
                currencySymbol={currentCurrencyObj.symbol}
                currencyRate={currentCurrencyObj.rate}
                onBookRoom={handleOpenBooking}
                isBn={isBn}
              />
            ))}
          </div>
        )}
      </main>

      {/* ─── 6. Booking FAQ ─── */}
      <HotelFAQ isBn={isBn} />

      {/* ─── 7. Footer ─── */}
      <HotelFooter isBn={isBn} />

      {/* ─── 8. The Hotel Booking & Checkout Flow Modal ─── */}
      {activeBooking && (
        <HotelBookingModal
          hotel={activeBooking.hotel}
          room={activeBooking.room}
          onClose={() => setActiveBooking(null)}
          onSuccess={() => {}}
          isBn={isBn}
        />
      )}

      {/* ─── User Sign In / Register Modal ─── */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 flex items-center justify-center border border-gray-200 dark:border-gray-700 shadow-xl"
            >
              ✕
            </button>
            <div className="bg-white dark:bg-[#1e293b] rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="mb-4">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                  Hotel Khuji Account
                </h3>
                <p className="text-xs text-gray-500">Sign in to manage your transit bookings</p>
              </div>
              <AuthForm
                defaultRole="customer"
                onSuccess={() => setShowAuthModal(false)}
                redirectPath="/hotels"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
