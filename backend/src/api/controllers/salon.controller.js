import Salon from '../models/salon.model.js';
import Services from '../models/services.model.js';
import Staff from '../models/staff.model.js';
import Review from '../models/review.model.js';
import Booking from '../models/booking.model.js';
import mongoose from 'mongoose';
import { cloudinary } from '../library/cloudinary.js';

export const createSalon = async (req, res) => {
  try {
    const { name, address, location, holidays, workingHours, images } =
      req.body;

    const salon = new Salon({
      owner: req.user.id,
      name,
      address,
      location,
      holidays,
      images,
      workingHours,
      services: [],
      staff: [],
    });

    const savedSalon = await salon.save();

    res.status(201).json({
      success: true,
      message: 'Salon registered successfully',
      data: savedSalon,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

export const getSalons = async (req, res) => {
  try {
    // 1. EXTRACT QUERY PARAMETERS
    const { name, address, page = 1, limit = 10, sort } = req.query;

    // 2. BUILD THE QUERY OBJECT
    const queryObj = {};

    // Search by name (Case-insensitive Regex)
    if (name) {
      queryObj.name = { $regex: name, $options: 'i' };
    }

    // Filter by address/city
    if (address) {
      queryObj.address = { $regex: address, $options: 'i' };
    }

    // 3. EXECUTE QUERY WITH PAGINATION
    const skip = (page - 1) * limit;

    let result = Salon.find(queryObj)
      .populate('owner', 'name email') // Link owner details
      .skip(skip)
      .limit(Number(limit));

    // 4. SORTING
    if (sort) {
      const sortBy = sort.split(',').join(' ');
      result = result.sort(sortBy);
    } else {
      result = result.sort('-createdAt'); // Default: Newest first
    }

    const salons = await result;

    // 5. GET TOTAL COUNT (For frontend pagination controls)
    const totalSalons = await Salon.countDocuments(queryObj);

    res.status(200).json({
      success: true,
      count: salons.length,
      totalPages: Math.ceil(totalSalons / limit),
      currentPage: Number(page),
      data: salons,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSalon = async (req, res) => {
  try {
    const { id } = req.params;

    const salon = await Salon.findById(id)
      .populate('owner', 'name email')
      .populate('services');

    if (!salon) {
      return res
        .status(404)
        .json({ success: false, message: 'Salon not found' });
    }

    res.status(200).json({
      success: true,
      data: salon,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSalon = async (req, res) => {
  try {
    const { id } = req.params;

    let salon = await Salon.findById(id);

    if (!salon) {
      return res
        .status(404)
        .json({ success: false, message: 'Salon not found' });
    }

    const updatedSalon = await Salon.findByIdAndUpdate(id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Salon updated successfully',
      data: updatedSalon,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSalon = async (req, res) => {
  try {
    const { id } = req.params;

    let salon = await Salon.findById(id);

    if (!salon) {
      return res
        .status(404)
        .json({ success: false, message: 'Salon not found' });
    }

    await Salon.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Salon deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSalonServices = async (req, res) => {
  try {
    const { id } = req.params;

    const salon = await Salon.findById(id).populate('services');

    if (!salon) {
      return res
        .status(404)
        .json({ success: false, message: 'Salon not found' });
    }

    res.status(200).json({
      success: true,
      data: salon.services,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSalonStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const salon = await Salon.findById(id).populate('staff');

    if (!salon) {
      return res
        .status(404)
        .json({ success: false, message: 'Salon not found' });
    }

    res.status(200).json({
      success: true,
      data: salon.staff,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSalonReviews = async (req, res) => {
  try {
    const { id } = req.params;

    const salon = await Salon.findById(id).populate('reviews');

    if (!salon) {
      return res
        .status(404)
        .json({ success: false, message: 'Salon not found' });
    }

    res.status(200).json({
      success: true,
      data: salon.reviews,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSalonBookings = async (req, res) => {
  try {
    const { id } = req.params;

    const salon = await Salon.findById(id).populate('bookings');

    if (!salon) {
      return res
        .status(404)
        .json({ success: false, message: 'Salon not found' });
    }

    res.status(200).json({
      success: true,
      data: salon.bookings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const searchSalons = async (req, res) => {
  try {
    const { query, location, service } = req.query;

    let filter = {};

    // 1. Keyword Search (Name or Description)
    if (query) {
      filter.$or = [{ name: { $regex: query, $options: 'i' } }];
    }

    // 2. Location Filter
    if (location) {
      filter.address = { $regex: location, $options: 'i' };
    }

    // 3. Search by Service (This is a bit more advanced)
    // We search the 'Service' model for a name match, then find salons with those IDs
    if (service) {
      const matchedServices = await Service.find({
        name: { $regex: service, $options: 'i' },
      }).select('_id');

      const serviceIds = matchedServices.map((s) => s._id);
      filter.services = { $in: serviceIds };
    }

    const salons = await Salon.find(filter)
      .populate('services', 'name price')
      .sort('-rating'); // Show best rated first

    res.status(200).json({
      success: true,
      count: salons.length,
      data: salons,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getNearbySalons = async (req, res) => {
  try {
    const { lng, lat, distance = 5000 } = req.query;

    if (!lng || !lat) {
      return res
        .status(400)
        .json({ success: false, message: 'Coordinates required' });
    }

    const salons = await Salon.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          distanceField: 'distance', // This adds a 'distance' field to each result
          maxDistance: parseInt(distance),
          spherical: true,
          // distanceMultiplier converts meters to kilometers (1/1000)
          distanceMultiplier: 0.001,
        },
      },
      // Optional: You can still populate fields in aggregation using $lookup
      // or just project the fields you want
      {
        $project: {
          name: 1,
          address: 1,
          distance: { $round: ['$distance', 2] }, // Round to 2 decimal places
          rating: 1,
          images: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: salons.length,
      data: salons,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateWorkingHours = async (req, res) => {
  try {
    const { id } = req.params;
    const { workingHours } = req.body;

    const salon = await Salon.findById(id);

    if (!salon) {
      return res
        .status(404)
        .json({ success: false, message: 'Salon not found' });
    }

    salon.workingHours = workingHours;

    await salon.save();

    res.status(200).json({
      success: true,
      data: salon,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateHolidays = async (req, res) => {
  try {
    const { id } = req.params;
    const { holidays } = req.body;

    if (!Array.isArray(holidays)) {
      return res.status(400).json({
        success: false,
        message: 'Holidays must be provided as an array of dates',
      });
    }

    const salon = await Salon.findById(id);

    if (!salon) {
      return res
        .status(404)
        .json({ success: false, message: 'Salon not found' });
    }

    salon.holidays = holidays.map((date) => new Date(date));

    await salon.save();

    res.status(200).json({
      success: true,
      message: 'Salon holidays updated successfully',
      data: salon.holidays,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;

    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isAvailable must be a boolean value (true or false)',
      });
    }

    const salon = req.salon;
    salon.isAvailable = isAvailable;

    await salon.save();

    res.status(200).json({
      success: true,
      message: `Salon is now ${isAvailable ? 'available' : 'unavailable'} for bookings`,
      data: { isAvailable: salon.isAvailable },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadSalonImages = async (req, res) => {
  try {
    // 1. Check if files exist
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'No images uploaded' });
    }

    // 2. Validate req.params.id (Prevents Mongoose CastError)
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid Salon ID format' });
    }

    // 3. Map paths
    const imageUrls = req.files.map((file) => file.path);

    // 4. Update the salon document
    const salon = await Salon.findByIdAndUpdate(
      req.params.id,
      { $push: { images: { $each: imageUrls } } },
      { returnDocument: 'after', runValidators: true },
    );

    // 5. Handle case where ID is valid format but doesn't exist in DB
    if (!salon) {
      return res
        .status(404)
        .json({ success: false, message: 'Salon not found' });
    }

    res.status(200).json({
      success: true,
      data: salon.images,
    });
  } catch (error) {
    // Ensuring the response is ALWAYS JSON
    res.status(500).json({
      success: false,
      message: error.message || 'An unexpected error occurred',
    });
  }
};

export const deleteSalonImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const salon = req.salon;

    const imageToDelete = salon.images.find((url) => url.includes(imageId));

    if (!imageToDelete) {
      return res
        .status(404)
        .json({ success: false, message: 'Image not found in salon' });
    }

    const publicId = `salons/${imageId}`;

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== 'ok') {
      return res
        .status(400)
        .json({ success: false, message: 'Cloudinary deletion failed' });
    }

    salon.images = salon.images.filter((url) => url !== imageToDelete);
    await salon.save();

    res.status(200).json({
      success: true,
      message: 'Image removed successfully',
      remainingImages: salon.images,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
