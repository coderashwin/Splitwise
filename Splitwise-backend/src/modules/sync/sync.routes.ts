import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import * as controller from './sync.controller';

const router = Router();
router.use(authenticate);

router.get('/', controller.getSyncDelta);
router.post('/ack', controller.ackSync);
router.post('/push', controller.pushChanges);

export default router;
