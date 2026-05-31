'use client'

import { NOCTHERRA_REGIONS } from '@/lib/constants'

type RegionFilterProps = {
  activeRegion: string | null
  onSelectRegion: (regionId: string | null) => void
}

export default function RegionFilter({ activeRegion, onSelectRegion }: RegionFilterProps) {
  return (
    <div className="mb-8 flex flex-wrap justify-center gap-2">
      <button
        onClick={() => onSelectRegion(null)}
        className={`rounded-full border px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] transition-all ${
          activeRegion === null
            ? 'border-red-700 bg-red-950/30 text-red-100 shadow-[0_0_15px_rgba(220,38,38,0.2)]'
            : 'border-[#d6c7a0]/10 bg-black/20 text-[#e9e2d6]/40 hover:border-[#d6c7a0]/30'
        }`}
      >
        Todo Noctherra
      </button>

      {NOCTHERRA_REGIONS.map((region) => (
        <button
          key={region.id}
          onClick={() => onSelectRegion(region.id)}
          className={`rounded-full border px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] transition-all ${
            activeRegion === region.id
              ? 'border-red-700 bg-red-950/30 text-red-100 shadow-[0_0_15px_rgba(220,38,38,0.2)]'
              : 'border-[#d6c7a0]/10 bg-black/20 text-[#e9e2d6]/40 hover:border-[#d6c7a0]/30'
          }`}
        >
          {region.name}
        </button>
      ))}
    </div> 
  ) 
} 