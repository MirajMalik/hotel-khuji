'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useHotelStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import {
  User,
  Building2,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

/**
 * Clean, Production-Grade Authentication Form Component
 * Connects directly to Express + PostgreSQL backend (JWT + Cookie).
 * Role-based redirect:
 *  - Owner / Admin login/register -> /owner/dashboard
 *  - Customer login/register -> /hotels
 */
export default function AuthForm({ defaultRole = 'customer', onSuccess, initialMode = 'login', redirectPath }) {
  const router = useRouter();
  const setCurrentUser = useHotelStore((s) => s.setCurrentUser);

  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [role, setRole] = useState(defaultRole); // 'customer' | 'owner'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const determineRedirect = (resolvedRole) => {
    // If owner or admin, ALWAYS go directly to /owner/dashboard
    if (resolvedRole === 'owner' || resolvedRole === 'admin') {
      return '/owner/dashboard';
    }
    // For customers, use redirectPath if specifically pointing elsewhere, otherwise /hotels
    if (redirectPath && !redirectPath.includes('dashboard')) {
      return redirectPath;
    }
    return '/hotels';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (mode === 'register') {
        const res = await api.post('/auth/register', {
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          role,
          phone: '',
          hotel_name: role === 'owner' ? hotelName.trim() : undefined,
        });

        const userRecord = res.user;
        const token = res.token;
        const userRole = userRecord?.role || role;

        if (token && typeof window !== 'undefined') {
          localStorage.setItem('token', token);
          document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`;
          if (userRole === 'owner' || userRole === 'admin') {
            document.cookie = 'demo_role=owner; path=/; max-age=86400; SameSite=Lax';
          }
        }

        // Immediately update global store & local storage
        setCurrentUser(userRecord);

        setSuccessMsg('Account registered successfully! Redirecting...');
        const targetRoute = determineRedirect(userRole);

        setTimeout(() => {
          if (onSuccess) onSuccess(userRecord);
          router.push(targetRoute);
          router.refresh();
        }, 500);
      } else {
        // Mode === 'login'
        const res = await api.post('/auth/login', {
          email: email.trim(),
          password,
        });

        const userRecord = res.user;
        const userRole = userRecord?.role || role;
        const token = res.token;

        if (token && typeof window !== 'undefined') {
          localStorage.setItem('token', token);
          document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`;
          if (userRole === 'owner' || userRole === 'admin') {
            document.cookie = 'demo_role=owner; path=/; max-age=86400; SameSite=Lax';
          }
        }

        // Immediately update global store & local storage
        setCurrentUser(userRecord);

        setSuccessMsg(`Welcome back, ${userRecord?.full_name || email}! Logging in...`);
        const targetRoute = determineRedirect(userRole);

        setTimeout(() => {
          if (onSuccess) onSuccess(userRecord);
          router.push(targetRoute);
          router.refresh();
        }, 400);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
      {/* Role Switcher Pill */}
      <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl mb-6">
        <button
          type="button"
          onClick={() => setRole('customer')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            role === 'customer'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Guest Traveler</span>
        </button>
        <button
          type="button"
          onClick={() => setRole('owner')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            role === 'owner'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Hotel Owner / Admin</span>
        </button>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {mode === 'login'
            ? role === 'owner'
              ? 'Hotel Owner & Admin Sign In'
              : 'Sign In to Your Account'
            : role === 'owner'
            ? 'Register Your Hotel Property'
            : 'Create Guest Account'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {role === 'owner'
            ? 'Access your owner PMS portal, manage rooms, and maintain guest bookings'
            : 'Explore hotels, book transit rooms, and track flight wake-up services'}
        </p>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. Asif Mahmud"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-colors"
              />
            </div>
          </div>
        )}

        {mode === 'register' && role === 'owner' && (
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Hotel / Property Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ashkona Airport Transit Inn"
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-colors"
            />
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
            Email Address
          </label>
          <div className="relative flex items-center">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="email"
              required
              placeholder={role === 'owner' ? 'owner@hotelkhuji.com' : 'traveler@gmail.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
            Password
          </label>
          <div className="relative flex items-center">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-sm hover:shadow active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-3"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <>
              <span>
                {mode === 'login'
                  ? `Sign In as ${role === 'owner' ? 'Owner / Admin' : 'Guest'}`
                  : `Create ${role === 'owner' ? 'Owner SaaS' : 'Guest'} Account`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch between Login and Register */}
      <div className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
        {mode === 'login' ? (
          <span>
            Don&apos;t have an account yet?{' '}
            <button
              type="button"
              onClick={() => setMode('register')}
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline ml-1"
            >
              Register here
            </button>
          </span>
        ) : (
          <span>
            Already registered?{' '}
            <button
              type="button"
              onClick={() => setMode('login')}
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline ml-1"
            >
              Sign In
            </button>
          </span>
        )}
      </div>

      {/* Quick Testing Access */}
      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
        <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block mb-2.5">
          Quick Demo Credentials
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
            className="flex-1 py-1.5 px-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-xl transition-colors"
          >
            Hotel Owner / Admin
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setRole('customer');
              setEmail('testuser@example.com');
              setPassword('password123');
            }}
            className="flex-1 py-1.5 px-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors"
          >
            Guest Traveler
          </button>
        </div>
      </div>
    </div>
  );
}
