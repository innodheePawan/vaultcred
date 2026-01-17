const fs = require('fs');
const crypto = require('crypto');
const key = crypto.randomBytes(32).toString('hex');
const secret = crypto.randomBytes(32).toString('hex');
fs.appendFileSync('.env', `\nMASTER_KEY=${key}\nAUTH_SECRET=${secret}\n`);
console.log('Keys appended to .env');
