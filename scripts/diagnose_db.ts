import 'dotenv/config';
import fs from 'fs';
import path from 'path';

console.log('--- DIAGNOSTIC START ---');
console.log('Current Directory:', process.cwd());

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    console.log('.env file found at:', envPath);
    const content = fs.readFileSync(envPath, 'utf-8');
    const dbLine = content.split('\n').find(l => l.includes('DATABASE_URL'));
    console.log('Raw line in .env:', dbLine);
} else {
    console.log('❌ .env file NOT found');
}

console.log('process.env.DATABASE_URL value:', process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is undefined in process.env');
} else if (process.env.DATABASE_URL.includes('localhost')) {
    console.warn('⚠️ DATABASE_URL points to localhost!');
} else {
    console.log('✅ DATABASE_URL looks remote/configured.');
}
console.log('--- DIAGNOSTIC END ---');
