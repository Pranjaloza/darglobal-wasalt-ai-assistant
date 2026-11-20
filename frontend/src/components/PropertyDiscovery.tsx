import { LoaderCircle, Menu } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { searchProperties } from '../services/api'
import type { DatasetStats, Property, PropertyFilters } from '../types'
import ListingsTable from './ListingsTable'

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

  const cityOptions = [
    { label: 'All cities', value: '' },
    ...(stats?.cities.map((c) => ({ label: `${c.name} (${c.count})`, value: c.name })) ?? []),
  ]

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-paper">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-4 md:px-6">
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

      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
