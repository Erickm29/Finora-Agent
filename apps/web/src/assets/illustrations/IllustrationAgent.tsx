/** Agente / CTA — trayectoria + protección. */
export default function IllustrationAgent({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 280 220" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="Agente financiero Finora">
      <rect x="30" y="40" width="140" height="140" rx="24" fill="#141414" />
      <path d="M60 140c20-30 40-50 70-60" stroke="#FAFAF8" strokeWidth="4" strokeLinecap="round" />
      <circle cx="140" cy="70" r="14" fill="#B9F5C6" />
      <path d="M180 70h50v90c-25 16-50 16-50 0V70z" fill="#CBB8F7" />
      <path d="M195 105l12 12 22-28" stroke="#141414" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="70" cy="70" r="10" fill="#B9F5C6" />
      <rect x="55" y="160" width="90" height="8" rx="4" fill="#FAFAF8" opacity="0.35" />
    </svg>
  )
}
