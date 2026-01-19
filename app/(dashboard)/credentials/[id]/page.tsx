import { getCredentialById } from '@/lib/actions/credentials';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Folder, Shield, Calendar, Layers, Globe } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import CredentialSecrets from '@/components/credentials/CredentialSecrets';
import DeleteCredentialButton from '@/components/credentials/DeleteButton';
import ShareSettings from '@/components/credentials/ShareSettings';
import { auth } from '@/lib/auth';

export default async function CredentialDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const credential = await getCredentialById(params.id);

    if (!credential) {
        notFound();
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-6">
                <Link href="/credentials" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center text-sm font-medium">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Credentials
                </Link>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 md:flex md:items-center md:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
                            {credential.name}
                        </h2>
                        <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                            <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <Shield className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
                                {credential.type}
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <Layers className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
                                {credential.category || 'Uncategorized'}
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <Globe className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
                                {credential.environment || 'N/A'}
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <Clock className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
                                Updated {credential.lastModifiedOn ? formatDate(credential.lastModifiedOn) : 'Never'}
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
                        <Link href={`/credentials/${credential.id}/edit`}>
                            <Button variant="outline">Edit</Button>
                        </Link>
                        <DeleteCredentialButton id={credential.id} />
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-6">
                    {credential.description && (
                        <div className="mb-8">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Description / Notes</h3>
                            <div className="prose dark:prose-invert text-gray-900 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
                                {credential.description}
                            </div>
                        </div>
                    )}

                    <div>
                        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Secrets & Details</h3>
                        <CredentialSecrets type={credential.type} data={credential.details} />
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Created by <span className="font-medium text-gray-900 dark:text-white">{credential.createdBy.name}</span>
                        {credential.createdBy.email && ` (${credential.createdBy.email})`} on {formatDate(credential.createdOn)}
                    </div>

                    <ShareSettings
                        credentialId={credential.id}
                        shares={credential.accessList}
                        ownerId={credential.createdById}
                        currentUserId={(await auth())?.user?.id}
                    />
                </div>
            </div>
        </div>
    );
}

