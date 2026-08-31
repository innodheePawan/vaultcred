import { getCredentialById } from '@/lib/actions/credentials';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Folder, Shield, Calendar, Layers, Globe, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import CredentialSecrets from '@/components/credentials/CredentialSecrets';
import DeleteCredentialButton from '@/components/credentials/DeleteButton';
import { auth } from '@/lib/auth';

export default async function CredentialDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;

    const session = await auth();
    const credential = await getCredentialById(params.id);

    if (!credential) {
        notFound();
    }

    const { getUserAccessContext, canAccess } = await import('@/lib/iam/permissions');
    const ctx = session?.user?.id ? await getUserAccessContext(session.user.id) : null;
    const isOwner = credential.createdById === session?.user?.id;
    const isAdmin = ctx?.role === 'ADMIN' || session?.user?.role === 'ADMIN';
    const isExternal = ctx?.isExternal ?? false;

    let canEdit = false;
    if (isAdmin || isOwner) canEdit = true;
    else if (isExternal) canEdit = false;
    else if (ctx) canEdit = canAccess(ctx, 'FEATURE:CREDENTIALS', 'EDIT');

    const isExpired = credential.expiryDate ? new Date(credential.expiryDate) < new Date() : false;

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            {/* Back to Credentials Link */}
            <div className="mb-6">
                <Link href="/credentials" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center text-sm font-medium transition-colors gap-1.5">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Credentials
                </Link>
            </div>

            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl sm:tracking-tight">
                            {credential.name}
                        </h1>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            isExpired 
                                ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30' 
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
                        }`}>
                            {isExpired ? 'EXPIRED' : 'ACTIVE'}
                        </span>
                    </div>

                    {/* Metadata strip */}
                    <div className="mt-3 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                            <Shield className="w-4 h-4 mr-1.5 text-gray-400 dark:text-gray-500" />
                            <span className="font-mono text-gray-700 dark:text-gray-300">{credential.type}</span>
                        </div>
                        {credential.category && (
                            <div className="flex items-center">
                                <Layers className="w-4 h-4 mr-1.5 text-gray-400 dark:text-gray-500" />
                                <span className="text-gray-700 dark:text-gray-300">{credential.category}</span>
                            </div>
                        )}
                        {credential.environment && (
                            <div className="flex items-center">
                                <Globe className="w-4 h-4 mr-1.5 text-gray-400 dark:text-gray-500" />
                                <span className="font-semibold text-gray-700 dark:text-gray-300">{credential.environment}</span>
                            </div>
                        )}
                        <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1.5 text-gray-400 dark:text-gray-500" />
                            <span>Updated: {credential.lastModifiedOn ? formatDate(credential.lastModifiedOn) : 'Never'}</span>
                        </div>
                        {credential.isPersonal && (
                            <div className="flex items-center text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-950/40 px-2 py-0.5 rounded border dark:border-purple-900/50">
                                <EyeOff className="w-3.5 h-3.5 mr-1" />
                                Personal (Private)
                            </div>
                        )}
                        {credential.expiryDate && (
                            <div className={`flex items-center ${isExpired ? 'text-red-600 dark:text-red-400 font-bold' : ''}`}>
                                <Calendar className="w-4 h-4 mr-1.5 text-gray-400 dark:text-gray-500" />
                                Expires: {formatDate(credential.expiryDate)}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Action Buttons: Only visible if Admin, Owner, or Internal with Permission */}
                    {canEdit && (
                        <>
                            <Link href={`/credentials/${credential.id}/edit`}>
                                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-transparent dark:text-gray-200 dark:hover:bg-gray-800 text-xs px-4 py-2 flex items-center gap-1.5">
                                    <Pencil className="w-4 h-4" />
                                    Edit
                                </Button>
                            </Link>
                            <DeleteCredentialButton id={credential.id} />
                        </>
                    )}
                </div>
            </div>

            {/* Description Notes Section */}
            {credential.description && (
                <div className="bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 p-5 mb-6 shadow-xs">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Description / Notes</h3>
                    <p className="text-sm text-slate-800 dark:text-gray-300 leading-relaxed">{credential.description}</p>
                </div>
            )}

            {/* Secrets & Details Component */}
            <div className="bg-white dark:bg-slate-950/20 rounded-xl border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm">
                <CredentialSecrets type={credential.type} data={credential.details} />
            </div>

            {/* Footer Audit Row */}
            <div className="mt-8 flex items-center justify-between text-xs text-slate-500 dark:text-gray-500 px-2 border-t border-slate-200 dark:border-slate-800/50 pt-4">
                <span>
                    Created by <span className="text-slate-700 dark:text-gray-400 font-medium">{credential.createdBy.name}</span>
                    {credential.createdBy.email && ` (${credential.createdBy.email})`}
                </span>
                <span>Created: {formatDate(credential.createdOn)}</span>
            </div>
        </div>
    );
}

