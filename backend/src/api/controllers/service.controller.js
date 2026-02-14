import Salon from '../models/salon.model.js';
import Service from '../models/services.model.js';

export const getAllServices = async (req, res) => {
  try {
    const services = await Service.find().populate('category', 'name');
    res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }
    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createService = async (req, res) => {
  try {
    const { name, description, price, duration, category } = req.body;
    const { _id: userId } = req.user;
    const salon = await Salon.findOne({ owner: userId });

    if (!salon) {
      return res
        .status(404)
        .json({ success: false, message: 'Salon not found' });
    }

    const service = await Service.create({
      name,
      description,
      price,
      duration,
      salon: salon._id,
      category,
    });

    salon.services.push(service._id);
    await salon.save();

    res.status(201).json({
      success: true,
      data: service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, duration, category } = req.body;
    const { _id: userId } = req.user;
    const { _id: salonId } = await Salon.findOne({ owner: userId });

    const service = await Service.findByIdAndUpdate(
      id,
      { name, description, price, duration, salon: salonId, category },
      { returnDocument: 'after', runValidators: true },
    );
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }
    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const { _id: userId } = req.user;

    const salon = await Salon.findOne({ owner: userId });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found',
      });
    }

    const service = await Service.findByIdAndDelete(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    await Salon.findByIdAndUpdate(salon._id, {
      $pull: { services: id },
    });

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getServicesBySalonId = async (req, res) => {
  try {
    const { salonId } = req.params;
    const services = await Service.find({ salon: salonId });
    res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getServicesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const services = await Service.find({ category });
    res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
