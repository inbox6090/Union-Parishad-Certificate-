import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface IdentityMaskedValueProps {
  value?: string;
  type?: 'nid' | 'mobile' | 'birthNo' | 'generic';
  label?: string;
  allowReveal?: boolean;
  className?: string;
  emptyText?: string;
}

export type MaskedIdentityType = 'nid' | 'mobile' | 'birthNo' | 'generic';

export function maskIdentity(val: string, type: string = 'generic'): string {
  if (!val) return '—';
  const clean = val.trim();
  if (clean.length <= 4) return clean;

  if (type === 'mobile') {
    // 01712345678 -> 017*****678
    if (clean.length === 11) {
      return `${clean.slice(0, 3)}*****${clean.slice(8)}`;
    }
    const start = clean.slice(0, 3);
    const end = clean.slice(-3);
    return `${start}${'*'.repeat(Math.max(3, clean.length - 6))}${end}`;
  }

  if (type === 'nid' || type === 'birthNo') {
    // 17-digit NID: 19842692015000123 -> 1984*********0123
    // 10-digit NID: 2692015123 -> 269****123
    if (clean.length >= 10) {
      const startLen = clean.length > 12 ? 4 : 3;
      const endLen = clean.length > 12 ? 4 : 3;
      const maskedCount = Math.max(4, clean.length - (startLen + endLen));
      return `${clean.slice(0, startLen)}${'*'.repeat(maskedCount)}${clean.slice(-endLen)}`;
    }
  }

  // Generic masking
  const half = Math.floor(clean.length / 2);
  return `${clean.slice(0, 2)}${'*'.repeat(Math.max(2, half))}${clean.slice(-2)}`;
}

export const IdentityMaskedValue: React.FC<IdentityMaskedValueProps> = ({
  value,
  type = 'generic',
  label,
  allowReveal = true,
  className = '',
  emptyText = 'উপলব্ধ নয়'
}) => {
  const [isRevealed, setIsRevealed] = useState(false);

  if (!value) {
    return <span className={`text-slate-400 dark:text-slate-500 font-mono text-xs ${className}`}>{emptyText}</span>;
  }

  const masked = maskIdentity(value, type);

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-xs font-semibold ${className}`}>
      <span className={isRevealed ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300 tracking-wider'}>
        {isRevealed ? value : masked}
      </span>
      {allowReveal && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsRevealed(!isRevealed);
          }}
          className="p-1 rounded text-slate-400 hover:text-emerald-700 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus-visible:outline-2 focus-visible:outline-emerald-600 cursor-pointer"
          title={isRevealed ? 'তথ্য গোপন করুন' : 'সম্পূর্ণ তথ্য প্রদর্শন করুন (অনুমোদিত)'}
          aria-label={isRevealed ? `${label || 'তথ্য'} গোপন করুন` : `${label || 'তথ্য'} দেখুন`}
        >
          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      )}
      {!isRevealed && (
        <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-0.5 select-none" title="ব্যক্তিগত তথ্য সুরক্ষিত">
          <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
        </span>
      )}
    </span>
  );
};
