import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { useSelector } from 'react-redux';
import { 
  HiHome, 
  HiUserGroup, 
  HiClipboardDocumentCheck, 
  HiMapPin, 
  HiCreditCard, 
  HiDocumentChartBar,
  HiCog,
  HiQuestionMarkCircle
} from 'react-icons/hi2';

export default function Sidebar({ isOpen, isMobile, closeSidebar }) {
  const { user } = useSelector((state) => state.auth);
  
  const navItems = [
    { path: "/driver", label: "Dashboard", icon: "home" },
    { path: "/driver/routes", label: "Routes & Students", icon: "user-group" },
    { path: "/driver/attendance", label: "Attendance", icon: "clipboard-check" },
    { path: "/driver/tracking", label: "Location Tracking", icon: "map-pin" },
    { path: "/driver/payments", label: "Payments", icon: "credit-card" },
    { path: "/driver/reports", label: "Reports", icon: "document-chart" },
    { path: "/driver/settings", label: "Settings", icon: "settings" }
  ];
  
  // Function to render the appropriate icon using react-icons
  const renderIcon = (iconName) => {
    switch(iconName) {
      case "home":
        return <HiHome className="w-5 h-5" />;
      case "user-group":
        return <HiUserGroup className="w-5 h-5" />;
      case "clipboard-check":
        return <HiClipboardDocumentCheck className="w-5 h-5" />;
      case "map-pin":
        return <HiMapPin className="w-5 h-5" />;
      case "credit-card":
        return <HiCreditCard className="w-5 h-5" />;
      case "document-chart":
        return <HiDocumentChartBar className="w-5 h-5" />;
      case "settings":
        return <HiCog className="w-5 h-5" />;
      default:
        return null;
    }
  };

  // Determine if the sidebar should be visible
  const sidebarClasses = `fixed top-0 left-0 z-30 h-full bg-white border-r border-gray-200 pt-16 w-64
                        transform transition-transform duration-300 ease-in-out
                        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                        ${!isMobile ? 'md:translate-x-0' : ''}`;

  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20" 
          onClick={closeSidebar}
          aria-hidden="true"
        ></div>
      )}
      
      {/* Sidebar */}
      <aside className={sidebarClasses}>
        <div className="px-4 py-6">
          <div className="mb-8">
            <div className="flex items-center mb-3 px-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-lg mr-3">
                {user?.firstName ? user.firstName.charAt(0) : 'D'}
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">
                  {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Driver Name'}
                </h2>
                <p className="text-xs text-gray-500">{user?.email || 'driver@example.com'}</p>
              </div>
            </div>
          </div>
          
          <nav>
            <ul className="space-y-1">
              {navItems.map((item, index) => (
                <li key={index}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/driver'}
                    onClick={isMobile ? closeSidebar : undefined}
                    className={({ isActive }) => 
                      `flex items-center px-3 py-2 rounded-md transition-colors ${
                        isActive 
                          ? 'bg-amber-50 text-amber-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`
                    }
                  >
                    <span className="mr-3">{renderIcon(item.icon)}</span>
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
            <div>
              <p className="text-sm font-medium text-blue-800">Need Help?</p>
              <p className="text-xs text-blue-600">Contact support</p>
            </div>
            <button className="p-2 bg-blue-100 rounded-full text-blue-700 hover:bg-blue-200">
              <HiQuestionMarkCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}