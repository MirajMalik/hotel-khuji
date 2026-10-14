'use client';

/**
 * MapPlaceholder — Placeholder for Mapbox "Get Directions" integration.
 * Shows hotel location info and a link to Google Maps as fallback.
 */
export default function MapPlaceholder({ hotelName, address, latitude, longitude }) {
  const hasCoords = latitude && longitude;
  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || hotelName)}`;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-surface-2">
      {/* Fake map background */}
      <div className="h-48 sm:h-56 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center relative">
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Pin icon */}
        <div className="relative flex flex-col items-center gap-2 z-10">
          <div className="w-12 h-12 rounded-full bg-brand-500/20 border-2 border-brand-500/40 flex items-center justify-center">
            <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <span className="text-xs text-zinc-500 font-medium">
            Mapbox integration coming soon
          </span>
        </div>
      </div>

      {/* Info footer */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex-1 min-w-0 mr-3">
          <p className="text-sm font-medium text-zinc-200 truncate">{hotelName}</p>
          <p className="text-xs text-zinc-500 truncate mt-0.5">{address || 'Ashkona, Dhaka'}</p>
        </div>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-500/10 hover:bg-brand-500/20 text-brand-500 text-xs font-semibold rounded-lg transition-colors border border-brand-500/20 flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
          </svg>
          Get Directions
        </a>
      </div>
    </div>
  );
}
