import React from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'motion/react'
import { 
  HiHome, 
  HiUsers, 
  HiMapPin, 
  HiCalendar, 
  HiCreditCard, 
  HiBell, 
  HiCog,
  HiQuestionMarkCircle
} from 'react-icons/hi2'
import { TbBusStop } from "react-icons/tb";

export default function Sidebar({ isOpen, isMobile, closeSidebar }) {
  const navItems = [
    { path: "/parent", label: "Dashboard", icon: "home" },
    { path: "/parent/children", label: "My Children", icon: "users" },
    { path: "/parent/tracking", label: "Live Tracking", icon: "map-pin" },
    { path: "/parent/attendance", label: "Attendance", icon: "calendar" },
    { path: "/parent/payments", label: "Payments", icon: "credit-card" },
    { path: "/parent/notifications", label: "Notifications", icon: "bell" },
    { path: "/parent/assign-bus", label: "Assign Bus", icon: "bus" },
    { path: "/parent/settings", label: "Settings", icon: "settings" }
  ];
  
  // Function to render the appropriate icon using react-icons
  const renderIcon = (iconName) => {
    switch(iconName) {
      case "home":
        return <HiHome className="w-5 h-5" />;
      case "users":
        return <HiUsers className="w-5 h-5" />;
      case "map-pin":
        return <HiMapPin className="w-5 h-5" />;
      case "calendar":
        return <HiCalendar className="w-5 h-5" />;
      case "credit-card":
        return <HiCreditCard className="w-5 h-5" />;
      case "bell":
        return <HiBell className="w-5 h-5" />;
      case "bus":
        return <TbBusStop className="w-5 h-5" />;
      case "settings":
        return <HiCog className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <>
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20" 
          onClick={closeSidebar}
          aria-hidden="true"
        ></div>
      )}
      
      <motion.aside 
        className={`fixed top-0 left-0 z-30 h-full bg-white border-r border-gray-200 pt-16 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 ${isMobile ? 'w-64' : 'w-64'}`}
        initial={{ x: isMobile ? '-100%' : 0 }}
        animate={{ x: isOpen ? 0 : (isMobile ? '-100%' : 0) }}
        transition={{ duration: 0.3 }}
      >
        <div className="px-4 py-6">
          
          
          <nav>
            <ul className="space-y-1">
              {navItems.map((item, index) => (
                <li key={index}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/parent'}
                    onClick={isMobile ? closeSidebar : undefined}
                    className={({ isActive }) => 
                      `flex items-center px-3 py-2 rounded-md transition-colors ${
                        isActive 
                          ? 'bg-indigo-50 text-indigo-700 font-medium'
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
      </motion.aside>
    </>
  )
}