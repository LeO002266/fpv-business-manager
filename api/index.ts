import type { IncomingMessage, ServerResponse } from 'node:http';
import { app } from '../server/src/index.js';
import { createAdapter } from '../server/src/db/index.js';

let adapterPromise: Promise<unknown> | null = null;

function ensureAdapter(): Promise<unknown> {
  if (!adapterPromise) {
    adapterPromise = createAdapter().catch((err) => {
      adapterPromise = null;
      throw err;
    });
  }
  return adapterPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    await ensureAdapter();
  } catch (err) {
    console.error('[FPV] Database initialization failed:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Database connection failed' }));
    }
    return;
  }
  await app(req, res);
}
