'use client';

import { createCredential } from '@/lib/actions/credentials';
import CredentialForm from '@/components/credentials/CredentialForm';

export default function CreateCredentialPage() {
    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
                        Add New Credential
                    </h2>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <CredentialForm action={createCredential} />
            </div>
        </div>
    );
}
