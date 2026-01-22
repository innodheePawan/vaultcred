
/**
 * Masks a string value.
 * @param value The value to mask.
 * @returns '******' or undefined if value was null/undefined.
 */
export function mask(value: string | null | undefined): string | undefined {
    if (value === null || value === undefined) return undefined;
    return '******';
}

/**
 * Sanitizes credential data for audit logging.
 * Removes sensitive fields based on type.
 */
export function sanitizeCredentialData(type: string, data: any) {
    if (!data) return {};

    const safeData: any = {
        name: data.name,
        category: data.category,
        environment: data.environment,
        description: data.description,
        isPersonal: data.isPersonal,
        expiryDate: data.expiryDate,
        type: data.type
    };

    // Type specific details
    if (type === 'PASSWORD') {
        safeData.details = {
            username: data.username,
            host: data.host,
            port: data.port,
            password: mask(data.password)
        };
    } else if (type === 'API_OAUTH') {
        safeData.details = {
            clientId: data.clientId,
            tokenEndpoint: data.tokenEndpoint,
            authEndpoint: data.authEndpoint,
            scopes: data.scopes,
            clientSecret: data.clientSecret ? mask(data.clientSecret) : undefined,
            apiKey: data.apiKey ? mask(data.apiKey) : undefined
        };
    } else if (type === 'KEY_CERT') {
        safeData.details = {
            keyType: data.keyType,
            keyFormat: data.keyFormat,
            publicKeyFileName: data.publicKeyFileName,
            privateKeyFileName: data.privateKeyFileName,
            // Mask private key and passphrase
            privateKey: data.privateKey ? mask(data.privateKey) : undefined,
            passphrase: data.passphrase ? mask(data.passphrase) : undefined,
            // Public key is usually safe to show, but it's large. Maybe truncate?
            publicKey: data.publicKey ? '(Public Key Content)' : undefined
        };
    } else if (type === 'TOKEN') {
        safeData.details = {
            tokenType: data.tokenType,
            issuer: data.issuer,
            token: mask(data.token)
        };
    } else if (type === 'SECURE_NOTE') {
        safeData.details = {
            note: mask(data.note)
        };
    } else if (type === 'FILE') {
        safeData.details = {
            fileName: data.fileName,
            fileType: data.fileType,
            fileContent: mask(data.fileContent)
        };
    }

    // Clean up undefineds
    return JSON.parse(JSON.stringify(safeData));
}

/**
 * Computes a readable difference between two objects.
 * Focuses on specific fields and handles sanitization.
 */
export function computeDiff(oldData: any, newData: any) {
    const changes: any = {};
    const keys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);

    keys.forEach(key => {
        if (key === 'details') return; // Handle details separately

        const oldVal = oldData?.[key];
        const newVal = newData?.[key];

        if (oldVal !== newVal) {
            changes[key] = { from: oldVal, to: newVal };
        }
    });

    // Deep compare details?
    if (oldData?.details || newData?.details) {
        const oldDetails = oldData?.details || {};
        const newDetails = newData?.details || {};
        const detailKeys = new Set([...Object.keys(oldDetails), ...Object.keys(newDetails)]);

        const detailsChanges: any = {};
        detailKeys.forEach(key => {
            const val1 = oldDetails[key];
            const val2 = newDetails[key];
            if (val1 !== val2) {
                detailsChanges[key] = { from: val1, to: val2 };
            }
        });

        if (Object.keys(detailsChanges).length > 0) {
            changes.details = detailsChanges;
        }
    }

    return changes;
}
