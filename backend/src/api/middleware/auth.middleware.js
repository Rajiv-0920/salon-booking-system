import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import Salon from '../models/salon.model.js';
import Staff from '../models/staff.model.js';

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATE — verify JWT and attach req.user
// ─────────────────────────────────────────────────────────────────────────────
export const protect = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userDoc = await User.findById(decoded.id).select('-password');

    if (!userDoc) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userDoc.toObject();

    // Attach salonId so downstream middleware doesn't have to re-query
    if (user.role === 'salon-owner') {
      const salon = await Salon.findOne({ ownerId: user._id });
      if (salon) user.salonId = salon._id;
    } else if (user.role === 'staff') {
      const staffProfile = await Staff.findOne({ userId: user._id });
      if (staffProfile) user.salonId = staffProfile.salonId;
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ROLE CHECK — restrict to specific roles
// Usage: restrictTo('salon-owner', 'staff')
// ─────────────────────────────────────────────────────────────────────────────
export const restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied: ${roles.join(' or ')} only`,
      });
    }
    next();
  };

// ─────────────────────────────────────────────────────────────────────────────
// SELF OR SUPERADMIN — user can only access their own resource
// Usage: verifySelfOrSuperAdmin('userId')
// ─────────────────────────────────────────────────────────────────────────────
export const verifySelfOrSuperAdmin =
  (paramName = 'id') =>
  (req, res, next) => {
    const isSuperAdmin = req.user.role === 'super-admin';
    const isSelf = req.user._id.toString() === req.params[paramName].toString();

    if (!isSelf && !isSuperAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
