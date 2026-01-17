import { getCredentialById, updateCredential } from '@/lib/actions/credentials';
import CredentialForm from '@/components/credentials/CredentialForm';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function EditCredentialPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user) redirect('/login');

    const credential = await getCredentialById(params.id);

    if (!credential) {
        notFound();
    }

    if (credential.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
        return (
            <div className="max-w-4xl mx-auto py-8 px-4 text-center">
                <h2 className="text-xl font-bold text-red-600">Unauthorized</h2>
                <p>You can only edit credentials you own.</p>
            </div>
        );
    }

    const updateAction = updateCredential.bind(null, credential.id);

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
                        Edit Credential
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        {credential.name}
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <CredentialForm
                    action={updateAction}
                    initialData={credential}
                    isEdit={true}
                />
            </div>
        </div>
    );
}
