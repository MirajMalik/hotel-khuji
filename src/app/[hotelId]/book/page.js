import { Suspense } from 'react';
import BookingShell from './BookingShell';

/**
 * Dynamic public booking page: /[hotelId]/book
 * 
 * Customers visit this URL to see available rooms and reserve online.
 * Mobile-first, no login required, Pay at Hotel model.
 */

export const metadata = {
  title: 'Book a Room — Hotel Khuji',
  description:
    'Reserve a transit hotel room near Ashkona Airport. Pay at the hotel, no online payment needed.',
};

export default function BookingPage({ params }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-brand-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm text-zinc-500">Loading hotel...</span>
          </div>
        </div>
      }
    >
      <BookingShell params={params} />
    </Suspense>
  );
}
