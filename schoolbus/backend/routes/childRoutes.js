import express from 'express';
import { 
  getChildren, 
  getChildById, 
  createChild, 
  updateChild, 
  deleteChild, 
  updateChildAttendance,
  getRouteChildren
} from '../controllers/ChildController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes that only parents can access
router.get('/', authorize('parent'), getChildren);
router.get('/:id', authorize('parent'), getChildById);
router.post('/', authorize('parent'), createChild);
router.put('/:id', authorize('parent'), updateChild);
router.delete('/:id', authorize('parent'), deleteChild);
router.put('/:id/attendance', authorize('parent'), updateChildAttendance);

// Get children assigned to a specific route
router.get('/route/:routeId', protect, authorize('driver', 'admin'), getRouteChildren);

export default router;