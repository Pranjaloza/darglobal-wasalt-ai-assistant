import { BedDouble, Building2, Compass, ExternalLink, MapPin, Maximize2 } from 'lucide-react'
import type { Property } from '../types'

function PropertyCard({ property }: { property: Property }) {
  const currency = property.currency || 'SAR'
  const price =
    property.price != null
      ? `${new Intl.NumberFormat('en-US').format(property.price)} ${currency}`
      : 'Price not listed'

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 transition hover:border-[#C6A66B] hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F7F3EB] text-[#A9874C]">
          <Building2 size={20} />
        </div>

        {property.city && (
          <span className="rounded-full bg-[#F7F3EB] px-3 py-1 text-xs font-semibold text-[#96743C]">
            {property.city}
          </span>
        )}
      </div>

      <h3 className="font-semibold leading-snug text-[#172033]">
        {property.title || 'Property listing'}
      </h3>

      <p className="mt-2 text-lg font-bold text-[#A9874C]">{price}</p>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
        {property.bedrooms != null && (
          <span className="flex items-center gap-1">
            <BedDouble size={15} />
            {property.bedrooms} bedrooms
          </span>
        )}

        {property.area != null && (
          <span className="flex items-center gap-1">
            <Maximize2 size={14} />
            {property.area.toLocaleString()} {property.area_unit || 'sqm'}
          </span>
        )}

        {property.locality && (
          <span className="flex items-center gap-1">
            <MapPin size={14} />
            {property.locality}
          </span>
        )}

        {property.facing && (
          <span className="flex items-center gap-1">
            <Compass size={14} />
            Facing {property.facing}
          </span>
        )}
      </div>

      {property.source_url && (
        <a
          href={property.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-semibold text-[#A9874C] hover:underline"
        >
          View original listing <ExternalLink size={13} />
        </a>
      )}
    </div>
  )
}

export default PropertyCard
