import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useState,
} from 'react'

/* ---------- Button ---------- */

type ButtonVariant = 'primary' | 'default' | 'ghost' | 'danger'

const buttonStyles: Record<ButtonVariant, string> = {
  primary: 'bg-sky-500 text-white hover:bg-sky-400 active:bg-sky-600',
  default: 'bg-slate-700 text-slate-100 hover:bg-slate-600 active:bg-slate-800',
  ghost: 'bg-transparent text-slate-300 hover:bg-slate-800',
  danger: 'bg-transparent text-red-400 hover:bg-red-500/10',
}

export function Button({
  variant = 'default',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-3.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${buttonStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

/* ---------- Field wrapper ---------- */

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      {children}
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

/* ---------- Inputs (text-base => iOS odakta zoom yapmaz) ---------- */

const fieldClass =
  'w-full min-h-11 rounded-lg border border-slate-700 bg-slate-800 px-3 text-base text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-500'

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="text" className={fieldClass} {...props} />
}

export function NumberInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="number" inputMode="numeric" className={fieldClass} {...props} />
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${fieldClass} min-h-20 py-2 leading-relaxed`} {...props} />
}

export function Select({
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${fieldClass} appearance-none`} {...props}>
      {children}
    </select>
  )
}

/* ---------- SegmentedControl (dropdown yerine doğrudan seçim) ---------- */

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`min-h-11 flex-1 whitespace-nowrap rounded-lg border px-3 text-sm font-medium transition-colors ${
              active
                ? 'border-sky-500 bg-sky-500/15 text-sky-300'
                : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/* ---------- Toggle (aç/kapa switch) ---------- */

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  hint?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-800 px-3 text-left"
    >
      <span className="flex flex-col">
        <span className="text-sm font-medium text-slate-200">{label}</span>
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-sky-500' : 'bg-slate-600'
        }`}
      >
        <span
          className={`absolute top-0.5 block h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  )
}

/* ---------- Combobox (aranabilir dropdown) ---------- */

export function Combobox<T extends string>({
  value,
  onChange,
  options,
  placeholder = '— seç —',
  searchPlaceholder = 'Ara...',
  emptyText = 'Sonuç yok',
  noneLabel = '— yok —',
}: {
  value: T | null
  onChange: (value: T | null) => void
  options: { value: T; label: string; hint?: string }[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  noneLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selected = options.find((o) => o.value === value) ?? null
  const q = query.trim().toLowerCase()
  const filtered = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options

  const choose = (v: T | null) => {
    onChange(v)
    setOpen(false)
    setQuery('')
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${fieldClass} flex items-center justify-between text-left`}
      >
        <span className={selected ? 'truncate' : 'truncate text-slate-500'}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="ml-2 shrink-0 text-slate-500">▾</span>
      </button>

      {open && (
        <div className="rounded-lg border border-slate-700 bg-slate-800">
          <div className="p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="min-h-10 w-full rounded-md border border-slate-600 bg-slate-900 px-3 text-base text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-500"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto pb-1">
            <li>
              <button
                type="button"
                onClick={() => choose(null)}
                className="w-full px-3 py-2.5 text-left text-sm text-slate-400 hover:bg-slate-700"
              >
                {noneLabel}
              </button>
            </li>
            {filtered.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  onClick={() => choose(o.value)}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-slate-700 ${
                    o.value === value ? 'text-sky-300' : 'text-slate-200'
                  }`}
                >
                  <span className="truncate">{o.label}</span>
                  {o.hint && <span className="shrink-0 text-xs text-slate-500">{o.hint}</span>}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-2.5 text-sm text-slate-500">{emptyText}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ---------- Modal (mobilde tam ekran, masaüstünde ortalı kart) ---------- */

export function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-slate-900 shadow-xl sm:max-w-lg sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-100">{title}</h2>
          <Button variant="ghost" onClick={onClose} aria-label="Kapat" className="px-2">
            ✕
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-slate-800 px-4 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------- Boş liste durumu ---------- */

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-700 px-4 py-10 text-center text-sm text-slate-500">
      {text}
    </div>
  )
}
