'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Star,
  MapPin,
  Car,
  Clock,
  ShieldCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Phone,
  ArrowRight,
  BedDouble,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function HotelCard({
  hotel,
  viewMode = 'list', // 'list' | 'grid'
  currencySymbol = '৳',
  currencyRate = 1,
  onBookRoom,
  isBn,
}) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [showRoomDrawer, setShowRoomDrawer] = useState(false);

  const rooms = Array.isArray(hotel.rooms) ? hotel.rooms : [];
  const availableRooms = rooms.filter(
    (r) => (r.status || r.current_status) === 'available'
  );

  const minPrice = rooms.length > 0
    ? Math.min(...rooms.map((r) => Number(r.base_price || r.price) || 2800))
    : Number(hotel.base_price || 2800);

  const images = Array.isArray(hotel.gallery) && hotel.gallery.length > 0
    ? hotel.gallery
    : hotel.cover_image_url
    ? [hotel.cover_image_url]
    : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'];

  const rating = hotel.rating || 9.1;
  const ratingLabel = hotel.ratingLabel || (rating >= 9 ? 'Exceptional' : 'Fabulous');
  const reviewCount = hotel.reviewCount || 480;

  const distanceText = hotel.distanceToAirport || '650m from Terminal 3';
  const driveMinutes = hotel.airportDriveMinutes || 5;

  const amenities = Array.isArray(hotel.amenities) && hotel.amenities.length > 0
    ? hotel.amenities
    : ['Free 24/7 Airport Shuttle', 'Air Conditioning', 'Free Wi-Fi', 'Generator Backup'];

  const convertedPrice = Math.round(minPrice * currencyRate);

  const nextImage = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveImageIdx((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveImageIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  const whatsappNumber = hotel.whatsapp || '8801711000111';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hello, I would like to book a room at ${hotel.name} via Hotel Khuji. I have a transit flight at Dhaka Airport (DAC).`
  )}`;

  // ══════════════════════════════════════════════════════════
  // LIST VIEW (Default Desktop Booking Presentation)
  // ══════════════════════════════════════════════════════════
  if (viewMode === 'list') {
    return (
      <div className="group bg-white dark:bg-[#1e293b]/70 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 overflow-hidden mb-5">
        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Image Gallery Column (4 cols) */}
          <div className="relative md:col-span-4 aspect-[16/10] md:aspect-auto overflow-hidden bg-gray-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[activeImageIdx]}
              alt={hotel.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

            {/* Top Badges */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-blue-600 text-white shadow-xs">
                VERIFIED TRANSIT
              </span>
              {hotel.shuttle_available && (
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-black/60 backdrop-blur-md text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Car className="w-3 h-3 text-emerald-400" />
                  Free Shuttle
                </span>
              )}
            </div>

            {/* Gallery Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm z-10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm z-10"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold">
                  {activeImageIdx + 1}/{images.length}
                </div>
              </>
            )}

            {/* Bottom Zero Advance pill */}
            <div className="absolute bottom-2 left-2 z-10">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-emerald-500 text-white flex items-center gap-1 shadow-xs">
                <Check className="w-3 h-3" />
                {isBn ? 'জিরো অগ্রিম • পে অ্যাট হোটেল' : 'ZERO ADVANCE • PAY AT HOTEL'}
              </span>
            </div>
          </div>

          {/* Hotel Information Column (5 cols) */}
          <div className="p-5 md:col-span-5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800">
            <div>
              {/* Star Rating & Verified Badge */}
              <div className="flex items-center gap-2 mb-1">
                <div className="flex text-amber-400">
                  {Array.from({ length: hotel.stars || 4 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Verified Partner
                </span>
              </div>

              {/* Title with link to Hotel Details */}
              <Link href={`/hotel/${hotel.id}`}>
                <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug hover:underline">
                  {hotel.name}
                </h3>
              </Link>

              {/* Location & Airport Distance */}
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {distanceText}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-gray-500">
                  <Car className="w-3 h-3" /> {driveMinutes} mins drive
                </span>
              </div>

              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {hotel.description || hotel.address}
              </p>

              {/* Booking Highlights */}
              <div className="mt-3.5 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isBn ? 'ফ্রি ২৪/৭ বিমানবন্দর শাটল পিকআপ' : 'Free 24/7 Airport Terminal Shuttle Pickup'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                  <Check className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isBn ? 'কোন অগ্রিম কার্ড লাগবে না • কাউন্টারে পে করুন' : 'Zero advance • Pay at counter upon arrival'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                  <Check className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isBn ? 'ফ্লাইটের ২ ঘণ্টা আগে নিশ্চিত ওয়েক-আপ কল' : 'Guaranteed 2-hour pre-flight wake-up call'}</span>
                </div>
              </div>

              {/* Amenities */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {amenities.slice(0, 4).map((a, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md"
                  >
                    ✓ {a}
                  </span>
                ))}
              </div>
            </div>

            {/* Room Categories Expander */}
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {availableRooms.length || 3} Room Categories Available
              </span>
              <button
                type="button"
                onClick={() => setShowRoomDrawer(!showRoomDrawer)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>{showRoomDrawer ? 'Hide Quick Rooms' : 'Quick Room Preview'}</span>
                {showRoomDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Pricing & Booking Actions Column (3 cols) */}
          <div className="p-5 md:col-span-3 flex flex-col justify-between bg-gray-50/60 dark:bg-[#0f172a]/60">
            {/* Rating Box */}
            <div className="flex items-center justify-end gap-2">
              <div className="text-right">
                <span className="block text-xs font-extrabold text-gray-900 dark:text-white">
                  {ratingLabel}
                </span>
                <span className="block text-[10px] text-gray-500">{reviewCount} reviews</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                {rating.toFixed(1)}
              </div>
            </div>

            {/* Price Box */}
            <div className="mt-6 text-right">
              <span className="text-[11px] text-gray-500 font-medium block">Starting from</span>
              <div className="flex items-baseline justify-end gap-1 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
                  {currencySymbol} {convertedPrice.toLocaleString()}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">per night • taxes included</p>
              <p className="text-[10px] font-bold text-emerald-600 mt-0.5">Zero advance required</p>
            </div>

            {/* CTA Buttons: Prominent "View Details" Button as requested */}
            <div className="mt-4 space-y-2">
              <Link
                href={`/hotel/${hotel.id}`}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <div className="grid grid-cols-2 gap-1.5">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1.5 px-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-emerald-100 transition-colors"
                >
                  <MessageCircle className="w-3 h-3 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>

                <a
                  href={`tel:${hotel.phone || '+8801711000111'}`}
                  className="py-1.5 px-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-gray-200 transition-colors"
                >
                  <Phone className="w-3 h-3 text-gray-500" />
                  <span>Call Desk</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Expandable Room Selection Drawer (Quick Room Preview) ─── */}
        {showRoomDrawer && (
          <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#0f172a] p-4 sm:p-5 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-3.5">
              <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-blue-600" />
                <span>Rooms at {hotel.name}</span>
              </h4>
              <Link
                href={`/hotel/${hotel.id}`}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>See All Room Cards &amp; Moving Photos →</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(rooms.length > 0 ? rooms : hotel.rooms || []).map((room, idx) => {
                const roomPrice = Number(room.base_price || room.price || minPrice);
                const convPrice = Math.round(roomPrice * currencyRate);

                return (
                  <div
                    key={room.id || idx}
                    className="p-3.5 bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-gray-900 dark:text-white">
                          {room.type || `Room ${room.room_number}`}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          Available
                        </span>
                      </div>

                      {/* Advance Policy note */}
                      <div className="mt-1">
                        {room.requires_advance ? (
                          <span className="text-[10px] text-amber-500 font-bold">
                            ⚠️ ৳{room.advance_amount} advance required
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-500 font-bold">
                            ✓ Zero Advance
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1">
                        {(room.facilities || ['Air Conditioning', 'Free Wi-Fi', 'Hot Water']).slice(0, 3).map(
                          (fac, fi) => (
                            <span
                              key={fi}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                            >
                              ✓ {fac}
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <div>
                        <span className="text-base font-black text-blue-600 dark:text-blue-400">
                          {currencySymbol} {convPrice.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-gray-400 block">/ night</span>
                      </div>

                      <Link
                        href={`/hotel/${hotel.id}`}
                        className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all hover:scale-105"
                      >
                        View &amp; Book →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // GRID VIEW (Compact 3-Column Presentation)
  // ══════════════════════════════════════════════════════════
  return (
    <div className="group flex flex-col bg-white dark:bg-[#1e293b]/70 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all duration-300 overflow-hidden">
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[activeImageIdx]}
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        <div className="absolute top-3 left-3">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-600 text-white shadow-xs">
            VERIFIED PARTNER
          </span>
        </div>

        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/90 dark:bg-black/80 backdrop-blur-md">
          <span className="text-[10px] font-bold text-gray-900 dark:text-white">{ratingLabel}</span>
          <span className="px-1.5 py-0.2 rounded bg-blue-600 text-white text-xs font-black">
            {rating.toFixed(1)}
          </span>
        </div>

        <div className="absolute bottom-3 left-3">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500 text-white shadow-xs">
            Zero Advance
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <div className="flex text-amber-400">
              {Array.from({ length: hotel.stars || 4 }).map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400" />
              ))}
            </div>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {distanceText}
            </span>
          </div>

          <Link href={`/hotel/${hotel.id}`}>
            <h3 className="text-base font-black text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors leading-snug hover:underline">
              {hotel.name}
            </h3>
          </Link>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
            {hotel.address}
          </p>

          <div className="mt-3 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <Check className="w-3 h-3" />
              <span>Free 24/7 Airport Shuttle</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
              <Check className="w-3 h-3 text-blue-600" />
              <span>Zero Advance • Pay at Counter</span>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <span className="text-xl font-black text-blue-600 dark:text-blue-400">
              {currencySymbol} {convertedPrice.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-400 block">/ night</span>
          </div>

          {/* Prominent View Details Button */}
          <Link
            href={`/hotel/${hotel.id}`}
            className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-blue-600/30 transition-all flex items-center gap-1"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
