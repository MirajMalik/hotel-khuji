-- ============================================================
-- HOTEL KHUJI — Transit Hotel SaaS Platform Schema
-- Step 1: PostgreSQL Database Schema with Flight-Synced Bookings
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS: Role-based access ('owner', 'customer', 'agency')
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role          VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'customer', 'agency')),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     TEXT,
  phone         VARCHAR(50),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. HOTELS: Property registry with location GPS/maps & shuttle status
CREATE TABLE IF NOT EXISTS public.hotels (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id            UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  location_url        TEXT,
  shuttle_available   BOOLEAN NOT NULL DEFAULT true,
  address             TEXT,
  latitude            DOUBLE PRECISION,
  longitude           DOUBLE PRECISION,
  subscription_status TEXT NOT NULL DEFAULT 'active',
  cover_image_url     TEXT,
  amenities           TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hotels_owner_id ON public.hotels(owner_id);

-- 3. ROOMS: Room inventory linked to hotels
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_status') THEN
    CREATE TYPE room_status AS ENUM ('available', 'occupied', 'maintenance');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.rooms (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id        UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_number     TEXT NOT NULL,
  price           NUMERIC(10,2) NOT NULL DEFAULT 0,
  base_price      NUMERIC(10,2) NOT NULL DEFAULT 0,
  status          room_status NOT NULL DEFAULT 'available',
  current_status  room_status NOT NULL DEFAULT 'available',
  type            TEXT NOT NULL DEFAULT 'standard',
  image_urls      TEXT[] DEFAULT ARRAY[]::TEXT[],
  facilities      TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hotel_id, room_number)
);

CREATE INDEX IF NOT EXISTS idx_rooms_hotel_id ON public.rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(hotel_id, status);

-- 4. BOOKINGS: Flight-Synced Bookings with Departure & Wake-up Schedule
CREATE TABLE IF NOT EXISTS public.bookings (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id              UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_id               UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  booked_by_user_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  flight_number         VARCHAR(50),
  flight_departure_time TIMESTAMPTZ,
  wakeup_call_time      TIMESTAMPTZ,
  wakeup_call_completed BOOLEAN NOT NULL DEFAULT false,
  status                TEXT NOT NULL DEFAULT 'confirmed',
  guest_name            TEXT NOT NULL,
  guest_phone           TEXT NOT NULL,
  check_in_date         DATE NOT NULL DEFAULT CURRENT_DATE,
  check_out_date        DATE NOT NULL,
  booking_source        VARCHAR(50) NOT NULL DEFAULT 'web',
  total_amount          NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_hotel_id ON public.bookings(hotel_id);
CREATE INDEX IF NOT EXISTS idx_bookings_flight_departure ON public.bookings(flight_departure_time);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings(hotel_id, check_in_date, check_out_date);
