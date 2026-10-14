import BookingPageClient from '@/components/booking/BookingPageClient';

/**
 * Dynamic public booking page: /[hotelId]/book
 * 
 * Customers visit this URL to see available rooms and reserve online.
 * Mobile-first, no login required, Pay at Hotel model.
 */

export async function generateMetadata({ params }) {
  const { hotelId } = await params;
  return {
    title: `Book a Room — Hotel Khuji`,
    description: `Reserve a transit hotel room near Ashkona Airport. Pay at the hotel, no online payment needed.`,
    openGraph: {
      title: `Book a Room — Hotel Khuji`,
      description: `Reserve a transit hotel room near Ashkona Airport.`,
    },
  };
}

export default async function BookingPage({ params }) {
  const { hotelId } = await params;

  return <BookingPageClient hotelId={hotelId} />;
}
