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
              'current_status', r.current_status,
              'image_urls', r.image_urls,
              'facilities', r.facilities
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
      'SELECT * FROM public.rooms WHERE hotel_id = $1 ORDER BY room_number ASC',
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
