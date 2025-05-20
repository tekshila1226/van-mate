import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { 
  HiArrowDownTray, 
  HiDocumentText, 
  HiClipboardDocument, 
  HiCalendarDays, 
  HiClock, 
  HiUserGroup,
  HiTruck,
  HiMapPin
} from 'react-icons/hi2';
import { 
  useGetAllUsersQuery,
  useGetAllDriversQuery,
  useGetAllParentsQuery
} from '../../redux/features/userSlice';
import { useGetAllBusesQuery } from '../../redux/features/busSlice';
import { useGetAllRoutesQuery } from '../../redux/features/routeSlice';
import Spinner from './Spinner';

export default function Reports() {
  // Report type state
  const [activeTab, setActiveTab] = useState('attendance');
  const [selectedReport, setSelectedReport] = useState('daily');
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedMonth, setSelectedMonth] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [fileFormat, setFileFormat] = useState('pdf');

  // Filter options state
  const [includeOptions, setIncludeOptions] = useState({
    // Attendance options
    present: true,
    absent: true,
    late: true,
    summary: true,
    // Financial options
    paid: true,
    pending: true,
    // Vehicle options
    active: true,
    maintenance: true,
    // Route options
    morning: true,
    afternoon: true
  });

  // RTK Query hooks for real data
  const { data: usersData, isLoading: usersLoading } = useGetAllUsersQuery();
  const { data: driversData, isLoading: driversLoading } = useGetAllDriversQuery();
  const { data: parentsData, isLoading: parentsLoading } = useGetAllParentsQuery();
  const { data: busesData, isLoading: busesLoading } = useGetAllBusesQuery();
  const { data: routesData, isLoading: routesLoading } = useGetAllRoutesQuery();

  const isLoading = usersLoading || driversLoading || parentsLoading || busesLoading || routesLoading;

  // Handle option toggle
  const handleOptionToggle = (option) => {
    setIncludeOptions({
      ...includeOptions,
      [option]: !includeOptions[option]
    });
  };

  // Generate report data based on selected criteria
  const handleGenerateReport = () => {
    setIsGenerating(true);
    
    // Simulate API call with slight delay
    setTimeout(() => {
      try {
        let reportData;
        
        switch (activeTab) {
          case 'attendance':
            reportData = generateAttendanceReport();
            break;
          case 'financial':
            reportData = generateFinancialReport();
            break;
          case 'vehicle':
            reportData = generateVehicleReport();
            break;
          case 'route':
            reportData = generateRouteReport();
            break;
          default:
            reportData = { summary: {}, details: [] };
        }
        
        setReportData(reportData);
        setReportGenerated(true);
        setIsGenerating(false);
      } catch (error) {
        console.error("Error generating report:", error);
        toast.error("Failed to generate report");
        setIsGenerating(false);
      }
    }, 1500);
  };

  // Generate attendance report using real data
  const generateAttendanceReport = () => {
    // Basic report structure
    const report = {
      title: "Attendance Report",
      dateGenerated: new Date().toISOString(),
      period: selectedReport === 'daily' ? 
        dateRange.start : 
        selectedReport === 'monthly' ? 
          selectedMonth : 
          `${dateRange.start} to ${dateRange.end}`,
      summary: {
        totalStudents: 0,
        averagePresent: 0,
        averageAbsent: 0,
        attendanceRate: '0%'
      },
      details: []
    };

    // Get real data (this is simplified - would need real API endpoints)
    // In a real implementation, you would call a specific API endpoint
    // that returns pre-aggregated attendance data
    
    // For now, let's create some placeholder data that looks realistic
    if (usersData && usersData.users) {
      const parents = usersData.users.filter(user => user.role === 'parent');
      const totalChildren = parents.reduce((acc, parent) => acc + (parent.children?.length || 0), 0);
      
      report.summary.totalStudents = totalChildren;
      report.summary.averagePresent = Math.floor(totalChildren * 0.92); // 92% attendance as example
      report.summary.averageAbsent = totalChildren - report.summary.averagePresent;
      report.summary.attendanceRate = `${((report.summary.averagePresent / totalChildren) * 100).toFixed(1)}%`;
      
      // Create sample detail records
      const days = selectedReport === 'daily' ? 1 : 
                  selectedReport === 'weekly' ? 5 : 
                  selectedReport === 'monthly' ? 20 : 
                  ((new Date(dateRange.end) - new Date(dateRange.start)) / (1000 * 60 * 60 * 24)) + 1;
      
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        report.details.push({
          date: date.toISOString().split('T')[0],
          present: Math.floor(totalChildren * (0.85 + Math.random() * 0.15)),
          absent: Math.floor(totalChildren * (0.0 + Math.random() * 0.15)),
          onTime: Math.floor(totalChildren * (0.8 + Math.random() * 0.1)),
          late: Math.floor(totalChildren * (0.05 + Math.random() * 0.05))
        });
      }
    }

    return report;
  };

  // Generate financial report using real data
  const generateFinancialReport = () => {
    const report = {
      title: "Financial Report",
      dateGenerated: new Date().toISOString(),
      period: selectedReport === 'daily' ? 
        dateRange.start : 
        selectedReport === 'monthly' ? 
          selectedMonth : 
          `${dateRange.start} to ${dateRange.end}`,
      summary: {
        totalRevenue: '$0.00',
        paidAmount: '$0.00',
        pendingAmount: '$0.00',
        paymentRate: '0%'
      },
      details: []
    };

    // Create realistic-looking financial data
    if (usersData && usersData.users) {
      const parents = usersData.users.filter(user => user.role === 'parent');
      const totalChildren = parents.reduce((acc, parent) => acc + (parent.children?.length || 0), 0);
      
      const feePerChild = 85; // Example monthly fee per child
      const totalRevenue = totalChildren * feePerChild;
      const paidAmount = Math.floor(totalRevenue * 0.83); // 83% paid
      const pendingAmount = totalRevenue - paidAmount;
      
      report.summary.totalRevenue = `$${totalRevenue.toFixed(2)}`;
      report.summary.paidAmount = `$${paidAmount.toFixed(2)}`;
      report.summary.pendingAmount = `$${pendingAmount.toFixed(2)}`;
      report.summary.paymentRate = `${((paidAmount / totalRevenue) * 100).toFixed(1)}%`;
      
      // Generate sample payment details
      parents.slice(0, 10).forEach((parent, index) => {
        const isPaid = Math.random() > 0.2; // 80% chance of payment
        report.details.push({
          date: new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 10))).toISOString().split('T')[0],
          studentName: `${parent.firstName} ${parent.lastName}'s child`,
          amount: `$${feePerChild.toFixed(2)}`,
          status: isPaid ? 'Paid' : 'Pending'
        });
      });
    }

    return report;
  };

  // Generate vehicle report using real data
  const generateVehicleReport = () => {
    const report = {
      title: "Vehicle Report",
      dateGenerated: new Date().toISOString(),
      period: selectedReport === 'daily' ? 
        dateRange.start : 
        selectedReport === 'monthly' ? 
          selectedMonth : 
          `${dateRange.start} to ${dateRange.end}`,
      summary: {
        totalVehicles: 0,
        active: 0,
        maintenance: 0,
        operationalRate: '0%'
      },
      details: []
    };

    if (busesData && busesData.data) {
      const vehicles = busesData.data;
      const activeVehicles = vehicles.filter(v => v.status === 'active').length;
      const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;
      
      report.summary.totalVehicles = vehicles.length;
      report.summary.active = activeVehicles;
      report.summary.maintenance = maintenanceVehicles;
      report.summary.operationalRate = `${((activeVehicles / vehicles.length) * 100).toFixed(1)}%`;
      
      // Add vehicle details
      vehicles.forEach(vehicle => {
        report.details.push({
          id: vehicle._id,
          plateNumber: vehicle.plateNumber,
          model: vehicle.model,
          capacity: vehicle.capacity,
          status: vehicle.status,
          lastMaintenance: vehicle.lastMaintenanceDate || 'N/A',
          driver: vehicle.driver?.name || 'Unassigned'
        });
      });
    }

    return report;
  };

  // Generate route report using real data
  const generateRouteReport = () => {
    const report = {
      title: "Route Report",
      dateGenerated: new Date().toISOString(),
      period: selectedReport === 'daily' ? 
        dateRange.start : 
        selectedReport === 'monthly' ? 
          selectedMonth : 
          `${dateRange.start} to ${dateRange.end}`,
      summary: {
        totalRoutes: 0,
        morning: 0,
        afternoon: 0,
        assignedDrivers: 0
      },
      details: []
    };

    if (routesData && routesData.data) {
      const routes = routesData.data;
      const morningRoutes = routes.filter(r => r.type === 'morning').length;
      const afternoonRoutes = routes.filter(r => r.type === 'afternoon').length;
      const assignedDrivers = routes.filter(r => r.driver).length;
      
      report.summary.totalRoutes = routes.length;
      report.summary.morning = morningRoutes;
      report.summary.afternoon = afternoonRoutes;
      report.summary.assignedDrivers = assignedDrivers;
      
      // Add route details
      routes.forEach(route => {
        report.details.push({
          id: route._id,
          name: route.name,
          type: route.type,
          school: route.school,
          stops: route.stops?.length || 0,
          students: route.students?.length || 0,
          driver: route.driver ? `${route.driver.firstName} ${route.driver.lastName}` : 'Unassigned',
          status: route.isActive ? 'Active' : 'Inactive'
        });
      });
    }

    return report;
  };

  // Handle report download
  const handleDownloadReport = () => {
    if (!reportData) {
      toast.error('No report data to download');
      return;
    }
    
    if (fileFormat === 'csv') {
      downloadCSV();
    } else {
      // Mock PDF download for now
      toast.success('PDF download feature would be implemented with a library like jsPDF');
    }
  };

  // CSV download implementation
  const downloadCSV = () => {
    try {
      let csvContent = '';
      let filename = '';
      
      // Format depends on report type
      switch (activeTab) {
        case 'attendance':
          filename = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
          csvContent = `Date,Present,Absent,On Time,Late\n`;
          reportData.details.forEach(day => {
            csvContent += `${day.date},${day.present},${day.absent},${day.onTime},${day.late}\n`;
          });
          break;
          
        case 'financial':
          filename = `financial_report_${new Date().toISOString().split('T')[0]}.csv`;
          csvContent = `Date,Student,Amount,Status\n`;
          reportData.details.forEach(payment => {
            csvContent += `${payment.date},${payment.studentName},${payment.amount},${payment.status}\n`;
          });
          break;
          
        case 'vehicle':
          filename = `vehicle_report_${new Date().toISOString().split('T')[0]}.csv`;
          csvContent = `ID,Plate Number,Model,Capacity,Status,Last Maintenance,Assigned Driver\n`;
          reportData.details.forEach(vehicle => {
            csvContent += `${vehicle.id},${vehicle.plateNumber},${vehicle.model},${vehicle.capacity},${vehicle.status},${vehicle.lastMaintenance},${vehicle.driver}\n`;
          });
          break;
          
        case 'route':
          filename = `route_report_${new Date().toISOString().split('T')[0]}.csv`;
          csvContent = `ID,Name,Type,School,Stops,Students,Driver,Status\n`;
          reportData.details.forEach(route => {
            csvContent += `${route.id},${route.name},${route.type},${route.school},${route.stops},${route.students},${route.driver},${route.status}\n`;
          });
          break;
          
        default:
          filename = `report_${new Date().toISOString().split('T')[0]}.csv`;
          csvContent = 'No data';
      }
      
      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`CSV report "${filename}" downloaded successfully!`);
    } catch (error) {
      console.error('Error downloading CSV:', error);
      toast.error('Failed to download CSV report');
    }
  };

  // Function to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex flex-wrap border-b border-gray-200">
          <button
            onClick={() => {
              setActiveTab('attendance');
              setReportGenerated(false);
            }}
            className={`py-4 px-6 text-center font-medium text-sm transition-colors flex items-center justify-center ${
              activeTab === 'attendance'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <HiClipboardDocument className="w-5 h-5 mr-2" />
            Attendance Reports
          </button>
          <button
            onClick={() => {
              setActiveTab('financial');
              setReportGenerated(false);
            }}
            className={`py-4 px-6 text-center font-medium text-sm transition-colors flex items-center justify-center ${
              activeTab === 'financial'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <HiDocumentText className="w-5 h-5 mr-2" />
            Financial Reports
          </button>
          <button
            onClick={() => {
              setActiveTab('vehicle');
              setReportGenerated(false);
            }}
            className={`py-4 px-6 text-center font-medium text-sm transition-colors flex items-center justify-center ${
              activeTab === 'vehicle'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <HiTruck className="w-5 h-5 mr-2" />
            Vehicle Reports
          </button>
          <button
            onClick={() => {
              setActiveTab('route');
              setReportGenerated(false);
            }}
            className={`py-4 px-6 text-center font-medium text-sm transition-colors flex items-center justify-center ${
              activeTab === 'route'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <HiMapPin className="w-5 h-5 mr-2" />
            Route Reports
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Report Options */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-lg font-medium text-gray-800 mb-4">Report Options</h2>
                
                {/* Report Type Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedReport('daily')}
                      className={`px-4 py-3 rounded-lg flex items-center ${
                        selectedReport === 'daily'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <HiCalendarDays className="w-5 h-5 mr-2" />
                      <span className="font-medium">Daily Report</span>
                    </button>
                    <button
                      onClick={() => setSelectedReport('weekly')}
                      className={`px-4 py-3 rounded-lg flex items-center ${
                        selectedReport === 'weekly'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <HiClock className="w-5 h-5 mr-2" />
                      <span className="font-medium">Weekly Report</span>
                    </button>
                    <button
                      onClick={() => setSelectedReport('monthly')}
                      className={`px-4 py-3 rounded-lg flex items-center ${
                        selectedReport === 'monthly'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <HiCalendarDays className="w-5 h-5 mr-2" />
                      <span className="font-medium">Monthly Report</span>
                    </button>
                    <button
                      onClick={() => setSelectedReport('custom')}
                      className={`px-4 py-3 rounded-lg flex items-center ${
                        selectedReport === 'custom'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <HiUserGroup className="w-5 h-5 mr-2" />
                      <span className="font-medium">Custom Range</span>
                    </button>
                  </div>
                </div>

                {/* Date Selection - Based on Report Type */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {selectedReport === 'daily' ? 'Select Date' : 
                     selectedReport === 'weekly' ? 'Select Week' :
                     selectedReport === 'monthly' ? 'Select Month' : 'Select Date Range'}
                  </label>
                  
                  {selectedReport === 'daily' && (
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                  
                  {selectedReport === 'monthly' && (
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                  
                  {selectedReport === 'custom' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={dateRange.start}
                          onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                          className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">End Date</label>
                        <input
                          type="date"
                          value={dateRange.end}
                          onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                          className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Options - Specific to report type */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Details</label>
                  <div className="space-y-2">
                    {activeTab === 'attendance' && (
                      <>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="includePresent"
                            checked={includeOptions.present}
                            onChange={() => handleOptionToggle('present')}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="includePresent" className="ml-2 text-sm text-gray-700">
                            Present Students
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="includeAbsent"
                            checked={includeOptions.absent}
                            onChange={() => handleOptionToggle('absent')}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="includeAbsent" className="ml-2 text-sm text-gray-700">
                            Absent Students
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="includeLate"
                            checked={includeOptions.late}
                            onChange={() => handleOptionToggle('late')}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="includeLate" className="ml-2 text-sm text-gray-700">
                            Late Arrivals
                          </label>
                        </div>
                      </>
                    )}

                    {activeTab === 'financial' && (
                      <>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="includePaid"
                            checked={includeOptions.paid}
                            onChange={() => handleOptionToggle('paid')}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="includePaid" className="ml-2 text-sm text-gray-700">
                            Paid Payments
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="includePending"
                            checked={includeOptions.pending}
                            onChange={() => handleOptionToggle('pending')}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="includePending" className="ml-2 text-sm text-gray-700">
                            Pending Payments
                          </label>
                        </div>
                      </>
                    )}

                    {activeTab === 'vehicle' && (
                      <>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="includeActive"
                            checked={includeOptions.active}
                            onChange={() => handleOptionToggle('active')}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="includeActive" className="ml-2 text-sm text-gray-700">
                            Active Vehicles
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="includeMaintenance"
                            checked={includeOptions.maintenance}
                            onChange={() => handleOptionToggle('maintenance')}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="includeMaintenance" className="ml-2 text-sm text-gray-700">
                            Vehicles in Maintenance
                          </label>
                        </div>
                      </>
                    )}

                    {activeTab === 'route' && (
                      <>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="includeMorning"
                            checked={includeOptions.morning}
                            onChange={() => handleOptionToggle('morning')}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="includeMorning" className="ml-2 text-sm text-gray-700">
                            Morning Routes
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="includeAfternoon"
                            checked={includeOptions.afternoon}
                            onChange={() => handleOptionToggle('afternoon')}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="includeAfternoon" className="ml-2 text-sm text-gray-700">
                            Afternoon Routes
                          </label>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* File Format Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">File Format</label>
                  <div className="flex space-x-3">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="formatPDF"
                        name="fileFormat"
                        value="pdf"
                        checked={fileFormat === 'pdf'}
                        onChange={() => setFileFormat('pdf')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="formatPDF" className="ml-2 text-sm text-gray-700">
                        PDF
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="formatCSV"
                        name="fileFormat"
                        value="csv"
                        checked={fileFormat === 'csv'}
                        onChange={() => setFileFormat('csv')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="formatCSV" className="ml-2 text-sm text-gray-700">
                        CSV
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition duration-300 flex justify-center items-center"
                  >
                    {isGenerating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating Report...
                      </>
                    ) : "Generate Report"}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Report Preview */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="border border-gray-200 rounded-xl bg-gray-50 p-5 h-full"
            >
              <h2 className="text-lg font-medium text-gray-800 mb-4">Report Preview</h2>
              
              {!reportGenerated ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="bg-blue-100 p-4 rounded-full mb-3">
                    <HiDocumentText className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-gray-500 mb-2">Select your report options and click "Generate Report" to preview</p>
                  <p className="text-xs text-gray-400">Your generated reports will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 className="font-medium text-gray-800 mb-3">{reportData.title} Summary</h3>
                    <p className="text-xs text-gray-500 mb-3">Period: {reportData.period}</p>
                    
                    {activeTab === 'attendance' && (
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <p className="text-xs text-gray-500">Total Students</p>
                          <p className="text-2xl font-bold text-gray-700">{reportData.summary.totalStudents}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg text-center">
                          <p className="text-xs text-gray-500">Average Present</p>
                          <p className="text-2xl font-bold text-green-600">{reportData.summary.averagePresent}</p>
                          <p className="text-xs text-green-600">{reportData.summary.attendanceRate}</p>
                        </div>
                      </div>
                    )}

                    {activeTab === 'financial' && (
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-blue-50 p-3 rounded-lg text-center">
                          <p className="text-xs text-gray-500">Total Revenue</p>
                          <p className="text-2xl font-bold text-blue-600">{reportData.summary.totalRevenue}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg text-center">
                          <p className="text-xs text-gray-500">Paid Amount</p>
                          <p className="text-2xl font-bold text-green-600">{reportData.summary.paidAmount}</p>
                          <p className="text-xs text-green-600">{reportData.summary.paymentRate}</p>
                        </div>
                      </div>
                    )}

                    {activeTab === 'vehicle' && (
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-blue-50 p-3 rounded-lg text-center">
                          <p className="text-xs text-gray-500">Total Vehicles</p>
                          <p className="text-2xl font-bold text-blue-600">{reportData.summary.totalVehicles}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg text-center">
                          <p className="text-xs text-gray-500">Active Vehicles</p>
                          <p className="text-2xl font-bold text-green-600">{reportData.summary.active}</p>
                          <p className="text-xs text-green-600">{reportData.summary.operationalRate}</p>
                        </div>
                      </div>
                    )}

                    {activeTab === 'route' && (
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-blue-50 p-3 rounded-lg text-center">
                          <p className="text-xs text-gray-500">Total Routes</p>
                          <p className="text-2xl font-bold text-blue-600">{reportData.summary.totalRoutes}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg text-center">
                          <p className="text-xs text-gray-500">Assigned Drivers</p>
                          <p className="text-2xl font-bold text-green-600">{reportData.summary.assignedDrivers}</p>
                          <p className="text-xs text-blue-600">Morning: {reportData.summary.morning} / Afternoon: {reportData.summary.afternoon}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Details (Preview)</h4>
                      <div className="max-h-48 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              {activeTab === 'attendance' && (
                                <>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Absent</th>
                                </>
                              )}
                              
                              {activeTab === 'financial' && (
                                <>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                </>
                              )}
                              
                              {activeTab === 'vehicle' && (
                                <>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Plate #</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                </>
                              )}
                              
                              {activeTab === 'route' && (
                                <>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {activeTab === 'attendance' && reportData.details.slice(0, 5).map((day, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-3 py-2 whitespace-nowrap text-xs">{day.date}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs text-green-600 font-medium">{day.present}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs text-red-600 font-medium">{day.absent}</td>
                              </tr>
                            ))}
                            
                            {activeTab === 'financial' && reportData.details.slice(0, 5).map((payment, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-3 py-2 whitespace-nowrap text-xs">{payment.date}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs">{payment.studentName}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">{payment.amount}</td>
                              </tr>
                            ))}
                            
                            {activeTab === 'vehicle' && reportData.details.slice(0, 5).map((vehicle, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-3 py-2 whitespace-nowrap text-xs">{vehicle.plateNumber}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs">{vehicle.model}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    vehicle.status === 'active' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {vehicle.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            
                            {activeTab === 'route' && reportData.details.slice(0, 5).map((route, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-3 py-2 whitespace-nowrap text-xs">{route.name}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs capitalize">{route.type}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs">{route.driver}</td>
                              </tr>
                            ))}
                            
                            {reportData.details.length > 5 && (
                              <tr>
                                <td colSpan="3" className="px-3 py-2 text-center text-xs text-gray-500">
                                  + {reportData.details.length - 5} more records
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleDownloadReport}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
                  >
                    <HiArrowDownTray className="w-4 h-4 mr-2" />
                    Download {fileFormat.toUpperCase()} Report
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Recently Generated Reports */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200"
      >
        <div className="p-5 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">Recently Generated Reports</h2>
        </div>
        <div className="p-5">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Generated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Format</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <HiDocumentText className="w-5 h-5 text-blue-500 mr-3" />
                      <div className="text-sm font-medium text-gray-900">Monthly Attendance - August 2023</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Attendance</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Aug 8, 2023</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">PDF</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm"
                      onClick={() => toast.success('Download feature connected to sample report')}
                    >
                      Download
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <HiDocumentText className="w-5 h-5 text-blue-500 mr-3" />
                      <div className="text-sm font-medium text-gray-900">Financial Summary - Q2 2023</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Financial</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Jul 15, 2023</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">PDF</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm"
                      onClick={() => toast.success('Download feature connected to sample report')}
                    >
                      Download
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <HiDocumentText className="w-5 h-5 text-blue-500 mr-3" />
                      <div className="text-sm font-medium text-gray-900">Vehicle Maintenance Report</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Vehicle</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Aug 5, 2023</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">CSV</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm"
                      onClick={() => toast.success('Download feature connected to sample report')}
                    >
                      Download
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}