import { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helperText?: string;
  showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { label, error, helperText, showCount = false, maxLength, value, id, className = '', ...props },
    ref
  ) => {
    const textareaId = id || label.toLowerCase().replace(/\s+/g, '-');
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor={textareaId} className="block text-sm font-semibold text-ink font-body">
            {label}
          </label>
          {showCount && maxLength && (
            <span className="text-xs text-gray font-mono">
              {currentLength} / {maxLength}
            </span>
          )}
        </div>
        <textarea
          ref={ref}
          id={textareaId}
          value={value}
          maxLength={maxLength}
          rows={props.rows || 3}
          className={`w-full rounded-xl border bg-white px-3.5 py-3 text-base text-ink placeholder:text-gray/50 transition-all focus:border-teal focus:ring-1 focus:ring-teal resize-y ${
            error ? 'border-clay' : 'border-border'
          } ${className}`}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            [error && errorId, helperText && helperId].filter(Boolean).join(' ') || undefined
          }
          {...props}
        />
        {helperText && !error && (
          <p id={helperId} className="text-xs text-gray">
            {helperText}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-xs font-medium text-clay" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
