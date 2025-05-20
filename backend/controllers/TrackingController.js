import Tracking from '../models/Tracking.js';
import Bus from '../models/Bus.js';
import Route from '../models/Route.js';
import Child from '../models/Child.js';
import { calculateDistance, estimateArrivalTime } from '../utils/locationUtils.js';

// Start a new tracking session
export async function startTracking(req, res) {
  try {
    const { busId, routeId, currentLocation } = req.body;
    const driverId = req.user._id;

    // Check if there's already an active session for this bus
    let tracking = await Tracking.findOne({ 
      busId, 
      isActive: true,
      dateActive: { 
        $gte: new Date().setHours(0, 0, 0, 0)
      }
    });

    if (tracking) {
      return res.status(400).json({
        success: false,
        message: 'An active tracking session already exists for this bus today'
      });
    }

    // Get next stop details from route
    const route = await Route.findById(routeId);
    let nextStop = null;
    
    if (route && route.stops && route.stops.length > 0) {
      nextStop = {
        name: route.stops[0].location,
        estimatedArrival: new Date(),
        coordinates: {
          latitude: route.stops[0].latitude,
          longitude: route.stops[0].longitude
        }
      };
      
      // Calculate distance to the next stop
      if (currentLocation) {
        const distanceInMeters = calculateDistance(
          currentLocation.latitude, 
          currentLocation.longitude,
          nextStop.coordinates.latitude,
          nextStop.coordinates.longitude
        );
        
        nextStop.distanceInMeters = distanceInMeters;
        nextStop.estimatedArrival = estimateArrivalTime(distanceInMeters, 0);
      }
    }

    // Create new tracking session
    tracking = await Tracking.create({
      busId,
      driverId,
      routeId,
      isActive: true,
      currentLocation: {
        ...currentLocation,
        timestamp: new Date()
      },
      nextStop,
      status: route?.type === 'morning' ? 'en_route_to_school' : 'en_route_to_home',
      dayHistory: [{
        time: new Date(),
        location: 'Starting location',
        event: 'Route started',
        speed: 0,
        coordinates: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude
        }
      }]
    });

    res.status(201).json({
      success: true,
      data: tracking
    });
  } catch (error) {
    console.error('Start tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Update current location
export async function updateLocation(req, res) {
  try {
    const { busId, currentLocation, eventDetails } = req.body;
    const driverId = req.user._id;

    const tracking = await Tracking.findOne({
      busId,
      driverId,
      isActive: true
    });

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: 'No active tracking session found'
      });
    }

    // Update location
    tracking.currentLocation = {
      ...currentLocation,
      timestamp: new Date()
    };

    // If event details provided, add to history
    if (eventDetails) {
      tracking.dayHistory.push({
        time: new Date(),
        location: eventDetails.location || 'Current location',
        event: eventDetails.event,
        speed: currentLocation.speed || 0,
        coordinates: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude
        }
      });

      // Check if this is a pickup/dropoff event
      if (eventDetails.type === 'pickup' || eventDetails.type === 'dropoff') {
        tracking.lastStop = {
          name: eventDetails.location,
          time: new Date(),
          type: eventDetails.type
        };
      }
    }

    // Update next stop if available
    if (tracking.nextStop && tracking.currentLocation) {
      const distanceInMeters = calculateDistance(
        tracking.currentLocation.latitude,
        tracking.currentLocation.longitude,
        tracking.nextStop.coordinates.latitude,
        tracking.nextStop.coordinates.longitude
      );
      
      tracking.nextStop.distanceInMeters = distanceInMeters;
      tracking.nextStop.estimatedArrival = estimateArrivalTime(
        distanceInMeters, 
        tracking.currentLocation.speed
      );
    }

    await tracking.save();

    res.status(200).json({
      success: true,
      data: tracking
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// End tracking session
export async function endTracking(req, res) {
  try {
    const { busId } = req.body;
    const driverId = req.user._id;

    const tracking = await Tracking.findOne({
      busId,
      driverId,
      isActive: true
    });

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: 'No active tracking session found'
      });
    }

    tracking.isActive = false;
    tracking.status = 'completed';
    tracking.dayHistory.push({
      time: new Date(),
      location: 'End location',
      event: 'Route completed',
      speed: 0
    });

    await tracking.save();

    res.status(200).json({
      success: true,
      data: tracking
    });
  } catch (error) {
    console.error('End tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Report emergency
export async function reportEmergency(req, res) {
  try {
    const { busId, details, location } = req.body;
    const driverId = req.user._id;

    const tracking = await Tracking.findOne({
      busId,
      driverId,
      isActive: true
    });

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: 'No active tracking session found'
      });
    }

    tracking.status = 'emergency';
    
    // Add event to history
    tracking.dayHistory.push({
      time: new Date(),
      location: location?.name || 'Emergency location',
      event: `EMERGENCY: ${details || 'Emergency reported'}`,
      coordinates: location ? {
        latitude: location.latitude,
        longitude: location.longitude
      } : undefined
    });

    await tracking.save();

    // In a real app, you would trigger emergency notifications here
    // to school administrators and parents

    res.status(200).json({
      success: true,
      data: tracking
    });
  } catch (error) {
    console.error('Report emergency error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Get active tracking for a bus
export async function getBusTracking(req, res) {
  try {
    const { busId } = req.params;

    const tracking = await Tracking.findOne({
      busId,
      isActive: true,
      dateActive: {
        $gte: new Date().setHours(0, 0, 0, 0)
      }
    })
    .populate('busId', 'busNumber capacity')
    .populate('driverId', 'firstName lastName phone');

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: 'No active tracking found for this bus'
      });
    }

    res.status(200).json({
      success: true,
      data: tracking
    });
  } catch (error) {
    console.error('Get bus tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Get tracking for a specific child's bus
export async function getChildBusTracking(req, res) {
  try {
    const { childId } = req.params;
    const parentId = req.user._id;

    // Verify that the child belongs to the parent
    const child = await Child.findOne({
      _id: childId,
      parent: parentId
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found or not authorized'
      });
    }

    // If child doesn't have a route assigned
    if (!child.route) {
      return res.status(404).json({
        success: false,
        message: 'No route assigned to this child'
      });
    }

    // Get the route and associated bus
    const route = await Route.findById(child.route)
      .populate('driver', 'firstName lastName phone');
    
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    if (!route.bus) {
      return res.status(404).json({
        success: false,
        message: 'No bus assigned to the child\'s route'
      });
    }

    // Get bus details
    const bus = await Bus.findById(route.bus);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }

    // Get active tracking for the bus
    const tracking = await Tracking.findOne({
      busId: route.bus,
      isActive: true,
      dateActive: {
        $gte: new Date().setHours(0, 0, 0, 0)
      }
    }).populate('driverId', 'firstName lastName phone');

    // If no active tracking found, return what we know about the route/bus
    if (!tracking) {
      return res.status(200).json({
        success: true,
        message: 'No active tracking for this bus at the moment',
        data: {
          isActive: false,
          dayHistory: []
        },
        childInfo: {
          name: `${child.firstName} ${child.lastName}`,
          busNumber: `Bus #${bus.busNumber}`,
          routeInfo: {
            name: route.name,
            type: route.type
          },
          driverInfo: route.driver ? {
            name: `${route.driver.firstName} ${route.driver.lastName}`,
            phone: route.driver.phone
          } : null
        }
      });
    }

    // Return full tracking data if available
    res.status(200).json({
      success: true,
      data: tracking,
      childInfo: {
        name: `${child.firstName} ${child.lastName}`,
        busNumber: `Bus #${bus.busNumber}`,
        routeInfo: {
          name: route.name,
          type: route.type
        }
      }
    });
  } catch (error) {
    console.error('Get child bus tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Get tracking history for a bus
export async function getBusTrackingHistory(req, res) {
  try {
    const { busId, date } = req.params;
    
    // If date is not provided, use today's date
    const queryDate = date || new Date().toISOString().split('T')[0];
    
    const targetDate = new Date(queryDate);
    targetDate.setHours(0, 0, 0, 0);
    const startOfDay = targetDate;
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const tracking = await Tracking.find({
      busId,
      dateActive: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    })
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tracking.length,
      data: tracking
    });
  } catch (error) {
    console.error('Get bus tracking history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Update tracking connection info
export async function updateConnectionInfo(req, res) {
  try {
    const { busId, connectionInfo } = req.body;
    const driverId = req.user._id;

    const tracking = await Tracking.findOne({
      busId,
      driverId,
      isActive: true
    });

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: 'No active tracking session found'
      });
    }

    tracking.connectionInfo = {
      ...tracking.connectionInfo,
      ...connectionInfo
    };

    await tracking.save();

    res.status(200).json({
      success: true,
      data: tracking.connectionInfo
    });
  } catch (error) {
    console.error('Update connection info error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}