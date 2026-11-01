'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthForm from '@/components/auth/AuthForm';
import Link from 'next/link';
import { Building2, ArrowLeft, ShieldAlert } from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || null;
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between py-10 px-4 sm:px-6">
      {/* Brand Header */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pb-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold text-slate-900 dark:text-white block leading-tight">Hotel Khuji</span>
            <span className="text-[11px] text-slate-500 font-medium block">
              Dhaka Airport Transit &amp; Owner SaaS
            </span>
          </div>
        </Link>
        <Link
          href="/"
          className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Marketplace</span>
        </Link>
      </div>

      {/* Main Container */}
      <div className="max-w-md w-full mx-auto my-auto">
        {error === 'owner_access_required' && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs shadow-sm">
            <p className="font-bold flex items-center gap-1.5 mb-1 text-amber-900 dark:text-amber-100">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Owner &amp; Admin Access Required</span>
            </p>
            <p className="opacity-90 leading-relaxed">
              The route you requested requires an authenticated account with the <strong>owner</strong> or <strong>admin</strong> role.
              Please sign in with your hotel owner credentials.
            </p>
          </div>
        )}

        <AuthForm redirectPath={redirect} defaultRole={error ? 'owner' : 'customer'} />
      </div>

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto text-center pt-8 text-xs text-slate-400">
        <p>© 2026 Hotel Khuji Platform • Secure Transit Hotel Management &amp; Reservations</p>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
