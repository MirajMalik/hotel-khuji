'use client';

import { List, Grid, Map, ArrowUpDown } from 'lucide-react';

export default function HotelFilters({
  totalCount,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  selectedAmenity,
  setSelectedAmenity,
  amenities = [],
  priceFilter,
  setPriceFilter,
  isBn,
}) {
  const sortOptions = [
    { id: 'recommended', label: isBn ? 'রিকমেন্ডেড' : 'Recommended' },
    { id: 'price-low', label: isBn ? 'সর্বনিম্ন মূল্য' : 'Lowest Price' },
    { id: 'distance', label: isBn ? 'বিমানবন্দরের নিকটতম' : 'Nearest to Airport' },
    { id: 'rating', label: isBn ? 'সেরা রেটিং' : 'Highest Rating' },
  ];

  const priceRanges = [
    { id: 'all', label: isBn ? 'সকল বাজেট' : 'All Budgets' },
    { id: 'under-2000', label: isBn ? '< ৳২,০০০' : '< ৳2,000' },
    { id: '2000-3500', label: isBn ? '৳২,০০০ - ৳৩,৫০০' : '৳2,000 - ৳3,500' },
    { id: 'luxury', label: isBn ? '৳৩,৫০০+ প্রিমিয়াম' : '৳3,500+ Premium' },
  ];

  return (
    <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 mb-6 shadow-xs">
      {/* Top Row: Total Count & View Mode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-tight">
              {totalCount} {isBn ? 'টি ভেরিফাইড ট্রানজিট হোটেল' : 'Verified Hotels in Dhaka Airport Zone'}
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {isBn
              ? 'জিরো অগ্রিম বুকিং • টার্মিনাল ১, ২ ও ৩ থেকে সরাসরি ফ্রি পিকআপ'
              : 'Zero advance required • Free pickup directly from Terminals 1, 2 & 3'}
          </p>
        </div>

        {/* View Mode Toggle: List vs Grid vs Map */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-white dark:bg-[#0f172a] text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-[#0f172a] text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Grid</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'map'
                ? 'bg-white dark:bg-[#0f172a] text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Map</span>
          </button>
        </div>
      </div>

      {/* Middle Row: Sort Tabs & Price Presets */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        {/* Sort Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
            <ArrowUpDown className="w-3 h-3" />
            Sort:
          </span>
          {sortOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSortBy(opt.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                sortBy === opt.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Price Presets */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {priceRanges.map((pr) => (
            <button
              key={pr.id}
              onClick={() => setPriceFilter(pr.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                priceFilter === pr.id
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              {pr.label}
            </button>
          ))}
        </div>
      </div>

      {/* Amenity Filter Chips */}
      {amenities.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1">
            Amenities:
          </span>
          <button
            onClick={() => setSelectedAmenity('all')}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedAmenity === 'all'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            All
          </button>
          {amenities.map((am) => (
            <button
              key={am}
              onClick={() => setSelectedAmenity(selectedAmenity === am ? 'all' : am)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedAmenity === am
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              {am}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
