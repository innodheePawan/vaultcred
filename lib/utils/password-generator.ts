/**
 * Password Generator Utility
 * 
 * Provides cryptographically secure credential generation and strength evaluation.
 * Follows enterprise-safe special character guidelines to prevent issues in JSON, XML, shell scripts, and URLs.
 */

export const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
export const NUMBER_CHARS = '0123456789';
export const SPECIAL_CHARS = '!@#$%^*-_+=';

export interface PasswordGeneratorPolicy {
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    special: boolean;
}

export interface PasswordStrength {
    label: 'Low' | 'Medium' | 'Strong' | 'Enterprise';
    color: string;
    bgColor: string;
    percentage: number;
}

/**
 * Generates a cryptographically secure password with guaranteed presence
 * of characters from each active policy group.
 */
export function generateSecureCredential(
    length: number,
    uppercase: boolean = true,
    lowercase: boolean = true,
    numbers: boolean = true,
    special: boolean = true
): string {
    let charPool = '';
    const mandatoryChars: string[] = [];

    const pickRandomChar = (charset: string) => {
        const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
        if (cryptoObj) {
            const randomValues = new Uint32Array(1);
            cryptoObj.getRandomValues(randomValues);
            return charset[randomValues[0] % charset.length];
        }
        return charset[Math.floor(Math.random() * charset.length)];
    };

    if (uppercase) {
        charPool += UPPERCASE_CHARS;
        mandatoryChars.push(pickRandomChar(UPPERCASE_CHARS));
    }
    if (lowercase) {
        charPool += LOWERCASE_CHARS;
        mandatoryChars.push(pickRandomChar(LOWERCASE_CHARS));
    }
    if (numbers) {
        charPool += NUMBER_CHARS;
        mandatoryChars.push(pickRandomChar(NUMBER_CHARS));
    }
    if (special) {
        charPool += SPECIAL_CHARS;
        mandatoryChars.push(pickRandomChar(SPECIAL_CHARS));
    }

    if (charPool.length === 0) return '';

    let result = '';
    // 1. Add mandatory characters first to guarantee inclusion
    for (const char of mandatoryChars) {
        result += char;
    }

    // 2. Fill remaining length from full active pool
    for (let i = result.length; i < length; i++) {
        result += pickRandomChar(charPool);
    }

    // 3. Fisher-Yates shuffle using crypto randomness to prevent mandatory chars clustering at start
    const resultArray = result.split('');
    for (let i = resultArray.length - 1; i > 0; i--) {
        const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
        let j = 0;
        if (cryptoObj) {
            const randomValues = new Uint32Array(1);
            cryptoObj.getRandomValues(randomValues);
            j = randomValues[0] % (i + 1);
        } else {
            j = Math.floor(Math.random() * (i + 1));
        }
        [resultArray[i], resultArray[j]] = [resultArray[j], resultArray[i]];
    }

    return resultArray.join('');
}

/**
 * Calculates Shannon entropy in bits for the given length and policy.
 */
export function calculateEntropy(length: number, policy: PasswordGeneratorPolicy): number {
    let poolSize = 0;
    if (policy.uppercase) poolSize += 26;
    if (policy.lowercase) poolSize += 26;
    if (policy.numbers) poolSize += 10;
    if (policy.special) poolSize += SPECIAL_CHARS.length; // 11

    if (poolSize === 0) return 0;
    return Math.round(length * Math.log2(poolSize));
}

/**
 * Derives a human-friendly strength classification and styling based on entropy.
 */
export function calculateStrength(entropy: number): PasswordStrength {
    if (entropy < 60) {
        return {
            label: 'Low',
            color: 'text-red-600 dark:text-red-400',
            bgColor: 'bg-red-500',
            percentage: 25,
        };
    }
    if (entropy < 85) {
        return {
            label: 'Medium',
            color: 'text-amber-600 dark:text-amber-400',
            bgColor: 'bg-amber-500',
            percentage: 50,
        };
    }
    if (entropy < 110) {
        return {
            label: 'Strong',
            color: 'text-emerald-600 dark:text-emerald-400',
            bgColor: 'bg-emerald-500',
            percentage: 75,
        };
    }
    return {
        label: 'Enterprise',
        color: 'text-indigo-600 dark:text-indigo-400',
        bgColor: 'bg-indigo-500',
        percentage: 100,
    };
}
