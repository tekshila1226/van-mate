import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { HiCheck, HiOutlineClock, HiOutlineExclamationCircle, HiPlus } from 'react-icons/hi2';
import { HiDownload, HiDocumentText } from 'react-icons/hi';
import { 
  // useGetDriverSalaryQuery,
  // useGetDriverPaymentsQuery, 
  // useGetRouteIncomeQuery,
  useGetParentPaymentStatusQuery,
  useGetDriverRouteChildrenQuery,
  useGenerateInvoiceMutation
} from '../../redux/features/paymentSlice';
import Spinner from './Spinner';

export default function Payments() {
  const [activeTab, setActiveTab] = useState('parentPayments');
  // const [selectedMonth, setSelectedMonth] = useState('August 2023');
  
  // Invoice generation state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedChildren, setSelectedChildren] = useState([]);
  const [invoiceDetails, setInvoiceDetails] = useState({
    amount: '',
    dueDate: '',
    period: '',
    notes: ''
  });

  // RTK Query hooks
  // const { data: salaryData, isLoading: salaryLoading } = useGetDriverSalaryQuery(selectedMonth);
  // const { data: paymentsHistory, isLoading: paymentsLoading } = useGetDriverPaymentsQuery();
  // const { data: routeIncomeData, isLoading: routeIncomeLoading } = useGetRouteIncomeQuery(selectedMonth);
  const { data: parentPaymentsData, isLoading: parentPaymentsLoading } = useGetParentPaymentStatusQuery();
  const { data: routeChildrenData, isLoading: routeChildrenLoading } = useGetDriverRouteChildrenQuery();
  
  const [generateInvoice, { isLoading: isGeneratingInvoice }] = useGenerateInvoiceMutation();
  
  // Set default due date to 2 weeks from now when the modal opens
  useEffect(() => {
    if (showInvoiceModal) {
      const today = new Date();
      const twoWeeksLater = new Date();
      twoWeeksLater.setDate(today.getDate() + 14);
      
      setInvoiceDetails({
        ...invoiceDetails,
        dueDate: twoWeeksLater.toISOString().split('T')[0],
        period: `${today.toLocaleString('default', { month: 'long' })} ${today.getFullYear()}`
      });
    }
  }, [showInvoiceModal]);
  
  // Function to render appropriate status badge
  const renderStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
            <HiCheck className="mr-1" /> Paid
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center">
            <HiOutlineClock className="mr-1" /> Pending
          </span>
        );
      case 'overdue':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center">
            <HiOutlineExclamationCircle className="mr-1" /> Overdue
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
            {status}
          </span>
        );
    }
  };
  
  const handleInvoiceDetailsChange = (e) => {
    const { name, value } = e.target;
    setInvoiceDetails({
      ...invoiceDetails,
      [name]: value
    });
  };
  
  const handleChildSelection = (childId) => {
    if (selectedChildren.includes(childId)) {
      setSelectedChildren(selectedChildren.filter(id => id !== childId));
    } else {
      setSelectedChildren([...selectedChildren, childId]);
    }
  };
  
  const handleSelectAllChildren = (e) => {
    if (e.target.checked) {
      setSelectedChildren(routeChildrenData.data.map(child => child._id));
    } else {
      setSelectedChildren([]);
    }
  };
  
  const handleSubmitInvoice = async () => {
    if (!invoiceDetails.amount) {
      toast.error('Please enter an invoice amount');
      return;
    }
    
    if (!invoiceDetails.dueDate) {
      toast.error('Please select a due date');
      return;
    }
    
    if (!invoiceDetails.period) {
      toast.error('Please enter the invoice period');
      return;
    }
    
    if (selectedChildren.length === 0) {
      toast.error('Please select at least one child');
      return;
    }
    
    try {
      await generateInvoice({
        childrenIds: selectedChildren,
        amount: parseFloat(invoiceDetails.amount),
        dueDate: invoiceDetails.dueDate,
        period: invoiceDetails.period,
        notes: invoiceDetails.notes || undefined
      }).unwrap();
      
      toast.success('Invoice generated successfully');
      setShowInvoiceModal(false);
      
      // Reset form
      setSelectedChildren([]);
      setInvoiceDetails({
        amount: '',
        dueDate: '',
        period: '',
        notes: ''
      });
    } catch (error) {
      toast.error(error.data?.message || 'Failed to generate invoice');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
        
        <div className="flex items-center gap-3">
          {/* <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
          >
            <option value="August 2023">August 2023</option>
            <option value="July 2023">July 2023</option>
            <option value="June 2023">June 2023</option>
            <option value="May 2023">May 2023</option>
            <option value="April 2023">April 2023</option>
          </select> */}
          
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm flex items-center"
          >
            <HiPlus className="mr-1" /> New Invoice
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 flex-wrap">
          {/* <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors ${
              activeTab === 'summary'
                ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-500'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Salary Summary
          </button> */}
          {/* <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors ${
              activeTab === 'history'
                ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-500'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Payment History
          </button> */}
          {/* <button
            onClick={() => setActiveTab('routeIncome')}
            className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors ${
              activeTab === 'routeIncome'
                ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-500'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Route Income
          </button> */}
          <button
            onClick={() => setActiveTab('parentPayments')}
            className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors ${
              activeTab === 'parentPayments'
                ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-500'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Parent Payments
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors ${
              activeTab === 'invoices'
                ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-500'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Invoices
          </button>
        </div>

        <div className="p-5">
          {/* Salary Summary Tab */}
          {/* {activeTab === 'summary' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {salaryLoading ? (
                <Spinner />
              ) : salaryData ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-6 mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-gray-800">Next Payment</h3>
                        <span className="text-amber-600 font-medium">{salaryData.nextPaymentDate}</span>
                      </div>
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <span className="text-2xl font-bold text-gray-800">${salaryData.grossAmount}</span>
                          <span className="text-gray-500 ml-2">gross monthly salary</span>
                        </div>
                        <span className="text-2xl font-bold text-green-600">${salaryData.netAmount}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Payment Method: {salaryData.paymentMethod}</span>
                        <span className="text-gray-600">Account: {salaryData.accountEnding}</span>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                      <h3 className="font-semibold text-gray-800 mb-4">Deductions</h3>
                      <div className="space-y-3">
                        {Object.entries(salaryData.deductions).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center">
                            <span className="text-gray-600">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                            <span className="font-medium text-gray-800">${value}</span>
                          </div>
                        ))}
                        <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between items-center font-semibold">
                          <span>Total Deductions</span>
                          <span>${salaryData.totalDeductions}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="bg-white border border-gray-200 rounded-lg p-6 h-full">
                      <h3 className="font-semibold text-gray-800 mb-4">Recent Bonuses</h3>
                      {salaryData.bonuses.length > 0 ? (
                        <div className="space-y-4">
                          {salaryData.bonuses.map((bonus, index) => (
                            <div key={index} className="p-3 bg-green-50 border border-green-100 rounded-lg">
                              <div className="flex justify-between mb-1">
                                <span className="font-medium text-gray-800">{bonus.description}</span>
                                <span className="font-bold text-green-600">${bonus.amount}</span>
                              </div>
                              <div className="text-xs text-gray-500">Paid on {bonus.date}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No recent bonuses to display.</p>
                      )}

                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="font-medium text-gray-700 mb-3">Quick Actions</h4>
                        <div className="space-y-3">
                          <button className="w-full py-2 px-4 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-sm flex items-center justify-center transition-colors">
                            <HiDownload className="mr-2" /> Download Tax Statement
                          </button>
                          <button className="w-full py-2 px-4 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm flex items-center justify-center transition-colors">
                            Update Payment Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                  Error loading salary data
                </div>
              )}
            </motion.div>
          )} */}

          {/* Payment History Tab */}
          {/* {activeTab === 'history' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {paymentsLoading ? (
                <Spinner />
              ) : paymentsHistory ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Payment Period</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Pay Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Gross Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Net Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paymentsHistory.payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{payment.period}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{payment.payDate}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">${payment.grossAmount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">${payment.netAmount}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {renderStatusBadge(payment.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button className="px-3 py-1 bg-amber-50 text-amber-700 rounded hover:bg-amber-100 transition-colors font-medium flex items-center text-xs">
                              <HiDownload className="mr-1" /> Payslip
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                  Error loading payment history
                </div>
              )}
            </motion.div>
          )} */}

          {/* Route Income Tab */}
          {/* {activeTab === 'routeIncome' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {routeIncomeLoading ? (
                <Spinner />
              ) : routeIncomeData ? (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-800">Route Income Summary</h3>
                    <div className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg">
                      <span className="font-medium">${routeIncomeData.totalIncome}</span> monthly total
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Total Students</div>
                      <div className="text-2xl font-semibold text-gray-800">{routeIncomeData.totalStudents}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Rate Per Student</div>
                      <div className="text-2xl font-semibold text-gray-800">${routeIncomeData.ratePerStudent}</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm text-green-700 mb-1">Total Monthly Income</div>
                      <div className="text-2xl font-semibold text-green-600">${routeIncomeData.totalIncome}</div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <h4 className="font-medium text-gray-800 p-4 border-b border-gray-200">Route Details</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Route Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Students</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Rate Per Student</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {routeIncomeData.routes.map((route, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{route.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{route.students}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">${route.ratePerStudent}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">${route.total}</td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50 font-medium">
                            <td colSpan={2} className="px-6 py-4 text-sm text-right text-gray-800">Total</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">${routeIncomeData.ratePerStudent}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">${routeIncomeData.totalIncome}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-gray-500">
                    <p className="mb-2">Note: {routeIncomeData.notes}</p>
                    <p>Payment calculation may vary based on actual attendance and school calendar.</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                  Error loading route income data
                </div>
              )}
            </motion.div>
          )} */}

          {/* Parent Payments Tab */}
          {activeTab === 'parentPayments' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {parentPaymentsLoading ? (
                <Spinner />
              ) : parentPaymentsData ? (
                <>
                  <p className="text-sm text-gray-500 mb-6">
                    This tab shows payment status for parents on your routes. You don't need to collect payments directly, 
                    but this information helps you track which students have active accounts.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white border border-gray-200 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Total Students</div>
                      <div className="text-2xl font-semibold text-gray-800">{parentPaymentsData.total}</div>
                    </div>
                    <div className="bg-green-50 border border-green-100 p-4 rounded-lg">
                      <div className="text-sm text-green-700 mb-1">Paid</div>
                      <div className="text-2xl font-semibold text-green-600">{parentPaymentsData.paid}</div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg">
                      <div className="text-sm text-yellow-700 mb-1">Pending</div>
                      <div className="text-2xl font-semibold text-yellow-600">{parentPaymentsData.pending}</div>
                    </div>
                    <div className="bg-red-50 border border-red-100 p-4 rounded-lg">
                      <div className="text-sm text-red-700 mb-1">Overdue</div>
                      <div className="text-2xl font-semibold text-red-600">{parentPaymentsData.overdue}</div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <h4 className="font-medium text-gray-800 p-4 border-b border-gray-200">Recent Payment Activity</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Parent</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Student</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {parentPaymentsData.recentActivity.map((activity, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{activity.parent}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{activity.student}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.date}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">Rs.{activity.amount}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {renderStatusBadge(activity.status)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                  Error loading parent payments data
                </div>
              )}
            </motion.div>
          )}
          
          {/* New Invoices Tab */}
          {activeTab === 'invoices' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-amber-50 p-4 mb-6 rounded-lg border border-amber-200">
                <div className="flex items-center">
                  <HiDocumentText className="text-amber-600 w-6 h-6 mr-3" />
                  <div>
                    <h3 className="font-medium text-amber-800">Generate Invoices</h3>
                    <p className="text-sm text-amber-700">
                      Generate invoices for children on your routes. Invoices will be sent to parents automatically.
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowInvoiceModal(true)}
                    className="ml-auto px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
                  >
                    <HiPlus className="inline mr-1" /> New Invoice
                  </button>
                </div>
              </div>
              
              {routeChildrenLoading ? (
                <Spinner />
              ) : routeChildrenData ? (
                <div className="bg-white rounded-lg border border-gray-200">
                  <h3 className="font-medium p-4 border-b border-gray-200">Children on Your Routes</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Child Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Grade</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Parent</th>
                          {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Route</th> */}
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Last Invoice</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Payment Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {routeChildrenData.data.map(child => (
                          <tr key={child._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                              {child.firstName} {child.lastName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                              {child.grade || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                              {child.parentName || 'N/A'}
                            </td>
                            {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                              {child.routeName || 'N/A'}
                            </td> */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                              {child.lastInvoice?.date ? new Date(child.lastInvoice.date).toLocaleDateString() : 'None'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {child.paymentStatus ? renderStatusBadge(child.paymentStatus) : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                  Error loading children data
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Invoice Generation Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <HiDocumentText className="mr-2 text-amber-600" /> Generate New Invoice
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Rs)</label>
                <input
                  type="number"
                  name="amount"
                  value={invoiceDetails.amount}
                  onChange={handleInvoiceDetailsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  value={invoiceDetails.dueDate}
                  onChange={handleInvoiceDetailsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                <input
                  type="text"
                  name="period"
                  value={invoiceDetails.period}
                  onChange={handleInvoiceDetailsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="e.g. August 2023"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  name="notes"
                  value={invoiceDetails.notes}
                  onChange={handleInvoiceDetailsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Any additional details"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Select Children</label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="selectAll"
                    onChange={handleSelectAllChildren}
                    checked={selectedChildren.length === routeChildrenData?.data?.length}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                  />
                  <label htmlFor="selectAll" className="ml-2 text-sm text-gray-700">
                    Select All
                  </label>
                </div>
              </div>
              
              {routeChildrenLoading ? (
                <div className="p-4 flex justify-center">
                  <Spinner />
                </div>
              ) : routeChildrenData?.data?.length > 0 ? (
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 w-12"></th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Grade</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Parent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {routeChildrenData.data.map(child => (
                        <tr key={child._id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={selectedChildren.includes(child._id)}
                              onChange={() => handleChildSelection(child._id)}
                              className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                            {child.firstName} {child.lastName}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                            {child.grade || 'N/A'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                            {child.parentName || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 text-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No children found on your routes</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitInvoice}
                disabled={isGeneratingInvoice || selectedChildren.length === 0}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:bg-amber-300"
              >
                {isGeneratingInvoice ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⟳</span> Generating...
                  </>
                ) : (
                  'Generate Invoice'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}