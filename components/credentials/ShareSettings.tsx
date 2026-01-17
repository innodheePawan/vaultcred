'use client';

import { useState, useTransition } from 'react';
import { searchUsers, shareCredential, unshareCredential } from '@/lib/actions/sharing';
import { Button } from '@/components/ui/button';
import { UserPlus, X, Search, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ShareSettings({ credentialId, shares, ownerId, currentUserId }: any) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, startSearch] = useTransition();
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const isOwner = ownerId === currentUserId;
    // For now, only owner can share. Admin check can be added if passed props.
    if (!isOwner) return null;

    const handleSearch = (term: string) => {
        setQuery(term);
        if (term.length < 2) {
            setResults([]);
            return;
        }
        startSearch(async () => {
            const users = await searchUsers(term);
            setResults(users);
        });
    };

    const handleShare = (userId: string) => {
        startTransition(async () => {
            const result = await shareCredential(credentialId, userId);
            if (result.success) {
                setQuery('');
                setResults([]);
                router.refresh();
            } else {
                alert(result.error);
            }
        });
    };

    const handleUnshare = (userId: string) => {
        if (!confirm('Revoke access for this user?')) return;

        startTransition(async () => {
            const result = await unshareCredential(credentialId, userId);
            if (result.success) {
                router.refresh();
            } else {
                alert(result.error);
            }
        });
    };

    const alreadySharedIds = new Set(shares.map((s: any) => s.userId));

    return (
        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Sharing</h3>

            <div className="mb-6">
                <div className="relative max-w-md">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search users to share with..."
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 pl-10 dark:bg-gray-700 dark:text-white"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                </div>

                {results.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full max-w-md bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto sm:text-sm">
                        {results.map((user) => (
                            <div key={user.id} className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <div className="flex items-center">
                                    <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 mr-3">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                                        <div className="text-xs text-gray-500">{user.email}</div>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={alreadySharedIds.has(user.id) || isPending}
                                    onClick={() => handleShare(user.id)}
                                >
                                    {alreadySharedIds.has(user.id) ? 'Shared' : 'Add'}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-3">
                {shares.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Not shared with anyone.</p>
                ) : (
                    shares.map((share: any) => (
                        <div key={share.userId} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                            <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 mr-3">
                                    <User className="h-4 w-4" />
                                </div>
                                <div>
                                    {/* We need share.user details. Currently getCredentialById includes shares. We need to check if it includes user logic deep enough. */}
                                    <div className="font-medium text-gray-900 dark:text-white">
                                        {share.user?.name || share.user?.email || 'User'}
                                    </div>
                                    <div className="text-xs text-gray-500">Viewer</div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnshare(share.userId)}
                                disabled={isPending}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Remove</span>
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
