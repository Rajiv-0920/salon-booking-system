import Salon from '../models/salon.model.js';
import Staff from '../models/staff.model.js';

// ─────────────────────────────────────────────────────────────────────────────
// SALON OWNERSHIP — salon-owner owns this salon
// ─────────────────────────────────────────────────────────────────────────────
export const verifyOwnership =
  (paramName = 'id') =>
  async (req, res, next) => {
    try {
      const isSuperAdmin = req.user.role === 'super-admin';
      if (isSuperAdmin) return next(); // ✅ return here

      const salon = await Salon.findById(req.params[paramName]);
      if (!salon) {
        return res.status(404).json({ message: 'Salon not found' });
      }

      const isOwner = salon.ownerId.toString() === req.user._id.toString();
      if (!isOwner) {
        return res
          .status(403)
          .json({ message: 'Forbidden: not the salon owner' });
      }

      req.salon = salon;
      return next();
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
