import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { logout } from '../../redux/features/authSlice';
import { HiBell, HiBars3, HiChevronDown } from 'react-icons/hi2';
import { 
  useGetNotificationsQuery,
  useMarkAsReadMutation 
} from '../../redux/features/notificationSlice';

export default function Navbar({ toggleSidebar }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  
  // Fetch notifications using RTK Query
  const { data: notificationsData, isLoading: isLoadingNotifications } = useGetNotificationsQuery(
    undefined, { pollingInterval: 30000 } // Poll every 30 seconds
  );
  
  // RTK Query hook for marking notifications as read
  const [markAsRead] = useMarkAsReadMutation();
  
  // Get the most recent notifications for the dropdown (max 5)
  const recentNotifications = notificationsData?.data
    ? notificationsData.data.slice(0, 5)
    : [];
  
  // Check if there are any unread notifications
  const hasUnreadNotifications = recentNotifications.some(n => !n.isRead);

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/parent/login');
  };

  const handleOpenNotification = async (notification) => {
    if (!notification.isRead) {
      try {
        await markAsRead(notification._id).unwrap();
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
  };

  // Format relative time (e.g., "2h ago")
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffDays > 0) {
      return diffDays === 1 ? '1d ago' : `${diffDays}d ago`;
    } else if (diffHr > 0) {
      return diffHr === 1 ? '1h ago' : `${diffHr}h ago`;
    } else if (diffMin > 0) {
      return diffMin === 1 ? '1m ago' : `${diffMin}m ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-20">
      <div className="px-4 md:px-6 py-2 flex justify-between items-center">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar}
            className="p-2 mr-3 text-gray-600 hover:text-indigo-600 focus:outline-none"
          >
            <HiBars3 className="h-6 w-6" />
          </button>
          
          <Link to="/parent/dashboard" className="flex items-center">
            <img src="/logo.png" alt="VANMATE" className="h-8 w-auto mr-2" />
            <span className="text-xl font-bold text-indigo-900 hidden md:inline-block">VANMATE</span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-gray-600 hover:text-indigo-600 rounded-full hover:bg-gray-100 focus:outline-none relative"
            >
              <HiBell className="h-6 w-6" />
              {hasUnreadNotifications && (
                <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-2 z-30">
                <h3 className="px-4 py-2 font-medium border-b border-gray-200">Notifications</h3>
                
                {isLoadingNotifications ? (
                  <div className="px-4 py-3 text-center text-gray-500">
                    <svg className="animate-spin h-5 w-5 mx-auto mb-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </div>
                ) : recentNotifications.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    {recentNotifications.map(notification => (
                      <div 
                        key={notification._id} 
                        className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-100 ${!notification.isRead ? 'bg-blue-50' : ''}`}
                        onClick={() => handleOpenNotification(notification)}
                      >
                        <div className="flex justify-between">
                          <p className="text-sm font-medium">{notification.title}</p>
                          {!notification.isRead && (
                            <span className="bg-blue-500 h-2 w-2 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatRelativeTime(notification.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-3 text-center text-gray-500">
                    No new notifications
                  </div>
                )}
                
                <Link 
                  to="notifications" 
                  className="block text-center text-sm text-indigo-600 font-medium py-2 hover:bg-gray-50"
                  onClick={() => setShowNotifications(false)}
                >
                  View all notifications
                </Link>
              </div>
            )}
          </div>
          
          {/* User Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center text-gray-700 hover:text-indigo-600 focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm mr-2">
                {user?.firstName ? user.firstName.charAt(0) + (user.lastName ? user.lastName.charAt(0) : '') : 'U'}
              </div>
              <span className="hidden md:inline-block font-medium">
                {user?.firstName ? `${user.firstName} ${user.lastName}` : 'User'}
              </span>
              <HiChevronDown className="h-4 w-4 ml-1" />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-30">
                <Link 
                  to="settings" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowDropdown(false)}
                >
                  Profile Settings
                </Link>
                <Link 
                  to="children" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowDropdown(false)}
                >
                  Manage Children
                </Link>
                <button 
                  onClick={() => {
                    handleLogout();
                    setShowDropdown(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}