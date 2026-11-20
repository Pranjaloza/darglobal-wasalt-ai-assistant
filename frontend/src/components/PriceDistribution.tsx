import type { Property } from '../types'

const BANDS = [
  { label: '<1M', min: 0, max: 1_000_000 },
  { label: '1–1.25M', min: 1_000_000, max: 1_250_000 },
  { label: '1.25–1.5M', min: 1_250_000, max: 1_500_000 },
  { label: '1.5–2M', min: 1_500_000, max: 2_000_000 },
  { label: '2–3M', min: 2_000_000, max: 3_000_000 },
  { label: '3M+', min: 3_000_000, max: Infinity },
]

/** Number of listings per price band (SAR), as horizontal bars. */
function PriceDistribution({ properties }: { properties: Property[] }) {
  const prices = properties.map((p) => p.price).filter((p): p is number => p != null)
  const counts = BANDS.map((band) => prices.filter((p) => p >= band.min && p < band.max).length)
  const peak = Math.max(1, ...counts)

  return (
    <ul className="space-y-2 px-4 py-3">
      {BANDS.map((band, index) => (
        <li key={band.label} className="grid grid-cols-[72px_1fr_24px] items-center gap-3 text-xs">
          <span className="tabular text-muted">{band.label}</span>
          <span className="h-2 overflow-hidden rounded-full bg-panel">
            <span
              className="block h-full rounded-full bg-accent"
              style={{ width: `${(counts[index] / peak) * 100}%` }}
            />
          </span>
          <span className="tabular text-right text-ink">{counts[index]}</span>
        </li>
      ))}
    </ul>
  )
}

export default PriceDistribution
