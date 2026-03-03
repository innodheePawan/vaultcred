import { verifyLicenseServerSignature } from '../lib/license-utils';
import { LICENCE_PUBLIC_KEY } from '../lib/public-key';

async function main() {
    const apiResponseJSON = {
        "status": "VALID",
        "message": "License is valid and active",
        "entitlements": {
            "validityTill": "2026-03-13",
            "gracePeriodDays": 10,
            "activeUsers": 10
        }
    };

    const signature = `-----BEGIN PGP SIGNATURE-----\n[FAKE_SIGNATURE]\n-----END PGP SIGNATURE-----`;

    const payloadString = JSON.stringify(apiResponseJSON);
    console.log('Testing payload:', payloadString);

    const isValid = await verifyLicenseServerSignature(signature, payloadString, LICENCE_PUBLIC_KEY);
    console.log('Signature valid?', isValid);
}

main();
