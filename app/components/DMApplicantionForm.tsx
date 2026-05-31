'use client'
import { useState, useEffect, useCallback } from 'react'
import PanelDialog from './PanelDialog'
import { supabase } from '@/lib/supabaseClient'

export default function DMApplicationForm({ user, profile }: { user: any, profile: any }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [answers, setAnswers] = useState({ why: '', exp: '', respect: 'si' })

  // Usamos useCallback para que la función sea estable y no se duplique
  const handleOpen = useCallback(() => {
    setOpen(true)
  }, [])

  useEffect(() => {
    // Escuchamos el evento
    window.addEventListener('open-dm-app', handleOpen)
    
    // LIMPIEZA: Esto es vital para que no se abra 2 veces
    return () => {
      window.removeEventListener('open-dm-app', handleOpen)
    }
  }, [handleOpen])

  const sendApp = async () => {
    // VALIDACIÓN ESTRICTA: No permitimos campos vacíos o solo espacios
    if (!answers.why.trim() || !answers.exp.trim()) {
       alert("El pergamino está incompleto. El Maestro de las Llamas no acepta juramentos vacíos.")
       return
    }

    if (answers.why.length < 20) {
      alert("Tu motivación es demasiado breve. Desarrolla tu rastro con más detalle.")
      return
    }

    setLoading(true)
    
    try {
      const { error } = await supabase.from('dm_applications').insert({
        user_id: user.id,
        adventurer_name: profile?.adventurer_name,
        answers: answers,
        status: 'pending'
      })

      if (error) throw error

      alert("Solicitud entregada. El Portador de la Llama revisará tu rastro.")
      setOpen(false)
      // Limpiamos los campos para la próxima vez
      setAnswers({ why: '', exp: '', respect: 'si' })
    } catch (error) {
      console.error(error)
      alert("Las sombras impidieron la entrega del mensaje.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <PanelDialog open={open} title="Postulación de Maestro" onClose={() => setOpen(false)}>
      <div className="space-y-4 pt-2 text-left">
        <p className="text-[10px] text-stone-500 italic mb-4">Responde con sinceridad, pues el fuego detecta la mentira.</p>
        
        <div>
          <label className="text-[10px] uppercase tracking-widest text-red-200/60 font-medium italic">
            ¿Por qué quieres narrar en Noctherra? (Mínimo 20 caracteres)
          </label>
          <textarea 
            required
            className="w-full bg-black/40 border border-red-900/30 p-3 text-sm text-white mt-1 rounded-md focus:border-red-600 outline-none min-h-[100px]" 
            placeholder="Describe tu motivación..."
            value={answers.why}
            onChange={e => setAnswers({...answers, why: e.target.value})}
          />
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-red-200/60 font-medium italic">
            ¿Cuántas lunas (experiencia) llevas guiando almas?
          </label>
          <input 
            required
            className="w-full bg-black/40 border border-red-900/30 p-3 text-sm text-white mt-1 rounded-md focus:border-red-600 outline-none" 
            placeholder="Tu experiencia narrando..."
            value={answers.exp}
            onChange={e => setAnswers({...answers, exp: e.target.value})}
          />
        </div>

        <button 
          onClick={sendApp}
          disabled={loading}
          className="w-full py-3 bg-red-950/40 border border-red-700/60 text-[#f2ead8] text-[10px] uppercase tracking-[0.3em] hover:bg-red-900/40 transition-all disabled:opacity-50 shadow-lg"
        >
          {loading ? 'Sellando pergamino...' : 'Sellar Solicitud'}
        </button>
      </div>
    </PanelDialog>
  )
}