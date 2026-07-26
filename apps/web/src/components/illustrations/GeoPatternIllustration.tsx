import type { SVGProps } from 'react'

/** Repeating geometric dot/line texture — replaces the stock "captcha pattern" photo
 *  and doubles as a decorative background texture elsewhere. */
export default function GeoPatternIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" {...props}>
      {Array.from({ length: 6 }).map((_, row) =>
        Array.from({ length: 13 }).map((_, col) => (
          <circle
            key={`${row}-${col}`}
            cx={col * 10 + (row % 2 === 0 ? 0 : 5)}
            cy={row * 8 + 4}
            r={row % 2 === 0 ? 1.6 : 1.1}
            fill={col % 2 === 0 ? '#E36414' : '#FB8B24'}
          />
        )),
      )}
    </svg>
  )
}
