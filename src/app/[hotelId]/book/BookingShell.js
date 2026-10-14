import { connection } from 'next/server';
import BookingPageClient from '@/components/booking/BookingPageClient';

/**
 * BookingShell — Async server component that resolves the dynamic params.
 * Must be rendered inside <Suspense>.
 */
export default async function BookingShell({ params }) {
  await connection();
  const { hotelId } = await params;

  return <BookingPageClient hotelId={hotelId} />;
}
