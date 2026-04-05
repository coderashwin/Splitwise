import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../auth/auth.middleware';
import { validate } from '../../shared/middleware/validate';
import * as controller from './expense.controller';

const router = Router();
router.use(authenticate);

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const splitEntrySchema = z.object({
  userId: z.string().regex(objectIdRegex),
  value: z.number().positive().optional(),
});

const createExpenseSchema = z.object({
  groupId: z.string().regex(objectIdRegex).optional(),
  description: z.string().min(1).max(200),
  amount: z.number().int().min(1),
  paidBy: z.string().regex(objectIdRegex),
  splitType: z.enum(['equal', 'exact', 'percentage', 'shares']),
  splits: z.array(splitEntrySchema).optional(),
  category: z.object({
    name: z.string().min(1),
    icon: z.string().optional(),
    color: z.string().optional(),
  }).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  date: z.string().datetime().optional(),
  isRecurring: z.boolean().optional(),
  recurringConfig: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    endDate: z.string().datetime().optional(),
    nextRunAt: z.string().datetime(),
  }).optional(),
});

const addReceiptSchema = z.object({
  key: z.string().min(1).max(500),
});

router.post('/', validate(createExpenseSchema), controller.createExpense);
router.get('/:id', controller.getExpense);
router.delete('/:id', controller.deleteExpense);
router.post('/:id/receipts', validate(addReceiptSchema), controller.addReceipt);
router.delete('/:id/receipts/:key', controller.removeReceipt);

export default router;
