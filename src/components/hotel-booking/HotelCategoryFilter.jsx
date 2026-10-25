'use client';

import { TRANSIT_CATEGORIES } from '@/lib/hotelBookingData';
import { Hotel, MapPin, Clock, Car, Building, Tag } from 'lucide-react';

const iconMap = {
  Hotel,
  MapPin,
  Clock,
  Car,
  Building,
  Tag,
};

export default function HotelCategoryFilter({ selectedCategory, onSelectCategory, isBn }) {
  return (
    <section className="py-4 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#0f172a] border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {TRANSIT_CATEGORIES.map((cat) => {
          const Icon = iconMap[cat.icon] || Hotel;
          const isSelected = (selectedCategory || 'all') === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id === 'all' ? null : cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                  : 'bg-gray-50 dark:bg-[#1e293b] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.title}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
