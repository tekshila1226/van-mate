import express from 'express';
import { 
  getAllBuses,
  getAvailableBuses,
  getBusById,
  createBus,
  updateBus,
  deleteBus,
  getDriverBuses
} from '../controllers/BusController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Driver routes - specific routes must come before parameterized routes
router.get('/driver', authorize('driver'), getDriverBuses);

// Admin routes
router.get('/', authorize('admin', 'parent'), getAllBuses);
router.get('/available', authorize('admin'), getAvailableBuses);
router.get('/:id', authorize('admin'), getBusById);
router.post('/', authorize('admin'), createBus);
router.put('/:id', authorize('admin'), updateBus);
router.delete('/:id', authorize('admin'), deleteBus);

export default router;