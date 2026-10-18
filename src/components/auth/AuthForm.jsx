'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

/**
 * Universal Authentication Form Component
 * Connects directly to Express + PostgreSQL backend (JWT + Cookie).
 * Role-based redirect:
 *  - Customer registration/login -> /hotels (all hotels + booking + distance + social contact)
 *  - Owner registration/login -> /owner/dashboard (room management + bookings + staff/money tracking)
 */
export default function AuthForm({ defaultRole = 'customer', onSuccess, initialMode = 'login', redirectPath }) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [role, setRole] = useState(defaultRole); // 'customer' | 'owner'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const getDefaultRedirect = (resolvedRole) => {
    return resolvedRole === 'owner' ? '/owner/dashboard' : '/hotels';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (mode === 'register') {
        const res = await api.post('/auth/register', {
          email,
          password,
          full_name: fullName,
          role,
          phone: '',
          hotel_name: role === 'owner' ? hotelName : undefined,
        });

        const userRecord = res.user;
        if (typeof window !== 'undefined') {
          localStorage.setItem('hotel_user', JSON.stringify(userRecord));
          if (role === 'owner') {
            document.cookie = 'demo_role=owner; path=/; max-age=86400';
          }
        }

        setSuccessMsg('Account created successfully! Redirecting...');
        setTimeout(() => {
          if (onSuccess) onSuccess(userRecord);
          router.push(redirectPath || getDefaultRedirect(role));
          router.refresh();
        }, 700);
      } else {
        // Mode === 'login'
        const res = await api.post('/auth/login', {
          email,
          password,
        });

        const userRecord = res.user;
        const userRole = userRecord?.role || role;

        if (typeof window !== 'undefined') {
          localStorage.setItem('hotel_user', JSON.stringify(userRecord));
          if (userRole === 'owner') {
            document.cookie = 'demo_role=owner; path=/; max-age=86400';
          }
        }

        setSuccessMsg(`Welcome back, ${userRecord?.full_name || email}! Logging in...`);
        setTimeout(() => {
          if (onSuccess) onSuccess(userRecord);
          router.push(redirectPath || getDefaultRedirect(userRole));
          router.refresh();
        }, 600);
      }
    } catch (err) {
      console.error('Express + PostgreSQL Auth error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials or server connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-surface-1 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
      {/* Role Selection Tabs */}
      <div className="flex bg-surface-2 p-1 rounded-2xl mb-6 border border-zinc-800/80">
        <button
          type="button"
          onClick={() => setRole('customer')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            role === 'customer'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          👤 Guest Traveler
        </button>
        <button
          type="button"
          onClick={() => setRole('owner')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            role === 'owner'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          🏨 Hotel Owner / Desk
        </button>
      </div>

      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-white tracking-tight">
          {mode === 'login'
            ? role === 'owner'
              ? 'Owner SaaS Sign In'
              : 'Sign In to Book'
            : role === 'owner'
            ? 'Register Your Hotel'
            : 'Create Guest Account'}
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          {role === 'owner'
            ? 'Access your Owner Management Panel, PMS rooms, and staff finances'
            : 'Explore all available transit hotels with instant bookings'}
        </p>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-center gap-2">
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2">
          <span>✅</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Asif Mahmud"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-zinc-700/80 text-white placeholder-zinc-500 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
        )}

        {mode === 'register' && role === 'owner' && (
          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1">Hotel / Property Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Ashkona Airport Transit Inn"
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-zinc-700/80 text-white placeholder-zinc-500 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-zinc-300 block mb-1">Email Address</label>
          <input
            type="email"
            required
            placeholder={role === 'owner' ? 'owner@ashkonainn.com' : 'traveler@gmail.com'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-zinc-700/80 text-white placeholder-zinc-500 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-300 block mb-1">Password</label>
          <input
            type="password"
            required
            minLength={6}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-zinc-700/80 text-white placeholder-zinc-500 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white shadow-lg shadow-brand-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
        >
          {loading ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : mode === 'login' ? (
            `Sign In as ${role === 'owner' ? 'Hotel Owner' : 'Guest'}`
          ) : (
            `Create ${role === 'owner' ? 'Owner SaaS' : 'Guest'} Account`
          )}
        </button>
      </form>

      {/* Switch between Login and Register */}
      <div className="mt-5 text-center text-xs text-zinc-400">
        {mode === 'login' ? (
          <span>
            Don&apos;t have an account yet?{' '}
            <button
              type="button"
              onClick={() => setMode('register')}
              className="font-bold text-brand-400 hover:text-brand-300 underline underline-offset-2 ml-1"
            >
              Register here
            </button>
          </span>
        ) : (
          <span>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => setMode('login')}
              className="font-bold text-brand-400 hover:text-brand-300 underline underline-offset-2 ml-1"
            >
              Sign In
            </button>
          </span>
        )}
      </div>

      {/* Quick Testing Access */}
      <div className="mt-6 pt-5 border-t border-zinc-800 text-center">
        <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold block mb-2">
          Quick Demo Accounts
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setRole('owner');
              setEmail('owner@hotelkhuji.com');
              setPassword('admin123');
            }}
            className="flex-1 py-1.5 px-2 text-[11px] font-semibold bg-surface-2 hover:bg-surface-3 text-brand-400 rounded-xl border border-brand-500/30 transition-colors"
          >
            Fill Demo Owner
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setRole('customer');
              setEmail('testuser@example.com');
              setPassword('password123');
            }}
            className="flex-1 py-1.5 px-2 text-[11px] font-semibold bg-surface-2 hover:bg-surface-3 text-zinc-300 rounded-xl border border-zinc-700 transition-colors"
          >
            Fill Demo Guest
          </button>
        </div>
      </div>
    </div>
  );
}
