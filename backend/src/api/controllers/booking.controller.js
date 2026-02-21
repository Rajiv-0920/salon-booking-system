import Booking from '../models/booking.model.js';
import Staff from '../models/staff.model.js';
import Service from '../models/services.model.js';
import User from '../models/user.model.js';
import Salon from '../models/salon.model.js';
import {
  isValidTimeFormat,
  minutesToTime,
  timeToMinutes,
  isValidDateFormat,
  getDayOfWeek,
  parseDateUTC,
} from '../library/utils.js';

export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'name email')
      .populate('serviceId', 'name duration')
      .populate('staffId', 'name email');
    res.status(200).json({
      success: true,
      message: 'Bookings retrieved successfully',
      bookings,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getSingleBooking = async (req, res) => {
  try {
    const booking = req.booking;
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Booking retrieved successfully',
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createBooking = async (req, res) => {
  try {
    const { salonId, staffId, serviceId, date, timeSlot, notes } = req.body;

    // ── 1. Required fields ───────────────────────────────────────────────────
    if (!salonId || !staffId || !serviceId || !date || !timeSlot?.start) {
      return res.status(400).json({
        message:
          'salonId, staffId, serviceId, date, and timeSlot.start are required',
      });
    }

    // ── 2. Validate formats ──────────────────────────────────────────────────
    if (!isValidDateFormat(date)) {
      return res.status(400).json({
        message: 'date must be in YYYY-MM-DD format',
      });
    }

    if (!isValidTimeFormat(timeSlot.start)) {
      return res.status(400).json({
        message: 'timeSlot.start must be in HH:MM format',
      });
    }

    // ── 3. Parse date safely (no timezone drift) ─────────────────────────────
    const requestedDate = parseDateUTC(date); // e.g. 2026-02-23T00:00:00.000Z
    const dayOfWeek = getDayOfWeek(date); // e.g. "monday"

    // ── 4. Reject past dates ─────────────────────────────────────────────────
    const todayUTC = new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate(),
      ),
    );

    if (requestedDate < todayUTC) {
      return res
        .status(400)
        .json({ message: 'Booking date cannot be in the past' });
    }

    // ── 5. Fetch salon ───────────────────────────────────────────────────────
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }
    if (!salon.isAvailable) {
      return res
        .status(400)
        .json({ message: 'Salon is not accepting bookings' });
    }

    // ── 6. Fetch service and verify it belongs to this salon ─────────────────
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    if (service.salonId.toString() !== salonId) {
      return res
        .status(400)
        .json({ message: 'Service does not belong to this salon' });
    }

    // ── 7. Fetch staff and verify they belong to this salon ──────────────────
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    if (staff.salonId.toString() !== salonId) {
      return res
        .status(400)
        .json({ message: 'Staff does not belong to this salon' });
    }

    // ── 8. Derive end time from service duration (never trust client) ─────────
    const startMinutes = timeToMinutes(timeSlot.start);
    const endMinutes = startMinutes + service.duration;
    const derivedEnd = minutesToTime(endMinutes);

    // If client sent an end time, make sure it matches the service duration
    if (timeSlot.end && timeSlot.end !== derivedEnd) {
      return res.status(400).json({
        message: `timeSlot.end does not match service duration of ${service.duration} mins. Expected ${derivedEnd}`,
      });
    }

    const finalTimeSlot = { start: timeSlot.start, end: derivedEnd };

    // ── 9. Check salon is open on the requested day ──────────────────────────
    const workingHours = salon.workingHours?.[dayOfWeek];
    if (!workingHours || workingHours.isClosed) {
      return res.status(400).json({
        message: `Salon is closed on ${dayOfWeek}`,
      });
    }

    // ── 10. Check the date is not a holiday ──────────────────────────────────
    const isHoliday = salon.holidays?.some((h) => {
      const holidayUTC = parseDateUTC(
        new Date(h).toISOString().split('T')[0], // normalize to YYYY-MM-DD
      );
      return holidayUTC.getTime() === requestedDate.getTime();
    });

    if (isHoliday) {
      return res.status(400).json({ message: 'Salon is closed on this date' });
    }

    // ── 11. Check time slot is within working hours ───────────────────────────
    if (
      finalTimeSlot.start < workingHours.open ||
      finalTimeSlot.end > workingHours.close
    ) {
      return res.status(400).json({
        message: `Requested time is outside salon working hours (${workingHours.open} - ${workingHours.close})`,
      });
    }

    // ── 12. Check staff has no overlapping bookings ───────────────────────────
    const staffConflict = await Booking.findOne({
      staffId,
      date: requestedDate,
      status: { $nin: ['cancelled'] },
      $or: [
        {
          'timeSlot.start': {
            $gte: finalTimeSlot.start,
            $lt: finalTimeSlot.end,
          },
        },
        {
          'timeSlot.end': { $gt: finalTimeSlot.start, $lte: finalTimeSlot.end },
        },
        {
          'timeSlot.start': { $lte: finalTimeSlot.start },
          'timeSlot.end': { $gte: finalTimeSlot.end },
        },
      ],
    });

    if (staffConflict) {
      return res.status(409).json({
        message: 'Staff is not available at the requested time slot',
      });
    }

    // ── 13. Check user has no conflicting bookings ────────────────────────────
    const userConflict = await Booking.findOne({
      userId: req.user._id,
      date: requestedDate,
      status: { $nin: ['cancelled'] },
      $or: [
        {
          'timeSlot.start': {
            $gte: finalTimeSlot.start,
            $lt: finalTimeSlot.end,
          },
        },
        {
          'timeSlot.end': { $gt: finalTimeSlot.start, $lte: finalTimeSlot.end },
        },
      ],
    });

    if (userConflict) {
      return res.status(409).json({
        message: 'You already have a booking that overlaps with this time slot',
      });
    }

    // ── 14. Create booking ────────────────────────────────────────────────────
    const booking = await Booking.create({
      userId: req.user._id, // always from JWT, never from body
      salonId,
      staffId,
      serviceId,
      date: requestedDate, // 2026-02-23T00:00:00.000Z — correct ✅
      timeSlot: finalTimeSlot,
      status: 'pending',
      price: service.price, // snapshotted — preserved if price changes later
      notes: notes?.trim() || undefined,
    });

    // ── 15. Notifications (non-blocking) ──────────────────────────────────────
    // await Promise.allSettled([
    //   sendBookingConfirmationEmail(req.user, booking, salon, service),
    //   sendOwnerNotification(salon.ownerId, booking),
    // ]);

    return res.status(201).json({
      message: 'Booking created successfully',
      booking,
    });
  } catch (error) {
    console.error('createBooking error:', error);
    return res.status(500).json({
      message: 'Something went wrong',
      error: error.message,
    });
  }
};

export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { staffId, serviceId, date, timeSlot, notes } = req.body;

    // ── 1. At least one field must be provided ───────────────────────────────
    if (!staffId && !serviceId && !date && !timeSlot && notes === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Nothing to update. Provide at least one field to change',
      });
    }

    // ── 2. Validate formats if provided ─────────────────────────────────────
    if (date && !isValidDateFormat(date)) {
      return res.status(400).json({
        success: false,
        message: 'date must be in YYYY-MM-DD format',
      });
    }

    if (timeSlot?.start && !isValidTimeFormat(timeSlot.start)) {
      return res.status(400).json({
        success: false,
        message: 'timeSlot.start must be in HH:MM format',
      });
    }

    // ── 3. Find existing booking ─────────────────────────────────────────────
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // ── 4. Only allow pending or confirmed bookings to be updated ────────────
    if (['cancelled', 'completed', 'no_show'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot update a booking that is already ${booking.status}`,
      });
    }

    // ── 5. Resolve final values (new value or fall back to existing) ─────────
    const finalStaffId = staffId || booking.staffId.toString();
    const finalServiceId = serviceId || booking.serviceId.toString();
    const finalDateStr = date || booking.date.toISOString().split('T')[0];
    const finalStart = timeSlot?.start || booking.timeSlot.start;

    // ── 6. Validate future date ──────────────────────────────────────────────
    const requestedDate = parseDateUTC(finalDateStr); // ✅ no timezone drift

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
        message: 'Booking date cannot be in the past',
      });
    }

    // ── 7. Fetch service (needed for duration + price) ───────────────────────
    const service = await Service.findById(finalServiceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    // If service changed, verify it still belongs to the same salon
    if (serviceId && serviceId !== booking.serviceId.toString()) {
      if (service.salonId.toString() !== booking.salonId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'New service does not belong to the same salon',
        });
      }
    }

    // ── 8. Derive end time from service duration ─────────────────────────────
    const startMinutes = timeToMinutes(finalStart);
    const endMinutes = startMinutes + service.duration;
    const finalEnd = minutesToTime(endMinutes);
    const finalTimeSlot = { start: finalStart, end: finalEnd };

    // ── 9. Fetch staff and validate ──────────────────────────────────────────
    const staff = await Staff.findById(finalStaffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
      });
    }

    // If staff changed, verify they belong to the same salon
    if (staffId && staffId !== booking.staffId.toString()) {
      if (staff.salonId.toString() !== booking.salonId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'New staff does not belong to the same salon',
        });
      }
    }

    // ── 10. Check staff works on this day ────────────────────────────────────
    const dayOfWeek = getDayOfWeek(finalDateStr); // ✅ derived from string
    const schedule = staff.workingHours?.[dayOfWeek];

    if (!schedule || schedule.isClosed) {
      return res.status(400).json({
        success: false,
        message: `Staff is not working on ${dayOfWeek}`,
      });
    }

    // ── 11. Check time slot is within staff working hours ────────────────────
    if (
      finalTimeSlot.start < schedule.open ||
      finalTimeSlot.end > schedule.close
    ) {
      return res.status(400).json({
        success: false,
        message: `Requested time is outside staff working hours (${schedule.open} - ${schedule.close})`,
      });
    }

    // ── 12. Check staff has no overlapping bookings (excluding this booking) ──
    const nextDayUTC = new Date(requestedDate.getTime() + 24 * 60 * 60 * 1000);

    const staffConflict = await Booking.findOne({
      _id: { $ne: id }, // ✅ exclude current booking from check
      staffId: finalStaffId,
      date: { $gte: requestedDate, $lt: nextDayUTC },
      status: { $nin: ['cancelled'] },
      $or: [
        {
          'timeSlot.start': {
            $gte: finalTimeSlot.start,
            $lt: finalTimeSlot.end,
          },
        },
        {
          'timeSlot.end': { $gt: finalTimeSlot.start, $lte: finalTimeSlot.end },
        },
        {
          'timeSlot.start': { $lte: finalTimeSlot.start },
          'timeSlot.end': { $gte: finalTimeSlot.end },
        },
      ],
    });

    if (staffConflict) {
      return res.status(409).json({
        success: false,
        message: 'Staff is not available at the requested time slot',
      });
    }

    // ── 13. Check user has no other conflicting bookings ─────────────────────
    const userConflict = await Booking.findOne({
      _id: { $ne: id }, // ✅ exclude current booking from check
      userId: booking.userId,
      date: { $gte: requestedDate, $lt: nextDayUTC },
      status: { $nin: ['cancelled'] },
      $or: [
        {
          'timeSlot.start': {
            $gte: finalTimeSlot.start,
            $lt: finalTimeSlot.end,
          },
        },
        {
          'timeSlot.end': { $gt: finalTimeSlot.start, $lte: finalTimeSlot.end },
        },
      ],
    });

    if (userConflict) {
      return res.status(409).json({
        success: false,
        message: 'You already have a booking that overlaps with this time slot',
      });
    }

    // ── 14. Apply updates ────────────────────────────────────────────────────
    booking.staffId = finalStaffId;
    booking.serviceId = finalServiceId;
    booking.date = requestedDate; // ✅ parsed UTC — no drift
    booking.timeSlot = finalTimeSlot; // ✅ start + derived end
    booking.price = service.price; // ✅ recalculated if service changed
    booking.status = 'pending'; // reset to pending after reschedule

    if (notes !== undefined) {
      booking.notes = notes?.trim() || undefined;
    }

    await booking.save();

    return res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      booking,
    });
  } catch (error) {
    console.error('updateBooking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
      error: error.message,
    });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const booking = req.booking;

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled',
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed booking',
      });
    }

    if (booking.status === 'no_show') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a no-show booking',
      });
    }

    // ── 2. Enforce cancellation window (optional — e.g. 2 hours before) ───
    const bookingDateTime = new Date(booking.date);
    const [hours, minutes] = booking.timeSlot.start.split(':').map(Number);
    bookingDateTime.setUTCHours(hours, minutes, 0, 0);

    const now = new Date();
    const hoursUntilBooking = (bookingDateTime - now) / (1000 * 60 * 60);

    // Only enforce the window for customers — owners and superadmin can
    // cancel anytime
    if (req.user.role === 'customer' && hoursUntilBooking < 2) {
      return res.status(400).json({
        success: false,
        message:
          'Bookings can only be cancelled at least 2 hours before the appointment',
      });
    }

    // ── 3. Cancel the booking ──────────────────────────────────────────────
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();

    // ── 4. Notify (non-blocking) ───────────────────────────────────────────
    // await Promise.allSettled([
    //   sendCancellationEmail(booking.userId, booking),
    //   sendOwnerCancellationNotification(booking.salonId, booking),
    // ]);

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      booking,
    });
  } catch (error) {
    console.error('cancelBooking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────
// RESCHEDULE BOOKING
// POST /api/bookings/:id/reschedule
// Access: customer (own) | owner (own salon) | superadmin
// Body: { date, timeSlot: { start } }
// ─────────────────────────────────────────────────────────────────────────
export const rescheduleBooking = async (req, res) => {
  try {
    const booking = req.booking; // attached by middleware
    const { date, timeSlot } = req.body;

    // ── 1. Require date and timeSlot.start ────────────────────────────────
    if (!date || !timeSlot?.start) {
      return res.status(400).json({
        success: false,
        message: 'date and timeSlot.start are required to reschedule',
      });
    }

    // ── 2. Validate formats ───────────────────────────────────────────────
    if (!isValidDateFormat(date)) {
      return res.status(400).json({
        success: false,
        message: 'date must be in YYYY-MM-DD format',
      });
    }

    if (!isValidTimeFormat(timeSlot.start)) {
      return res.status(400).json({
        success: false,
        message: 'timeSlot.start must be in HH:MM format',
      });
    }

    // ── 3. Check booking can still be rescheduled ─────────────────────────
    if (['cancelled', 'completed', 'no_show'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule a booking that is already ${booking.status}`,
      });
    }

    // ── 4. New date must be in the future ─────────────────────────────────
    const newDate = parseDateUTC(date);

    const todayUTC = new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate(),
      ),
    );

    if (newDate < todayUTC) {
      return res.status(400).json({
        success: false,
        message: 'Reschedule date cannot be in the past',
      });
    }

    // ── 5. Prevent rescheduling to the same date and time ─────────────────
    const existingDateStr = booking.date.toISOString().split('T')[0];
    if (date === existingDateStr && timeSlot.start === booking.timeSlot.start) {
      return res.status(400).json({
        success: false,
        message: 'New date and time are the same as the current booking',
      });
    }

    // ── 6. Fetch service for duration ─────────────────────────────────────
    const service = await Service.findById(booking.serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    // ── 7. Derive new end time ────────────────────────────────────────────
    const startMinutes = timeToMinutes(timeSlot.start);
    const endMinutes = startMinutes + service.duration;
    const newTimeSlot = {
      start: timeSlot.start,
      end: minutesToTime(endMinutes),
    };

    // ── 8. Check staff works on the new day ───────────────────────────────
    const staff = await Staff.findById(booking.staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
      });
    }

    const dayOfWeek = getDayOfWeek(date); // ✅ derived from string
    const schedule = staff.workingHours?.[dayOfWeek];

    if (!schedule || schedule.isClosed) {
      return res.status(400).json({
        success: false,
        message: `Staff is not working on ${dayOfWeek}`,
      });
    }

    // ── 9. Check new time is within staff working hours ───────────────────
    if (newTimeSlot.start < schedule.open || newTimeSlot.end > schedule.close) {
      return res.status(400).json({
        success: false,
        message: `Requested time is outside staff working hours (${schedule.open} - ${schedule.close})`,
      });
    }

    // ── 10. Check no overlapping staff bookings (excluding self) ──────────
    const nextDayUTC = new Date(newDate.getTime() + 24 * 60 * 60 * 1000);

    const staffConflict = await Booking.findOne({
      _id: { $ne: booking._id }, // ✅ exclude self
      staffId: booking.staffId,
      date: { $gte: newDate, $lt: nextDayUTC },
      status: { $nin: ['cancelled'] },
      $or: [
        { 'timeSlot.start': { $gte: newTimeSlot.start, $lt: newTimeSlot.end } },
        { 'timeSlot.end': { $gt: newTimeSlot.start, $lte: newTimeSlot.end } },
        {
          'timeSlot.start': { $lte: newTimeSlot.start },
          'timeSlot.end': { $gte: newTimeSlot.end },
        },
      ],
    });

    if (staffConflict) {
      return res.status(409).json({
        success: false,
        message: 'Staff is not available at the requested time slot',
      });
    }

    // ── 11. Check user has no conflicting bookings (excluding self) ────────
    const userConflict = await Booking.findOne({
      _id: { $ne: booking._id }, // ✅ exclude self
      userId: booking.userId,
      date: { $gte: newDate, $lt: nextDayUTC },
      status: { $nin: ['cancelled'] },
      $or: [
        { 'timeSlot.start': { $gte: newTimeSlot.start, $lt: newTimeSlot.end } },
        { 'timeSlot.end': { $gt: newTimeSlot.start, $lte: newTimeSlot.end } },
      ],
    });

    if (userConflict) {
      return res.status(409).json({
        success: false,
        message: 'You already have a booking that overlaps with this time slot',
      });
    }

    // ── 12. Apply reschedule ───────────────────────────────────────────────
    booking.date = newDate;
    booking.timeSlot = newTimeSlot;
    booking.status = 'pending'; // reset — owner needs to re-confirm
    await booking.save();

    // ── 13. Notify (non-blocking) ──────────────────────────────────────────
    // await Promise.allSettled([
    //   sendRescheduleConfirmationEmail(booking.userId, booking, service),
    //   sendOwnerRescheduleNotification(booking.salonId, booking),
    // ]);

    return res.status(200).json({
      success: true,
      message: 'Booking rescheduled successfully',
      booking,
    });
  } catch (error) {
    console.error('rescheduleBooking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
      error: error.message,
    });
  }
};

export const getUserBookings = async (req, res) => {
  try {
    const { userId } = req.params;

    const bookings = await Booking.find({ userId })
      .populate('serviceId', 'name duration price description')
      .populate('staffId', 'name');

    res
      .status(200)
      .json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSalonBookings = async (req, res) => {
  const { id } = req.params;

  try {
    const bookings = await Booking.find({ salonId: id });
    res
      .status(200)
      .json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUpcomingBookings = async (req, res) => {
  try {
    const todayUTC = new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate(),
      ),
    );

    const filter = {
      date: { $gte: todayUTC },
      status: { $nin: ['cancelled', 'completed', 'no_show'] }, // pending + confirmed
    };

    // Scope by role — each role only sees their own context
    if (req.user.role === 'customer') {
      filter.userId = req.user._id;
    } else if (req.user.role === 'salon-owner') {
      filter.salonId = req.user.salonId;
    } else if (req.user.role === 'staff') {
      filter.staffId = req.user._id;
    }
    // super-admin — no filter, sees all

    const bookings = await Booking.find(filter)
      .populate('userId', 'name email')
      .populate('serviceId', 'name duration price')
      .populate('staffId', 'name')
      .sort({ date: 1, 'timeSlot.start': 1 }); // nearest first

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getPastBookings = async (req, res) => {
  try {
    const todayUTC = new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate(),
      ),
    );

    const filter = {
      $or: [
        { date: { $lt: todayUTC } },
        { status: { $in: ['completed', 'cancelled', 'no_show'] } },
      ],
    };

    if (req.user.role === 'customer') filter.userId = req.user._id;
    if (req.user.role === 'salon-owner') filter.salonId = req.user.salonId;
    if (req.user.role === 'staff') filter.staffId = req.user._id;

    const bookings = await Booking.find(filter)
      .populate('userId', 'name email')
      .populate('serviceId', 'name duration price')
      .populate('staffId', 'name')
      .sort({ date: -1, 'timeSlot.start': -1 }); // most recent first

    return res
      .status(200)
      .json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const booking = req.booking; // from verifyBookingSalonOwnership
    const { status } = req.body;

    const validStatuses = ['confirmed', 'cancelled', 'completed', 'no_show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // ── Enforce valid transitions ──────────────────────────────────────────
    const allowedTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled', 'no_show'],
      completed: [], // terminal
      cancelled: [], // terminal
      no_show: [], // terminal
    };

    if (!allowedTransitions[booking.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from '${booking.status}' to '${status}'`,
      });
    }

    booking.status = status;
    await booking.save(); // pre-save hook sets confirmedAt/completedAt/cancelledAt

    return res.status(200).json({
      success: true,
      message: `Booking marked as ${status}`,
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const checkAvailability = async (req, res) => {
  try {
    const { salonId, staffId, date, timeSlot } = req.body;

    if (!salonId || !staffId || !date || !timeSlot?.start) {
      return res.status(400).json({
        success: false,
        message: 'salonId, staffId, date and timeSlot.start are required',
      });
    }

    const requestedDate = parseDateUTC(date);
    const nextDayUTC = new Date(requestedDate.getTime() + 24 * 60 * 60 * 1000);

    const conflict = await Booking.findOne({
      staffId,
      date: { $gte: requestedDate, $lt: nextDayUTC },
      status: { $nin: ['cancelled'] },
      $or: [
        { 'timeSlot.start': { $gte: timeSlot.start, $lt: timeSlot.end } },
        { 'timeSlot.end': { $gt: timeSlot.start, $lte: timeSlot.end } },
        {
          'timeSlot.start': { $lte: timeSlot.start },
          'timeSlot.end': { $gte: timeSlot.end },
        },
      ],
    });

    return res.status(200).json({
      success: true,
      available: !conflict, // true = free, false = taken
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getTodayBookings = async (req, res) => {
  try {
    const todayUTC = new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate(),
      ),
    );
    const tomorrowUTC = new Date(todayUTC.getTime() + 24 * 60 * 60 * 1000);

    const filter = {
      date: { $gte: todayUTC, $lt: tomorrowUTC },
      status: { $nin: ['cancelled'] },
    };

    // Owner sees all bookings for their salon
    // Staff sees only their own bookings for today
    if (req.user.role === 'salon-owner') filter.salonId = req.user.salonId;
    if (req.user.role === 'staff') filter.staffId = req.user._id;

    const bookings = await Booking.find(filter)
      .populate('userId', 'name phone')
      .populate('serviceId', 'name duration')
      .populate('staffId', 'name')
      .sort({ 'timeSlot.start': 1 }); // chronological order

    return res
      .status(200)
      .json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCalendarBookings = async (req, res) => {
  try {
    const { salonId } = req.params;
    const { startDate, endDate } = req.query; // e.g. ?startDate=2026-03-01&endDate=2026-03-31

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query params are required',
      });
    }

    const start = parseDateUTC(startDate);
    const end = parseDateUTC(endDate);
    const nextDay = new Date(end.getTime() + 24 * 60 * 60 * 1000);

    const filter = {
      salonId,
      date: { $gte: start, $lt: nextDay },
      status: { $nin: ['cancelled'] },
    };

    // Staff only see their own bookings in the calendar
    if (req.user.role === 'staff') filter.staffId = req.user._id;

    const bookings = await Booking.find(filter)
      .populate('userId', 'name')
      .populate('serviceId', 'name duration')
      .populate('staffId', 'name')
      .sort({ date: 1, 'timeSlot.start': 1 });

    return res
      .status(200)
      .json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
