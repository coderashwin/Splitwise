import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import * as controller from './notification.controller';

const router = Router();
router.use(authenticate);

router.get('/', controller.getFeed);
router.patch('/read-all', controller.markAllRead);
router.get('/unread-count', controller.getUnreadCount);
router.patch('/:id/read', controller.markRead);

export default router;
