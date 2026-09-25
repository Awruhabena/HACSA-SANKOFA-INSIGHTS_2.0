import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeDisplayProps {
  code: string;
  className?: string;
}

export function CodeDisplay({ code, className = '' }: CodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  return (
    <div
      className={`flex items-center justify-between gap-4 p-4 rounded-2xl bg-cream border-2 border-dashed border-teal/40 ${className}`}
    >
      {/* min-w-0 + break-all are what stop a long code (e.g. a 32-char
          TOTP secret) from forcing the whole centred layout wider than
          the viewport, which made every auth page look shifted left. */}
      <div className="min-w-0 flex-1 font-mono text-2xl sm:text-3xl font-bold tracking-[0.25em] text-navy select-all px-2 break-all">
        {code}
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-border text-navy hover:bg-cream hover:border-gray/50 transition-all cursor-pointer shadow-xs active:scale-95"
        title="Copy verification code"
        aria-label="Copy verification code"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-teal" />
            <span className="text-teal font-bold">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 text-gray" />
            <span>Copy</span>
          </>
        )}
      </button>
    </div>
  );
}
