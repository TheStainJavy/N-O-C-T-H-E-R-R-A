'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Mission, Profile } from '@/lib/types'
import PanelDialog from './PanelDialog'
import { NOCTHERRA_REGIONS } from '@/lib/constants'

type Props = {
  profile: Profile | null
  onMissionCreated: (mission: Mission) => void
}

export default function MissionCreator({
  profile,
  onMissionCreated,
}: Props) {

  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [summary, setSummary] = useState('')
  const [currentArc, setCurrentArc] = useState('')
  const [currentStatus, setCurrentStatus] = useState('activa')
  const [featuredRegions, setFeaturedRegions] = useState<string[]>([])
  const [featuredFactions, setFeaturedFactions] = useState('')
  const [newLevel, setNewLevel] = useState(1)
  const [newMaxPlayers, setNewMaxPlayers] = useState(4)
  const [missionStart, setMissionStart] = useState('')
  const [missionEnd, setMissionEnd] = useState('')
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [creatingMission, setCreatingMission] = useState(false)
  const [showMissionCreator, setShowMissionCreator] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogTitle, setDialogTitle] = useState('')
  const [dialogMessage, setDialogMessage] = useState('')

  function showInfo(title: string, message: string) {
    setDialogTitle(title)
    setDialogMessage(message)
    setDialogOpen(true)
  }

  async function uploadCoverImage() {
    if (!coverImage) return null
    const fileName = `${Date.now()}-${coverImage.name}`
    const { error: uploadError } = await supabase.storage
      .from('leer-misiones')
      .upload(fileName, coverImage)

    if (uploadError) {
      console.error(uploadError)
      return null
    }

    const publicUrlData = supabase.storage
      .from('leer-misiones')
      .getPublicUrl(fileName)

    return publicUrlData.data.publicUrl
  }

  async function createMission() {
    // 1. VALIDACIONES PREVIAS
    if (!newTitle.trim()) return showInfo('Falta algo', 'La misión necesita un título.')
    if (!newDescription.trim()) return showInfo('Falta algo', 'La misión necesita descripción.')
    if (!missionStart) return showInfo('Falta algo', 'Debes definir cuándo inicia la expedición.')

    setCreatingMission(true)

    try {
      // 2. SUBIDA DE IMAGEN
      const imageUrl = await uploadCoverImage()

      // 3. INSERCIÓN ÚNICA EN SUPABASE
      const { data, error } = await supabase
        .from('missions')
        .insert({
          title: newTitle,
          dm_name: profile?.adventurer_name || 'DM desconocido',
          creator_id: profile?.user_id, // <--- VITAL PARA LOS PERMISOS DE DM
          summary,
          description: newDescription,
          current_arc: currentArc,
          current_status: currentStatus,
          mission_start: new Date(missionStart).toISOString(),
          mission_end: missionEnd ? new Date(missionEnd).toISOString() : null,
          featured_regions: featuredRegions,
          featured_factions: featuredFactions
            .split(',')
            .map((f) => f.trim())
            .filter(Boolean),
          cover_image: imageUrl,
          level_required: newLevel,
          max_players: newMaxPlayers,
          adventurers: [],
          applicants: [],
          mission_state: 'available',
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        onMissionCreated(data as Mission)
        showInfo('Misión publicada con éxito', 'La aventura ha quedado registrada en el tablón.')
        
        // 4. RESETEO DEL FORMULARIO
        setNewTitle('')
        setNewDescription('')
        setSummary('')
        setCurrentArc('')
        setCurrentStatus('activa')
        setFeaturedRegions([])
        setFeaturedFactions('')
        setMissionStart('')
        setMissionEnd('')
        setCoverImage(null)
        setShowMissionCreator(false)
      }
    } catch (err: any) {
      console.error("Error al crear misión:", err)
      showInfo('Error en el pergamino', 'No se pudo publicar la misión. Intenta de nuevo.')
    } finally {
      setCreatingMission(false)
    }
  }

  return (
    <div className="mb-6">
      {!showMissionCreator ? (
        <button
          onClick={() => setShowMissionCreator(true)}
          className="rounded-xl border border-red-700/40 bg-red-950/30 px-5 py-3 text-[#f2ead8] shadow-[0_0_25px_rgba(220,38,38,0.18)]"
        >
          + Agregar aventura
        </button>
      ) : (
        <div className="rounded-2xl border border-red-800/30 bg-black/30 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-[#f2ead8]">Nueva Aventura</h3>
            <button onClick={() => setShowMissionCreator(false)} className="text-sm text-red-200/70">cerrar</button>
          </div>

          <div className="mt-6 space-y-4">
            <input
              type="text"
              placeholder="Título"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full rounded-md border border-red-900/30 bg-black/40 p-3 text-white focus:outline-none focus:border-red-600"
            />

            <input
              type="text"
              placeholder="Resumen rápido (una frase)"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full rounded-md border border-red-900/30 bg-black/40 p-3 text-white focus:outline-none focus:border-red-600"
            />

            <textarea
              placeholder="Descripción completa de la misión..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="min-h-[140px] w-full rounded-md border border-red-900/30 bg-black/40 p-3 text-white focus:outline-none focus:border-red-600"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="text"
                placeholder="Arco actual"
                value={currentArc}
                onChange={(e) => setCurrentArc(e.target.value)}
                className="w-full rounded-md border border-red-900/30 bg-black/40 p-3 text-white"
              />
              <input
                type="text"
                placeholder="Estado actual"
                value={currentStatus}
                onChange={(e) => setCurrentStatus(e.target.value)}
                className="w-full rounded-md border border-red-900/30 bg-black/40 p-3 text-white"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 text-stone-400">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-red-200/60">Inicio de expedición</label>
                <input
                  type="datetime-local"
                  value={missionStart}
                  onChange={(e) => setMissionStart(e.target.value)}
                  className="w-full rounded-md border border-red-900/30 bg-black/40 p-3 text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-red-200/60">Fin estimado</label>
                <input
                  type="datetime-local"
                  value={missionEnd}
                  onChange={(e) => setMissionEnd(e.target.value)}
                  className="w-full rounded-md border border-red-900/30 bg-black/40 p-3 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-red-200/60">Regiones de la Expedición</label>
              <div className="grid grid-cols-2 gap-2 rounded-md border border-red-900/30 bg-black/40 p-3 sm:grid-cols-4">
                {NOCTHERRA_REGIONS.map((region) => {
                  const isSelected = featuredRegions.includes(region.id);
                  return (
                    <button
                      key={region.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setFeaturedRegions(featuredRegions.filter((r) => r !== region.id));
                        } else {
                          setFeaturedRegions([...featuredRegions, region.id]);
                        }
                      }}
                      className={`text-left text-[10px] uppercase tracking-tighter p-1 transition-colors ${
                        isSelected ? 'text-red-400' : 'text-[#e9e2d6]/40 hover:text-[#e9e2d6]/80'
                      }`}
                    >
                      {isSelected ? '●' : '○'} {region.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <input
              type="text"
              placeholder="Facciones (separadas por comas)"
              value={featuredFactions}
              onChange={(e) => setFeaturedFactions(e.target.value)}
              className="w-full rounded-md border border-red-900/30 bg-black/40 p-3 text-white"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs uppercase text-stone-500">Nivel requerido</label>
                <input
                  type="number"
                  value={newLevel}
                  onChange={(e) => setNewLevel(Number(e.target.value))}
                  className="w-full rounded-md border border-red-900/30 bg-black/40 p-3 text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase text-stone-500">Cupos máximos</label>
                <input
                  type="number"
                  value={newMaxPlayers}
                  onChange={(e) => setNewMaxPlayers(Number(e.target.value))}
                  className="w-full rounded-md border border-red-900/30 bg-black/40 p-3 text-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase text-stone-500">Imagen de portada</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && setCoverImage(e.target.files[0])}
                className="text-sm text-[#e9e2d6] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-red-900/20 file:text-red-200"
              />
            </div>

            <button
              onClick={createMission}
              disabled={creatingMission}
              className="w-full rounded-xl border border-red-700/40 bg-red-950/40 px-6 py-4 text-[#f2ead8] font-bold uppercase tracking-widest hover:bg-red-900/40 transition-all disabled:opacity-50"
            >
              {creatingMission ? 'Grabando en el Relicario...' : 'Subir aventura'}
            </button>
          </div>
        </div>
      )}

      <PanelDialog
        open={dialogOpen}
        title={dialogTitle}
        onClose={() => setDialogOpen(false)}
        footer={
          <button
            type="button"
            onClick={() => setDialogOpen(false)}
            className="w-full rounded-xl border border-red-700/40 bg-red-950/20 px-4 py-3 text-sm text-[#f2ead8] transition hover:bg-red-900/20"
          >
            Aceptar
          </button>
        }
      >
        <p className="text-sm text-[#e9e2d6]/80">{dialogMessage}</p>
      </PanelDialog>
    </div>
  )
}