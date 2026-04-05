import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../auth/auth.middleware';
import { validate } from '../../shared/middleware/validate';
import * as controller from './upload.controller';

const router = Router();
router.use(authenticate);

const presignSchema = z.object({
  fileType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  fileSize: z.number().int().min(1),
  context: z.enum(['receipt', 'avatar', 'group-image']),
  groupId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
});

router.post('/presign', validate(presignSchema), controller.presign);
router.delete('/:key', controller.deleteFile);

export default router;
