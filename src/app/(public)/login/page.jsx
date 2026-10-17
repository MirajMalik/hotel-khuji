'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthForm from '@/components/auth/AuthForm';
import Link from 'next/link';

function LoginContent() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/hotels';
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col justify-between py-8 px-4 sm:px-6">
      {/* Brand Header */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pb-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
            <span className="text-brand-400 font-extrabold text-base">HK</span>
          </div>
          <div>
            <span className="text-base font-black text-white block leading-tight">Hotel Khuji</span>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
              Marketplace &amp; Owner SaaS
            </span>
          </div>
        </Link>
        <Link
          href="/"
          className="text-xs font-semibold text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 transition-colors"
        >
          ← Return to Marketplace
        </Link>
      </div>

      {/* Main Container */}
      <div className="max-w-md w-full mx-auto my-auto">
        {error === 'owner_access_required' && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-200 text-xs shadow-lg">
            <p className="font-bold flex items-center gap-1.5 mb-1">
              <span>🔒</span> Access Restricted to Hotel Owners
            </p>
            <p className="opacity-90 leading-relaxed">
              The route you requested requires an authenticated account with the <strong>owner</strong> role.
              Please sign in with your hotel owner credentials or click below to enter with demo owner privileges.
            </p>
          </div>
        )}

        <AuthForm redirectPath={redirect} defaultRole={error ? 'owner' : 'customer'} />
      </div>

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto text-center pt-8 text-xs text-zinc-600">
        <p>© 2026 Hotel Khuji Platform • Secure Dhaka Airport Transit Hub PMS</p>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
