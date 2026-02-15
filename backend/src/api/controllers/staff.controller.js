import Staff from '../models/staff.model.js';
import Salon from '../models/salon.model.js';
import Booking from '../models/booking.model.js';
import Service from '../models/services.model.js';
import { minutesToTime, timeToMinutes } from '../library/utils.js';

export const getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.find();

    if (!staff) {
      return res
        .status(404)
        .json({ success: false, message: 'Staff not found' });
    }

    res.status(200).json({ success: true, count: staff.length, data: staff });
  } catch (error) {
    console.log('Error in getAllStaff:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStaffById = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await Staff.findById(id);

    if (!staff) {
      return res
        .status(404)
        .json({ success: false, message: 'Staff not found' });
    }

    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    console.log('Error in getStaffById:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createStaff = async (req, res) => {
  try {
    const staff = await Staff.create({ ...req.body, salon: req.salon._id });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
      });
    }

    req.salon.staff.push(staff._id);
    await req.salon.save();

    res.status(201).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, specialties, workingHours } = req.body;

    const staff = await Staff.findByIdAndUpdate(
      id,
      {
        name,
        specialties,
        workingHours,
      },
      { returnDocument: 'after', runValidators: true },
    );

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
      });
    }

    res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await Staff.findByIdAndDelete(id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
      });
    }

    await Salon.findByIdAndUpdate(req.salon._id, {
      $pull: { staff: id },
    });

    res.status(200).json({
      success: true,
      message: 'Staff deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getStaffBySalon = async (req, res) => {
  try {
    const { salonId } = req.params;

    const staff = await Staff.find({ salon: salonId });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
      });
    }

    res.status(200).json({
      success: true,
      count: staff.length,
      data: staff,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateStaffWorkingHours = async (req, res) => {
  try {
    const { id } = req.params;
    const { workingHours } = req.body;

    const staff = await Staff.findById(id);

    if (!staff) {
      return res
        .status(404)
        .json({ success: false, message: 'Staff not found' });
    }

    staff.workingHours = { ...staff.workingHours.toObject(), ...workingHours };

    await staff.save();

    res.status(200).json({
      success: true,
      message: 'Schedule updated successfully',
      data: staff,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getStaffAvailability = async (req, res) => {
  try {
    const { id } = req.params; // Staff ID
    const { date, serviceId } = req.query; // Need serviceId to know duration

    // 1. Get Staff and Service details
    const staff = await Staff.findById(id);
    const service = await Service.findById(serviceId);

    if (!staff || !service) {
      return res
        .status(404)
        .json({ success: false, message: 'Staff or Service not found' });
    }

    const duration = service.duration; // e.g., 60 (minutes)
    const dayName = new Date(date)
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase();
    const schedule = staff.workingHours[dayName];

    if (!schedule || schedule.isClosed)
      return res.status(200).json({ success: true, slots: [] });

    // 2. Fetch all bookings and map them to "busy ranges"
    const bookings = await Booking.find({
      staff: id,
      date: {
        $gte: new Date(date).setHours(0, 0, 0, 0),
        $lte: new Date(date).setHours(23, 59, 59, 999),
      },
      status: { $ne: 'cancelled' },
    }).populate('service'); // Populate to get the duration of existing bookings

    const busySlots = bookings.map((b) => ({
      start: timeToMinutes(b.time),
      end: timeToMinutes(b.time) + b.service.duration,
    }));

    // 3. Generate slots
    const availableSlots = [];
    let current = timeToMinutes(schedule.open);
    const closeTime = timeToMinutes(schedule.close);
    const interval = 30; // Check every 30 mins

    while (current + duration <= closeTime) {
      const slotStart = current;
      const slotEnd = current + duration;

      // Check if this window (start to end) overlaps with ANY existing booking
      const isOverlap = busySlots.some((busy) => {
        return slotStart < busy.end && slotEnd > busy.start;
      });

      if (!isOverlap) {
        availableSlots.push(minutesToTime(current));
      }
      current += interval;
    }

    res.status(200).json({ success: true, slots: availableSlots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStaffBookings = async (req, res) => {
  try {
    const { id } = req.params;
    const bookings = await Booking.find({ staff: id }).populate('service');

    res.status(200).json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
