'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, todayISO } from '@/lib/utils';
import { useHotelStore } from '@/lib/store';

const DEMO_HOTEL_ID = process.env.NEXT_PUBLIC_DEMO_HOTEL_ID || 'a0000000-0000-0000-0000-000000000001';

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color = 'brand' }) {
  const colorMap = {
    brand: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    sky: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  };
  return (
    <div className={`p-5 rounded-2xl border ${colorMap[color]} bg-surface-1 flex flex-col gap-1.5 shadow-lg`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <span className="text-2xl font-black text-white">{value}</span>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    available: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    occupied: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    maintenance: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    confirmed: 'bg-brand-500/15 text-brand-400 border-brand-500/30',
    checked_in: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    checked_out: 'bg-zinc-500/15 text-zinc-400 border-zinc-700',
    cancelled: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${map[status] || map.pending}`}>
      {status?.replace('_', ' ')}
    </span>
  );
}

// ─── Modal Wrapper ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-surface-1 border border-zinc-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-2 hover:bg-surface-3 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-bold text-zinc-300 block mb-1">{label}</label>
      {children}
    </div>
  );
}

function OwnerDashboardContent() {
  const router = useRouter();
  const { theme, toggleTheme, setTheme } = useHotelStore();
  const isDay = theme === 'day';

  // Hydrate saved theme on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hotel_theme');
      if (saved === 'day' || saved === 'night') {
        setTheme(saved);
      }
    }
  }, [setTheme]);

  const [currentUser, setCurrentUser] = useState(null);
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [staff, setStaff] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview | rooms | bookings | finance | staff | settings
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Modals state
  const [roomModal, setRoomModal] = useState({ open: false, mode: 'create', room: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, roomId: null });
  const [staffModal, setStaffModal] = useState({ open: false });
  const [expenseModal, setExpenseModal] = useState({ open: false });

  // Form states
  const [roomForm, setRoomForm] = useState({
    room_number: '',
    type: 'Standard Queen',
    base_price: '',
    current_status: 'available',
    image_url: '',
    facilities: '',
  });

  const [staffForm, setStaffForm] = useState({
    name: '',
    role: 'Front Desk Receptionist',
    phone: '',
    salary: '',
  });

  const [expenseForm, setExpenseForm] = useState({
    staff_name: '',
    category: 'salary',
    amount: '',
    expense_date: '',
    notes: '',
  });

  // Client-side date initialization to prevent prerender blocking
  useEffect(() => {
    setExpenseForm((prev) => ({
      ...prev,
      expense_date: prev.expense_date || todayISO(),
    }));
  }, []);

  const [notification, setNotification] = useState(null);
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Auth guard & user load from Express + PostgreSQL
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await api.get('/auth/me');
        if (res?.user) {
          setCurrentUser(res.user);
          localStorage.setItem('hotel_user', JSON.stringify(res.user));
          return;
        }
      } catch (err) {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('hotel_user') : null;
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setCurrentUser(parsed);
            return;
          } catch (e) {}
        }
        router.replace('/login?error=owner_access_required&redirect=/owner/dashboard');
      }
    }
    checkAuth();
  }, [router]);

  // Fetch all hotel data from Express + PostgreSQL
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Hotel info
      try {
        const hRes = await api.get(`/hotels/${DEMO_HOTEL_ID}`);
        if (hRes?.data) setHotel(hRes.data);
      } catch (e) {}

      // 2. Rooms
      try {
        const rRes = await api.get(`/rooms/hotel/${DEMO_HOTEL_ID}`);
        if (rRes?.data) setRooms(rRes.data);
      } catch (e) {}

      // 3. Bookings
      try {
        const bRes = await api.get(`/bookings/hotel/${DEMO_HOTEL_ID}`);
        if (bRes?.data) setBookings(bRes.data);
      } catch (e) {}

      // 4. Staff
      try {
        const sRes = await api.get(`/staff/hotel/${DEMO_HOTEL_ID}`);
        if (sRes?.data) setStaff(sRes.data);
      } catch (e) {}

      // 5. Staff Expenses
      try {
        const expRes = await api.get(`/staff/expenses/hotel/${DEMO_HOTEL_ID}`);
        if (expRes?.data) setExpenses(expRes.data);
      } catch (e) {}
    } catch (err) {
      console.error('Failed to load owner data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSignOut = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}
    localStorage.removeItem('hotel_user');
    document.cookie = 'demo_role=; path=/; max-age=0';
    document.cookie = 'token=; path=/; max-age=0';
    router.push('/login');
  };

  // ─── Room Handlers ──────────────────────────────────────────────────────────
  const openCreateRoomModal = () => {
    setRoomForm({
      room_number: '',
      type: 'Standard Queen',
      base_price: '2500',
      current_status: 'available',
      image_url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
      facilities: 'AC, Queen Bed, Free Wi-Fi, Attached Bath',
    });
    setRoomModal({ open: true, mode: 'create', room: null });
  };

  const openEditRoomModal = (room) => {
    setRoomForm({
      room_number: room.room_number || '',
      type: room.type || 'Standard',
      base_price: String(room.base_price || ''),
      current_status: room.current_status || 'available',
      image_url: room.image_urls?.[0] || '',
      facilities: Array.isArray(room.facilities) ? room.facilities.join(', ') : '',
    });
    setRoomModal({ open: true, mode: 'edit', room });
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    const facilitiesArray = roomForm.facilities
      ? roomForm.facilities.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const imageUrlsArray = roomForm.image_url ? [roomForm.image_url.trim()] : [];

    try {
      if (roomModal.mode === 'create') {
        const res = await api.post('/rooms', {
          hotel_id: DEMO_HOTEL_ID,
          room_number: roomForm.room_number,
          type: roomForm.type,
          base_price: parseFloat(roomForm.base_price) || 0,
          current_status: roomForm.current_status,
          facilities: facilitiesArray,
          image_urls: imageUrlsArray,
        });
        showToast(`Room ${res.data.room_number} saved successfully!`);
      } else {
        const res = await api.patch(`/rooms/${roomModal.room.id}`, {
          room_number: roomForm.room_number,
          type: roomForm.type,
          base_price: parseFloat(roomForm.base_price) || 0,
          current_status: roomForm.current_status,
          facilities: facilitiesArray,
          image_urls: imageUrlsArray,
        });
        showToast(`Room ${res.data.room_number} updated successfully!`);
      }
      setRoomModal({ open: false, mode: 'create', room: null });
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to save room', 'error');
    }
  };

  const handleDeleteRoom = async () => {
    try {
      await api.delete(`/rooms/${deleteConfirm.roomId}`);
      showToast('Room deleted successfully');
      setDeleteConfirm({ open: false, roomId: null });
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to delete room', 'error');
    }
  };

  // ─── Booking Handlers ───────────────────────────────────────────────────────
  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status: newStatus });
      showToast(`Booking marked as ${newStatus}!`);
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to update booking status', 'error');
    }
  };

  // ─── Staff Handlers ─────────────────────────────────────────────────────────
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      await api.post('/staff', {
        hotel_id: DEMO_HOTEL_ID,
        name: staffForm.name,
        role: staffForm.role,
        phone: staffForm.phone,
        salary: parseFloat(staffForm.salary) || 0,
      });
      showToast(`Staff member "${staffForm.name}" saved successfully!`);
      setStaffModal({ open: false });
      setStaffForm({ name: '', role: 'Front Desk Receptionist', phone: '', salary: '' });
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to add staff member', 'error');
    }
  };

  const handleToggleSalaryPaid = async (staffMember) => {
    try {
      const nextPaid = !staffMember.salary_paid;
      await api.patch(`/staff/${staffMember.id}`, { salary_paid: nextPaid });
      showToast(`Salary status updated for ${staffMember.name}`);
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to update salary status', 'error');
    }
  };

  const handleDeleteStaff = async (id) => {
    try {
      await api.delete(`/staff/${id}`);
      showToast('Staff member deleted successfully');
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to delete staff', 'error');
    }
  };

  // ─── Money & Staff Expense Handlers ─────────────────────────────────────────
  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post('/staff/expenses', {
        hotel_id: DEMO_HOTEL_ID,
        staff_name: expenseForm.staff_name,
        category: expenseForm.category,
        amount: parseFloat(expenseForm.amount) || 0,
        expense_date: expenseForm.expense_date,
        notes: expenseForm.notes,
      });
      showToast('Expense recorded successfully!');
      setExpenseModal({ open: false });
      setExpenseForm({ staff_name: '', category: 'salary', amount: '', expense_date: todayISO(), notes: '' });
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to record expense', 'error');
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await api.delete(`/staff/expenses/${id}`);
      showToast('Expense record deleted successfully');
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to delete expense', 'error');
    }
  };

  // ─── Computed Financials ────────────────────────────────────────────────────
  const totalRooms = rooms.length;
  const availableRooms = rooms.filter((r) => r.current_status === 'available').length;
  const occupiedRooms = rooms.filter((r) => r.current_status === 'occupied').length;
  const maintenanceRooms = rooms.filter((r) => r.current_status === 'maintenance').length;

  const totalBookingRevenue = bookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);

  const totalStaffExpenses = expenses.reduce(
    (sum, exp) => sum + (parseFloat(exp.amount) || 0),
    0
  );

  const netProfit = totalBookingRevenue - totalStaffExpenses;

  return (
    <div className="min-h-screen bg-surface-0 text-zinc-100 flex flex-col md:flex-row">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl animate-slide-up flex items-center gap-3 ${
            notification.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
              : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
          }`}
        >
          <span>{notification.type === 'error' ? '⚠️' : '✅'}</span>
          <span className="text-sm font-semibold">{notification.message}</span>
        </div>
      )}

      {/* ─── Left Sidebar Navigation ─── */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } shrink-0 bg-surface-1 border-r border-zinc-800 flex flex-col justify-between transition-all duration-300 z-30`}
      >
        <div>
          {/* Brand & Toggle */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className={`flex items-center gap-3 overflow-hidden ${!sidebarOpen && 'justify-center w-full'}`}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center font-black text-white shrink-0">
                HK
              </div>
              {sidebarOpen && (
                <div>
                  <h2 className="text-sm font-black text-white leading-tight truncate">
                    {hotel?.name || 'Owner Portal'}
                  </h2>
                  <span className="text-[10px] text-brand-400 uppercase tracking-wider font-bold block">
                    Hotel Management
                  </span>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg text-xs"
              >
                ◀
              </button>
            )}
          </div>

          {!sidebarOpen && (
            <div className="p-2 text-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-zinc-500 hover:text-white p-2 rounded-lg text-xs w-full"
              >
                ▶
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5">
            {[
              { id: 'overview', label: 'Dashboard Overview', icon: '📊' },
              { id: 'rooms', label: 'Room Management', icon: '🛏️' },
              { id: 'bookings', label: 'Guest Bookings', icon: '📅' },
              { id: 'finance', label: 'Financial & Expenses', icon: '💰' },
              { id: 'staff', label: 'Staff Management', icon: '👥' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-surface-2'
                } ${!sidebarOpen && 'justify-center px-2'}`}
              >
                <span className="text-base">{tab.icon}</span>
                {sidebarOpen && <span>{tab.label}</span>}
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer — Cross-View Navigation */}
        <div className="p-4 border-t border-zinc-800 space-y-1.5">
          <Link
            href="/dashboard"
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-surface-2 hover:bg-surface-3 text-zinc-300 hover:text-white border border-zinc-700/80 transition-colors ${
              !sidebarOpen && 'justify-center px-1'
            }`}
            title="Front Desk & Wake-Up List"
          >
            <span>🏨</span>
            {sidebarOpen && <span>Front Desk & Wake-Up List</span>}
          </Link>

          <Link
            href="/counter-view"
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-surface-2 hover:bg-surface-3 text-zinc-300 hover:text-white border border-zinc-700/80 transition-colors ${
              !sidebarOpen && 'justify-center px-1'
            }`}
            title="Counter Brochure View"
          >
            <span>🖥️</span>
            {sidebarOpen && <span>Counter View Mode</span>}
          </Link>

          <Link
            href="/hotels"
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-surface-2 hover:bg-surface-3 text-zinc-300 hover:text-white border border-zinc-700/80 transition-colors ${
              !sidebarOpen && 'justify-center px-1'
            }`}
            title="Guest Hotels Marketplace"
          >
            <span>🌐</span>
            {sidebarOpen && <span>View Marketplace</span>}
          </Link>

          <button
            onClick={handleSignOut}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900 transition-colors ${
              !sidebarOpen && 'justify-center px-1'
            }`}
          >
            <span>🚪</span>
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ─── Main Content Container ─── */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-surface-1/90 backdrop-blur-xl border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white capitalize">
              {activeTab === 'overview' && 'Property Overview'}
              {activeTab === 'rooms' && 'Room Inventory & Modification'}
              {activeTab === 'bookings' && 'Reservations & Check-Ins'}
              {activeTab === 'finance' && 'Money Tracking & Staff Expenses'}
              {activeTab === 'staff' && 'Hotel Staff Management'}
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Hotel Management System Active
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* 2 COLOR SHIFTING BUTTON */}
            <button
              onClick={toggleTheme}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs border flex items-center gap-1.5 shadow-sm transition-all ${
                isDay
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-amber-300 border-zinc-700'
              }`}
              title="Click to switch between Day Mode and Night Mode"
            >
              <span>{isDay ? '☀️ Day Mode' : '🌙 Night Mode'}</span>
            </button>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-surface-2 hover:bg-surface-3 text-zinc-300 hover:text-white rounded-xl border border-zinc-750 transition-colors"
            >
              <span>🏨</span>
              <span>Front Desk & Wake-Up List</span>
            </Link>

            <Link
              href="/counter-view"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-surface-2 hover:bg-surface-3 text-zinc-300 hover:text-white rounded-xl border border-zinc-750 transition-colors"
            >
              <span>🖥️</span>
              <span>Counter View</span>
            </Link>

            <Link
              href="/hotels"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-surface-2 hover:bg-surface-3 text-zinc-300 hover:text-white rounded-xl border border-zinc-750 transition-colors"
            >
              <span>🌐</span>
              <span>Marketplace</span>
            </Link>
            {activeTab === 'rooms' && (
              <button
                onClick={openCreateRoomModal}
                className="px-4 py-2 text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <span>➕</span> Add New Room
              </button>
            )}
            {activeTab === 'staff' && (
              <button
                onClick={() => setStaffModal({ open: true })}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <span>➕</span> Add Staff
              </button>
            )}
            {activeTab === 'finance' && (
              <button
                onClick={() => setExpenseModal({ open: true })}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <span>💸</span> Record Expense
              </button>
            )}
            <button
              onClick={fetchData}
              className="p-2 text-xs bg-surface-2 hover:bg-surface-3 text-zinc-300 rounded-xl border border-zinc-800 transition-colors"
              title="Refresh Data"
            >
              🔄
            </button>
          </div>
        </header>

        {/* Tab Body */}
        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
          {loading && (
            <div className="p-4 rounded-2xl bg-surface-1 border border-zinc-800 text-center text-xs text-zinc-400 animate-pulse">
              Loading hotel records...
            </div>
          )}

          {/* ══════════ TAB 1: OVERVIEW ══════════ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Rooms" value={totalRooms} icon="🚪" color="brand" />
                <StatCard label="Available" value={availableRooms} icon="🟢" color="emerald" />
                <StatCard label="Occupied" value={occupiedRooms} icon="🔴" color="rose" />
                <StatCard label="Maintenance" value={maintenanceRooms} icon="🔧" color="amber" />
              </div>

              {/* Financial KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-2xl bg-surface-1 border border-zinc-800 flex flex-col justify-between shadow-lg">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Bookings Income</span>
                  <div className="mt-2">
                    <span className="text-3xl font-black text-emerald-400">{formatCurrency(totalBookingRevenue)}</span>
                    <span className="text-xs text-zinc-500 block mt-1">From all confirmed reservations</span>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-surface-1 border border-zinc-800 flex flex-col justify-between shadow-lg">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Staff Expenses</span>
                  <div className="mt-2">
                    <span className="text-3xl font-black text-rose-400">{formatCurrency(totalStaffExpenses)}</span>
                    <span className="text-xs text-zinc-500 block mt-1">Salaries, advances, bonuses</span>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-surface-1 border border-brand-500/30 bg-gradient-to-br from-brand-950/20 to-surface-1 flex flex-col justify-between shadow-lg">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Net Profit</span>
                  <div className="mt-2">
                    <span className={`text-3xl font-black ${netProfit >= 0 ? 'text-brand-300' : 'text-rose-400'}`}>
                      {formatCurrency(netProfit)}
                    </span>
                    <span className="text-xs text-zinc-500 block mt-1">Income minus Staff Expenses</span>
                  </div>
                </div>
              </div>

              {/* Recent Bookings Snapshot */}
              <div className="p-6 rounded-3xl bg-surface-1 border border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white">Recent Guest Bookings</h3>
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className="text-xs font-semibold text-brand-400 hover:text-brand-300"
                  >
                    View All ({bookings.length}) →
                  </button>
                </div>

                {bookings.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">No bookings recorded yet.</p>
                ) : (
                  <div className="divide-y divide-zinc-800/80">
                    {bookings.slice(0, 5).map((b) => (
                      <div key={b.id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-white block">{b.guest_name}</span>
                          <span className="text-zinc-500">
                            Room {b.room_number || 'N/A'} • {formatDate(b.check_in_date)} to {formatDate(b.check_out_date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-white">{formatCurrency(b.total_amount)}</span>
                          <StatusBadge status={b.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════ TAB 2: ROOM MANAGEMENT (FULL MODIFY CAPABILITY) ══════════ */}
          {activeTab === 'rooms' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">All Property Rooms</h2>
                  <p className="text-xs text-zinc-400">
                    Modify room numbers, room types, pricing, status, and facilities as needed.
                  </p>
                </div>
                <button
                  onClick={openCreateRoomModal}
                  className="px-4 py-2 text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <span>➕</span> Add Room
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => {
                  const facilities = Array.isArray(room.facilities) ? room.facilities : [];
                  const imageUrl = room.image_urls?.[0] || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80';

                  return (
                    <div
                      key={room.id}
                      className="bg-surface-1 border border-zinc-800 rounded-3xl overflow-hidden shadow-lg flex flex-col justify-between"
                    >
                      <div>
                        {/* Room Cover */}
                        <div className="relative aspect-[16/10] bg-zinc-900">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imageUrl} alt={room.room_number} className="w-full h-full object-cover" />
                          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                            <span className="px-3 py-1 bg-surface-0/90 text-white text-xs font-black rounded-xl border border-zinc-700">
                              Room {room.room_number}
                            </span>
                            <StatusBadge status={room.current_status} />
                          </div>
                        </div>

                        {/* Room Details */}
                        <div className="p-5">
                          <div className="flex items-baseline justify-between mb-2">
                            <h3 className="text-base font-bold text-white">{room.type}</h3>
                            <span className="text-lg font-black text-brand-400">
                              {formatCurrency(room.base_price)}
                            </span>
                          </div>

                          {/* Facilities */}
                          <div className="flex flex-wrap gap-1 mt-3">
                            {facilities.map((fac, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 text-[10px] font-semibold bg-surface-2 text-zinc-400 rounded-md border border-zinc-800"
                              >
                                {fac}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons: Modify Everything */}
                      <div className="p-5 pt-0 flex items-center gap-2">
                        <button
                          onClick={() => openEditRoomModal(room)}
                          className="flex-1 py-2 text-xs font-bold text-white bg-surface-2 hover:bg-surface-3 rounded-xl border border-zinc-700 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <span>✏️</span> Edit Details
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ open: true, roomId: room.id })}
                          className="p-2 text-xs font-bold text-rose-400 hover:text-white bg-rose-950/30 hover:bg-rose-900/60 rounded-xl border border-rose-900 transition-colors"
                          title="Delete Room"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════ TAB 3: BOOKINGS ══════════ */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">All Guest Bookings</h2>
                  <p className="text-xs text-zinc-400">
                    Manage guest reservations, perform check-ins and free up rooms upon check-out.
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-surface-1 border border-zinc-800 text-zinc-400">
                  Total: {bookings.length}
                </span>
              </div>

              <div className="bg-surface-1 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-2 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-4">Guest Info</th>
                        <th className="p-4">Room #</th>
                        <th className="p-4">Dates</th>
                        <th className="p-4">Source</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/80">
                      {bookings.map((b) => (
                        <tr key={b.id} className="hover:bg-surface-2/40 transition-colors">
                          <td className="p-4">
                            <span className="font-bold text-white block">{b.guest_name}</span>
                            <span className="text-zinc-500">{b.guest_phone || 'No phone'}</span>
                          </td>
                          <td className="p-4 font-black text-brand-300">
                            {b.room_number || 'Room N/A'}
                          </td>
                          <td className="p-4 text-zinc-400">
                            {formatDate(b.check_in_date)} → {formatDate(b.check_out_date)}
                          </td>
                          <td className="p-4 uppercase text-[10px] text-zinc-400 font-bold">
                            {b.booking_source}
                          </td>
                          <td className="p-4 font-black text-white">
                            {formatCurrency(b.total_amount)}
                          </td>
                          <td className="p-4">
                            <StatusBadge status={b.status} />
                          </td>
                          <td className="p-4 text-right space-x-2">
                            {b.status === 'confirmed' && (
                              <button
                                onClick={() => handleUpdateBookingStatus(b.id, 'checked_in')}
                                className="px-2.5 py-1 text-[11px] font-bold bg-sky-600/30 hover:bg-sky-600 text-sky-200 rounded-lg border border-sky-500/40 transition-all"
                              >
                                Check In
                              </button>
                            )}
                            {b.status !== 'checked_out' && b.status !== 'cancelled' && (
                              <button
                                onClick={() => handleUpdateBookingStatus(b.id, 'checked_out')}
                                className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 rounded-lg border border-emerald-500/40 transition-all"
                              >
                                Check Out (Free Room)
                              </button>
                            )}
                            {b.status !== 'cancelled' && b.status !== 'checked_out' && (
                              <button
                                onClick={() => handleUpdateBookingStatus(b.id, 'cancelled')}
                                className="px-2.5 py-1 text-[11px] font-bold bg-rose-600/30 hover:bg-rose-600 text-rose-200 rounded-lg border border-rose-500/40 transition-all"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════ TAB 4: FINANCIAL TRACKING + STAFF EXPENSES ══════════ */}
          {activeTab === 'finance' && (
            <div className="space-y-6">
              {/* Financial KPI Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-surface-1 border border-zinc-800 shadow-xl">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    🟢 Room Bookings Revenue
                  </span>
                  <div className="mt-2">
                    <span className="text-3xl font-black text-white">
                      {formatCurrency(totalBookingRevenue)}
                    </span>
                    <p className="text-xs text-zinc-500 mt-1">Total calculated from active guest stays</p>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-surface-1 border border-zinc-800 shadow-xl">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                    🔴 Staff Related Money / Expenses
                  </span>
                  <div className="mt-2">
                    <span className="text-3xl font-black text-white">
                      {formatCurrency(totalStaffExpenses)}
                    </span>
                    <p className="text-xs text-zinc-500 mt-1">Staff salaries, daily advances, and bonuses</p>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-surface-1 border border-brand-500/40 shadow-xl bg-gradient-to-br from-brand-950/20 to-surface-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
                    💎 Net Hotel Profit
                  </span>
                  <div className="mt-2">
                    <span className="text-3xl font-black text-emerald-400">
                      {formatCurrency(netProfit)}
                    </span>
                    <p className="text-xs text-zinc-500 mt-1">Room Revenue minus Staff Expenses</p>
                  </div>
                </div>
              </div>

              {/* Staff Money Management & Expenses Table */}
              <div className="p-6 rounded-3xl bg-surface-1 border border-zinc-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">Staff Expenses Log</h3>
                    <p className="text-xs text-zinc-400">
                      Track salary distributions, meal allowances, and staff advances.
                    </p>
                  </div>
                  <button
                    onClick={() => setExpenseModal({ open: true })}
                    className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"
                  >
                    <span>💸</span> Add Expense Record
                  </button>
                </div>

                {expenses.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">
                    No staff expenses recorded yet. Click &quot;Add Expense Record&quot; to log staff payments.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-2 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
                        <tr>
                          <th className="p-3">Staff Member</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Expense Date</th>
                          <th className="p-3">Notes</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/80">
                        {expenses.map((exp) => (
                          <tr key={exp.id} className="hover:bg-surface-2/40 transition-colors">
                            <td className="p-3 font-bold text-white">{exp.staff_name}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-surface-2 border border-zinc-700 text-zinc-300">
                                {exp.category}
                              </span>
                            </td>
                            <td className="p-3 text-zinc-400">{formatDate(exp.expense_date)}</td>
                            <td className="p-3 text-zinc-400">{exp.notes || '—'}</td>
                            <td className="p-3 font-black text-rose-400">{formatCurrency(exp.amount)}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="text-zinc-500 hover:text-rose-400 p-1"
                                title="Delete Record"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════ TAB 5: STAFF MANAGEMENT ══════════ */}
          {activeTab === 'staff' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Staff Roster &amp; Monthly Payroll</h2>
                  <p className="text-xs text-zinc-400">
                    Manage hotel staff members, contact info, monthly salaries, and payment statuses.
                  </p>
                </div>
                <button
                  onClick={() => setStaffModal({ open: true })}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <span>➕</span> Add Staff Member
                </button>
              </div>

              {staff.length === 0 ? (
                <div className="p-12 text-center bg-surface-1 border border-zinc-800 rounded-3xl">
                  <span className="text-3xl block mb-2">👥</span>
                  <p className="text-sm font-bold text-white">No staff members registered</p>
                  <p className="text-xs text-zinc-500 mt-1">Add your hotel receptionists, cleaners, and drivers.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {staff.map((s) => (
                    <div
                      key={s.id}
                      className="p-5 rounded-3xl bg-surface-1 border border-zinc-800 shadow-xl flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="w-9 h-9 rounded-xl bg-surface-2 border border-zinc-700 flex items-center justify-center font-bold text-white">
                            {s.name?.charAt(0) || 'S'}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${
                              s.salary_paid
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            }`}
                          >
                            {s.salary_paid ? 'Salary Paid' : 'Pending Salary'}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-white">{s.name}</h3>
                        <p className="text-xs text-brand-400 font-semibold">{s.role}</p>
                        <p className="text-xs text-zinc-500 mt-1">📞 {s.phone || 'No phone'}</p>

                        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-baseline justify-between">
                          <span className="text-xs text-zinc-400">Monthly Base Salary</span>
                          <span className="text-base font-black text-white">{formatCurrency(s.salary)}</span>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-zinc-800/80 flex items-center gap-2">
                        <button
                          onClick={() => handleToggleSalaryPaid(s)}
                          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${
                            s.salary_paid
                              ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          {s.salary_paid ? 'Mark Unpaid' : 'Mark Salary Paid'}
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(s.id)}
                          className="p-2 text-xs text-rose-400 hover:text-white bg-rose-950/30 hover:bg-rose-900 rounded-xl border border-rose-900"
                          title="Delete Staff"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ─── MODAL: CREATE / EDIT ROOM (MODIFY EVERYTHING) ─── */}
      {roomModal.open && (
        <Modal
          title={roomModal.mode === 'create' ? 'Add New Room' : 'Edit Room Details'}
          onClose={() => setRoomModal({ open: false, mode: 'create', room: null })}
        >
          <form onSubmit={handleSaveRoom} className="space-y-4">
            <Field label="Room Number">
              <input
                type="text"
                required
                placeholder="e.g. 105 or 301"
                value={roomForm.room_number}
                onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-zinc-700 text-white text-sm focus:border-brand-500 focus:outline-none"
              />
            </Field>

            <Field label="Room Type / Category">
              <input
                type="text"
                required
                placeholder="e.g. Executive Transit Suite"
                value={roomForm.type}
                onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-zinc-700 text-white text-sm focus:border-brand-500 focus:outline-none"
              />
            </Field>

            <Field label="Base Price (BDT / night)">
              <input
                type="number"
                required
                min="0"
                step="50"
                placeholder="2500"
                value={roomForm.base_price}
                onChange={(e) => setRoomForm({ ...roomForm, base_price: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-zinc-700 text-white text-sm focus:border-brand-500 focus:outline-none"
              />
            </Field>

            <Field label="Current Status">
              <select
                value={roomForm.current_status}
                onChange={(e) => setRoomForm({ ...roomForm, current_status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-zinc-700 text-white text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="available">Available (Vacant)</option>
                <option value="occupied">Occupied (Guest In Room)</option>
                <option value="maintenance">Under Maintenance / Housekeeping</option>
              </select>
            </Field>

            <Field label="Room Image URL (Unsplash or direct image link)">
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                value={roomForm.image_url}
                onChange={(e) => setRoomForm({ ...roomForm, image_url: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-zinc-700 text-white text-sm focus:border-brand-500 focus:outline-none"
              />
            </Field>

            <Field label="Facilities & Comforts (Comma-separated)">
              <input
                type="text"
                placeholder="AC, King Bed, Free Wi-Fi, Geyser, TV"
                value={roomForm.facilities}
                onChange={(e) => setRoomForm({ ...roomForm, facilities: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-zinc-700 text-white text-sm focus:border-brand-500 focus:outline-none"
              />
            </Field>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setRoomModal({ open: false, mode: 'create', room: null })}
                className="flex-1 py-2.5 text-xs font-bold bg-surface-2 hover:bg-surface-3 text-zinc-300 rounded-xl border border-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-lg transition-all"
              >
                {roomModal.mode === 'create' ? 'Save Room' : 'Apply Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MODAL: DELETE ROOM CONFIRMATION ─── */}
      {deleteConfirm.open && (
        <Modal title="Delete Room" onClose={() => setDeleteConfirm({ open: false, roomId: null })}>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Are you sure you want to permanently delete this room? This cannot be undone.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={() => setDeleteConfirm({ open: false, roomId: null })}
              className="flex-1 py-2.5 text-xs font-bold bg-surface-2 text-zinc-300 rounded-xl border border-zinc-700"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteRoom}
              className="flex-1 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg"
            >
              Confirm Delete
            </button>
          </div>
        </Modal>
      )}

      {/* ─── MODAL: ADD STAFF ─── */}
      {staffModal.open && (
        <Modal title="Add Staff Member" onClose={() => setStaffModal({ open: false })}>
          <form onSubmit={handleCreateStaff} className="space-y-4">
            <Field label="Staff Full Name">
              <input
                type="text"
                required
                placeholder="e.g. Kamal Hossain"
                value={staffForm.name}
                onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-zinc-700 text-white text-sm focus:border-brand-500 focus:outline-none"
              />
            </Field>

            <Field label="Role / Designation">
              <input
                type="text"
                required
                placeholder="e.g. Front Desk Officer, Night Duty Manager, Cleaner"
                value={staffForm.role}
                onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-zinc-700 text-white text-sm focus:border-brand-500 focus:outline-none"
              />
            </Field>

            <Field label="Phone Contact">
              <input
                type="text"
                placeholder="+880 1700-000000"
                value={staffForm.phone}
                onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-zinc-700 text-white text-sm focus:border-brand-500 focus:outline-none"
              />
            </Field>

            <Field label="Monthly Base Salary (BDT)">
              <input
                type="number"
                required
                min="0"
                step="500"
                placeholder="20000"
                value={staffForm.salary}
                onChange={(e) => setStaffForm({ ...staffForm, salary: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-zinc-700 text-white text-sm focus:border-brand-500 focus:outline-none"
              />
            </Field>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setStaffModal({ open: false })}
                className="flex-1 py-2.5 text-xs font-bold bg-surface-2 text-zinc-300 rounded-xl border border-zinc-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg"
              >
                Register Staff
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MODAL: ADD STAFF EXPENSE ─── */}
      {expenseModal.open && (
        <Modal title="Record Staff Expense" onClose={() => setExpenseModal({ open: false })}>
          <form onSubmit={handleCreateExpense} className="space-y-4">
            <Field label="Staff Member / Recipient Name">
              <input
                type="text"
                required
                placeholder="e.g. Rafiqul Islam"
                value={expenseForm.staff_name}
                onChange={(e) => setExpenseForm({ ...expenseForm, staff_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-zinc-700 text-white text-sm focus:border-brand-500 focus:outline-none"
              />
            </Field>

            <Field label="Expense Category">
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-zinc-700 text-white text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="salary">Monthly Salary Payment</option>
                <option value="advance">Salary Advance</option>
                <option value="bonus">Bonus / Festival Allowance</option>
                <option value="meals">Staff Meals &amp; Allowance</option>
                <option value="other">Other Operational Expense</option>
              </select>
            </Field>

            <Field label="Amount (BDT)">
              <input
                type="number"
                required
                min="0"
                placeholder="5000"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-zinc-700 text-white text-sm focus:border-brand-500 focus:outline-none"
              />
            </Field>

            <Field label="Expense Date">
              <input
                type="date"
                required
                value={expenseForm.expense_date}
                onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-zinc-700 text-white text-sm focus:border-brand-500 focus:outline-none"
              />
            </Field>

            <Field label="Notes / Reason (Optional)">
              <input
                type="text"
                placeholder="e.g. Advance for medical expense"
                value={expenseForm.notes}
                onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-zinc-700 text-white text-sm focus:border-brand-500 focus:outline-none"
              />
            </Field>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setExpenseModal({ open: false })}
                className="flex-1 py-2.5 text-xs font-bold bg-surface-2 text-zinc-300 rounded-xl border border-zinc-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg"
              >
                Save Expense Record
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default function OwnerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
            <span className="text-xs text-zinc-500 font-medium">Loading Owner Dashboard...</span>
          </div>
        </div>
      }
    >
      <OwnerDashboardContent />
    </Suspense>
  );
}
