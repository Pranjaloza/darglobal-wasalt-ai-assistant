import { LoaderCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { searchProperties } from '../services/api'
import type { DatasetStats, Property, PropertyFilters } from '../types'
import { compactSar, median } from '../format'
import ListingsTable from './ListingsTable'
import PriceDistribution from './PriceDistribution'
import { Card, CONTAINER, PageHeader, StatCard } from './ui'

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
    { label: hasFilters ? 'Matching listings' : 'All listings', value: isLoading ? '…' : String(properties.length) },
    { label: 'Lowest price', value: prices.length ? `${compactSar(Math.min(...prices))} SAR` : '—' },
    { label: 'Median price', value: prices.length ? `${compactSar(median(prices)!)} SAR` : '—' },
    { label: 'Highest price', value: prices.length ? `${compactSar(Math.max(...prices))} SAR` : '—' },
  ]

  const cityOptions = [
    { label: 'All cities', value: '' },
    ...(stats?.cities.map((c) => ({ label: `${c.name} (${c.count})`, value: c.name })) ?? []),
  ]

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-paper">
      <PageHeader title="Listings" subtitle="Wasalt listings collected for this project" onOpenMenu={onOpenMenu} />

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className={`${CONTAINER} space-y-5 py-6`}>
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="grid grid-cols-2 gap-3 lg:col-span-2">
              {figures.map((figure) => (
                <StatCard key={figure.label} label={figure.label} value={figure.value} />
              ))}
            </div>
            <Card title="Price bands">
              {properties.length > 0 ? (
                <PriceDistribution properties={properties} />
              ) : (
                <p className="px-4 py-6 text-sm text-faint">{isLoading ? 'Loading…' : 'No listings'}</p>
              )}
            </Card>
          </div>

          <Card
            title={isLoading ? 'Listings' : `${sorted.length} ${sorted.length === 1 ? 'listing' : 'listings'}`}
            action={
              hasFilters && (
                <button
                  onClick={() => {
                    setCity('')
                    setMaxPrice('')
                    setMinBedrooms('')
                  }}
                  className="text-xs font-medium text-accent hover:underline"
                >
                  Clear filters
                </button>
              )
            }
          >
            <div className="grid grid-cols-2 gap-3 border-b border-line px-4 py-3 md:grid-cols-4">
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

            {isLoading ? (
              <div className="flex items-center gap-2 px-4 py-10 text-sm text-muted">
                <LoaderCircle size={15} className="animate-spin" />
                Loading listings
              </div>
            ) : error ? (
              <div className="flex items-center justify-between px-4 py-4 text-sm text-danger">
                {error}
                <button onClick={runSearch} className="text-xs underline">
                  Try again
                </button>
              </div>
            ) : sorted.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted">
                No listings match these filters. Try a higher price or fewer bedrooms.
              </p>
            ) : (
              <ListingsTable properties={sorted} bordered={false} />
            )}
          </Card>

          <p className="text-xs text-faint">
            Listing details were collected from public Wasalt pages and may no longer be current. Follow a
            row&rsquo;s link to see the original listing.
          </p>
        </div>
      </main>
    </div>
  )
}

export default PropertyDiscovery
