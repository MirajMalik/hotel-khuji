import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
});

async function migrateFlightSync() {
  console.log('--- Applying Flight-Synced & Agency Schema Updates to PostgreSQL ---');

  // 1. Users table role constraint / check (allow 'agency', 'owner', 'customer')
  await pool.query(`
    ALTER TABLE public.users 
    DROP CONSTRAINT IF EXISTS chk_users_role;

    ALTER TABLE public.users 
    ADD CONSTRAINT chk_users_role CHECK (role IN ('owner', 'customer', 'agency'));
  `);
  console.log('✓ Users role constraint updated to support owner, customer, agency');

  // 2. Hotels table: ensure location_url and shuttle_available exist
  await pool.query(`
    ALTER TABLE public.hotels
    ADD COLUMN IF NOT EXISTS location_url TEXT,
    ADD COLUMN IF NOT EXISTS shuttle_available BOOLEAN DEFAULT true;

    UPDATE public.hotels 
    SET location_url = COALESCE(location_url, 'https://maps.google.com/?q=23.8512,90.4101'),
        shuttle_available = COALESCE(shuttle_available, true);
  `);
  console.log('✓ Hotels columns location_url and shuttle_available added');

  // 3. Rooms table: ensure price column is accessible (base_price exists, add alias/column price)
  await pool.query(`
    ALTER TABLE public.rooms
    ADD COLUMN IF NOT EXISTS price NUMERIC(10,2);

    UPDATE public.rooms
    SET price = COALESCE(price, base_price, 0);
  `);
  console.log('✓ Rooms price column synchronized');

  // 4. Bookings table: add booked_by_user_id, flight_number, flight_departure_time, wakeup_call_time, wakeup_call_completed
  await pool.query(`
    ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS booked_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS flight_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS flight_departure_time TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS wakeup_call_time TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS wakeup_call_completed BOOLEAN DEFAULT false;

    CREATE INDEX IF NOT EXISTS idx_bookings_flight_departure ON public.bookings(flight_departure_time);
  `);
  console.log('✓ Bookings table updated with flight and wake-up tracking columns');

  // 5. Seed sample flights for today if none exist
  const existingFlights = await pool.query(`
    SELECT id FROM public.bookings WHERE flight_number IS NOT NULL LIMIT 1
  `);

  if (existingFlights.rows.length === 0) {
    const defaultHotel = await pool.query('SELECT id FROM public.hotels LIMIT 1');
    const hotelId = defaultHotel.rows[0]?.id;
    const defaultRooms = await pool.query('SELECT id, room_number FROM public.rooms WHERE hotel_id = $1 LIMIT 3', [hotelId]);

    if (hotelId && defaultRooms.rows.length > 0) {
      const now = new Date();
      // Flight 1: 2.5 hours from now (Urgent queue < 4h)
      const dep1 = new Date(now.getTime() + 2.5 * 60 * 60 * 1000);
      const wake1 = new Date(dep1.getTime() - 2 * 60 * 60 * 1000);

      // Flight 2: 1.5 hours from now (Urgent queue < 4h)
      const dep2 = new Date(now.getTime() + 1.5 * 60 * 60 * 1000);
      const wake2 = new Date(dep2.getTime() - 1.5 * 60 * 60 * 1000);

      // Flight 3: 6 hours from now (Later queue > 4h)
      const dep3 = new Date(now.getTime() + 6 * 60 * 60 * 1000);
      const wake3 = new Date(dep3.getTime() - 2.5 * 60 * 60 * 1000);

      await pool.query(`
        INSERT INTO public.bookings (
          hotel_id, room_id, guest_name, guest_phone, check_in_date, check_out_date,
          flight_number, flight_departure_time, wakeup_call_time, wakeup_call_completed,
          booking_source, total_amount, status
        ) VALUES 
        ($1, $2, 'Capt. Tariq Rahman', '+8801711223344', CURRENT_DATE, CURRENT_DATE + 1, 'EK-583', $3, $4, false, 'web', 3500.00, 'confirmed'),
        ($1, $5, 'Dr. Shaila Munir (Agency Bulk)', '+8801819988776', CURRENT_DATE, CURRENT_DATE + 1, 'QR-639', $6, $7, false, 'web', 4200.00, 'confirmed'),
        ($1, $8, 'Mr. Jason Vance', '+8801912345678', CURRENT_DATE, CURRENT_DATE + 1, 'BG-049', $9, $10, false, 'web', 2800.00, 'confirmed')
      `, [
        hotelId,
        defaultRooms.rows[0].id, dep1.toISOString(), wake1.toISOString(),
        defaultRooms.rows[1]?.id || defaultRooms.rows[0].id, dep2.toISOString(), wake2.toISOString(),
        defaultRooms.rows[2]?.id || defaultRooms.rows[0].id, dep3.toISOString(), wake3.toISOString()
      ]);
      console.log('✓ Seeded active flight-synced bookings for testing');
    }
  }

  console.log('--- Migration Completed Successfully ---');
  await pool.end();
}

migrateFlightSync().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
