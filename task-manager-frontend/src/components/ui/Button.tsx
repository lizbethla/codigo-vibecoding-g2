import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={twMerge(
          clsx(
            'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
            {
              'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500':
                variant === 'primary',
              'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500':
                variant === 'secondary',
              'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500':
                variant === 'danger',
              'text-gray-600 hover:bg-gray-100 focus:ring-gray-500':
                variant === 'ghost',
            },
            {
              'px-3 py-1.5 text-sm': size === 'sm',
              'px-4 py-2 text-sm': size === 'md',
              'px-6 py-3 text-base': size === 'lg',
            },
            className
          )
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';