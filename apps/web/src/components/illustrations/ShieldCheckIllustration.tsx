import type { SVGProps } from 'react'

/** Shield with checkmark and orbiting dots — "protección" concept, used for the email
 *  verification screen and the security feature card on the landing page. */
export default function ShieldCheckIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="120" cy="100" r="86" fill="currentColor" opacity="0.06" />
      <path
        d="M120 34l52 20v46c0 40-24 60-52 66-28-6-52-26-52-66V54z"
        fill="#FB8B24"
      />
      <path
        d="M120 34l52 20v46c0 40-24 60-52 66-28-6-52-26-52-66V54z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.35"
      />
      <path d="M96 100l16 16 32-34" stroke="#0F4C5C" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="46" cy="70" r="5" fill="#E36414" />
      <circle cx="196" cy="70" r="5" fill="#E36414" />
      <circle cx="34" cy="120" r="4" fill="currentColor" opacity="0.4" />
      <circle cx="206" cy="120" r="4" fill="currentColor" opacity="0.4" />
    </svg>
  )
}
