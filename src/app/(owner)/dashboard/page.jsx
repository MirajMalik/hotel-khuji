'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useHotelStore } from '@/lib/store';

/**
 * FRONT DESK ACTION DASHBOARD (Airport Flight Sync)
 * 
 * Specifically designed for front desk managers of all ages:
 * - 2 Color Shifting Approach: High-contrast ☀️ Day Mode & 🌙 Night Mode
 * - Zero developer jargon (no database/server mentions)
 * - Extra large room numbers, readable text, and tap-to-call buttons
 * - High-urgency alert for departures within 4 hours (Red vs Green)
 * - 1-Click "Mark Wake-Up Done" button powered by Zustand
 */
function FrontDeskActionQueue() {
  const {
    theme,
    toggleTheme,
    setTheme,
    frontdeskQueue,
    setFrontdeskQueue,
    completedWakeupCalls,
    toggleWakeupCall,
    notification,
    clearNotification,
  } = useHotelStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'urgent' | 'pending' | 'completed'

  // Hydrate saved theme on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hotel_theme');
      if (saved === 'day' || saved === 'night') {
        setTheme(saved);
      }
    }
  }, [setTheme]);

  // Fetch flight action list
  const fetchActionList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/frontdesk/action-list');
      if (res?.data) {
        setFrontdeskQueue(res.data);
      }
    } catch (err) {
      console.error('Failed to load flight list:', err);
      setError('Unable to reach hotel system. Please check connection and refresh.');
    } finally {
      setLoading(false);
    }
  }, [setFrontdeskQueue]);

  useEffect(() => {
    fetchActionList();
    // Auto-refresh every 60 seconds
    const timer = setInterval(() => {
      fetchActionList();
    }, 60000);
    return () => clearInterval(timer);
  }, [fetchActionList]);

  // Format departure relative badge in simple human terms
  const getDepartureInfo = (departureTimeStr) => {
    if (!departureTimeStr) {
      return { label: 'No flight time added', isUrgent: false, diffMinutes: null };
    }
    const now = new Date();
    const depTime = new Date(departureTimeStr);
    const diffMs = depTime.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));

    if (diffMins < 0) {
      return { 
        label: `Flight already departed (${Math.abs(diffMins)} mins ago)`, 
        isUrgent: false, 
        diffMinutes: diffMins 
      };
    }
    if (diffMins <= 240) { // within 4 hours
      const hours = Math.floor(diffMins / 60);
      const minutes = diffMins % 60;
      return { 
        label: `🚨 Flight in ${hours > 0 ? `${hours}h ` : ''}${minutes}m (URGENT)`, 
        isUrgent: true, 
        diffMinutes: diffMins 
      };
    }
    const hours = (diffMins / 60).toFixed(1);
    return { 
      label: `Flight in ${hours} hours`, 
      isUrgent: false, 
      diffMinutes: diffMins 
    };
  };

  const isDay = theme === 'day';

  // Filter items based on active pill
  const filteredQueue = frontdeskQueue.filter((item) => {
    const isCompleted = Boolean(completedWakeupCalls[item.id] || item.wakeup_call_completed);
    const dep = getDepartureInfo(item.flight_departure_time);

    if (filterMode === 'urgent') return dep.isUrgent && !isCompleted;
    if (filterMode === 'pending') return !isCompleted;
    if (filterMode === 'completed') return isCompleted;
    return true;
  });

  const urgentCount = frontdeskQueue.filter(
    (item) => getDepartureInfo(item.flight_departure_time).isUrgent && !completedWakeupCalls[item.id]
  ).length;

  return (
    <div
      className={`min-h-screen transition-colors duration-200 flex flex-col font-sans ${
        isDay ? 'bg-slate-100 text-slate-900' : 'bg-zinc-950 text-zinc-100'
      }`}
    >
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl ${
            notification.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700'
              : 'bg-emerald-600 text-white border-emerald-700'
          }`}
        >
          <span className="text-xl">{notification.type === 'error' ? '⚠️' : '✅'}</span>
          <p className="text-sm font-bold">{notification.message}</p>
          <button onClick={clearNotification} className="ml-3 text-sm font-bold opacity-80 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Top Header with 2 Color Shifting Switch */}
      <header
        className={`sticky top-0 z-40 border-b px-4 sm:px-8 py-3 transition-colors ${
          isDay
            ? 'bg-white border-slate-300 shadow-sm'
            : 'bg-zinc-900/90 border-zinc-800 backdrop-blur-xl'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Simple Title & Back Link */}
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/owner/dashboard"
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                isDay
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
              }`}
            >
              ← Hotel Management
            </Link>

            <div>
              <h1 className="text-lg sm:text-xl font-extrabold flex items-center gap-2">
                <span>✈️ Airport Wake-Up List</span>
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                    isDay
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-blue-950/60 text-blue-300 border-blue-800'
                  }`}
                >
                  Front Desk
                </span>
              </h1>
              <p className={`text-xs ${isDay ? 'text-slate-500' : 'text-zinc-400'}`}>
                Guests ordered by earliest flight departure time
              </p>
            </div>
          </div>

          {/* Right: DAY / NIGHT TOGGLE + Refresh */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* 2 COLOR SHIFTING BUTTON */}
            <button
              onClick={toggleTheme}
              className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm border flex items-center gap-2 shadow-sm transition-all ${
                isDay
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-amber-300 border-zinc-700'
              }`}
              title="Click to switch between Day Mode and Night Mode"
            >
              <span>{isDay ? '☀️ Day Mode' : '🌙 Night Mode'}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                isDay ? 'bg-amber-200 text-amber-950' : 'bg-zinc-900 text-zinc-300'
              }`}>
                {isDay ? 'Switch to Night' : 'Switch to Day'}
              </span>
            </button>

            {/* Refresh */}
            <button
              onClick={fetchActionList}
              className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition ${
                isDay
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
              }`}
            >
              <span>🔄</span> Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        
        {/* Big Urgent Alert Banner */}
        {urgentCount > 0 && (
          <div
            className={`p-5 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl ${
              isDay
                ? 'bg-red-50 border-red-500 text-red-950'
                : 'bg-rose-950/80 border-rose-500 text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl animate-bounce">🚨</span>
              <div>
                <h2 className="text-base sm:text-lg font-black">
                  ATTENTION: {urgentCount} Guest{urgentCount > 1 ? 's' : ''} Departing Soon!
                </h2>
                <p className={`text-xs sm:text-sm mt-0.5 ${isDay ? 'text-red-800 font-medium' : 'text-rose-200'}`}>
                  Flights are within 4 hours. Call the guest now and ensure the airport shuttle is ready.
                </p>
              </div>
            </div>
            <button
              onClick={() => setFilterMode('urgent')}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition"
            >
              Show Urgent Only ({urgentCount})
            </button>
          </div>
        )}

        {/* Filter Tabs — Big, Clear, Easy to Tap */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div
            className={`flex items-center gap-1.5 p-1.5 rounded-2xl border ${
              isDay ? 'bg-white border-slate-300 shadow-sm' : 'bg-zinc-900 border-zinc-800'
            }`}
          >
            {[
              { id: 'all', label: `All Guests (${frontdeskQueue.length})` },
              { id: 'urgent', label: `🚨 Urgent (< 4h) (${urgentCount})` },
              { id: 'pending', label: '⏳ Needs Wake-Up' },
              { id: 'completed', label: '✓ Call Completed' },
            ].map((tab) => {
              const active = filterMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterMode(tab.id)}
                  className={`px-3.5 py-2 text-xs sm:text-sm font-black rounded-xl transition ${
                    active
                      ? 'bg-blue-600 text-white shadow'
                      : isDay
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <span className={`text-xs font-semibold ${isDay ? 'text-slate-500' : 'text-zinc-400'}`}>
            Earliest flights shown first
          </span>
        </div>

        {/* Action List Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={`p-6 rounded-3xl border animate-pulse space-y-4 ${
                  isDay ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'
                }`}
              >
                <div className={`h-8 rounded w-1/3 ${isDay ? 'bg-slate-200' : 'bg-zinc-800'}`} />
                <div className={`h-6 rounded w-3/4 ${isDay ? 'bg-slate-200' : 'bg-zinc-800'}`} />
                <div className={`h-12 rounded ${isDay ? 'bg-slate-200' : 'bg-zinc-800'}`} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div
            className={`p-8 text-center rounded-3xl border ${
              isDay
                ? 'bg-red-50 border-red-300 text-red-900'
                : 'bg-rose-950/40 border-rose-800 text-rose-200'
            }`}
          >
            <span className="text-3xl block mb-2">⚠️</span>
            <p className="font-bold text-sm">{error}</p>
            <button
              onClick={fetchActionList}
              className="mt-4 px-5 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm shadow"
            >
              Try Again
            </button>
          </div>
        ) : filteredQueue.length === 0 ? (
          <div
            className={`p-16 text-center rounded-3xl border ${
              isDay ? 'bg-white border-slate-300 shadow-sm' : 'bg-zinc-900 border-zinc-800'
            }`}
          >
            <span className="text-5xl block mb-3">✈️</span>
            <h3 className={`text-lg font-bold ${isDay ? 'text-slate-900' : 'text-white'}`}>
              No Guests in this list
            </h3>
            <p className={`text-sm mt-1 max-w-sm mx-auto ${isDay ? 'text-slate-500' : 'text-zinc-400'}`}>
              All flight departures for this view have been attended to or there are no active flights logged right now.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQueue.map((item) => {
              const depInfo = getDepartureInfo(item.flight_departure_time);
              const isCallDone = Boolean(completedWakeupCalls[item.id] || item.wakeup_call_completed);
              const isUrgentCard = depInfo.isUrgent;

              // Card background styling based on Day/Night & Urgency
              let cardClass = '';
              if (isCallDone) {
                cardClass = isDay
                  ? 'bg-slate-50 border-2 border-slate-300 opacity-75 shadow-sm'
                  : 'bg-zinc-900/40 border-2 border-zinc-800 opacity-70';
              } else if (isUrgentCard) {
                cardClass = isDay
                  ? 'bg-red-50/90 border-2 border-red-500 shadow-lg'
                  : 'bg-gradient-to-br from-rose-950/60 via-zinc-900 to-zinc-900 border-2 border-rose-500 shadow-xl shadow-rose-950/30';
              } else {
                cardClass = isDay
                  ? 'bg-emerald-50/60 border-2 border-emerald-500 shadow-md'
                  : 'bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-900 border-2 border-emerald-500/70 shadow-lg';
              }

              return (
                <div
                  key={item.id}
                  className={`flex flex-col justify-between p-6 rounded-3xl transition-all duration-200 ${cardClass}`}
                >
                  <div>
                    {/* ROOM NUMBER — EXTRA LARGE FOR EASY READING */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span
                        className={`text-base sm:text-lg font-black px-3.5 py-1.5 rounded-xl border tracking-wide ${
                          isDay
                            ? 'bg-white text-slate-900 border-slate-300 shadow-sm'
                            : 'bg-zinc-800 text-white border-zinc-700'
                        }`}
                      >
                        ROOM {item.room_number}
                      </span>

                      {/* URGENCY STATUS BADGE */}
                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border ${
                          isCallDone
                            ? isDay
                              ? 'bg-slate-200 text-slate-700 border-slate-300'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            : isUrgentCard
                            ? 'bg-red-600 text-white border-red-700 animate-pulse'
                            : isDay
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {isCallDone
                          ? '✓ Completed'
                          : isUrgentCard
                          ? '⚡ URGENT (< 4h)'
                          : '🟢 Scheduled'}
                      </span>
                    </div>

                    {/* GUEST NAME */}
                    <div className="mb-2">
                      <h3
                        className={`text-xl font-extrabold leading-snug ${
                          isDay ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {item.guest_name}
                      </h3>
                      {item.flight_number && (
                        <p className={`text-xs font-bold font-mono mt-0.5 ${
                          isDay ? 'text-blue-700' : 'text-brand-400'
                        }`}>
                          ✈️ Flight: {item.flight_number}
                        </p>
                      )}
                    </div>

                    {/* CLICK-TO-CALL PHONE NUMBER (Direct Dial for Mobile/Tablet) */}
                    <a
                      href={`tel:${item.guest_phone}`}
                      className={`inline-flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-xl border mb-4 transition ${
                        isDay
                          ? 'bg-white hover:bg-slate-100 text-blue-700 border-slate-300 shadow-sm'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                      }`}
                      title="Click to call guest phone"
                    >
                      <span>📞</span>
                      <span>Call: {item.guest_phone}</span>
                    </a>

                    {/* FLIGHT & WAKE-UP TIME DETAILS */}
                    <div
                      className={`p-4 rounded-2xl border space-y-2.5 text-xs sm:text-sm ${
                        isDay
                          ? 'bg-white/80 border-slate-300'
                          : 'bg-zinc-800/80 border-zinc-700/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={isDay ? 'text-slate-600 font-medium' : 'text-zinc-400'}>
                          Flight Departure:
                        </span>
                        <strong className={`font-black ${isDay ? 'text-slate-900' : 'text-white'}`}>
                          {item.flight_departure_time
                            ? new Date(item.flight_departure_time).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Not provided'}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={isDay ? 'text-slate-600 font-medium' : 'text-zinc-400'}>
                          Status:
                        </span>
                        <span
                          className={`font-black ${
                            isUrgentCard
                              ? 'text-red-600 font-extrabold'
                              : isDay
                              ? 'text-emerald-700'
                              : 'text-emerald-400'
                          }`}
                        >
                          {depInfo.label}
                        </span>
                      </div>

                      <div
                        className={`flex items-center justify-between pt-2 border-t ${
                          isDay ? 'border-slate-200' : 'border-zinc-700'
                        }`}
                      >
                        <span className={isDay ? 'text-slate-600 font-medium' : 'text-zinc-400'}>
                          Wake-Up Call:
                        </span>
                        <strong className={isDay ? 'text-amber-800 font-black' : 'text-amber-400 font-black'}>
                          {item.wakeup_call_time
                            ? new Date(item.wakeup_call_time).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '2 hours before flight'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* BIG, ONE-CLICK ACTION BUTTON */}
                  <div className={`mt-5 pt-4 border-t ${isDay ? 'border-slate-300' : 'border-zinc-800'}`}>
                    <button
                      type="button"
                      onClick={() => toggleWakeupCall(item.id, item.guest_name)}
                      className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base tracking-wide transition-all shadow-md flex items-center justify-center gap-2 ${
                        isCallDone
                          ? isDay
                            ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-400'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                          : isUrgentCard
                          ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/40 text-base'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/40'
                      }`}
                    >
                      {isCallDone ? (
                        <>
                          <span>✓ Call Completed</span>
                          <span className="text-xs font-normal opacity-70">(Tap to undo)</span>
                        </>
                      ) : (
                        <>
                          <span>📞</span>
                          <span>{isUrgentCard ? 'CALL GUEST NOW (Done)' : 'Mark Wake-Up Done'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function FrontDeskDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
            <span className="text-sm font-bold text-slate-600">Loading flight wake-up list...</span>
          </div>
        </div>
      }
    >
      <FrontDeskActionQueue />
    </Suspense>
  );
}
