import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../auth/auth.middleware';
import { validate } from '../../shared/middleware/validate';
import * as controller from './settlement.controller';

const router = Router();
router.use(authenticate);

const recordSettlementSchema = z.object({
  from: z.string().regex(/^[0-9a-fA-F]{24}$/),
  to: z.string().regex(/^[0-9a-fA-F]{24}$/),
  amount: z.number().int().min(1),
  groupId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  note: z.string().max(200).optional(),
});

router.post('/', validate(recordSettlementSchema), controller.recordSettlement);
router.patch('/:id/confirm', controller.confirmSettlement);

export default router;
