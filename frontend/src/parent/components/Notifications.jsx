import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { 
  HiCheck, 
  HiArrowDown, 
  HiCurrencyDollar, 
  HiClock, 
  HiCog, 
  HiInformationCircle,
  HiBell,
  HiTrash,
  HiCheckCircle
} from 'react-icons/hi2';
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useClearAllNotificationsMutation,
  useUpdatePreferencesMutation
} from '../../redux/features/notificationSlice';
import Spinner from './Spinner';

export default function Notifications() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [preferences, setPreferences] = useState({
    pickup_dropoff: true,
    delays: true,
    payment: true,
    system: true
  });

  // Fetch notifications data
  const { 
    data: notificationsData, 
    isLoading, 
    isError, 
    error 
  } = useGetNotificationsQuery();

  // RTK Query mutation hooks
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [clearAllNotifications] = useClearAllNotificationsMutation();
  const [updatePreferences] = useUpdatePreferencesMutation();

  // Fetch user preferences
  useEffect(() => {
    if (notificationsData?.preferences) {
      setPreferences(notificationsData.preferences);
    }
  }, [notificationsData]);

  // Show error toast if fetch fails
  useEffect(() => {
    if (isError) {
      toast.error(error?.data?.message || 'Failed to load notifications');
    }
  }, [isError, error]);

  const notificationFilters = [
    { id: 'all', label: 'All' },
    { id: 'pickup', label: 'Pickups' },
    { id: 'dropoff', label: 'Drop-offs' },
    { id: 'payment', label: 'Payments' },
    { id: 'delay', label: 'Delays' },
    { id: 'system', label: 'System' },
  ];

  // Handle marking a notification as read
  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id).unwrap();
      toast.success('Notification marked as read');
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  // Handle delete notification
  const handleDeleteNotification = async (id) => {
    try {
      await deleteNotification(id).unwrap();
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  // Handle clear all notifications
  const handleClearAllNotifications = async () => {
    try {
      await clearAllNotifications().unwrap();
      toast.success('All notifications cleared');
    } catch (error) {
      toast.error('Failed to clear notifications');
    }
  };

  // Handle preference toggle
  const handlePreferenceToggle = async (prefId) => {
    const updatedPreferences = {
      ...preferences,
      [prefId]: !preferences[prefId]
    };
    
    setPreferences(updatedPreferences);
    
    try {
      await updatePreferences(updatedPreferences).unwrap();
      toast.success('Preferences updated');
    } catch (error) {
      // Revert state if API call fails
      setPreferences(preferences);
      toast.error('Failed to update preferences');
    }
  };

  // Process notifications from the API response
  const processNotifications = () => {
    if (!notificationsData?.data) return [];
    
    let notifications = [...notificationsData.data];
    
    // Apply filters
    if (showUnreadOnly) {
      notifications = notifications.filter(notification => !notification.isRead);
    }
    
    if (activeFilter !== 'all') {
      notifications = notifications.filter(notification => notification.type === activeFilter);
    }
    
    return notifications;
  };

  // Group notifications by date
  const groupNotificationsByDate = (notifications) => {
    return notifications.reduce((groups, notification) => {
      // Format date for grouping
      const date = formatDateGroup(notification.createdAt);
      
      if (!groups[date]) {
        groups[date] = [];
      }
      
      groups[date].push(notification);
      return groups;
    }, {});
  };

  // Format date for grouping
  const formatDateGroup = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  // Format time for display
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch(type) {
      case 'pickup':
        return (
          <div className="bg-green-100 p-2 rounded-full">
            <HiCheck className="w-5 h-5 text-green-600" />
          </div>
        );
      case 'dropoff':
        return (
          <div className="bg-blue-100 p-2 rounded-full">
            <HiArrowDown className="w-5 h-5 text-blue-600" />
          </div>
        );
      case 'payment':
        return (
          <div className="bg-yellow-100 p-2 rounded-full">
            <HiCurrencyDollar className="w-5 h-5 text-yellow-600" />
          </div>
        );
      case 'delay':
        return (
          <div className="bg-orange-100 p-2 rounded-full">
            <HiClock className="w-5 h-5 text-orange-600" />
          </div>
        );
      case 'system':
        return (
          <div className="bg-purple-100 p-2 rounded-full">
            <HiCog className="w-5 h-5 text-purple-600" />
          </div>
        );
      default:
        return (
          <div className="bg-gray-100 p-2 rounded-full">
            <HiInformationCircle className="w-5 h-5 text-gray-600" />
          </div>
        );
    }
  };

  // Get unread count
  const getUnreadCount = () => {
    if (!notificationsData?.data) return 0;
    return notificationsData.data.filter(notification => !notification.isRead).length;
  };

  // Prepare filtered notifications and group them by date
  const filteredNotifications = processNotifications();
  const groupedNotifications = groupNotificationsByDate(filteredNotifications);
  
  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-16">
        <Spinner />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 md:p-6 md:pt-20"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Notifications</h1>
        <p className="text-gray-600">
          Stay updated with pickup, drop-off, and payment notifications for your children
        </p>
      </div>

      {/* Notification actions and filters */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          {notificationFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeFilter === filter.id 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="unreadOnly"
              checked={showUnreadOnly}
              onChange={() => setShowUnreadOnly(!showUnreadOnly)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="unreadOnly" className="ml-2 text-sm text-gray-700">
              Unread only ({getUnreadCount()})
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleMarkAllAsRead}
              disabled={filteredNotifications.length === 0}
              className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 font-medium rounded-md hover:bg-indigo-100 transition-colors disabled:opacity-50 flex items-center"
            >
              <HiCheckCircle className="w-4 h-4 mr-1" /> Mark all read
            </button>
            <button
              onClick={handleClearAllNotifications}
              disabled={filteredNotifications.length === 0}
              className="px-3 py-1.5 text-sm bg-red-50 text-red-600 font-medium rounded-md hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center"
            >
              <HiTrash className="w-4 h-4 mr-1" /> Clear all
            </button>
          </div>
        </div>
      </div>

      {/* Notification list */}
      {Object.keys(groupedNotifications).length > 0 ? (
        Object.entries(groupedNotifications).map(([date, notificationsForDate]) => (
          <div key={date} className="mb-6">
            <h2 className="text-sm font-medium text-gray-500 mb-4">{date}</h2>
            <div className="space-y-4">
              {notificationsForDate.map((notification) => (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`bg-white rounded-xl border ${notification.isRead ? 'border-gray-200' : 'border-indigo-300'} p-4 shadow-sm relative overflow-hidden`}
                >
                  {/* Unread indicator dot */}
                  {!notification.isRead && (
                    <div className="absolute top-0 right-0 h-2 w-2 bg-indigo-600 rounded-full m-2"></div>
                  )}
                  <div className="flex items-start">
                    <div className="mr-4 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-800">{notification.title}</h3>
                          <p className="text-gray-600">{notification.message}</p>
                        </div>
                        <span className="text-xs text-gray-500">{formatTime(notification.createdAt)}</span>
                      </div>
                      <div className="mt-3 flex items-center space-x-3">
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification._id)}
                            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                          >
                            <HiCheck className="w-4 h-4 mr-1" />
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification._id)}
                          className="text-sm text-gray-500 hover:text-red-600 flex items-center"
                        >
                          <HiTrash className="w-4 h-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <HiBell className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-1">No notifications</h3>
          <p className="text-gray-500">You're all caught up! Check back later for updates.</p>
        </div>
      )}

      {/* Notification settings */}
      <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Notification Preferences</h2>
        <div className="space-y-4">
          {
            [{ id: 'pickup_dropoff', label: 'Pickup & Drop-off alerts', description: 'Get notified when your child boards or exits the bus' },
            { id: 'delays', label: 'Delay notifications', description: 'Receive alerts about bus delays or schedule changes' },
            { id: 'payment', label: 'Payment reminders', description: 'Get reminded before monthly payments are due' },
            { id: 'system', label: 'System updates', description: 'Stay informed about app updates and improvements' },
          ].map((preference) => (
            <div key={preference.id} className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800">{preference.label}</h3>
                <p className="text-sm text-gray-500">{preference.description}</p>
              </div>
              <div className="flex items-center space-x-3">
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={preferences[preference.id] || false}
                    onChange={() => handlePreferenceToggle(preference.id)}
                    className="sr-only peer" 
                  />
                  <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}