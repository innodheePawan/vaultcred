// scripts/test-db-parse.ts
import dotenv from 'dotenv';
import path from 'path';

// Load .env explicitly
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const dbUrl = process.env.DATABASE_URL;
console.log('Raw URL length:', dbUrl ? dbUrl.length : 0);

if (!dbUrl) {
    console.error('DATABASE_URL is missing');
    process.exit(1);
}

try {
    const url = new URL(dbUrl);
    console.log('--- Parsed Successfully ---');
    console.log('Protocol:', url.protocol);
    console.log('Host:', url.hostname);
    console.log('Port:', url.port);
    console.log('User:', url.username);
    console.log('Database:', url.pathname.replace('/', ''));
} catch (e) {
    console.error('Parsing Failed:', e);
}
