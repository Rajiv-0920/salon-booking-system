import User from '../models/user.model.js';
import Booking from '../models/booking.model.js';

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.log(`Error in getAllUsers controller: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.log(`Error in getUserById controller: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    if (req.body.role && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can change user roles',
      });
    }

    const allowedUpdates = ['name', 'email', 'phone', 'role'];

    allowedUpdates.forEach((update) => {
      if (req.body[update] !== undefined) {
        user[update] = req.body[update];
      }
    });

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: 'Email already in use' });
    }

    res
      .status(500)
      .json({ success: false, message: 'Server Error', error: error.message });
  }
};

export const deleteUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Server Error', error: error.message });
  }
};

export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.params.id })
      .populate('salon', 'name address')
      .populate('service', 'name price')
      .populate('staff', 'name')
      .sort({ date: -1, time: -1 });

    if (!bookings || bookings.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'No bookings found' });
    }

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.log(`Error in getUserBookings: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};
