import type { InputHTMLAttributes } from 'react'
import clsx from '../../utils/clsx'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  containerClassName?: string
}

export default function TextField({ label, id, className, containerClassName, ...rest }: TextFieldProps) {
  return (
    <div className={clsx('space-y-2', containerClassName)}>
      {label && (
        <label className="font-label-md text-label-md text-on-surface-variant ml-1" htmlFor={id}>
          {label}
        </label>
      )}
      <input
        id={id}
        className={clsx(
          'w-full h-14 bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface font-body-md focus:ring-2 focus:ring-secondary/50 focus:border-secondary outline-none transition-all',
          className,
        )}
        {...rest}
      />
    </div>
  )
}
