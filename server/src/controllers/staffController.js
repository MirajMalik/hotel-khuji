import { query } from '../config/db.js';

// --- Staff CRUD ---
export const getStaffByHotel = async (req, res) => {
  const { hotelId } = req.params;
  try {
    const result = await query(
      'SELECT * FROM public.staff WHERE hotel_id = $1 ORDER BY created_at DESC',
      [hotelId]
    );
    return res.status(200).json({ data: result.rows });
  } catch (err) {
    console.error('Error fetching staff:', err);
    return res.status(500).json({ error: 'Failed to fetch staff members' });
  }
};

export const createStaff = async (req, res) => {
  const { hotel_id, hotelId, name, role, phone = '', salary = 0 } = req.body;
  const targetHotelId = hotel_id || hotelId;

  if (!targetHotelId || !name || !role) {
    return res.status(400).json({ error: 'hotelId, name, and role are required' });
  }

  try {
    const result = await query(
      `INSERT INTO public.staff (hotel_id, name, role, phone, salary, salary_paid)
       VALUES ($1, $2, $3, $4, $5, false)
       RETURNING *`,
      [targetHotelId, name, role, phone, salary]
    );
    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    console.error('Error creating staff:', err);
    return res.status(500).json({ error: 'Failed to create staff member' });
  }
};

export const updateStaff = async (req, res) => {
  const { id } = req.params;
  const { name, role, phone, salary, salary_paid } = req.body;

  try {
    const result = await query(
      `UPDATE public.staff
       SET
         name = COALESCE($1, name),
         role = COALESCE($2, role),
         phone = COALESCE($3, phone),
         salary = COALESCE($4, salary),
         salary_paid = COALESCE($5, salary_paid)
       WHERE id = $6
       RETURNING *`,
      [name, role, phone, salary, salary_paid, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    return res.status(200).json({ data: result.rows[0] });
  } catch (err) {
    console.error('Error updating staff:', err);
    return res.status(500).json({ error: 'Failed to update staff member' });
  }
};

export const deleteStaff = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM public.staff WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    return res.status(200).json({ success: true, message: 'Staff member deleted' });
  } catch (err) {
    console.error('Error deleting staff:', err);
    return res.status(500).json({ error: 'Failed to delete staff member' });
  }
};

// --- Staff Expenses CRUD ---
export const getExpensesByHotel = async (req, res) => {
  const { hotelId } = req.params;
  try {
    const result = await query(
      `SELECT * FROM public.staff_expenses
       WHERE hotel_id = $1
       ORDER BY expense_date DESC, created_at DESC`,
      [hotelId]
    );
    return res.status(200).json({ data: result.rows });
  } catch (err) {
    console.error('Error fetching staff expenses:', err);
    return res.status(500).json({ error: 'Failed to fetch staff expenses' });
  }
};

export const createExpense = async (req, res) => {
  const {
    hotel_id,
    hotelId,
    staff_id,
    staffId,
    staff_name,
    staffName,
    category = 'salary',
    amount = 0,
    expense_date,
    expenseDate,
    notes = '',
  } = req.body;

  const targetHotelId = hotel_id || hotelId;
  const targetStaffName = staff_name || staffName;
  const targetAmount = amount;
  const targetDate = expense_date || expenseDate || new Date().toISOString().split('T')[0];

  if (!targetHotelId || !targetStaffName || !targetAmount) {
    return res.status(400).json({ error: 'hotelId, staffName, and amount are required' });
  }

  try {
    const result = await query(
      `INSERT INTO public.staff_expenses (hotel_id, staff_id, staff_name, category, amount, expense_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [targetHotelId, staff_id || staffId || null, targetStaffName, category, targetAmount, targetDate, notes]
    );
    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    console.error('Error recording expense:', err);
    return res.status(500).json({ error: 'Failed to record expense' });
  }
};

export const deleteExpense = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM public.staff_expenses WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense record not found' });
    }
    return res.status(200).json({ success: true, message: 'Expense record deleted' });
  } catch (err) {
    console.error('Error deleting expense:', err);
    return res.status(500).json({ error: 'Failed to delete expense' });
  }
};
