import { createCredential } from '@/lib/actions/credentials';
import CredentialForm from '@/components/credentials/CredentialForm';
import { auth } from '@/lib/auth';
import { getUserAccessContext } from '@/lib/iam/permissions';
import { redirect } from 'next/navigation';

export default async function CreateCredentialPage(props: { searchParams: Promise<{ type?: string }> }) {
    const session = await auth();
    if (!session?.user) redirect('/login');

    const searchParams = await props.searchParams;
    const type = searchParams.type;

    const ctx = await getUserAccessContext(session.user.id);

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
                        Add New Credential
                    </h2>
                </div>
                <div className="mt-4 flex md:ml-4 md:mt-0">
                    <a
                        href="/dashboard"
                        className="inline-flex items-center rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        Back to Dashboard
                    </a>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <CredentialForm
                    action={createCredential}
                    initialData={type ? { type } : undefined}
                    allowedCategories={ctx.allowedCategories}
                    allowedEnvironments={ctx.allowedEnvironments}
                />
            </div>
        </div>
    );
}
