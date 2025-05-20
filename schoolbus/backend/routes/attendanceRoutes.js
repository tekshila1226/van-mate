import express from 'express';
import {
  getAttendanceHistory,
  getAttendanceStats,
  getTodayAttendance,
  reportAbsence,
  updateDailyAttendance,
  sendDriverNote,
  getRecentAttendance,
  getDriverRouteStudents,
  markAttendanceStatus,
  addAttendanceNote,
  getDriverAttendanceHistory
} from '../controllers/AttendanceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Parent routes
router.get('/child/:childId', authorize('parent'), getAttendanceHistory);
router.get('/child/:childId/stats', authorize('parent'), getAttendanceStats);
router.get('/child/:childId/today', authorize('parent'), getTodayAttendance);
router.post('/child/:childId/report', authorize('parent'), reportAbsence);
router.put('/child/:childId/daily', authorize('parent'), updateDailyAttendance);
router.post('/child/:childId/note', authorize('parent'), sendDriverNote);
router.get('/recent', authorize('parent'), getRecentAttendance);

// Driver routes
router.get('/driver/students', protect, authorize('driver'), getDriverRouteStudents);
router.put('/driver/attendance/:childId', protect, authorize('driver'), markAttendanceStatus);
router.post('/driver/attendance/:childId/note', protect, authorize('driver'), addAttendanceNote);
router.get('/driver/attendance/history', protect, authorize('driver'), getDriverAttendanceHistory);

export default router;