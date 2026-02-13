import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

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

export const admin = async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(`Admin Middleware Error: ${error.message}`);
    return res.status(401).json({ message: 'Not authorized, token invalid' });
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
