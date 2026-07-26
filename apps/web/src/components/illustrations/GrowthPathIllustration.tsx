import type { SVGProps } from 'react'

/**
 * Original flat/geometric illustration family for Finora Agent — no stock photos, no
 * gradients or photorealistic effects. Every shape uses only the autumn palette
 * (naranja calaza / terracota as fixed fills so they stay visible on both light and
 * dark surfaces; thin linework uses `currentColor` so it follows the surrounding
 * theme-aware text color).
 *
 * GrowthPathIllustration: ascending savings bars reaching a flagged goal — used for
 * the Login side panel.
 */
export default function GrowthPathIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="120" cy="150" r="86" fill="currentColor" opacity="0.06" />
      <g strokeLinecap="round" strokeLinejoin="round">
        <rect x="46" y="128" width="24" height="46" rx="4" fill="#E36414" />
        <rect x="82" y="104" width="24" height="70" rx="4" fill="#FB8B24" />
        <rect x="118" y="76" width="24" height="98" rx="4" fill="#E36414" />
        <rect x="154" y="52" width="24" height="122" rx="4" fill="#FB8B24" />
        <path d="M58 118 L94 92 L130 66 L166 40" stroke="currentColor" strokeWidth="3" strokeDasharray="2 8" opacity="0.5" />
        <path d="M166 26 L166 40 L180 40" stroke="currentColor" strokeWidth="3" fill="none" />
        <path d="M166 26 L166 46" stroke="#FB8B24" strokeWidth="4" />
        <path d="M166 26 L186 32 L166 40 Z" fill="#FB8B24" />
      </g>
      <circle cx="58" cy="118" r="4" fill="currentColor" />
      <circle cx="94" cy="92" r="4" fill="currentColor" />
      <circle cx="130" cy="66" r="4" fill="currentColor" />
    </svg>
  )
}
