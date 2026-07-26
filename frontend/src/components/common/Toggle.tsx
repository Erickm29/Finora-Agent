import { useState } from 'react'

interface ToggleProps {
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
}

export default function Toggle({ defaultChecked = false, onChange }: ToggleProps) {
  const [checked, setChecked] = useState(defaultChecked)

  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        checked={checked}
        className="sr-only toggle-switch"
        type="checkbox"
        onChange={(e) => {
          setChecked(e.target.checked)
          onChange?.(e.target.checked)
        }}
      />
      <div className="w-11 h-6 bg-surface-container-highest rounded-full toggle-bg transition-colors relative">
        <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform toggle-dot shadow-sm" />
      </div>
    </label>
  )
}
