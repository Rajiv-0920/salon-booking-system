import sendEmail from '../library/email.js';
import { generateToken } from '../library/utils.js';
import User from '../models/user.model.js';
import crypto from 'crypto';
import Booking from '../models/booking.model.js';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    let user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (role !== 'customer' && role !== 'salon-owner') {
      return res.status(400).json({ message: 'Invalid role' });
    }

    user = new User({
      name,
      email: email.toLowerCase().trim(),
      password,
      phone,
      role,
    });

    await user.save();

    const token = generateToken(res, { id: user._id, role: user.role });
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.log(`Error registering user: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        message: 'Your account has been suspended. Please contact support.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(res, { id: user._id, role: user.role });
    res.status(200).json({
      success: true,
      message: 'User logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.log(`Error logging in user: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const logout = async (req, res) => {
  res.cookie('token', '', {
    expires: new Date(Date.now() + 10 * 1000), // Expires in 10 seconds
    httpOnly: true,
  });

  res.status(200).json({ success: true, message: 'User logged out' });
};

export const getCurrentLoginUser = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res
      .status(200)
      .json({ success: true, message: 'Get User successfully', user });
  } catch (error) {
    console.log(`Error getting current login user: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email.`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Your password reset token (valid for 10 minutes)',
        message,
        resetURL,
      });

      res.status(200).json({ success: true, message: 'Email sent' });
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      console.log(`Error sending email: ${error.message}`);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  } catch (error) {
    console.log(`Error sending email: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, passwordConfirm } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    user.password = password;
    user.passwordConfirm = passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    res
      .status(200)
      .json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.log(`Error resetting password: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, newPasswordConfirm } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    if (
      !user ||
      !(await user.comparePassword(currentPassword, user.password))
    ) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    user.password = newPassword;
    user.passwordConfirm = newPasswordConfirm;

    await user.save({ validateBeforeSave: false });

    res
      .status(200)
      .json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.log(`Error updating password: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name;
    user.phone = phone;

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    console.log(`Error updating profile: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const userId = req.user._id;

    const bookings = await Booking.find({ user: userId });

    res
      .status(200)
      .json({ success: true, message: 'Get bookings successfully', bookings });
  } catch (error) {
    console.log(`Error fetching bookings: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
