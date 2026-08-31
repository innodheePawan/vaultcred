import crypto from 'crypto';

export interface KeyCertValidationResult {
    valid: boolean;
    error?: string;
    extractedMetadata?: {
        validFrom?: Date;
        validTo?: Date;
        issuer?: string;
        subject?: string;
        fingerprint?: string;
        keySize?: number;
        algorithm?: string;
    };
}

/**
 * Validates Key / Certificate inputs:
 * 1. Validates Public Key / Certificate structure.
 * 2. Validates Private Key structure and tests Passphrase decryption.
 * 3. Verifies that Public Key and Private Key match and belong to the same key pair.
 * 4. Extracts X.509 Certificate metadata (validFrom, validTo, issuer, subject, fingerprint, keySize, algorithm).
 */
export function validateAndExtractKeyCert(payload: {
    keyType: string;
    keyFormat?: string;
    publicKey?: string | null;
    privateKey?: string | null;
    passphrase?: string | null;
}): KeyCertValidationResult {
    const { keyType, publicKey, privateKey, passphrase } = payload;
    let extractedMetadata: KeyCertValidationResult['extractedMetadata'] = {};

    const trimmedPub = publicKey?.trim() || '';
    const trimmedPriv = privateKey?.trim() || '';

    // Handle PGP keys specifically if PGP headers are detected
    const isPgp = keyType === 'PGP' || trimmedPub.includes('PGP PUBLIC KEY BLOCK') || trimmedPriv.includes('PGP PRIVATE KEY BLOCK');

    if (isPgp) {
        if (trimmedPub && !trimmedPub.includes('-----BEGIN PGP PUBLIC KEY BLOCK-----')) {
            return { valid: false, error: 'Invalid PGP Public Key: Missing -----BEGIN PGP PUBLIC KEY BLOCK----- header.' };
        }
        if (trimmedPriv && !trimmedPriv.includes('-----BEGIN PGP PRIVATE KEY BLOCK-----')) {
            return { valid: false, error: 'Invalid PGP Private Key: Missing -----BEGIN PGP PRIVATE KEY BLOCK----- header.' };
        }
        return { valid: true, extractedMetadata };
    }

    let pubKeyObject: crypto.KeyObject | null = null;
    let privKeyObject: crypto.KeyObject | null = null;

    // 1. Validate Public Key / Certificate
    if (trimmedPub.length > 0) {
        try {
            if (trimmedPub.includes('-----BEGIN CERTIFICATE-----')) {
                const cert = new crypto.X509Certificate(trimmedPub);
                pubKeyObject = cert.publicKey;
                extractedMetadata = {
                    validFrom: new Date(cert.validFrom),
                    validTo: new Date(cert.validTo),
                    issuer: cert.issuer,
                    subject: cert.subject,
                    fingerprint: cert.fingerprint,
                    keySize: cert.publicKey.asymmetricKeyDetails?.modulusLength,
                    algorithm: cert.publicKey.asymmetricKeyType,
                };
            } else {
                pubKeyObject = crypto.createPublicKey(trimmedPub);
                if (pubKeyObject.type !== 'public') {
                    return { valid: false, error: 'The provided public key is not a valid public key.' };
                }
                extractedMetadata = {
                    keySize: pubKeyObject.asymmetricKeyDetails?.modulusLength,
                    algorithm: pubKeyObject.asymmetricKeyType,
                };
            }
        } catch (err: any) {
            return { valid: false, error: `Invalid Public Key or Certificate format: ${err.message}` };
        }
    }

    // 2. Validate Private Key & Passphrase Decryption
    if (trimmedPriv.length > 0) {
        try {
            privKeyObject = crypto.createPrivateKey({
                key: trimmedPriv,
                passphrase: passphrase || undefined,
            });
            if (privKeyObject.type !== 'private') {
                return { valid: false, error: 'The provided private key is not a valid private key.' };
            }
        } catch (err: any) {
            if (passphrase) {
                return { valid: false, error: 'Failed to unlock Private Key: Passphrase is incorrect or Private Key format is invalid.' };
            }
            return { valid: false, error: `Invalid Private Key format or missing passphrase: ${err.message}` };
        }
    }

    // 3. Assert Key Pair Match if BOTH Public Key and Private Key are present
    if (pubKeyObject && privKeyObject) {
        try {
            const derivedPub = crypto.createPublicKey(privKeyObject);
            const derivedSpki = derivedPub.export({ type: 'spki', format: 'der' }).toString('hex');
            const givenSpki = pubKeyObject.export({ type: 'spki', format: 'der' }).toString('hex');

            if (derivedSpki !== givenSpki) {
                return { valid: false, error: 'Key Pair Mismatch: The Public Key and Private Key do not belong to the same key pair.' };
            }
        } catch (err: any) {
            return { valid: false, error: `Failed to verify key pair matching: ${err.message}` };
        }
    }

    return { valid: true, extractedMetadata };
}
