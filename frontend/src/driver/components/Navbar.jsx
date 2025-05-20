import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { logout } from '../../redux/features/authSlice';
import { HiBell, HiBars3, HiChevronDown } from 'react-icons/hi2';

export default function Navbar({ toggleSidebar }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const notifications = [
    { id: 1, text: "New student added to your route", time: "1h ago", isNew: true },
    { id: 2, text: "Route schedule updated for tomorrow", time: "2h ago", isNew: true },
    { id: 3, text: "Maintenance reminder for your vehicle", time: "1d ago", isNew: false },
  ];
  
  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/driver/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full z-40">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          {/* Hamburger icon - ONLY visible on mobile */}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none md:hidden"
          >
            <HiBars3 className="h-6 w-6" />
          </button>
          
          <Link to="/driver" className="flex items-center">
            <img 
              src="/logo.png"
              alt="Logo" 
              className="h-8 w-auto" 
            />
            <span className="ml-2 text-xl font-bold text-amber-600 hidden md:block">VANMATE</span>
            <span className="ml-2 text-sm text-gray-500 hidden md:block">Driver Panel</span>
          </Link>
        </div>
        
        <div className="flex items-center">
          {/* Status Indicator */}
          <div className="mr-4 hidden md:flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            On Duty
          </div>
          
          {/* Notifications */}
          <div className="relative mr-4">
            <button 
              className="p-2 rounded-full hover:bg-gray-100 relative focus:outline-none"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <HiBell className="h-6 w-6 text-gray-500" />
              {notifications.some(n => n.isNew) && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-2 z-10 border border-gray-200">
                <div className="px-4 py-2 border-b border-gray-200">
                  <h3 className="font-medium">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map(notification => (
                    <div 
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 ${notification.isNew ? 'bg-blue-50' : ''}`}
                    >
                      <p className="text-sm text-gray-800">{notification.text}</p>
                      <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-gray-200">
                  <Link to="/driver/notifications" className="text-sm text-blue-600 hover:text-blue-800">
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          {/* Profile Dropdown */}
          <div className="relative">
            <button 
              className="flex items-center focus:outline-none"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold mr-2">
                {user?.firstName ? user.firstName.charAt(0) : 'D'}
              </div>
              <span className="text-sm text-gray-700 hidden md:block">
                {user?.firstName ? `${user.firstName} ${user.lastName}` : 'David Driver'}
              </span>
              <HiChevronDown className="h-5 w-5 text-gray-400 ml-1 hidden md:block" />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10 border border-gray-200">
                <Link
                  to="/driver/settings"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}