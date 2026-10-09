import { runMigrations } from './index';

console.log('Migrating...');
try {
  runMigrations();
  console.log('Migration complete!');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
}
