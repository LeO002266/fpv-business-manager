import { initDatabase, DB_PATH } from './schema.js';
import { seedDatabase } from './seed.js';

export const db = initDatabase();
seedDatabase(db);

export * from './schema.js';
