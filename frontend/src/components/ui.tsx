import { Menu } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * One content column for every page: the header, cards, tables and the
 * question box all share this left edge and width.
 */
export const CONTAINER = 'mx-auto w-full max-w-5xl px-4 md:px-8'

export function PageHeader({
  title,
  subtitle,
  onOpenMenu,
  right,
}: {
  title: string
  subtitle?: string
  onOpenMenu: () => void
  right?: ReactNode
}) {
  return (
    <header className="h-14 shrink-0 border-b border-line bg-surface">
      <div className={`${CONTAINER} flex h-full items-center gap-3`}>
        <button
          onClick={onOpenMenu}
          className="-ml-1.5 rounded-sm p-1.5 text-ink-2 hover:bg-panel md:hidden"
          aria-label="Open menu"
        >
          <Menu size={19} />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-ink">{title}</h2>
          {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  )
}

export function Card({
  title,
  action,
  children,
  className = '',
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-md border border-line bg-surface ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function StatCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-md border border-line bg-surface px-4 py-3.5">
      <p className="text-xs text-muted">{label}</p>
      <p className="tabular mt-1 text-2xl font-semibold leading-tight text-ink">{value}</p>
      {note && <p className="mt-0.5 truncate text-xs text-faint">{note}</p>}
    </div>
  )
}
