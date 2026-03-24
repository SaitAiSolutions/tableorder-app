import { cn } from '@/lib/utils/cn'
import { type InputHTMLAttributes, forwardRef } from 'react'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900',
        'placeholder:text-gray-400',
        'focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200',
        'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-70',
        className,
      )}
      {...props}
    />
  ),
)

Input.displayName = 'Input'

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

export function Label({ children, required, className, ...props }: LabelProps) {
  return (
    <label className={cn('block text-sm font-medium text-gray-700', className)} {...props}>
      {children}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  )
}

interface FieldProps {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
  htmlFor?: string
}

export function Field({ label, error, required, children, htmlFor }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={htmlFor} required={required}>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}