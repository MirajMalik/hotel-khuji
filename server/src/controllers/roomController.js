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

    // Emit live WebSocket update to all listeners for this hotel
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
