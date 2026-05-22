'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AuthPanel from './components/AuthPanel'

type Mission = {
  id: string

  title: string
  summary: string | null
  description: string

  current_arc: string | null
  current_status: string | null

  featured_regions: string[] | null
  featured_factions: string[] | null

  cover_image: string | null

  level_required: number | null
  mission_state: string
  max_players: number | null

  created_at?: string

  adventurers: string[] | null

 
  mission_start: string | null
mission_end: string | null

dm_name: string | null
}

type Chronicle = {

  id: string

  mission_title: string
  mission_summary: string | null
  mission_description: string

  result: string

  current_arc: string | null
  current_status: string | null

  featured_regions: string[] | null
  featured_factions: string[] | null

  cover_image: string | null

  level_required: number | null
  max_players: number | null

  created_at?: string

  adventurers: string[] | null

  mission_start: string | null
mission_end: string | null

dm_name: string | null
}


export default function LandingPage() {

  const [missions, setMissions] = useState<Mission[]>([])

  const [chronicles, setChronicles] = useState<Chronicle[]>([])

  const [expandedMission, setExpandedMission] = useState<string | null>(null)
  const [expandedPlayers, setExpandedPlayers] = useState<string | null>(null)

  const [loadingMissions, setLoadingMissions] = useState(true)
   
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)  

  const [isAdmin, setIsAdmin] = useState(false)

  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newLevel, setNewLevel] = useState(1)
  const [newMaxPlayers, setNewMaxPlayers] = useState(4)
  const [creatingMission, setCreatingMission] = useState(false)

  const [showMissionCreator, setShowMissionCreator] = useState(false)

  const [summary, setSummary] = useState('')
  const [currentArc, setCurrentArc] = useState('')
  const [currentStatus, setCurrentStatus] = useState('activa')

  const [featuredRegions, setFeaturedRegions] = useState('')
  const [featuredFactions, setFeaturedFactions] = useState('')

  const [missionStart, setMissionStart] = useState('')
const [missionEnd, setMissionEnd] = useState('')

  const [coverImage, setCoverImage] = useState<File | null>(null)

  const [expandedChronicle, setExpandedChronicle] =
  useState<string | null>(null)



  useEffect(() => {
    let mounted = true

    const fetchMissions = async () => {

      setLoadingMissions(true)

      const { data, error } = await supabase
      .from('missions')
      .select('*')
      .order('created_at', { ascending: false })

      if (!mounted) return

      if (error) {
        console.error('Error cargando misiones:', JSON.stringify(error, null, 2))
        setMissions([])
        setLoadingMissions(false)
        return
      }

      setMissions(data ?? [])
      setLoadingMissions(false)


      const { data: chroniclesData } = await supabase
      .from('chronicles')
      .select('*')
      .order('created_at', { ascending: false })
    
    setChronicles(chroniclesData ?? [])

    }

    fetchMissions()

    return () => {
      mounted = false
    }

    
  }, [])

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
  
      setUser(user)
  
      if (user) {

        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()
      
        setProfile(data)
      
        const { data: adminData, error: adminError } = await supabase
        .from('verified_admins')
        .select('*')
        .eq('user_id', user.id)
      
      console.log('ADMIN CHECK:', adminData)
      console.log('ADMIN ERROR:', adminError)
      console.log('USER ID:', user.id)
      
      setIsAdmin(!!adminData && adminData.length > 0)
      
      } else {
      
        setIsAdmin(false)
      }
    }
  
    loadUser()
  
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null)
        setProfile(null)
      }
    
      loadUser()
    })
  
    return () => {
      subscription.unsubscribe()
    }
  }, [])

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

    if (!newTitle.trim()) {
      alert('La misión necesita un título.')
      return
    }
  
    if (!newDescription.trim()) {
      alert('La misión necesita una descripción.')
      return
    }
  
    setCreatingMission(true)
  
    const imageUrl = await uploadCoverImage()

    const { error } = await supabase
      .from('missions')
      .insert({
        title: newTitle,

        dm_name: profile?.adventurer_name || 'DM desconocido',

        summary,
        description: newDescription,
      
        current_arc: currentArc,
        current_status: currentStatus,

        mission_start: new Date(missionStart).toISOString(),
        mission_end: new Date(missionEnd).toISOString(),
        
      
        featured_regions: featuredRegions
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean),
      
        featured_factions: featuredFactions
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean),
      
        cover_image: imageUrl,
      
        level_required: newLevel,
        max_players: newMaxPlayers,
 
        adventurers: [],
      
        mission_state: 'available',
      })

      
  
    if (error) {
      console.error(
        JSON.stringify(error, null, 2)
      )
      alert('No se pudo crear la misión.')
      setCreatingMission(false)
      return
    }
  
    alert('Misión creada.')
  
    setNewTitle('')
    setNewDescription('')
    setNewLevel(1)
    setNewMaxPlayers(4)
  
    location.reload()
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070707] text-[#e9e2d6]">
      {/* Fondo atmosférico */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-red-950/30 blur-3xl" />
        <div className="absolute top-24 left-10 h-72 w-72 rounded-full bg-red-900/10 blur-2xl" />
        <div className="absolute bottom-0 right-10 h-96 w-96 rounded-full bg-red-950/20 blur-3xl" />
        {/* grano sutil */}
        <div className="absolute inset-0 opacity-[0.10] mix-blend-overlay">
          <svg className="h-full w-full" viewBox="0 0 300 300" preserveAspectRatio="none">
            <filter id="noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="300" height="300" filter="url(#noise)" opacity="0.6" />
          </svg>
        </div>
      </div>

      {/* Nave / marco */}
      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md border border-red-700/60 bg-red-950/30 shadow-[0_0_22px_rgba(220,38,38,0.25)]" />
          <div className="leading-tight">
            <p className="text-xs uppercase tracking-[0.28em] text-red-200/80">Relicario</p>
            <p className="text-sm text-[#e9e2d6]/90">Crónicas del Continente</p>
          </div>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          <a className="text-sm text-[#e9e2d6]/80 hover:text-[#fff] transition" href="#misiones">
            Misiones
          </a>
          <a className="text-sm text-[#e9e2d6]/80 hover:text-[#fff] transition" href="#cronicas">
            Crónicas
          </a>
          <a className="text-sm text-[#e9e2d6]/80 hover:text-[#fff] transition" href="#adventureres">
            Adventureros
          </a>
        </nav>

        <div className="relative flex items-center gap-3">
  {!user ? (
    <div className="hidden sm:block rounded-full border border-red-800/40 px-3 py-1 text-xs text-red-100/70 shadow-[0_0_18px_rgba(220,38,38,0.20)]">
      Luz mínima. Fuego antiguo.
    </div>
  ) : (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-3 rounded-full border border-green-700/40 bg-green-950/20 px-4 py-2 text-sm text-green-100 shadow-[0_0_20px_rgba(34,197,94,0.20)]"
      >
        <div className="flex items-center gap-2">

<span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.9)]" />

{isAdmin && (
  <span
    title="Administrador"
    className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.95)]"
  />
)}

</div>
        <span>
          {profile?.adventurer_name ?? 'Aventurero'}
        </span>
      </button>

      {menuOpen && (
        <div className="absolute right-0 mt-3 w-56 rounded-xl border border-[#e9e2d6]/10 bg-[#090909] p-2 shadow-2xl z-50">
    
        {/* Cambiar nombre */}
        <button
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-[#e9e2d6]/80 transition hover:bg-white/5"
          onClick={async () => {

            const nuevoNombre = prompt(
              'Ingresa tu nuevo nombre de aventurero'
            )
          
            if (!nuevoNombre) return
          
            if (nuevoNombre.trim().length < 3) {
              alert('Nombre demasiado corto.')
              return
            }
          
            // verificar duplicado
          
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('adventurer_name', nuevoNombre.trim())
              .maybeSingle()
          
            if (existingProfile) {
              alert('Ese nombre ya está ocupado.')
              return
            }
          
            const { error } = await supabase
              .from('profiles')
              .update({
                adventurer_name: nuevoNombre.trim(),
              })
              .eq('user_id', user.id)
          
            if (error) {
              console.error(
                JSON.stringify(error, null, 2)
              )
              alert('No se pudo cambiar el nombre.')
              return
            }
          
            setProfile({
              ...profile,
              adventurer_name: nuevoNombre.trim(),
            })
          
            setMenuOpen(false)
          }}
        >
          Cambiar nombre
        </button>
    
        {/* Cerrar sesión */}
        <button
          className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-red-300 transition hover:bg-red-950/30"
          onClick={async () => {
            const { error } = await supabase.auth.signOut()
    
            if (error) {
              console.error(
                JSON.stringify(error, null, 2)
              )
              alert('No se pudo cerrar sesión.')
              return
            }
    
            // limpia estados
            setUser(null)
            setProfile(null)
            setMenuOpen(false)
          }}
        >
          Cerrar sesión
        </button>
      </div>
    )}
    </div>
  )}
</div>
      </header>

      {/* Hero */}






      <section className="relative mx-auto w-full max-w-6xl px-6 pb-12 pt-2">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-3 rounded-full border border-red-800/40 bg-red-950/20 px-4 py-2 shadow-[0_0_24px_rgba(220,38,38,0.25)]">
              <span className="h-2 w-2 rounded-full bg-red-400 shadow-[0_0_18px_rgba(248,113,113,0.9)]" />
              <p className="text-xs uppercase tracking-[0.26em] text-red-100/80">
                Oscuridad de Noctherra
              </p>
            </div>

            <h1 className="mt-6 font-serif text-6xl font-semibold tracking-wide text-[#f2ead8] drop-shadow-sm sm:text-7xl">
              NOCTHERRA
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-[#e9e2d6]/85 sm:text-lg">
              El continente recuerda a quienes sobreviven.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#misiones"
                className="rounded-md border border-red-700/70 bg-red-950/30 px-5 py-3 text-sm font-medium text-[#f7f0dc] shadow-[0_0_24px_rgba(220,38,38,0.25)] transition hover:bg-red-900/25"
              >
                Ver el tablero de misiones
              </a>
              <a
                href="#adventureres"
                className="rounded-md border border-[#e9e2d6]/15 bg-[#0a0a0a]/20 px-5 py-3 text-sm font-medium text-[#e9e2d6]/80 transition hover:border-red-700/40 hover:text-[#f2ead8]"
              >
                Conocer leyendas
              </a>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-red-800/30 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-red-200/70">Juramento</p>
                <p className="mt-1 text-sm text-[#e9e2d6]/85">Sólo la voluntad abre puertas.</p>
              </div>
              <div className="rounded-lg border border-[#e9e2d6]/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-red-200/60">Sombra</p>
                <p className="mt-1 text-sm text-[#e9e2d6]/85">Cada paso deja una crónica.</p>
              </div>
            </div>
          </div>

          {/* Tarjeta “sello” (estética) */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl border border-red-800/35 bg-gradient-to-b from-red-950/20 to-black/40 p-6 shadow-[0_0_70px_rgba(220,38,38,0.10)]">
              <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-red-900/20 blur-2xl" />
              <div className="absolute -bottom-12 -right-10 h-44 w-44 rounded-full bg-red-950/25 blur-3xl" />

              <div className="relative">
                <p className="text-xs uppercase tracking-[0.28em] text-red-200/75">Manuscrito sellado</p>
                <p className="mt-2 text-sm text-[#e9e2d6]/85">
                  Un continente que mira desde la ruina: el jugador se vuelve historia.
                </p>

                {/* mini “board” preview */}
                <div className="mt-6 rounded-xl border border-red-800/25 bg-[#0b0b0b]/35 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-red-100/70">Hoy</p>
                  <div className="mt-3 space-y-3">
                    <div className="rounded-lg border border-[#e9e2d6]/10 bg-black/20 p-3">
                      <p className="text-sm font-medium text-[#f2ead8]">Rastros en el polvo</p>
                      <p className="text-xs text-[#e9e2d6]/70">Cuota: urgente · Estado: disponible</p>
                    </div>
                    <div className="rounded-lg border border-[#e9e2d6]/10 bg-black/20 p-3">
                      <p className="text-sm font-medium text-[#f2ead8]">Ceniza bajo la luna</p>
                      <p className="text-xs text-[#e9e2d6]/70">Cuota: discreta · Estado: in_progress</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-3 text-xs text-[#e9e2d6]/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400 shadow-[0_0_16px_rgba(248,113,113,0.9)]" />
                  <span>Lectura pública. La verdad siempre cuesta.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Parches tipo pergamino */}
        <div className="mt-10 hidden h-10 w-full items-center justify-center lg:flex">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-red-700/30 to-transparent" />
        </div>
      </section>




      {!user && (
  <div className="mx-auto w-full max-w-6xl px-6 py-6">
    <AuthPanel />
  </div>
)}




      {/* Misiones (pergamino) */}
      <section id="misiones" className="relative mx-auto w-full max-w-6xl px-6 py-10">

      {isAdmin && (

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
        <h3 className="text-2xl font-semibold text-[#f2ead8]">
          Nueva Aventura
        </h3>

        <button
          onClick={() => setShowMissionCreator(false)}
          className="text-sm text-red-200/70"
        >
          cerrar
        </button>
      </div>

      <div className="mt-6 space-y-4">

        <input
          type="text"
          placeholder="Título"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="w-full rounded-md border border-red-900/30 bg-black/40 p-3 text-white"
        />

        <input
          type="text"
          placeholder="Resumen"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="w-full rounded-md border border-red-900/30 bg-black/40 p-3 text-white"
        />

        <textarea
          placeholder="Descripción"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          className="min-h-[140px] w-full rounded-md border border-red-900/30 bg-black/40 p-3 text-white"
        />

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
       
       
       <label className="mb-2 block text-sm text-[#e9e2d6]/70">
  Hora de inicio de la misión
</label> 
        <input
  type="datetime-local"
  value={missionStart}
  onChange={(e) => setMissionStart(e.target.value)}
/>
<label className="mb-2 block text-sm text-[#e9e2d6]/70">
  Hora estimada de finalización
</label>
<input
  type="datetime-local"
  value={missionEnd}
  onChange={(e) => setMissionEnd(e.target.value)}
/>
        <input
          type="text"
          placeholder="Regiones destacadas (separadas por coma)"
          value={featuredRegions}
          onChange={(e) => setFeaturedRegions(e.target.value)}
          className="w-full rounded-md border border-red-900/30 bg-black/40 p-3 text-white"
        />

        <input
          type="text"
          placeholder="Facciones destacadas (separadas por coma)"
          value={featuredFactions}
          onChange={(e) => setFeaturedFactions(e.target.value)}
          className="w-full rounded-md border border-red-900/30 bg-black/40 p-3 text-white"
        />

<div className="grid gap-4 md:grid-cols-2">

  <div>
    <label className="mb-2 block text-sm text-[#e9e2d6]/70">
      Nivel requerido
    </label>

    <input
      type="number"
      placeholder="Nivel requerido"
      value={newLevel}
      onChange={(e) => setNewLevel(Number(e.target.value))}
      className="w-full rounded-md border border-red-900/30 bg-black/40 p-3 text-white"
    />
  </div>

  <div>
    <label className="mb-2 block text-sm text-[#e9e2d6]/70">
      Cupos máximos
    </label>

    <input
      type="number"
      placeholder="Máximo de jugadores"
      value={newMaxPlayers}
      onChange={(e) => setNewMaxPlayers(Number(e.target.value))}
      className="w-full rounded-md border border-red-900/30 bg-black/40 p-3 text-white"
    />
  </div>

</div>

        <div>

          <label className="mb-2 block text-sm text-[#e9e2d6]/70">
            Imagen de portada
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setCoverImage(e.target.files[0])
              }
            }}
            className="text-sm text-[#e9e2d6]"
          />

        </div>

        <button
          onClick={createMission}
          disabled={creatingMission}
          className="rounded-xl border border-red-700/40 bg-red-950/40 px-6 py-3 text-[#f2ead8]"
        >
          Subir aventura
        </button>

      </div>
    </div>

  )}

</div>
)}

        <div className="rounded-2xl border border-[#d6c7a0]/25 bg-[#1a140b]/30 p-1 shadow-[0_0_60px_rgba(220,38,38,0.06)]">
          <div className="rounded-[1.4rem] border border-[#d6c7a0]/20 bg-gradient-to-b from-[#f1e2c0]/10 to-black/30 p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-red-200/70">Tablero de misiones</p>
                <h2 className="mt-2 font-serif text-3xl font-semibold text-[#f7f0dc]">
                  Envíos al umbral
                </h2>
              </div>
              <p className="text-sm text-[#e9e2d6]/75">
                Vista previa del pergamino: misiones abiertas y sus participantes.
              </p>
            </div>

            
              {/* Cards dinámicas */}    
              <div className="mt-6">
             {loadingMissions ? (
             <div className="rounded-xl border border-[#d6c7a0]/20 bg-[#0a0a0a]/30 p-5 text-sm text-[#e9e2d6]/75">
              Grabando los nombres en el pergamino…
             </div>
             ) : missions.length === 0 ? (
             <div className="rounded-xl border border-[#d6c7a0]/20 bg-[#0a0a0a]/30 p-5 text-sm text-[#e9e2d6]/75">
              No hay misiones disponibles actualmente.
             </div>
              ) : (
              <div className="grid gap-4 lg:grid-cols-3">
              {missions.map((m) => {
             const estadoReadable: Record<string, string> = {
              available: 'Disponible',
             in_progress: 'En progreso',
             completed: 'Completada',
             closed: 'Cerrada',
             cancelled: 'Cancelada',
             missing: 'Desaparecida',
              forbidden: 'Prohibida',
             }

            return (

           <div
            key={m.id}
            className="overflow-hidden rounded-2xl border border-[#d6c7a0]/15 bg-[#0a0a0a]/40 shadow-[0_0_30px_rgba(0,0,0,0.35)] transition hover:border-red-700/30"
           >
        
            {/* PORTADA */}
        
            <button
              onClick={() =>
                setExpandedMission(
                  expandedMission === m.id ? null : m.id
                )
              }
              className="group relative block w-full text-left"
            >
        
              <div className="relative h-64 overflow-hidden">
        
              <img
  src={
    m.cover_image ||
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=1600&auto=format&fit=crop'
  }
  alt={m.title}
  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
  onError={(e) => {
    e.currentTarget.src =
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=1600&auto=format&fit=crop'
  }}
/>
        
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        
                <div className="absolute bottom-0 left-0 w-full p-5">
        
                  <div className="flex items-center justify-between gap-3">
        
                    <h3 className="text-2xl font-semibold text-[#f8f2df]">
                      {m.title}
                    </h3>
        
                    <span className="rounded-full border border-red-700/30 bg-red-950/30 px-3 py-1 text-xs text-red-100/80">
                      {estadoReadable[m.mission_state] ?? m.mission_state}
                    </span>
        
                  </div>
        
                  <p className="mt-2 max-w-2xl text-sm text-[#e9e2d6]/80">
                    {m.summary || 'Sin resumen registrado.'}
                  </p>
                  {m.dm_name && (

<div className="mt-3 inline-flex items-center rounded-full border border-yellow-700/30 bg-yellow-950/20 px-3 py-1 text-xs text-yellow-200 shadow-[0_0_20px_rgba(234,179,8,0.15)]">

  DM:
  {' '}
  {m.dm_name}

</div>

)}
                </div>
        
              </div>
        
            </button>
        
            {/* EXPANDIDO */}
        
            {expandedMission === m.id && (
        
              <div className="space-y-5 p-6">
        
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-red-200/60">
                    Descripción
                  </p>
        
                  <p className="mt-2 text-sm leading-relaxed text-[#e9e2d6]/82">
                    {m.description}
                  </p>

                  {m.mission_start && (

<div>

  <p className="text-xs uppercase tracking-[0.2em] text-red-200/60">
  Horario de misión
  </p>

  <p className="mt-2 text-sm text-[#e9e2d6]/80">

Empieza:
{' '}

{new Date(m.mission_start).toLocaleString([], {
  dateStyle: 'medium',
  timeStyle: 'short',
})}

</p>

{m.mission_end && (

<p className="mt-1 text-sm text-[#e9e2d6]/60">

  Finaliza:
  {' '}

  {new Date(m.mission_end).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  })}

</p>

)}

</div>

)}

                </div>
        
                <div className="grid gap-4 md:grid-cols-2">
        
                  <div className="rounded-xl border border-[#e9e2d6]/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-red-200/60">
                      Nivel requerido
                    </p>
        
                    <p className="mt-2 text-lg text-[#f8f2df]">
                      {m.level_required ?? 1}
                    </p>
                  </div>
        
                  <div className="rounded-xl border border-[#e9e2d6]/10 bg-black/20 p-4">

<button
onClick={() =>
  setExpandedPlayers(
    expandedPlayers === m.id
      ? null
      : m.id
  )
}
  className="w-full text-left"
>

  <p className="text-xs uppercase tracking-[0.2em] text-red-200/60">
    Cupos disponibles
  </p>

  <p className="mt-2 text-lg text-[#f8f2df]">
    {(m.adventurers?.length || 0)}/
    {m.max_players ?? 0}
  </p>

</button>

{expandedPlayers === m.id && (

  <div className="mt-4 border-t border-white/10 pt-4">

    <p className="text-sm text-[#e9e2d6]/70">
      Aventureros ligados al juramento
    </p>

    <div className="mt-3 space-y-2">

      {m.adventurers?.length ? (

        m.adventurers.map((name) => (

          <div
            key={name}
            className="rounded-lg border border-red-900/20 bg-red-950/10 px-3 py-2 text-sm text-[#f2ead8]"
          >
            {name}
          </div>

        ))

      ) : (

        <p className="text-sm text-[#e9e2d6]/50">
          Nadie ha aceptado esta misión todavía.
        </p>

      )}

    </div>

  </div>

)}

</div>
        
                </div>
        
                {m.current_arc && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-red-200/60">
                      Arco actual
                    </p>
        
                    <p className="mt-2 text-sm text-[#e9e2d6]/80">
                      {m.current_arc}
                    </p>
                  </div>
                )}
        
                {m.current_status && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-red-200/60">
                      Estado actual
                    </p>
        
                    <p className="mt-2 text-sm text-[#e9e2d6]/80">
                      {m.current_status}
                    </p>
                  </div>
                )}
        
                {m.featured_regions?.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-red-200/60">
                      Regiones destacadas
                    </p>
        
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.featured_regions.map((r: string) => (
                        <span
                          key={r}
                          className="rounded-full border border-red-800/30 bg-red-950/20 px-3 py-1 text-xs text-red-100/80"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
        
                {m.featured_factions?.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-red-200/60">
                      Facciones destacadas
                    </p>
        
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.featured_factions.map((f: string) => (
                        <span
                          key={f}
                          className="rounded-full border border-[#e9e2d6]/10 bg-black/20 px-3 py-1 text-xs text-[#f2ead8]"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

{user && !isAdmin && (

(m.adventurers || []).includes(
  profile?.adventurer_name
) ? (

  <button
  onClick={async () => {

    const updatedAdventurers = (
      m.adventurers || []
    ).filter(
      (a) => a !== profile.adventurer_name
    )
  
    const { error } = await supabase
      .from('missions')
      .update({
        adventurers: updatedAdventurers,
      })
      .eq('id', m.id)
  
    if (error) {
      console.error(
        JSON.stringify(error, null, 2)
      )
      alert('No se pudo abandonar la misión.')
      return
    }
  
    setMissions((prev) =>
      prev.map((mission) =>
        mission.id === m.id
          ? {
              ...mission,
              adventurers: updatedAdventurers,
            }
          : mission
      )
    )
  
    alert('Has abandonado el juramento.')
  
  }}
    className="w-full rounded-xl border border-red-900/30 bg-black/30 px-4 py-3 text-sm text-red-200/80 transition hover:bg-red-950/20"
  >
    Abandonar juramento
  </button>

) : (

  <button
    onClick={async () => {

      if (!profile?.adventurer_name) {
        alert('Necesitas un nombre de aventurero.')
        return
      }

      const currentAdventurers =
        m.adventurers || []

      if (
        currentAdventurers.length >=
        (m.max_players || 0)
      ) {
        alert('No hay cupos disponibles.')
        return
      }

      const updatedAdventurers = [
        ...currentAdventurers,
        profile.adventurer_name,
      ]

      const { error } = await supabase
        .from('missions')
        .update({
          adventurers: updatedAdventurers,
        })
        .eq('id', m.id)

      if (error) {
        console.error(
          JSON.stringify(error, null, 2)
        )
        alert('No se pudo unir a la misión.')
        return
      }

      setMissions((prev) =>
        prev.map((mission) =>
          mission.id === m.id
            ? {
                ...mission,
                adventurers: updatedAdventurers,
              }
            : mission
        )
      )

      alert('Tu nombre quedó ligado al juramento.')

    }}
    className="w-full rounded-xl border border-red-700/30 bg-red-950/30 px-4 py-3 text-sm text-[#f2ead8] transition hover:bg-red-900/20"
  >
    Atarme a este juramento
  </button>

)

)}


        {isAdmin && (

<button
  onClick={async () => {

    const result = prompt(
      'Resultado de la misión:\n\ncompletada\nfallida\ncancelada'
    )

    if (!result) return

    const normalized = result.toLowerCase().trim()

    if (
      normalized !== 'completada' &&
      normalized !== 'fallida' &&
      normalized !== 'cancelada'
    ) {
      alert('Resultado inválido.')
      return
    }

    // guardar en crónicas

    const { error: chronicleError } = await supabase
      .from('chronicles')
      .insert({

        mission_start: m.mission_start,
        mission_end: m.mission_end,
        
        dm_name: m.dm_name,

        mission_title: m.title,
        mission_summary: m.summary,
        mission_description: m.description,

        result: normalized,

        current_arc: m.current_arc,
        current_status: m.current_status,

        featured_regions: m.featured_regions,
        featured_factions: m.featured_factions,

        cover_image: m.cover_image,

        level_required: m.level_required,
        max_players: m.max_players,
        adventurers: m.adventurers,

        mission_start: m.mission_start,
mission_end: m.mission_end,

dm_name: m.dm_name,
      })

    if (chronicleError) {
      console.error(chronicleError)
      alert('No se pudo mover a crónicas.')
      return
    }

    // borrar misión

    const { error: deleteError } = await supabase
      .from('missions')
      .delete()
      .eq('id', m.id)

    if (deleteError) {
      console.error(deleteError)
      alert('La misión pasó a crónicas, pero no se borró.')
      return
    }

    alert('Aventura archivada en crónicas.')

    location.reload()

  }}
  className="w-full rounded-xl border border-red-700/30 bg-red-950/20 px-4 py-3 text-sm text-red-100 transition hover:bg-red-900/20"
>
  Aventura terminada
</button>

)}
              </div>
        
            )}
        
          </div>
        
        )
      })}
    </div>
  )}
</div>


            </div>

            <p className="mt-6 text-xs text-[#e9e2d6]/60">
              Nota: esta es una maqueta visual del pergamino. Conectaremos datos desde tu tablero cuando montemos el MVP completo.
            </p>
          </div>
        
      </section>

      {/* Crónicas */}
      <section id="cronicas" className="relative mx-auto w-full max-w-6xl px-6 py-10">
        <div className="rounded-2xl border border-[#e9e2d6]/10 bg-black/20 p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-red-200/70">Crónicas</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-[#f7f0dc]">
                Memoria del borde
              </h2>
            </div>
            <p className="text-sm text-[#e9e2d6]/75">
              Fragmentos recientes: expediciones, pérdidas y decisiones.
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
         
          {chronicles.map((c) => (

<div
  key={c.id}
  className="overflow-hidden rounded-xl border border-[#e9e2d6]/10 bg-[#0a0a0a]/30 transition hover:border-red-700/30 hover:bg-black/30"
>
<button
  onClick={() =>
    setExpandedChronicle(
      expandedChronicle === c.id
        ? null
        : c.id
    )
  }
  className="block w-full text-left p-5"
>

  <div className="overflow-hidden rounded-lg">

    <img
      src={
        c.cover_image ||
        'https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=1600&auto=format&fit=crop'
      }
      alt={c.mission_title}
      className="h-48 w-full object-cover"
    />

  </div>

  <div className="mt-4 flex items-center justify-between">

    <h3 className="text-lg font-semibold text-[#f2ead8]">
      {c.mission_title}
    </h3>

    <span className="rounded-full border border-red-800/30 bg-red-950/20 px-3 py-1 text-[11px] text-red-100/80">
      {c.result}
    </span>

  </div>

  <p className="mt-3 text-sm text-[#e9e2d6]/80">
    {c.mission_summary}
  </p>

  <p className="mt-4 text-sm leading-relaxed text-[#e9e2d6]/72">
    {c.mission_description}
  </p>

  {expandedChronicle === c.id && (

<div className="mt-5 space-y-5 border-t border-white/10 pt-5">

  {/* HORARIO */}

  {c.mission_start && (

    <div>

      <p className="text-xs uppercase tracking-[0.2em] text-red-200/60">
        Horario de expedición
      </p>

      <p className="mt-2 text-sm text-[#e9e2d6]/80">

        Empieza:
        {' '}

        {new Date(c.mission_start).toLocaleString([], {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}

      </p>

      {c.mission_end && (

        <p className="mt-1 text-sm text-[#e9e2d6]/60">

          Finaliza:
          {' '}

          {new Date(c.mission_end).toLocaleString([], {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}

        </p>

      )}

    </div>

  )}

  {/* DM */}

  {c.dm_name && (

    <div>

      <p className="text-xs uppercase tracking-[0.2em] text-yellow-300/70">
        Dungeon Master
      </p>

      <p className="mt-2 text-sm text-yellow-200">
        {c.dm_name}
      </p>

    </div>

  )}

  {/* REGIONES */}

  {c.featured_regions?.length > 0 && (

    <div>

      <p className="text-xs uppercase tracking-[0.2em] text-red-200/60">
        Regiones involucradas
      </p>

      <div className="mt-3 flex flex-wrap gap-2">

        {c.featured_regions.map((r) => (

          <span
            key={r}
            className="rounded-full border border-red-800/30 bg-red-950/20 px-3 py-1 text-xs text-red-100/80"
          >
            {r}
          </span>

        ))}

      </div>

    </div>

  )}

  {/* FACCIONES */}

  {c.featured_factions?.length > 0 && (

    <div>

      <p className="text-xs uppercase tracking-[0.2em] text-red-200/60">
        Facciones involucradas
      </p>

      <div className="mt-3 flex flex-wrap gap-2">

        {c.featured_factions.map((f) => (

          <span
            key={f}
            className="rounded-full border border-[#e9e2d6]/10 bg-black/20 px-3 py-1 text-xs text-[#f2ead8]"
          >
            {f}
          </span>

        ))}

      </div>

    </div>

  )}

</div>

)}

  </button>


  {isAdmin && (

<button
  onClick={async () => {

    const confirmDelete = confirm(
      '¿Olvidar esta misión permanentemente?\n\nEsta acción no puede deshacerse.'
    )

    if (!confirmDelete) return

    const { error } = await supabase
      .from('chronicles')
      .delete()
      .eq('id', c.id)

    if (error) {
      console.error(
        JSON.stringify(error, null, 2)
      )
      alert('No se pudo eliminar la crónica.')
      return
    }

    setChronicles(
      chronicles.filter((chronicle) => chronicle.id !== c.id)
    )

    alert('La misión fue olvidada.')

  }}
  className="mt-5 w-full rounded-xl border border-red-900/30 bg-black/30 px-4 py-3 text-sm text-red-200/80 transition hover:bg-red-950/20"
>
  Olvidar misión
</button>

)}
{c.adventurers?.length > 0 && (

<div className="mt-5">

  <p className="text-xs uppercase tracking-[0.2em] text-red-200/60">
  Aventureros contratados
  </p>

  <div className="mt-3 flex flex-wrap gap-2">

    {c.adventurers.map((name) => (

      <span
        key={name}
        className="rounded-full border border-red-800/30 bg-red-950/20 px-3 py-1 text-xs text-red-100/80"
      >
        {name}
      </span>

    ))}

  </div>

</div>

)}
</div>

))}
          </div>
        </div>
      </section>

      {/* Legendary adventurers */}
      <section id="adventureres" className="relative mx-auto w-full max-w-6xl px-6 py-10">
        <div className="rounded-2xl border border-red-800/25 bg-gradient-to-b from-red-950/10 to-black/25 p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-red-200/70">Legendarios</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-[#f7f0dc]">
                Adventureros que persisten
              </h2>
            </div>
            <p className="text-sm text-[#e9e2d6]/75">
              Leyendas vivas, perdidas y transformadas por la noche.
            </p>
          </div>

        
        </div>
      </section>

      {/* Footer */}
      <footer className="relative mx-auto w-full max-w-6xl px-6 pb-10 pt-6">
        <div className="rounded-2xl border border-[#e9e2d6]/10 bg-black/20 p-6">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <p className="text-sm text-[#e9e2d6]/75">
              © {new Date().getFullYear()} · Noctherra · Todos los relatos arden en la sombra.
            </p>
            <p className="text-sm font-medium text-red-200/70">
              {`TheStainJavy`}
            </p>
          </div>

          <div className="mt-4 text-xs text-[#e9e2d6]/55">
            Hecho para quienes sobreviven: lectura pública, decisiones bajo juicio.
          </div>
        </div>
      </footer>
    </main>
  )
}