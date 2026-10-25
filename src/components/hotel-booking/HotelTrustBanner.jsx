'use client';

import { ShieldCheck, CreditCard, Car, Clock } from 'lucide-react';

export default function HotelTrustBanner({ isBn }) {
  const pillars = [
    {
      icon: CreditCard,
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400',
      title: isBn ? 'জিরো অগ্রিম পেমেন্ট' : 'Zero Advance Required',
      desc: isBn
        ? 'কোন ক্রেডিট কার্ড লাগবে না। হোটেলে পৌঁছে ক্যাশ বা বিকাশ দিয়ে পে করুন।'
        : 'Book in 30 seconds without prepaying. Settle your bill upon arrival.',
    },
    {
      icon: Car,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-950/60 dark:text-blue-400',
      title: isBn ? '২৪/৭ ফ্রি বিমানবন্দর পিকআপ' : 'Free 24/7 Airport Shuttle',
      desc: isBn
        ? 'টার্মিনাল ১, ২ ও ৩ থেকে সরাসরি হোটেলে নিয়ে যাওয়ার গাড়ির ব্যবস্থা।'
        : 'Dedicated terminal pickup and return transfer to Dhaka Airport (DAC).',
    },
    {
      icon: Clock,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-950/60 dark:text-purple-400',
      title: isBn ? 'ফ্লাইট-সিঙ্ক ওয়েক-আপ কল' : 'Flight-Synced Wake-Up Call',
      desc: isBn
        ? 'ফ্লাইট প্রস্থান সময়ের ২ ঘণ্টা পূর্বে নিশ্চিত অ্যালার্ম কল।'
        : 'Front desk automated alert scheduled 2 hours before your flight.',
    },
    {
      icon: ShieldCheck,
      color: 'text-amber-600 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400',
      title: isBn ? 'ভেরিফাইড ট্রানজিট হোটেল' : '100% Verified Stays',
      desc: isBn
        ? 'আশকোনা ও উত্তরা জোনে যাচাইকৃত রুম, সার্বক্ষণিক এসি ও জেনারেটর ব্যাকআপ।'
        : 'Audited room photos, verified air conditioning, and power backup.',
    },
  ];

  return (
    <section className="bg-white dark:bg-[#0f172a] border-b border-gray-200 dark:border-gray-800 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-3.5 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${item.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white leading-tight">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
