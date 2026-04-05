import { EventEmitter } from 'events';

// Forward declarations — these interfaces are fully defined in their respective modules.
// Using 'unknown' here and casting at the call site avoids circular imports.
// The actual runtime objects will have these shapes.

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyPayload = Record<string, any>;
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface EventMap {
  'expense.created': AnyPayload;
  'expense.edited': AnyPayload;
  'expense.deleted': AnyPayload;
  'settlement.recorded': AnyPayload;
  'settlement.confirmed': AnyPayload;
  'friend.request.sent': AnyPayload;
  'friend.accepted': AnyPayload;
  'group.invite': AnyPayload;
  'group.deleted': AnyPayload;
  'user.deleted': { userId: string };
  'recurring.expense.fired': AnyPayload;
}

export type EventName = keyof EventMap;

class TypedEventBus extends EventEmitter {
  emit<K extends EventName>(event: K, payload: EventMap[K]): boolean {
    return super.emit(event, payload);
  }

  on<K extends EventName>(event: K, listener: (payload: EventMap[K]) => void): this {
    return super.on(event, listener);
  }

  off<K extends EventName>(event: K, listener: (payload: EventMap[K]) => void): this {
    return super.off(event, listener);
  }

  once<K extends EventName>(event: K, listener: (payload: EventMap[K]) => void): this {
    return super.once(event, listener);
  }
}

export const eventBus = new TypedEventBus();
// Increase max listeners to avoid warnings (many modules subscribe)
eventBus.setMaxListeners(30);
