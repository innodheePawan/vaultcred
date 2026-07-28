'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyUrlButtonProps {
  url: string;
}

export default function CopyUrlButton({ url }: CopyUrlButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Silently ignore copy failure (e.g. if clipboard permission is denied)
    }
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0 p-1"
      title="Copy Host URL"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
