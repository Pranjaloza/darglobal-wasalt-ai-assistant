import { ArrowUpRight } from 'lucide-react'
import type { Property } from '../types'

const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

function formatPrice(property: Property) {
  return property.price != null ? number.format(property.price) : '—'
}

function formatArea(property: Property) {
  return property.area != null ? `${number.format(property.area)} m²` : '—'
}

/** A short label: "Villa 300 SQM Facing East on 25m Width Street" -> keep as-is, but drop the repeated area. */
function shortTitle(title?: string) {
  if (!title) return 'Listing'
  return title.replace(/^Villa\s+[\d.,]+\s*SQM\s*/i, 'Villa ').replace(/\s+/g, ' ').trim()
}

interface ListingsTableProps {
  properties: Property[]
  /** Hide the city column when every row is in the same city */
  compact?: boolean
}

/**
 * Listings as a table on wide screens and as a stacked list on phones.
 * Figures use tabular numbers so prices line up.
 */
function ListingsTable({ properties, compact = false }: ListingsTableProps) {
  const showCity = !compact || new Set(properties.map((p) => p.city)).size > 1

  return (
    <div className="overflow-hidden rounded-md border border-line bg-surface">
      {/* Desktop / tablet */}
      <table className="tabular hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b border-line text-left text-xs text-muted">
            <th className="px-4 py-2.5 font-medium">Listing</th>
            {showCity && <th className="px-3 py-2.5 font-medium">City</th>}
            <th className="px-3 py-2.5 font-medium">District</th>
            <th className="px-3 py-2.5 text-right font-medium">Beds</th>
            <th className="px-3 py-2.5 text-right font-medium">Area</th>
            <th className="px-3 py-2.5 text-right font-medium">Price (SAR)</th>
            <th className="w-10 px-3 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {properties.map((property, index) => (
            <tr
              key={`${property.source_url}-${index}`}
              className="border-b border-line last:border-0 hover:bg-paper"
            >
              <td className="px-4 py-2.5">
                <span className="text-ink">{shortTitle(property.title)}</span>
              </td>
              {showCity && <td className="px-3 py-2.5 text-ink-2">{property.city || '—'}</td>}
              <td className="px-3 py-2.5 text-ink-2">{property.locality || '—'}</td>
              <td className="px-3 py-2.5 text-right">{property.bedrooms ?? '—'}</td>
              <td className="px-3 py-2.5 text-right text-ink-2">{formatArea(property)}</td>
              <td className="px-3 py-2.5 text-right font-medium">{formatPrice(property)}</td>
              <td className="px-3 py-2.5 text-right">
                {property.source_url && (
                  <a
                    href={property.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex text-faint hover:text-accent"
                    aria-label="Open listing on Wasalt"
                    title="Open listing on Wasalt"
                  >
                    <ArrowUpRight size={16} />
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Phone */}
      <ul className="tabular divide-y divide-line md:hidden">
        {properties.map((property, index) => (
          <li key={`${property.source_url}-${index}`}>
            <a
              href={property.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-3 active:bg-paper"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-ink">{shortTitle(property.title)}</span>
                <span className="shrink-0 text-sm font-medium">{formatPrice(property)}</span>
              </div>
              <p className="mt-1 text-xs text-muted">
                {[
                  property.bedrooms != null ? `${property.bedrooms} beds` : null,
                  property.area != null ? formatArea(property) : null,
                  property.locality,
                  showCity ? property.city : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ListingsTable
