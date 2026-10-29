import type { ComponentPropsWithoutRef } from 'react'

export function Panel({ className = '', ...props }: ComponentPropsWithoutRef<'section'>) {
  return <section className={`min-w-0 w-full max-w-full rounded-xl border border-line bg-panel p-4 sm:p-6 ${className}`} {...props} />
}
