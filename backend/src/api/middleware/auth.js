import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import Salon from '../models/salon.model.js';

export const protect = async (req, res, next) => {
  let { token } = req.cookies;

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Admins only',
    });
  }
};

export const isOwnerOrAdmin = (req, res, next) => {
  const isOwner = req.user._id.toString() === req.params.id;
  const isAdmin = req.user.role === 'admin';

  if (isOwner || isAdmin) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized to access this data' });
  }
};

export const isTheSalonOwner = async (req, res, next) => {
  try {
    const { _id: userId } = req.user;
    const salon = await Salon.findOne({ owner: userId });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found',
      });
    }

    const isTheOwner = salon.owner.toString() === req.user.id.toString();
    // const isAdmin = req.user.role === 'admin';

    if (!isTheOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this salon',
      });
    }

    // 3. Attach the salon object to the request so the controller doesn't have to find it again
    req.salon = salon;

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Middleware Error',
      error: error.message,
    });
  }
};
