import express from 'express';
import {
  addAdvanceEntry,
  addCanteenEntry,
  addExtraEntry,
  getLabourMonthlyBilling,
  getMyMonthlyBilling,
  upsertPayment
} from '../controllers/billingController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/my-profile', authorize('labour'), getMyMonthlyBilling);
router.get('/labour/:id', authorize('super_admin', 'admin', 'manager'), getLabourMonthlyBilling);
router.put('/labour/:id/payment', authorize('super_admin', 'admin'), upsertPayment);
router.post('/labour/:id/adjustments/canteen', authorize('super_admin', 'admin'), addCanteenEntry);
router.post('/labour/:id/adjustments/advance', authorize('super_admin', 'admin'), addAdvanceEntry);
router.post('/labour/:id/adjustments/extra', authorize('super_admin', 'admin'), addExtraEntry);

export default router;
