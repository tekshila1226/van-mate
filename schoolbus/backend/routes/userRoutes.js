import express from 'express';
import { login, register, getAllUsers, getUserProfile, getAllDrivers, getAllParents, getUserById, updateUser, updateUserProfile, toggleUserStatus, deleteUser } from '../controllers/UserController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/register', register);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

// Admin only routes
router.get('/', protect, authorize('admin'), getAllUsers);
router.get('/parents', protect, authorize('admin'), getAllParents);
router.get('/drivers', protect, authorize('admin'), getAllDrivers);
router.get('/:id', protect, authorize('admin'), getUserById);
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);
router.patch('/:id/toggle-status', protect, authorize('admin'), toggleUserStatus);

export default router;