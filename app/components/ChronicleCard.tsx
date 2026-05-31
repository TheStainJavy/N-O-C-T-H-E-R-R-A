'use client'

'use client'

import { useState } from 'react'
import type { Chronicle } from '@/lib/types'
import PanelDialog from './PanelDialog' 

type ChronicleCardProps = {
  chronicle: Chronicle
  isAdmin: boolean  
  onDelete: (id: string) => void 
  expandedChronicle: string | null
  setExpandedChronicle: React.Dispatch<React.SetStateAction<string | null>>
}

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=1600&auto=format&fit=crop'

  export default function ChronicleCard({
    chronicle,
    isAdmin,             
    onDelete,           
    expandedChronicle,
    setExpandedChronicle,
  }: ChronicleCardProps) {
  const isExpanded = expandedChronicle === chronicle.id
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <div className="overflow-hidden rounded-2xl border border-[#d6c7a0]/15 bg-[#0a0a0a]/40 shadow-[0_0_30px_rgba(0,0,0,0.35)]">
      <button
        type="button"
        onClick={() =>
          setExpandedChronicle(isExpanded ? null : chronicle.id)
        }
        className="group relative block w-full text-left"
      >
        <div className="relative h-64 overflow-hidden">
          <img
            src={chronicle.cover_image || DEFAULT_COVER}
            alt={chronicle.mission_title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

          <div className="absolute bottom-0 left-0 w-full p-5">
            <h3 className="text-2xl font-semibold text-[#f8f2df]">
              {chronicle.mission_title}
            </h3>

            <p className="mt-2 text-sm text-[#e9e2d6]/80">
              {chronicle.mission_summary}
            </p>
          </div>
        </div>
      </button>
      {isAdmin && (
  <div className="flex justify-end px-6 pb-2">
    <button
      onClick={() => setConfirmOpen(true)}
      className="text-[10px] uppercase tracking-widest text-red-900/60 hover:text-red-500 transition-colors"
    >
      [ Condenar al olvido ]
    </button>
  </div>
)}
      {isExpanded && (
        <div className="space-y-5 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-red-200/60">
              Descripción
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#e9e2d6]/82">
              {chronicle.mission_description}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-red-200/60">
              Resultado
            </p>
            <p className="mt-2 text-sm capitalize text-[#f8f2df]">
              {(chronicle.result_code ?? chronicle.result) || '—'}
            </p>

            {chronicle.result_lore && chronicle.result_lore.trim() && (
              <p className="mt-3 text-sm leading-relaxed text-[#e9e2d6]/82">
                {chronicle.result_lore}
              </p>
            )}
          </div>

          {chronicle.mission_start && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-red-200/60">
                Horario de expedición
              </p>
              <p className="mt-2 text-sm text-[#e9e2d6]/80">
                Empieza:{' '}
                {new Date(chronicle.mission_start).toLocaleString()}
              </p>
              {chronicle.mission_end && (
                <p className="mt-1 text-sm text-[#e9e2d6]/60">
                  Finaliza:{' '}
                  {new Date(chronicle.mission_end).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {chronicle.dm_name && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-yellow-400/80">
                Dungeon Master
              </p>
              <p className="mt-2 text-sm font-semibold text-yellow-200">
                {chronicle.dm_name}
              </p>
            </div>
          )}

          {(chronicle.featured_regions?.length ?? 0) > 0 && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-red-200/60">
                Regiones involucradas
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {chronicle.featured_regions?.map((region) => (
                  <span
                    key={region}
                    className="rounded-full border border-red-800/30 bg-red-950/20 px-3 py-1 text-xs text-red-100/80"
                  >
                    {region}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(chronicle.featured_factions?.length ?? 0) > 0 && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-red-200/60">
                Facciones involucradas
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {chronicle.featured_factions?.map((faction) => (
                  <span
                    key={faction}
                    className="rounded-full border border-[#e9e2d6]/10 bg-black/20 px-3 py-1 text-xs text-[#f2ead8]"
                  >
                    {faction}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-red-200/60">
              Aventureros contratados ({chronicle.adventurers?.length ?? 0})
            </p>
            <div className="mt-4 space-y-2">
              {chronicle.adventurers?.length ? (
                chronicle.adventurers.map((name) => (
                  <div
                    key={name}
                    className="rounded-lg border border-yellow-700/20 bg-black/20 px-3 py-2 text-sm text-[#f2ead8]"
                  >
                    {name}
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#e9e2d6]/50">
                  No hubo aventureros registrados.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

<PanelDialog
  open={confirmOpen}
  title="Sentencia de Olvido"
  onClose={() => setConfirmOpen(false)}
  footer={
    <div className="flex gap-3">
      <button
        onClick={() => setConfirmOpen(false)}
        className="w-1/2 rounded-xl border border-[#e9e2d6]/10 bg-black/20 px-4 py-3 text-sm text-[#e9e2d6]/60"
      >
        Mantener registro
      </button>
      <button
        onClick={() => {
          onDelete(chronicle.id)
          setConfirmOpen(false)
        }}
        className="w-1/2 rounded-xl border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-200"
      >
        Borrar para siempre
      </button>
    </div>
  }
>
  <p className="text-sm text-[#e9e2d6]/80">
    ¿Estás seguro de que deseas borrar esta crónica? Una vez quemada, los nombres y hazañas contenidos en ella se perderán en el vacío de Noctherra.
  </p>
</PanelDialog>

    </div>
  )
}
