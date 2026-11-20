import { LoaderCircle, Menu } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { searchProperties } from '../services/api'
import type { DatasetStats, Property, PropertyFilters } from '../types'
import { compactSar, median } from '../format'
import ListingsTable from './ListingsTable'
import PriceDistribution from './PriceDistribution'
import Skyline from './Skyline'

interface PropertyDiscoveryProps {
  stats: DatasetStats | null
  onOpenMenu: () => void
}

type SortOrder = 'price-asc' | 'price-desc' | 'bedrooms-desc' | 'area-desc'

const BUDGETS = [
  { label: 'Any price', value: '' },
  { label: 'Under 1,000,000', value: '1000000' },
  { label: 'Under 1,500,000', value: '1500000' },
  { label: 'Under 2,000,000', value: '2000000' },
  { label: 'Under 3,000,000', value: '3000000' },
  { label: 'Under 5,000,000', value: '5000000' },
]

const BEDROOMS = [
  { label: 'Any', value: '' },
  { label: '4+', value: '4' },
  { label: '5+', value: '5' },
  { label: '6+', value: '6' },
  { label: '7+', value: '7' },
  { label: '8+', value: '8' },
]

const SORTS: { label: string; value: SortOrder }[] = [
  { label: 'Price, low to high', value: 'price-asc' },
  { label: 'Price, high to low', value: 'price-desc' },
  { label: 'Most bedrooms', value: 'bedrooms-desc' },
  { label: 'Largest area', value: 'area-desc' },
]

function sortProperties(properties: Property[], order: SortOrder) {
  const value = (n: number | null | undefined, fallback: number) => n ?? fallback
  return [...properties].sort((a, b) => {
    switch (order) {
      case 'price-desc':
        return value(b.price, -Infinity) - value(a.price, -Infinity)
      case 'bedrooms-desc':
        return value(b.bedrooms, -Infinity) - value(a.bedrooms, -Infinity)
      case 'area-desc':
        return value(b.area, -Infinity) - value(a.area, -Infinity)
      default:
        return value(a.price, Infinity) - value(b.price, Infinity)
    }
  })
}

function Field({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { label: string; value: string }[]
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-xs text-muted">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="tabular h-9 rounded-sm border border-line-strong bg-surface px-2 text-sm text-ink outline-none focus:border-accent"
      >
        {options.map((option) => (
          <option key={option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function PropertyDiscovery({ stats, onOpenMenu }: PropertyDiscoveryProps) {
  const [city, setCity] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minBedrooms, setMinBedrooms] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('price-asc')

  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const runSearch = useCallback(async () => {
    const filters: PropertyFilters = {
      city: city || undefined,
      max_price: maxPrice ? Number(maxPrice) : undefined,
      min_bedrooms: minBedrooms ? Number(minBedrooms) : undefined,
      limit: 50,
    }

    setIsLoading(true)
    setError('')
    try {
      const response = await searchProperties(filters)
      setProperties(response.properties)
    } catch {
      setError('Could not load listings.')
      setProperties([])
    } finally {
      setIsLoading(false)
    }
  }, [city, maxPrice, minBedrooms])

  useEffect(() => {
    runSearch()
  }, [runSearch])

  const hasFilters = Boolean(city || maxPrice || minBedrooms)
  const sorted = sortProperties(properties, sortOrder)

  const prices = properties.map((p) => p.price).filter((p): p is number => p != null)
  const figures = [
    { label: hasFilters ? 'Matching listings' : 'Listings', value: isLoading ? '…' : String(properties.length) },
    { label: 'Lowest, SAR', value: prices.length ? compactSar(Math.min(...prices)) : '—' },
    { label: 'Median, SAR', value: prices.length ? compactSar(median(prices)!) : '—' },
    { label: 'Highest, SAR', value: prices.length ? compactSar(Math.max(...prices)) : '—' },
  ]

  const cityOptions = [
    { label: 'All cities', value: '' },
    ...(stats?.cities.map((c) => ({ label: `${c.name} (${c.count})`, value: c.name })) ?? []),
  ]

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
        <h2 className="text-sm font-medium">Listings</h2>
        <span className="text-xs text-faint">Wasalt, collected for this project</span>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        {/* Navy summary band: figures follow the current filters */}
        <section className="relative overflow-hidden bg-nav text-nav-text">
          <Skyline className="pointer-events-none absolute bottom-0 left-0 h-[60%] w-[30%] -scale-x-100 text-gold/10" />
          <div className="relative mx-auto grid max-w-5xl gap-8 px-4 pb-16 pt-8 md:grid-cols-[1fr_300px] md:px-6">
            <div>
              <p className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.2em] text-gold">
                <span className="h-px w-8 bg-gold" />
                Wasalt listings
              </p>
              <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-white md:text-4xl">
                {city ? `Villas and homes in ${city}` : 'Villas and homes in Saudi Arabia'}
              </h1>
              <dl className="mt-6 grid grid-cols-2 gap-y-4 sm:grid-cols-4">
                {figures.map((figure, index) => (
                  <div
                    key={figure.label}
                    className={`pr-4 ${index % 2 === 1 ? 'border-l border-nav-line pl-4' : ''} ${
                      index === 2 ? 'sm:border-l sm:border-nav-line sm:pl-4' : ''
                    }`}
                  >
                    <dt className="sr-only">{figure.label}</dt>
                    <dd className="tabular font-display text-3xl font-semibold leading-none text-gold">{figure.value}</dd>
                    <dd className="mt-1.5 text-xs text-nav-muted">{figure.label}</dd>
                  </div>
                ))}
              </dl>
            </div>
            {!isLoading && properties.length > 0 && <PriceDistribution properties={properties} />}
          </div>
        </section>

        <div className="mx-auto -mt-10 max-w-5xl px-4 pb-6 md:px-6">
          <div className="relative grid grid-cols-2 gap-3 rounded-md border border-line bg-surface p-4 shadow-[0_8px_24px_rgb(8_28_42/0.08)] md:grid-cols-4">
            <Field label="City" value={city} onChange={setCity} options={cityOptions} />
            <Field label="Max price (SAR)" value={maxPrice} onChange={setMaxPrice} options={BUDGETS} />
            <Field label="Bedrooms" value={minBedrooms} onChange={setMinBedrooms} options={BEDROOMS} />
            <Field
              label="Sort"
              value={sortOrder}
              onChange={(value) => setSortOrder(value as SortOrder)}
              options={SORTS}
            />
          </div>

          <div className="mb-2 mt-5 flex h-6 items-center justify-between text-xs text-muted">
            <span className="tabular">
              {isLoading ? 'Loading…' : `${sorted.length} ${sorted.length === 1 ? 'listing' : 'listings'}`}
            </span>
            {hasFilters && (
              <button
                onClick={() => {
                  setCity('')
                  setMaxPrice('')
                  setMinBedrooms('')
                }}
                className="text-accent hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-4 py-10 text-sm text-muted">
              <LoaderCircle size={15} className="animate-spin" />
              Loading listings
            </div>
          ) : error ? (
            <div className="flex items-center justify-between rounded-md border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
              {error}
              <button onClick={runSearch} className="text-xs underline">
                Try again
              </button>
            </div>
          ) : sorted.length === 0 ? (
            <div className="rounded-md border border-line bg-surface px-4 py-10 text-center text-sm text-muted">
              No listings match these filters. Try a higher price or fewer bedrooms.
            </div>
          ) : (
            <ListingsTable properties={sorted} />
          )}

          <p className="mt-4 text-xs text-faint">
            Listing details were collected from public Wasalt pages and may no longer be current. Follow a row's
            link to see the original listing.
          </p>
        </div>
      </main>
    </div>
  )
}

export default PropertyDiscovery
