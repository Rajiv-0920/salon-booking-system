import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import Salon from '../models/salon.model.js';
import Staff from '../models/staff.model.js';
import Booking from '../models/booking.model.js';
import Service from '../models/services.model.js';

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

// ─────────────────────────────────────────────────────────────────────────────
// SALON OWNERSHIP — salon-owner owns this salon
// ─────────────────────────────────────────────────────────────────────────────
export const verifyOwnership = async (req, res, next) => {
  try {
    const salon = await Salon.findById(req.params.id);
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }

    const isOwner = salon.ownerId.toString() === req.user._id.toString();
    const isSuperAdmin = req.user.role === 'super-admin';

    if (!isOwner && !isSuperAdmin) {
      return res
        .status(403)
        .json({ message: 'Forbidden: not the salon owner' });
    }

    req.salon = salon;
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE OWNERSHIP — salon-owner owns the salon this service belongs to
// ─────────────────────────────────────────────────────────────────────────────
export const verifyServiceOwnership = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const salon = await Salon.findById(service.salonId);
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }

    const isOwner = salon.ownerId.toString() === req.user._id.toString();
    const isSuperAdmin = req.user.role === 'super-admin';

    if (!isOwner && !isSuperAdmin) {
      return res
        .status(403)
        .json({ message: 'Forbidden: not the salon owner' });
    }

    req.service = service;
    req.salon = salon;
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STAFF OWNERSHIP — salon-owner owns the salon this staff belongs to
// ─────────────────────────────────────────────────────────────────────────────
export const verifyStaffOwnership = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    const salon = await Salon.findById(staff.salonId);
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }

    const isOwner = salon.ownerId.toString() === req.user._id.toString();
    const isSuperAdmin = req.user.role === 'super-admin';

    if (!isOwner && !isSuperAdmin) {
      return res
        .status(403)
        .json({ message: 'Forbidden: not the salon owner' });
    }

    req.staff = staff;
    req.salon = salon;
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STAFF SELF OR OWNER — staff accessing own profile, or owner of their salon
// ─────────────────────────────────────────────────────────────────────────────
export const verifyStaffSelfOrOwner = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    const salon = await Salon.findById(staff.salonId);
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }

    const isSelf = staff.userId.toString() === req.user._id.toString();
    const isOwner = salon.ownerId.toString() === req.user._id.toString();
    const isSuperAdmin = req.user.role === 'super-admin';

    if (!isSelf && !isOwner && !isSuperAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    req.staff = staff;
    req.salon = salon;
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BOOKING ACCESS — customer (own) | staff (own salon) | owner (own salon) | superadmin
// ─────────────────────────────────────────────────────────────────────────────
export const verifyBookingAccess = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const salon = await Salon.findById(booking.salonId);
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }

    const isCustomer = booking.userId.toString() === req.user._id.toString();
    const isOwner = salon.ownerId.toString() === req.user._id.toString();
    const isStaff = await Staff.exists({
      salonId: salon._id,
      userId: req.user._id,
    });
    const isSuperAdmin = req.user.role === 'super-admin';

    if (!isCustomer && !isOwner && !isStaff && !isSuperAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    req.booking = booking;
    req.salon = salon;
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BOOKING CUSTOMER OR OWNER — customer (own) | owner (own salon) | superadmin
// Staff explicitly excluded
// ─────────────────────────────────────────────────────────────────────────────
export const verifyBookingCustomerOrOwner = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const isSuperAdmin = req.user.role === 'super-admin';
    const isCustomer = booking.userId.toString() === req.user._id.toString();

    let isOwner = false;
    if (req.user.role === 'salon-owner') {
      const salon = await Salon.findById(booking.salonId);
      isOwner = salon?.ownerId.toString() === req.user._id.toString();
    }

    if (!isCustomer && !isOwner && !isSuperAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    req.booking = booking;
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BOOKING SALON OWNERSHIP — staff (own salon) | owner (own salon) | superadmin
// ─────────────────────────────────────────────────────────────────────────────
export const verifyBookingSalonOwnership = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const salon = await Salon.findById(booking.salonId);
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }

    const isOwner = salon.ownerId.toString() === req.user._id.toString();
    const isStaff = await Staff.exists({
      salonId: salon._id,
      userId: req.user._id,
    });
    const isSuperAdmin = req.user.role === 'super-admin';

    if (!isOwner && !isStaff && !isSuperAdmin) {
      return res.status(403).json({ message: 'Forbidden: not your salon' });
    }

    req.booking = booking;
    req.salon = salon;
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SALON ACCESS — owner (own salon) | staff (own salon) | superadmin
// For routes that use :salonId param
// ─────────────────────────────────────────────────────────────────────────────
export const verifySalonAccess = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role === 'super-admin';
    if (isSuperAdmin) return next();

    const salon = await Salon.findById(req.params.salonId);

    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }

    const isOwner =
      req.user.role === 'salon-owner' &&
      salon.ownerId.toString() === req.user._id.toString();

    const isStaff =
      req.user.role === 'staff' &&
      (await Staff.exists({ salonId: salon._id, userId: req.user._id }));

    if (!isOwner && !isStaff) {
      return res
        .status(403)
        .json({ message: 'Forbidden: you do not belong to this salon' });
    }

    req.salon = salon;
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
