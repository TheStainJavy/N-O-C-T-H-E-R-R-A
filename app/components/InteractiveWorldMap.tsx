'use client'

import React, { useState, useMemo, useRef } from 'react';
import { NOCTHERRA_REGIONS } from '@/lib/constants'; 
import type { Mission } from '@/lib/types';

const MAP_COORDINATES: Record<string, { x: number; y: number }> = {
  arvok: { x: 38, y: 18 },
  vaelbris: { x: 25, y: 38 },
  deimonmark: { x: 22, y: 65 },
  sylvaran: { x: 53, y: 45 },
  nareth: { x: 58, y: 82 },
  mournhollow: { x: 75, y: 65 },
  asteria: { x: 82, y: 35 },
  pozo_profundo: { x: 62, y: 15 },
};

// --- SISTEMA DE SONIDOS ---
// Define aquí las rutas de tus audios en /public/sounds/
const REGION_SOUNDS: Record<string, string> = {
  arvok: '/sounds/stone-click.mp3',
  vaelbris: '/sounds/coins-click.mp3',
  deimonmark: '/sounds/fire-click.mp3',
  default: '/sounds/scroll-open.mp3'
};

interface MapProps {
  missions: Mission[];
  activeRegion: string | null;
  onSelectRegion: (regionId: string | null) => void;
}

export default function InteractiveWorldMap({ missions, activeRegion, onSelectRegion }: MapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  
  // Referencia para el audio para no crear múltiples instancias
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const missionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    missions.forEach((m) => {
      if (m.mission_state === 'available' && m.featured_regions) {
        m.featured_regions.forEach((id) => counts[id] = (counts[id] || 0) + 1);
      }
    });
    return counts;
  }, [missions]);

  // FUNCIÓN PARA REPRODUCIR SONIDO
  const playRegionSound = (regionId: string) => {
    const soundPath = REGION_SOUNDS[regionId] || REGION_SOUNDS.default;
    const audio = new Audio(soundPath);
    audio.volume = 0.4; // Volumen sutil para no romper la inmersión
    audio.play().catch(e => console.log("Audio block por el navegador"));
  };

  const handleRegionClick = (id: string) => {
    const isActive = activeRegion === id;
    playRegionSound(id); // <--- SONIDO AL CLICK
    onSelectRegion(isActive ? null : id);
  };

  return (
    <div className="relative w-full rounded-2xl border border-red-900/20 bg-[#050505] overflow-hidden shadow-2xl group/map">
      
      {/* Título e Indicador */}
      <div className="absolute top-6 left-8 z-30 pointer-events-none">
        <h2 className="font-serif text-3xl text-[#f2ead8] tracking-tighter uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
          
        </h2>
        <div className="flex items-center gap-2 mt-1">
           <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
           <p className="text-[9px] text-red-200/50 uppercase tracking-[0.4em] font-bold">
             Señales de actividad detectadas
           </p>
        </div>
      </div>

      <div className="relative w-full flex items-center justify-center bg-[#070707]">
        {/* CARGA DEL SVG COMO OBJETO PARA MANTENER CALIDAD */}
        <img 
          src="/noctherra-map.webp" // Asegúrate de que el nombre coincida
          alt="Mapa de Noctherra" 
          className="w-full h-auto block opacity-60 group-hover/map:opacity-100 transition-all duration-1000 grayscale-[0.4] group-hover/map:grayscale-0 scale-[1.01]"
        />

        {/* Capa de Marcadores (Se mantiene en % para ser responsivo con el SVG) */}
        <div className="absolute inset-0 z-20">
          {NOCTHERRA_REGIONS.map((region) => {
            const count = missionCounts[region.id] || 0;
            const pos = MAP_COORDINATES[region.id];
            const isActive = activeRegion === region.id;
            
            if (!pos) return null;

            return (
                <div
                  key={region.id}
                  className="absolute pointer-events-auto"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <button
                    onClick={() => handleRegionClick(region.id)}
                    onMouseEnter={() => setHoveredRegion(region.id)}
                    onMouseLeave={() => setHoveredRegion(null)}
                    className="group/marker relative flex flex-col items-center gap-1 p-2"
                  >
                    {/* EL NODO RADIANTE */}
                    <div className={`relative h-5 w-5 sm:h-7 sm:w-7 rounded-full border-2 transition-all duration-500 shadow-2xl flex items-center justify-center ${
                      count > 0 
                        ? 'border-yellow-400 bg-amber-500/30 shadow-[0_0_30px_rgba(251,191,36,0.8)]' 
                        : 'border-white/40 bg-black/50 shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                    } ${isActive ? 'scale-150 border-white ring-4 ring-amber-500/40 z-30' : 'group-hover/marker:scale-125'}`}>
                      
                      {/* Núcleo del Nodo */}
                      <div className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${count > 0 ? 'bg-white shadow-[0_0_10px_white]' : 'bg-white/40'}`} />
              
                      {/* Efecto de Pulso de Llamada (Solo si hay misiones) */}
                      {count > 0 && (
                        <span className="absolute inset-[-10px] rounded-full border border-amber-500/40 animate-[ping_2s_linear_infinite]" />
                      )}
                    </div>
              
                    {/* ETIQUETA SIEMPRE VISIBLE (Atenuada) */}
                    <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-tighter sm:tracking-widest px-2 py-0.5 rounded-md border border-white/5 bg-black/40 backdrop-blur-sm transition-all duration-300 ${
                      isActive || hoveredRegion === region.id 
                        ? 'text-yellow-400 border-yellow-500/30 -translate-y-1' 
                        : 'text-white/40 opacity-70'
                    }`}>
                      {region.name} {count > 0 && `(${count})`}
                    </span>
              
                    {/* CONTADOR DE MISIONES FLOTANTE */}
                    {count > 0 && (
                      <span className="absolute -top-3 right-0 bg-red-600 text-white text-[9px] font-black px-1.5 rounded-full border border-red-300 shadow-[0_0_10px_rgba(220,38,38,0.5)] z-40">
                        {count}
                      </span>
                    )}
                  </button>
                </div>
              );
          })}
        </div>
      </div>

      {/* Panel Narrativo Inferior Izquierdo */}
      <div className={`absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black via-black/80 to-transparent z-20 pointer-events-none transition-opacity duration-500 ${hoveredRegion || activeRegion ? 'opacity-100' : 'opacity-0'}`} />
      
      <div className={`absolute bottom-8 left-8 z-30 transition-all duration-700 ${
        hoveredRegion || activeRegion ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}>
        {(() => {
          const regionId = hoveredRegion || activeRegion;
          const region = NOCTHERRA_REGIONS.find(r => r.id === regionId);
          return region ? (
            <div>
              <h3 className="font-serif text-3xl text-[#f2ead8] tracking-wider uppercase leading-none">{region.name}</h3>
              <p className="text-xs text-red-500 font-bold uppercase tracking-[0.3em] mt-1">{region.epithet}</p>
            </div>
          ) : null;
        })()}
      </div>
    </div>
  );
}