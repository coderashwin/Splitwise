import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../auth/auth.middleware';
import { validate } from '../../shared/middleware/validate';
import * as controller from './user.controller';

const router = Router();

const updateMeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarKey: z.string().max(500).optional(),
});

const registerDeviceSchema = z.object({
  fcmToken: z.string().min(1),
  platform: z.enum(['android', 'ios']),
});

// All user routes require authentication
router.use(authenticate);

router.get('/me', controller.getMe);
router.patch('/me', validate(updateMeSchema), controller.updateMe);
router.delete('/me', controller.deleteMe);
router.get('/search', controller.searchUsers);
router.get('/:id', controller.getUser);
router.post('/me/devices', validate(registerDeviceSchema), controller.registerDevice);
router.delete('/me/devices/:fcmToken', controller.unregisterDevice);

export default router;
