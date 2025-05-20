import Notification from '../models/Notification.js';
import User from '../models/User.js';

// Get all notifications for the current user
export async function getNotifications(req, res) {
  try {
    const userId = req.user._id;
    
    // Fetch notifications
    const notifications = await Notification.find({ 
      recipient: userId 
    }).sort({ createdAt: -1 });
    
    // Fetch user preferences
    const user = await User.findById(userId);
    const preferences = user.notificationPreferences || {
      pickup_dropoff: true,
      delays: true,
      payment: true,
      system: true
    };

    return res.status(200).json({
      success: true,
      data: notifications,
      preferences
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Get unread notification count
export async function getUnreadCount(req, res) {
  try {
    const userId = req.user._id;
    
    const count = await Notification.countDocuments({
      recipient: userId,
      isRead: false
    });
    
    return res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Mark a notification as read
export async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Mark all notifications as read
export async function markAllAsRead(req, res) {
  try {
    const userId = req.user._id;
    
    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );
    
    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Delete a notification
export async function deleteNotification(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: userId
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Clear all notifications
export async function clearAllNotifications(req, res) {
  try {
    const userId = req.user._id;
    
    await Notification.deleteMany({ recipient: userId });
    
    return res.status(200).json({
      success: true,
      message: 'All notifications cleared'
    });
  } catch (error) {
    console.error('Clear all notifications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

// Update notification preferences
export async function updatePreferences(req, res) {
  try {
    const userId = req.user._id;
    const preferences = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { notificationPreferences: preferences },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: user.notificationPreferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}