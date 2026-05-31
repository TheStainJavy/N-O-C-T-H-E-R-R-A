'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import PanelDialog from './PanelDialog'

export default function AdminApplication({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false)
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchApps = async () => {
    if (!isAdmin) return;
    const { data, error } = await supabase
      .from('dm_applications')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (data) setApps(data);
  };

  useEffect(() => {
    if (isAdmin) fetchApps()
  }, [isAdmin])

  const handleDecision = async (app: any, decision: 'approved' | 'rejected') => {
    setLoading(true);

    const GLOBAL_CHAT_ID = '00000000-0000-0000-0000-000000000000';
    const SYSTEM_ID = '00000000-0000-0000-0000-000000000001';

    try {
      // 1. IMPORTANTE: notified: false para que le salga el pergamino flotante en page.tsx
      const { error: updateError } = await supabase
        .from('dm_applications')
        .update({ 
          status: decision, 
          notified: false // <--- Esto dispara la notificación 📜
        })
        .eq('id', app.id);
  
      if (updateError) throw updateError;
  
      // 2. Si es aprobado, subimos rango
      if (decision === 'approved') {
        await supabase.from('profiles').update({ role: 'dm' }).eq('user_id', app.user_id);
      }
  
      await supabase.from('mission_messages').insert({
        mission_id: GLOBAL_CHAT_ID,
        adventurer_name: 'EL RELICARIO',
        content: `✨ EDICTO: El aventurero ${app.adventurer_name} ha sido ascendido a Narrador. Que su pluma sea justa y su oscuridad profunda.`,
        user_id: SYSTEM_ID
      });
    
      
      const privateMessage = decision === 'approved' 
      ? `El maestro de las almas espera grandes cosas de ti, Bienvenid@. Tu rastro ahora brilla con el rango de Narrador.`
      : `Tu rastro ha sido juzgado. Lo sentimos, el Maestro de la Oscuridad no requiere de tus servicios en este momento.`;

    await supabase.from('mission_messages').insert({
      mission_id: app.user_id, // Destino: Buzón del jugador
      adventurer_name: 'MAESTRO DE LAS LLAMAS',
      content: privateMessage,
      user_id: SYSTEM_ID
    });
  
      // Limpiar UI
      setApps(prev => prev.filter(item => item.id !== app.id));
      if (apps.length <= 1) setOpen(false);
  
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null

  return (
    <>
      {apps.length > 0 && (
        <button 
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 rounded-full border border-red-500 bg-red-950 px-4 py-2 shadow-[0_0_20px_rgba(220,38,38,0.4)] animate-bounce"
        >
          <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest text-red-100 font-bold">
            {apps.length} Peticiones de Maestría
          </span>
        </button>
      )}

      <PanelDialog open={open} title="Edictos de Aspirantes" onClose={() => setOpen(false)}>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {apps.length === 0 && <p className="text-center text-stone-500 text-sm italic py-4">No hay almas reclamando el rango de maestro...</p>}
          
          {apps.map((app) => (
            <div key={app.id} className="rounded-lg border border-red-900/30 bg-black/40 p-4">
              <div className="flex justify-between items-start mb-3">
                <p className="text-sm font-bold text-red-200">{app.adventurer_name}</p>
                <span className="text-[9px] text-stone-500 uppercase">{new Date(app.created_at).toLocaleDateString()}</span>
              </div>
              
              <div className="space-y-3 text-xs text-[#e9e2d6]/80 leading-relaxed">
                <p><span className="text-red-900/60 uppercase text-[9px] block">Motivación:</span> {app.answers?.why || 'Sin respuesta'}</p>
                <p><span className="text-red-900/60 uppercase text-[9px] block">Experiencia:</span> {app.answers?.exp || 'Sin respuesta'}</p>
              </div>

              <div className="mt-4 flex gap-2">
                <button 
                  disabled={loading}
                  onClick={() => handleDecision(app, 'approved')}
                  className="w-1/2 rounded border border-green-900/50 bg-green-950/20 py-2 text-[9px] uppercase tracking-widest text-green-200 hover:bg-green-900/40"
                >
                  [ Otorgar Rango ]
                </button>
                <button 
                  disabled={loading}
                  onClick={() => handleDecision(app, 'rejected')}
                  className="w-1/2 rounded border border-red-900/50 bg-red-950/20 py-2 text-[9px] uppercase tracking-widest text-red-200 hover:bg-red-900/40"
                >
                  [ Denegar ]
                </button>
              </div>
            </div>
          ))}
        </div>
      </PanelDialog>
    </>
  )
}