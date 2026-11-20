/**
 * Decorative line drawing of a skyline, in the spirit of DarGlobal's
 * architectural imagery. Purely visual, hidden from screen readers.
 */
function Skyline({ className = '' }: { className?: string }) {
  // [x, width, height] of each tower, on a 600 x 220 canvas
  const towers: [number, number, number][] = [
    [10, 46, 70], [62, 34, 120], [102, 58, 95], [166, 30, 170], [202, 52, 130],
    [260, 40, 205], [306, 64, 110], [376, 36, 150], [418, 54, 88], [478, 30, 185],
    [514, 48, 125], [568, 26, 80],
  ]

  return (
    <svg
      viewBox="0 0 600 220"
      preserveAspectRatio="xMaxYMax meet"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      {towers.map(([x, w, h]) => {
        const top = 220 - h
        const floors = Math.floor(h / 14)
        return (
          <g key={x} stroke="currentColor">
            <rect x={x} y={top} width={w} height={h} strokeWidth="1" />
            {/* floor lines */}
            {Array.from({ length: floors - 1 }, (_, i) => (
              <line
                key={i}
                x1={x + 4}
                x2={x + w - 4}
                y1={top + 14 * (i + 1)}
                y2={top + 14 * (i + 1)}
                strokeWidth="0.5"
                opacity="0.55"
              />
            ))}
            {/* a mast on the tallest towers */}
            {h > 160 && <line x1={x + w / 2} x2={x + w / 2} y1={top} y2={top - 22} strokeWidth="1" />}
          </g>
        )
      })}
      <line x1="0" x2="600" y1="219.5" y2="219.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

export default Skyline
