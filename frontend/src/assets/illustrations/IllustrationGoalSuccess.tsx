/** Éxito al completar una meta. */
export default function IllustrationGoalSuccess({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="Meta alcanzada">
      <circle cx="120" cy="88" r="52" fill="#FAFAF8" stroke="#141414" strokeWidth="3" />
      <path d="M96 90l16 16 32-36" stroke="#141414" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="120" cy="88" r="52" fill="#B9F5C6" fillOpacity="0.35" />
      <path d="M96 90l16 16 32-36" stroke="#141414" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M120 36v-12" stroke="#CBB8F7" strokeWidth="3" strokeLinecap="round" />
      <path d="M72 56l-10-10M168 56l10-10M56 96h-12M196 96h-12" stroke="#CBB8F7" strokeWidth="3" strokeLinecap="round" />
      <rect x="70" y="148" width="100" height="10" rx="5" fill="#E4E7DE" />
      <rect x="70" y="148" width="100" height="10" rx="5" fill="#B9F5C6" />
    </svg>
  )
}
