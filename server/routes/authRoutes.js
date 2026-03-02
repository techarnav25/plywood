import express from 'express';
import {
  createAdmin,
  deleteAdmin,
  getAllAdmins,
  getMe,
  loginAdmin,
  loginLabour,
  updateMyProfileImage
} from '../controllers/authController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginAdmin);
router.post('/labour/login', loginLabour);
router.get('/me', protect, getMe);
router.put('/me/profile-image', protect, updateMyProfileImage);
router.get('/admins', protect, authorize('super_admin'), getAllAdmins);
router.post('/admins', protect, authorize('super_admin'), createAdmin);
router.delete('/admins/:id', protect, authorize('super_admin'), deleteAdmin);

export default router;
