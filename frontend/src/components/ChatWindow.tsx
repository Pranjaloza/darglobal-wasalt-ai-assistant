import {
  ArrowRight,
  Building2,
  Check,
  Copy,
  CornerDownLeft,
  Landmark,
  LoaderCircle,
  Menu,
  RotateCcw,
  Scale,
  SlidersHorizontal,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ApiStatus, ChatMessage, DatasetStats } from '../types'
import { compactSar } from '../format'
import ListingsTable from './ListingsTable'
import Markdown from './Markdown'
import Skyline from './Skyline'

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
}

const STATUS_TEXT: Record<ApiStatus, { text: string; className: string }> = {
  checking: { text: 'Connecting…', className: 'text-warn' },
  online: { text: '', className: '' },
  offline: { text: 'Server offline', className: 'text-danger' },
}

const EXAMPLES = [
  {
    tag: 'Wasalt · Search',
    icon: SlidersHorizontal,
    question: 'Find villas in Madinah below 2 million SAR with at least 5 bedrooms',
  },
  {
    tag: 'Wasalt · Search',
    icon: Building2,
    question: 'Show me properties in Jeddah with more than 5 bedrooms',
  },
  {
    tag: 'DarGlobal · Company',
    icon: Landmark,
    question: 'What does DarGlobal do, and which countries does it build in?',
  },
  {
    tag: 'Wasalt · Compare',
    icon: Scale,
    question: 'Compare the cheapest 6-bedroom listings in Madinah',
  },
]

const LISTINGS_PREVIEW = 5

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

  return (
    <article className="rounded-md border border-line border-t-2 border-t-gold bg-surface px-5 py-4 shadow-[0_1px_2px_rgb(8_28_42/0.04)] md:px-6 md:py-5">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-accent">Answer</p>
      <Markdown content={message.content} />

      {properties.length > 0 && (
        <section className="mt-5">
          <h3 className="mb-2 text-xs font-medium text-muted">
            Matching listings <span className="tabular">({properties.length})</span>
          </h3>
          <ListingsTable properties={shown} compact />
          {properties.length > LISTINGS_PREVIEW && (
            <button
              onClick={() => setShowAll((value) => !value)}
              className="mt-2 text-xs text-accent hover:underline"
            >
              {showAll ? 'Show fewer' : `Show all ${properties.length}`}
            </button>
          )}
        </section>
      )}

      {sources.length > 0 && properties.length === 0 && (
        <section className="mt-5 border-t border-line pt-3">
          <h3 className="mb-1.5 text-xs font-medium text-muted">Sources</h3>
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

      <footer className="mt-4 flex items-center gap-3 border-t border-line pt-3 text-xs text-faint">
        <CopyButton text={message.content} />
        {message.model && <span className="truncate">{message.model}</span>}
      </footer>
    </article>
  )
}

function EmptyState({
  stats,
  onPick,
  disabled,
}: {
  stats: DatasetStats | null
  onPick: (question: string) => void
  disabled: boolean
}) {
  const figures = stats
    ? [
        { value: String(stats.total_listings), label: 'Wasalt listings' },
        { value: String(stats.cities.length), label: stats.cities.map((c) => c.name).join(' · ') },
        {
          value: stats.price_range
            ? `${compactSar(stats.price_range.min)}–${compactSar(stats.price_range.max)}`
            : '—',
          label: 'Price range, SAR',
        },
        { value: String(stats.darglobal_pages), label: 'DarGlobal pages' },
      ]
    : []

  return (
    <div>
      {/* Navy hero band */}
      <section className="relative overflow-hidden bg-nav text-nav-text">
        <Skyline className="pointer-events-none absolute bottom-0 right-0 h-[70%] w-[45%] text-gold/15" />
        <div className="relative mx-auto max-w-4xl px-5 pb-10 pt-10 md:px-8 md:pb-14 md:pt-16">
          <p className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.2em] text-gold">
            <span className="h-px w-8 bg-gold" />
            Research desk
          </p>
          <h1 className="mt-4 max-w-2xl text-balance font-display text-4xl font-semibold leading-[1.1] text-white md:text-5xl">
            Ask about DarGlobal projects or Wasalt listings
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-nav-muted md:text-[15px]">
            Property questions are matched against listing prices, bedrooms and location. Company
            questions are answered from DarGlobal&rsquo;s own pages, and every answer links back to its
            sources.
          </p>

          {figures.length > 0 && (
            <dl className="mt-8 grid max-w-3xl grid-cols-2 gap-y-5 border-t border-nav-line pt-6 md:grid-cols-4">
              {figures.map((figure, index) => (
                <div
                  key={figure.label}
                  className={`pr-4 ${index % 2 === 1 ? 'border-l border-nav-line pl-5' : ''} ${
                    index === 2 ? 'md:border-l md:border-nav-line md:pl-5' : ''
                  }`}
                >
                  <dt className="sr-only">{figure.label}</dt>
                  <dd className="tabular font-display text-3xl font-semibold leading-none text-gold">
                    {figure.value}
                  </dd>
                  <dd className="mt-1.5 text-xs text-nav-muted">{figure.label}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      {/* Example questions */}
      <section className="mx-auto max-w-4xl px-5 py-8 md:px-8">
        <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          Start with a question
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {EXAMPLES.map(({ tag, icon: Icon, question }) => (
            <button
              key={question}
              onClick={() => onPick(question)}
              disabled={disabled}
              className="group flex flex-col rounded-md border border-line bg-surface p-4 text-left transition-colors hover:border-gold disabled:opacity-50"
            >
              <span className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-accent">
                <Icon size={14} />
                {tag}
              </span>
              <span className="mt-2 text-[15px] leading-snug text-ink">{question}</span>
              <span className="mt-3 inline-flex items-center gap-1 text-xs text-muted group-hover:text-accent">
                Ask this
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
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
}: ChatWindowProps) {
  const [question, setQuestion] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const status = STATUS_TEXT[apiStatus]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking, error])

  useEffect(() => {
    inputRef.current?.focus()
  }, [title])

  const handleSubmit = (value = question) => {
    const trimmed = value.trim()
    if (!trimmed || isLoading) return
    onSendMessage(trimmed)
    setQuestion('')
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-paper">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-4 md:px-6">
        <button
          onClick={onOpenMenu}
          className="-ml-1 rounded-sm p-1.5 text-ink-2 hover:bg-line md:hidden"
          aria-label="Open menu"
        >
          <Menu size={19} />
        </button>
        <h2 className="min-w-0 flex-1 truncate text-sm font-medium">{title}</h2>
        {status.text && <span className={`shrink-0 text-xs ${status.className}`}>{status.text}</span>}
      </header>

      <main className={`min-h-0 flex-1 overflow-y-auto ${messages.length === 0 ? '' : 'px-4 py-6 md:px-6'}`}>
        {messages.length === 0 ? (
          <EmptyState stats={stats} onPick={handleSubmit} disabled={isLoading} />
        ) : (
          <div className="mx-auto w-full max-w-3xl space-y-6">
            {messages.map((message) =>
              message.role === 'user' ? (
                <div key={message.id} className="flex justify-end">
                  <p className="max-w-[85%] whitespace-pre-wrap rounded-md bg-nav px-4 py-2.5 text-sm leading-6 text-white">
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

      <div className="shrink-0 border-t border-line bg-paper px-4 pb-4 pt-3 md:px-6">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            handleSubmit()
          }}
          className="mx-auto flex max-w-3xl items-end gap-2 rounded-md border border-line-strong bg-surface p-2 focus-within:border-accent"
        >
          <textarea
            ref={inputRef}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                handleSubmit()
              }
            }}
            placeholder={
              isLoading && !isThinking
                ? 'Waiting for an answer in another conversation…'
                : 'Ask about a property, budget, district or DarGlobal project'
            }
            rows={1}
            maxLength={1000}
            disabled={isLoading}
            className="max-h-40 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm leading-6 outline-none placeholder:text-faint focus-visible:outline-none [field-sizing:content]"
          />
          <button
            type="submit"
            disabled={!question.trim() || isLoading}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-sm bg-accent px-3 text-sm font-medium text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-line-strong"
          >
            Send
            <CornerDownLeft size={14} className="hidden opacity-70 sm:block" />
          </button>
        </form>
        <p className="mx-auto mt-2 max-w-3xl text-xs text-faint">
          Based on public listing data collected for this project. Prices and availability may have changed.
        </p>
      </div>
    </div>
  )
}

export default ChatWindow
