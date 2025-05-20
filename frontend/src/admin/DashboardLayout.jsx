import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { 
  HiHome, HiUsers, HiTruck, HiMap, HiClipboardList, 
  HiCreditCard, HiChartBar, HiCog, HiLogout, HiMenu, 
  HiX, HiBell, HiSearch
} from 'react-icons/hi';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { logout } from '../redux/features/authSlice';

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
        setIsMobile(true);
      } else {
        setIsSidebarOpen(true);
        setIsMobile(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/admin/login');
    toast.success('Logged out successfully');
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: HiHome },
    { name: 'Users', href: '/admin/users', icon: HiUsers },
    { name: 'Vehicles', href: '/admin/vehicles', icon: HiTruck },
    { name: 'Routes', href: '/admin/routes', icon: HiMap },
    { name: 'Reports', href: '/admin/reports', icon: HiChartBar },
    { name: 'Settings', href: '/admin/settings', icon: HiCog }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm fixed w-full z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
              >
                {isSidebarOpen ? <HiX className="h-6 w-6" /> : <HiMenu className="h-6 w-6" />}
              </button>
              <div className="flex-shrink-0 flex items-center">
                <div className="flex items-center">
                  <img
                    className="block h-8 w-auto"
                    src="/logo.png"
                    alt="VANMATE"
                  />
                  <span className="ml-2 text-lg font-bold text-blue-700">VANMATE Admin</span>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="border border-gray-300 rounded-full bg-gray-50 py-1 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiSearch className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Notification Bell */}
              <div className="ml-4 relative">
                <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
                  <HiBell className="h-6 w-6" />
                  {notificationCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                      {notificationCount}
                    </span>
                  )}
                </button>
              </div>

              {/* User Profile */}
              <div className="ml-4 relative flex items-center">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </div>
                  <div className="ml-2 hidden md:block">
                    <div className="text-sm font-medium text-gray-800">{user?.firstName} {user?.lastName}</div>
                    <div className="text-xs text-gray-500">Administrator</div>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <div className="ml-4">
                <button 
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <HiLogout className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar and Content Container */}
      <div className="pt-16 flex h-screen">
        {/* Sidebar */}
        <div 
          className={`bg-white fixed inset-y-0 pt-16 left-0 z-[5] w-64 transform transition-transform duration-300 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 md:static md:h-auto`}
        >
          <div className="h-full overflow-y-auto border-r border-gray-200">
            <div className="px-4 py-6">
              <nav className="space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      location.pathname === item.href || 
                      (item.href !== '/admin' && location.pathname.startsWith(item.href))
                        ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-all`}
                  >
                    <item.icon
                      className={`${
                        location.pathname === item.href || 
                        (item.href !== '/admin' && location.pathname.startsWith(item.href))
                          ? 'text-blue-700'
                          : 'text-gray-500 group-hover:text-gray-900'
                      } mr-3 flex-shrink-0 h-5 w-5`}
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
              
              {/* Admin Status Section */}
              <div className="mt-10 pt-6 border-t border-gray-200">
                <div className="flex flex-col items-center">
                  <div className="bg-blue-600 rounded-full h-12 w-12 flex items-center justify-center text-white text-lg font-bold">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm font-medium text-gray-800">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-gray-500">{user?.schoolName}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="mt-4 w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <HiLogout className="mr-2 h-4 w-4" /> Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className={`flex-1 overflow-auto p-6 ${isMobile ? '' : 'pl-6'}`}>
          <div className="container mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Overlay for mobile view when sidebar is open */}
      {isSidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 z-[4] bg-black bg-opacity-50"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
