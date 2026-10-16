import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool, Client } = pg;

async function ensureDatabaseExists() {
  const url = process.env.DATABASE_URL;
  if (!url) return;

  try {
    const parsed = new URL(url);
    const targetDb = parsed.pathname.replace('/', '') || 'hotel_khuji';

    if (targetDb === 'postgres') return; // Default maintenance db

    // Connect to maintenance database 'postgres' to check/create target database
    parsed.pathname = '/postgres';
    const adminClient = new Client({
      connectionString: parsed.toString(),
      ssl: parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' ? false : { rejectUnauthorized: false },
    });

    await adminClient.connect();
    const checkRes = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [targetDb]
    );

    if (checkRes.rows.length === 0) {
      console.log(`Database "${targetDb}" does not exist. Creating it now...`);
      await adminClient.query(`CREATE DATABASE "${targetDb}";`);
      console.log(`✓ Database "${targetDb}" created successfully.`);
    }

    await adminClient.end();
  } catch (err) {
    // If we cannot connect to 'postgres' db or not permitted, proceed to direct pool connection
    console.log(`Notice: Database existence check skipped (${err.message}). Connecting directly...`);
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') || !process.env.DATABASE_URL
    ? false
    : { rejectUnauthorized: false },
});

async function initDB() {
  await ensureDatabaseExists();
  const client = await pool.connect();
  try {
    console.log('--- Initializing Hotel Khuji PostgreSQL Database ---');

    await client.query('BEGIN');

    // 1. Extensions
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    // 2. Users table (Standalone replacement for Supabase auth.users)
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.users (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email         VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name     TEXT,
        role          VARCHAR(50) NOT NULL DEFAULT 'customer',
        phone         VARCHAR(50),
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // 3. Hotels table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.hotels (
        id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
        owner_id            UUID REFERENCES public.users(id) ON DELETE CASCADE,
        name                TEXT NOT NULL,
        address             TEXT NOT NULL,
        latitude            DOUBLE PRECISION,
        longitude           DOUBLE PRECISION,
        subscription_status TEXT NOT NULL DEFAULT 'active',
        cover_image_url     TEXT,
        amenities           TEXT[] DEFAULT ARRAY[]::TEXT[]
      );
    `);

    // 4. Enums
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_status') THEN
          CREATE TYPE room_status AS ENUM ('available', 'occupied', 'maintenance');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_source') THEN
          CREATE TYPE booking_source AS ENUM ('walk_in', 'web');
        END IF;
      END$$;
    `);

    // 5. Rooms table
    await client.query(`
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
    `);

    // 6. Bookings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.bookings (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        hotel_id        UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
        room_id         UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
        guest_name      TEXT NOT NULL,
        guest_phone     TEXT NOT NULL,
        check_in_date   DATE NOT NULL,
        check_out_date  DATE NOT NULL,
        booking_source  booking_source NOT NULL DEFAULT 'walk_in',
        total_amount    NUMERIC(10,2) NOT NULL DEFAULT 0,
        status          TEXT NOT NULL DEFAULT 'confirmed',
        CONSTRAINT chk_booking_dates CHECK (check_out_date >= check_in_date)
      );
    `);

    // 7. Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_hotels_owner_id ON public.hotels(owner_id);
      CREATE INDEX IF NOT EXISTS idx_rooms_hotel_id ON public.rooms(hotel_id);
      CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(hotel_id, current_status);
      CREATE INDEX IF NOT EXISTS idx_bookings_hotel_id ON public.bookings(hotel_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON public.bookings(room_id);
    `);

    // 8. Triggers (Automatic room occupancy synchronization)
    await client.query(`
      CREATE OR REPLACE FUNCTION public.fn_set_room_occupied()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.status = 'confirmed' THEN
          UPDATE public.rooms
          SET current_status = 'occupied'
          WHERE id = NEW.room_id;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trg_booking_occupies_room ON public.bookings;
      CREATE TRIGGER trg_booking_occupies_room
      AFTER INSERT ON public.bookings
      FOR EACH ROW EXECUTE FUNCTION public.fn_set_room_occupied();

      CREATE OR REPLACE FUNCTION public.fn_free_room_on_checkout()
      RETURNS TRIGGER AS $$
      BEGIN
        IF (NEW.status = 'completed' OR NEW.status = 'cancelled') AND OLD.status = 'confirmed' THEN
          UPDATE public.rooms
          SET current_status = 'available'
          WHERE id = NEW.room_id;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trg_checkout_frees_room ON public.bookings;
      CREATE TRIGGER trg_checkout_frees_room
      AFTER UPDATE OF status ON public.bookings
      FOR EACH ROW EXECUTE FUNCTION public.fn_free_room_on_checkout();
    `);

    // 9. Seed Default Admin/Owner & Demo Hotel
    const demoOwnerId = '00000000-0000-0000-0000-000000000001';
    const demoHotelId = 'a0000000-0000-0000-0000-000000000001';
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Ensure hotels.owner_id does not block on old auth.users foreign key
    await client.query(`
      ALTER TABLE public.hotels DROP CONSTRAINT IF EXISTS hotels_owner_id_fkey;
    `);

    await client.query(`
      INSERT INTO public.users (id, email, password_hash, full_name, role)
      VALUES ($1, 'owner@hotelkhuji.com', $2, 'Hotel Owner Admin', 'owner')
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;
    `, [demoOwnerId, hashedPassword]);

    await client.query(`
      INSERT INTO public.hotels (id, owner_id, name, address, latitude, longitude, subscription_status, cover_image_url, amenities)
      VALUES (
        $1,
        $2,
        'Ashkona Transit Grand',
        'Plot 14, Road 2, Ashkona, Dhaka 1230',
        23.8510,
        90.4072,
        'active',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        ARRAY['Free WiFi', '24/7 Power Backup', 'Airport Shuttle', 'AC', 'Room Service']
      )
      ON CONFLICT (id) DO NOTHING;
    `, [demoHotelId, demoOwnerId]);

    // Seed Demo Rooms
    await client.query(`
      INSERT INTO public.rooms (hotel_id, room_number, type, base_price, current_status, facilities)
      VALUES
        ($1, '101', 'Deluxe AC', 2800.00, 'available', ARRAY['AC', 'Geyser', 'TV', 'Free WiFi']),
        ($1, '102', 'Deluxe AC', 2800.00, 'occupied', ARRAY['AC', 'Geyser', 'TV', 'Free WiFi']),
        ($1, '103', 'Standard Non-AC', 1600.00, 'available', ARRAY['Fan', 'Attached Bath', 'Free WiFi']),
        ($1, '104', 'Standard Non-AC', 1600.00, 'maintenance', ARRAY['Fan', 'Attached Bath']),
        ($1, '201', 'Super Deluxe King', 3500.00, 'available', ARRAY['King Bed', 'AC', 'Geyser', 'Balcony', 'Breakfast']),
        ($1, '202', 'Super Deluxe King', 3500.00, 'available', ARRAY['King Bed', 'AC', 'Geyser', 'Balcony', 'Breakfast'])
      ON CONFLICT (hotel_id, room_number) DO NOTHING;
    `, [demoHotelId]);

    await client.query('COMMIT');
    console.log('✓ PostgreSQL Database Schema and Seed successfully initialized.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error initializing database:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

initDB();
