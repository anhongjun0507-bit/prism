import * as React from 'react';

import {cn} from '@/lib/utils';

interface TextareaProps extends React.ComponentProps<'textarea'> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({className, error, ...props}, ref) => {
    return (
      <textarea
        aria-invalid={error || undefined}
        className={cn(
          'flex min-h-[80px] w-full rounded-input border border-border-default bg-background px-3 py-2 text-base ring-offset-background',
          'placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          'outline-none transition-colors duration-micro ease-brand',
          'focus-visible:border-border-strong focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          error && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/40',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export {Textarea};
