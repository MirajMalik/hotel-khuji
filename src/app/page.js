import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-500/20">
            <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008V7.5z" />
            </svg>
          </div>
          <span className="text-sm font-bold text-zinc-200">Hotel Khuji</span>
        </div>
        <Link
          href="/dashboard"
          className="text-xs font-medium text-zinc-400 hover:text-zinc-200 px-4 py-2 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors"
        >
          Owner Dashboard →
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-500/10 border border-brand-500/20 rounded-full mb-8">
            <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse-dot" />
            <span className="text-xs font-medium text-brand-500">Transit Hotel PMS</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-zinc-100 tracking-tight leading-[1.1]">
            Hyper-fast hotel
            <br />
            <span className="bg-gradient-to-r from-brand-500 to-emerald-400 bg-clip-text text-transparent">
              management
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 mt-6 max-w-lg mx-auto leading-relaxed">
            Built for transit hotels near Ashkona Airport. Manage walk-ins in seconds,
            let customers book online with zero upfront payment.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-colors"
            >
              Open Front Desk
            </Link>
            <Link
              href="/demo/book"
              className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-zinc-400 bg-surface-2 hover:bg-surface-3 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-colors"
            >
              See Guest Booking Page
            </Link>
          </div>

          {/* Tech stack */}
          <div className="flex items-center justify-center gap-4 mt-12 text-xs text-zinc-600">
            <span>Next.js</span>
            <span className="text-zinc-800">·</span>
            <span>Tailwind</span>
            <span className="text-zinc-800">·</span>
            <span>Supabase</span>
            <span className="text-zinc-800">·</span>
            <span>PostgreSQL</span>
          </div>
        </div>
      </main>
    </div>
  );
}
