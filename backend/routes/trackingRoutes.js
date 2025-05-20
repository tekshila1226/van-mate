import express from 'express';
import { 
  startTracking,
  updateLocation,
  endTracking,
  reportEmergency,
  getBusTracking,
  getChildBusTracking,
  getBusTrackingHistory,
  updateConnectionInfo
} from '../controllers/TrackingController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Routes that require authentication
router.use(protect);

// Parent routes - must come BEFORE parameterized routes to avoid conflicts
router.get('/child/:childId', authorize('parent'), getChildBusTracking);

// Driver routes
router.post('/start', authorize('driver'), startTracking);
router.post('/update', authorize('driver'), updateLocation);
router.post('/end', authorize('driver'), endTracking);
router.post('/emergency', authorize('driver'), reportEmergency);
router.post('/connection', authorize('driver'), updateConnectionInfo);

// Driver and admin routes
router.get('/bus/:busId', authorize('driver', 'admin'), getBusTracking);

// Split the history route into two routes instead of using an optional parameter
router.get('/bus/:busId/history', authorize('driver', 'admin'), getBusTrackingHistory);
router.get('/bus/:busId/history/:date', authorize('driver', 'admin'), getBusTrackingHistory);

export default router;