import express from 'express';
import { getMonthlyReport } from '../controllers/reportController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/monthly', authorize('super_admin', 'admin', 'manager'), getMonthlyReport);

export default router;
