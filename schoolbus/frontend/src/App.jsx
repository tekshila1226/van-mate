import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import Home from './home/Home'
import Features from './home/Features'
import Pricing from './home/Pricing'
import Contact from './home/Contact'
import ParentRegister from './parent/Register'
import ParentLogin from './parent/Login'
import ParentDashboardLayout from './parent/DashboardLayout'
import DriverRegister from './driver/Register'
import DriverLogin from './driver/Login'
import DriverDashboardLayout from './driver/DashboardLayout'
import AdminRegister from './admin/Register'
import AdminLogin from './admin/Login'
import AdminDashboardLayout from './admin/DashboardLayout'

// Parent components
import Overview from './parent/components/Overview'
import Children from './parent/components/Children'
import Tracking from './parent/components/Tracking'
import AttendanceHistory from './parent/components/AttendanceHistory'
import Notifications from './parent/components/Notifications'
import Settings from './parent/components/Settings'
import Invoices from './parent/components/Invoices'
import Payment from './parent/components/Payment'

// Driver components
import DriverOverview from './driver/components/Overview'
import DriverRoutes from './driver/components/Routes'
import DriverAttendance from './driver/components/Attendance'
import DriverTracking from './driver/components/Tracking'
import DriverPayments from './driver/components/Payments'
import DriverReports from './driver/components/Reports'
import DriverSettings from './driver/components/Settings'

// Admin components
import AdminOverview from './admin/components/Overview'
import AdminRoutes from './admin/components/Routes'
import AdminVehicles from './admin/components/Vehicles'
import AdminSettings from './admin/components/Settings'
import AdminUsers from './admin/components/Users'
import AdminReports from './admin/components/Reports'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/features" element={<Features />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/parent/register" element={<ParentRegister />} />
        <Route path="/parent/login" element={<ParentLogin />} />
        <Route path="/driver/register" element={<DriverRegister />} />
        <Route path="/driver/login" element={<DriverLogin />} />
        <Route path="/admin/register" element={<AdminRegister />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* Protected parent routes */}
        <Route path="/parent" element={
          <ProtectedRoute requiredRole="parent">
            <ParentDashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Overview />} />
          <Route path="children" element={<Children />} />
          <Route path="tracking" element={<Tracking />} />
          <Route path="attendance" element={<AttendanceHistory />} />
          <Route path="payments" element={<Invoices />} />
          <Route path="payments/:invoiceId" element={<Payment />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Protected driver routes */}
        <Route path="/driver" element={
          <ProtectedRoute requiredRole="driver">
            <DriverDashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DriverOverview />} />
          <Route path="routes" element={<DriverRoutes />} />
          <Route path="attendance" element={<DriverAttendance />} />
          <Route path="tracking" element={<DriverTracking />} />
          <Route path="payments" element={<DriverPayments />} />
          <Route path="reports" element={<DriverReports />} />
          <Route path="settings" element={<DriverSettings />} />
        </Route>

        {/* Protected admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminOverview />} />
          <Route path="routes" element={<AdminRoutes />} />
          <Route path="vehicles" element={<AdminVehicles />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        
        {/* Catch all route - 404 */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </BrowserRouter>
  )
}
