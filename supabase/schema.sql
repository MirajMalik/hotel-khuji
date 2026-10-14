-- ============================================================
-- HOTEL KHUJI — Multi-Tenant PMS Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL → New Query)
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────────────────────────
-- 1. HOTELS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.hotels (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  address     TEXT NOT NULL,
  latitude    DOUBLE PRECISION,
  longitude   DOUBLE PRECISION
);

-- Index for fast owner lookups
CREATE INDEX idx_hotels_owner_id ON public.hotels(owner_id);

-- RLS: owners see only their hotels
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hotel_owner_select"
  ON public.hotels FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "hotel_owner_insert"
  ON public.hotels FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "hotel_owner_update"
  ON public.hotels FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "hotel_owner_delete"
  ON public.hotels FOR DELETE
  USING (owner_id = auth.uid());

-- Public read access for B2C booking pages (customers need to see hotel info)
CREATE POLICY "hotel_public_read"
  ON public.hotels FOR SELECT
  USING (true);


-- ──────────────────────────────────────────────────────────────
-- 2. ROOMS
-- ──────────────────────────────────────────────────────────────
CREATE TYPE room_status AS ENUM ('available', 'occupied', 'maintenance');

CREATE TABLE public.rooms (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  hotel_id        UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_number     TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'standard',        -- standard, deluxe, suite, etc.
  base_price      NUMERIC(10,2) NOT NULL DEFAULT 0,
  current_status  room_status NOT NULL DEFAULT 'available',

  UNIQUE (hotel_id, room_number)
);

CREATE INDEX idx_rooms_hotel_id ON public.rooms(hotel_id);
CREATE INDEX idx_rooms_status   ON public.rooms(hotel_id, current_status);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Owner can CRUD rooms that belong to their hotels
CREATE POLICY "rooms_owner_select"
  ON public.rooms FOR SELECT
  USING (
    hotel_id IN (SELECT id FROM public.hotels WHERE owner_id = auth.uid())
  );

CREATE POLICY "rooms_owner_insert"
  ON public.rooms FOR INSERT
  WITH CHECK (
    hotel_id IN (SELECT id FROM public.hotels WHERE owner_id = auth.uid())
  );

CREATE POLICY "rooms_owner_update"
  ON public.rooms FOR UPDATE
  USING (
    hotel_id IN (SELECT id FROM public.hotels WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    hotel_id IN (SELECT id FROM public.hotels WHERE owner_id = auth.uid())
  );

CREATE POLICY "rooms_owner_delete"
  ON public.rooms FOR DELETE
  USING (
    hotel_id IN (SELECT id FROM public.hotels WHERE owner_id = auth.uid())
  );

-- Public can see available rooms for booking
CREATE POLICY "rooms_public_available"
  ON public.rooms FOR SELECT
  USING (current_status = 'available');


-- ──────────────────────────────────────────────────────────────
-- 3. BOOKINGS
-- ──────────────────────────────────────────────────────────────
CREATE TYPE booking_source AS ENUM ('walk_in', 'web');

CREATE TABLE public.bookings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  hotel_id        UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_id         UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  guest_name      TEXT NOT NULL,
  guest_phone     TEXT NOT NULL,
  check_in_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  check_out_date  DATE NOT NULL,
  booking_source  booking_source NOT NULL DEFAULT 'walk_in',
  total_amount    NUMERIC(10,2) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'confirmed'        -- confirmed, checked_out, cancelled
);

CREATE INDEX idx_bookings_hotel_id ON public.bookings(hotel_id);
CREATE INDEX idx_bookings_room_id  ON public.bookings(room_id);
CREATE INDEX idx_bookings_dates    ON public.bookings(hotel_id, check_in_date, check_out_date);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Owner can manage bookings for their hotels
CREATE POLICY "bookings_owner_select"
  ON public.bookings FOR SELECT
  USING (
    hotel_id IN (SELECT id FROM public.hotels WHERE owner_id = auth.uid())
  );

CREATE POLICY "bookings_owner_insert"
  ON public.bookings FOR INSERT
  WITH CHECK (
    hotel_id IN (SELECT id FROM public.hotels WHERE owner_id = auth.uid())
  );

CREATE POLICY "bookings_owner_update"
  ON public.bookings FOR UPDATE
  USING (
    hotel_id IN (SELECT id FROM public.hotels WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    hotel_id IN (SELECT id FROM public.hotels WHERE owner_id = auth.uid())
  );

-- Public can insert bookings (web bookings from customers)
CREATE POLICY "bookings_public_insert"
  ON public.bookings FOR INSERT
  WITH CHECK (booking_source = 'web');


-- ──────────────────────────────────────────────────────────────
-- 4. HELPER FUNCTION: Auto-update room status on booking
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_set_room_occupied()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.rooms
  SET current_status = 'occupied'
  WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_booking_occupies_room
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_set_room_occupied();


-- ──────────────────────────────────────────────────────────────
-- 5. HELPER FUNCTION: Free room on checkout
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_free_room_on_checkout()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'checked_out' AND OLD.status != 'checked_out' THEN
    UPDATE public.rooms
    SET current_status = 'available'
    WHERE id = NEW.room_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_checkout_frees_room
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_free_room_on_checkout();
