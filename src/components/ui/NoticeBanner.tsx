import React from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NoticeBannerProps {
  message: string;
  variant?: 'gold' | 'clay' | 'teal';
  linkText?: string;
  linkTo?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function NoticeBanner({
  message,
  variant = 'gold',
  linkText,
  linkTo,
  icon,
  className = '',
}: NoticeBannerProps) {
  const styles = {
    gold: 'bg-gold/15 border-gold/40 text-amber-950',
    clay: 'bg-clay/10 border-clay/30 text-clay',
    teal: 'bg-teal/15 border-teal/40 text-teal-pressed',
  };

  const defaultIcons = {
    gold: <ShieldAlert className="w-5 h-5 text-gold shrink-0" />,
    clay: <AlertCircle className="w-5 h-5 text-clay shrink-0" />,
    teal: <AlertCircle className="w-5 h-5 text-teal shrink-0" />,
  };

  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm font-medium shadow-xs ${styles[variant]} ${className}`}
      role="alert"
    >
      <div className="flex items-center gap-3">
        {icon || defaultIcons[variant]}
        <span>{message}</span>
      </div>

      {linkText && linkTo && (
        <Link
          to={linkTo}
          className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-xl bg-white border border-current font-bold text-xs hover:bg-cream transition-all shrink-0 shadow-2xs"
        >
          {linkText}
        </Link>
      )}
    </div>
  );
}
