import { query } from '../config/db.js';
import { getIO } from '../config/socket.js';

export const getRoomsByHotel = async (req, res) => {
  const { hotelId } = req.params;

  try {
    const result = await query(
      `SELECT 
        id, created_at, hotel_id, room_number, type, 
        base_price, COALESCE(price, base_price) as price,
        current_status, image_urls, facilities,
        COALESCE(requires_advance, false) as requires_advance,
        COALESCE(advance_amount, 0) as advance_amount
       FROM public.rooms 
       WHERE hotel_id = $1 
       ORDER BY room_number ASC`,
      [hotelId]
    );

    return res.status(200).json({ data: result.rows });
  } catch (err) {
    console.error('Error fetching rooms:', err);
    return res.status(500).json({ error: 'Failed to fetch rooms' });
  }
};

export const createRoom = async (req, res) => {
  const {
    hotel_id,
    hotelId,
    room_number,
    roomNumber,
    type = 'standard',
    base_price = 0,
    basePrice = 0,
    price,
    current_status = 'available',
    image_urls = [],
    image_url,
    facilities = [],
    requires_advance = false,
    advance_amount = 0,
  } = req.body;

  const targetHotelId = hotel_id || hotelId;
  const targetRoomNumber = room_number || roomNumber;
  const targetPrice = price || base_price || basePrice || 0;

  if (!targetHotelId || !targetRoomNumber) {
    return res.status(400).json({ error: 'hotel_id and room_number are required' });
  }

  // Parse images
  let processedImages = [];
  if (Array.isArray(image_urls) && image_urls.length > 0) {
    processedImages = image_urls;
  } else if (image_url) {
    processedImages = image_url.split(',').map((u) => u.trim()).filter(Boolean);
  }
  if (processedImages.length === 0) {
    processedImages = [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    ];
  }

  // Parse facilities
  let processedFacilities = [];
  if (Array.isArray(facilities)) {
    processedFacilities = facilities;
  } else if (typeof facilities === 'string') {
    processedFacilities = facilities.split(',').map((f) => f.trim()).filter(Boolean);
  }

  try {
    const insertQuery = `
      INSERT INTO public.rooms (
        hotel_id, 
        room_number, 
        type, 
        base_price, 
        price, 
        current_status, 
        image_urls, 
        facilities,
        requires_advance,
        advance_amount
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;

    const result = await query(insertQuery, [
      targetHotelId,
      targetRoomNumber,
      type,
      targetPrice,
      targetPrice,
      current_status,
      processedImages,
      processedFacilities,
      Boolean(requires_advance),
      Number(advance_amount) || 0,
    ]);

    const newRoom = result.rows[0];

    try {
      const io = getIO();
      io.to(`hotel:${targetHotelId}`).emit('room_created', { room: newRoom });
    } catch (e) {}

    return res.status(201).json({ data: newRoom, message: 'Room created successfully' });
  } catch (err) {
    console.error('Error creating room:', err);
    return res.status(500).json({ error: err.message || 'Failed to create room' });
  }
};

export const updateRoom = async (req, res) => {
  const { id } = req.params;
  const {
    room_number,
    type,
    base_price,
    price,
    current_status,
    image_urls,
    image_url,
    facilities,
    requires_advance,
    advance_amount,
  } = req.body;

  const targetPrice = price !== undefined ? price : base_price;

  let processedImages = undefined;
  if (Array.isArray(image_urls)) {
    processedImages = image_urls;
  } else if (typeof image_url === 'string') {
    processedImages = image_url.split(',').map((u) => u.trim()).filter(Boolean);
  }

  let processedFacilities = undefined;
  if (Array.isArray(facilities)) {
    processedFacilities = facilities;
  } else if (typeof facilities === 'string') {
    processedFacilities = facilities.split(',').map((f) => f.trim()).filter(Boolean);
  }

  try {
    const updateQuery = `
      UPDATE public.rooms
      SET
        room_number = COALESCE($1, room_number),
        type = COALESCE($2, type),
        base_price = COALESCE($3, base_price),
        price = COALESCE($4, price),
        current_status = COALESCE($5, current_status),
        image_urls = COALESCE($6, image_urls),
        facilities = COALESCE($7, facilities),
        requires_advance = COALESCE($8, requires_advance),
        advance_amount = COALESCE($9, advance_amount)
      WHERE id = $10
      RETURNING *;
    `;

    const result = await query(updateQuery, [
      room_number,
      type,
      targetPrice,
      targetPrice,
      current_status,
      processedImages,
      processedFacilities,
      requires_advance !== undefined ? Boolean(requires_advance) : null,
      advance_amount !== undefined ? Number(advance_amount) : null,
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const updated = result.rows[0];

    try {
      const io = getIO();
      io.to(`hotel:${updated.hotel_id}`).emit('room_status_changed', {
        roomId: updated.id,
        status: updated.current_status,
        room: updated,
      });
    } catch (e) {}

    return res.status(200).json({ data: updated, message: 'Room updated successfully' });
  } catch (err) {
    console.error('Error updating room:', err);
    return res.status(500).json({ error: err.message || 'Failed to update room' });
  }
};

export const deleteRoom = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query('DELETE FROM public.rooms WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const deleted = result.rows[0];

    try {
      const io = getIO();
      io.to(`hotel:${deleted.hotel_id}`).emit('room_deleted', { roomId: id });
    } catch (e) {}

    return res.status(200).json({ success: true, message: 'Room deleted successfully' });
  } catch (err) {
    console.error('Error deleting room:', err);
    return res.status(500).json({ error: err.message || 'Failed to delete room' });
  }
};

export const updateRoomStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['available', 'occupied', 'maintenance'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const result = await query(
      'UPDATE public.rooms SET current_status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const updatedRoom = result.rows[0];

    try {
      const io = getIO();
      io.to(`hotel:${updatedRoom.hotel_id}`).emit('room_status_changed', {
        roomId: updatedRoom.id,
        status: updatedRoom.current_status,
        room: updatedRoom,
      });
    } catch (socketErr) {
      console.warn('Socket broadcast warning:', socketErr.message);
    }

    return res.status(200).json({ data: updatedRoom });
  } catch (err) {
    console.error('Error updating room status:', err);
    return res.status(500).json({ error: 'Failed to update room status' });
  }
};
