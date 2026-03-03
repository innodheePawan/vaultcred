import { generateLicenseSignature } from '../lib/license-utils';

const ACTIVATION_API_URL = 'https://main.d2qgnt0ki6h7ki.amplifyapp.com/api/activate';
const activationKey = 'TEST-ACTIVATION-KEY';
const apiKey = 'test_api_key_123';
const apiSecret = 'test_api_secret_456';

async function main() {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = Math.random().toString(36).substring(2, 15);
    const fingerprint = 'test-fingerprint';
    const domain = 'localhost';

    const body = JSON.stringify({
        activationKey: activationKey,
        installationDomain: domain,
        instanceFingerprint: fingerprint,
    });

    const payload = `${timestamp}\n${nonce}\n${body}`;
    const signature = generateLicenseSignature(apiSecret, payload);

    try {
        const response = await fetch(ACTIVATION_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'x-timestamp': timestamp,
                'x-nonce': nonce,
                'x-signature': signature,
            },
            body: body,
        });

        const data = await response.text();
        console.log('API Response Status:', response.status);
        console.log('API Response Body:', data);
    } catch (e) {
        console.error(e);
    }
}

main();
