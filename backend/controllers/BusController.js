import Bus from '../models/Bus.js';
import Route from '../models/Route.js';

// Get all buses
export async function getAllBuses(req, res) {
  try {
    const buses = await Bus.find().sort({ busNumber: 1 });
    
    res.status(200).json({
      success: true,
      count: buses.length,
      data: buses
    });
  } catch (error) {
    console.error('Get all buses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Get available buses (not assigned to routes)
export async function getAvailableBuses(req, res) {
  try {
    // Find buses that are active and not already assigned to a route
    const assignedBusIds = await Route.find({ isActive: true }).distinct('bus');
    const availableBuses = await Bus.find({
      _id: { $nin: assignedBusIds },
      status: 'active'
    }).sort({ busNumber: 1 });
    
    res.status(200).json({
      success: true,
      count: availableBuses.length,
      data: availableBuses
    });
  } catch (error) {
    console.error('Get available buses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Get bus by ID
export async function getBusById(req, res) {
  try {
    const { id } = req.params;
    const bus = await Bus.findById(id);
    
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: bus
    });
  } catch (error) {
    console.error('Get bus error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Create new bus
export async function createBus(req, res) {
  try {
    const { 
      busNumber, 
      licensePlate, 
      capacity, 
      make, 
      model, 
      year, 
      status, 
      driver, 
      features, 
      gpsDevice,
      fuelType,
      fuelCapacity,
      currentFuelLevel
    } = req.body;
    
    // Check if bus with same number or license plate already exists
    const busExists = await Bus.findOne({
      $or: [
        { busNumber },
        { licensePlate }
      ]
    });
    
    if (busExists) {
      return res.status(400).json({
        success: false,
        message: busExists.busNumber === busNumber 
          ? 'Bus number already exists' 
          : 'License plate already exists'
      });
    }
    
    // Create bus
    const bus = await Bus.create({
      busNumber,
      licensePlate,
      capacity,
      make,
      model,
      year,
      status,
      driver,
      features,
      gpsDevice,
      fuelType,
      fuelCapacity,
      currentFuelLevel
    });
    
    res.status(201).json({
      success: true,
      message: 'Bus created successfully',
      data: bus
    });
  } catch (error) {
    console.error('Create bus error:', error);
    
    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Update bus
export async function updateBus(req, res) {
  try {
    const { id } = req.params;
    const busData = req.body;
    
    // Find bus
    const bus = await Bus.findById(id);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }
    
    // Check for duplicates if changing bus number or license plate
    if (
      (busData.busNumber && busData.busNumber !== bus.busNumber) || 
      (busData.licensePlate && busData.licensePlate !== bus.licensePlate)
    ) {
      const existingBus = await Bus.findOne({
        $or: [
          { busNumber: busData.busNumber || '' },
          { licensePlate: busData.licensePlate || '' }
        ],
        _id: { $ne: id }
      });
      
      if (existingBus) {
        return res.status(400).json({
          success: false,
          message: existingBus.busNumber === busData.busNumber 
            ? 'Bus number already exists' 
            : 'License plate already exists'
        });
      }
    }
    
    // Update bus
    const updatedBus = await Bus.findByIdAndUpdate(id, busData, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      message: 'Bus updated successfully',
      data: updatedBus
    });
  } catch (error) {
    console.error('Update bus error:', error);
    
    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Delete bus
export async function deleteBus(req, res) {
  try {
    const { id } = req.params;
    
    // Check if bus is assigned to active routes
    const activeRoutes = await Route.find({ bus: id, isActive: true });
    if (activeRoutes.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete bus that is assigned to ${activeRoutes.length} active routes. Please reassign or deactivate these routes first.`
      });
    }
    
    const bus = await Bus.findById(id);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }
    
    await Bus.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Bus deleted successfully'
    });
  } catch (error) {
    console.error('Delete bus error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Get buses assigned to the logged-in driver
export async function getDriverBuses(req, res) {
  try {
    const driverId = req.user._id;
    
    // First check if driver has any buses directly assigned
    let buses = await Bus.find({ driver: driverId }).sort({ busNumber: 1 });
    
    // If no buses directly assigned, check routes
    if (buses.length === 0) {
      // Get routes assigned to this driver
      const routes = await Route.find({ driver: driverId, isActive: true });
      
      if (routes.length > 0) {
        // Get unique bus IDs from routes
        const busIds = [...new Set(routes.map(route => route.bus))].filter(Boolean);
        
        // Fetch buses using those IDs
        buses = await Bus.find({ _id: { $in: busIds } }).sort({ busNumber: 1 });
      }
    }
    
    res.status(200).json({
      success: true,
      count: buses.length,
      data: buses
    });
  } catch (error) {
    console.error('Get driver buses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}