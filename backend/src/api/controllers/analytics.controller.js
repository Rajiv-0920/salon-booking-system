import Booking from '../models/booking.model.js';
import Review from '../models/review.model.js';
import Salon from '../models/salon.model.js';
import Service from '../models/services.model.js';
import User from '../models/user.model.js';
import mongoose from 'mongoose';
import { parseDateUTC } from '../library/utils.js';

// ─────────────────────────────────────────────────────────────────────────────
// SALON OVERVIEW
// GET /api/analytics/salon/:salonId/overview
// Returns: total bookings, revenue, avg rating, total customers, this month stats
// Access: salon-owner (own salon) | super-admin
// ─────────────────────────────────────────────────────────────────────────────
export const getSalonOverview = async (req, res) => {
  try {
    const { salonId } = req.params;
    console.log(salonId);

    const salonObjectId = new mongoose.Types.ObjectId(salonId);

    const now = new Date();
    const startOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const startOfLastMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
    );
    const endOfLastMonth = new Date(startOfMonth.getTime() - 1);

    const [
      totalStats,
      thisMonthStats,
      lastMonthStats,
      avgRating,
      totalReviews,
      pendingBookings,
    ] = await Promise.all([
      // All time totals
      Booking.aggregate([
        { $match: { salonId: salonObjectId, status: { $nin: ['cancelled'] } } },
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            totalRevenue: { $sum: '$price' },
            totalCustomers: { $addToSet: '$userId' },
          },
        },
      ]),

      // This month
      Booking.aggregate([
        {
          $match: {
            salonId: salonObjectId,
            status: { $nin: ['cancelled'] },
            date: { $gte: startOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            bookings: { $sum: 1 },
            revenue: { $sum: '$price' },
          },
        },
      ]),

      // Last month (for growth comparison)
      Booking.aggregate([
        {
          $match: {
            salonId: salonObjectId,
            status: { $nin: ['cancelled'] },
            date: { $gte: startOfLastMonth, $lte: endOfLastMonth },
          },
        },
        {
          $group: {
            _id: null,
            bookings: { $sum: 1 },
            revenue: { $sum: '$price' },
          },
        },
      ]),

      // Avg rating
      Review.aggregate([
        { $match: { salonId: salonObjectId } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } },
      ]),

      Review.countDocuments({ salonId }),
      Booking.countDocuments({ salonId, status: 'pending' }),
    ]);

    const total = totalStats[0] || {
      totalBookings: 0,
      totalRevenue: 0,
      totalCustomers: [],
    };
    const thisMonth = thisMonthStats[0] || { bookings: 0, revenue: 0 };
    const lastMonth = lastMonthStats[0] || { bookings: 0, revenue: 0 };

    // Growth % compared to last month
    const bookingGrowth =
      lastMonth.bookings === 0
        ? 100
        : (
            ((thisMonth.bookings - lastMonth.bookings) / lastMonth.bookings) *
            100
          ).toFixed(1);

    const revenueGrowth =
      lastMonth.revenue === 0
        ? 100
        : (
            ((thisMonth.revenue - lastMonth.revenue) / lastMonth.revenue) *
            100
          ).toFixed(1);

    return res.status(200).json({
      success: true,
      data: {
        allTime: {
          totalBookings: total.totalBookings,
          totalRevenue: total.totalRevenue,
          totalCustomers: total.totalCustomers.length,
        },
        thisMonth: {
          bookings: thisMonth.bookings,
          revenue: thisMonth.revenue,
          bookingGrowth: `${bookingGrowth}%`,
          revenueGrowth: `${revenueGrowth}%`,
        },
        ratings: {
          avgRating: Number(avgRating[0]?.avgRating.toFixed(1)) || 0,
          totalReviews,
        },
        pendingBookings,
      },
    });
  } catch (error) {
    console.error('getSalonOverview error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// REVENUE ANALYTICS
// GET /api/analytics/salon/:salonId/revenue?period=monthly&year=2026
// Returns: revenue broken down by day/month/year
// Access: salon-owner (own salon) | super-admin
// ─────────────────────────────────────────────────────────────────────────────
export const getSalonRevenue = async (req, res) => {
  try {
    const { salonId } = req.params;
    const { period = 'monthly', year = new Date().getUTCFullYear() } =
      req.query;
    const salonObjectId = new mongoose.Types.ObjectId(salonId);

    let groupBy;
    let matchDate;

    if (period === 'daily') {
      // Last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      matchDate = { $gte: thirtyDaysAgo };
      groupBy = {
        year: { $year: '$date' },
        month: { $month: '$date' },
        day: { $dayOfMonth: '$date' },
      };
    } else if (period === 'monthly') {
      // All months of the given year
      matchDate = {
        $gte: new Date(Date.UTC(Number(year), 0, 1)),
        $lte: new Date(Date.UTC(Number(year), 11, 31)),
      };
      groupBy = {
        year: { $year: '$date' },
        month: { $month: '$date' },
      };
    } else if (period === 'yearly') {
      // Last 5 years
      const fiveYearsAgo = new Date(
        Date.UTC(new Date().getUTCFullYear() - 4, 0, 1),
      );
      matchDate = { $gte: fiveYearsAgo };
      groupBy = { year: { $year: '$date' } };
    }

    const revenue = await Booking.aggregate([
      {
        $match: {
          salonId: salonObjectId,
          status: 'completed',
          date: matchDate,
        },
      },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$price' },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        period,
        year,
        revenue,
      },
    });
  } catch (error) {
    console.error('getSalonRevenue error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POPULAR SERVICES
// GET /api/analytics/salon/:salonId/popular-services?limit=5
// Returns: most booked services ranked by booking count
// Access: salon-owner (own salon) | super-admin
// ─────────────────────────────────────────────────────────────────────────────
export const getPopularServices = async (req, res) => {
  try {
    const { salonId } = req.params;
    const { limit = 5 } = req.query;
    const salonObjectId = new mongoose.Types.ObjectId(salonId);

    const services = await Booking.aggregate([
      {
        $match: {
          salonId: salonObjectId,
          status: { $nin: ['cancelled'] },
        },
      },
      {
        $group: {
          _id: '$serviceId',
          bookings: { $sum: 1 },
          revenue: { $sum: '$price' },
        },
      },
      { $sort: { bookings: -1 } },
      { $limit: Number(limit) },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'service',
        },
      },
      { $unwind: '$service' },
      {
        $project: {
          _id: 0,
          serviceId: '$_id',
          name: '$service.name',
          category: '$service.category',
          price: '$service.price',
          duration: '$service.duration',
          totalBookings: '$bookings',
          totalRevenue: '$revenue',
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error('getPopularServices error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PEAK HOURS
// GET /api/analytics/salon/:salonId/peak-hours
// Returns: booking count grouped by hour of day and day of week
// Access: salon-owner (own salon) | super-admin
// ─────────────────────────────────────────────────────────────────────────────
export const getPeakHours = async (req, res) => {
  try {
    const { salonId } = req.params;
    const salonObjectId = new mongoose.Types.ObjectId(salonId);

    // Group by start hour extracted from timeSlot.start string "HH:MM"
    const peakHours = await Booking.aggregate([
      {
        $match: {
          salonId: salonObjectId,
          status: { $nin: ['cancelled'] },
        },
      },
      {
        // Extract hour from "HH:MM" string
        $addFields: {
          hour: {
            $toInt: { $substr: ['$timeSlot.start', 0, 2] },
          },
          dayOfWeek: { $dayOfWeek: '$date' }, // 1=Sun, 2=Mon ... 7=Sat
        },
      },
      {
        $group: {
          _id: { hour: '$hour', dayOfWeek: '$dayOfWeek' },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { bookings: -1 } },
      {
        $project: {
          _id: 0,
          hour: '$_id.hour',
          dayOfWeek: '$_id.dayOfWeek',
          bookings: 1,
        },
      },
    ]);

    // Busiest hour overall
    const byHour = await Booking.aggregate([
      {
        $match: {
          salonId: salonObjectId,
          status: { $nin: ['cancelled'] },
        },
      },
      {
        $addFields: {
          hour: { $toInt: { $substr: ['$timeSlot.start', 0, 2] } },
        },
      },
      {
        $group: {
          _id: '$hour',
          bookings: { $sum: 1 },
        },
      },
      { $sort: { bookings: -1 } },
      {
        $project: {
          _id: 0,
          hour: '$_id',
          bookings: 1,
          label: {
            $concat: [
              { $toString: '$_id' },
              ':00 - ',
              { $toString: '$_id' },
              ':59',
            ],
          },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        byHourAndDay: peakHours,
        byHour,
        busiestHour: byHour[0] || null,
      },
    });
  } catch (error) {
    console.error('getPeakHours error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER STATS
// GET /api/analytics/salon/:salonId/customer-stats
// Returns: new vs returning customers, top customers by bookings
// Access: salon-owner (own salon) | super-admin
// ─────────────────────────────────────────────────────────────────────────────
export const getCustomerStats = async (req, res) => {
  try {
    const { salonId } = req.params;
    const salonObjectId = new mongoose.Types.ObjectId(salonId);

    const [customerBreakdown, topCustomers] = await Promise.all([
      // New (1 booking) vs returning (2+ bookings)
      Booking.aggregate([
        {
          $match: {
            salonId: salonObjectId,
            status: { $nin: ['cancelled'] },
          },
        },
        {
          $group: {
            _id: '$userId',
            bookings: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: null,
            totalCustomers: { $sum: 1 },
            newCustomers: {
              $sum: { $cond: [{ $eq: ['$bookings', 1] }, 1, 0] },
            },
            returningCustomers: {
              $sum: { $cond: [{ $gt: ['$bookings', 1] }, 1, 0] },
            },
          },
        },
      ]),

      // Top 5 customers by booking count
      Booking.aggregate([
        {
          $match: {
            salonId: salonObjectId,
            status: { $nin: ['cancelled'] },
          },
        },
        {
          $group: {
            _id: '$userId',
            totalBookings: { $sum: 1 },
            totalSpent: { $sum: '$price' },
            lastVisit: { $max: '$date' },
          },
        },
        { $sort: { totalBookings: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            name: '$user.name',
            email: '$user.email',
            totalBookings: 1,
            totalSpent: 1,
            lastVisit: 1,
          },
        },
      ]),
    ]);

    const breakdown = customerBreakdown[0] || {
      totalCustomers: 0,
      newCustomers: 0,
      returningCustomers: 0,
    };

    const retentionRate =
      breakdown.totalCustomers === 0
        ? 0
        : (
            (breakdown.returningCustomers / breakdown.totalCustomers) *
            100
          ).toFixed(1);

    return res.status(200).json({
      success: true,
      data: {
        totalCustomers: breakdown.totalCustomers,
        newCustomers: breakdown.newCustomers,
        returningCustomers: breakdown.returningCustomers,
        retentionRate: `${retentionRate}%`,
        topCustomers,
      },
    });
  } catch (error) {
    console.error('getCustomerStats error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN OVERVIEW
// GET /api/analytics/admin/overview
// Returns: platform-wide stats across all salons
// Access: super-admin only
// ─────────────────────────────────────────────────────────────────────────────
export const getAdminOverview = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );

    const [
      totalBookings,
      totalRevenue,
      totalSalons,
      totalCustomers,
      totalReviews,
      thisMonthStats,
      topSalons,
      bookingStatusBreakdown,
    ] = await Promise.all([
      Booking.countDocuments({ status: { $nin: ['cancelled'] } }),

      Booking.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$price' } } },
      ]),

      Salon.countDocuments(),

      User.countDocuments({ role: 'customer' }),

      Review.countDocuments(),

      // This month across all salons
      Booking.aggregate([
        {
          $match: {
            status: { $nin: ['cancelled'] },
            date: { $gte: startOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            bookings: { $sum: 1 },
            revenue: { $sum: '$price' },
          },
        },
      ]),

      // Top 5 salons by revenue
      Booking.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: '$salonId',
            revenue: { $sum: '$price' },
            bookings: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'salons',
            localField: '_id',
            foreignField: '_id',
            as: 'salon',
          },
        },
        { $unwind: '$salon' },
        {
          $project: {
            _id: 0,
            salonId: '$_id',
            name: '$salon.name',
            revenue: 1,
            bookings: 1,
          },
        },
      ]),

      // Booking status breakdown
      Booking.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        platform: {
          totalBookings,
          totalRevenue: totalRevenue[0]?.total || 0,
          totalSalons,
          totalCustomers,
          totalReviews,
        },
        thisMonth: {
          bookings: thisMonthStats[0]?.bookings || 0,
          revenue: thisMonthStats[0]?.revenue || 0,
        },
        topSalons,
        bookingStatusBreakdown: bookingStatusBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error('getAdminOverview error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
