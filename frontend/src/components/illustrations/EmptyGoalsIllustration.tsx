import type { SVGProps } from 'react'

/** Flag at the end of a dashed path, with a faded unplanted marker — "aún no tienes
 *  metas" empty state for the Dashboard. */
export default function EmptyGoalsIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <ellipse cx="120" cy="176" rx="96" ry="10" fill="currentColor" opacity="0.06" />
      <path
        d="M36 160 Q90 128 140 138 T206 96"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray="3 10"
        strokeLinecap="round"
        opacity="0.4"
      />
      <circle cx="36" cy="160" r="6" fill="currentColor" opacity="0.35" />
      <g opacity="0.4">
        <path d="M150 100v58" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <path d="M150 100l34 11-34 11z" fill="#E36414" />
      </g>
      <path d="M206 60v96" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M206 60l40 13-40 13z" fill="#FB8B24" />
      <circle cx="206" cy="156" r="6" fill="currentColor" opacity="0.35" />
    </svg>
  )
}
