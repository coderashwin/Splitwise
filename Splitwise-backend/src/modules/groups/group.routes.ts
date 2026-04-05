import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../auth/auth.middleware';
import { validate } from '../../shared/middleware/validate';
import * as controller from './group.controller';

const router = Router();
router.use(authenticate);

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['trip', 'home', 'couple', 'other']).optional(),
  imageKey: z.string().optional(),
  memberIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
});

const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(['trip', 'home', 'couple', 'other']).optional(),
  imageKey: z.string().optional(),
});

const addMemberSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/),
});

router.post('/', validate(createGroupSchema), controller.createGroup);
router.get('/', controller.listGroups);
router.get('/:id', controller.getGroup);
router.patch('/:id', validate(updateGroupSchema), controller.updateGroup);
router.delete('/:id', controller.deleteGroup);
router.post('/:id/members', validate(addMemberSchema), controller.addMember);
router.delete('/:id/members/:userId', controller.removeMember);
router.post('/:id/leave', controller.leaveGroup);

export default router;
