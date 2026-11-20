import { ArrowRight } from 'lucide-react'
import type { DatasetStats } from '../types'
import QuestionBox from './QuestionBox'
import { CHAT_CONTAINER } from './ui'

const SUGGESTIONS = [
  { topic: 'Search', question: 'Find villas in Madinah below 2 million SAR with at least 5 bedrooms' },
  { topic: 'Search', question: 'Show me properties in Jeddah with more than 5 bedrooms' },
  { topic: 'Compare', question: 'Compare the cheapest 6-bedroom listings in Madinah' },
  { topic: 'DarGlobal', question: 'What does DarGlobal do, and which countries does it build in?' },
]

interface WelcomeProps {
  stats: DatasetStats | null
  onAsk: (question: string) => void
  disabled: boolean
}

/** Chat-first welcome screen: heading, question box and suggested questions. */
function Welcome({ stats, onAsk, disabled }: WelcomeProps) {
  return (
    <div className="pb-12 pt-10 md:pt-[12vh]">
      <div className={CHAT_CONTAINER}>
        <h1 className="text-2xl font-semibold text-ink md:text-[28px]">
          Ask about DarGlobal projects or Wasalt listings
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-6 text-muted">
          Search Wasalt listings by city, budget and bedrooms, or ask about DarGlobal&rsquo;s projects.
          Follow-ups like &ldquo;what about Jeddah?&rdquo; build on your last question.
        </p>

        <div className="mt-7">
          <QuestionBox
            size="large"
            onSubmit={onAsk}
            disabled={disabled}
            placeholder="e.g. 5-bedroom villas in Madinah under 1.5 million SAR"
          />
        </div>

        <p className="mb-2.5 mt-9 text-xs font-medium text-muted">Suggested questions</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {SUGGESTIONS.map(({ topic, question }) => (
            <button
              key={question}
              onClick={() => onAsk(question)}
              disabled={disabled}
              className="group flex items-start justify-between gap-3 rounded-md border border-line bg-surface px-4 py-3.5 text-left hover:border-accent disabled:opacity-50"
            >
              <span>
                <span className="block text-xs font-medium text-accent">{topic}</span>
                <span className="mt-0.5 block text-sm leading-snug text-ink">{question}</span>
              </span>
              <ArrowRight size={15} className="mt-1 shrink-0 text-faint group-hover:text-accent" />
            </button>
          ))}
        </div>

        <p className="tabular mt-8 border-t border-line pt-4 text-xs text-faint">
          {stats
            ? `Data: ${stats.total_listings} Wasalt listings · ${stats.cities.map((c) => c.name).join(', ')} · ${stats.darglobal_pages} DarGlobal pages. Prices and availability may have changed.`
            : 'Data: collected Wasalt listings and DarGlobal pages. Prices and availability may have changed.'}
        </p>
      </div>
    </div>
  )
}

export default Welcome
