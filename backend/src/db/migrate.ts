import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { db } from './index';

console.log('Migrating...');
try {
  migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migration complete!');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
}
