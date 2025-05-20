import express from 'express';
import { 
  getActiveRoutes, 
  getRouteById,
  getAllRoutes,
  createRoute,
  updateRoute,
  deleteRoute,
  assignDriverToRoute,
  unassignDriverFromRoute,
  getDriverRoutes
} from '../controllers/RouteController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Public routes (accessible by all authenticated users)
router.get('/active', getActiveRoutes);
router.get('/:id', getRouteById);

// Admin only routes
router.get('/', authorize('admin'), getAllRoutes);
router.post('/', authorize('admin'), createRoute);
router.put('/:id', authorize('admin'), updateRoute);
router.delete('/:id', authorize('admin'), deleteRoute);
router.patch('/:routeId/assign-driver', authorize('admin'), assignDriverToRoute);
router.patch('/:routeId/unassign-driver', authorize('admin'), unassignDriverFromRoute);

// Get routes assigned to a driver
router.get('/driver/:driverId', authorize('driver', 'admin'), getDriverRoutes);

export default router;