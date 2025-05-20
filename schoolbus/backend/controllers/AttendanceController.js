import Child from '../models/Child.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Route from '../models/Route.js';

// Get attendance history for a specific child
export async function getAttendanceHistory(req, res) {
  try {
    const { childId } = req.params;
    const { month, year } = req.query;
    const parentId = req.user._id;
    
    // Verify child belongs to parent
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
    
    // Filter attendance by month if specified
    const attendanceData = [];
    if (child.attendance && child.attendance.length > 0) {
      // Filter by month/year if provided
      child.attendance.forEach(record => {
        const recordDate = new Date(record.date);
        
        if ((!month || recordDate.getMonth() + 1 === parseInt(month)) && 
            (!year || recordDate.getFullYear() === parseInt(year))) {
          
          // Format data for frontend
          attendanceData.push({
            date: record.date,
            day: recordDate.toLocaleDateString('en-US', { weekday: 'long' }),
            status: record.absent ? "Absent" : (record.late ? "Late" : "Present"),
            pickupTime: record.morningPickup?.status === 'picked_up' ? 
              record.morningPickup.time : (record.morningPickup?.status === 'expected' ? "Expected" : "-"),
            pickupLocation: record.morningPickup?.location || "Home",
            dropoffTime: record.afternoonDropoff?.status === 'dropped_off' ? 
              record.afternoonDropoff.time : (record.afternoonDropoff?.status === 'expected' ? "Expected" : "-"),
            dropoffLocation: record.afternoonDropoff?.location || "Home",
            notes: record.notes || ""
          });
        }
      });
    }
    
    // Sort by date (newest first)
    attendanceData.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.status(200).json({
      success: true,
      data: attendanceData,
      child: {
        id: child._id,
        name: `${child.firstName} ${child.lastName}`
      }
    });
  } catch (error) {
    console.error('Get attendance history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Report absence or late arrival
export async function reportAbsence(req, res) {
  try {
    const { childId } = req.params;
    const parentId = req.user._id;
    const { date, status, reason, returnDate, morningOnly, afternoonOnly } = req.body;
    
    // Verify child belongs to parent
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
    
    // Check if attendance record exists for this date
    const targetDate = new Date(date);
    let attendanceRecord = child.attendance.find(a => 
      new Date(a.date).toISOString().split('T')[0] === targetDate.toISOString().split('T')[0]
    );
    
    // Create new record if doesn't exist
    if (!attendanceRecord) {
      child.attendance.push({
        date: targetDate,
        absent: status === 'absent',
        late: status === 'late',
        notes: reason,
        returnDate: returnDate ? new Date(returnDate) : undefined,
        morningPickup: {
          status: morningOnly ? 'unavailable' : (status === 'absent' ? 'unavailable' : 'expected')
        },
        afternoonDropoff: {
          status: afternoonOnly ? 'unavailable' : (status === 'absent' ? 'unavailable' : 'expected') 
        }
      });
    } else {
      // Update existing record
      const index = child.attendance.findIndex(a => 
        new Date(a.date).toISOString().split('T')[0] === targetDate.toISOString().split('T')[0]
      );
      
      child.attendance[index].absent = status === 'absent';
      child.attendance[index].late = status === 'late';
      child.attendance[index].notes = reason;
      
      if (returnDate) {
        child.attendance[index].returnDate = new Date(returnDate);
      }
      
      if (morningOnly) {
        child.attendance[index].morningPickup = { status: 'unavailable' };
      }
      
      if (afternoonOnly) {
        child.attendance[index].afternoonDropoff = { status: 'unavailable' };
      }
    }
    
    await child.save();
    
    // Get formatted attendance data to return to frontend
    const recordDate = new Date(date);
    const formattedRecord = {
      date: recordDate.toISOString().split('T')[0],
      day: recordDate.toLocaleDateString('en-US', { weekday: 'long' }),
      status: status === 'absent' ? "Absent" : "Late",
      pickupTime: morningOnly ? "-" : "Expected",
      pickupLocation: "Home",
      dropoffTime: afternoonOnly ? "-" : "Expected", 
      dropoffLocation: "Home",
      notes: reason
    };
    
    res.status(200).json({
      success: true,
      message: `Successfully reported ${status} for ${child.firstName}`,
      data: formattedRecord
    });
  } catch (error) {
    console.error('Report absence error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Update daily attendance status (morning pickup/afternoon dropoff)
export async function updateDailyAttendance(req, res) {
  try {
    const { childId } = req.params;
    const parentId = req.user._id;
    const { morningPickup, afternoonDropoff, date } = req.body;
    
    // Verify child belongs to parent
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
    
    // Use provided date or default to today
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    
    // Check if attendance record exists for the target date
    let attendanceRecord = child.attendance.find(a => 
      new Date(a.date).toISOString().split('T')[0] === targetDate.toISOString().split('T')[0]
    );
    
    // Create new record if doesn't exist
    if (!attendanceRecord) {
      child.attendance.push({
        date: targetDate,
        morningPickup: morningPickup !== undefined ? {
          status: morningPickup ? 'expected' : 'unavailable'
        } : undefined,
        afternoonDropoff: afternoonDropoff !== undefined ? {
          status: afternoonDropoff ? 'expected' : 'unavailable'
        } : undefined
      });
    } else {
      // Update existing record
      const index = child.attendance.findIndex(a => 
        new Date(a.date).toISOString().split('T')[0] === targetDate.toISOString().split('T')[0]
      );
      
      if (morningPickup !== undefined) {
        child.attendance[index].morningPickup = {
          ...child.attendance[index].morningPickup,
          status: morningPickup ? 'expected' : 'unavailable'
        };
      }
      
      if (afternoonDropoff !== undefined) {
        child.attendance[index].afternoonDropoff = {
          ...child.attendance[index].afternoonDropoff,
          status: afternoonDropoff ? 'expected' : 'unavailable'
        };
      }
    }
    
    await child.save();
    
    res.status(200).json({
      success: true,
      message: `Attendance preferences updated for ${child.firstName}`,
      data: {
        date: targetDate.toISOString().split('T')[0],
        morningPickup: morningPickup,
        afternoonDropoff: afternoonDropoff
      }
    });
  } catch (error) {
    console.error('Update daily attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Get attendance statistics
export async function getAttendanceStats(req, res) {
  try {
    const { childId } = req.params;
    const { month, year } = req.query;
    const parentId = req.user._id;
    
    // Verify child belongs to parent
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
    
    // Filter attendance by month if specified
    const filteredAttendance = [];
    if (child.attendance && child.attendance.length > 0) {
      child.attendance.forEach(record => {
        const recordDate = new Date(record.date);
        
        if ((!month || recordDate.getMonth() + 1 === parseInt(month)) && 
            (!year || recordDate.getFullYear() === parseInt(year))) {
          filteredAttendance.push(record);
        }
      });
    }
    
    // Calculate statistics
    const totalDays = filteredAttendance.length;
    const presentDays = filteredAttendance.filter(record => !record.absent && !record.late).length;
    const absentDays = filteredAttendance.filter(record => record.absent).length;
    const lateDays = filteredAttendance.filter(record => record.late).length;
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
    
    res.status(200).json({
      success: true,
      data: {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        attendanceRate
      }
    });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Get today's attendance status
export async function getTodayAttendance(req, res) {
  try {
    const { childId } = req.params;
    const parentId = req.user._id;
    
    // Verify child belongs to parent
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
    
    // Check if today's record exists
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayRecord = child.attendance.find(a => 
      new Date(a.date).toISOString().split('T')[0] === today.toISOString().split('T')[0]
    );
    
    const defaultStatus = {
      morningPickup: true, // Default to available
      afternoonDropoff: true, // Default to available
      status: 'Present',
      pickupTime: 'Expected',
      dropoffTime: 'Expected'
    };
    
    if (!todayRecord) {
      return res.status(200).json({
        success: true,
        data: defaultStatus
      });
    }
    
    // Format data for frontend
    const todayStatus = {
      morningPickup: todayRecord.morningPickup?.status !== 'unavailable',
      afternoonDropoff: todayRecord.afternoonDropoff?.status !== 'unavailable',
      status: todayRecord.absent ? "Absent" : (todayRecord.late ? "Late" : "Present"),
      pickupTime: todayRecord.morningPickup?.time || 'Expected',
      dropoffTime: todayRecord.afternoonDropoff?.time || 'Expected',
      notes: todayRecord.notes || ""
    };
    
    res.status(200).json({
      success: true,
      data: todayStatus
    });
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Add this function to the existing controller
export async function sendDriverNote(req, res) {
  try {
    const { childId } = req.params;
    const parentId = req.user._id;
    const { note } = req.body;
    
    // Verify child belongs to parent
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
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if attendance record exists for today
    let todayRecord = child.attendance.find(a => 
      new Date(a.date).toISOString().split('T')[0] === today.toISOString().split('T')[0]
    );
    
    // Create new record if doesn't exist
    if (!todayRecord) {
      child.attendance.push({
        date: today,
        notes: note
      });
    } else {
      // Update existing record
      const index = child.attendance.findIndex(a => 
        new Date(a.date).toISOString().split('T')[0] === today.toISOString().split('T')[0]
      );
      
      // Append to existing notes or create new notes
      const existingNotes = child.attendance[index].notes || '';
      child.attendance[index].notes = existingNotes ? 
        `${existingNotes}\n[Parent note]: ${note}` : 
        `[Parent note]: ${note}`;
    }
    
    await child.save();
    
    res.status(200).json({
      success: true,
      message: `Note sent to driver for ${child.firstName}`,
    });
  } catch (error) {
    console.error('Send driver note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Get recent attendance for parent's children
export async function getRecentAttendance(req, res) {
  try {
    const parentId = req.user._id;
    
    // Get all children for this parent
    const children = await Child.find({ parent: parentId }).select('_id');
    const childIds = children.map(child => child._id);
    
    // Get recent attendance records (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const attendance = await Attendance.find({
      childId: { $in: childIds },
      date: { $gte: sevenDaysAgo }
    })
    .sort({ date: -1 })
    .limit(10);
    
    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Get recent attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Add these functions to your AttendanceController

// Get students for driver's routes
export async function getDriverRouteStudents(req, res) {
  try {
    const driverId = req.user._id;
    const { date, route } = req.query;
    
    // Get driver's assigned routes
    const driverRoutes = await Route.find({ driver: driverId });
    if (!driverRoutes.length) {
      return res.status(404).json({
        success: false,
        message: 'No routes assigned to this driver'
      });
    }
    
    // Filter by specific route type if provided
    const routeIds = route ? 
      driverRoutes.filter(r => r.routeType === route).map(r => r._id) : 
      driverRoutes.map(r => r._id);
    
    // Get children on these routes
    const children = await Child.find({ route: { $in: routeIds } })
      .populate('parent', 'firstName lastName phone')
      .select('firstName lastName grade route pickupAddress dropoffAddress');
    
    // Get attendance records for the specified date
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    
    // Format children with attendance data
    const formattedChildren = await Promise.all(children.map(async child => {
      // Get child's attendance record for this day
      const attendanceRecord = child.attendance?.find(a => 
        new Date(a.date).toISOString().split('T')[0] === targetDate.toISOString().split('T')[0]
      );
      
      return {
        _id: child._id,
        firstName: child.firstName,
        lastName: child.lastName,
        grade: child.grade,
        routeId: child.route,
        pickupAddress: child.pickupAddress,
        dropoffAddress: child.dropoffAddress,
        parentInfo: child.parent ? {
          name: `${child.parent.firstName} ${child.parent.lastName}`,
          phone: child.parent.phone
        } : null,
        parentReported: {
          morning: attendanceRecord?.morningPickup?.status === 'expected',
          afternoon: attendanceRecord?.afternoonDropoff?.status === 'expected'
        },
        status: {
          morning: attendanceRecord?.morningPickup?.status === 'picked_up' ? 'picked_up' : 
                  attendanceRecord?.morningPickup?.status === 'unavailable' ? 'absent' : null,
          afternoon: attendanceRecord?.afternoonDropoff?.status === 'dropped_off' ? 'dropped_off' : 
                    attendanceRecord?.afternoonDropoff?.status === 'unavailable' ? 'absent' : null
        },
        notes: attendanceRecord?.notes || '',
        parentNote: attendanceRecord?.parentNote || ''
      };
    }));
    
    res.status(200).json({
      success: true,
      count: formattedChildren.length,
      data: formattedChildren
    });
  } catch (error) {
    console.error('Get driver route students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Mark attendance status for a child
export async function markAttendanceStatus(req, res) {
  try {
    const { childId } = req.params;
    const { date, timeOfDay, status } = req.body;
    const driverId = req.user._id;
    
    // Verify child is on driver's route
    const child = await Child.findById(childId);
    if (!child) {
      return res.status(404).json({
        success: false, 
        message: 'Child not found'
      });
    }
    
    const childRoute = await Route.findOne({
      _id: child.route,
      driver: driverId
    });
    
    if (!childRoute) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update attendance for this child'
      });
    }
    
    // Format the date
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    // Find or create attendance record
    let attendanceRecord = child.attendance.find(a => 
      new Date(a.date).toISOString().split('T')[0] === targetDate.toISOString().split('T')[0]
    );
    
    if (!attendanceRecord) {
      // Create new attendance record
      child.attendance.push({
        date: targetDate,
        morningPickup: timeOfDay === 'morning' ? {
          status: status === 'picked_up' ? 'picked_up' : 
                 status === 'absent' ? 'unavailable' : 'expected',
          time: status === 'picked_up' ? new Date() : null
        } : undefined,
        afternoonDropoff: timeOfDay === 'afternoon' ? {
          status: status === 'dropped_off' ? 'dropped_off' : 
                 status === 'absent' ? 'unavailable' : 'expected',
          time: status === 'dropped_off' ? new Date() : null
        } : undefined
      });
    } else {
      // Update existing record
      const index = child.attendance.findIndex(a => 
        new Date(a.date).toISOString().split('T')[0] === targetDate.toISOString().split('T')[0]
      );
      
      if (timeOfDay === 'morning') {
        child.attendance[index].morningPickup = {
          ...child.attendance[index].morningPickup,
          status: status === 'picked_up' ? 'picked_up' : 
                 status === 'absent' ? 'unavailable' : 'expected',
          time: status === 'picked_up' ? new Date() : null
        };
      } else if (timeOfDay === 'afternoon') {
        child.attendance[index].afternoonDropoff = {
          ...child.attendance[index].afternoonDropoff,
          status: status === 'dropped_off' ? 'dropped_off' : 
                 status === 'absent' ? 'unavailable' : 'expected',
          time: status === 'dropped_off' ? new Date() : null
        };
      }
    }
    
    await child.save();
    
    res.status(200).json({
      success: true,
      message: `Attendance status updated for ${child.firstName}`
    });
  } catch (error) {
    console.error('Mark attendance status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Add attendance note for a child
export async function addAttendanceNote(req, res) {
  try {
    const { childId } = req.params;
    const { date, note } = req.body;
    const driverId = req.user._id;
    
    // Verify child is on driver's route
    const child = await Child.findById(childId);
    if (!child) {
      return res.status(404).json({
        success: false, 
        message: 'Child not found'
      });
    }
    
    const childRoute = await Route.findOne({
      _id: child.route,
      driver: driverId
    });
    
    if (!childRoute) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add notes for this child'
      });
    }
    
    // Format the date
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    // Find or create attendance record
    let attendanceRecord = child.attendance.find(a => 
      new Date(a.date).toISOString().split('T')[0] === targetDate.toISOString().split('T')[0]
    );
    
    if (!attendanceRecord) {
      // Create new attendance record with note
      child.attendance.push({
        date: targetDate,
        notes: `[Driver note]: ${note}`
      });
    } else {
      // Update existing record
      const index = child.attendance.findIndex(a => 
        new Date(a.date).toISOString().split('T')[0] === targetDate.toISOString().split('T')[0]
      );
      
      // Add new note or append to existing notes
      const existingNotes = child.attendance[index].notes || '';
      child.attendance[index].notes = existingNotes ? 
        `${existingNotes}\n[Driver note]: ${note}` : 
        `[Driver note]: ${note}`;
    }
    
    await child.save();
    
    res.status(200).json({
      success: true,
      message: `Note added for ${child.firstName}`
    });
  } catch (error) {
    console.error('Add attendance note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Get attendance history for driver routes
export async function getDriverAttendanceHistory(req, res) {
  try {
    const driverId = req.user._id;
    const { startDate, endDate, route } = req.query;
    
    // Validate date range
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start and end dates are required'
      });
    }
    
    // Get routes assigned to this driver
    const driverRoutes = await Route.find({ driver: driverId });
    
    if (!driverRoutes.length) {
      return res.status(404).json({
        success: false,
        message: 'No routes assigned to this driver'
      });
    }
    
    // Filter by specific route type if provided
    const routeIds = route ? 
      driverRoutes.filter(r => r.routeType === route).map(r => r._id) : 
      driverRoutes.map(r => r._id);
    
    // Get all students on these routes
    const students = await Child.find({ route: { $in: routeIds } })
      .select('_id firstName lastName grade route attendance');
    
    // Flatten and process attendance records
    const attendanceHistory = [];
    
    for (const student of students) {
      // Filter attendance records within date range
      const filteredAttendance = student.attendance.filter(record => {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        return recordDate >= start && recordDate <= end;
      });
      
      // Format records for response
      filteredAttendance.forEach(record => {
        attendanceHistory.push({
          date: record.date,
          student: {
            _id: student._id,
            firstName: student.firstName,
            lastName: student.lastName,
            grade: student.grade
          },
          morning: {
            status: record.morningPickup?.status || null,
            parentReported: record.morningPickup?.status === 'expected' || 
                          record.morningPickup?.status === 'picked_up'
          },
          afternoon: {
            status: record.afternoonDropoff?.status || null,
            parentReported: record.afternoonDropoff?.status === 'expected' || 
                          record.afternoonDropoff?.status === 'dropped_off'
          },
          note: record.notes || '',
          parentNote: record.parentNote || ''
        });
      });
    }
    
    // Sort by date (most recent first)
    attendanceHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Calculate summary statistics
    const totalRecords = attendanceHistory.length;
    const morningExpected = attendanceHistory.filter(r => r.morning.parentReported).length;
    const morningAttended = attendanceHistory.filter(r => r.morning.status === 'picked_up').length;
    const afternoonExpected = attendanceHistory.filter(r => r.afternoon.parentReported).length;
    const afternoonAttended = attendanceHistory.filter(r => r.afternoon.status === 'dropped_off').length;
    
    const summary = {
      morningAttendanceRate: morningExpected > 0 ? 
        `${Math.round((morningAttended / morningExpected) * 100)}%` : '0%',
      afternoonAttendanceRate: afternoonExpected > 0 ? 
        `${Math.round((afternoonAttended / afternoonExpected) * 100)}%` : '0%',
      parentReportingRate: totalRecords > 0 ? 
        `${Math.round(((morningExpected + afternoonExpected) / (totalRecords * 2)) * 100)}%` : '0%'
    };
    
    res.status(200).json({
      success: true,
      data: attendanceHistory,
      summary
    });
  } catch (error) {
    console.error('Get driver attendance history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}