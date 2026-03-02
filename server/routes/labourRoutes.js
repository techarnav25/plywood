import express from 'express';
import {
  createLabour,
  deleteLabour,
  getLabourById,
  getLabours,
  updateLabour
} from '../controllers/labourController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', authorize('super_admin', 'admin', 'manager'), getLabours);
router.get('/:id', authorize('super_admin', 'admin', 'manager'), getLabourById);
router.post('/', authorize('super_admin'), createLabour);
router.put('/:id', authorize('super_admin', 'admin'), updateLabour);
router.delete('/:id', authorize('super_admin', 'admin'), deleteLabour);

export default router;
