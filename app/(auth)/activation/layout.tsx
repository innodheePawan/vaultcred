import { getLicenseState } from '@/lib/license-enforcement';
import { redirect } from 'next/navigation';

export default async function ActivationLayout({ children }: { children: React.ReactNode }) {
    const licenseInfo = await getLicenseState();

    // Only allow activation page if system is truly UNACTIVATED or COMPROMISED
    // LOCKED systems have a license, but it's expired. They shouldn't activate a new one, they should renew (which might use the same API, but standard users shouldn't access the activation page).
    // Actually, SUPERUSER renewing via activation is allowed in LOCKED state?
    // Let's block if VALID or GRACE.
    if (licenseInfo?.state === 'VALID' || licenseInfo?.state === 'GRACE') {
        redirect('/login');
    }

    return <>{children}</>;
}
