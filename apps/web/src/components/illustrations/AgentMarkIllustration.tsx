import type { SVGProps } from 'react'

/** Larger, decorative sibling of the Logo isotype — used wherever the prototype used
 *  to show a stock "AI agent" avatar photo (onboarding chat, market co-pilot panel). */
export default function AgentMarkIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="60" cy="60" r="58" fill="currentColor" opacity="0.08" />
      <circle cx="60" cy="60" r="40" fill="currentColor" />
      <path
        d="M40 68L52 54L64 62L82 38"
        stroke="#FB8B24"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="82" cy="38" r="5.5" fill="#FB8B24" />
      <circle cx="24" cy="30" r="4" fill="#E36414" />
      <circle cx="98" cy="86" r="4" fill="#E36414" />
    </svg>
  )
}
