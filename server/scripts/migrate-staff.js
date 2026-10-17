import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
});

async function migrate() {
  console.log('Running Staff and Money Management migration on PostgreSQL...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.staff (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT,
      salary NUMERIC(10,2) NOT NULL DEFAULT 0,
      salary_paid BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public.staff_expenses (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
      staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
      staff_name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'salary',
      amount NUMERIC(10,2) NOT NULL DEFAULT 0,
      expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  console.log('✓ Staff and Staff Expenses tables created in PostgreSQL.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
