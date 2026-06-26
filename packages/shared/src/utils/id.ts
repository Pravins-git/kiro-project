import { randomUUID } from 'crypto';

export function generateId(): string {
  return randomUUID();
}

export function generatePrefixedId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}
