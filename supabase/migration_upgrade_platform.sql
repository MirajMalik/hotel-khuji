-- ============================================================
-- HOTEL KHUJI — SCHEMA UPGRADE: Marketplace & Owner SaaS
-- ============================================================

-- 1. UPDATE HOTELS TABLE
ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create index for faster marketplace aggregator filtering
CREATE INDEX IF NOT EXISTS idx_hotels_subscription_status 
  ON public.hotels(subscription_status);

-- 2. UPDATE ROOMS TABLE
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS facilities TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 3. STORAGE BUCKET: 'hotel-images'
-- Ensure the storage bucket exists and is set to public read
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

-- Policy 1: Public users can view / download images
DROP POLICY IF EXISTS "Public users can view hotel images" ON storage.objects;
CREATE POLICY "Public users can view hotel images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'hotel-images');

-- Policy 2: Authenticated owners can upload images
DROP POLICY IF EXISTS "Authenticated owners can upload hotel images" ON storage.objects;
CREATE POLICY "Authenticated owners can upload hotel images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'hotel-images'
  );

-- Policy 3: Authenticated owners can update their images
DROP POLICY IF EXISTS "Authenticated owners can update hotel images" ON storage.objects;
CREATE POLICY "Authenticated owners can update hotel images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'hotel-images')
  WITH CHECK (bucket_id = 'hotel-images');

-- Policy 4: Authenticated owners can delete their images
DROP POLICY IF EXISTS "Authenticated owners can delete hotel images" ON storage.objects;
CREATE POLICY "Authenticated owners can delete hotel images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'hotel-images');

-- ============================================================
-- 4. SEED / UPDATE EXISTING HOTELS & ROOMS (For Instant Demo)
-- ============================================================
UPDATE public.hotels
SET
  subscription_status = 'active',
  cover_image_url = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
  amenities = ARRAY['Free Airport Shuttle', '24/7 Check-in', 'High-Speed Wi-Fi', 'Soundproof Rooms', 'Power Backup', 'Complimentary Breakfast']
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- Update Room Images & Facilities for Demo Inn
UPDATE public.rooms
SET 
  image_urls = ARRAY['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80'],
  facilities = ARRAY['AC', 'Attached Bath', 'Free Wi-Fi', 'Work Desk', 'Daily Housekeeping']
WHERE room_number = '101' AND hotel_id = 'a0000000-0000-0000-0000-000000000001';

UPDATE public.rooms
SET 
  image_urls = ARRAY['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'],
  facilities = ARRAY['Queen Bed', 'AC', 'Hot Water', 'Smart TV', 'Free Wi-Fi', 'Airport Shuttle']
WHERE room_number = '102' AND hotel_id = 'a0000000-0000-0000-0000-000000000001';

UPDATE public.rooms
SET 
  image_urls = ARRAY['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'],
  facilities = ARRAY['King Bed', 'AC', 'Soundproof Windows', 'Smart TV', 'Mini Fridge', 'City View']
WHERE room_number = '103' AND hotel_id = 'a0000000-0000-0000-0000-000000000001';

UPDATE public.rooms
SET 
  image_urls = ARRAY['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80'],
  facilities = ARRAY['Luxury King Suite', 'Airport Runway View', 'Espresso Machine', 'Bathtub', 'High-speed Wi-Fi']
WHERE room_number = '104' AND hotel_id = 'a0000000-0000-0000-0000-000000000001';

UPDATE public.rooms
SET 
  image_urls = ARRAY['https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80'],
  facilities = ARRAY['2 Twin Beds', 'AC', 'Attached Bath', 'Free Wi-Fi', 'Power Backup']
WHERE room_number = '201' AND hotel_id = 'a0000000-0000-0000-0000-000000000001';

UPDATE public.rooms
SET 
  image_urls = ARRAY['https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80'],
  facilities = ARRAY['Panoramic Airport View', 'Soundproof Triple Glazing', 'King Bed', 'Breakfast Included']
WHERE room_number = '202' AND hotel_id = 'a0000000-0000-0000-0000-000000000001';

UPDATE public.rooms
SET 
  image_urls = ARRAY['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80'],
  facilities = ARRAY['Hourly Transit Capsule', 'Secure Locker', 'High-Speed Wi-Fi', 'Shared Hot Shower', 'Charging Station']
WHERE room_number = '203' AND hotel_id = 'a0000000-0000-0000-0000-000000000001';

UPDATE public.rooms
SET 
  image_urls = ARRAY['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80'],
  facilities = ARRAY['Family Suite (2 Queen Beds)', 'Living Area', '2 Bathrooms', 'Soundproof', 'Kitchenette']
WHERE room_number = '204' AND hotel_id = 'a0000000-0000-0000-0000-000000000001';

-- Insert second active hotel to showcase multi-hotel marketplace
INSERT INTO public.hotels (id, name, address, latitude, longitude, subscription_status, cover_image_url, amenities)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'Skyline Transit Suites — Dhaka Airport',
  'Road 18, Sector 3, Uttara, Dhaka 1230 (500m to Terminal)',
  23.8680,
  90.4010,
  'active',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
  ARRAY['Free Airport Drop', 'Rooftop Lounge', 'Soundproof Rooms', '24/7 Check-in', 'Complimentary Breakfast', 'High-Speed Wi-Fi']
)
ON CONFLICT (id) DO UPDATE SET
  subscription_status = EXCLUDED.subscription_status,
  cover_image_url = EXCLUDED.cover_image_url,
  amenities = EXCLUDED.amenities;

INSERT INTO public.rooms (hotel_id, room_number, type, base_price, current_status, image_urls, facilities)
VALUES
  ('a0000000-0000-0000-0000-000000000002', '301', 'Deluxe King', 3200.00, 'available', ARRAY['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'], ARRAY['King Bed', 'AC', 'Balcony', 'Breakfast Included', 'Free Wi-Fi']),
  ('a0000000-0000-0000-0000-000000000002', '302', 'Executive Transit Pod', 1500.00, 'available', ARRAY['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80'], ARRAY['Soundproof Pod', 'Fast Wi-Fi', 'Hot Shower', 'Power Station'])
ON CONFLICT (hotel_id, room_number) DO NOTHING;
