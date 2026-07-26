/** Login / registro — crecimiento hacia una meta (plano, paleta pastel). */
export default function IllustrationAuth({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 280 240" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="Ilustración de progreso financiero">
      <rect x="24" y="160" width="28" height="48" rx="4" fill="#CBB8F7" />
      <rect x="64" y="128" width="28" height="80" rx="4" fill="#B9F5C6" />
      <rect x="104" y="96" width="28" height="112" rx="4" fill="#141414" />
      <rect x="144" y="64" width="28" height="144" rx="4" fill="#CBB8F7" />
      <path d="M40 148c40-40 80-70 140-90" stroke="#FAFAF8" strokeWidth="3" strokeLinecap="round" />
      <circle cx="200" cy="48" r="18" fill="#B9F5C6" />
      <path d="M200 34v-8M214 48h8M200 70v-8M178 48h8" stroke="#141414" strokeWidth="2" strokeLinecap="round" />
      <circle cx="236" cy="180" r="22" fill="#FAFAF8" />
      <circle cx="236" cy="180" r="12" fill="#CBB8F7" />
      <path d="M220 200h32" stroke="#FAFAF8" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}
