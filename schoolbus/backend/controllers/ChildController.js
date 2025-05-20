import Child from '../models/Child.js';
import Route from '../models/Route.js';
import User from '../models/User.js';

// Get all children for the logged-in parent
export async function getChildren(req, res) {
  try {
    const parentId = req.user._id;
    const children = await Child.find({ parent: parentId });
    
    res.status(200).json({
      success: true,
      count: children.length,
      data: children
    });
  } catch (error) {
    console.error('Get children error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Get a specific child by ID
export async function getChildById(req, res) {
  try {
    const childId = req.params.id;
    const parentId = req.user._id;
    
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
    
    res.status(200).json({
      success: true,
      data: child
    });
  } catch (error) {
    console.error('Get child by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Create a new child
export async function createChild(req, res) {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      schoolName,
      grade,
      pickupAddress,
      dropoffAddress,
      route,
      emergencyContact,
      specialNeeds,
      medicalInformation,
      photo
    } = req.body;

    // Create child data object
    const childData = {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      schoolName,
      grade,
      parent: req.user._id,
      pickupAddress,
      dropoffAddress,
      emergencyContact,
      specialNeeds,
      medicalInformation,
      photo,
      status: 'active'
    };

    // Only add route if it's provided and not null
    if (req.body.routes && Array.isArray(req.body.routes)) {
      childData.routes = req.body.routes;
    } else if (req.body.route) {
      // For backward compatibility
      childData.routes = [req.body.route];
    }

    // Create the child
    const child = await Child.create(childData);

    // Update the parent's children array with this child's ID
    await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { children: child._id } },
      { new: true }
    );

    res.status(201).json({
      success: true,
      data: child
    });
  } catch (error) {
    console.error('Create child error:', error);
    
    // Handle validation errors
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

// Update a child's information
export async function updateChild(req, res) {
  try {
    const childId = req.params.id;
    const parentId = req.user._id;
    
    // Ensure the child belongs to the logged-in parent
    let child = await Child.findOne({ 
      _id: childId, 
      parent: parentId 
    });
    
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found or not authorized'
      });
    }
    
    // Update fields
    child = await Child.findByIdAndUpdate(childId, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: child
    });
  } catch (error) {
    console.error('Update child error:', error);
    
    // Handle validation errors
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

// Delete/remove a child
export async function deleteChild(req, res) {
  try {
    const childId = req.params.id;
    const parentId = req.user._id;
    
    // Ensure the child belongs to the logged-in parent
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
    
    // Remove child from database
    await Child.findByIdAndDelete(childId);
    
    // Remove child reference from parent's children array
    await User.findByIdAndUpdate(
      parentId,
      { $pull: { children: childId } }
    );
    
    res.status(200).json({
      success: true,
      message: 'Child removed successfully'
    });
  } catch (error) {
    console.error('Delete child error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Update child attendance
export async function updateChildAttendance(req, res) {
  try {
    const childId = req.params.id;
    const parentId = req.user._id;
    const { date, morningPickup, afternoonDropoff } = req.body;
    
    // Ensure the child belongs to the logged-in parent
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

    // Check if attendance record exists for the date
    const attendanceIndex = child.attendance.findIndex(
      a => new Date(a.date).toISOString().split('T')[0] === date
    );
    
    if (attendanceIndex >= 0) {
      // Update existing attendance record
      if (morningPickup) {
        child.attendance[attendanceIndex].morningPickup = morningPickup;
      }
      
      if (afternoonDropoff) {
        child.attendance[attendanceIndex].afternoonDropoff = afternoonDropoff;
      }
    } else {
      // Create new attendance record
      child.attendance.push({
        date: new Date(date),
        morningPickup,
        afternoonDropoff
      });
    }
    
    await child.save();
    
    res.status(200).json({
      success: true,
      data: child
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Get children assigned to a specific route
export async function getRouteChildren(req, res) {
  try {
    const { routeId } = req.params;
    
    // Check if route exists
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }
    
    // If user is a driver, ensure they are assigned to this route
    if (req.user.role === 'driver' && route.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this route'
      });
    }
    
    // Get all children assigned to this route
    const children = await Child.find({ routes: routeId })
      .populate('parent', 'firstName lastName email phone')
      .sort({ firstName: 1, lastName: 1 });
    
    res.status(200).json({
      success: true,
      count: children.length,
      data: children
    });
  } catch (error) {
    console.error('Get route children error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}