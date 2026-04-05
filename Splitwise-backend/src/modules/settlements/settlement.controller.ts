import { Request, Response, NextFunction } from 'express';
import * as settlementService from './settlement.service';
import { RecordSettlementDto } from './settlement.types';

export async function recordSettlement(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const settlement = await settlementService.recordSettlement(req.body as RecordSettlementDto, req.user.userId);
    res.status(201).json({ data: settlement, meta: { requestId: req.id } });
  } catch (err) { next(err); }
}

export async function confirmSettlement(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const updated = await settlementService.confirmSettlement(req.params['id'] ?? '', req.user.userId);
    res.json({ data: updated, meta: { requestId: req.id } });
  } catch (err) { next(err); }
}

export async function getGroupSettlements(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as Record<string, string>;
    const limit = Math.min(parseInt(query['limit'] ?? '20', 10) || 20, 100);
    const result = await settlementService.getGroupSettlements(
      req.params['id'] ?? '',
      req.user.userId,
      limit,
      query['cursor']
    );
    res.json({ ...result, meta: { requestId: req.id } });
  } catch (err) { next(err); }
}

export async function getSimplifiedDebts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const debts = await settlementService.getSimplifiedDebts(req.params['id'] ?? '', req.user.userId);
    res.json({ data: debts, meta: { requestId: req.id } });
  } catch (err) { next(err); }
}

export async function getPersonalSettlements(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as Record<string, string>;
    const limit = Math.min(parseInt(query['limit'] ?? '20', 10) || 20, 100);
    const result = await settlementService.getPersonalSettlements(req.user.userId, limit, query['cursor']);
    res.json({ ...result, meta: { requestId: req.id } });
  } catch (err) { next(err); }
}

export async function getGroupBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const balances = await settlementService.getGroupBalances(req.params['id'] ?? '', req.user.userId);
    res.json({ data: balances, meta: { requestId: req.id } });
  } catch (err) { next(err); }
}
