import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useGetChildrenQuery } from '../../redux/features/childSlice';
import { useGetRecentAttendanceQuery } from '../../redux/features/attendanceSlice';
import { useGetParentInvoicesQuery } from '../../redux/features/paymentSlice';
import Spinner from '../components/Spinner';

export default function Overview() {
  // Fetch real data using Redux Query hooks
  const { 
    data: childrenData, 
    isLoading: childrenLoading, 
    error: childrenError 
  } = useGetChildrenQuery();

  const { 
    data: attendanceData, 
    isLoading: attendanceLoading, 
    error: attendanceError 
  } = useGetRecentAttendanceQuery();

  const { 
    data: invoicesData, 
    isLoading: invoicesLoading, 
    error: invoicesError 
  } = useGetParentInvoicesQuery();

  // Handle loading state
  if (childrenLoading || attendanceLoading || invoicesLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // Handle error states
  if (childrenError || attendanceError || invoicesError) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg md:pt-20">
        <p className="font-medium">Error loading dashboard data</p>
        <p className="text-sm mt-1">
          {childrenError?.data?.message || attendanceError?.data?.message || invoicesError?.data?.message || 'Please try again later'}
        </p>
      </div>
    );
  }

  console.log(childrenData.data[0]);

  // Format children data from API response
  const children = childrenData?.data?.map(child => ({
    id: child._id,
    name: `${child.firstName} ${child.lastName}`,
    age: child.age || calculateAge(child.dateOfBirth),
    grade: child.grade || 'N/A',
    school: child.schoolName || 'N/A',  // Use schoolName directly
    busNo: child.route ? `Bus #${child.route.busNumber || 'N/A'}` : 'No Bus Assigned',
    status: getChildStatus(child),
    lastSeen: formatLastSeen(child),
    pickupTime: child.route?.schedule?.pickup ? formatTime(child.route.schedule.pickup) : 'Not scheduled',
    dropoffTime: child.route?.schedule?.dropoff ? formatTime(child.route.schedule.dropoff) : 'Not scheduled',
    avatar: child.photo || `https://ui-avatars.com/api/?name=${child.firstName}+${child.lastName}&background=random`
  })) || [];

  // Format attendance data from API response
  const recentAttendance = attendanceData?.data?.slice(0, 5).map(record => ({
    date: formatDate(record.date),
    status: record.status,
    pickupTime: record.morningPickup?.time ? formatTime(record.morningPickup.time) : '-',
    dropoffTime: record.afternoonDropoff?.time ? formatTime(record.afternoonDropoff.time) : '-'
  })) || [];

  // Format payment data from invoices
  const paymentData = {
    nextPayment: invoicesData?.data?.length > 0 ? {
      amount: `$${invoicesData.data[0].amount.toFixed(2)}`,
      dueDate: formatDate(invoicesData.data[0].dueDate),
      status: invoicesData.data[0].status,
      invoiceId: invoicesData.data[0]._id
    } : null,
    recentPayments: [] // We'd need a separate query for payment history
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Children Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {children.length > 0 ? (
          children.map((child) => (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <img 
                    src={child.avatar} 
                    alt={child.name} 
                    className="w-14 h-14 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-800">{child.name}</h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="mr-2">{child.grade}</span>
                      <span className="px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">{child.busNo}</span>
                    </div>
                  </div>
                  <div className="ml-auto">
                    {renderStatusBadge(child.status)}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-500">Pickup</p>
                    <p className="font-medium text-gray-800">{child.pickupTime}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-500">Drop-off</p>
                    <p className="font-medium text-gray-800">{child.dropoffTime}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                    <p className="text-gray-500">Last seen</p>
                    <p className="font-medium text-gray-800">{child.lastSeen} ({child.status})</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-between">
                  <Link to={`/parent/tracking?child=${child.id}`} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                    Track on map
                  </Link>
                  <Link to={`/parent/children`} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                    View details
                  </Link>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-2 p-6 bg-gray-50 rounded-lg text-center">
            <p className="text-gray-600">No children found. Please add children to your account.</p>
            <Link to="/parent/children/add" className="mt-2 inline-block text-indigo-600 hover:text-indigo-800">
              Add a child
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attendance */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200"
        >
          <div className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Recent Attendance</h3>
              <Link to="/parent/attendance" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                View all
              </Link>
            </div>
            {recentAttendance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-xs font-medium text-left text-gray-500">Date</th>
                      <th className="px-4 py-2 text-xs font-medium text-left text-gray-500">Status</th>
                      <th className="px-4 py-2 text-xs font-medium text-left text-gray-500">Pickup</th>
                      <th className="px-4 py-2 text-xs font-medium text-left text-gray-500">Drop-off</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentAttendance.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-800">{item.date}</td>
                        <td className="px-4 py-3 text-sm">
                          {renderAttendanceBadge(item.status)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">{item.pickupTime}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">{item.dropoffTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">No attendance records found</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Payment Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200"
        >
          <div className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Payment Summary</h3>
              <Link to="/parent/payments" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                View all
              </Link>
            </div>
            {paymentData.nextPayment ? (
              <div className="mb-4 p-4 border border-blue-100 rounded-lg bg-blue-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Next Payment</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    paymentData.nextPayment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {paymentData.nextPayment.status === 'pending' ? 'Pending' : 'Overdue'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-800 font-semibold">{paymentData.nextPayment.amount}</p>
                    <p className="text-xs text-gray-500">Due {paymentData.nextPayment.dueDate}</p>
                  </div>
                  <Link 
                    to={`/parent/payments/${paymentData.nextPayment.invoiceId}`}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Pay Now
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mb-4 p-4 border border-green-100 rounded-lg bg-green-50">
                <p className="text-green-800 text-center">No pending payments</p>
              </div>
            )}
            
            {/* Helper functions */}
            {invoicesData?.data?.length > 0 ? (
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Recent Invoices</h4>
                {invoicesData.data.slice(0, 2).map((invoice) => (
                  <div key={invoice._id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{invoice.invoiceNumber || `INV-${invoice._id.substring(0, 8)}`}</p>
                      <p className="text-xs text-gray-500">{formatDate(invoice.dueDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">${invoice.amount.toFixed(2)}</p>
                      <p className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                          invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No invoice history</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Helper functions
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return '';
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(timeString) {
  if (!timeString) return '-';
  const date = new Date(timeString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function getChildStatus(child) {
  // Check if child is currently on bus based on attendance data
  if (child.attendance && child.attendance.length > 0) {
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = child.attendance.find(a => 
      new Date(a.date).toISOString().split('T')[0] === today);
    
    if (todayAttendance) {
      if (todayAttendance.morningPickup?.status === 'picked_up' && 
          !todayAttendance.morningPickup?.arrivedAtSchool) {
        return 'On bus';
      }
      if (todayAttendance.morningPickup?.arrivedAtSchool) {
        return 'At school';
      }
      if (todayAttendance.afternoonDropoff?.status === 'picked_up' && 
          !todayAttendance.afternoonDropoff?.arrivedAtHome) {
        return 'On bus';
      }
      if (todayAttendance.afternoonDropoff?.arrivedAtHome) {
        return 'At home';
      }
      if (todayAttendance.morningPickup?.status === 'absent' || 
          todayAttendance.afternoonDropoff?.status === 'absent') {
        return 'Absent';
      }
    }
  }
  
  // If no matching status found
  return 'Unknown';
}

function renderStatusBadge(status) {
  switch(status) {
    case 'At school':
      return (
        <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
          {status}
        </span>
      );
    case 'On bus':
      return (
        <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
          {status}
        </span>
      );
    case 'Absent':
      return (
        <span className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
          {status}
        </span>
      );
    default:
      return (
        <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
          {status}
        </span>
      );
  }
}

function renderAttendanceBadge(status) {
  if (status.toLowerCase() === 'present') {
    return (
      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
        {status}
      </span>
    );
  } else {
    return (
      <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
        {status}
      </span>
    );
  }
}

function formatLastSeen(child) {
  // Check if we have attendance records
  if (child.attendance && child.attendance.length > 0) {
    // Get most recent attendance entry
    const latestAttendance = [...child.attendance].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    )[0];
    
    if (latestAttendance) {
      const date = new Date(latestAttendance.date);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Check pickup/dropoff status
      if (latestAttendance.morningPickup?.status === 'picked_up') {
        return `${dateStr} (Morning pickup)`;
      } else if (latestAttendance.afternoonDropoff?.status === 'dropped_off') {
        return `${dateStr} (Afternoon dropoff)`;
      } else {
        return `${dateStr} (Attendance recorded)`;
      }
    }
  }
  
  return 'No recent activity';
}