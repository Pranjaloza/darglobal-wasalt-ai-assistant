import {
  ArrowUp,
  Building2,
  Check,
  Copy,
  ExternalLink,
  Globe2,
  LoaderCircle,
  Menu,
  RotateCcw,
  Search,
  Sparkles,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ApiStatus, ChatMessage } from '../types'
import Markdown from './Markdown'
import PropertyCard from './PropertyCard'

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
  onOpenMenu: () => void
}

const STATUS_BADGE: Record<ApiStatus, { wrap: string; dot: string; label: string }> = {
  checking: { wrap: 'border-amber-100 bg-amber-50 text-amber-700', dot: 'bg-amber-400', label: 'Connecting…' },
  online: { wrap: 'border-green-100 bg-green-50 text-green-700', dot: 'bg-green-500', label: 'Assistant ready' },
  offline: { wrap: 'border-red-100 bg-red-50 text-red-700', dot: 'bg-red-500', label: 'Backend offline' },
}

const SUGGESTIONS = [
  {
    icon: Building2,
    title: 'Explore properties',
    description: 'Find properties by location and budget',
    prompt: 'Show me properties in Madinah',
  },
  {
    icon: Search,
    title: 'Smart property search',
    description: 'Search by price and bedrooms',
    prompt: 'Find villas below 2 million SAR with at least 5 bedrooms',
  },
  {
    icon: Globe2,
    title: 'Discover DarGlobal',
    description: 'Explore projects and company information',
    prompt: 'Tell me about DarGlobal and its projects',
  },
]

const CARDS_PREVIEW = 4

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
    <button
      onClick={copy}
      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-400 transition hover:bg-gray-100 hover:text-[#172033]"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function AssistantMessage({ message }: { message: ChatMessage }) {
  const [showAllCards, setShowAllCards] = useState(false)
  const properties = message.properties ?? []
  const sources = message.sources ?? []
  const visibleCards = showAllCards ? properties : properties.slice(0, CARDS_PREVIEW)

  return (
    <div className="flex justify-start">
      <div className="w-full max-w-full md:max-w-[92%]">
        <div className="rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-5 py-4">
          <Markdown content={message.content} />

          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2">
            <span className="truncate text-[11px] text-gray-400">
              {message.model ? `Answered by ${message.model}` : ''}
            </span>
            <CopyButton text={message.content} />
          </div>
        </div>

        {properties.length > 0 && (
          <div className="mt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {visibleCards.map((property, index) => (
                <PropertyCard key={`${property.source_url}-${index}`} property={property} />
              ))}
            </div>

            {properties.length > CARDS_PREVIEW && (
              <button
                onClick={() => setShowAllCards((value) => !value)}
                className="mt-3 text-xs font-semibold text-[#A9874C] hover:underline"
              >
                {showAllCards ? 'Show fewer listings' : `Show all ${properties.length} listings`}
              </button>
            )}
          </div>
        )}

        {sources.length > 0 && properties.length === 0 && (
          <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Sources</p>
            <div className="space-y-1.5">
              {sources.map((source, index) => (
                <a
                  key={`${source.url}-${index}`}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-[#A9874C] hover:underline"
                >
                  <ExternalLink size={13} className="shrink-0" />
                  <span className="truncate">{source.title || source.company || 'View source'}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
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
  onOpenMenu,
}: ChatWindowProps) {
  const [question, setQuestion] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const badge = STATUS_BADGE[apiStatus]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, error])

  // Focus the input when switching to another / a new conversation
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
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex h-[76px] shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onOpenMenu}
            className="rounded-lg p-2 text-[#172033] hover:bg-gray-100 md:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-[#172033]">{title}</h2>
            <p className="text-xs text-gray-500">Your intelligent real estate companion</p>
          </div>
        </div>

        <div className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 ${badge.wrap}`}>
          <span className={`h-2 w-2 rounded-full ${badge.dot}`} />
          <span className="hidden text-xs font-medium sm:inline">{badge.label}</span>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-8 md:px-6">
        {messages.length === 0 ? (
          <div className="my-auto w-full max-w-3xl self-center">
            <div className="mb-10 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#172033] shadow-lg shadow-gray-300">
                <Sparkles size={30} className="text-[#C6A66B]" />
              </div>

              <p className="mb-3 text-xs font-semibold uppercase tracking-[3px] text-[#B08B4A]">
                ESTATE INTELLIGENCE
              </p>

              <h1 className="font-['Manrope'] text-3xl font-bold tracking-tight text-[#172033] md:text-4xl">
                Find your next
                <span className="block text-[#B08B4A]">great opportunity.</span>
              </h1>

              <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-gray-500">
                Discover properties, explore DarGlobal projects, and get intelligent real estate
                insights through natural conversation.
              </p>
            </div>

            <div className="mb-8 grid gap-3 md:grid-cols-3">
              {SUGGESTIONS.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.title}
                    onClick={() => handleSubmit(item.prompt)}
                    disabled={isLoading}
                    className="group rounded-2xl border border-gray-200 bg-white p-5 text-left transition hover:-translate-y-1 hover:border-[#C6A66B] hover:shadow-lg disabled:opacity-50"
                  >
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7F3EB] text-[#A9874C]">
                      <Icon size={19} />
                    </div>
                    <h3 className="mb-2 text-sm font-semibold text-[#172033]">{item.title}</h3>
                    <p className="text-xs leading-5 text-gray-500">{item.description}</p>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-3xl space-y-7">
            {messages.map((message) =>
              message.role === 'user' ? (
                <div key={message.id} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-[#172033] px-5 py-3.5 text-sm leading-7 text-white">
                    {message.content}
                  </div>
                </div>
              ) : (
                <AssistantMessage key={message.id} message={message} />
              )
            )}

            {isThinking && (
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-500">
                <LoaderCircle size={18} className="animate-spin text-[#A9874C]" />
                Searching the knowledge base and writing an answer…
              </div>
            )}

            {error && !isThinking && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-5 py-4">
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={onRetry}
                  className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-100"
                >
                  <RotateCcw size={13} />
                  Retry
                </button>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </main>

      <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-4 md:px-6 md:py-5">
        <div className="mx-auto max-w-3xl">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              handleSubmit()
            }}
            className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition focus-within:border-[#C6A66B] focus-within:shadow-md"
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
                  : 'Ask anything about properties, locations or DarGlobal...'
              }
              rows={2}
              maxLength={1000}
              disabled={isLoading}
              className="w-full resize-none border-0 bg-transparent px-3 py-2 text-sm text-[#172033] outline-none placeholder:text-gray-400"
            />

            <div className="flex items-center justify-between px-2">
              <span className="text-xs text-gray-400">
                <span className="hidden sm:inline">Enter to send · Shift+Enter for a new line</span>
              </span>

              <button
                type="submit"
                disabled={!question.trim() || isLoading}
                aria-label="Send message"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#172033] text-white transition hover:bg-[#B08B4A] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowUp size={19} />
              </button>
            </div>
          </form>

          <p className="mt-3 text-center text-xs text-gray-400">
            Answers are based on collected public DarGlobal and Wasalt data and may not reflect live availability.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ChatWindow
