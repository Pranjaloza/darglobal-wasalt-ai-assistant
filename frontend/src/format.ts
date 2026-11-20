/** Compact SAR figures for headlines: 950000 -> "950K", 1500000 -> "1.5M". */
export function compactSar(value: number) {
  if (value >= 1_000_000) {
    const m = value / 1_000_000
    return `${m % 1 === 0 ? m : m.toFixed(m < 10 ? 2 : 1).replace(/\.?0+$/, '')}M`
  }
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`
  return String(value)
}

export function median(values: number[]) {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}
