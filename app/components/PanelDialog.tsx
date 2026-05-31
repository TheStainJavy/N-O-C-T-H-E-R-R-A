'use client'

import { ReactNode, useEffect } from 'react'

type PanelDialogProps = {
  open: boolean
  title: string
  onClose: () => void
  children?: ReactNode
  footer?: ReactNode
}

export default function PanelDialog({
  open,
  title,
  onClose,
  children,
  footer,
}: PanelDialogProps) {
  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#d6c7a0]/20 bg-[#0a0a0a]/90 p-5 shadow-[0_0_80px_rgba(220,38,38,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-red-200/70">
              Relicario
            </p>
            <h3 className="mt-2 font-serif text-2xl font-semibold text-[#f7f0dc]">
              {title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#e9e2d6]/15 bg-black/20 px-3 py-1 text-sm text-[#e9e2d6]/70 transition hover:bg-white/5"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {children && <div className="mt-4">{children}</div>}

        {footer && <div className="mt-5">{footer}</div>}
      </div>
    </div>
  )
}

