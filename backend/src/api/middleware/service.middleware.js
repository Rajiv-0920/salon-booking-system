import Salon from '../models/salon.model.js';
import Service from '../models/services.model.js';

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
