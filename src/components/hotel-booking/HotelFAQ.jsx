'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { HOTEL_FAQS } from '@/lib/hotelBookingData';

export default function HotelFAQ({ isBn }) {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/70 dark:bg-[#090e1a] border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Hotel Khuji Booking FAQ</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            {isBn ? 'হোটেল বুকিং সংক্রান্ত সচরাচর জিজ্ঞাসা' : 'Frequently Asked Questions'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Airport pickup, zero advance payment, and transit flight wake-up calls.
          </p>
        </div>

        <div className="space-y-3">
          {HOTEL_FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-[#1e293b]/70 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4"
                >
                  <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white leading-snug">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-blue-600 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-3 animate-in fade-in">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
