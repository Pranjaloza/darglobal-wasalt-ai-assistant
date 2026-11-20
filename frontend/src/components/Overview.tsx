import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { compactSar, median } from '../format'
import { searchProperties } from '../services/api'
import type { DatasetStats, Property } from '../types'
import ListingsTable from './ListingsTable'
import QuestionBox from './QuestionBox'
import { Card, CONTAINER, StatCard } from './ui'

const EXAMPLES = [
  { topic: 'Search', question: 'Find villas in Madinah below 2 million SAR with at least 5 bedrooms' },
  { topic: 'Search', question: 'Show me properties in Jeddah with more than 5 bedrooms' },
  { topic: 'Compare', question: 'Compare the cheapest 6-bedroom listings in Madinah' },
  { topic: 'DarGlobal', question: 'What does DarGlobal do, and which countries does it build in?' },
]

interface OverviewProps {
  stats: DatasetStats | null
  onAsk: (question: string) => void
  onOpenListings: () => void
  disabled: boolean
}

/** Home screen: dataset figures, example questions and the cheapest listings. */
function Overview({ stats, onAsk, onOpenListings, disabled }: OverviewProps) {
  const [listings, setListings] = useState<Property[]>([])

  useEffect(() => {
    searchProperties({ limit: 50 })
      .then((response) => setListings(response.properties))
      .catch(() => setListings([]))
  }, [])

  const prices = listings.map((p) => p.price).filter((p): p is number => p != null)
  const medianPrice = median(prices)

  const byCity = (stats?.cities ?? []).map((city) => {
    const cityPrices = listings
      .filter((p) => p.city === city.name && p.price != null)
      .map((p) => p.price as number)
    return { ...city, median: median(cityPrices) }
  })
  const maxCount = Math.max(1, ...byCity.map((c) => c.count))

  const cheapest = [...listings]
    .filter((p) => p.price != null)
    .sort((a, b) => (a.price as number) - (b.price as number))
    .slice(0, 5)

  return (
    <div>
      {/* Welcome hero: what this is, and the question box front and centre */}
      <section className="bg-nav text-nav-text">
        <div className={`${CONTAINER} py-8 md:py-10`}>
          <h1 className="text-2xl font-semibold text-white md:text-[28px]">
            Ask about DarGlobal projects or Wasalt listings
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-nav-muted">
            Search {stats ? stats.total_listings : ''} collected Wasalt listings by city, budget and bedrooms,
            or ask about DarGlobal&rsquo;s company and projects. Answers use only this data and link to their
            sources. Follow-up questions such as &ldquo;what about Jeddah?&rdquo; build on the previous one.
          </p>
          <div className="mt-5 max-w-3xl">
            <QuestionBox
              size="large"
              onSubmit={onAsk}
              disabled={disabled}
              placeholder="e.g. 5-bedroom villas in Madinah under 1.5 million SAR"
            />
          </div>
        </div>
      </section>

      <div className={`${CONTAINER} space-y-5 py-6`}>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Wasalt listings"
          value={stats ? String(stats.total_listings) : '—'}
          note={stats?.cities.map((c) => c.name).join(', ')}
        />
        <StatCard
          label="Median price"
          value={medianPrice ? `${compactSar(medianPrice)} SAR` : '—'}
          note={
            stats?.price_range
              ? `${compactSar(stats.price_range.min)} – ${compactSar(stats.price_range.max)}`
              : undefined
          }
        />
        <StatCard
          label="Bedrooms"
          value={stats?.bedroom_range ? `${stats.bedroom_range.min}–${stats.bedroom_range.max}` : '—'}
          note="Range across listings"
        />
        <StatCard
          label="DarGlobal pages"
          value={stats ? String(stats.darglobal_pages) : '—'}
          note="Company and projects"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Try asking" className="lg:col-span-2">
          <ul className="divide-y divide-line">
            {EXAMPLES.map(({ topic, question }) => (
              <li key={question}>
                <button
                  onClick={() => onAsk(question)}
                  disabled={disabled}
                  className="group grid w-full grid-cols-[1fr_16px] items-center gap-3 px-4 py-3 text-left hover:bg-paper disabled:opacity-50 sm:grid-cols-[76px_1fr_16px]"
                >
                  <span className="hidden text-xs font-medium text-accent sm:block">{topic}</span>
                  <span className="text-sm text-ink">
                    <span className="mb-0.5 block text-xs font-medium text-accent sm:hidden">{topic}</span>
                    {question}
                  </span>
                  <ArrowRight size={15} className="text-faint group-hover:text-accent" />
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Listings by city">
          <ul className="space-y-4 px-4 py-4">
            {byCity.map((city) => (
              <li key={city.name}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium text-ink">{city.name}</span>
                  <span className="tabular text-muted">{city.count}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-panel">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(city.count / maxCount) * 100}%` }} />
                </div>
                {city.median && (
                  <p className="tabular mt-1 text-xs text-faint">Median {compactSar(city.median)} SAR</p>
                )}
              </li>
            ))}
            {byCity.length === 0 && <li className="text-sm text-faint">Loading…</li>}
          </ul>
        </Card>
      </div>

      <Card
        title="Lowest-priced listings"
        action={
          <button onClick={onOpenListings} className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
            View all listings
            <ArrowRight size={13} />
          </button>
        }
      >
        {cheapest.length > 0 ? (
          <ListingsTable properties={cheapest} bordered={false} />
        ) : (
          <p className="px-4 py-6 text-sm text-faint">Loading listings…</p>
        )}
      </Card>
      </div>
    </div>
  )
}

export default Overview
