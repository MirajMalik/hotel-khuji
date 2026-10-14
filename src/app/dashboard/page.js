import FrontDeskView from '@/components/dashboard/FrontDeskView';

export const metadata = {
  title: 'Front Desk — Hotel Khuji PMS',
  description: 'Real-time room management dashboard for hotel front desk staff.',
};

/**
 * Dashboard Page — The receptionist's 24/7 operational screen.
 * 
 * In production, hotelId comes from the authenticated user's session.
 * For now, we use a query param or env var as a placeholder.
 */
export default function DashboardPage({ searchParams }) {
  // In production: derive hotelId from the authenticated owner's session
  // For dev/demo: pass ?hotelId=xxx or set NEXT_PUBLIC_DEMO_HOTEL_ID
  const hotelId = searchParams?.hotelId || process.env.NEXT_PUBLIC_DEMO_HOTEL_ID || 'demo';
  const hotelName = searchParams?.hotelName || 'Hotel Khuji';

  return (
    <div className="min-h-screen bg-surface-0">
      {/* Top navigation bar */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 bg-surface-1/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="flex items-center gap-3">
          {/* Logo */}
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
          <span className="text-xs text-zinc-500 hidden sm:inline">
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'long',
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
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
