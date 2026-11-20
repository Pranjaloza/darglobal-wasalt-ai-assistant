import { LoaderCircle, Menu, RotateCcw, Search, SearchX } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { searchProperties } from '../services/api'
import type { DatasetStats, Property, PropertyFilters } from '../types'
import PropertyCard from './PropertyCard'

interface PropertyDiscoveryProps {
  stats: DatasetStats | null
  onOpenMenu: () => void
}

type SortOrder = 'price-asc' | 'price-desc' | 'bedrooms-desc' | 'area-desc'

const BUDGETS = [
  { label: 'Any budget', value: '' },
  { label: 'Under 1M SAR', value: '1000000' },
  { label: 'Under 1.5M SAR', value: '1500000' },
  { label: 'Under 2M SAR', value: '2000000' },
  { label: 'Under 3M SAR', value: '3000000' },
  { label: 'Under 5M SAR', value: '5000000' },
]

const BEDROOMS = [
  { label: 'Any bedrooms', value: '' },
  { label: '4+ bedrooms', value: '4' },
  { label: '5+ bedrooms', value: '5' },
  { label: '6+ bedrooms', value: '6' },
  { label: '7+ bedrooms', value: '7' },
  { label: '8+ bedrooms', value: '8' },
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

const selectClass =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#172033] outline-none transition focus:border-[#C6A66B]'

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
      setError('Could not load listings. Please try again.')
      setProperties([])
    } finally {
      setIsLoading(false)
    }
  }, [city, maxPrice, minBedrooms])

  // Search again whenever a filter changes
  useEffect(() => {
    runSearch()
  }, [runSearch])

  const resetFilters = () => {
    setCity('')
    setMaxPrice('')
    setMinBedrooms('')
    setSortOrder('price-asc')
  }

  const hasFilters = Boolean(city || maxPrice || minBedrooms)
  const sorted = sortProperties(properties, sortOrder)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-[76px] shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 md:px-8">
        <button
          onClick={onOpenMenu}
          className="rounded-lg p-2 text-[#172033] hover:bg-gray-100 md:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <h2 className="font-semibold text-[#172033]">Property discovery</h2>
          <p className="text-xs text-gray-500">
            Browse and filter {stats ? `${stats.total_listings} ` : ''}collected Wasalt listings
          </p>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="mx-auto max-w-5xl">
          {/* Filters */}
          <div className="mb-6 grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-semibold text-gray-500">
              City
              <select value={city} onChange={(e) => setCity(e.target.value)} className={`mt-1.5 ${selectClass}`}>
                <option value="">All cities</option>
                {stats?.cities.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.count})
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-gray-500">
              Budget
              <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className={`mt-1.5 ${selectClass}`}>
                {BUDGETS.map((b) => (
                  <option key={b.label} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-gray-500">
              Bedrooms
              <select value={minBedrooms} onChange={(e) => setMinBedrooms(e.target.value)} className={`mt-1.5 ${selectClass}`}>
                {BEDROOMS.map((b) => (
                  <option key={b.label} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-gray-500">
              Sort by
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className={`mt-1.5 ${selectClass}`}
              >
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="bedrooms-desc">Most bedrooms</option>
                <option value="area-desc">Largest area</option>
              </select>
            </label>
          </div>

          {/* Result summary */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {isLoading ? (
                'Searching…'
              ) : (
                <>
                  <span className="font-semibold text-[#172033]">{sorted.length}</span>{' '}
                  {sorted.length === 1 ? 'listing' : 'listings'} found
                </>
              )}
            </p>

            {hasFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#A9874C] hover:underline"
              >
                <RotateCcw size={13} />
                Reset filters
              </button>
            )}
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 py-20 text-sm text-gray-500">
              <LoaderCircle size={20} className="animate-spin text-[#A9874C]" />
              Loading listings…
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={runSearch}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm hover:bg-red-100"
              >
                <Search size={13} />
                Try again
              </button>
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 py-16 text-center">
              <SearchX size={28} className="mb-3 text-gray-400" />
              <p className="text-sm font-semibold text-[#172033]">No listings match these filters</p>
              <p className="mt-1 text-xs text-gray-500">Try a higher budget or fewer bedrooms.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sorted.map((property, index) => (
                <PropertyCard key={`${property.source_url}-${index}`} property={property} />
              ))}
            </div>
          )}

          <p className="mt-8 text-center text-xs text-gray-400">
            Listings were collected from public Wasalt pages and may no longer be available.
          </p>
        </div>
      </main>
    </div>
  )
}

export default PropertyDiscovery
