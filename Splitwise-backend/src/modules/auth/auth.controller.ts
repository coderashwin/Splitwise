import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import * as userService from '../users/user.service';

export async function googleOAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code, deviceId } = req.body as { code: string; deviceId: string };
    const tokens = await authService.exchangeGoogleCode(code, deviceId);
    res.status(200).json({ data: tokens, meta: { requestId: req.id } });
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken: oldToken, deviceId } = req.body as { refreshToken: string; deviceId: string };
    const tokens = await authService.rotateRefreshToken(oldToken, deviceId);
    res.status(200).json({ data: tokens, meta: { requestId: req.id } });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken: token } = req.body as { refreshToken: string };
    await authService.revokeRefreshToken(token);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.getUserById(req.user.userId);
    res.status(200).json({ data: user, meta: { requestId: req.id } });
  } catch (err) {
    next(err);
  }
}
