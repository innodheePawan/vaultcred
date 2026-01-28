'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Database, Server, Save } from 'lucide-react';
import { configureSystem } from '@/lib/actions/setup';

export default function SetupPage() {
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<{ error?: string; success?: string } | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        setStatus(null);

        const formData = new FormData(e.currentTarget);
        const result = await configureSystem(formData);

        if (result.error) {
            setStatus({ error: result.error });
            setIsSaving(false);
        } else {
            setStatus({ success: result.message });
            // Ideally, we'd restart the server or redirect. 
            // In dev mode, a restart is often needed for env vars to stick globally, 
            // but for prisma client instantiation we handled it manually.
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-indigo-600 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                    <Database className="h-8 w-8 text-white" />
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                    System Setup
                </h2>
                <p className="mt-2 text-center text-sm text-gray-400">
                    Configure your database to get started.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-700">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="dbHost" className="block text-sm font-medium text-gray-300">
                                Database Host
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Server className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="dbHost"
                                    name="dbHost"
                                    type="text"
                                    required
                                    className="block w-full pl-10 sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500 py-2"
                                    placeholder="localhost"
                                    defaultValue="localhost"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="dbPort" className="block text-sm font-medium text-gray-300">
                                    Port
                                </label>
                                <input
                                    id="dbPort"
                                    name="dbPort"
                                    type="text"
                                    required
                                    className="mt-1 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500 py-2 px-3"
                                    placeholder="3306"
                                    defaultValue="3306"
                                />
                            </div>
                            <div>
                                <label htmlFor="dbName" className="block text-sm font-medium text-gray-300">
                                    Database Name
                                </label>
                                <input
                                    id="dbName"
                                    name="dbName"
                                    type="text"
                                    required
                                    className="mt-1 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500 py-2 px-3"
                                    placeholder="credential_manager"
                                    defaultValue="credential_manager"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="dbUser" className="block text-sm font-medium text-gray-300">
                                Username
                            </label>
                            <input
                                id="dbUser"
                                name="dbUser"
                                type="text"
                                required
                                className="mt-1 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500 py-2 px-3"
                                placeholder="root"
                            />
                        </div>

                        <div>
                            <label htmlFor="dbPassword" className="block text-sm font-medium text-gray-300">
                                Password
                            </label>
                            <input
                                id="dbPassword"
                                name="dbPassword"
                                type="password"
                                className="mt-1 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500 py-2 px-3"
                            />
                        </div>

                        {status?.error && (
                            <div className="rounded-md bg-red-900/50 p-4 border border-red-700">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-200">
                                            Configuration Failed
                                        </h3>
                                        <div className="mt-2 text-sm text-red-300">
                                            {status.error}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {status?.success && (
                            <div className="rounded-md bg-green-900/50 p-4 border border-green-700">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-green-200">
                                            Success!
                                        </h3>
                                        <div className="mt-2 text-sm text-green-300">
                                            {status.success}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isSaving ? 'opacity-75 cursor-not-allowed' : ''}`}
                            >
                                {isSaving ? (
                                    <>
                                        <span className="animate-spin -ml-1 mr-2 h-4 w-4 text-white">●</span>
                                        Provisioning Database...
                                    </>
                                ) : (
                                    <>
                                        <Save className="-ml-1 mr-2 h-4 w-4" />
                                        Initialize System
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
