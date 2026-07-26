export default function SocialAuthButtons() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <button className="flex items-center justify-center gap-3 h-12 px-4 border border-outline-variant rounded-xl bg-surface-container-lowest hover:bg-surface-container-low transition-colors group" type="button">
        <div className="w-6 h-6 bg-[#1877F2] rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold font-sans">f</span>
        </div>
        <span className="font-label-md text-label-md text-on-surface-variant group-hover:text-on-surface">Facebook</span>
      </button>
      <button className="flex items-center justify-center gap-3 h-12 px-4 border border-outline-variant rounded-xl bg-surface-container-lowest hover:bg-surface-container-low transition-colors group" type="button">
        <div className="w-6 h-6 bg-white border border-outline-variant rounded-full flex items-center justify-center overflow-hidden">
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path d="M24 12.25c0-.85-.07-1.67-.21-2.46H12.25v4.65h6.59c-.28 1.54-1.15 2.84-2.45 3.72v3.09h3.97c2.33-2.14 3.64-5.29 3.64-8.99z" fill="#EA4335" />
            <path d="M12.25 24c3.24 0 5.95-1.07 7.94-2.91l-3.97-3.09c-1.1.73-2.51 1.17-3.97 1.17-3.05 0-5.64-2.06-6.56-4.84H1.68v3.19C3.65 21.43 7.64 24 12.25 24z" fill="#FBBC05" />
            <path d="M5.69 14.33c-.24-.73-.38-1.5-.38-2.33s.14-1.6.38-2.33V6.48H1.68C.61 8.64 0 11.08 0 12.25s.61 3.61 1.68 5.77l4.01-3.19z" fill="#34A853" />
            <path d="M12.25 4.84c1.76 0 3.34.6 4.58 1.79l3.44-3.44C18.19 1.19 15.49 0 12.25 0 7.64 0 3.65 2.57 1.68 6.48l4.01 3.19c.92-2.78 3.51-4.83 6.56-4.83z" fill="#4285F4" />
          </svg>
        </div>
        <span className="font-label-md text-label-md text-on-surface-variant group-hover:text-on-surface">Google</span>
      </button>
    </div>
  )
}
