import { v4 as uuidv4 } from 'uuid';

export function generateId(prefix: string = 'id'): string {
  const shortUuid = uuidv4().replace(/-/g, '').slice(0, 12);
  return `${prefix}_${shortUuid}`;
}
