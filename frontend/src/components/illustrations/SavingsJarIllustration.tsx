import type { SVGProps } from 'react'

/** Coin jar filling up — used for the Register side panel ("empezar a ahorrar"). */
export default function SavingsJarIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="120" cy="150" r="86" fill="currentColor" opacity="0.06" />
      <path
        d="M84 70h72l6 14v78a14 14 0 0 1-14 14H92a14 14 0 0 1-14-14V84z"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M84 70h72" stroke="currentColor" strokeWidth="3" />
      <rect x="96" y="52" width="48" height="18" rx="6" fill="#E36414" />
      <rect x="78" y="112" width="84" height="58" rx="4" fill="#FB8B24" opacity="0.9" />
      <circle cx="102" cy="96" r="9" fill="#E36414" />
      <circle cx="126" cy="88" r="9" fill="#FB8B24" />
      <circle cx="150" cy="98" r="9" fill="#E36414" />
      <text x="120" y="146" textAnchor="middle" fontSize="22" fontWeight="700" fill="currentColor" opacity="0.85">
        $
      </text>
    </svg>
  )
}
