import React, { useState } from 'react';
import { motion } from 'motion/react';
import { HiArrowDownTray, HiDocumentText, HiClipboardDocument, HiCalendarDays, HiClock, HiUserGroup } from 'react-icons/hi2';

export default function Reports() {
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

  // Mock data for the reports
  const attendanceData = {
    summary: {
      totalStudents: 24,
      averagePresent: 22,
      averageAbsent: 2,
      attendanceRate: '91.7%'
    },
    details: [
      { date: '2023-08-01', present: 23, absent: 1, onTime: 21, late: 2 },
      { date: '2023-08-02', present: 22, absent: 2, onTime: 20, late: 2 },
      { date: '2023-08-03', present: 21, absent: 3, onTime: 19, late: 2 },
      { date: '2023-08-04', present: 22, absent: 2, onTime: 22, late: 0 },
      { date: '2023-08-07', present: 24, absent: 0, onTime: 23, late: 1 },
    ]
  };

  const financialData = {
    summary: {
      totalRevenue: '$2,040.00',
      paidAmount: '$1,700.00',
      pendingAmount: '$340.00',
      paymentRate: '83.3%'
    },
    details: [
      { date: '2023-08-01', studentName: 'Alex Johnson', amount: '$85.00', status: 'Paid' },
      { date: '2023-08-01', studentName: 'Emma Wilson', amount: '$85.00', status: 'Paid' },
      { date: '2023-08-02', studentName: 'Jacob Smith', amount: '$85.00', status: 'Pending' },
      { date: '2023-08-02', studentName: 'Sophia Garcia', amount: '$85.00', status: 'Paid' },
      { date: '2023-08-03', studentName: 'Michael Brown', amount: '$85.00', status: 'Paid' },
      { date: '2023-08-03', studentName: 'Olivia Davis', amount: '$85.00', status: 'Pending' },
    ]
  };

  // Handle generate report
  const handleGenerateReport = () => {
    setIsGenerating(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setIsGenerating(false);
      setReportGenerated(true);
      
      // Set report data based on the active tab and selected report type
      if (activeTab === 'attendance') {
        setReportData(attendanceData);
      } else {
        setReportData(financialData);
      }
    }, 1500);
  };

  const handleDownloadReport = () => {
    // This would be implemented with actual file download functionality
    // For now, just show a toast or alert
    alert('Report downloaded successfully!');
  };

  // Function to format date
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

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
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => {
              setActiveTab('attendance');
              setReportGenerated(false);
            }}
            className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors flex items-center justify-center ${
              activeTab === 'attendance'
                ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-500'
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
            className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors flex items-center justify-center ${
              activeTab === 'financial'
                ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-500'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <HiDocumentText className="w-5 h-5 mr-2" />
            Financial Reports
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
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
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
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
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
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
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
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
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
                      className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  )}
                  
                  {selectedReport === 'monthly' && (
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
                          className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">End Date</label>
                        <input
                          type="date"
                          value={dateRange.end}
                          onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                          className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Options - For Attendance Reports */}
                {activeTab === 'attendance' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Include Details</label>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="includePresent"
                          defaultChecked
                          className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                        />
                        <label htmlFor="includePresent" className="ml-2 text-sm text-gray-700">
                          Present Students
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="includeAbsent"
                          defaultChecked
                          className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                        />
                        <label htmlFor="includeAbsent" className="ml-2 text-sm text-gray-700">
                          Absent Students
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="includeLate"
                          defaultChecked
                          className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                        />
                        <label htmlFor="includeLate" className="ml-2 text-sm text-gray-700">
                          Late Arrivals
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Options - For Financial Reports */}
                {activeTab === 'financial' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Include Details</label>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="includePaid"
                          defaultChecked
                          className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                        />
                        <label htmlFor="includePaid" className="ml-2 text-sm text-gray-700">
                          Paid Payments
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="includePending"
                          defaultChecked
                          className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                        />
                        <label htmlFor="includePending" className="ml-2 text-sm text-gray-700">
                          Pending Payments
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="includeSummary"
                          defaultChecked
                          className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                        />
                        <label htmlFor="includeSummary" className="ml-2 text-sm text-gray-700">
                          Include Revenue Summary
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-medium transition duration-300 flex justify-center items-center"
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
                  <div className="bg-amber-100 p-4 rounded-full mb-3">
                    <HiDocumentText className="w-8 h-8 text-amber-600" />
                  </div>
                  <p className="text-gray-500 mb-2">Select your report options and click "Generate Report" to preview</p>
                  <p className="text-xs text-gray-400">Your generated reports will appear here</p>
                </div>
              ) : activeTab === 'attendance' ? (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 className="font-medium text-gray-800 mb-3">Attendance Summary</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-green-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-gray-500">Average Present</p>
                        <p className="text-2xl font-bold text-green-600">{reportData.summary.averagePresent}</p>
                        <p className="text-xs text-green-600">{reportData.summary.attendanceRate}</p>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-gray-500">Average Absent</p>
                        <p className="text-2xl font-bold text-red-600">{reportData.summary.averageAbsent}</p>
                        <p className="text-xs text-red-600">{(100 - parseFloat(reportData.summary.attendanceRate)).toFixed(1)}%</p>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Daily Breakdown</h4>
                      <div className="max-h-48 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Absent</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {reportData.details.map((day, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-3 py-2 whitespace-nowrap text-xs">{formatDate(day.date)}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs text-green-600 font-medium">{day.present}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs text-red-600 font-medium">{day.absent}</td>
                              </tr>
                            ))}
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
                    Download Report
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 className="font-medium text-gray-800 mb-3">Financial Summary</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-green-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-gray-500">Paid Amount</p>
                        <p className="text-2xl font-bold text-green-600">{reportData.summary.paidAmount}</p>
                        <p className="text-xs text-green-600">{reportData.summary.paymentRate}</p>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-gray-500">Pending Amount</p>
                        <p className="text-2xl font-bold text-yellow-600">{reportData.summary.pendingAmount}</p>
                        <p className="text-xs text-yellow-600">{(100 - parseFloat(reportData.summary.paymentRate)).toFixed(1)}%</p>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Payment Details</h4>
                      <div className="max-h-48 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {reportData.details.map((payment, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-3 py-2 whitespace-nowrap text-xs">{payment.date}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs">{payment.studentName}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">{payment.amount}</td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    payment.status === 'Paid' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {payment.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
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
                    Download Report
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
                      <HiDocumentText className="w-5 h-5 text-amber-500 mr-3" />
                      <div className="text-sm font-medium text-gray-900">Daily Attendance - August 8, 2023</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Attendance</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Aug 8, 2023</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">PDF</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="px-3 py-1 bg-amber-50 text-amber-700 rounded hover:bg-amber-100 text-sm">Download</button>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <HiDocumentText className="w-5 h-5 text-amber-500 mr-3" />
                      <div className="text-sm font-medium text-gray-900">Weekly Attendance - Week 31</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Attendance</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Aug 6, 2023</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Excel</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="px-3 py-1 bg-amber-50 text-amber-700 rounded hover:bg-amber-100 text-sm">Download</button>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <HiDocumentText className="w-5 h-5 text-amber-500 mr-3" />
                      <div className="text-sm font-medium text-gray-900">Monthly Financial Report - July 2023</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Financial</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Aug 1, 2023</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">PDF</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="px-3 py-1 bg-amber-50 text-amber-700 rounded hover:bg-amber-100 text-sm">Download</button>
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