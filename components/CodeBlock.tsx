"use client";

import { useState } from "react";

export function CodeBlock({ code, language, path }: { code: string; language: string; path?: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-md border border-neutral-200 bg-neutral-50 overflow-hidden my-4">
      <div className="flex items-center justify-between bg-neutral-100 px-4 py-2 border-b border-neutral-200">
        <span className="text-xs font-semibold text-neutral-600">{path || language}</span>
        <button
          onClick={copyToClipboard}
          className="text-xs font-bold text-ink hover:text-coral transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-sm text-neutral-800">
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
