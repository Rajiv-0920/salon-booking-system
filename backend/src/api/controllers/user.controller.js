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
    const { id } = req.params;

    const user = await User.findById(id);

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
    const { id } = req.params;
    const forbiddenFields = ['role', 'password'];

    if (req.user.role !== 'super-admin') {
      forbiddenFields.forEach((field) => delete req.body[field]);
    }

    const user = await User.findByIdAndUpdate(id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
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
    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: deletedUser,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Server Error', error: error.message });
  }
};

export const getUserBookings = async (req, res) => {
  try {
    const { id } = req.params;

    const userBookings = await Booking.find({ userId: id }).populate(
      'service staff',
    );

    res
      .status(200)
      .json({ success: true, count: userBookings.length, data: userBookings });
  } catch (error) {
    console.log(`Error in getUserBookings: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};
