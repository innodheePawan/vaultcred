'use client';

import { useState, useRef } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, FileSpreadsheet, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { bulkImportCredentials } from '@/lib/actions/bulk-import';

type ParsedRow = Record<string, string>;

const CSV_HEADERS = [
    'name', 'type', 'category', 'environment', 'description', 'expiryDate',
    'username', 'password', 'host', 'port',
    'clientId', 'clientSecret', 'apiKey', 'tokenEndpoint', 'authEndpoint', 'scopes',
    'keyType', 'keyFormat', 'publicKey', 'privateKey', 'passphrase',
    'token', 'tokenType', 'issuer',
    'note',
    'fileName', 'fileType', 'fileContent',
];

const SAMPLE_DATA: ParsedRow[] = [
    {
        name: 'MySQL Production DB', type: 'PASSWORD', category: 'Application', environment: 'Prod',
        description: 'Production MySQL database credentials', expiryDate: '2026-12-31',
        username: 'db_admin', password: 'S3cur3P@ss!', host: 'db.example.com', port: '3306',
    },
    {
        name: 'Stripe Payment Gateway', type: 'API_OAUTH', category: 'Integration', environment: 'Prod',
        description: 'Stripe API keys for payment processing',
        clientId: 'stripe_live_client_id', clientSecret: 'sk_live_xxxxxxxxxxxx',
        apiKey: 'pk_live_xxxxxxxxxxxx', tokenEndpoint: 'https://api.stripe.com/v1/tokens',
    },
    {
        name: 'SSH Deploy Key', type: 'KEY_CERT', category: 'Infra', environment: 'Dev',
        description: 'SSH key for CI/CD server deployments',
        keyType: 'SSH', keyFormat: 'PEM', publicKey: 'ssh-rsa AAAAB3Nza...example',
        privateKey: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBA...example\n-----END RSA PRIVATE KEY-----',
        passphrase: 'key-passphrase-123',
    },
    {
        name: 'GitHub CI/CD Token', type: 'TOKEN', category: 'Infra', environment: 'Dev',
        description: 'GitHub personal access token for CI/CD', expiryDate: '2026-06-30',
        token: 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', tokenType: 'Bearer', issuer: 'GitHub',
    },
    {
        name: 'Server Access Notes', type: 'SECURE_NOTE', category: 'Infra', environment: 'Prod',
        description: 'Important server access documentation',
        note: 'Root password rotated monthly. VPN required: vpn.example.com. Emergency contact: ops@example.com',
    },
    {
        name: 'SSL Certificate', type: 'FILE', category: 'Infra', environment: 'Prod',
        description: 'Wildcard SSL certificate for *.example.com',
        fileName: 'wildcard-cert.pem', fileType: 'application/x-pem-file',
        fileContent: '-----BEGIN CERTIFICATE-----\nMIIDxTCCA...example\n-----END CERTIFICATE-----',
    },
];

function parseCSV(text: string): ParsedRow[] {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) return [];
    const headers = parseCSVLine(lines[0]);
    const rows: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row: ParsedRow = {};
        headers.forEach((h, idx) => {
            row[h.trim()] = (values[idx] || '').trim();
        });
        rows.push(row);
    }
    return rows;
}

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

function downloadTemplate() {
    const header = CSV_HEADERS.join(',');
    const sampleRows = SAMPLE_DATA.map(row =>
        CSV_HEADERS.map(h => {
            const val = row[h] || '';
            return val.includes(',') || val.includes('\n') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
        }).join(',')
    );
    const csv = header + '\n' + sampleRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'credential_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
}

const TYPE_COLORS: Record<string, string> = {
    PASSWORD: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
    API_OAUTH: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
    KEY_CERT: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
    TOKEN: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
    SECURE_NOTE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
    FILE: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-200',
};

function getKeyFieldsSummary(row: ParsedRow): string {
    switch (row.type) {
        case 'PASSWORD': return `${row.username || '—'}@${row.host || '—'}:${row.port || '—'}`;
        case 'API_OAUTH': return row.clientId ? `Client: ${row.clientId}` : row.apiKey ? `API Key: ****` : '—';
        case 'KEY_CERT': return `${row.keyType || '—'} / ${row.keyFormat || '—'}`;
        case 'TOKEN': return `${row.tokenType || 'Bearer'} • ${row.issuer || '—'}`;
        case 'SECURE_NOTE': return `${(row.note || '').substring(0, 40)}${(row.note || '').length > 40 ? '...' : ''}`;
        case 'FILE': return `${row.fileName || '—'} (${row.fileType || '—'})`;
        default: return '—';
    }
}

export default function BulkImportPage() {
    const [rows, setRows] = useState<ParsedRow[]>([]);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<{
        total: number; success: number; failed: number;
        errors: { row: number; name: string; error: string }[];
    } | null>(null);
    const [fileName, setFileName] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        setResult(null);
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const parsed = parseCSV(text);
            setRows(parsed);
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        if (rows.length === 0) return;
        setImporting(true);
        setResult(null);
        try {
            const res = await bulkImportCredentials(rows);
            setResult(res);
        } catch (err: any) {
            setResult({ total: rows.length, success: 0, failed: rows.length, errors: [{ row: 0, name: '', error: err.message }] });
        } finally {
            setImporting(false);
        }
    };

    const handleClear = () => {
        setRows([]);
        setResult(null);
        setFileName('');
        if (fileRef.current) fileRef.current.value = '';
    };

    const loadSampleData = () => {
        setRows(SAMPLE_DATA);
        setFileName('sample_data (loaded from examples)');
        setResult(null);
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bulk Import Credentials</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Upload a CSV file to import multiple credentials at once. Super Admin access required.
                    </p>
                </div>
                <Button variant="outline" onClick={downloadTemplate} className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download Template
                </Button>
            </div>

            {/* Upload Zone */}
            <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            >
                <input type="file" ref={fileRef} accept=".csv" className="hidden" onChange={handleFileUpload} />
                <FileSpreadsheet className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500 mb-3" />
                {fileName ? (
                    <>
                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{fileName}</p>
                        <p className="text-xs text-gray-500 mt-1">{rows.length} credential{rows.length !== 1 ? 's' : ''} found • Click to replace</p>
                    </>
                ) : (
                    <>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Click to upload a CSV file</p>
                        <p className="text-xs text-gray-500 mt-1">Supports .csv format — use the template for correct columns</p>
                    </>
                )}
            </div>

            {/* Sample Data Reference */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                    <div className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Sample Data Reference</h2>
                        <span className="text-xs text-gray-500 dark:text-gray-400">— one example for each credential type</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={loadSampleData} className="flex items-center gap-1 text-indigo-600 border-indigo-300 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-700 dark:hover:bg-indigo-900/30">
                        <Upload className="w-3 h-3" />
                        Load Sample Data
                    </Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Env</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Key Fields</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Required Columns</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {SAMPLE_DATA.map((sample, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="px-3 py-2.5">
                                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[sample.type] || 'bg-gray-100 text-gray-800'}`}>
                                            {sample.type}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">{sample.name}</td>
                                    <td className="px-3 py-2.5 text-sm text-gray-600 dark:text-gray-300">{sample.category}</td>
                                    <td className="px-3 py-2.5 text-sm text-gray-600 dark:text-gray-300">{sample.environment}</td>
                                    <td className="px-3 py-2.5 text-xs text-gray-500 font-mono max-w-[250px] truncate">{getKeyFieldsSummary(sample)}</td>
                                    <td className="px-3 py-2.5 text-xs text-gray-500">
                                        {sample.type === 'PASSWORD' && <span>name, type, <b>username</b>, <b>password</b></span>}
                                        {sample.type === 'API_OAUTH' && <span>name, type, clientId/apiKey</span>}
                                        {sample.type === 'KEY_CERT' && <span>name, type, <b>keyType</b></span>}
                                        {sample.type === 'TOKEN' && <span>name, type, <b>token</b></span>}
                                        {sample.type === 'SECURE_NOTE' && <span>name, type, <b>note</b></span>}
                                        {sample.type === 'FILE' && <span>name, type, <b>fileName</b>, <b>fileContent</b></span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Column Reference */}
            <details className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                    📋 All Column Names Reference (click to expand)
                </summary>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    <div className="space-y-1">
                        <p className="font-bold text-gray-800 dark:text-gray-200">Common (all types):</p>
                        <p><code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">name</code> ⭐ required</p>
                        <p><code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">type</code> ⭐ PASSWORD | API_OAUTH | KEY_CERT | TOKEN | SECURE_NOTE | FILE</p>
                        <p><code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">category</code> Application | Infra | Integration</p>
                        <p><code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">environment</code> Dev | QA | Prod</p>
                        <p><code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">description</code></p>
                        <p><code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">expiryDate</code> YYYY-MM-DD</p>
                    </div>
                    <div className="space-y-1">
                        <p className="font-bold text-gray-800 dark:text-gray-200">PASSWORD:</p>
                        <p><code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">username</code> ⭐ <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">password</code> ⭐ <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">host</code> <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">port</code></p>
                        <p className="font-bold text-gray-800 dark:text-gray-200 mt-2">API_OAUTH:</p>
                        <p><code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">clientId</code> <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">clientSecret</code> <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">apiKey</code> <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">tokenEndpoint</code> <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">authEndpoint</code> <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">scopes</code></p>
                        <p className="font-bold text-gray-800 dark:text-gray-200 mt-2">TOKEN:</p>
                        <p><code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">token</code> ⭐ <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">tokenType</code> <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">issuer</code></p>
                    </div>
                    <div className="space-y-1">
                        <p className="font-bold text-gray-800 dark:text-gray-200">KEY_CERT:</p>
                        <p><code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">keyType</code> ⭐ SSL | SSH | PGP | TLS | SIGNING</p>
                        <p><code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">keyFormat</code> <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">publicKey</code> <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">privateKey</code> <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">passphrase</code></p>
                        <p className="font-bold text-gray-800 dark:text-gray-200 mt-2">SECURE_NOTE:</p>
                        <p><code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">note</code> ⭐</p>
                        <p className="font-bold text-gray-800 dark:text-gray-200 mt-2">FILE:</p>
                        <p><code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">fileName</code> ⭐ <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">fileType</code> <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">fileContent</code> ⭐</p>
                    </div>
                </div>
            </details>

            {/* Preview Table */}
            {rows.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Preview ({rows.length} row{rows.length !== 1 ? 's' : ''})
                        </h2>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleClear} className="flex items-center gap-1 text-red-600 hover:text-red-700">
                                <Trash2 className="w-3 h-3" />
                                Clear
                            </Button>
                            <Button onClick={handleImport} disabled={importing} className="flex items-center gap-2">
                                <Upload className="w-4 h-4" />
                                {importing ? 'Importing...' : `Import ${rows.length} Credential${rows.length !== 1 ? 's' : ''}`}
                            </Button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">#</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Environment</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Description</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Key Fields</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {rows.map((row, idx) => {
                                    const hasError = result?.errors.some(e => e.row === idx + 2);
                                    return (
                                        <tr key={idx} className={hasError ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                                            <td className="px-3 py-2 text-xs text-gray-500">{idx + 1}</td>
                                            <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">{row.name || '—'}</td>
                                            <td className="px-3 py-2">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[row.type] || 'bg-gray-100 text-gray-800'}`}>
                                                    {row.type || '—'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">{row.category || '—'}</td>
                                            <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">{row.environment || '—'}</td>
                                            <td className="px-3 py-2 text-sm text-gray-500 max-w-[200px] truncate">{row.description || '—'}</td>
                                            <td className="px-3 py-2 text-xs text-gray-500 font-mono max-w-[200px] truncate">
                                                {getKeyFieldsSummary(row)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="space-y-4">
                    <div className={`p-4 rounded-lg flex items-center gap-3 ${result.failed === 0 ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'}`}>
                        {result.failed === 0 ? (
                            <CheckCircle className="w-6 h-6 flex-shrink-0" />
                        ) : (
                            <AlertCircle className="w-6 h-6 flex-shrink-0" />
                        )}
                        <div>
                            <p className="font-semibold">
                                Import Complete: {result.success} of {result.total} credential{result.total !== 1 ? 's' : ''} imported successfully.
                            </p>
                            {result.failed > 0 && (
                                <p className="text-sm mt-1">{result.failed} failed — see details below.</p>
                            )}
                        </div>
                    </div>

                    {result.errors.length > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                            <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">Import Errors</h3>
                            <div className="space-y-1">
                                {result.errors.map((err, idx) => (
                                    <div key={idx} className="text-sm text-red-700 dark:text-red-300 flex gap-2">
                                        <span className="font-mono text-xs bg-red-100 dark:bg-red-800 px-1.5 py-0.5 rounded">Row {err.row}</span>
                                        <span className="font-medium">{err.name}:</span>
                                        <span>{err.error}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {result.success > 0 && (
                        <div className="flex gap-3">
                            <a href="/credentials" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 underline">
                                View All Credentials →
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
