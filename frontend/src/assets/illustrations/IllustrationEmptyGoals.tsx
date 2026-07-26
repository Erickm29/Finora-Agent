/** Dashboard vacío — aún no hay metas. */
export default function IllustrationEmptyGoals({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="Sin metas todavía">
      <rect x="40" y="40" width="160" height="110" rx="16" fill="#FAFAF8" stroke="#141414" strokeWidth="3" />
      <path d="M70 120V70h50" stroke="#141414" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M70 95h36" stroke="#CBB8F7" strokeWidth="4" strokeLinecap="round" />
      <circle cx="160" cy="78" r="16" fill="#B9F5C6" />
      <path d="M154 78h12M160 72v12" stroke="#141414" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="56" y="140" width="48" height="8" rx="4" fill="#CBB8F7" />
      <rect x="112" y="140" width="72" height="8" rx="4" fill="#E4E7DE" />
    </svg>
  )
}
