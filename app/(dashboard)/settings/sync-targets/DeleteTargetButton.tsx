'use client';

import React, { useTransition, useState } from 'react';
import { deleteSyncTargetAction } from '@/lib/actions/sync-targets';
import { Button } from '@/components/ui/button';
import { Trash2, X } from 'lucide-react';

interface DeleteTargetButtonProps {
  id: string;
  name: string;
}

export default function DeleteTargetButton({ id, name }: DeleteTargetButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  const handleDeleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmInput !== 'DELETE') return;

    setShowConfirm(false);
    startTransition(async () => {
      const res = await deleteSyncTargetAction(id);
      if (res.error) {
        alert(res.error || 'Failed to delete target');
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        disabled={isPending}
        onClick={() => {
          setConfirmInput('');
          setShowConfirm(true);
        }}
        size="sm"
        variant="ghost"
        title="Delete target"
      >
        <Trash2 className={`w-4 h-4 text-red-500 hover:text-red-700 ${isPending ? 'opacity-50' : ''}`} />
      </Button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 text-left normal-case">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700 text-left normal-case">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Synchronization Target
              </h3>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 break-words">
              Are you sure you want to delete the synchronization target <span className="font-semibold text-gray-900 dark:text-white break-all"><br />"{name}"</span>?
              <br />
              <br />
              This action cannot be undone. Please type <span className="font-mono font-bold text-red-600 dark:text-red-400">DELETE</span> to confirm.
            </p>

            <form onSubmit={handleDeleteSubmit} className="space-y-4">
              <input
                type="text"
                required
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="Type DELETE here"
                className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 dark:bg-gray-700 dark:text-white focus:ring-red-500 focus:border-red-500 focus:outline-none"
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
                  disabled={confirmInput !== 'DELETE'}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${confirmInput === 'DELETE'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-red-650 opacity-50 cursor-not-allowed'
                    }`}
                >
                  Delete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
