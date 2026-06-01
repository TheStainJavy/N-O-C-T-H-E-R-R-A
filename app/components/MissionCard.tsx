'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { archiveMission } from '@/lib/archiveMission'
import { MISSION_STATE_LABELS } from '@/lib/constants'
import type { Mission, Profile, User } from '@/lib/types'
import RosterList from './RosterList'
import PanelDialog from './PanelDialog'

type MissionCardProps = {
  mission: Mission
  user: User | null
  profile: Profile | null
  isAdmin: boolean
  isDM: boolean
  setMissions: React.Dispatch<React.SetStateAction<Mission[]>>
  expandedMission: string | null
  setExpandedMission: React.Dispatch<React.SetStateAction<string | null>>
  expandedPlayers: string | null
  setExpandedPlayers: React.Dispatch<React.SetStateAction<string | null>>
  onMissionArchived: () => void
}

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=1600&auto=format&fit=crop'

export default function MissionCard({
  mission,
  user,
  profile,
  isAdmin,
  isDM,
  setMissions,
  expandedMission,
  setExpandedMission,
  expandedPlayers,
  setExpandedPlayers,
  onMissionArchived,
}: MissionCardProps) {

  // --- LÓGICA DE PERMISOS ---
  const isMissionMaster = isAdmin || (user?.id === mission.creator_id);

  // --- ESTADOS LOCALES ---
  const isExpanded = expandedMission === mission.id
  const showPlayers = expandedPlayers === mission.id
  const adventurerName = profile?.adventurer_name
  const accepted = mission.adventurers ?? []
  const applicants = mission.applicants ?? []
  
  const isJoined = !!adventurerName && accepted.includes(adventurerName)
  const isInApplicants = !!adventurerName && applicants.includes(adventurerName)
  const isRosterOpen = mission.mission_state === 'available' || mission.mission_state === 'reserved'

  type ArchiveResultCode = 'completada' | 'fallida' | 'cancelada'
  const [infoDialogOpen, setInfoDialogOpen] = useState(false)
  const [infoDialogTitle, setInfoDialogTitle] = useState('')
  const [infoDialogMessage, setInfoDialogMessage] = useState('')
  const [outcomeOpen, setOutcomeOpen] = useState(false)
  const [outcomeCode, setOutcomeCode] = useState<ArchiveResultCode>('completada')
  const [outcomeLore, setOutcomeLore] = useState('')
  const [archiving, setArchiving] = useState(false)

  // --- FUNCIONES DE GESTIÓN ---
  async function refreshMissionRow() {
    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .eq('id', mission.id)
      .single()
    if (!error && data) {
      setMissions((prev) => prev.map((m) => (m.id === mission.id ? data : m)))
    }
  }

  const handleViewSheet = async (targetName: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('character_sheet_url')
      .eq('adventurer_name', targetName)
      .single();
    
    if (data?.character_sheet_url) {
      window.open(data.character_sheet_url, '_blank');
    } else {
      showInfo("Rastro perdido", "Este aventurero no ha vinculado su ficha.");
    }
  };

  const handleAcceptPlayer = async (playerName: string) => {
    const newApplicants = (mission.applicants || []).filter(n => n !== playerName);
    const newAdventurers = [...(mission.adventurers || []), playerName];
    const { error } = await supabase
      .from('missions')
      .update({ applicants: newApplicants, adventurers: newAdventurers })
      .eq('id', mission.id);
    if (!error) refreshMissionRow();
  };

  const handleKickPlayer = async (playerName: string, listType: 'adventurers' | 'applicants') => {
    const newList = mission[listType].filter(n => n !== playerName);
    const { error } = await supabase
      .from('missions')
      .update({ [listType]: newList })
      .eq('id', mission.id);
    if (!error) refreshMissionRow();
  };

  function showInfo(title: string, message: string) {
    setInfoDialogTitle(title)
    setInfoDialogMessage(message)
    setInfoDialogOpen(true)
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#d6c7a0]/15 bg-[#0a0a0a]/40 shadow-[0_0_30px_rgba(0,0,0,0.35)] transition hover:border-red-700/30">
      {/* CABECERA */}
      <button
        type="button"
        onClick={() => setExpandedMission(isExpanded ? null : mission.id)}
        className="group relative block w-full text-left"
      >
        <div className="relative h-64 overflow-hidden">
          <img src={mission.cover_image || DEFAULT_COVER} alt={mission.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-2xl font-semibold text-[#f8f2df]">{mission.title}</h3>
              <span className="rounded-full border border-red-700/30 bg-red-950/30 px-3 py-1 text-xs text-red-100/80 uppercase">
                {MISSION_STATE_LABELS[mission.mission_state] ?? mission.mission_state}
              </span>
            </div>

            <p className="mt-2 text-sm text-[#e9e2d6]/80 line-clamp-1">{mission.summary}</p>
            {mission.dm_name && (
              <div className="mt-3 inline-flex items-center rounded-full border border-yellow-700/30 bg-yellow-950/20 px-3 py-1 text-xs text-yellow-200 font-serif italic">
                DM: {mission.dm_name}
              </div>
            )}
             </div>
        </div>
      </button>

      {/* CONTENIDO DETALLADO */}
      {isExpanded && (
        <div className="space-y-6 p-6 animate-in fade-in duration-500">
          
          {/* DESCRIPCIÓN Y TIEMPO */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-red-200/50 mb-2">Relato de la Misión</p>
            <p className="text-sm leading-relaxed text-[#e9e2d6]/80 font-serif">{mission.description}</p>
            
            {mission.mission_start && (
              <div className="mt-4 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <p className="text-[9px] uppercase tracking-widest text-stone-500">Cronología</p>
                <p className="text-xs text-stone-300 mt-1">Inicia: {new Date(mission.mission_start).toLocaleString()}</p>
                {mission.mission_end && <p className="text-xs text-stone-500">Fin estimado: {new Date(mission.mission_end).toLocaleString()}</p>}
              </div>
            )}
          </div>

          {/* GRID DE DATOS TÉCNICOS */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col items-center justify-center text-center">
              <p className="text-[10px] uppercase tracking-[0.2em] text-red-200/40 mb-1">Nivel Requerido</p>
              <p className="text-2xl font-serif text-[#f8f2df]">{mission.level_required ?? 1}</p>
            </div>

            <button 
              type="button" 
              onClick={() => setExpandedPlayers(showPlayers ? null : mission.id)} 
              className={`rounded-xl border transition-all p-4 flex flex-col items-center justify-center text-center ${
                showPlayers ? 'border-red-700/50 bg-red-900/10' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'
              }`}
            >
              <p className="text-[10px] uppercase tracking-[0.2em] text-red-200/40 mb-1 font-bold">Expedicionarios</p>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-serif text-[#f8f2df]">{accepted.length}</p>
                <p className="text-xs text-stone-500">/ {mission.max_players ?? 0}</p>
              </div>
            </button>
          </div>

          {/* LISTA DE JUGADORES DESPLEGABLE */}
          {showPlayers && (
            <div className="bg-black/20 rounded-xl p-2 border border-white/[0.02] animate-in slide-in-from-top-2 duration-300">
              <RosterList names={accepted} variant="accepted" title="Aventureros Aceptados" emptyMessage="Nadie aceptado." isAdminOrDM={isMissionMaster} onKick={handleKickPlayer} onViewSheet={handleViewSheet} />
              <RosterList names={applicants} variant="waiting" title="En Espera" emptyMessage="Nadie en espera." isAdminOrDM={isMissionMaster} onAccept={handleAcceptPlayer} onKick={handleKickPlayer} onViewSheet={handleViewSheet} />
            </div>
          )}

          {/* ARCO Y ESTADO NARRATIVO */}
          <div className="grid grid-cols-2 gap-4">
            {mission.current_arc && (
              <div>
                <p className="text-[9px] uppercase tracking-widest text-red-200/30">Arco Narrativo</p>
                <p className="text-xs text-stone-300 italic">"{mission.current_arc}"</p>
              </div>
            )}
            {mission.current_status && (
              <div>
                <p className="text-[9px] uppercase tracking-widest text-red-200/30">Estado Actual</p>
                <p className="text-xs text-stone-300">{mission.current_status}</p>
              </div>
            )}
          </div>

          {/* REGIONES Y FACCIONES */}
          <div className="space-y-4 pt-2">
            {mission.featured_regions && mission.featured_regions.length > 0 && (
              <div>
                <p className="text-[9px] uppercase tracking-widest text-stone-500 mb-2 font-bold">Regiones Involucradas</p>
                <div className="flex flex-wrap gap-2">
                  {mission.featured_regions.map(r => (
                    <span key={r} className="px-2 py-1 rounded-md border border-red-900/30 bg-red-950/10 text-[9px] text-red-200/70 uppercase">{r}</span>
                  ))}
                </div>
              </div>
            )}
            {mission.featured_factions && mission.featured_factions.length > 0 && (
              <div>
                <p className="text-[9px] uppercase tracking-widest text-stone-500 mb-2 font-bold">Facciones en Juego</p>
                <div className="flex flex-wrap gap-2">
                  {mission.featured_factions.map(f => (
                    <span key={f} className="px-2 py-1 rounded-md border border-stone-800 bg-stone-900/40 text-[9px] text-stone-400 uppercase">{f}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ACCIONES DE JUGADOR */}
          {user && !isAdmin && !isDM && isRosterOpen && (
            <div className="pt-4 border-t border-white/5">
              {isJoined || isInApplicants ? (
                <button type="button" onClick={async () => {
                  const { error } = await supabase.rpc('leave_mission', { p_mission_id: mission.id })
                  if (!error) { await refreshMissionRow(); showInfo('Hecho', 'Has roto tu juramento.'); }
                }} className="w-full rounded-xl border border-red-900/30 bg-black/30 py-3 text-xs text-red-200/80 hover:bg-red-950/20 transition-all uppercase tracking-widest">
                  {isJoined ? 'Abandonar Expedición' : 'Retirarse de la espera'}
                </button>
              ) : (
                <button type="button" onClick={async () => {
                  const { error } = await supabase.rpc('join_mission', { p_mission_id: mission.id })
                  if (!error) { await refreshMissionRow(); showInfo('Sello Realizado', 'Tu nombre ha sido grabado en el contrato.'); }
                }} className="w-full rounded-xl border border-red-700/40 bg-red-950/40 py-3 text-xs text-white hover:bg-red-900/40 transition-all shadow-lg uppercase tracking-widest font-bold">
                  Atarme a este juramento
                </button>
              )}
            </div>
          )}

          {/* CONTROLES DE MAESTRO */}
          {isMissionMaster && (
            <div className="space-y-4 border-t border-red-900/20 pt-6 mt-4">
              <div>
                <label className="text-[10px] uppercase text-red-200/40 mb-2 font-bold tracking-[0.2em] block italic">Estado del Contrato</label>
                <select value={mission.mission_state} onChange={async (e) => {
                  const { error } = await supabase.from('missions').update({ mission_state: e.target.value }).eq('id', mission.id);
                  if (!error) refreshMissionRow();
                }} className="w-full bg-black/60 border border-red-900/30 text-xs uppercase text-red-100 p-3 rounded-lg focus:border-red-600 outline-none appearance-none cursor-pointer">
                  <option value="available">Disponible (Abierta)</option>
                  <option value="reserved">Reservada (Privada)</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
              <button type="button" onClick={() => { setOutcomeCode('completada'); setOutcomeLore(''); setOutcomeOpen(true); }} className="w-full rounded-xl border border-red-700/60 bg-red-950/40 py-3 text-xs text-red-100 hover:bg-red-900/60 transition-all font-bold tracking-widest uppercase shadow-lg">
                Sentenciar y Archivar Aventura
              </button>
            </div>
          )}
        </div>
      )}

      {/* DIÁLOGOS */}
      <PanelDialog open={infoDialogOpen} title={infoDialogTitle} onClose={() => setInfoDialogOpen(false)} footer={<button onClick={() => setInfoDialogOpen(false)} className="w-full rounded-xl border border-red-700/40 bg-red-950/20 py-3 text-sm text-[#f2ead8]">Aceptar</button>}><p className="text-sm text-[#e9e2d6]/80">{infoDialogMessage}</p></PanelDialog>
      <PanelDialog open={outcomeOpen} title="Archivar aventura" onClose={() => setOutcomeOpen(false)} footer={<div className="flex gap-3"><button onClick={() => setOutcomeOpen(false)} className="w-1/2 rounded-xl border border-white/10 bg-black/20 py-3 text-sm">Cancelar</button><button onClick={async () => {
        if (!outcomeLore.trim()) return showInfo('Falta narración', 'Escribe el desenlace.');
        setArchiving(true); const res = await archiveMission(mission, outcomeCode, outcomeLore); setArchiving(false);
        if (res.ok) { setMissions(prev => prev.filter(m => m.id !== mission.id)); onMissionArchived(); setOutcomeOpen(false); }
      }} disabled={archiving} className="w-1/2 rounded-xl border border-red-700/40 bg-red-950/30 py-3 text-sm font-bold text-white uppercase">{archiving ? 'Sellando...' : 'Confirmar Sentencia'}</button></div>}>
        <div className="space-y-4">
          <select value={outcomeCode} onChange={(e) => setOutcomeCode(e.target.value as ArchiveResultCode)} className="w-full rounded-md border border-red-900/30 bg-black/40 p-3 text-white focus:outline-none"><option value="completada">Completada</option><option value="fallida">Fallida</option><option value="cancelada">Cancelada</option></select>
          <textarea value={outcomeLore} onChange={(e) => setOutcomeLore(e.target.value)} placeholder="El desenlace de la expedición..." className="w-full rounded-md border border-red-900/30 bg-black/40 p-3 text-white min-h-[120px] focus:outline-none font-serif" />
        </div>
      </PanelDialog>
    </div>
  )
}