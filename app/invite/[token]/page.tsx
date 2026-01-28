import { validateInvite } from '@/lib/iam/invites';
import { registerUser } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import Link from 'next/link';
// import RegisterForm from '@/components/auth/RegisterForm'; // Removed unused import

export default async function InvitePage(props: { params: Promise<{ token: string }> }) {
    const params = await props.params;
    const token = params.token;
    const invite = await validateInvite(token);

    if (!invite) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                        <Shield className="h-6 w-6 text-red-600" />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                        Invalid or Expired Invite
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        This invite link is invalid, expired, or has already been used.
                        Please contact your administrator for a new invite.
                    </p>
                    <div className="mt-6">
                        <Link href="/login">
                            <Button variant="outline">Back to Login</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
                        <Shield className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                        Join Credential Vault
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        You have been invited by <span className="font-medium text-gray-900 dark:text-white">{invite.createdBy.name || invite.createdBy.email}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                        Set up your account to get started.
                        Your email <span className="font-medium">{invite.email}</span> is verified.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form action={async (formData) => {
                        'use server';
                        await registerUser(token, formData);
                        // Using redirect inside server action typically, but here wrapper logic is simple.
                        // Actually registerUser returns object, so this form needs to be CLIENT component to handle validation UI.
                        // I will inline a client form request here or make a component.
                    }}>
                        {/* Placeholder for Client Component logic. 
                           Better to use a client component for the form to handle useActionState.
                       */}
                    </form>
                    <RegisterInviteForm token={token} email={invite.email} />
                </div>
            </div>
        </div>
    );
}

import RegisterInviteForm from '@/components/auth/RegisterInviteForm';
