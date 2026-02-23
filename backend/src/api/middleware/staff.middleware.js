import Salon from '../models/salon.model.js';
import Staff from '../models/staff.model.js';

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
