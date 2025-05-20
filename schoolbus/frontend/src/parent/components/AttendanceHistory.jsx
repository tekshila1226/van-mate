import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { 
  HiDocumentText, 
  HiCheckCircle, 
  HiXCircle, 
  HiClock,
  HiArrowDown,
  HiHome,
  HiCalendar,
  HiInformationCircle,
  HiExclamationCircle
} from 'react-icons/hi2';
import { TbBusStop } from 'react-icons/tb';
import { 
  useGetAttendanceHistoryQuery,
  useGetAttendanceStatsQuery,
  useGetTodayAttendanceQuery,
  useReportAbsenceMutation,
  useUpdateDailyAttendanceMutation,
  useSendDriverNoteMutation
} from '../../redux/features/attendanceSlice';
import { useGetChildrenQuery } from '../../redux/features/childSlice';
import Spinner from './Spinner';

export default function AttendanceHistory() {
  const [selectedChild, setSelectedChild] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));
  const [showReportModal, setShowReportModal] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState({
    morningPickup: true,
    afternoonDropoff: true
  });
  const [reportData, setReportData] = useState({
    date: new Date().toISOString().split('T')[0],
    status: 'absent',
    reason: '',
    returnDate: '',
    morningOnly: false,
    afternoonOnly: false
  });
  const [driverNote, setDriverNote] = useState('');
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  
  // First, add a new state to track multiple days of attendance
  const [multiDayAttendance, setMultiDayAttendance] = useState([]);
  const [showMultiDayModal, setShowMultiDayModal] = useState(false);
  
  // Extract month/year for API queries
  const getMonthYearParams = () => {
    const [month, year] = selectedMonth.split(' ');
    const monthNumber = new Date(Date.parse(`${month} 1, ${year}`)).getMonth() + 1;
    return { month: monthNumber, year: parseInt(year) };
  };
  
  // API Queries - use our slices
  const { data: childrenData, isLoading: isLoadingChildren } = useGetChildrenQuery();
  
  const { 
    data: attendanceHistoryData,
    isLoading: isLoadingHistory,
    refetch: refetchHistory
  } = useGetAttendanceHistoryQuery(
    { childId: selectedChild?._id, ...getMonthYearParams() },
    { skip: !selectedChild }
  );
  
  const {
    data: statsData,
    isLoading: isLoadingStats
  } = useGetAttendanceStatsQuery(
    { childId: selectedChild?._id, ...getMonthYearParams() },
    { skip: !selectedChild }
  );
  
  const {
    data: todayData,
    isLoading: isLoadingToday,
    refetch: refetchToday
  } = useGetTodayAttendanceQuery(selectedChild?._id, { skip: !selectedChild });
  
  // API Mutations
  const [reportAbsence, { isLoading: isReporting }] = useReportAbsenceMutation();
  const [updateDailyAttendance, { isLoading: isUpdatingDaily }] = useUpdateDailyAttendanceMutation();
  const [sendDriverNote, { isLoading: isSendingNote }] = useSendDriverNoteMutation();

  // Initialize selected child when data loads
  useEffect(() => {
    if (childrenData?.data?.length > 0 && !selectedChild) {
      setSelectedChild(childrenData.data[0]);
    }
  }, [childrenData, selectedChild]);
  
  // Update attendance data when todayData changes
  useEffect(() => {
    if (todayData?.data) {
      setTodayAttendance({
        morningPickup: todayData.data.morningPickup,
        afternoonDropoff: todayData.data.afternoonDropoff
      });
    }
  }, [todayData]);
  
  // Generate list of months for dropdown
  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    // Include current month and past 11 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate);
      date.setMonth(currentDate.getMonth() - i);
      options.push(date.toLocaleString('default', { month: 'long', year: 'numeric' }));
    }
    
    return options;
  };
  
  const months = generateMonthOptions();
  
  // Calculate attendance statistics from API data or use dummy data if loading
  const totalDays = statsData?.data?.totalDays || 0;
  const presentDays = statsData?.data?.presentDays || 0;
  const absentDays = statsData?.data?.absentDays || 0;
  const lateDays = statsData?.data?.lateDays || 0;
  const attendanceRate = statsData?.data?.attendanceRate || 0;
  
  // Handle daily attendance toggle
  const handleAttendanceToggle = async (type) => {
    if (!selectedChild?._id) return;
    
    try {
      const newValue = !todayAttendance[type];
      
      // Optimistically update UI
      setTodayAttendance(prev => ({
        ...prev,
        [type]: newValue
      }));
      
      const updateData = type === 'morningPickup' 
        ? { morningPickup: newValue } 
        : { afternoonDropoff: newValue };
      
      // API call to update attendance
      await updateDailyAttendance({
        childId: selectedChild._id,
        data: updateData
      }).unwrap();
      
      // Show toast notification
      const childName = selectedChild?.firstName || "your child";
      const timeText = type === 'morningPickup' ? 'morning pickup' : 'afternoon dropoff';
      const actionText = newValue ? 'will need' : 'will NOT need';
      
      toast.success(`You've updated that ${childName} ${actionText} ${timeText} today`);
      
      // Refetch today's data to ensure UI is in sync
      refetchToday();
      
    } catch (error) {
      // Revert optimistic update
      setTodayAttendance(prev => ({
        ...prev,
        [type]: !prev[type]
      }));
      
      toast.error('Failed to update attendance. Please try again.');
      console.error('Update attendance error:', error);
    }
  };

  // Handle reporting absence or late arrival
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedChild?._id) {
      toast.error('Please select a child first');
      return;
    }
    
    try {
      const response = await reportAbsence({
        childId: selectedChild._id,
        data: reportData
      }).unwrap();
      
      // Show success message from API
      toast.success(response.message || `Successfully reported ${reportData.status === 'absent' ? 'absence' : 'late arrival'} for ${selectedChild.firstName}`);
      
      // Close modal and reset form
      setShowReportModal(false);
      setReportData({
        date: new Date().toISOString().split('T')[0],
        status: 'absent',
        reason: '',
        returnDate: '',
        morningOnly: false,
        afternoonOnly: false
      });
      
      // Refetch attendance data
      refetchHistory();
      refetchToday();
    } catch (error) {
      toast.error('Failed to report absence. Please try again.');
      console.error('Report absence error:', error);
    }
  };
  
  // Handle downloading attendance report
  const handleDownloadReport = () => {
    if (!attendanceHistoryData?.data?.length) {
      toast.error('No attendance data to download');
      return;
    }
    
    // Simple CSV generation
    const headers = ['Date', 'Day', 'Status', 'Pickup Time', 'Dropoff Time', 'Notes'];
    const rows = attendanceHistoryData.data.map(record => [
      record.date,
      record.day,
      record.status,
      record.pickupTime,
      record.dropoffTime,
      record.notes ? record.notes.replace(/,/g, ';') : '' // Replace commas in notes to avoid CSV issues
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedChild.firstName}-attendance-${selectedMonth.replace(' ', '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success('Report downloaded successfully');
  };

  // Handle sending note to driver
  const handleSendNote = async () => {
    if (!selectedChild?._id) {
      toast.error('Please select a child first');
      return;
    }
    
    if (!driverNote.trim()) {
      toast.error('Please enter a note');
      return;
    }
    
    try {
      await sendDriverNote({
        childId: selectedChild._id,
        note: driverNote
      }).unwrap();
      
      toast.success('Note sent to driver successfully');
      setDriverNote('');
      refetchToday(); // Refresh data to show the note was sent
    } catch (error) {
      toast.error('Failed to send note to driver. Please try again.');
      console.error('Send note error:', error);
    }
  };

  // Determine if child has an active absence report for today
  const hasActiveAbsenceToday = () => {
    if (!attendanceHistoryData?.data) return false;
    
    const today = new Date().toISOString().split('T')[0];
    return attendanceHistoryData.data.some(record => 
      record.date === today && (record.status === "Absent" || record.status === "Late")
    );
  };

  // Function to generate the next 5 days (plus today)
  const generateNextDays = () => {
    const days = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'long' }),
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        morningPickup: true,
        afternoonDropoff: true
      });
    }
    return days;
  };

  // Initialize the multi-day attendance when the modal is opened
  const openMultiDayModal = () => {
    setMultiDayAttendance(generateNextDays());
    setShowMultiDayModal(true);
  };

  // Update attendance for a specific day
  const handleMultiDayToggle = (index, type) => {
    const updatedAttendance = [...multiDayAttendance];
    updatedAttendance[index][type] = !updatedAttendance[index][type];
    setMultiDayAttendance(updatedAttendance);
  };

  // Submit all attendance changes
  const handleMultiDaySubmit = async () => {
    const promises = multiDayAttendance.map(day => 
      updateDailyAttendance({
        childId: selectedChild._id,
        data: {
          date: day.date,
          morningPickup: day.morningPickup,
          afternoonDropoff: day.afternoonDropoff
        }
      }).unwrap()
    );
    
    try {
      await Promise.all(promises);
      toast.success('Attendance updated for multiple days');
      setShowMultiDayModal(false);
      refetchToday();
    } catch (error) {
      toast.error('Failed to update attendance for all days. Please try again.');
      console.error('Multi-day attendance update error:', error);
    }
  };

  return (
    <div className="space-y-6 md:pt-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Attendance Management</h1>
        
        <div className="flex items-center gap-4">
          <div>
            <select
              value={selectedChild?._id || ''}
              onChange={(e) => {
                const childId = e.target.value;
                const child = childrenData?.data?.find(c => c._id === childId);
                setSelectedChild(child);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 text-sm"
            >
              <option value="">Select a child</option>
              {!isLoadingChildren && childrenData?.data?.map(child => (
                <option key={child._id} value={child._id}>{child.firstName} {child.lastName}</option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 text-sm"
            >
              {months.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={() => {
              if (!selectedChild) {
                toast.error('Please select a child first');
                return;
              }
              setReportData(prev => ({
                ...prev,
                studentId: selectedChild._id
              }));
              setShowReportModal(true);
            }}
            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors flex items-center"
          >
            <HiDocumentText className="w-5 h-5 mr-2" />
            Report Absence/Late
          </button>

          {/* Add this near the "Report Absence/Late" button */}
          <button 
            onClick={() => {
              if (!selectedChild) {
                toast.error('Please select a child first');
                return;
              }
              openMultiDayModal();
            }}
            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center"
          >
            <HiCalendar className="w-5 h-5 mr-2" />
            Schedule Multiple Days
          </button>
        </div>
      </div>

      {/* Help Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 text-sm">
        <div className="flex">
          <HiInformationCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <div>
            <p><strong>How attendance works:</strong></p>
            <p>1. Toggle switches below to indicate if your child will need bus service today</p>
            <p>2. Use "Report Absence/Late" for longer absences or when your child will be late</p>
            <p>3. Send notes to the driver for any special instructions</p>
            <p>4. View attendance history and download reports as needed</p>
          </div>
        </div>
      </div>
      
      {/* Today's Attendance Section */}
      {selectedChild && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <HiCalendar className="text-indigo-600 w-5 h-5 mr-2" />
              <h2 className="font-semibold text-lg">Today's Bus Schedule</h2>
            </div>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
          
          {isLoadingToday ? (
            <div className="p-20 flex justify-center">
              <Spinner />
            </div>
          ) : (
            <div className="p-5">
              {hasActiveAbsenceToday() && (
                <div className="mb-5 bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                  <div className="flex">
                    <HiExclamationCircle className="h-6 w-6 text-amber-500 mr-3" />
                    <div>
                      <p className="font-medium text-amber-800">Active absence reported for today</p>
                      <p className="text-sm text-amber-700">
                        You've already reported that {selectedChild.firstName} will be absent or late today. 
                        The settings below have been automatically adjusted.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col md:flex-row gap-6">
                {/* Morning Pickup Card */}
                <div className="flex-1 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="bg-amber-100 p-2 rounded-full mr-3">
                        <TbBusStop className="text-amber-600 w-5 h-5" />
                      </div>
                      <h3 className="font-medium">Morning Pickup</h3>
                    </div>
                    <span className="text-sm text-gray-500">{todayData?.data?.pickupTime || "Expected"}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 mr-2">
                        Will {selectedChild.firstName} need morning pickup today?
                      </span>
                      <div 
                        className="text-blue-600 cursor-pointer relative"
                        onMouseEnter={() => setShowInfoTooltip('morning')}
                        onMouseLeave={() => setShowInfoTooltip(false)}
                      >
                        <HiInformationCircle className="h-5 w-5" />
                        {showInfoTooltip === 'morning' && (
                          <div className="absolute z-10 w-64 bg-white p-3 rounded-lg shadow-lg border border-gray-200 text-xs text-gray-600 -right-1 top-6">
                            Toggle this if your child <strong>will NOT need</strong> morning pickup today. 
                            The driver will be notified not to wait for your child.
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="relative">
                      <label className="inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={todayAttendance.morningPickup}
                          onChange={() => handleAttendanceToggle('morningPickup')}
                          disabled={isUpdatingDaily || hasActiveAbsenceToday()}
                        />
                        <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="mt-3 px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-600">
                    {todayAttendance.morningPickup ? 
                      `${selectedChild.firstName} will be picked up by the bus this morning` : 
                      `${selectedChild.firstName} will NOT need bus pickup this morning`}
                  </div>
                </div>
                
                {/* Afternoon Dropoff Card */}
                <div className="flex-1 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-full mr-3">
                        <HiHome className="text-blue-600 w-5 h-5" />
                      </div>
                      <h3 className="font-medium">Afternoon Dropoff</h3>
                    </div>
                    <span className="text-sm text-gray-500">{todayData?.data?.dropoffTime || "Expected"}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 mr-2">
                        Will {selectedChild.firstName} need afternoon dropoff today?
                      </span>
                      <div 
                        className="text-blue-600 cursor-pointer relative"
                        onMouseEnter={() => setShowInfoTooltip('afternoon')}
                        onMouseLeave={() => setShowInfoTooltip(false)}
                      >
                        <HiInformationCircle className="h-5 w-5" />
                        {showInfoTooltip === 'afternoon' && (
                          <div className="absolute z-10 w-64 bg-white p-3 rounded-lg shadow-lg border border-gray-200 text-xs text-gray-600 -right-1 top-6">
                            Toggle this if your child <strong>will NOT be on</strong> the afternoon bus today. 
                            For example, if they're being picked up by a parent or staying for after-school activities.
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="relative">
                      <label className="inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={todayAttendance.afternoonDropoff}
                          onChange={() => handleAttendanceToggle('afternoonDropoff')}
                          disabled={isUpdatingDaily || hasActiveAbsenceToday()}
                        />
                        <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="mt-3 px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-600">
                    {todayAttendance.afternoonDropoff ? 
                      `${selectedChild.firstName} will be on the bus for dropoff this afternoon` : 
                      `${selectedChild.firstName} will NOT need afternoon bus dropoff today`}
                  </div>
                </div>
              </div>
              
              {/* Additional notes section */}
              <div className="mt-4">
                <label htmlFor="todayNotes" className="block text-sm font-medium text-gray-700 mb-1">
                  Send special instructions to driver (optional)
                </label>
                <div className="flex gap-2">
                  <textarea 
                    id="todayNotes" 
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="Example: Child will be picked up by grandmother today, etc."
                    rows="2"
                    value={driverNote}
                    onChange={(e) => setDriverNote(e.target.value)}
                  ></textarea>
                  <button 
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors self-end disabled:bg-indigo-300 disabled:cursor-not-allowed"
                    onClick={handleSendNote}
                    disabled={isSendingNote || !driverNote.trim()}
                  >
                    {isSendingNote ? 'Sending...' : 'Send Note'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
      
      {/* Attendance Overview */}
      {selectedChild && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {isLoadingStats ? (
            <div className="col-span-4 p-10 flex justify-center">
              <Spinner />
            </div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0 }}
                className="bg-white rounded-xl shadow-sm p-5 border border-gray-200"
              >
                <div className="text-indigo-600 mb-2">
                  <HiDocumentText className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Total School Days</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalDays}</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="bg-white rounded-xl shadow-sm p-5 border border-gray-200"
              >
                <div className="text-green-600 mb-2">
                  <HiCheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Present Days</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{presentDays}</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="bg-white rounded-xl shadow-sm p-5 border border-gray-200"
              >
                <div className="text-red-600 mb-2">
                  <HiXCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Absent Days</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{absentDays}</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="bg-white rounded-xl shadow-sm p-5 border border-gray-200"
              >
                <div className="text-amber-600 mb-2">
                  <HiClock className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Attendance Rate</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{attendanceRate}%</p>
              </motion.div>
            </>
          )}
        </div>
      )}
      
      {/* Upcoming Absences Alert (if any) */}
      {selectedChild && attendanceHistoryData?.data?.some(day => 
        day.status === "Absent" && new Date(day.date) >= new Date().setHours(0,0,0,0)
      ) && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <HiClock className="h-5 w-5 text-amber-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">Upcoming Reported Absence</h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>You've reported an upcoming absence for {selectedChild.firstName}. The bus driver has been notified.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Attendance Records Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5">
          <h2 className="text-lg font-semibold mb-4">Detailed Attendance Records</h2>
          {isLoadingHistory ? (
            <div className="p-10 flex justify-center">
              <Spinner />
            </div>
          ) : attendanceHistoryData?.data?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Day</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Pickup Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Dropoff Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attendanceHistoryData.data.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">{record.day}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          record.status === 'Present' ? 'bg-green-100 text-green-800' : 
                          record.status === 'Absent' ? 'bg-red-100 text-red-800' : 
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">{record.pickupTime}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{record.dropoffTime}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{record.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No attendance records found for the selected month.
            </div>
          )}
        </div>
      </div>
      
      {/* Download Report Button */}
      {selectedChild && attendanceHistoryData?.data?.length > 0 && (
        <div className="flex justify-end">
          <button 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center"
            onClick={handleDownloadReport}
          >
            <HiArrowDown className="w-5 h-5 mr-2" />
            Download Attendance Report
          </button>
        </div>
      )}
      
      {/* Report Absence Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Report Absence or Late Arrival
            </h3>
            
            <form onSubmit={handleReportSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="childName" className="block text-sm font-medium text-gray-700 mb-1">
                    Child
                  </label>
                  <input
                    type="text"
                    id="childName"
                    value={selectedChild ? `${selectedChild.firstName} ${selectedChild.lastName}` : ''}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none"
                  />
                </div>
                
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    value={reportData.date}
                    onChange={e => setReportData({...reportData, date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    value={reportData.status}
                    onChange={e => setReportData({...reportData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="absent">Absent</option>
                    <option value="late">Late Arrival</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                    Reason (optional)
                  </label>
                  <textarea
                    id="reason"
                    value={reportData.reason}
                    onChange={e => setReportData({...reportData, reason: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows="3"
                  ></textarea>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="morningOnly"
                      checked={reportData.morningOnly}
                      onChange={e => setReportData({...reportData, morningOnly: e.target.checked})}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="morningOnly" className="ml-2 text-sm text-gray-700">
                      Morning only (Child will not need afternoon dropoff)
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                  disabled={isReporting}
                >
                  {isReporting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Multi-Day Attendance Modal */}
      {showMultiDayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-3xl">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Schedule Attendance for Multiple Days
            </h3>
            
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <HiInformationCircle className="inline-block mr-1 h-5 w-5" />
                Set bus attendance for {selectedChild?.firstName} for today and the next 5 days.
              </p>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {multiDayAttendance.map((day, index) => (
                <div key={day.date} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-800">{day.day}</h4>
                      <p className="text-sm text-gray-500">{day.displayDate}</p>
                    </div>
                    {index === 0 && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Today
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Morning Pickup */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="bg-amber-100 p-1 rounded-full mr-2">
                            <TbBusStop className="text-amber-600 w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium">Morning Pickup</span>
                        </div>
                        <label className="inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={day.morningPickup}
                            onChange={() => handleMultiDayToggle(index, 'morningPickup')}
                          />
                          <div className="relative w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {day.morningPickup ? 'Will need pickup' : 'No pickup needed'}
                      </p>
                    </div>
                    
                    {/* Afternoon Dropoff */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-1 rounded-full mr-2">
                            <HiHome className="text-blue-600 w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium">Afternoon Dropoff</span>
                        </div>
                        <label className="inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={day.afternoonDropoff}
                            onChange={() => handleMultiDayToggle(index, 'afternoonDropoff')}
                          />
                          <div className="relative w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {day.afternoonDropoff ? 'Will need dropoff' : 'No dropoff needed'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowMultiDayModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMultiDaySubmit}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Save All Attendance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}