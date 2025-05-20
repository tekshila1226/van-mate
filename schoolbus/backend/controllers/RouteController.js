import Route from '../models/Route.js';
import User from '../models/User.js';
import Child from '../models/Child.js';

// Get all active routes
export async function getActiveRoutes(req, res) {
  try {
    const routes = await Route.find({ isActive: true }).select('_id routeNumber name');
    
    res.status(200).json({
      success: true,
      count: routes.length,
      data: routes
    });
  } catch (error) {
    console.error('Get active routes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Get route details by ID
export async function getRouteById(req, res) {
  try {
    const route = await Route.findById(req.params.id);
    
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: route
    });
  } catch (error) {
    console.error('Get route by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Assign a driver to a route
export async function assignDriverToRoute(req, res) {
  try {
    const { routeId } = req.params;
    const { driverId } = req.body;

    if (!driverId) {
      return res.status(400).json({
        success: false,
        message: 'Driver ID is required'
      });
    }

    // Check if the route exists
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    // Check if the driver exists
    const driver = await User.findById(driverId);
    if (!driver || driver.role !== 'driver') {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Update the route with the driver
    route.driver = driverId;
    route.isActive = true;
    await route.save();

    // Add this route to the driver's routes array if not already there
    if (!driver.routes.includes(routeId)) {
      driver.routes.push(routeId);
      await driver.save();
    }

    res.status(200).json({
      success: true,
      message: 'Driver assigned to route successfully',
      data: route
    });
  } catch (error) {
    console.error('Assign driver to route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Unassign a driver from a route
export async function unassignDriverFromRoute(req, res) {
  try {
    const { routeId } = req.params;

    // Check if the route exists
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    // If there's a driver assigned, remove the route from their routes array
    if (route.driver) {
      const driver = await User.findById(route.driver);
      if (driver) {
        driver.routes = driver.routes.filter(r => r.toString() !== routeId.toString());
        await driver.save();
      }
    }

    // Update the route to remove the driver
    route.driver = null;
    route.isActive = false; // Optionally make the route inactive
    await route.save();

    res.status(200).json({
      success: true,
      message: 'Driver unassigned from route successfully',
      data: route
    });
  } catch (error) {
    console.error('Unassign driver from route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Get all routes for admin
export async function getAllRoutes(req, res) {
  try {
    // Get all routes with populated driver information
    const routes = await Route.find()
      .populate('driver', 'firstName lastName')
      .populate('students')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: routes.length,
      data: routes
    });
  } catch (error) {
    console.error('Get all routes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Create a new route
export async function createRoute(req, res) {
  try {
    const { 
      name, routeNumber, type, school, description, 
      stops, startDate, isActive, driver, bus 
    } = req.body;

    // Validate required fields
    if (!name || !routeNumber || !type || !school) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if route number already exists
    const existingRoute = await Route.findOne({ routeNumber });
    if (existingRoute) {
      return res.status(400).json({
        success: false,
        message: 'Route number already exists'
      });
    }

    // Create route
    const route = await Route.create({
      name,
      routeNumber,
      type,
      school,
      description,
      stops,
      bus,
      startDate: startDate || new Date(),
      isActive: isActive !== undefined ? isActive : true,
      driver: driver || null
    });

    res.status(201).json({
      success: true,
      message: 'Route created successfully',
      data: route
    });
  } catch (error) {
    console.error('Create route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Update route
export async function updateRoute(req, res) {
  try {
    const { id } = req.params;
    const routeData = req.body;

    const route = await Route.findById(id);
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    // Check if routeNumber is being updated and if it's unique
    if (routeData.routeNumber && routeData.routeNumber !== route.routeNumber) {
      const existingRoute = await Route.findOne({ routeNumber: routeData.routeNumber });
      if (existingRoute) {
        return res.status(400).json({
          success: false,
          message: 'Route number already exists'
        });
      }
    }

    // Update the route
    const updatedRoute = await Route.findByIdAndUpdate(
      id,
      routeData,
      { new: true, runValidators: true }
    ).populate('driver', 'firstName lastName');

    res.status(200).json({
      success: true,
      message: 'Route updated successfully',
      data: updatedRoute
    });
  } catch (error) {
    console.error('Update route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Delete route
export async function deleteRoute(req, res) {
  try {
    const { id } = req.params;

    const route = await Route.findById(id);
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    // Check if there are children assigned to this route
    const childrenCount = await Child.countDocuments({ route: id });
    if (childrenCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete route with ${childrenCount} children assigned. Please reassign them first.`
      });
    }

    await Route.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Route deleted successfully'
    });
  } catch (error) {
    console.error('Delete route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Get routes assigned to a driver
export async function getDriverRoutes(req, res) {
  try {
    const { driverId } = req.params;
    
    // Check if this is the authenticated driver or an admin
    if (req.user.role === 'driver' && req.user._id.toString() !== driverId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to access other driver routes'
      });
    }
    
    // Find driver to check if they exist
    const driver = await User.findById(driverId);
    if (!driver || driver.role !== 'driver') {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    // Get routes assigned to this driver
    const routes = await Route.find({ driver: driverId })
      .sort({ type: 1, name: 1 });
    
    res.status(200).json({
      success: true,
      count: routes.length,
      data: routes
    });
  } catch (error) {
    console.error('Get driver routes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}