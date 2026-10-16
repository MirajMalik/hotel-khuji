import jwt from 'jsonwebtoken';

export const requireAuth = (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.replace(/^Bearer\s+/, '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_hotel_khuji_jwt_secure_key_2026');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
};

export const requireOwner = (req, res, next) => {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'owner') {
      return res.status(403).json({ error: 'Access denied: Hotel Owner role required' });
    }
    next();
  });
};
