import { Check, Copy, LoaderCircle, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { compactSar } from '../format'
import type { ApiStatus, ChatMessage, DatasetStats } from '../types'
import ListingsTable from './ListingsTable'
import Markdown from './Markdown'
import Overview from './Overview'
import QuestionBox from './QuestionBox'
import { CONTAINER, PageHeader } from './ui'

interface ChatWindowProps {
  title: string
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  onRetry: () => void
  /** Any request in flight (disables sending) */
  isLoading: boolean
  /** The request in flight belongs to this conversation */
  isThinking: boolean
  error: string
  apiStatus: ApiStatus
  stats: DatasetStats | null
  onOpenMenu: () => void
  onOpenListings: () => void
}

const STATUS_TEXT: Record<ApiStatus, { text: string; className: string }> = {
  checking: { text: 'Connecting…', className: 'text-warn' },
  online: { text: '', className: '' },
  offline: { text: 'Server offline', className: 'text-danger' },
}

const LISTINGS_PREVIEW = 5

/** "Jeddah · under 2M SAR · 5+ bedrooms" from the backend's applied filters */
function describeFilters(filters: Record<string, unknown> | null | undefined) {
  if (!filters) return []
  const parts: string[] = []
  if (typeof filters.city === 'string') parts.push(filters.city)
  if (typeof filters.max_price === 'number') parts.push(`under ${compactSar(filters.max_price)} SAR`)
  if (typeof filters.min_bedrooms === 'number') parts.push(`${filters.min_bedrooms}+ bedrooms`)
  if (typeof filters.exact_bedrooms === 'number') parts.push(`${filters.exact_bedrooms} bedrooms`)
  return parts
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked: nothing useful to do
    }
  }

  return (
    <button onClick={copy} className="inline-flex items-center gap-1 hover:text-ink">
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function Answer({ message }: { message: ChatMessage }) {
  const [showAll, setShowAll] = useState(false)
  const properties = message.properties ?? []
  const sources = message.sources ?? []
  const shown = showAll ? properties : properties.slice(0, LISTINGS_PREVIEW)
  const appliedFilters = describeFilters(message.filters)

  return (
    <article className="rounded-md border border-line bg-surface">
      <div className="px-4 py-4">
        <Markdown content={message.content} />
      </div>

      {properties.length > 0 && (
        <section className="border-t border-line">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="mr-1 text-xs font-semibold text-ink">
                Matching listings <span className="tabular font-normal text-muted">({properties.length})</span>
              </h3>
              {appliedFilters.map((part) => (
                <span key={part} className="rounded-sm bg-accent-soft px-1.5 py-0.5 text-[11px] text-accent-hover">
                  {part}
                </span>
              ))}
            </div>
            {properties.length > LISTINGS_PREVIEW && (
              <button onClick={() => setShowAll((value) => !value)} className="text-xs text-accent hover:underline">
                {showAll ? 'Show fewer' : `Show all ${properties.length}`}
              </button>
            )}
          </div>
          <ListingsTable properties={shown} compact bordered={false} />
        </section>
      )}

      {sources.length > 0 && properties.length === 0 && (
        <section className="border-t border-line px-4 py-3">
          <h3 className="mb-1.5 text-xs font-semibold text-ink">Sources</h3>
          <ol className="space-y-1 text-xs">
            {sources.map((source, index) => (
              <li key={`${source.url}-${index}`} className="flex gap-2">
                <span className="tabular w-4 shrink-0 text-faint">{index + 1}.</span>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 truncate text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-accent hover:decoration-accent"
                >
                  {source.title || source.url}
                </a>
                {source.company && <span className="shrink-0 text-faint">{source.company}</span>}
              </li>
            ))}
          </ol>
        </section>
      )}

      <footer className="flex items-center gap-3 border-t border-line px-4 py-2 text-xs text-faint">
        <CopyButton text={message.content} />
        {message.model && <span className="truncate">{message.model}</span>}
      </footer>
    </article>
  )
}

function ChatWindow({
  title,
  messages,
  onSendMessage,
  onRetry,
  isLoading,
  isThinking,
  error,
  apiStatus,
  stats,
  onOpenMenu,
  onOpenListings,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const status = STATUS_TEXT[apiStatus]
  const isEmpty = messages.length === 0

  useEffect(() => {
    if (!isEmpty) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking, error, isEmpty])

  const handleSubmit = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed || isLoading) return
    onSendMessage(trimmed)
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-paper">
      <PageHeader
        title={isEmpty ? 'Overview' : title}
        subtitle={isEmpty ? 'DarGlobal and Wasalt property data' : undefined}
        onOpenMenu={onOpenMenu}
        right={status.text && <span className={`shrink-0 text-xs ${status.className}`}>{status.text}</span>}
      />

      <main className="min-h-0 flex-1 overflow-y-auto">
        {isEmpty ? (
          <Overview stats={stats} onAsk={handleSubmit} onOpenListings={onOpenListings} disabled={isLoading} />
        ) : (
          <div className={`${CONTAINER} space-y-5 py-6`}>
            {messages.map((message) =>
              message.role === 'user' ? (
                <div key={message.id} className="flex justify-end">
                  <p className="max-w-[80%] whitespace-pre-wrap rounded-md bg-nav px-4 py-2.5 text-sm leading-6 text-nav-text">
                    {message.content}
                  </p>
                </div>
              ) : (
                <Answer key={message.id} message={message} />
              )
            )}

            {isThinking && (
              <p className="flex items-center gap-2 text-sm text-muted">
                <LoaderCircle size={15} className="animate-spin" />
                Searching the data and drafting an answer — free models can take up to a minute.
              </p>
            )}

            {error && !isThinking && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-danger/20 bg-danger-soft px-4 py-3">
                <p className="text-sm text-danger">{error}</p>
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-danger/30 bg-surface px-2.5 py-1 text-xs text-danger hover:bg-danger-soft"
                >
                  <RotateCcw size={12} />
                  Retry
                </button>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </main>

      {!isEmpty && (
        <div className="shrink-0 border-t border-line bg-surface py-3">
          <div className={CONTAINER}>
            <QuestionBox
              onSubmit={handleSubmit}
              disabled={isLoading}
              focusKey={title}
              placeholder={
                isLoading && !isThinking
                  ? 'Waiting for an answer in another conversation…'
                  : 'Ask a follow-up, e.g. “what about Jeddah?” or “only under 1.5M”'
              }
            />
            <p className="mt-1.5 text-xs text-faint">
              Based on public listing data collected for this project. Prices and availability may have changed.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatWindow
