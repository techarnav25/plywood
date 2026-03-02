import express from 'express';
import {
  getDailyAttendance,
  getDailySummary,
  submitAttendance
} from '../controllers/attendanceController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/daily', authorize('super_admin', 'admin', 'manager'), getDailyAttendance);
router.get('/summary', authorize('super_admin', 'admin', 'manager'), getDailySummary);
router.post('/', authorize('super_admin', 'admin'), submitAttendance);

export default router;
