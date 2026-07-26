import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'

interface OtpInputProps {
  length?: number
  onComplete?: (code: string) => void
}

export default function OtpInput({ length = 6, onComplete }: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''))
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  const updateValue = (index: number, raw: string) => {
    const digit = raw.replace(/[^0-9]/g, '').slice(-1)
    const next = [...values]
    next[index] = digit
    setValues(next)

    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus()
    }

    if (next.every((v) => v !== '')) {
      onComplete?.(next.join(''))
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  return (
    <div className="flex justify-between gap-2 sm:gap-4">
      {values.map((value, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el
          }}
          autoFocus={index === 0}
          className="otp-input w-12 h-14 md:w-16 md:h-20 text-center text-headline-md font-headline-md bg-surface-container-low border border-outline-variant rounded-xl transition-all text-on-surface"
          maxLength={1}
          type="text"
          value={value}
          onChange={(e) => updateValue(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
        />
      ))}
    </div>
  )
}
