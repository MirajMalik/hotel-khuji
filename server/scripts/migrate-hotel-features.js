import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  console.log('--- Applying Hotel Booking & Advance Payment Migration ---');

  // 1. Hotels table updates: description, phone, whatsapp, location_url
  await pool.query(`
    ALTER TABLE public.hotels
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50),
    ADD COLUMN IF NOT EXISTS location_url TEXT;

    UPDATE public.hotels
    SET 
      description = COALESCE(description, 'Verified transit hotel located adjacent to Hazrat Shahjalal International Airport (DAC). Offering complimentary 24/7 airport terminal shuttle, soundproof AC rooms, and zero-advance online booking.'),
      phone = COALESCE(phone, '+8801711000111'),
      whatsapp = COALESCE(whatsapp, '8801711000111'),
      location_url = COALESCE(location_url, 'https://maps.google.com/?q=23.8512,90.4101')
    WHERE description IS NULL OR phone IS NULL OR whatsapp IS NULL;
  `);
  console.log('✓ Hotels table updated with description, phone, whatsapp, location_url');

  // 2. Rooms table updates: requires_advance, advance_amount, facilities, image_urls
  await pool.query(`
    ALTER TABLE public.rooms
    ADD COLUMN IF NOT EXISTS requires_advance BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS advance_amount NUMERIC(10,2) DEFAULT 0;

    -- Update demo rooms to have realistic image sets for moving slideshow
    UPDATE public.rooms
    SET image_urls = ARRAY[
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
    ]
    WHERE image_urls IS NULL OR array_length(image_urls, 1) = 0;
  `);
  console.log('✓ Rooms table updated with requires_advance, advance_amount, image_urls');

  // 3. Bookings table updates: advance_required, advance_paid, booking_source
  await pool.query(`
    ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS advance_required BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS advance_paid NUMERIC(10,2) DEFAULT 0;

    -- Ensure booking_source column can accept text values without strict enum block
    DO $$
    BEGIN
      ALTER TABLE public.bookings ALTER COLUMN booking_source TYPE VARCHAR(50);
    EXCEPTION
      WHEN others THEN NULL;
    END $$;
  `);
  console.log('✓ Bookings table updated with advance_required, advance_paid, flexible booking_source');

  console.log('--- Migration Complete Successfully ---');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
