'use client';

import React, { useTransition, useState } from 'react';
import { toggleSyncTargetStatusAction } from '@/lib/actions/sync-targets';
import { X } from 'lucide-react';

interface StatusToggleProps {
  id: string;
  initialStatus: boolean;
  canEdit: boolean;
}

export default function StatusToggle({ id, initialStatus, canEdit }: StatusToggleProps) {
  const [isPending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(initialStatus);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  const targetText = enabled ? 'DISABLE' : 'ENABLE';

  const handleToggleClick = () => {
    if (!canEdit || isPending) return;
    setConfirmInput('');
    setShowConfirm(true);
  };

  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmInput !== targetText) return;

    setShowConfirm(false);
    const nextState = !enabled;
    setEnabled(nextState);

    startTransition(async () => {
      const res = await toggleSyncTargetStatusAction(id, nextState);
      if (res.error) {
        // Revert UI switch if backend fails
        setEnabled(enabled);
        alert(res.error || 'Failed to update target status');
      }
    });
  };

  return (
    <>
      <button
        type="button"
        disabled={!canEdit || isPending}
        onClick={handleToggleClick}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          enabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
        } ${(!canEdit || isPending) ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="sr-only">Toggle status</span>
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 text-left normal-case">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700 text-left normal-case">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirm Status Change
              </h3>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              To {enabled ? 'disable' : 'enable'} this synchronization target, please type <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{targetText}</span> below.
            </p>

            <form onSubmit={handleConfirmSubmit} className="space-y-4">
              <input
                type="text"
                required
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={`Type ${targetText} here`}
                className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={confirmInput !== targetText}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                    confirmInput === targetText
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-indigo-600 opacity-50 cursor-not-allowed'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
