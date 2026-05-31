'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { fetchChronicles, fetchMissions } from '@/lib/gameData'
import type { Chronicle, Mission, Profile, User } from '@/lib/types'

// Componentes
import NewsSection from './components/NewsSection'
import DMApplicationForm from './components/DMApplicantionForm'
import AuthPanel from './components/AuthPanel'
import HeroSection from './components/HeroSection'
import Navbar from './components/Navbar'
import MissionCreator from './components/MissionCreator'
import MissionCard from './components/MissionCard'
import ChronicleCard from './components/ChronicleCard'
import RegionFilter from './components/RegionFilter'
import AdminApplication from './components/AdminApplication'
import PanelDialog from './components/PanelDialog'
import NewsManager from './components/NewsManager'
import ChatSystem from './components/ChatSystem'

export default function LandingPage() {
  // --- ESTADOS ---
  const [isDM, setIsDM] = useState(false) 
  const [isAdmin, setIsAdmin] = useState(false)
  const [missions, setMissions] = useState<Mission[]>([])
  const [chronicles, setChronicles] = useState<Chronicle[]>([])
  const [loadingMissions, setLoadingMissions] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeRegion, setActiveRegion] = useState<string | null>(null)
  const [expandedMission, setExpandedMission] = useState<string | null>(null)
  const [expandedPlayers, setExpandedPlayers] = useState<string | null>(null)
  const [expandedChronicle, setExpandedChronicle] = useState<string | null>(null)

  const [verdictOpen, setVerdictOpen] = useState(false)
  const [verdictMessage, setVerdictMessage] = useState('')
  const [verdictId, setVerdictId] = useState<string | null>(null)
  const [hasUnreadVerdict, setHasUnreadVerdict] = useState(false);

  // --- LÓGICA DE DATOS ---
  const loadGameData = useCallback(async () => {
    setLoadingMissions(true)
    const [missionsData, chroniclesData] = await Promise.all([
      fetchMissions(),
      fetchChronicles(),
    ])
    setMissions(missionsData)
    setChronicles(chroniclesData)
    setLoadingMissions(false)
  }, [])

  const refreshChronicles = useCallback(async () => {
    setChronicles(await fetchChronicles())
  }, [])

  const deleteChronicle = async (id: string) => {
    try {
      const { error } = await supabase.from('chronicles').delete().eq('id', id)
      if (error) throw error
      setChronicles((prev) => prev.filter((c) => c.id !== id))
    } catch (error) {
      console.error("Error condenando la crónica al olvido:", error)
    }
  }

  // --- EFECTO 1: CARGA DE DATOS INICIAL ---
  useEffect(() => {
    loadGameData()
  }, [loadGameData])

  // --- EFECTO 2: GESTIÓN DE VEREDICTOS (CORREGIDO Y CON REALTIME) ---
  useEffect(() => {
    if (!user) return;

    const checkVerdict = async () => {
      const { data } = await supabase
        .from('dm_applications')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('notified', false)
        .neq('status', 'pending') 
        .maybeSingle();

      if (data) {
        setVerdictId(data.id);
        setHasUnreadVerdict(true);
        if (data.status === 'approved') {
          setVerdictMessage('El maestro de las almas espera grandes cosas de ti, Bienvenid@');
        } else {
          setVerdictMessage('Lo sentimos, el Maestro de la Oscuridad no requiere de tus servicios en este momento.');
        }
      }
    };

    checkVerdict();

// Dentro de page.tsx, en el useEffect de veredictos
const channel = supabase.channel(`verdict_realtime_${user.id}`)
  .on(
    'postgres_changes' as any, // Forzamos a que acepte el tipo para el build
    { 
      event: 'UPDATE', 
      table: 'dm_applications', 
      schema: 'public', // IMPORTANTE: Añadir siempre el schema para evitar este error
      filter: `user_id=eq.${user.id}` 
    }, 
    (payload: any) => { // Tipamos el payload como any para mayor compatibilidad
      if (payload.new.status !== 'pending' && !payload.new.notified) {
        checkVerdict();
      }
    }
  )
  .subscribe();

    return () => { supabase.removeChannel(channel) };
  }, [user]);
  
  const closeVerdict = async () => {
    if (verdictId) {
      // 1. Intentamos actualizar la base de datos
      const { error } = await supabase
        .from('dm_applications')
        .update({ notified: true })
        .eq('id', verdictId);
  
      if (error) {
        console.error("Error al silenciar el pergamino:", error.message);
        // Si hay error, no cerramos para que el usuario sepa que algo falló
        return; 
      }
    }
    
    // 2. Si llegamos aquí, la DB ya se actualizó. Ahora sí limpiamos la UI.
    setVerdictOpen(false);
    setHasUnreadVerdict(false);
  };

  // --- EFECTO 3: GESTIÓN DE USUARIO Y ROLES ---
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user: sessionUser } } = await supabase.auth.getUser()
      setUser(sessionUser)
  
      if (sessionUser) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', sessionUser.id)
          .single()
  
        setProfile(profileData as Profile | null)
  
        const { data: adminData } = await supabase
          .from('verified_admins')
          .select('user_id')
          .eq('user_id', sessionUser.id)
  
        const ownerStatus = !!adminData?.length
        setIsAdmin(ownerStatus)
        const dmStatus = profileData?.role === 'dm' || ownerStatus
        setIsDM(dmStatus)
      } else {
        setProfile(null)
        setIsAdmin(false)
        setIsDM(false)
      }
    }
  
    loadUser()
  
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUser()
    })
  
    return () => subscription.unsubscribe()
  }, [])

  // --- CÁLCULOS ---
  const filteredMissions = activeRegion 
    ? missions.filter(m => m.featured_regions?.includes(activeRegion))
    : missions;

  const canSeeApp = !!(user && profile?.character_sheet_url);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070707] text-[#e9e2d6]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-red-950/30 blur-3xl" />
        <div className="absolute top-24 left-10 h-72 w-72 rounded-full bg-red-900/10 blur-2xl" />
        <div className="absolute bottom-0 right-10 h-96 w-96 rounded-full bg-red-950/20 blur-3xl" />
      </div>

      {!canSeeApp ? (
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-md text-center">
            <h1 className="mb-2 font-serif text-5xl font-semibold tracking-tighter text-[#f2ead8]">NOCTHERRA</h1>
            <p className="mb-8 text-sm uppercase tracking-[0.3em] text-red-200/60">Bienvenido al continente oscuro</p>
            <AuthPanel currentProfile={profile} />
          </div>
        </div>
      ) : (
        <>
          <Navbar user={user} profile={profile} isAdmin={isAdmin} menuOpen={menuOpen} setMenuOpen={setMenuOpen} setProfile={setProfile} setUser={setUser} />

          <section className="relative mx-auto w-full max-w-6xl px-6 pb-12 pt-2">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-7">
                <HeroSection />
              </div>
              <NewsSection />
            </div>
          </section>

          <section id="misiones" className="relative mx-auto w-full max-w-6xl px-6 py-10">
            {(isAdmin || isDM) && (
              <MissionCreator profile={profile} onMissionCreated={(mission) => setMissions((prev) => [mission, ...prev])} />
            )}

            <div className="rounded-2xl border border-[#d6c7a0]/25 bg-[#1a140b]/30 p-1 shadow-[0_0_60px_rgba(220,38,38,0.06)]">
              <div className="rounded-[1.4rem] border border-[#d6c7a0]/20 bg-gradient-to-b from-[#f1e2c0]/10 to-black/30 p-6">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-red-200/70">Tablón de misiones</p>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-[#f7f0dc]">Envíos al umbral</h2>
                  </div>
                  <p className="text-sm text-[#e9e2d6]/75">Contratos abiertos y juramentos pendientes.</p>
                </div>

                <div className="mt-8">
                  <RegionFilter activeRegion={activeRegion} onSelectRegion={setActiveRegion} />
                </div>

                <div className="mt-6">
                  {loadingMissions ? (
                    <div className="text-sm text-[#e9e2d6]/75 italic">Grabando los nombres...</div>
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-3">
                      {filteredMissions.map((mission) => (
                        <MissionCard
                          key={mission.id}
                          mission={mission}
                          user={user}
                          profile={profile}
                          isAdmin={isAdmin}
                          isDM={isDM}
                          setMissions={setMissions}
                          expandedMission={expandedMission}
                          setExpandedMission={setExpandedMission}
                          expandedPlayers={expandedPlayers}
                          setExpandedPlayers={setExpandedPlayers}
                          onMissionArchived={refreshChronicles}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section id="cronicas" className="relative mx-auto w-full max-w-6xl px-6 py-10">
             <div className="rounded-2xl border border-[#e9e2d6]/10 bg-black/20 p-6">
               <h2 className="font-serif text-3xl font-semibold text-[#f7f0dc]">Memoria del borde</h2>
               <div className="mt-6 grid gap-4 lg:grid-cols-3">
                 {chronicles.map((chronicle) => (
                   <ChronicleCard key={chronicle.id} chronicle={chronicle} isAdmin={isAdmin} onDelete={deleteChronicle} expandedChronicle={expandedChronicle} setExpandedChronicle={setExpandedChronicle} />
                 ))}
               </div>
             </div>
          </section>

          <ChatSystem user={user} profile={profile} missions={missions} isAdmin={isAdmin} />
          <AdminApplication isAdmin={isAdmin} />
          <DMApplicationForm user={user} profile={profile} />
          <NewsManager isAdmin={isAdmin} />
        </>
      )}

      <footer className="relative mx-auto w-full max-w-6xl px-6 pb-10 pt-6">
        <p className="text-sm text-[#e9e2d6]/75 text-center">© {new Date().getFullYear()} · Noctherra</p>
      </footer>

      <PanelDialog 
        open={verdictOpen} 
        title="Sentencia de Maestría" 
        onClose={closeVerdict}
        footer={<button onClick={closeVerdict} className="w-full py-3 bg-red-950/40 border border-red-700/60 text-[#f2ead8] uppercase text-[10px] tracking-[0.3em] hover:bg-red-900/40 transition-all">Aceptar Veredicto</button>}
      >
        <div className="py-4 text-center font-serif italic text-red-100/90 leading-relaxed">
          "{verdictMessage}"
        </div>
      </PanelDialog>

      {hasUnreadVerdict && (
        <button 
          onClick={() => setVerdictOpen(true)}
          className="fixed bottom-6 left-6 z-[60] flex items-center gap-3 rounded-full border border-yellow-700/50 bg-black/80 px-5 py-3 shadow-[0_0_20px_rgba(234,179,8,0.3)] animate-pulse hover:scale-105 transition-all"
        >
          <span className="text-xl">📜</span>
          <div className="text-left">
            <p className="text-[9px] uppercase tracking-[0.2em] text-yellow-500/70 font-bold">Mensaje del Relicario</p>
            <p className="text-[10px] text-[#f2ead8] font-serif italic">Tu destino ha sido sellado...</p>
          </div>
        </button>
      )}
    </main>
  )
}