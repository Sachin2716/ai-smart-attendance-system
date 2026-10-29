const { execSync } = require('child_process');

const dbUrl = process.env.DATABASE_URL || '';

if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
  console.log('Detected PostgreSQL connection string. Generating Prisma Client for PostgreSQL...');
  execSync('npx prisma generate --schema=prisma/schema.postgresql.prisma', { stdio: 'inherit' });
} else {
  console.log('Detected SQLite connection string. Generating Prisma Client for SQLite...');
  execSync('npx prisma generate --schema=prisma/schema.prisma', { stdio: 'inherit' });
}
