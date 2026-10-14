import { connection } from 'next/server';
import FrontDeskView from '@/components/dashboard/FrontDeskView';
import LiveClock from '@/components/dashboard/LiveClock';

/**
 * DashboardShell — Async server component that reads searchParams.
 * Must be rendered inside <Suspense> because it calls connection().
 */
export default async function DashboardShell({ searchParams }) {
  await connection();

  const params = await searchParams;
  const hotelId = params?.hotelId || process.env.NEXT_PUBLIC_DEMO_HOTEL_ID || 'demo';
  const hotelName = params?.hotelName || 'Hotel Khuji';

  return (
    <div className="min-h-screen bg-surface-0">
      {/* Top navigation bar */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 bg-surface-1/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-500/20">
            <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008V7.5z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-zinc-200">Hotel Khuji</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-500 font-medium border border-brand-500/20">
            PMS
          </span>
        </div>

        <div className="flex items-center gap-3">
          <LiveClock />
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
            <span className="text-xs font-semibold text-zinc-400">FD</span>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <FrontDeskView hotelId={hotelId} hotelName={hotelName} />
      </main>
    </div>
  );
}
