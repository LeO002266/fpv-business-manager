/**
 * Database index — re-exports the unified adapter.
 * Routes import { getAdapter } from '../db/index.js' and await it per-request.
 */
export { createAdapter, getAdapter } from './adapter.js';
export type { DbAdapter } from './adapter.js';
