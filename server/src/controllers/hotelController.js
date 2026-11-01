import { query } from '../config/db.js';

export const getHotels = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        h.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', r.id,
              'created_at', r.created_at,
              'hotel_id', r.hotel_id,
              'room_number', r.room_number,
              'type', r.type,
              'base_price', r.base_price,
              'price', COALESCE(r.price, r.base_price),
              'current_status', r.current_status,
              'image_urls', r.image_urls,
              'facilities', r.facilities,
              'requires_advance', COALESCE(r.requires_advance, false),
              'advance_amount', COALESCE(r.advance_amount, 0)
            )
          ) FILTER (WHERE r.id IS NOT NULL), 
          '[]'
        ) AS rooms
      FROM public.hotels h
      LEFT JOIN public.rooms r ON r.hotel_id = h.id
      GROUP BY h.id
      ORDER BY h.created_at DESC;
    `);

    return res.status(200).json({ data: result.rows });
  } catch (err) {
    console.error('Error fetching hotels:', err);
    return res.status(500).json({ error: 'Failed to fetch hotels' });
  }
};

export const getHotelById = async (req, res) => {
  const { id } = req.params;

  try {
    const hotelResult = await query('SELECT * FROM public.hotels WHERE id = $1', [id]);
    if (hotelResult.rows.length === 0) {
      return res.status(404).json({ error: 'Hotel not found' });
    }

    const roomsResult = await query(
      `SELECT 
        id, created_at, hotel_id, room_number, type, 
        base_price, COALESCE(price, base_price) as price,
        current_status, image_urls, facilities,
        COALESCE(requires_advance, false) as requires_advance,
        COALESCE(advance_amount, 0) as advance_amount
       FROM public.rooms 
       WHERE hotel_id = $1 
       ORDER BY room_number ASC`,
      [id]
    );

    const hotel = hotelResult.rows[0];
    hotel.rooms = roomsResult.rows;

    return res.status(200).json({ data: hotel });
  } catch (err) {
    console.error('Error fetching hotel by id:', err);
    return res.status(500).json({ error: 'Failed to fetch hotel details' });
  }
};

export const getOwnerHotel = async (req, res) => {
  const ownerId = req.user?.id;

  if (!ownerId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const hotelRes = await query(
      'SELECT * FROM public.hotels WHERE owner_id = $1 ORDER BY created_at DESC LIMIT 1',
      [ownerId]
    );

    if (hotelRes.rows.length === 0) {
      return res.status(200).json({ data: null, message: 'No hotel found for this owner' });
    }

    const hotel = hotelRes.rows[0];

    const roomsRes = await query(
      `SELECT 
        id, created_at, hotel_id, room_number, type, 
        base_price, COALESCE(price, base_price) as price,
        current_status, image_urls, facilities,
        COALESCE(requires_advance, false) as requires_advance,
        COALESCE(advance_amount, 0) as advance_amount
       FROM public.rooms 
       WHERE hotel_id = $1 
       ORDER BY room_number ASC`,
      [hotel.id]
    );

    hotel.rooms = roomsRes.rows;

    return res.status(200).json({ data: hotel });
  } catch (err) {
    console.error('Error fetching owner hotel:', err);
    return res.status(500).json({ error: 'Failed to fetch owner hotel' });
  }
};

export const createHotel = async (req, res) => {
  const ownerId = req.user?.id;

  if (!ownerId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const {
    name,
    title,
    description,
    address,
    location,
    latitude = 23.8512,
    longitude = 90.4101,
    location_url,
    cover_image_url,
    amenities = [],
    services = [],
    phone,
    whatsapp,
    shuttle_available = true,
  } = req.body;

  const hotelName = name || title;
  const hotelAddress = address || location;
  const hotelAmenities = Array.isArray(amenities) && amenities.length > 0 
    ? amenities 
    : (Array.isArray(services) && services.length > 0 ? services : ['Free Wi-Fi', 'AC', '24/7 Power Backup', 'Airport Shuttle']);

  if (!hotelName || !hotelAddress) {
    return res.status(400).json({ error: 'Hotel name and location address are required' });
  }

  try {
    // Check if this owner already has a hotel
    const existing = await query('SELECT id FROM public.hotels WHERE owner_id = $1 LIMIT 1', [ownerId]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ 
        error: 'You already have an active hotel. You can manage or update your existing property.',
        hotelId: existing.rows[0].id
      });
    }

    const insertQuery = `
      INSERT INTO public.hotels (
        owner_id,
        name,
        description,
        address,
        latitude,
        longitude,
        location_url,
        subscription_status,
        cover_image_url,
        amenities,
        phone,
        whatsapp,
        shuttle_available
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, $9, $10, $11, $12)
      RETURNING *;
    `;

    const result = await query(insertQuery, [
      ownerId,
      hotelName.trim(),
      description ? description.trim() : 'Convenient transit hotel near Hazrat Shahjalal International Airport (DAC).',
      hotelAddress.trim(),
      latitude,
      longitude,
      location_url || `https://maps.google.com/?q=${latitude},${longitude}`,
      cover_image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      hotelAmenities,
      phone ? phone.trim() : '+8801700000000',
      whatsapp ? whatsapp.trim().replace(/\D/g, '') : '8801700000000',
      shuttle_available,
    ]);

    const newHotel = result.rows[0];
    newHotel.rooms = [];

    return res.status(201).json({ data: newHotel, message: 'Hotel registered successfully' });
  } catch (err) {
    console.error('Error creating hotel:', err);
    return res.status(500).json({ error: err.message || 'Failed to create hotel' });
  }
};

export const updateHotel = async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user?.id;

  const {
    name,
    title,
    description,
    address,
    location,
    latitude,
    longitude,
    location_url,
    cover_image_url,
    amenities,
    services,
    phone,
    whatsapp,
    shuttle_available,
  } = req.body;

  try {
    const hotelCheck = await query('SELECT owner_id FROM public.hotels WHERE id = $1', [id]);
    if (hotelCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Hotel not found' });
    }

    if (req.user?.role !== 'admin' && hotelCheck.rows[0].owner_id !== ownerId) {
      return res.status(403).json({ error: 'You do not have permission to modify this hotel' });
    }

    const hotelName = name || title;
    const hotelAddress = address || location;
    const hotelAmenities = amenities || services;

    const updateQuery = `
      UPDATE public.hotels
      SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        address = COALESCE($3, address),
        latitude = COALESCE($4, latitude),
        longitude = COALESCE($5, longitude),
        location_url = COALESCE($6, location_url),
        cover_image_url = COALESCE($7, cover_image_url),
        amenities = COALESCE($8, amenities),
        phone = COALESCE($9, phone),
        whatsapp = COALESCE($10, whatsapp),
        shuttle_available = COALESCE($11, shuttle_available)
      WHERE id = $12
      RETURNING *;
    `;

    const result = await query(updateQuery, [
      hotelName,
      description,
      hotelAddress,
      latitude,
      longitude,
      location_url,
      cover_image_url,
      hotelAmenities,
      phone,
      whatsapp,
      shuttle_available,
      id,
    ]);

    return res.status(200).json({ data: result.rows[0], message: 'Hotel updated successfully' });
  } catch (err) {
    console.error('Error updating hotel:', err);
    return res.status(500).json({ error: err.message || 'Failed to update hotel' });
  }
};
