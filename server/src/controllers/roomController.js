import { query } from '../config/db.js';
import { getIO } from '../config/socket.js';

export const getRoomsByHotel = async (req, res) => {
  const { hotelId } = req.params;

  try {
    const result = await query(
      'SELECT * FROM public.rooms WHERE hotel_id = $1 ORDER BY room_number ASC',
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
    current_status = 'available',
    image_urls = [],
    facilities = [],
  } = req.body;

  const targetHotelId = hotel_id || hotelId;
  const targetRoomNumber = room_number || roomNumber;
  const targetPrice = base_price || basePrice;

  if (!targetHotelId || !targetRoomNumber) {
    return res.status(400).json({ error: 'hotel_id and room_number are required' });
  }

  try {
    const result = await query(
      `INSERT INTO public.rooms (hotel_id, room_number, type, base_price, current_status, image_urls, facilities)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        targetHotelId,
        targetRoomNumber,
        type,
        targetPrice,
        current_status,
        Array.isArray(image_urls) ? image_urls : [],
        Array.isArray(facilities) ? facilities : [],
      ]
    );

    const newRoom = result.rows[0];

    try {
      const io = getIO();
      io.to(`hotel:${targetHotelId}`).emit('room_created', { room: newRoom });
    } catch (e) {
      // socket non-blocking
    }

    return res.status(201).json({ data: newRoom });
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
    current_status,
    image_urls,
    facilities,
  } = req.body;

  try {
    const result = await query(
      `UPDATE public.rooms
       SET
         room_number = COALESCE($1, room_number),
         type = COALESCE($2, type),
         base_price = COALESCE($3, base_price),
         current_status = COALESCE($4, current_status),
         image_urls = COALESCE($5, image_urls),
         facilities = COALESCE($6, facilities)
       WHERE id = $7
       RETURNING *`,
      [
        room_number,
        type,
        base_price,
        current_status,
        image_urls ? (Array.isArray(image_urls) ? image_urls : [image_urls]) : null,
        facilities ? (Array.isArray(facilities) ? facilities : [facilities]) : null,
        id,
      ]
    );

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

    return res.status(200).json({ data: updated });
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
