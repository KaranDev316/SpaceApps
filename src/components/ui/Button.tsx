import type { ButtonHTMLAttributes } from 'react'

export function Button({ className = '', type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={`inline-flex min-w-0 max-w-full min-h-11 items-center justify-center rounded-lg border border-line bg-raised px-4 py-2 break-words text-sm font-semibold text-ink hover:border-accent hover:text-accent disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink ${className}`} {...props} />
}
