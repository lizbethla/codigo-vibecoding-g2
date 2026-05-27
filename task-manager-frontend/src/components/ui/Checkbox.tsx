import { type InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, checked, ...props }, ref) => {
    return (
      <label className={clsx('inline-flex items-center gap-2 cursor-pointer', className)}>
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          className={twMerge(
            clsx(
              'w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer',
              props.disabled && 'opacity-50 cursor-not-allowed'
            )
          )}
          {...props}
        />
        {label && <span className="text-sm text-gray-700">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';