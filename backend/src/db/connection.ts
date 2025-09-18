import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { config } from 'dotenv';
import * as schema from './schema';

config({ path: '.env' });

// Create PostgreSQL client
export const client = new Client({
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT!),
  user: process.env.DB_USERNAME!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
});

// Connect to database
client.connect()
  .then(() => {
    console.log('✅ Connected to PostgreSQL database');
  })
  .catch((err) => {
    console.error('❌ Failed to connect to database:', err);
    process.exit(1);
  });

// Create Drizzle ORM instance with schema for relational queries
export const db = drizzle(client, { schema });

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  Closing database connection...');
  await client.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️  Closing database connection...');
  await client.end();
  process.exit(0);
});
