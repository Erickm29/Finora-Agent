import type { SVGProps } from 'react'

/** Flag firmly planted at the peak, with radiating geometric bursts — celebratory
 *  moment when a savings plan is created / a goal is reached. */
export default function GoalAchievedIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="120" cy="112" r="86" fill="currentColor" opacity="0.06" />
      <path d="M40 176 L100 96 L150 140 L200 60" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" fill="none" />
      <path d="M200 30v50" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M200 30l46 15-46 15z" fill="#FB8B24" />
      <g stroke="#E36414" strokeWidth="4" strokeLinecap="round">
        <path d="M200 16v-10" />
        <path d="M222 24l8-8" />
        <path d="M178 24l-8-8" />
      </g>
      <circle cx="150" cy="140" r="6" fill="#E36414" />
      <circle cx="100" cy="96" r="6" fill="#FB8B24" />
      <circle cx="40" cy="176" r="6" fill="currentColor" opacity="0.4" />
    </svg>
  )
}
