-- ============================================================
-- HOTEL KHUJI — Multi-Tenant PMS Schema & Seed Data
-- Run this in Supabase SQL Editor:
-- Dashboard (https://supabase.com/dashboard/project/csprfswvswgozlnjcmbo) 
--   -> SQL Editor (left sidebar) -> New Query -> Paste & Run
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing triggers/functions if re-running
DROP TRIGGER IF EXISTS trg_booking_occupies_room ON public.bookings;
DROP TRIGGER IF EXISTS trg_checkout_frees_room ON public.bookings;
DROP FUNCTION IF EXISTS public.fn_set_room_occupied();
DROP FUNCTION IF EXISTS public.fn_free_room_on_checkout();

-- ──────────────────────────────────────────────────────────────
-- 1. HOTELS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hotels (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  owner_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  address             TEXT NOT NULL,
  latitude            DOUBLE PRECISION,
  longitude           DOUBLE PRECISION,
  subscription_status TEXT NOT NULL DEFAULT 'pending',
  cover_image_url     TEXT,
  amenities           TEXT[] DEFAULT ARRAY[]::TEXT[]
);

CREATE INDEX IF NOT EXISTS idx_hotels_subscription_status ON public.hotels(subscription_status);

CREATE INDEX IF NOT EXISTS idx_hotels_owner_id ON public.hotels(owner_id);

ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hotel_select_policy" ON public.hotels;
CREATE POLICY "hotel_select_policy"
  ON public.hotels FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "hotel_insert_policy" ON public.hotels;
CREATE POLICY "hotel_insert_policy"
  ON public.hotels FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "hotel_update_policy" ON public.hotels;
CREATE POLICY "hotel_update_policy"
  ON public.hotels FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "hotel_delete_policy" ON public.hotels;
CREATE POLICY "hotel_delete_policy"
  ON public.hotels FOR DELETE
  USING (owner_id = auth.uid());


-- ──────────────────────────────────────────────────────────────
-- 2. ROOMS
-- ──────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_status') THEN
    CREATE TYPE room_status AS ENUM ('available', 'occupied', 'maintenance');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.rooms (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  hotel_id        UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_number     TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'standard',
  base_price      NUMERIC(10,2) NOT NULL DEFAULT 0,
  current_status  room_status NOT NULL DEFAULT 'available',
  image_urls      TEXT[] DEFAULT ARRAY[]::TEXT[],
  facilities      TEXT[] DEFAULT ARRAY[]::TEXT[],

  UNIQUE (hotel_id, room_number)
);

CREATE INDEX IF NOT EXISTS idx_rooms_hotel_id ON public.rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status   ON public.rooms(hotel_id, current_status);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rooms_select_policy" ON public.rooms;
CREATE POLICY "rooms_select_policy"
  ON public.rooms FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "rooms_insert_policy" ON public.rooms;
CREATE POLICY "rooms_insert_policy"
  ON public.rooms FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "rooms_update_policy" ON public.rooms;
CREATE POLICY "rooms_update_policy"
  ON public.rooms FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "rooms_delete_policy" ON public.rooms;
CREATE POLICY "rooms_delete_policy"
  ON public.rooms FOR DELETE
  USING (true);


-- ──────────────────────────────────────────────────────────────
-- 3. BOOKINGS
-- ──────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_source') THEN
    CREATE TYPE booking_source AS ENUM ('walk_in', 'web');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.bookings (
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
  status          TEXT NOT NULL DEFAULT 'confirmed'
);

CREATE INDEX IF NOT EXISTS idx_bookings_hotel_id ON public.bookings(hotel_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id  ON public.bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates    ON public.bookings(hotel_id, check_in_date, check_out_date);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookings_select_policy" ON public.bookings;
CREATE POLICY "bookings_select_policy"
  ON public.bookings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "bookings_insert_policy" ON public.bookings;
CREATE POLICY "bookings_insert_policy"
  ON public.bookings FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "bookings_update_policy" ON public.bookings;
CREATE POLICY "bookings_update_policy"
  ON public.bookings FOR UPDATE
  USING (true);


-- ──────────────────────────────────────────────────────────────
-- 4. REALTIME ENABLEMENT
-- ──────────────────────────────────────────────────────────────
-- Enables instant live updates in FrontDeskView when bookings occur
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END$$;


-- ──────────────────────────────────────────────────────────────
-- 5. AUTOMATIC TRIGGERS (Room status sync)
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


-- ──────────────────────────────────────────────────────────────
-- 6. STORAGE BUCKET & POLICIES ('hotel-images')
-- ──────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hotel-images',
  'hotel-images',
  true,
  5242880, -- 5 MB max per image
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Note: RLS is already permanently enabled on storage.objects by Supabase out of the box.

DROP POLICY IF EXISTS "Public users can view hotel images" ON storage.objects;
CREATE POLICY "Public users can view hotel images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'hotel-images');

DROP POLICY IF EXISTS "Authenticated owners can upload hotel images" ON storage.objects;
CREATE POLICY "Authenticated owners can upload hotel images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'hotel-images');

DROP POLICY IF EXISTS "Authenticated owners can update hotel images" ON storage.objects;
CREATE POLICY "Authenticated owners can update hotel images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'hotel-images')
  WITH CHECK (bucket_id = 'hotel-images');

DROP POLICY IF EXISTS "Authenticated owners can delete hotel images" ON storage.objects;
CREATE POLICY "Authenticated owners can delete hotel images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'hotel-images');


-- ──────────────────────────────────────────────────────────────
-- 7. SEED DATA (Ashkona Airport Transit Inn + Rooms)
-- ──────────────────────────────────────────────────────────────
INSERT INTO public.hotels (id, name, address, latitude, longitude, subscription_status, cover_image_url, amenities)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Ashkona Airport Transit Inn',
  'Haji Camp Road, Ashkona, Uttara, Dhaka 1230',
  23.8512,
  90.4101,
  'active',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
  ARRAY['Free Airport Shuttle', '24/7 Check-in', 'High-Speed Wi-Fi', 'Soundproof Rooms', 'Power Backup', 'Complimentary Breakfast']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  subscription_status = EXCLUDED.subscription_status,
  cover_image_url = EXCLUDED.cover_image_url,
  amenities = EXCLUDED.amenities;

INSERT INTO public.rooms (hotel_id, room_number, type, base_price, current_status, image_urls, facilities)
VALUES
  ('a0000000-0000-0000-0000-000000000001', '101', 'Standard Single', 1800.00, 'available',
   ARRAY['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80'],
   ARRAY['AC', 'Attached Bath', 'Free Wi-Fi', 'Work Desk', 'Daily Housekeeping']),
  ('a0000000-0000-0000-0000-000000000001', '102', 'Standard Queen', 2500.00, 'available',
   ARRAY['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'],
   ARRAY['Queen Bed', 'AC', 'Hot Water', 'Smart TV', 'Free Wi-Fi', 'Airport Shuttle']),
  ('a0000000-0000-0000-0000-000000000001', '103', 'Deluxe Double', 3500.00, 'available',
   ARRAY['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'],
   ARRAY['King Bed', 'AC', 'Soundproof Windows', 'Smart TV', 'Mini Fridge', 'City View']),
  ('a0000000-0000-0000-0000-000000000001', '104', 'Executive Transit Suite', 5000.00, 'available',
   ARRAY['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80'],
   ARRAY['Luxury King Suite', 'Airport Runway View', 'Espresso Machine', 'Bathtub', 'High-speed Wi-Fi']),
  ('a0000000-0000-0000-0000-000000000001', '201', 'Standard Twin', 2800.00, 'available',
   ARRAY['https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80'],
   ARRAY['2 Twin Beds', 'AC', 'Attached Bath', 'Free Wi-Fi', 'Power Backup']),
  ('a0000000-0000-0000-0000-000000000001', '202', 'Airport View Deluxe', 4200.00, 'available',
   ARRAY['https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80'],
   ARRAY['Panoramic Airport View', 'Soundproof Triple Glazing', 'King Bed', 'Breakfast Included']),
  ('a0000000-0000-0000-0000-000000000001', '203', 'Transit Pod (Hourly)', 1200.00, 'available',
   ARRAY['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80'],
   ARRAY['Hourly Transit Capsule', 'Secure Locker', 'High-Speed Wi-Fi', 'Shared Hot Shower', 'Charging Station']),
  ('a0000000-0000-0000-0000-000000000001', '204', 'Family Suite', 6500.00, 'maintenance',
   ARRAY['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80'],
   ARRAY['Family Suite (2 Queen Beds)', 'Living Area', '2 Bathrooms', 'Soundproof', 'Kitchenette'])
ON CONFLICT (hotel_id, room_number) DO UPDATE SET
  type = EXCLUDED.type,
  base_price = EXCLUDED.base_price,
  image_urls = EXCLUDED.image_urls,
  facilities = EXCLUDED.facilities;

