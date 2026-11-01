'use client';

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, todayISO, tomorrowISO, calculateNights } from '@/lib/utils';
import { useHotelStore } from '@/lib/store';
import {
  LayoutDashboard,
  BedDouble,
  CalendarCheck,
  DollarSign,
  Users,
  LogOut,
  ExternalLink,
  Plus,
  RefreshCw,
  Sun,
  Moon,
  MapPin,
  Phone,
  MessageSquare,
  Check,
  AlertCircle,
  Trash2,
  Edit3,
  Clock,
  CreditCard,
  Building2,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Car,
  Globe,
  TrendingUp,
  Receipt,
  Plane,
  ShieldCheck,
  Search,
  Printer,
  UserCheck,
  Sparkles,
  KeyRound,
  FileText,
  BadgeCheck,
} from 'lucide-react';

// Preset sample photos for easy hotel & room creation
const SAMPLE_HOTEL_COVERS = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
];

const SAMPLE_ROOM_PHOTOS = [
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
];

const PRESET_AMENITIES = [
  'Free 24/7 Airport Shuttle',
  'Air Conditioning',
  'Free High-Speed Wi-Fi',
  '24/7 Generator Backup',
  'Geyser / Hot Water',
  'Elevator / Lift',
  'CCTV Security',
  'Room Service',
  'Airport Wake-up Service',
  'Complimentary Breakfast',
];

// ─── Trustworthy PMS Status Badge ───────────────────────────────────────────
function RoomStatusBadge({ status, isBn = false }) {
  const map = {
    available: {
      text: isBn ? 'খালি / প্রস্তুত' : 'Vacant & Ready',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      dot: 'bg-emerald-500',
    },
    occupied: {
      text: isBn ? 'গেস্ট আছে' : 'Occupied',
      className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      dot: 'bg-amber-500',
    },
    maintenance: {
      text: isBn ? 'হাউসকিপিং / মেরামত' : 'Housekeeping',
      className: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
      dot: 'bg-slate-400',
    },
  };

  const current = map[status] || map.available;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${current.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      <span>{current.text}</span>
    </span>
  );
}

function BookingStatusBadge({ status, isBn = false }) {
  const map = {
    confirmed: {
      text: isBn ? 'কনফার্মড' : 'Confirmed',
      className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
      dot: 'bg-blue-500',
    },
    checked_in: {
      text: isBn ? 'চেক-ইন আছে' : 'Checked In',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      dot: 'bg-emerald-500',
    },
    checked_out: {
      text: isBn ? 'চেক-আউট সম্পন্ন' : 'Checked Out',
      className: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
      dot: 'bg-slate-400',
    },
    cancelled: {
      text: isBn ? 'বাতিল' : 'Cancelled',
      className: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      dot: 'bg-rose-500',
    },
    pending: {
      text: isBn ? 'অপেক্ষমাণ' : 'Pending',
      className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      dot: 'bg-amber-500',
    },
  };

  const current = map[status] || map.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border capitalize ${current.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      <span>{current.text}</span>
    </span>
  );
}

// ─── Modal Wrapper Component ─────────────────────────────────────────────────
function Modal({ title, onClose, children, maxWidth = 'max-w-lg' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className={`relative w-full ${maxWidth} bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl max-h-[92vh] overflow-y-auto my-6 text-slate-900 dark:text-white`}>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-zinc-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{title}</span>
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block">{label}</label>
        {hint && <span className="text-[11px] text-slate-500 dark:text-zinc-500">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

// ─── Property Registration Wizard (when owner has no hotel yet) ──────────────
function PropertyOnboarding({ onHotelCreated, isBn }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    address: '',
    location_url: '',
    cover_image_url: SAMPLE_HOTEL_COVERS[0],
    phone: '',
    whatsapp: '',
    shuttle_available: true,
    amenities: ['Free 24/7 Airport Shuttle', 'Air Conditioning', 'Free High-Speed Wi-Fi', '24/7 Generator Backup'],
  });

  const toggleAmenity = (amenity) => {
    setForm((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Please provide a property title or hotel name.');
      return;
    }
    if (!form.description.trim()) {
      setError('Please provide a property description for transit guests.');
      return;
    }
    if (!form.address.trim()) {
      setError('Please provide the physical address in the airport transit zone.');
      return;
    }
    if (!form.phone.trim()) {
      setError('Please provide the reception front desk phone number.');
      return;
    }
    if (!form.whatsapp.trim()) {
      setError('Please provide a WhatsApp contact number for guest messaging.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: form.title.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        address: form.address.trim(),
        location_url: form.location_url.trim() || null,
        cover_image_url: form.cover_image_url.trim() || SAMPLE_HOTEL_COVERS[0],
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim(),
        amenities: form.amenities,
        shuttle_available: form.shuttle_available,
      };

      const res = await api.post('/hotels', payload);
      onHotelCreated(res.data);
    } catch (err) {
      console.error('Failed to create hotel:', err);
      setError(err.message || 'Failed to register property. Please verify the information.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-10 shadow-sm relative">
        <div className="border-b border-slate-100 dark:border-zinc-800 pb-5 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Property Registration Wizard</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {isBn ? 'আপনার হোটেল নিবন্ধন করুন' : 'Register Your Transit Hotel Property'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            {isBn
              ? 'হোটেলের নাম, বিবরণ, লোকেশন, ছবি ও যোগাযোগ নম্বর দিয়ে প্রোফাইল সম্পন্ন করুন।'
              : 'Complete your hotel profile to start accepting online transit flight reservations and managing front desk walk-ins.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <Field label={isBn ? 'হোটেলের নাম / শিরোনাম *' : 'Hotel Name / Property Title *'}>
              <input
                type="text"
                required
                placeholder="e.g. Airport Skyline Transit Inn"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs focus:border-blue-600 focus:outline-none"
              />
            </Field>

            <Field label={isBn ? 'হোটেলের পূর্ণ বিবরণ *' : 'Property Overview & Amenities Description *'}>
              <textarea
                required
                rows={3}
                placeholder="Describe your location advantage near Hazrat Shahjalal Airport (DAC), soundproof rooms, cleanliness, and transit guest hospitality..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs focus:border-blue-600 focus:outline-none"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={isBn ? 'হোটেলের ঠিকানা *' : 'Physical Address *'}>
              <input
                type="text"
                required
                placeholder="e.g. Haji Camp Road, Ashkona, Uttara, Dhaka"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs focus:border-blue-600 focus:outline-none"
              />
            </Field>

            <Field label={isBn ? 'গুগল ম্যাপ লোকেশন লিংক' : 'Google Maps GPS URL (Optional)'}>
              <input
                type="url"
                placeholder="https://maps.google.com/?q=..."
                value={form.location_url}
                onChange={(e) => setForm({ ...form, location_url: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs focus:border-blue-600 focus:outline-none"
              />
            </Field>
          </div>

          <div>
            <Field
              label={isBn ? 'কভার ছবির লিংক *' : 'Cover Photo URL *'}
              hint="Select a sample photo below or paste a custom photo URL"
            >
              <input
                type="url"
                required
                placeholder="https://images.unsplash.com/photo-..."
                value={form.cover_image_url}
                onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs focus:border-blue-600 focus:outline-none mb-2"
              />
            </Field>

            <div className="flex items-center gap-2.5">
              {SAMPLE_HOTEL_COVERS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setForm({ ...form, cover_image_url: sample })}
                  className={`relative w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                    form.cover_image_url === sample
                      ? 'border-blue-600 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-zinc-700 opacity-60 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sample} alt={`Sample ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={isBn ? 'রিসেপশন ফোন নম্বর *' : 'Reception Desk Contact Phone *'}>
              <input
                type="tel"
                required
                placeholder="+880 1711-000000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs focus:border-blue-600 focus:outline-none"
              />
            </Field>

            <Field label={isBn ? 'সরাসরি হোয়াটসঅ্যাপ নম্বর *' : 'Direct WhatsApp Number *'}>
              <input
                type="tel"
                required
                placeholder="+880 1711-000000"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs focus:border-blue-600 focus:outline-none"
              />
            </Field>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-2">
              Services &amp; Special Facilities
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_AMENITIES.map((amenity) => {
                const selected = form.amenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                      selected
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300'
                        : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    {selected ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Plus className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{amenity}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Car className="w-4 h-4 text-blue-600" />
                <span>Complimentary 24/7 Airport Terminal Shuttle Service</span>
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 block mt-0.5">
                Increases booking conversion significantly for flight transit travelers.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, shuttle_available: !form.shuttle_available })}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                form.shuttle_available ? 'bg-blue-600' : 'bg-slate-300 dark:bg-zinc-600'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  form.shuttle_available ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? 'Registering Property...' : 'Save & Open Front Desk Extranet →'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Owner Extranet Dashboard Component ─────────────────────────────────
function OwnerDashboardContent() {
  const router = useRouter();
  const { theme, toggleTheme, setTheme, lang, toggleLang } = useHotelStore();
  const isBn = lang === 'bn';

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

  // PMS Tabs: 'overview' | 'bookings' | 'rooms' | 'finance' | 'staff'
  const [activeTab, setActiveTab] = useState('overview');
  const [bookingFilter, setBookingFilter] = useState('all'); // 'all' | 'online' | 'walk_in'
  const [roomFilter, setRoomFilter] = useState('all'); // 'all' | 'available' | 'occupied'

  // Modals state
  const [roomModal, setRoomModal] = useState({ open: false, mode: 'create', room: null });
  const [walkInModal, setWalkInModal] = useState(false);
  const [voucherModal, setVoucherModal] = useState({ open: false, booking: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, roomId: null });
  const [staffModal, setStaffModal] = useState({ open: false });
  const [expenseModal, setExpenseModal] = useState({ open: false });

  // Room Form State with Advance Payment Policy
  const [roomForm, setRoomForm] = useState({
    room_number: '',
    type: 'Executive Transit Room',
    base_price: '2800',
    current_status: 'available',
    image_urls: SAMPLE_ROOM_PHOTOS.slice(0, 3).join(', '),
    facilities: 'AC, Queen Bed, Free High-Speed Wi-Fi, Attached Bath, Airport View, Geyser',
    requires_advance: false,
    advance_amount: '500',
  });

  // Front-Desk Walk-In Check-In Form State
  const [walkInForm, setWalkInForm] = useState({
    room_id: '',
    guest_name: '',
    guest_phone: '',
    guest_id_number: '',
    check_in_date: todayISO(),
    check_out_date: tomorrowISO(),
    advance_paid: '0',
    payment_method: 'cash',
    notes: '',
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
    expense_date: todayISO(),
    notes: '',
  });

  const [notification, setNotification] = useState(null);
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Auth Guard
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

  const [refreshIndex, setRefreshIndex] = useState(0);
  const fetchData = useCallback(() => {
    setLoading(true);
    setRefreshIndex((i) => i + 1);
  }, []);

  // Fetch Owner Hotel & Property Data
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        let ownerHotel = null;
        try {
          const hRes = await api.get('/hotels/owner/me');
          if (isMounted && hRes?.data) {
            ownerHotel = hRes.data;
          }
        } catch (e) {
          console.warn('Could not load owner hotel:', e.message);
        }

        if (!isMounted) return;
        setHotel(ownerHotel);

        if (ownerHotel) {
          const hotelId = ownerHotel.id;

          try {
            const rRes = await api.get(`/rooms/hotel/${hotelId}`);
            if (isMounted && rRes?.data) setRooms(rRes.data);
          } catch (e) {}

          try {
            const bRes = await api.get(`/bookings/hotel/${hotelId}`);
            if (isMounted && bRes?.data) setBookings(bRes.data);
          } catch (e) {}

          try {
            const sRes = await api.get(`/staff/hotel/${hotelId}`);
            if (isMounted && sRes?.data) setStaff(sRes.data);
          } catch (e) {}

          try {
            const expRes = await api.get(`/staff/expenses/hotel/${hotelId}`);
            if (isMounted && expRes?.data) setExpenses(expRes.data);
          } catch (e) {}
        }
      } catch (err) {
        console.error('Failed to load owner data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [refreshIndex]);

  const handleSignOut = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}
    localStorage.removeItem('hotel_user');
    localStorage.removeItem('token');
    document.cookie = 'demo_role=; path=/; max-age=0';
    document.cookie = 'token=; path=/; max-age=0';
    router.push('/login');
  };

  // ─── Room Handlers ─────────────────────────────────────────────────────────
  const openCreateRoomModal = () => {
    setRoomForm({
      room_number: '',
      type: 'Executive Transit Room',
      base_price: '2800',
      current_status: 'available',
      image_urls: SAMPLE_ROOM_PHOTOS.slice(0, 3).join(', '),
      facilities: 'AC, Queen Bed, Free Wi-Fi, Attached Bath, Airport View, Geyser',
      requires_advance: false,
      advance_amount: '500',
    });
    setRoomModal({ open: true, mode: 'create', room: null });
  };

  const openEditRoomModal = (room) => {
    const imgUrls = Array.isArray(room.image_urls)
      ? room.image_urls.join(', ')
      : room.image_urls || '';
    const facilitiesStr = Array.isArray(room.facilities)
      ? room.facilities.join(', ')
      : room.facilities || '';

    setRoomForm({
      room_number: room.room_number || '',
      type: room.type || 'Standard',
      base_price: String(room.base_price || room.price || ''),
      current_status: room.current_status || 'available',
      image_urls: imgUrls,
      facilities: facilitiesStr,
      requires_advance: Boolean(room.requires_advance),
      advance_amount: String(room.advance_amount || 0),
    });
    setRoomModal({ open: true, mode: 'edit', room });
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    if (!hotel) return;

    const facilitiesArray = roomForm.facilities
      ? roomForm.facilities.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const imageUrlsArray = roomForm.image_urls
      ? roomForm.image_urls.split(',').map((u) => u.trim()).filter(Boolean)
      : [];

    const payload = {
      hotel_id: hotel.id,
      room_number: roomForm.room_number.trim(),
      type: roomForm.type.trim(),
      base_price: parseFloat(roomForm.base_price) || 0,
      price: parseFloat(roomForm.base_price) || 0,
      current_status: roomForm.current_status,
      facilities: facilitiesArray,
      image_urls: imageUrlsArray.length > 0 ? imageUrlsArray : SAMPLE_ROOM_PHOTOS.slice(0, 2),
      requires_advance: Boolean(roomForm.requires_advance),
      advance_amount: roomForm.requires_advance ? parseFloat(roomForm.advance_amount) || 0 : 0,
    };

    try {
      if (roomModal.mode === 'create') {
        const res = await api.post('/rooms', payload);
        showToast(`Room ${res.data.room_number} added successfully!`);
      } else {
        const res = await api.patch(`/rooms/${roomModal.room.id}`, payload);
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
      showToast('Room removed from inventory');
      setDeleteConfirm({ open: false, roomId: null });
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to delete room', 'error');
    }
  };

  // ─── Front-Desk Walk-In Check-In Handler ───────────────────────────────────
  const openWalkInModal = (presetRoomId = null) => {
    const targetRoomId = presetRoomId || rooms.find((r) => r.current_status === 'available')?.id || '';
    setWalkInForm({
      room_id: targetRoomId,
      guest_name: '',
      guest_phone: '',
      guest_id_number: '',
      check_in_date: todayISO(),
      check_out_date: tomorrowISO(),
      advance_paid: '0',
      payment_method: 'cash',
      notes: '',
    });
    setWalkInModal(true);
  };

  const handleSaveWalkIn = async (e) => {
    e.preventDefault();
    if (!walkInForm.room_id) {
      showToast('Please select an available room for check-in.', 'error');
      return;
    }
    if (!walkInForm.guest_name.trim()) {
      showToast('Guest full name is required.', 'error');
      return;
    }

    const selectedRoom = rooms.find((r) => r.id === walkInForm.room_id);
    const roomPrice = Number(selectedRoom?.price || selectedRoom?.base_price || 0);
    const nights = Math.max(1, calculateNights(walkInForm.check_in_date, walkInForm.check_out_date));
    const totalAmount = nights * roomPrice;

    try {
      const payload = {
        hotelId: hotel.id,
        roomId: walkInForm.room_id,
        guestName: walkInForm.guest_name.trim(),
        guestPhone: walkInForm.guest_phone.trim() || 'Walk-in Guest',
        checkInDate: walkInForm.check_in_date,
        checkOutDate: walkInForm.check_out_date,
        bookingSource: 'walk_in',
        totalAmount,
        advanceRequired: false,
        advancePaid: parseFloat(walkInForm.advance_paid) || 0,
      };

      await api.post('/bookings', payload);
      await api.patch(`/rooms/${walkInForm.room_id}/status`, { current_status: 'occupied' });

      showToast(`Walk-in guest ${payload.guestName} checked into Room ${selectedRoom?.room_number}!`);
      setWalkInModal(false);
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to complete walk-in check-in', 'error');
    }
  };

  // ─── Booking Status Actions ────────────────────────────────────────────────
  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status: newStatus });
      showToast(`Reservation status updated to ${newStatus}`);
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to update reservation status', 'error');
    }
  };

  // ─── Staff Handlers ────────────────────────────────────────────────────────
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      await api.post('/staff', {
        hotel_id: hotel.id,
        name: staffForm.name,
        role: staffForm.role,
        phone: staffForm.phone,
        salary: parseFloat(staffForm.salary) || 0,
      });
      showToast(`Staff member "${staffForm.name}" registered!`);
      setStaffModal({ open: false });
      setStaffForm({ name: '', role: 'Front Desk Receptionist', phone: '', salary: '' });
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to register staff', 'error');
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
      showToast('Staff member removed');
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to remove staff', 'error');
    }
  };

  // ─── Expense Handlers ──────────────────────────────────────────────────────
  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post('/staff/expenses', {
        hotel_id: hotel.id,
        staff_name: expenseForm.staff_name,
        category: expenseForm.category,
        amount: parseFloat(expenseForm.amount) || 0,
        expense_date: expenseForm.expense_date,
        notes: expenseForm.notes,
      });
      showToast('Expense voucher recorded!');
      setExpenseModal({ open: false });
      setExpenseForm({ staff_name: '', category: 'salary', amount: '', expense_date: todayISO(), notes: '' });
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to record expense voucher', 'error');
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await api.delete(`/staff/expenses/${id}`);
      showToast('Expense record deleted');
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to delete expense record', 'error');
    }
  };

  // ─── Filtered Bookings & Rooms ─────────────────────────────────────────────
  const filteredBookings = useMemo(() => {
    if (bookingFilter === 'online') {
      return bookings.filter((b) => b.booking_source === 'online' || b.booking_source === 'online_booking' || b.booking_source === 'online_b2c');
    }
    if (bookingFilter === 'walk_in') {
      return bookings.filter((b) => b.booking_source === 'walk_in');
    }
    return bookings;
  }, [bookings, bookingFilter]);

  const onlineBookingsCount = bookings.filter((b) => b.booking_source === 'online' || b.booking_source === 'online_booking' || b.booking_source === 'online_b2c').length;
  const walkInBookingsCount = bookings.filter((b) => b.booking_source === 'walk_in').length;

  const filteredRooms = useMemo(() => {
    if (roomFilter === 'available') return rooms.filter((r) => r.current_status === 'available');
    if (roomFilter === 'occupied') return rooms.filter((r) => r.current_status === 'occupied');
    return rooms;
  }, [rooms, roomFilter]);

  // Operational Metrics
  const totalRooms = rooms.length;
  const availableRooms = rooms.filter((r) => r.current_status === 'available').length;
  const occupiedRooms = rooms.filter((r) => r.current_status === 'occupied').length;
  const occupancyPercentage = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const totalBookingRevenue = bookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);

  const totalStaffExpenses = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
  const netOperatingProfit = totalBookingRevenue - totalStaffExpenses;

  // ─── GATEKEEPER CHECK: If owner does not have a hotel yet, render Onboarding
  if (!loading && !hotel) {
    return (
      <PropertyOnboarding
        onHotelCreated={(createdHotel) => {
          showToast('Property registered successfully! Welcome to your Front Desk Extranet.');
          setHotel(createdHotel);
          fetchData();
        }}
        isBn={isBn}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md animate-slide-up flex items-center gap-2.5 ${
            notification.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              : 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span className="text-xs font-semibold">{notification.message}</span>
        </div>
      )}

      {/* ─── Top Enterprise Navbar ─── */}
      <header className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand & Property Title */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                HK
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Hotel Khuji</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 uppercase tracking-wide">
                    Extranet PMS
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 block leading-tight">
                  Front Desk &amp; Property Management
                </span>
              </div>
            </Link>

            {/* Vertical Divider */}
            <div className="h-6 w-px bg-slate-200 dark:bg-zinc-800 hidden md:block" />

            {/* Active Property Status */}
            <div className="hidden md:flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">{hotel?.name}</span>
                  <BadgeCheck className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">PID: HK-8801 • DAC Transit Zone</span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Manager Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Primary Action: Walk-in Check-In */}
            <button
              onClick={() => openWalkInModal()}
              className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>{isBn ? 'ওয়াক-ইন চেক-ইন' : 'Walk-In Check-In'}</span>
            </button>

            {/* Secondary: Add Room */}
            <button
              onClick={openCreateRoomModal}
              className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition-colors hidden sm:flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isBn ? 'রুম যোগ করুন' : 'Add Room'}</span>
            </button>

            {/* View Guest Live Page */}
            {hotel && (
              <Link
                href={`/hotel/${hotel.id}`}
                target="_blank"
                className="p-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 text-xs transition-colors"
                title="Open Live Guest Booking Page"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
            )}

            {/* Refresh Button */}
            <button
              onClick={fetchData}
              className="p-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 text-xs transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* Language & Theme Controls */}
            <button
              onClick={toggleLang}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50"
            >
              {isBn ? 'EN' : 'বাংলা'}
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-50"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'day' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className="p-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-zinc-300 hover:text-rose-600 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── Main Dashboard Body ─── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 1. Property Banner & Flight Sync Status Bar */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 shrink-0 bg-slate-100 dark:bg-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hotel?.cover_image_url || SAMPLE_HOTEL_COVERS[0]}
                alt={hotel?.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{hotel?.name}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Active Front Desk
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {hotel?.address}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {hotel?.phone}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp: {hotel?.whatsapp}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto text-xs text-slate-500 dark:text-zinc-400">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
              <Plane className="w-4 h-4 text-blue-600" />
              <span>DAC Terminal 3 Flight Radar: <strong>Live Sync Active</strong></span>
            </div>
          </div>
        </div>

        {/* 2. Key Operational Metrics Strip (Real Hotel Extranet KPIs) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Occupancy */}
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">
                Live Occupancy
              </span>
              <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600">
                <BedDouble className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">{occupancyPercentage}%</span>
              <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${occupancyPercentage}%` }} />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 block">
                {availableRooms} vacant • {occupiedRooms} occupied of {totalRooms} rooms
              </span>
            </div>
          </div>

          {/* Active Reservations */}
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">
                Total Reservations
              </span>
              <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                <CalendarCheck className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">{bookings.length}</span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 mt-2 block">
                {onlineBookingsCount} Online OTA • {walkInBookingsCount} Front-Desk Walk-in
              </span>
            </div>
          </div>

          {/* Revenue */}
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">
                Booking Revenue
              </span>
              <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                <DollarSign className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalBookingRevenue)}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 block">
                From confirmed online &amp; walk-in stays
              </span>
            </div>
          </div>

          {/* Operating Profit */}
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">
                Net Operating Balance
              </span>
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2">
              <span className={`text-2xl font-black ${netOperatingProfit >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'}`}>
                {formatCurrency(netOperatingProfit)}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 block">
                After ৳{totalStaffExpenses.toLocaleString()} staff payroll &amp; expenses
              </span>
            </div>
          </div>
        </div>

        {/* 3. Primary Segmented Navigation Tabs */}
        <div className="border-b border-slate-200 dark:border-zinc-800 flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'overview', label: isBn ? 'রুম র্যাক ও ফ্রন্ট ডেস্ক' : 'Room Rack & Front Desk', icon: LayoutDashboard },
            { id: 'bookings', label: isBn ? 'বুকিং রেজিস্টার' : 'Reservations Ledger', icon: CalendarCheck, count: bookings.length },
            { id: 'rooms', label: isBn ? 'রুম ইনভেন্টরি' : 'Room Inventory & Pricing', icon: BedDouble, count: rooms.length },
            { id: 'finance', label: isBn ? 'আয় ও খরচ' : 'Financial Ledger', icon: DollarSign },
            { id: 'staff', label: isBn ? 'কর্মচারী ও বেতন' : 'Staff & Roster', icon: Users, count: staff.length },
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            TAB 1: ROOM RACK & VISUAL FRONT DESK MATRIX
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Filter bar for room rack */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isBn ? 'হোটেল রুম র্যাক (লাইভ স্ট্যাটাস)' : 'Live Front Desk Room Rack'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {isBn
                    ? 'রুম খালি বা অকুপাইড অবস্থা দেখুন এবং সরাসরি ওয়াক-ইন গেস্ট চেক-ইন করুন।'
                    : 'Visual room matrix. Click vacant rooms to assign walk-in guests or manage checkout.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRoomFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                    roomFilter === 'all'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'
                  }`}
                >
                  All ({rooms.length})
                </button>
                <button
                  onClick={() => setRoomFilter('available')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                    roomFilter === 'available'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'
                  }`}
                >
                  Vacant ({availableRooms})
                </button>
                <button
                  onClick={() => setRoomFilter('occupied')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                    roomFilter === 'occupied'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'
                  }`}
                >
                  Occupied ({occupiedRooms})
                </button>
              </div>
            </div>

            {/* Room Matrix Grid */}
            {filteredRooms.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl">
                <BedDouble className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-900 dark:text-white">No rooms in this status category</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRooms.map((room) => {
                  const isAvailable = room.current_status === 'available';
                  const isOccupied = room.current_status === 'occupied';
                  const images = Array.isArray(room.image_urls) && room.image_urls.length > 0 ? room.image_urls : [SAMPLE_ROOM_PHOTOS[0]];

                  return (
                    <div
                      key={room.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                        isAvailable
                          ? 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-blue-400'
                          : 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                      }`}
                    >
                      <div>
                        {/* Header: Room # + Status */}
                        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-black text-slate-900 dark:text-white">
                                Room {room.room_number}
                              </span>
                              <RoomStatusBadge status={room.current_status} isBn={isBn} />
                            </div>
                            <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300 block mt-0.5">
                              {room.type}
                            </span>
                          </div>

                          <span className="text-base font-black text-blue-600 dark:text-blue-400">
                            {formatCurrency(room.price || room.base_price)}
                            <span className="text-[10px] text-slate-400 font-normal"> / night</span>
                          </span>
                        </div>

                        {/* Advance Policy Notice */}
                        <div className="py-2.5">
                          {room.requires_advance ? (
                            <div className="flex items-center justify-between text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-900">
                              <span className="flex items-center gap-1.5">
                                <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                                <span>Advance Deposit:</span>
                              </span>
                              <span className="font-bold">৳{room.advance_amount}</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-900">
                              <span className="flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Policy:</span>
                              </span>
                              <span className="font-bold">Zero Advance (Pay at Desk)</span>
                            </div>
                          )}
                        </div>

                        {/* Facilities */}
                        {Array.isArray(room.facilities) && room.facilities.length > 0 && (
                          <div className="flex flex-wrap gap-1 pb-3">
                            {room.facilities.slice(0, 3).map((f, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded"
                              >
                                {f}
                              </span>
                            ))}
                            {room.facilities.length > 3 && (
                              <span className="px-1.5 py-0.5 text-[10px] text-slate-400">
                                +{room.facilities.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Actions */}
                      <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center gap-2">
                        {isAvailable ? (
                          <button
                            onClick={() => openWalkInModal(room.id)}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Check-In Guest</span>
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              try {
                                await api.patch(`/rooms/${room.id}/status`, { current_status: 'available' });
                                showToast(`Room ${room.room_number} marked as vacant & clean!`);
                                fetchData();
                              } catch (e) {
                                showToast(e.message, 'error');
                              }
                            }}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Free Room (Vacant)</span>
                          </button>
                        )}

                        <button
                          onClick={() => openEditRoomModal(room)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300"
                          title="Edit Room & Policy"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 2: RESERVATIONS LEDGER (ONLINE & WALK-IN)
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isBn ? 'বুকিং রেজিস্টার (অনলাইন ও অফলাইন)' : 'Reservations & Front Desk Guest Ledger'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {isBn
                    ? 'ওয়েবসাইট থেকে আসা অনলাইন বুকিং এবং কাউন্টার ওয়াক-ইন গেস্টদের বিবরণ।'
                    : 'Manage reservations, verify advance payments, check in guests, and issue vouchers.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBookingFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                    bookingFilter === 'all'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'
                  }`}
                >
                  All ({bookings.length})
                </button>
                <button
                  onClick={() => setBookingFilter('online')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 ${
                    bookingFilter === 'online'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Online ({onlineBookingsCount})</span>
                </button>
                <button
                  onClick={() => setBookingFilter('walk_in')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 ${
                    bookingFilter === 'walk_in'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Walk-in ({walkInBookingsCount})</span>
                </button>
              </div>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl">
                <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-900 dark:text-white">No reservations found in this view</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="p-3.5">Booking Ref</th>
                        <th className="p-3.5">Guest &amp; Contact</th>
                        <th className="p-3.5">Room</th>
                        <th className="p-3.5">Dates</th>
                        <th className="p-3.5">Channel</th>
                        <th className="p-3.5">Payment Ledger</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {filteredBookings.map((b) => {
                        const isWalkIn = b.booking_source === 'walk_in';
                        const total = parseFloat(b.total_amount) || 0;
                        const advance = parseFloat(b.advance_paid) || 0;
                        const due = Math.max(0, total - advance);

                        return (
                          <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                            {/* Ref */}
                            <td className="p-3.5 font-mono font-bold text-slate-700 dark:text-zinc-300">
                              #{b.id?.slice(0, 8) || 'HK-2026'}
                            </td>

                            {/* Guest */}
                            <td className="p-3.5">
                              <span className="font-bold text-slate-900 dark:text-white block">{b.guest_name}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-slate-500 dark:text-zinc-400">{b.guest_phone || '—'}</span>
                                {b.guest_phone && (
                                  <a
                                    href={`https://wa.me/${b.guest_phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-emerald-600 hover:text-emerald-500"
                                    title="WhatsApp Guest"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                              {b.flight_number && (
                                <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5">
                                  <Plane className="w-3 h-3" />
                                  <span>Flight: {b.flight_number}</span>
                                </span>
                              )}
                            </td>

                            {/* Room */}
                            <td className="p-3.5">
                              <span className="font-bold text-blue-600 dark:text-blue-400 block">
                                Room {b.room_number || 'N/A'}
                              </span>
                            </td>

                            {/* Dates */}
                            <td className="p-3.5 text-slate-600 dark:text-zinc-300">
                              <span>{formatDate(b.check_in_date)}</span>
                              <span className="text-slate-400 block text-[11px]">to {formatDate(b.check_out_date)}</span>
                            </td>

                            {/* Channel */}
                            <td className="p-3.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                isWalkIn
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200'
                                  : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200'
                              }`}>
                                {isWalkIn ? <Building2 className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                                <span>{isWalkIn ? 'Walk-in' : 'Online'}</span>
                              </span>
                            </td>

                            {/* Payment */}
                            <td className="p-3.5">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {formatCurrency(total)}
                              </div>
                              {advance > 0 ? (
                                <span className="text-[10px] text-emerald-600 font-semibold block">
                                  ৳{advance.toLocaleString()} advance paid
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 block">
                                  Zero advance
                                </span>
                              )}
                              {due > 0 && b.status !== 'checked_out' && (
                                <span className="text-[10px] text-amber-700 dark:text-amber-400 block font-bold">
                                  ৳{due.toLocaleString()} due at desk
                                </span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="p-3.5">
                              <BookingStatusBadge status={b.status} isBn={isBn} />
                            </td>

                            {/* Actions */}
                            <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                              {b.status === 'confirmed' && (
                                <button
                                  onClick={() => handleUpdateBookingStatus(b.id, 'checked_in')}
                                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-xs"
                                >
                                  Check In
                                </button>
                              )}

                              {b.status === 'checked_in' && (
                                <button
                                  onClick={() => handleUpdateBookingStatus(b.id, 'checked_out')}
                                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                                >
                                  Check Out
                                </button>
                              )}

                              {b.status !== 'cancelled' && b.status !== 'checked_out' && (
                                <button
                                  onClick={() => handleUpdateBookingStatus(b.id, 'cancelled')}
                                  className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                                >
                                  Cancel
                                </button>
                              )}

                              <button
                                onClick={() => setVoucherModal({ open: true, booking: b })}
                                className="p-1 rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-600 hover:bg-slate-100 dark:hover:bg-zinc-800"
                                title="View &amp; Print Voucher"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 3: ROOM INVENTORY & PRICING
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'rooms' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isBn ? 'রুম ইনভেন্টরি ও পলিসি' : 'Room Inventory & Advance Policies'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {isBn
                    ? 'রুমের ভাড়া এবং অনলাইনে বুকিংয়ের ক্ষেত্রে অগ্রিম টাকার নিয়ম নির্ধারণ করুন।'
                    : 'Set nightly rates, facilities, and advance deposit requirements for online transit guests.'}
                </p>
              </div>
              <button
                onClick={openCreateRoomModal}
                className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Room</span>
              </button>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Room #</th>
                      <th className="p-3.5">Type &amp; Category</th>
                      <th className="p-3.5">Nightly Rate</th>
                      <th className="p-3.5">Advance Money Policy</th>
                      <th className="p-3.5">Facilities</th>
                      <th className="p-3.5">Current Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {rooms.map((room) => (
                      <tr key={room.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="p-3.5 font-black text-slate-900 dark:text-white">
                          Room {room.room_number}
                        </td>
                        <td className="p-3.5 font-semibold text-slate-700 dark:text-zinc-300">
                          {room.type}
                        </td>
                        <td className="p-3.5 font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(room.price || room.base_price)}
                        </td>
                        <td className="p-3.5">
                          {room.requires_advance ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200">
                              <CreditCard className="w-3 h-3 text-amber-600" />
                              <span>৳{room.advance_amount} Advance</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Zero Advance (Pay at Desk)</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-500 max-w-xs truncate">
                          {Array.isArray(room.facilities) ? room.facilities.join(', ') : 'AC, Wi-Fi'}
                        </td>
                        <td className="p-3.5">
                          <RoomStatusBadge status={room.current_status} isBn={isBn} />
                        </td>
                        <td className="p-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => openEditRoomModal(room)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ open: true, roomId: room.id })}
                            className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Delete Room"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 4: FINANCIAL LEDGER & EXPENSES
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isBn ? 'আয় ও খরচের খাতা' : 'Financial Ledger & Operational Expenses'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {isBn ? 'কর্মচারীদের বেতন, হাতখরচ ও অন্যান্য ভাউচার হিসাব রাখুন।' : 'Track staff disbursements, daily utility expenses, and net profit.'}
                </p>
              </div>
              <button
                onClick={() => setExpenseModal({ open: true })}
                className="py-2 px-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Record Expense Voucher</span>
              </button>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
              {expenses.length === 0 ? (
                <p className="text-xs text-slate-400 py-10 text-center">No expense vouchers recorded yet.</p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Staff / Recipient</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Voucher Date</th>
                      <th className="p-3.5">Notes</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40">
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">{exp.staff_name}</td>
                        <td className="p-3.5 capitalize font-semibold text-slate-600">{exp.category}</td>
                        <td className="p-3.5 text-slate-500">{formatDate(exp.expense_date)}</td>
                        <td className="p-3.5 text-slate-500">{exp.notes || '—'}</td>
                        <td className="p-3.5 font-bold text-rose-600">{formatCurrency(exp.amount)}</td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 5: STAFF & ROSTER
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'staff' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isBn ? 'হোটেল কর্মচারী ও বেতন' : 'Staff Members & Duty Roster'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {isBn ? 'কর্মচারীদের নাম, পদবি, মাসিক বেতন ও বেতন পরিশোধের হিসাব।' : 'Manage front desk agents, housekeeping, salaries, and disbursements.'}
                </p>
              </div>
              <button
                onClick={() => setStaffModal({ open: true })}
                className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Staff Member</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staff.map((s) => (
                <div key={s.id} className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{s.name}</h4>
                        <span className="text-xs text-blue-600 font-semibold block">{s.role}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.salary_paid
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {s.salary_paid ? 'Salary Paid' : 'Pending Salary'}
                      </span>
                    </div>

                    <div className="py-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Contact:</span>
                        <span className="font-semibold text-slate-800 dark:text-zinc-200">{s.phone || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Monthly Salary:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(s.salary)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center gap-2">
                    <button
                      onClick={() => handleToggleSalaryPaid(s)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                        s.salary_paid
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-emerald-600 text-white hover:bg-emerald-500'
                      }`}
                    >
                      {s.salary_paid ? 'Mark Unpaid' : 'Mark Salary Paid'}
                    </button>
                    <button
                      onClick={() => handleDeleteStaff(s.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                      title="Remove Staff"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ─── MODAL: FRONT-DESK WALK-IN GUEST CHECK-IN ─── */}
      {walkInModal && (
        <Modal
          title={isBn ? 'কাউন্টার ওয়াক-ইন গেস্ট চেক-ইন' : 'Front Desk Walk-In Guest Registration'}
          onClose={() => setWalkInModal(false)}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSaveWalkIn} className="space-y-4">
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-start gap-2">
              <KeyRound className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Register an in-person guest at the front desk. This will immediately mark the room as occupied and generate an official reservation record.
              </span>
            </div>

            <Field label={isBn ? 'রুম নির্বাচন করুন *' : 'Assign Available Room *'}>
              <select
                required
                value={walkInForm.room_id}
                onChange={(e) => setWalkInForm({ ...walkInForm, room_id: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs focus:border-blue-600 focus:outline-none"
              >
                <option value="">-- Choose an Available Room --</option>
                {rooms
                  .filter((r) => r.current_status === 'available' || r.id === walkInForm.room_id)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.room_number} — {r.type} (৳{r.price || r.base_price} / night)
                    </option>
                  ))}
              </select>
            </Field>

            <Field label={isBn ? 'গেস্টের পুরো নাম *' : 'Guest Full Name *'}>
              <input
                type="text"
                required
                placeholder="e.g. Tareq Hasan"
                value={walkInForm.guest_name}
                onChange={(e) => setWalkInForm({ ...walkInForm, guest_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs focus:border-blue-600 focus:outline-none"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={isBn ? 'মোবাইল নম্বর' : 'Phone / WhatsApp Number'}>
                <input
                  type="tel"
                  placeholder="+880 1700-000000"
                  value={walkInForm.guest_phone}
                  onChange={(e) => setWalkInForm({ ...walkInForm, guest_phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs focus:border-blue-600 focus:outline-none"
                />
              </Field>

              <Field label="National ID / Passport (Optional)">
                <input
                  type="text"
                  placeholder="e.g. NID 5512..."
                  value={walkInForm.guest_id_number}
                  onChange={(e) => setWalkInForm({ ...walkInForm, guest_id_number: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs focus:border-blue-600 focus:outline-none"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Check-In Date">
                <input
                  type="date"
                  required
                  value={walkInForm.check_in_date}
                  onChange={(e) => setWalkInForm({ ...walkInForm, check_in_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs focus:border-blue-600 focus:outline-none"
                />
              </Field>

              <Field label="Check-Out Date">
                <input
                  type="date"
                  required
                  value={walkInForm.check_out_date}
                  onChange={(e) => setWalkInForm({ ...walkInForm, check_out_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs focus:border-blue-600 focus:outline-none"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Advance Collected at Front Desk (BDT)">
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={walkInForm.advance_paid}
                  onChange={(e) => setWalkInForm({ ...walkInForm, advance_paid: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs focus:border-blue-600 focus:outline-none font-bold"
                />
              </Field>

              <Field label="Payment Method">
                <select
                  value={walkInForm.payment_method}
                  onChange={(e) => setWalkInForm({ ...walkInForm, payment_method: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs focus:border-blue-600 focus:outline-none font-semibold"
                >
                  <option value="cash">Cash at Desk</option>
                  <option value="bkash">bKash QR / Merchant</option>
                  <option value="nagad">Nagad</option>
                  <option value="card">POS Card Machine</option>
                </select>
              </Field>
            </div>

            <div className="flex items-center gap-2 pt-3">
              <button
                type="button"
                onClick={() => setWalkInModal(false)}
                className="flex-1 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
              >
                Complete Check-In &amp; Issue Room Key
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MODAL: CREATE / EDIT ROOM (WITH ADVANCE POLICY) ─── */}
      {roomModal.open && (
        <Modal
          title={roomModal.mode === 'create' ? 'Add Room to Property Inventory' : `Edit Room ${roomModal.room?.room_number}`}
          onClose={() => setRoomModal({ open: false, mode: 'create', room: null })}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSaveRoom} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Room Number *">
                <input
                  type="text"
                  required
                  placeholder="e.g. 101, 204, 305"
                  value={roomForm.room_number}
                  onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs focus:border-blue-600 focus:outline-none"
                />
              </Field>

              <Field label="Room Type / Tier *">
                <input
                  type="text"
                  required
                  placeholder="e.g. Deluxe Double, Executive Transit Suite"
                  value={roomForm.type}
                  onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs focus:border-blue-600 focus:outline-none"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Base Price (BDT / night) *">
                <input
                  type="number"
                  required
                  min="0"
                  step="50"
                  placeholder="2500"
                  value={roomForm.base_price}
                  onChange={(e) => setRoomForm({ ...roomForm, base_price: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs focus:border-blue-600 focus:outline-none font-bold"
                />
              </Field>

              <Field label="Initial Status">
                <select
                  value={roomForm.current_status}
                  onChange={(e) => setRoomForm({ ...roomForm, current_status: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs focus:border-blue-600 focus:outline-none font-semibold"
                >
                  <option value="available">Vacant &amp; Ready</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Under Cleaning / Maintenance</option>
                </select>
              </Field>
            </div>

            {/* Advance Money Engine */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    <span>Require Advance Deposit for Online Reservations</span>
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block mt-0.5">
                    When enabled, online guests must pay this deposit to hold the room. When disabled, guests book with zero advance.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setRoomForm({ ...roomForm, requires_advance: !roomForm.requires_advance })}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    roomForm.requires_advance ? 'bg-blue-600' : 'bg-slate-300 dark:bg-zinc-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      roomForm.requires_advance ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {roomForm.requires_advance && (
                <div className="pt-2 border-t border-slate-200 dark:border-zinc-700">
                  <Field label="Required Advance Deposit Amount (৳) *">
                    <input
                      type="number"
                      required
                      min="100"
                      step="50"
                      placeholder="500"
                      value={roomForm.advance_amount}
                      onChange={(e) => setRoomForm({ ...roomForm, advance_amount: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-blue-500 text-blue-700 dark:text-blue-300 font-bold text-xs focus:outline-none"
                    />
                  </Field>
                </div>
              )}
            </div>

            <Field
              label="Room Photo URLs (Comma-separated for Slideshow)"
              hint="Multiple images will cycle smoothly on customer cards"
            >
              <textarea
                rows={2}
                placeholder="https://images.unsplash.com/photo-1..., https://images.unsplash.com/photo-2..."
                value={roomForm.image_urls}
                onChange={(e) => setRoomForm({ ...roomForm, image_urls: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs focus:border-blue-600 focus:outline-none"
              />
            </Field>

            <Field label="Facilities &amp; Amenities (Comma-separated)">
              <input
                type="text"
                placeholder="AC, King Bed, Free High-Speed Wi-Fi, Attached Bath, Smart TV, Geyser"
                value={roomForm.facilities}
                onChange={(e) => setRoomForm({ ...roomForm, facilities: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs focus:border-blue-600 focus:outline-none"
              />
            </Field>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRoomModal({ open: false, mode: 'create', room: null })}
                className="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-xs"
              >
                {roomModal.mode === 'create' ? 'Save Room' : 'Apply Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MODAL: OFFICIAL GUEST VOUCHER & RECEIPT ─── */}
      {voucherModal.open && voucherModal.booking && (
        <Modal title="Official Front Desk Guest Voucher &amp; Receipt" onClose={() => setVoucherModal({ open: false, booking: null })} maxWidth="max-w-md">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-zinc-700">
              <span className="font-bold text-slate-900 dark:text-white">{hotel?.name}</span>
              <span className="font-mono text-blue-600 font-bold">#{voucherModal.booking.id?.slice(0, 8)}</span>
            </div>

            <div className="space-y-1.5 text-slate-600 dark:text-zinc-300">
              <div className="flex justify-between">
                <span>Guest Name:</span>
                <span className="font-bold text-slate-900 dark:text-white">{voucherModal.booking.guest_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Room Assigned:</span>
                <span className="font-bold text-blue-600">Room {voucherModal.booking.room_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Stay Period:</span>
                <span>{formatDate(voucherModal.booking.check_in_date)} → {formatDate(voucherModal.booking.check_out_date)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Bill:</span>
                <span className="font-black text-slate-900 dark:text-white">{formatCurrency(voucherModal.booking.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Advance Paid:</span>
                <span className="font-bold text-emerald-600">৳{voucherModal.booking.advance_paid || 0}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-zinc-700 flex justify-between items-center text-[11px] text-slate-500">
              <span>Reception: {hotel?.phone}</span>
              <span>DAC Transit Zone</span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={() => setVoucherModal({ open: false, booking: null })}
              className="py-2 px-4 rounded-xl border border-slate-200 text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* ─── MODAL: DELETE ROOM ─── */}
      {deleteConfirm.open && (
        <Modal title="Delete Room from Inventory" onClose={() => setDeleteConfirm({ open: false, roomId: null })}>
          <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
            Are you sure you want to permanently remove this room from your property inventory? Past reservations will remain in your ledger.
          </p>
          <div className="flex items-center gap-2 mt-5">
            <button
              onClick={() => setDeleteConfirm({ open: false, roomId: null })}
              className="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteRoom}
              className="flex-1 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white"
            >
              Confirm Delete
            </button>
          </div>
        </Modal>
      )}

      {/* ─── MODAL: ADD STAFF ─── */}
      {staffModal.open && (
        <Modal title="Register Hotel Staff Member" onClose={() => setStaffModal({ open: false })}>
          <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
            <Field label="Full Name *">
              <input
                type="text"
                required
                value={staffForm.name}
                onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </Field>
            <Field label="Role / Designation *">
              <input
                type="text"
                required
                value={staffForm.role}
                onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </Field>
            <Field label="Phone Contact">
              <input
                type="text"
                value={staffForm.phone}
                onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </Field>
            <Field label="Monthly Salary (BDT) *">
              <input
                type="number"
                required
                value={staffForm.salary}
                onChange={(e) => setStaffForm({ ...staffForm, salary: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </Field>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStaffModal({ open: false })}
                className="flex-1 py-2 rounded-xl border"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold"
              >
                Register Staff
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MODAL: ADD EXPENSE ─── */}
      {expenseModal.open && (
        <Modal title="Record Operational Expense Voucher" onClose={() => setExpenseModal({ open: false })}>
          <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
            <Field label="Staff Member / Vendor Name *">
              <input
                type="text"
                required
                value={expenseForm.staff_name}
                onChange={(e) => setExpenseForm({ ...expenseForm, staff_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </Field>
            <Field label="Category *">
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 dark:bg-zinc-800 font-semibold"
              >
                <option value="salary">Salary Disbursement</option>
                <option value="advance">Salary Advance</option>
                <option value="bonus">Festival Bonus / Tip</option>
                <option value="meals">Staff Meals &amp; Refreshments</option>
                <option value="utility">Utility / Laundry / Maintenance</option>
                <option value="other">Other Operational Expense</option>
              </select>
            </Field>
            <Field label="Amount (BDT) *">
              <input
                type="number"
                required
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 dark:bg-zinc-800 font-bold"
              />
            </Field>
            <Field label="Voucher Date *">
              <input
                type="date"
                required
                value={expenseForm.expense_date}
                onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </Field>
            <Field label="Notes / Invoice Ref">
              <input
                type="text"
                value={expenseForm.notes}
                onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </Field>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setExpenseModal({ open: false })}
                className="flex-1 py-2 rounded-xl border"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white font-bold"
              >
                Save Voucher
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
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Opening Hotel PMS Extranet...</span>
          </div>
        </div>
      }
    >
      <OwnerDashboardContent />
    </Suspense>
  );
}
