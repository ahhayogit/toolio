import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
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
