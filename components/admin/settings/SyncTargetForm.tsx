'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  parseServiceKeyAction,
  testConnectionAction,
  saveSyncTargetAction,
} from '@/lib/actions/sync-targets';
import {
  Save,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  X,
  Info,
  Server,
  Calendar,
  User as UserIcon,
} from 'lucide-react';

interface SyncTargetFormProps {
  initialTarget?: any; // populated in edit mode
  canEdit?: boolean;
}

export default function SyncTargetForm({ initialTarget, canEdit = true }: SyncTargetFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Basic Details
  const [name, setName] = useState(initialTarget?.name || '');
  const [description, setDescription] = useState(initialTarget?.description || '');
  const [status, setStatus] = useState<'ENABLED' | 'DISABLED'>(initialTarget?.status || 'ENABLED');

  // Connection Configuration
  const [configMethod, setConfigMethod] = useState<'manual' | 'upload'>(initialTarget ? 'manual' : 'upload');
  const [hostUrl, setHostUrl] = useState(initialTarget?.hostUrl || '');
  const [tokenUrl, setTokenUrl] = useState(initialTarget?.tokenUrl || '');
  const [clientId, setClientId] = useState(initialTarget?.clientId || '');
  const [clientSecret, setClientSecret] = useState(initialTarget?.clientSecret || '');
  const [certificate, setCertificate] = useState(initialTarget?.certificate || '');
  const [tenantLabel, setTenantLabel] = useState(initialTarget?.tenantLabel || '');

  // Scope: Categories, Types & Environments
  const allCategories = [
    { id: 'Application', label: 'Application' },
    { id: 'Infra', label: 'Infrastructure' },
    { id: 'Integration', label: 'Integration' },
  ];

  const allTypes = [
    { id: 'PASSWORD', label: 'Username & Password' },
    { id: 'API_OAUTH', label: 'OAuth Credentials' },
    { id: 'SSH_KEY', label: 'SSH Keys' },
    { id: 'KEY_CERT', label: 'Certificates' },
    { id: 'PGP_KEY', label: 'PGP Keys' },
    { id: 'API_KEY', label: 'API Keys' },
    { id: 'SECURE_NOTE', label: 'Secure Notes' },
    { id: 'FILE', label: 'Files' },
  ];

  const allEnvironments = [
    { id: 'Dev', label: 'Development (Dev)' },
    { id: 'QA', label: 'Quality Assurance (QA)' },
    { id: 'Prod', label: 'Production (Prod)' },
  ];

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialTarget?.categories ? (initialTarget.categories as string[]) : []
  );

  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    initialTarget?.types ? (initialTarget.types as string[]) : []
  );

  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>(
    initialTarget?.environments ? (initialTarget.environments as string[]) : ['Dev', 'QA', 'Prod']
  );

  // Connection Test & Validation State
  const [testSteps, setTestSteps] = useState<any[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    health: 'HEALTHY' | 'FAILED' | 'NEVER_TESTED';
    configHash: string;
    responseTime: number;
    httpStatus: number;
    errorMessage: string | null;
  }>({
    health: initialTarget ? (initialTarget.connectionHealth as any) : 'NEVER_TESTED',
    configHash: initialTarget?.configHash || '',
    responseTime: initialTarget?.lastTestResponseTime || 0,
    httpStatus: initialTarget?.lastTestHttpStatus || 0,
    errorMessage: initialTarget?.lastTestError || null,
  });

  // Client-Side Save Lock (gated by config hash matching)
  const [validatedConfigHash, setValidatedConfigHash] = useState<string>(initialTarget?.configHash || '');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isFirstRender, setIsFirstRender] = useState(true);

  // Monitor connection parameters to invalidate previous connection tests
  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false);
      return;
    }
    // If any parameters change, reset validation hash to lock save button
    setValidatedConfigHash('');
  }, [hostUrl, tokenUrl, clientId, clientSecret, certificate]);

  // Handle category toggle
  const handleCategoryToggle = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Handle type toggle
  const handleTypeToggle = (id: string) => {
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Handle environment toggle
  const handleEnvironmentToggle = (id: string) => {
    setSelectedEnvironments((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Service Key Secure Parsing
  const handleServiceKeyUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    setFormSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      try {
        const res = await parseServiceKeyAction(text);
        if (res.error) {
          setFormError(res.error);
        } else if (res.success && res.data) {
          setHostUrl(res.data.hostUrl || '');
          setTokenUrl(res.data.tokenUrl || '');
          setClientId(res.data.clientId || '');
          setClientSecret(res.data.clientSecret || '');
          setCertificate(res.data.certificate || '');
          setTenantLabel(res.data.tenantLabel || '');
          setFormSuccess('Service Key uploaded and parsed successfully.');
        }
      } catch (err: any) {
        setFormError('Failed to parse Service Key JSON.');
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Connection Test Execution
  const handleTestConnection = async () => {
    setFormError(null);
    setFormSuccess(null);
    setIsTesting(true);
    setTestSteps([]);

    const payload = {
      id: initialTarget?.id || null,
      hostUrl,
      tokenUrl,
      clientId,
      clientSecret,
      certificate: certificate || null,
      types: selectedTypes,
      categories: selectedCategories,
      environments: selectedEnvironments,
    };

    try {
      const res = await testConnectionAction(payload);
      if (res.error) {
        const shortBannerError = res.error.trim().startsWith('{') || res.error.trim().startsWith('<')
          ? 'Validation failed. Please inspect input values.'
          : res.error;
        setFormError(shortBannerError);
        setTestResult((prev) => ({ ...prev, health: 'FAILED', errorMessage: res.error }));
      } else if (res.success) {
        setTestSteps(res.steps || []);
        setTestResult({
          health: res.health as any,
          configHash: res.configHash || '',
          responseTime: res.responseTime || 0,
          httpStatus: res.httpStatus || 200,
          errorMessage: res.errorMessage || null,
        });

        if (res.health === 'HEALTHY') {
          setValidatedConfigHash(res.configHash || '');
          setFormSuccess('Connection tested and verified successfully!');
        } else {
          const shortBannerError = res.errorMessage && (res.errorMessage.trim().startsWith('{') || res.errorMessage.trim().startsWith('<'))
            ? 'Connection diagnostics failed. Check step details below for more information.'
            : (res.errorMessage || 'Connection test failed.');
          setFormError(shortBannerError);
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'An unexpected error occurred during testing.');
      setTestResult((prev) => ({ ...prev, health: 'FAILED', errorMessage: err.message }));
    } finally {
      setIsTesting(false);
    }
  };

  // Submit Save Target
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    // Business validations
    if (!name.trim()) return setFormError('Target Name is required.');
    if (!hostUrl.trim()) return setFormError('Host URL is required.');
    if (!tokenUrl.trim()) return setFormError('Token URL is required.');
    if (!clientId.trim()) return setFormError('Client ID is required.');
    if (!clientSecret.trim()) return setFormError('Client Secret is required.');
    if (!tenantLabel.trim()) return setFormError('Tenant Label is required.');
    if (selectedCategories.length === 0) {
      return setFormError('Select at least one scope Category.');
    }
    if (selectedTypes.length === 0) {
      return setFormError('Select at least one scope Credential Type.');
    }
    if (selectedEnvironments.length === 0) {
      return setFormError('Select at least one scope Environment.');
    }

    if (!validatedConfigHash || validatedConfigHash !== testResult.configHash) {
      return setFormError(
        'Connection configuration has changed since it was validated. Please re-run the connection test before saving.'
      );
    }

    const payload = {
      name,
      description: description || null,
      type: 'SAP_BTP_INTEGRATION_SUITE',
      status,
      hostUrl,
      tokenUrl,
      clientId,
      clientSecret,
      certificate: certificate || null,
      tenantLabel,
      categories: selectedCategories,
      types: selectedTypes,
      environments: selectedEnvironments,
    };

    const testMetadata = {
      connectionHealth: testResult.health === 'HEALTHY' ? ('HEALTHY' as const) : ('FAILED' as const),
      lastTestResponseTime: testResult.responseTime,
      lastTestHttpStatus: testResult.httpStatus,
      lastTestError: testResult.errorMessage,
    };

    startTransition(async () => {
      const res = await saveSyncTargetAction(
        initialTarget?.id || null,
        payload,
        validatedConfigHash,
        testMetadata
      );
      if (res.error) {
        setFormError(res.error);
      } else {
        router.push('/settings/sync-targets');
      }
    });
  };

  // Save is active ONLY when configuration is fully tested and matching
  const isSaveDisabled =
    !canEdit || isPending || !validatedConfigHash || validatedConfigHash !== testResult.configHash;

  return (
    <div className="space-y-6 max-w-4xl bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      {/* Page Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {initialTarget ? 'Edit Synchronization Target' : 'Create New Synchronization Target'}
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Configure a secure connection to SAP BTP Integration Suite (Cloud Integration) to sync credentials.
        </p>
      </div>

      {/* Success/Error Alerts */}
      {formError && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md flex items-center gap-2 border border-red-200 dark:border-red-800/30">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{formError}</span>
        </div>
      )}

      {formSuccess && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md flex items-center gap-2 border border-green-200 dark:border-green-800/30">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{formSuccess}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: General Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
            General Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Target Name *
              </label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. SAP Integration Suite Prod"
                className="mt-1 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none border disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                disabled={!canEdit}
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this target connection context..."
                className="mt-1 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none border disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Connection Details */}
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
              Connection Parameters
            </h3>
            {canEdit && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={configMethod === 'manual' ? 'default' : 'outline'}
                  onClick={() => setConfigMethod('manual')}
                >
                  Manual Input
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={configMethod === 'upload' ? 'default' : 'outline'}
                  onClick={() => setConfigMethod('upload')}
                >
                  Upload Service Key
                </Button>
              </div>
            )}
          </div>

          {configMethod === 'upload' && canEdit && (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 p-4 rounded-md text-center bg-gray-50 dark:bg-gray-700/30">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <label className="cursor-pointer text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                Upload SAP Service Key JSON
                <input
                  type="file"
                  accept=".json"
                  className="sr-only"
                  onChange={handleServiceKeyUpload}
                />
              </label>
              <p className="text-xs text-gray-500 mt-1">Select the parsed JSON file. Uploading parses server-side and does not persist JSON file.</p>
            </div>
          )}

          {(configMethod === 'manual' || (configMethod === 'upload' && hostUrl)) && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Host URL *
                  </label>
                  <input
                    type="url"
                    required
                    disabled={!canEdit}
                    value={hostUrl}
                    onChange={(e) => setHostUrl(e.target.value)}
                    placeholder="https://abcd1234.it-cpi.cfapps.eu10.hana.ondemand.com"
                    className="mt-1 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none border disabled:opacity-50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    OAuth Token URL *
                  </label>
                  <input
                    type="url"
                    required
                    disabled={!canEdit}
                    value={tokenUrl}
                    onChange={(e) => setTokenUrl(e.target.value)}
                    placeholder="https://company.authentication.eu10.hana.ondemand.com/oauth/token"
                    className="mt-1 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none border disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Client ID *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!canEdit}
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="sb-clone-12345!b1234|it-rt!b12"
                    className="mt-1 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none border disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Client Secret *
                  </label>
                  <input
                    type="password"
                    required
                    disabled={!canEdit}
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder={initialTarget ? '••••••••••••••••' : 'Enter Client Secret'}
                    className="mt-1 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none border disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tenant Label *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!canEdit}
                    value={tenantLabel}
                    onChange={(e) => setTenantLabel(e.target.value)}
                    placeholder="e.g. abcd1234 (eu10)"
                    className="mt-1 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none border disabled:opacity-50"
                  />
                  <p className="mt-1 text-xs text-gray-500">A friendly identifier to help distinguish environments.</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Certificate (PEM Format)
                  </label>
                  <textarea
                    disabled={!canEdit}
                    rows={3}
                    value={certificate}
                    onChange={(e) => setCertificate(e.target.value)}
                    placeholder={initialTarget && initialTarget.certificate ? '••••••••••••••••' : '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----'}
                    className="mt-1 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none border disabled:opacity-50 font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Scope */}
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
            Synchronization Scope
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Category selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Credential Categories *
              </label>
              <div className="space-y-2 mt-2">
                {allCategories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!canEdit}
                      checked={selectedCategories.includes(cat.id)}
                      onChange={() => handleCategoryToggle(cat.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{cat.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Environment selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Credential Environments *
              </label>
              <div className="space-y-2 mt-2">
                {allEnvironments.map((env) => (
                  <label key={env.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!canEdit}
                      checked={selectedEnvironments.includes(env.id)}
                      onChange={() => handleEnvironmentToggle(env.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{env.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Type selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Credential Types *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {allTypes.map((type) => (
                  <label key={type.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!canEdit}
                      checked={selectedTypes.includes(type.id)}
                      onChange={() => handleTypeToggle(type.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Connection Test Diagnostics */}
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4 rounded-md">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-gray-500" />
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Connection Diagnostics</h4>
            </div>
            {canEdit && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isTesting || !hostUrl || !tokenUrl || !clientId || !clientSecret}
                onClick={handleTestConnection}
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
            )}
          </div>

          {/* Steps visual logger */}
          {testSteps.length > 0 && (
            <div className="mt-4 space-y-3 max-w-2xl">
              {testSteps.map((step, idx) => {
                const isFailed = step.status === 'FAILED';
                const shortError = getShortErrorMessage(step.error);

                return (
                  <div key={idx} className="p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 space-y-2.5 shadow-sm text-sm">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        {step.status === 'SUCCESS' ? (
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        )}
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {step.step}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 font-mono shrink-0">
                        {step.duration}ms
                      </span>
                    </div>

                    {/* Details layout */}
                    <div className="grid grid-cols-1 gap-2 pl-6 text-xs text-gray-600 dark:text-gray-400">
                      <div>
                        <span className="font-semibold text-gray-500 block">Endpoint</span>
                        <span className="font-mono break-all bg-gray-50 dark:bg-gray-900/50 p-1 rounded border border-gray-150 dark:border-gray-700 block mt-0.5">
                          {step.endpoint}
                        </span>
                      </div>

                      <div>
                        <span className="font-semibold text-gray-500 block">Status</span>
                        <span className={`font-mono font-bold ${step.status === 'SUCCESS' ? 'text-green-600 dark:text-green-400' : 'text-red-650 dark:text-red-400'}`}>
                          {step.httpStatus} {step.httpStatus === 200 ? 'OK' : step.httpStatus === 403 ? 'Forbidden' : step.httpStatus === 401 ? 'Unauthorized' : ''}
                        </span>
                      </div>

                      {isFailed && step.error && (
                        <div>
                          <span className="font-semibold text-gray-500 block">Message</span>
                          <span className="text-red-600 dark:text-red-450 block mt-0.5 font-medium">
                            {shortError}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Collapsible Panel / Actions */}
                    {isFailed && step.error && (
                      <StepDiagnosticsActions step={step} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Metric details */}
          {testResult.health !== 'NEVER_TESTED' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex flex-col">
                <span className="font-semibold text-gray-500">Connection Health</span>
                <span className={`font-bold ${testResult.health === 'HEALTHY' ? 'text-green-500' : 'text-red-500'}`}>
                  {testResult.health === 'HEALTHY' ? '🟢 Healthy' : '🔴 Failed'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-500">Response Time</span>
                <span className="font-medium">{testResult.responseTime}ms</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-500">Last HTTP Status</span>
                <span className="font-medium">{testResult.httpStatus}</span>
              </div>
              {initialTarget?.lastTestTimestamp && (
                <div className="flex flex-col col-span-2 sm:col-span-1">
                  <span className="font-semibold text-gray-500">Last Tested</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3. h-3 text-gray-400" />
                    <span>{new Date(initialTarget.lastTestTimestamp).toLocaleDateString()}</span>
                    <UserIcon className="w-3 h-3 text-gray-400 ml-1" />
                    <span>{initialTarget.testedBy?.name || initialTarget.testedBy?.email || 'System'}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action controls */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/settings/sync-targets')}
          >
            Cancel
          </Button>

          {canEdit && (
            <Button
              type="submit"
              disabled={isSaveDisabled}
              className={`${isSaveDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isPending ? 'Saving...' : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Target
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function getShortErrorMessage(error: string | null): string {
  if (!error) return '';
  const trimmed = error.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('<')) {
    return 'Detailed response payload returned. Click [View Details] to inspect.';
  }
  if (error.length > 120) {
    return error.substring(0, 120) + '...';
  }
  return error;
}

function StepDiagnosticsActions({ step }: { step: any }) {
  const [expanded, setExpanded] = useState(false);

  const handleDownload = () => {
    try {
      const data = {
        timestamp: new Date().toISOString(),
        request: {
          url: step.endpoint,
          method: step.step.includes('OAuth') ? 'POST' : 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer [MASKED]',
          }
        },
        response: {
          status: step.httpStatus,
          body: step.rawResponse || step.error,
        }
      };

      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'connection-test-response.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to generate response download file.');
    }
  };

  return (
    <div className="pl-6 space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
        >
          {expanded ? 'Hide Details' : 'View Details'}
        </button>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <button
          type="button"
          onClick={handleDownload}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
        >
          Download Response
        </button>
      </div>

      {expanded && (
        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto font-mono text-[10px] space-y-2 text-gray-700 dark:text-gray-300">
          <div>
            <span className="font-semibold text-gray-500 block">Response Headers:</span>
            <pre className="whitespace-pre-wrap font-sans">Content-Type: text/plain;charset=utf-8</pre>
          </div>
          <div>
            <span className="font-semibold text-gray-500 block">Response Body:</span>
            <pre className="whitespace-pre-wrap break-all font-mono">{step.rawResponse || step.error}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
