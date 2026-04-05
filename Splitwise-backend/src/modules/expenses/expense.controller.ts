import { Request, Response, NextFunction } from 'express';
import * as expenseService from './expense.service';
import { CreateExpenseDto } from './expense.types';

export async function createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const expense = await expenseService.createExpense(req.body as CreateExpenseDto, req.user.userId);
    res.status(201).json({ data: expense, meta: { requestId: req.id } });
  } catch (err) { next(err); }
}

export async function getExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const expense = await expenseService.getExpenseById(req.params['id'] ?? '', req.user.userId);
    res.json({ data: expense, meta: { requestId: req.id } });
  } catch (err) { next(err); }
}

export async function deleteExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await expenseService.softDeleteExpense(req.params['id'] ?? '', req.user.userId);
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function listGroupExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as Record<string, string>;
    const limit = Math.min(parseInt(query['limit'] ?? '20', 10) || 20, 100);
    const result = await expenseService.listGroupExpenses(
      req.params['id'] ?? '',
      req.user.userId,
      limit,
      query['cursor']
    );
    res.json({ ...result, meta: { requestId: req.id } });
  } catch (err) { next(err); }
}

export async function listPersonalExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as Record<string, string>;
    const limit = Math.min(parseInt(query['limit'] ?? '20', 10) || 20, 100);
    const result = await expenseService.listPersonalExpenses(req.user.userId, limit, query['cursor']);
    res.json({ ...result, meta: { requestId: req.id } });
  } catch (err) { next(err); }
}

export async function addReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { key } = req.body as { key: string };
    const expense = await expenseService.addReceipt(req.params['id'] ?? '', req.user.userId, key);
    res.json({ data: expense, meta: { requestId: req.id } });
  } catch (err) { next(err); }
}

export async function removeReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await expenseService.removeReceipt(req.params['id'] ?? '', req.user.userId, req.params['key'] ?? '');
    res.status(204).send();
  } catch (err) { next(err); }
}
