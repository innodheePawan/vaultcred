import { encrypt, decrypt } from '../lib/crypto';
import 'dotenv/config';

try {
    const originalText = "SuperSecretPassword123!";
    console.log(`Original: ${originalText}`);

    const encrypted = encrypt(originalText);
    console.log(`Encrypted: ${encrypted}`);

    const decrypted = decrypt(encrypted);
    console.log(`Decrypted: ${decrypted}`);

    if (originalText === decrypted) {
        console.log("SUCCESS: Encryption/Decryption roundtrip works!");
    } else {
        console.error("FAILURE: Decrypted text does not match original!");
        process.exit(1);
    }
} catch (error) {
    console.error("An error occurred:", error);
    process.exit(1);
}
