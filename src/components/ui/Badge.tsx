import type { ReactNode } from 'react'
import type { VisibilityStatus } from '../../types/mission'

const tones = {
  visible: 'border-visible/30 bg-visible/10 text-visible',
  blocked: 'border-blocked/30 bg-blocked/10 text-blocked',
  unknown: 'border-unknown/30 bg-unknown/10 text-unknown',
  sample: 'border-accent/30 bg-accent/10 text-accent',
  neutral: 'border-line bg-raised text-muted',
}

export function Badge({ tone = 'neutral', children }: { tone?: VisibilityStatus | 'sample' | 'neutral'; children: ReactNode }) {
  return <span className={`inline-flex min-w-0 max-w-full flex-wrap items-center break-words rounded-md border px-2.5 py-1 font-mono text-xs font-medium uppercase tracking-wide ${tones[tone]}`}>{children}</span>
}
