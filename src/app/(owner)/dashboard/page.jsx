'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useHotelStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';

/**
 * STEP 3: B2B FRONT DESK DASHBOARD COMPONENT
 * Route: /app/(owner)/dashboard/page.jsx
 * 
 * Features:
 * - Fetches Daily Action List from Express endpoint: routes/frontdesk.js (/api/frontdesk/action-list)
 * - Displays a live "Flight Departure & Wake-Up Queue"
 * - Styles guests whose flights are within 4 hours in red/urgent warning cards
 * - Styles later flights in green safe cards
 * - Uses Zustand to manage wake-up call completion states across the application
 */
function FrontDeskActionQueue() {
  const {
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

  // Fetch flight action list from Express.js backend
  const fetchActionList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Calls protected Express route from Step 2
      const res = await api.get('/frontdesk/action-list');
      if (res?.data) {
        setFrontdeskQueue(res.data);
      }
    } catch (err) {
      console.error('Failed to load action list from Express:', err);
      setError(err.message || 'Failed to load flight wake-up queue');
    } finally {
      setLoading(false);
    }
  }, [setFrontdeskQueue]);

  useEffect(() => {
    fetchActionList();
    // Auto-refresh queue every 60 seconds for live countdown
    const timer = setInterval(() => {
      fetchActionList();
    }, 60000);
    return () => clearInterval(timer);
  }, [fetchActionList]);

  // Format departure relative badge
  const getDepartureInfo = (departureTimeStr) => {
    if (!departureTimeStr) return { label: 'No flight attached', isUrgent: false, diffHours: null };
    const now = new Date();
    const depTime = new Date(departureTimeStr);
    const diffMs = depTime.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    const diffHours = (diffMins / 60).toFixed(1);

    if (diffMins < 0) {
      return { label: `Departed (${Math.abs(diffMins)}m ago)`, isUrgent: false, diffHours };
    }
    if (diffMins <= 240) { // within 4 hours
      return { 
        label: `Departs in ${Math.floor(diffMins / 60)}h ${diffMins % 60}m (URGENT)`, 
        isUrgent: true, 
        diffHours 
      };
    }
    return { 
      label: `Departs in ${diffHours} hrs`, 
      isUrgent: false, 
      diffHours 
    };
  };

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
    <div className="min-h-screen bg-surface-0 text-zinc-100 flex flex-col">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl animate-slide-up ${
            notification.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
              : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
          }`}
        >
          <span>{notification.type === 'error' ? '⚠️' : '✅'}</span>
          <p className="text-xs font-semibold">{notification.message}</p>
          <button onClick={clearNotification} className="ml-2 text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-surface-1/90 backdrop-blur-xl border-b border-zinc-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/owner/dashboard"
              className="px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-xs font-bold text-zinc-300 hover:text-white border border-zinc-700 transition-colors"
            >
              ← Owner Panel
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-white">Flight Departure &amp; Wake-Up Queue</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  B2B Front Desk
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Synchronized with Express.js <code className="text-brand-300">routes/frontdesk.js</code> &amp; PostgreSQL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchActionList}
              className="px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-xs font-semibold text-zinc-300 border border-zinc-700 flex items-center gap-1.5"
            >
              <span>🔄</span> Refresh Queue
            </button>
            <Link
              href="/hotels"
              className="px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-xs font-semibold text-zinc-300 border border-zinc-700"
            >
              Marketplace
            </Link>
          </div>
        </div>
      </header>

      {/* Main Queue Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Urgent Alert Banner */}
        {urgentCount > 0 && (
          <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-pulse">🚨</span>
              <div>
                <h3 className="text-sm font-black text-white">
                  {urgentCount} Guest{urgentCount > 1 ? 's' : ''} Departing Within 4 Hours!
                </h3>
                <p className="text-xs text-rose-200/80 mt-0.5">
                  Execute wake-up calls immediately and ready the airport transit shuttle van.
                </p>
              </div>
            </div>
            <button
              onClick={() => setFilterMode('urgent')}
              className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-md transition-all"
            >
              View Urgent Queue
            </button>
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-surface-1 p-1 rounded-2xl border border-zinc-800">
            {[
              { id: 'all', label: `All Flights (${frontdeskQueue.length})` },
              { id: 'urgent', label: `Urgent (< 4h) (${urgentCount})` },
              { id: 'pending', label: 'Wake-Up Pending' },
              { id: 'completed', label: 'Completed' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterMode(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  filterMode === tab.id
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-zinc-500">
            Ordered by <strong className="text-zinc-300">flight_departure_time ASC</strong>
          </span>
        </div>

        {/* Action List Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="p-6 rounded-3xl bg-surface-1 border border-zinc-800 animate-pulse space-y-4">
                <div className="h-5 bg-surface-2 rounded w-1/2" />
                <div className="h-4 bg-surface-2 rounded w-3/4" />
                <div className="h-10 bg-surface-2 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-surface-1 border border-rose-900/60 rounded-3xl text-rose-300 text-xs">
            <span className="text-3xl block mb-2">⚠️</span>
            <p className="font-bold">{error}</p>
            <button
              onClick={fetchActionList}
              className="mt-3 px-4 py-2 bg-rose-600 text-white rounded-xl font-bold"
            >
              Retry
            </button>
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="p-16 text-center bg-surface-1 border border-zinc-800 rounded-3xl">
            <span className="text-4xl block mb-2">✈️</span>
            <h3 className="text-base font-bold text-white">No Flights in this Queue</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              All flight departures for this filter have been handled or no flight numbers were logged today.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredQueue.map((item) => {
              const depInfo = getDepartureInfo(item.flight_departure_time);
              const isCallDone = Boolean(completedWakeupCalls[item.id] || item.wakeup_call_completed);

              // Step 3 Styling Requirement:
              // Red/Urgent card if flight departs within 4 hours, Green card if later
              const isUrgentCard = depInfo.isUrgent;

              return (
                <div
                  key={item.id}
                  className={`flex flex-col justify-between p-6 rounded-3xl border transition-all duration-300 shadow-xl relative overflow-hidden ${
                    isCallDone
                      ? 'bg-surface-1/60 border-zinc-800/80 opacity-75'
                      : isUrgentCard
                      ? 'bg-gradient-to-br from-rose-950/40 via-surface-1 to-surface-1 border-rose-500/60 shadow-rose-950/20'
                      : 'bg-gradient-to-br from-emerald-950/30 via-surface-1 to-surface-1 border-emerald-500/50 shadow-emerald-950/10'
                  }`}
                >
                  {/* Top Status Header */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-xl bg-surface-2 border border-zinc-700 text-xs font-black text-white">
                          Room {item.room_number}
                        </span>
                        {item.booked_by_role === 'agency' && (
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                            Agency Bulk
                          </span>
                        )}
                      </div>

                      {/* Urgency Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 border ${
                          isCallDone
                            ? 'bg-zinc-800/80 text-zinc-400 border-zinc-700'
                            : isUrgentCard
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        <span>{isUrgentCard ? '⚡ Urgent' : '🟢 Scheduled'}</span>
                      </span>
                    </div>

                    {/* Guest Name & Flight Info */}
                    <h3 className="text-lg font-black text-white tracking-tight flex items-center justify-between">
                      <span>{item.guest_name}</span>
                      <span className="text-xs font-extrabold text-brand-400">
                        {item.flight_number ? `✈️ ${item.flight_number}` : 'No Flight #'}
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">📞 {item.guest_phone}</p>

                    {/* Flight & Wakeup Time Grid */}
                    <div className="mt-4 p-3.5 rounded-2xl bg-surface-2/70 border border-zinc-800/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Departure Time:</span>
                        <strong className="text-white">
                          {item.flight_departure_time
                            ? new Date(item.flight_departure_time).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Not set'}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Countdown:</span>
                        <span
                          className={`font-bold ${
                            isUrgentCard ? 'text-rose-400 font-black' : 'text-emerald-400'
                          }`}
                        >
                          {depInfo.label}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                        <span className="text-zinc-400">Wake-Up Call Time:</span>
                        <strong className="text-amber-400">
                          {item.wakeup_call_time
                            ? new Date(item.wakeup_call_time).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Auto (2h prior)'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Zustand Wake-Up Action Button */}
                  <div className="mt-5 pt-3 border-t border-zinc-800/60">
                    <button
                      type="button"
                      onClick={() => toggleWakeupCall(item.id, item.guest_name)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
                        isCallDone
                          ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                          : isUrgentCard
                          ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                      }`}
                    >
                      <span>{isCallDone ? '✓ Wake-Up Completed' : '📞 Call Guest & Mark Wake-Up Done'}</span>
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
        <div className="min-h-screen bg-surface-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
            <span className="text-xs text-zinc-500">Loading flight wake-up queue...</span>
          </div>
        </div>
      }
    >
      <FrontDeskActionQueue />
    </Suspense>
  );
}
