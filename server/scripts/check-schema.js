import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
});

async function check() {
  const users = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
  const hotels = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'hotels'");
  const rooms = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'rooms'");
  const bookings = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'bookings'");
  console.log('USERS:', users.rows.map(r => r.column_name));
  console.log('HOTELS:', hotels.rows.map(r => r.column_name));
  console.log('ROOMS:', rooms.rows.map(r => r.column_name));
  console.log('BOOKINGS:', bookings.rows.map(r => r.column_name));
  await pool.end();
}

check().catch(console.error);
