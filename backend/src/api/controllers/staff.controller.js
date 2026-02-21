import Staff from '../models/staff.model.js';
import Salon from '../models/salon.model.js';
import Booking from '../models/booking.model.js';
import Service from '../models/services.model.js';
import User from '../models/user.model.js';
import {
  getDayOfWeek,
  minutesToTime,
  parseDateUTC,
  timeToMinutes,
} from '../library/utils.js';

export const getAllStaff = async (req, res) => {
  try {
    if (req.user.role === 'super-admin') {
      return res.status(200).json({
        success: true,
        message: 'Staff retrieved successfully',
        data: await Staff.find(),
      });
    }

    const salonId = req.user.salonId;

    const staff = await Staff.find({ salonId });

    if (!staff) {
      return res
        .status(404)
        .json({ success: false, message: 'Staff not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Staff retrieved successfully',
      count: staff.length,
      data: staff,
    });
  } catch (error) {
    console.log('Error in getAllStaff:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStaffById = async (req, res) => {
  try {
    const staff = req.staff;

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
    const { salonId } = req.user;
    const { userId, ...rest } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    if (user.role === 'super-admin') {
      return res.status(400).json({
        success: false,
        message: 'A super-admin cannot be added as staff',
      });
    }

    // ── Check membership in THIS salon only — not any salon ───────────────
    const alreadyInThisSalon = await Staff.exists({ userId, salonId });
    if (alreadyInThisSalon) {
      return res.status(409).json({
        success: false,
        message: 'This user is already a staff member of this salon',
      });
    }

    // ── Create staff record ────────────────────────────────────────────────
    const staff = await Staff.create({ ...rest, userId, salonId });

    // ── Promote role only if they are still a plain customer ──────────────
    // salon-owner keeps their role — they can moonlight as staff elsewhere
    if (user.role === 'customer') {
      await User.findByIdAndUpdate(userId, { role: 'staff' });
    }

    return res.status(201).json({
      success: true,
      message: 'Staff created successfully',
      data: staff,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await Staff.findByIdAndUpdate(id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Staff updated successfully',
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

    res.status(200).json({
      success: true,
      message: 'Staff deleted successfully',
      staff,
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

    const staff = await Staff.find({ salonId });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Staff retrieved successfully',
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
    const { workingHours } = req.body;

    const staff = req.staff;

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
    const { id } = req.params;
    const { date, serviceId } = req.query;

    // ── 1. Validate inputs ───────────────────────────────────────────────────
    if (!date || !serviceId) {
      return res.status(400).json({
        success: false,
        message: 'date and serviceId are required',
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'date must be in YYYY-MM-DD format',
      });
    }

    // ── 2. Reject past dates ─────────────────────────────────────────────────
    const requestedDate = parseDateUTC(date); // ✅ no timezone drift

    const todayUTC = new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate(),
      ),
    );

    if (requestedDate < todayUTC) {
      return res.status(400).json({
        success: false,
        message: 'Cannot check availability for a past date',
      });
    }

    // ── 3. Fetch staff and service ───────────────────────────────────────────
    const [staff, service] = await Promise.all([
      Staff.findById(id),
      Service.findById(serviceId),
    ]);

    if (!staff) {
      return res
        .status(404)
        .json({ success: false, message: 'Staff not found' });
    }
    if (!service) {
      return res
        .status(404)
        .json({ success: false, message: 'Service not found' });
    }

    // ── 4. Check staff works on this day ─────────────────────────────────────
    const dayOfWeek = getDayOfWeek(date); // ✅ derived from string, not Date object
    const schedule = staff.workingHours?.[dayOfWeek];

    if (!schedule || schedule.isClosed) {
      return res.status(200).json({ success: true, slots: [] });
    }

    // ── 5. Fetch existing bookings for that day ───────────────────────────────
    // requestedDate = "2026-02-23T00:00:00.000Z"
    // next day      = "2026-02-24T00:00:00.000Z"
    // This correctly brackets all bookings stored on that UTC date ✅
    const nextDayUTC = new Date(requestedDate.getTime() + 24 * 60 * 60 * 1000);

    const bookings = await Booking.find({
      staffId: id, // ✅ was: staff: id
      date: { $gte: requestedDate, $lt: nextDayUTC }, // ✅ correct UTC range
      status: { $nin: ['cancelled'] },
    });

    // ── 6. Map bookings to busy minute ranges ─────────────────────────────────
    const busySlots = bookings.map((b) => ({
      start: timeToMinutes(b.timeSlot.start), // ✅ was: b.time
      end: timeToMinutes(b.timeSlot.end), // ✅ use stored end directly
    }));

    // ── 7. Generate available slots ───────────────────────────────────────────
    const openTime = timeToMinutes(schedule.open);
    const closeTime = timeToMinutes(schedule.close);
    const duration = service.duration;
    const interval = 30; // every 30 mins

    const isToday = requestedDate.getTime() === todayUTC.getTime();
    const nowInMinutes = new Date().getHours() * 60 + new Date().getMinutes();

    const availableSlots = [];
    let current = openTime;

    while (current + duration <= closeTime) {
      // Skip past slots if booking for today
      if (isToday && current < nowInMinutes) {
        current += interval;
        continue;
      }

      const slotEnd = current + duration;

      const isOverlapping = busySlots.some(
        (busy) => current < busy.end && slotEnd > busy.start,
      );

      if (!isOverlapping) {
        availableSlots.push(minutesToTime(current));
      }

      current += interval;
    }

    return res.status(200).json({ success: true, slots: availableSlots });
  } catch (error) {
    console.error('getStaffAvailability error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getStaffBookings = async (req, res) => {
  try {
    const { id } = req.params;
    const bookings = await Booking.find({ staffId: id }).populate('serviceId');

    res.status(200).json({
      success: true,
      message: 'Bookings retrieved successfully',
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
