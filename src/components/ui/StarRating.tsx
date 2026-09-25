import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (val: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
  className = '',
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const starSizes = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7 sm:w-8 sm:h-8',
    lg: 'w-9 h-9 sm:w-10 sm:h-10',
  };

  const displayVal = hoverValue !== null ? hoverValue : value;

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${className}`}
      onMouseLeave={() => !readonly && setHoverValue(null)}
      role="radiogroup"
      aria-label="Rating out of 5 stars"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= displayVal;

        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHoverValue(star)}
            className={`transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal rounded-lg p-0.5 ${
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-115 active:scale-95'
            }`}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            aria-checked={value === star}
            role={readonly ? undefined : 'radio'}
          >
            <Star
              className={`${starSizes[size]} transition-colors duration-150 ${
                isFilled
                  ? 'text-gold fill-gold drop-shadow-2xs'
                  : 'text-border hover:text-gold/50'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
