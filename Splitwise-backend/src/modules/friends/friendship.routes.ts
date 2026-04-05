import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import * as controller from './friendship.controller';

const router = Router();
router.use(authenticate);

router.post('/request/:userId', controller.sendRequest);
router.patch('/request/:id/accept', controller.acceptRequest);
router.patch('/request/:id/reject', controller.rejectRequest);
router.delete('/:userId', controller.unfriend);
router.get('/', controller.listFriends);
router.get('/requests/pending', controller.listPendingRequests);
router.post('/block/:userId', controller.blockUser);

export default router;
