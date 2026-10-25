'use client';

import Link from 'next/link';
import { Building2, ShieldCheck, PhoneCall, Mail } from 'lucide-react';

export default function HotelFooter({ isBn }) {
  return (
    <footer className="bg-white dark:bg-[#090e1a] text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                Hotel Khuji
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
              {isBn
                ? 'হযরত শাহজালাল আন্তর্জাতিক বিমানবন্দর (DAC) সংলগ্ন ভেরিফাইড ট্রানজিট হোটেল বুকিং নেটওয়ার্ক। জিরো অগ্রিম প্রদান, ফ্রি বিমানবন্দর শাটল এবং ফ্লাইট-সিঙ্কড ওয়েক-আপ অ্যালার্ম।'
                : 'The dedicated transit accommodation booking platform for Dhaka Hazrat Shahjalal International Airport (DAC). Zero advance required, complimentary 24/7 terminal pickup, and flight departure synchronization.'}
            </p>
            <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Verified Dhaka Airport Transit Network</span>
            </div>
          </div>

          {/* Hotel Booking Quick Links */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white mb-3">
              Hotel Booking
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/hotels" className="hover:text-blue-600 transition-colors">
                  All Transit Hotels
                </Link>
              </li>
              <li>
                <Link href="/hotels?search=Ashkona" className="hover:text-blue-600 transition-colors">
                  Ashkona Hotels (near Terminal 3)
                </Link>
              </li>
              <li>
                <Link href="/hotels?search=Uttara" className="hover:text-blue-600 transition-colors">
                  Uttara Sector 1 & 3 Suites
                </Link>
              </li>
              <li>
                <Link href="/hotels?filter=hourly" className="hover:text-blue-600 transition-colors">
                  Hourly Layover Pods (4h/6h)
                </Link>
              </li>
            </ul>
          </div>

          {/* For Hotel Owners & Hoteliers */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white mb-3">
              For Hotel Owners
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/counter-view"
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>🏨</span>
                  <span>Receptionist Counter View</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/owner/dashboard"
                  className="font-medium hover:text-blue-600 transition-colors"
                >
                  Owner Dashboard PMS
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="font-medium hover:text-blue-600 transition-colors"
                >
                  Front Desk Wake-Up Queue
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="font-medium hover:text-blue-600 transition-colors"
                >
                  Manager / Owner Login
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 py-6 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-[#090e1a]/80">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-500">
          <p>© 2026 Hotel Khuji Platform • Hazrat Shahjalal International Airport (DAC)</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-gray-700 cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-gray-700 cursor-pointer">Terms & Conditions</span>
            <span>•</span>
            <span className="hover:text-gray-700 cursor-pointer">Airport Shuttle Guide</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
