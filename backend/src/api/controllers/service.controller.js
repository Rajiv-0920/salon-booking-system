import Salon from '../models/salon.model.js';
import Service from '../models/services.model.js';
import Category from '../models/category.model.js';

export const getAllServices = async (req, res) => {
  try {
    const services = await Service.find().populate('categoryId', 'name');

    res.status(200).json({
      success: true,
      message: 'Services retrieved successfully',
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
    const { name, description, price, duration, categoryId } = req.body;
    const { salonId } = req.user;

    const service = await Service.create({
      name,
      description,
      price,
      duration,
      salonId,
      categoryId,
    });

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
    const { name, description, price, duration, categoryId } = req.body;

    const service = await Service.findByIdAndUpdate(
      id,
      { name, description, price, duration, categoryId },
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
      message: 'Service updated successfully',
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

    const service = await Service.findByIdAndDelete(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

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

    const services = await Service.find({ salonId });

    res.status(200).json({
      success: true,
      message: 'Services retrieved successfully',
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

export const getServicesByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const categoryDoc = await Category.findOne({ slug: category });

    const services = await Service.find({ categoryId: categoryDoc._id })
      .populate('salonId', 'name address')
      .sort({ price: 1 });

    res.status(200).json({
      success: true,
      count: services.length,
      categoryName: categoryDoc.name,
      data: services,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
