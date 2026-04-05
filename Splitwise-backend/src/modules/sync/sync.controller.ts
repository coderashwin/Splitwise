import { Request, Response, NextFunction } from 'express';
import * as syncService from './sync.service';

export async function getSyncDelta(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as Record<string, string>;
    const sinceVersion = parseInt(query['since'] ?? '0', 10) || 0;
    const deviceId = query['deviceId'] ?? 'unknown';
    const result = await syncService.getSyncDelta(req.user.userId, sinceVersion, deviceId);
    res.json({ data: result, meta: { requestId: req.id } });
  } catch (err) { next(err); }
}

export async function ackSync(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Acknowledgment is a no-op for now — client uses this to confirm receipt
    res.status(200).json({ data: { acknowledged: true }, meta: { requestId: req.id } });
  } catch (err) { next(err); }
}

export async function pushChanges(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Offline push is a placeholder — returns conflict for all offline pushes
    // Real implementation would route to appropriate service methods
    res.status(200).json({
      data: { results: [], message: 'Offline push not yet implemented' },
      meta: { requestId: req.id },
    });
  } catch (err) { next(err); }
}
