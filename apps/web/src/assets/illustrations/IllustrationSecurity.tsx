/** Seguridad / protección del capital. */
export default function IllustrationSecurity({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="Protección financiera">
      <path d="M100 20l60 28v36c0 36-24 56-60 68-36-12-60-32-60-68V48l60-28z" fill="#141414" />
      <path d="M100 44l36 16v22c0 22-14 34-36 42-22-8-36-20-36-42V60l36-16z" fill="#FAFAF8" />
      <path d="M88 84l10 10 18-20" stroke="#141414" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="160" cy="120" r="14" fill="#B9F5C6" />
      <circle cx="40" cy="110" r="10" fill="#CBB8F7" />
    </svg>
  )
}
