import type { Property } from '../types'

const BANDS = [
  { label: '<1', min: 0, max: 1_000_000 },
  { label: '1–1.25', min: 1_000_000, max: 1_250_000 },
  { label: '1.25–1.5', min: 1_250_000, max: 1_500_000 },
  { label: '1.5–2', min: 1_500_000, max: 2_000_000 },
  { label: '2–3', min: 2_000_000, max: 3_000_000 },
  { label: '3+', min: 3_000_000, max: Infinity },
]

/** Number of listings per price band, as a small column chart. */
function PriceDistribution({ properties }: { properties: Property[] }) {
  const prices = properties.map((p) => p.price).filter((p): p is number => p != null)
  const counts = BANDS.map((band) => prices.filter((p) => p >= band.min && p < band.max).length)
  const peak = Math.max(1, ...counts)

  return (
    <figure>
      <figcaption className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-nav-muted">
        Listings by price, SAR millions
      </figcaption>
      <div className="flex h-24 items-end gap-1.5" role="img" aria-label={BANDS.map((b, i) => `${b.label}: ${counts[i]}`).join(', ')}>
        {BANDS.map((band, index) => (
          <div key={band.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <span className="tabular text-xs text-nav-text">{counts[index] || ''}</span>
            <div
              className={`w-full rounded-t-[2px] ${counts[index] ? 'bg-gold' : 'bg-nav-line'}`}
              style={{ height: `${counts[index] ? Math.max(6, (counts[index] / peak) * 72) : 2}px` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5 border-t border-nav-line pt-1.5">
        {BANDS.map((band) => (
          <span key={band.label} className="tabular min-w-0 flex-1 text-center text-[10px] whitespace-nowrap text-nav-muted">
            {band.label}
          </span>
        ))}
      </div>
    </figure>
  )
}

export default PriceDistribution
