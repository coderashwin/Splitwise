import { Request, Response, NextFunction } from 'express';
import * as uploadService from './upload.service';

export async function presign(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as { fileType: string; fileSize: number; context: string; groupId?: string };
    const result = await uploadService.presignUpload({
      fileType: body.fileType as Parameters<typeof uploadService.presignUpload>[0]['fileType'],
      fileSize: body.fileSize,
      context: body.context as Parameters<typeof uploadService.presignUpload>[0]['context'],
      userId: req.user.userId,
      groupId: body.groupId,
    });
    res.status(200).json({ data: result, meta: { requestId: req.id } });
  } catch (err) { next(err); }
}

export async function deleteFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const key = decodeURIComponent(req.params['key'] ?? '');
    await uploadService.deleteFile(key, req.user.userId);
    res.status(204).send();
  } catch (err) { next(err); }
}
