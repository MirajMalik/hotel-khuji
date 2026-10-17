import { connection } from 'next/server';
import Link from 'next/link';
import FrontDeskView from '@/components/dashboard/FrontDeskView';
import LiveClock from '@/components/dashboard/LiveClock';

/**
 * DashboardShell — Operational Front Desk PMS view.
 * Now equipped with comprehensive back navigation links to:
 *  - /owner/dashboard (Owner Management Panel)
 *  - /counter-view (Receptionist Counter View)
 *  - /hotels (Guest Hotel Marketplace)
 */
export default async function DashboardShell({ searchParams }) {
  await connection();

  const params = await searchParams;
  const rawHotelId = params?.hotelId;
  const hotelId = (rawHotelId && rawHotelId !== 'demo')
    ? rawHotelId
    : (process.env.NEXT_PUBLIC_DEMO_HOTEL_ID || 'a0000000-0000-0000-0000-000000000001');
  const hotelName = params?.hotelName || 'Ashkona Airport Transit Inn';

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">
      {/* Top navigation bar */}
      <nav className="sticky top-0 z-40 bg-surface-1/90 backdrop-blur-xl border-b border-zinc-800/80 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Brand + Quick Back Navigation */}
          <div className="flex items-center gap-3">
            <Link
              href="/owner/dashboard"
              className="flex items-center gap-2 group text-zinc-400 hover:text-white transition-colors"
              title="Return to Owner Management Panel"
            >
              <span className="w-8 h-8 rounded-xl bg-surface-2 group-hover:bg-brand-600/20 border border-zinc-700 group-hover:border-brand-500/50 flex items-center justify-center text-xs text-brand-400 transition-all">
                ←
              </span>
              <span className="text-xs font-bold text-zinc-300 group-hover:text-white">
                Back to Owner Panel
              </span>
            </Link>

            <span className="text-zinc-600">|</span>

            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white">{hotelName}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 font-bold border border-brand-500/20">
                Front Desk PMS
              </span>
            </div>
          </div>

          {/* Right: Quick Switcher Links & Clock */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Link
              href="/counter-view"
              className="px-3 py-1.5 text-xs font-semibold bg-surface-2 hover:bg-surface-3 text-zinc-300 hover:text-white rounded-xl border border-zinc-800 transition-colors flex items-center gap-1.5"
            >
              <span>🖥️</span>
              <span>Counter View</span>
            </Link>

            <Link
              href="/hotels"
              className="px-3 py-1.5 text-xs font-semibold bg-surface-2 hover:bg-surface-3 text-zinc-300 hover:text-white rounded-xl border border-zinc-800 transition-colors flex items-center gap-1.5"
            >
              <span>🏨</span>
              <span>Hotels Marketplace</span>
            </Link>

            <div className="hidden md:flex items-center">
              <LiveClock />
            </div>

            <Link
              href="/login"
              className="px-3 py-1.5 text-xs font-semibold bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-900/60 rounded-xl transition-colors"
            >
              Switch Account
            </Link>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <FrontDeskView hotelId={hotelId} hotelName={hotelName} />
      </main>
    </div>
  );
}
