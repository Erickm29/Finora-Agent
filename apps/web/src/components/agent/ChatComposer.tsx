import { useState } from 'react'
import type { FormEvent } from 'react'
import Icon from '../common/Icon'

interface ChatComposerProps {
  onSend: (text: string) => void
  disabled?: boolean
}

export default function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }

  return (
    <div className="p-8 pt-2 relative z-10">
      <form
        className={`bg-white rounded-[32px] p-2 pr-4 shadow-lg border flex items-center gap-3 transition-all ${
          focused ? 'ring-2 ring-secondary border-transparent' : 'border-outline-variant/20'
        }`}
        onSubmit={handleSubmit}
      >
        <button className="p-3 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors" type="button">
          <Icon name="add" />
        </button>
        <input
          className="flex-1 bg-transparent border-none focus:ring-0 text-body-md py-4 outline-none disabled:opacity-60"
          placeholder={disabled ? 'Finora está escribiendo...' : 'Pregúntale algo a Finora...'}
          type="text"
          value={value}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => setValue(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors" type="button">
            <Icon name="mic" />
          </button>
          <button
            className="bg-primary text-on-primary h-12 w-12 rounded-full flex items-center justify-center hover:bg-primary-container transition-colors shadow-md active:scale-90 duration-150 disabled:opacity-60"
            type="submit"
            disabled={disabled}
          >
            <Icon name="send" />
          </button>
        </div>
      </form>
      <p className="text-[10px] text-center mt-3 text-on-surface-variant/40 font-medium">
        Finora AI puede cometer errores. Verifica la información financiera importante.
      </p>
    </div>
  )
}
