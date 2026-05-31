'use client'

type RosterListProps = {
  names: string[] | null | undefined
  title: string
  emptyMessage: string
  variant?: 'accepted' | 'waiting'
  isAdminOrDM?: boolean
  onAccept?: (name: string) => void
  onKick?: (name: string, listType: 'adventurers' | 'applicants') => void
  onViewSheet?: (name: string) => void
}

export default function RosterList({
  names,
  title,
  emptyMessage,
  variant,
  isAdminOrDM,
  onAccept,
  onKick,
  onViewSheet
}: RosterListProps) {
  const isWaiting = variant === 'waiting'

  return (
    <div className="mt-6">
      {/* Título con línea de sangre */}
      <div className="flex items-center gap-3 mb-4">
        <span className={`h-px flex-1 ${isWaiting ? 'bg-red-900/40' : 'bg-yellow-700/40'}`} />
        <h4 className={`text-[10px] uppercase tracking-[0.3em] font-bold ${isWaiting ? 'text-red-400/80' : 'text-yellow-500/80'}`}>
          {title}
        </h4>
        <span className={`h-px flex-1 ${isWaiting ? 'bg-red-900/40' : 'bg-yellow-700/40'}`} />
      </div>

      <div className="space-y-1.5">
        {names?.length ? (
          names.map((name) => (
            <div
              key={name}
              className="group relative flex items-center justify-between bg-gradient-to-r from-white/[0.03] to-transparent border-l-2 border-transparent hover:border-red-700/50 hover:from-red-900/10 p-3 transition-all duration-300"
            >
              {/* Decoración de punto */}
              <div className="flex items-center gap-3">
                <div className={`h-1 w-1 rounded-full ${isWaiting ? 'bg-red-800' : 'bg-yellow-600 shadow-[0_0_8px_rgba(202,138,4,0.5)]'}`} />
                <span className="text-sm font-serif tracking-wide text-[#e9e2d6]/90 group-hover:text-white">
                  {name}
                </span>
              </div>

              {/* Acciones de Maestro */}
              {isAdminOrDM && (
                <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onViewSheet?.(name)}
                    className="px-2 py-1 text-[9px] uppercase tracking-tighter text-stone-500 hover:text-[#f2ead8] border border-stone-800 hover:border-stone-600 bg-black/40 transition-all"
                  >
                    Ficha
                  </button>

                  {isWaiting && onAccept && (
                    <button
                      onClick={() => onAccept(name)}
                      className="px-2 py-1 text-[9px] uppercase tracking-tighter text-green-600 hover:text-green-400 border border-green-900/30 hover:border-green-500 bg-green-950/10 transition-all"
                    >
                      Aceptar
                    </button>
                  )}

                  <button
                    onClick={() => onKick?.(name, isWaiting ? 'applicants' : 'adventurers')}
                    className="px-2 py-1 text-[9px] uppercase tracking-tighter text-red-900 hover:text-red-500 border border-red-900/20 hover:border-red-600 bg-red-950/10 transition-all"
                  >
                    {isWaiting ? 'Rechazar' : 'Expulsar'}
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center py-4 text-[11px] text-stone-600 italic font-serif">
            {emptyMessage}
          </p>
        )}
      </div>
    </div>
  )
}