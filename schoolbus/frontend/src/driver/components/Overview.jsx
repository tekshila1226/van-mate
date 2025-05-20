import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useGetDriverRoutesQuery } from '../../redux/features/routeSlice';
import { useGetDriverBusesQuery } from '../../redux/features/busSlice';
import { useGetDriverRouteStudentsQuery } from '../../redux/features/attendanceSlice';
import { format } from 'date-fns';
import Spinner from './Spinner';
import { HiCheckCircle, HiMap, HiDocumentReport, HiExclamationCircle } from 'react-icons/hi';

export default function Overview() {
  // Get today's date in YYYY-MM-DD format for API queries
  const today = new Date().toISOString().split('T')[0];
  
  // Fetch real data from APIs
  const { data: routesData, isLoading: isLoadingRoutes } = useGetDriverRoutesQuery();
  const { data: busesData, isLoading: isLoadingBuses } = useGetDriverBusesQuery();
  const { data: studentsData, isLoading: isLoadingStudents } = useGetDriverRouteStudentsQuery({
    date: today
  });

  // Determine if it's morning or afternoon route based on current time
  const currentHour = new Date().getHours();
  const isMorning = currentHour < 12;
  
  // Find the current active route based on time of day
  const currentRoute = routesData?.data?.find(route => 
    (isMorning && route.type === 'morning') || (!isMorning && route.type === 'afternoon')
  );
  
  // Get the first bus from the driver's assigned buses
  const currentBus = busesData?.data?.[0];
  
  // Calculate attendance summary if we have student data
  const attendanceSummary = React.useMemo(() => {
    if (!studentsData?.data) return { total: 0, present: 0, absent: 0, pending: 0 };
    
    const timeKey = isMorning ? 'morning' : 'afternoon';
    const total = studentsData.data.length;
    const present = studentsData.data.filter(student => 
      student.status?.[timeKey] === (isMorning ? 'picked_up' : 'dropped_off')
    ).length;
    const absent = studentsData.data.filter(student => 
      student.status?.[timeKey] === 'absent'
    ).length;
    const pending = total - present - absent;
    
    // Get recent activity (last 4 status changes)
    const recentActivity = studentsData.data
      .filter(student => student.status?.[timeKey])
      .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
      .slice(0, 4)
      .map(student => ({
        id: student._id,
        student: `${student.firstName} ${student.lastName}`,
        status: student.status[timeKey] === (isMorning ? 'picked_up' : 'dropped_off') 
          ? (isMorning ? 'Picked Up' : 'Dropped Off') 
          : 'Absent',
        time: new Date(student.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        location: isMorning ? student.pickupAddress?.street : student.dropoffAddress?.street
      }));
    
    return { total, present, absent, pending, recentActivity };
  }, [studentsData, isMorning]);

  const isLoading = isLoadingRoutes || isLoadingBuses || isLoadingStudents;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Driver Dashboard</h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Quick action buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          to="/driver/attendance" 
          className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white p-4 rounded-lg transition-colors"
        >
          <HiCheckCircle className="text-xl" />
          <span className="font-medium">Manage Attendance</span>
        </Link>
        <Link 
          to="/driver/tracking" 
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors"
        >
          <HiMap className="text-xl" />
          <span className="font-medium">Start Location Tracking</span>
        </Link>
        <Link 
          to="/driver/routes" 
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition-colors"
        >
          <HiDocumentReport className="text-xl" />
          <span className="font-medium">View Route Details</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <>
          {/* Current route info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-gray-200 p-5">
              <h2 className="font-semibold text-gray-800 text-lg">Current Route</h2>
              <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                {isMorning ? 'Morning Pickup' : 'Afternoon Dropoff'}
              </span>
            </div>
            {currentRoute ? (
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Route Name</p>
                    <p className="font-medium">{currentRoute.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Route Type</p>
                    <p className="font-medium">{currentRoute.type === 'morning' ? 'Morning Pickup' : 'Afternoon Dropoff'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Students</p>
                    <p className="font-medium">{attendanceSummary.total} students assigned</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">School</p>
                    <p className="font-medium">{currentRoute.school?.name || 'Not specified'}</p>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <Link to="/driver/routes" className="text-amber-600 hover:text-amber-800 text-sm font-medium">
                    View full route details →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-5 text-center">
                <HiExclamationCircle className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                <p className="text-gray-600">No active route assigned for this time of day.</p>
                <p className="text-sm text-gray-500 mt-1">Please contact your administrator if this is unexpected.</p>
              </div>
            )}
          </motion.div>

          {/* Two-column layout for attendance & vehicle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Attendance Summary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between border-b border-gray-200 p-5">
                <h2 className="font-semibold text-gray-800 text-lg">Today's Attendance</h2>
                <Link to="/driver/attendance" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Full Details
                </Link>
              </div>
              <div className="p-5">
                <div className="flex justify-around mb-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-800">{attendanceSummary.total}</p>
                    <p className="text-sm text-gray-500">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{attendanceSummary.present}</p>
                    <p className="text-sm text-gray-500">{isMorning ? 'Picked Up' : 'Dropped Off'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-amber-600">{attendanceSummary.pending}</p>
                    <p className="text-sm text-gray-500">Pending</p>
                  </div>
                </div>
                
                {attendanceSummary.recentActivity && attendanceSummary.recentActivity.length > 0 ? (
                  <>
                    <h3 className="font-medium text-gray-700 mb-3">Recent Activity</h3>
                    <div className="space-y-3 max-h-40 overflow-y-auto">
                      {attendanceSummary.recentActivity.map(activity => (
                        <div key={activity.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                          <div>
                            <p className="font-medium text-gray-800">{activity.student}</p>
                            <div className="flex items-center text-sm text-gray-500">
                              <span>{activity.time}</span>
                              {activity.location && (
                                <>
                                  <span className="mx-1">•</span>
                                  <span>{activity.location}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            activity.status === "Absent" 
                              ? "bg-red-100 text-red-800" 
                              : "bg-green-100 text-green-800"
                          }`}>
                            {activity.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No recent attendance activity</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Vehicle Status - Simplified */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between border-b border-gray-200 p-5">
                <h2 className="font-semibold text-gray-800 text-lg">Vehicle Status</h2>
                {currentBus && (
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    currentBus.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {currentBus.isActive ? "Active" : "Inactive"}
                  </span>
                )}
              </div>
              
              {currentBus ? (
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Bus Number</p>
                      <p className="font-medium">#{currentBus.busNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">License Plate</p>
                      <p className="font-medium">{currentBus.licenseNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Capacity</p>
                      <p className="font-medium">{currentBus.capacity} students</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Year</p>
                      <p className="font-medium">{currentBus.year || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <Link to="/driver/settings" className="px-4 py-2 bg-amber-50 text-amber-700 rounded hover:bg-amber-100 transition-colors text-sm font-medium">
                      Account Settings
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-5 text-center">
                  <HiExclamationCircle className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-gray-600">No bus currently assigned to you.</p>
                  <p className="text-sm text-gray-500 mt-1">Please contact your administrator to assign a vehicle.</p>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}