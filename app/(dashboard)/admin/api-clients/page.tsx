import { getApiClients, getDistinctScopes } from "@/lib/actions/api-clients";
import { getSafeUserContext, canAccess } from '@/lib/iam/permissions';
import ApiClientsClient from "./ApiClientsClient";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "API Clients - Admin" };
export const dynamic = "force-dynamic";

export default async function ApiClientsPage() {
    const session = await auth();
    const ctx = session?.user?.id ? await getSafeUserContext(session.user.id) : null;
    if (!ctx || !canAccess(ctx, 'FEATURE:ADMIN_API_CLIENTS', 'VIEW')) redirect('/dashboard');

    const [clients, scopes] = await Promise.all([
        getApiClients(),
        getDistinctScopes()
    ]);

    // Parse scopes for client consumption
    const parsedClients = clients.map(c => ({
        ...c,
        scopesObj: typeof c.scopes === 'string' ? JSON.parse(c.scopes) : c.scopes
    }));

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">API Clients</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage external applications interfacing with the vault securely.</p>
            </div>
            
            <ApiClientsClient initialClients={parsedClients} availableScopes={scopes} />
        </div>
    );
}
