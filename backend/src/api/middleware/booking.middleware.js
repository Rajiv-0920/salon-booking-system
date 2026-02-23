import Booking from '../models/booking.model.js';
import Salon from '../models/salon.model.js';
import Staff from '../models/staff.model.js';

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
