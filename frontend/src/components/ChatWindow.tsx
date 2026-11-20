
import {
  ArrowUp,
  Building2,
  Globe2,
  Search,
  Sparkles,
  ExternalLink,
  MapPin,
  BedDouble,
  Maximize2,
  LoaderCircle,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ChatMessage, Property } from '../types'

interface ChatWindowProps {
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  isLoading: boolean
  error: string
}

function PropertyCard({ property }: { property: Property }) {
  const formattedPrice =
    property.price != null
      ? new Intl.NumberFormat('en-US').format(property.price)
      : 'Price not listed'

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F7F3EB] text-[#A9874C]">
          <Building2 size={20} />
        </div>

        <span className="rounded-full bg-[#F7F3EB] px-3 py-1 text-xs font-semibold text-[#96743C]">
          {property.currency || 'SAR'}
        </span>
      </div>

      <h3 className="font-semibold text-[#172033]">
        {property.title || 'Property listing'}
      </h3>

      <p className="mt-2 text-lg font-bold text-[#A9874C]">
        {property.price != null
          ? `${formattedPrice} ${property.currency || 'SAR'}`
          : formattedPrice}
      </p>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
        {property.bedrooms != null && (
          <span className="flex items-center gap-1">
            <BedDouble size={15} />
            {property.bedrooms} bedrooms
          </span>
        )}

        {property.area != null && (
          <span className="flex items-center gap-1">
            <Maximize2 size={14} />
            {property.area.toLocaleString()} {property.area_unit || 'area'}
          </span>
        )}

        {(property.locality || property.city) && (
          <span className="flex items-center gap-1">
            <MapPin size={14} />
            {[property.locality, property.city].filter(Boolean).join(', ')}
          </span>
        )}
      </div>

      {property.source_url && (
        <a
          href={property.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#A9874C] hover:underline"
        >
          View original listing <ExternalLink size={13} />
        </a>
      )}
    </div>
  )
}

function ChatWindow({
  messages,
  onSendMessage,
  isLoading,
  error,
}: ChatWindowProps) {
  const [question, setQuestion] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const suggestions = [
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
      prompt: 'Find villas below 2 million SAR with 5 bedrooms',
    },
    {
      icon: Globe2,
      title: 'Discover DarGlobal',
      description: 'Explore projects and company information',
      prompt: 'Tell me about DarGlobal and its projects',
    },
  ]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSubmit = (value = question) => {
    const trimmed = value.trim()

    if (!trimmed || isLoading) return

    onSendMessage(trimmed)
    setQuestion('')
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-gray-200 bg-white px-8">
        <div>
          <h2 className="font-semibold text-[#172033]">AI Assistant</h2>
          <p className="text-xs text-gray-500">
            Your intelligent real estate companion
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-green-100 bg-green-50 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-xs font-medium text-green-700">
            Assistant ready
          </span>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-8">
        {messages.length === 0 ? (
          <div className="my-auto w-full max-w-3xl self-center">
            <div className="mb-10 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#172033] shadow-lg shadow-gray-300">
                <Sparkles size={30} className="text-[#C6A66B]" />
              </div>

              <p className="mb-3 text-xs font-semibold uppercase tracking-[3px] text-[#B08B4A]">
                ESTATE INTELLIGENCE
              </p>

              <h1 className="font-['Manrope'] text-4xl font-bold tracking-tight text-[#172033]">
                Find your next
                <span className="block text-[#B08B4A]">
                  great opportunity.
                </span>
              </h1>

              <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-gray-500">
                Discover properties, explore DarGlobal projects, and get
                intelligent real estate insights through natural conversation.
              </p>
            </div>

            <div className="mb-8 grid gap-3 md:grid-cols-3">
              {suggestions.map((item) => {
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

                    <h3 className="mb-2 text-sm font-semibold text-[#172033]">
                      {item.title}
                    </h3>

                    <p className="text-xs leading-5 text-gray-500">
                      {item.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-3xl space-y-7">
            {messages.map((message) => (
              <div key={message.id}>
                <div
                  className={`flex ${
                    message.role === 'user'
                      ? 'justify-end'
                      : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-5 py-4 text-sm leading-7 ${
                      message.role === 'user'
                        ? 'rounded-br-sm bg-[#172033] text-white'
                        : 'rounded-bl-sm border border-gray-200 bg-white text-[#172033]'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>

                {message.role === 'assistant' &&
                  message.properties &&
                  message.properties.length > 0 && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {message.properties.map((property, index) => (
                        <PropertyCard
                          key={`${property.source_url}-${index}`}
                          property={property}
                        />
                      ))}
                    </div>
                  )}

                {message.role === 'assistant' &&
                  message.sources &&
                  message.sources.length > 0 && (
                    <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Sources
                      </p>

                      <div className="space-y-2">
                        {message.sources.map((source, index) => (
                          <a
                            key={`${source.url}-${index}`}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-[#A9874C] hover:underline"
                          >
                            <ExternalLink size={13} />
                            {source.title || source.company || 'View source'}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-500">
                <LoaderCircle size={18} className="animate-spin text-[#A9874C]" />
                Analyzing your request...
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </main>

      <div className="shrink-0 border-t border-gray-200 bg-white px-6 py-5">
        <div className="mx-auto max-w-3xl">
          {error && (
            <p className="mb-3 text-sm text-red-600">{error}</p>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault()
              handleSubmit()
            }}
            className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition focus-within:border-[#C6A66B] focus-within:shadow-md"
          >
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  handleSubmit()
                }
              }}
              placeholder="Ask anything about properties, locations or DarGlobal..."
              rows={2}
              disabled={isLoading}
              className="w-full resize-none border-0 bg-transparent px-3 py-2 text-sm text-[#172033] outline-none placeholder:text-gray-400"
            />

            <div className="flex items-center justify-between px-2">
              <span className="text-xs text-gray-400">
                Powered by DarGlobal & Wasalt knowledge
              </span>

              <button
                type="submit"
                disabled={!question.trim() || isLoading}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#172033] text-white transition hover:bg-[#B08B4A] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowUp size={19} />
              </button>
            </div>
          </form>

          <p className="mt-3 text-center text-xs text-gray-400">
            Property information is based on collected public listings and may change.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ChatWindow
