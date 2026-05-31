'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import PanelDialog from './PanelDialog'

export default function NewsManager({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false)
  const [news, setNews] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ id: '', title: '', summary: '', content: '', image_url: '', is_dm_app: false })

  const fetchNews = async () => {
    const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false })
    if (data) setNews(data)
  }

  useEffect(() => { if (isAdmin) fetchNews() }, [isAdmin])

  const handleSave = async () => {
    if (!form.title) return alert("El edicto necesita un título")
    setLoading(true)
    
    const payload = { 
      title: form.title, 
      summary: form.summary, 
      content: form.content, 
      image_url: form.image_url,
      is_dm_app: form.is_dm_app 
    }

    const { error } = form.id 
      ? await supabase.from('news').update(payload).eq('id', form.id)
      : await supabase.from('news').insert(payload)

      if (!error) {
        
        await fetchNews()
        setForm({ id: '', title: '', summary: '', content: '', image_url: '', is_dm_app: false })
        
      }
      setLoading(false)
    }

  const deleteNews = async (id: string) => {
    if (confirm("¿Borrar este edicto para siempre?")) {
      await supabase.from('news').delete().eq('id', id)
      fetchNews()
    }
  }

  if (!isAdmin) return null

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-6 z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-red-700 bg-black text-lg shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:bg-red-950 transition-all"
        title="Gestionar Edictos"
      >
        📜
      </button>

      <PanelDialog open={open} title="Gestión de Edictos" onClose={() => setOpen(false)}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          {/* FORMULARIO */}
          <div className="space-y-3 bg-red-950/10 p-4 rounded-lg border border-red-900/20">
            <input 
              className="w-full bg-black/40 border border-red-900/30 p-2 text-xs text-white outline-none focus:border-red-600" 
              placeholder="Título del edicto..."
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
            />
            <input 
              className="w-full bg-black/40 border border-red-900/30 p-2 text-xs text-white outline-none focus:border-red-600" 
              placeholder="URL de la imagen (Ej: https://...)"
              value={form.image_url}
              onChange={e => setForm({...form, image_url: e.target.value})}
            />
            <textarea 
              className="w-full bg-black/40 border border-red-900/30 p-2 text-xs text-white h-16 outline-none focus:border-red-600" 
              placeholder="Resumen corto (para el tablón)..."
              value={form.summary}
              onChange={e => setForm({...form, summary: e.target.value})}
            />
            <textarea 
              className="w-full bg-black/40 border border-red-900/30 p-2 text-xs text-white h-32 outline-none focus:border-red-600" 
              placeholder="Contenido completo del edicto..."
              value={form.content}
              onChange={e => setForm({...form, content: e.target.value})}
            />
            <div className="flex items-center gap-2 px-1">
              <input 
                type="checkbox" 
                id="is_dm_app"
                className="accent-red-700"
                checked={form.is_dm_app} 
                onChange={e => setForm({...form, is_dm_app: e.target.checked})} 
              />
              <label htmlFor="is_dm_app" className="text-[10px] uppercase tracking-widest text-stone-400 cursor-pointer">
                Habilitar postulación DM
              </label>
            </div>
            <button 
              onClick={handleSave} 
              disabled={loading}
              className="w-full py-2 bg-red-900/40 border border-red-600 text-[#f2ead8] text-[10px] uppercase tracking-[0.3em] hover:bg-red-800 transition-all"
            >
              {form.id ? 'Actualizar Edicto' : 'Sellar noticia'}
            </button>
            {form.id && (
              <button 
                onClick={() => setForm({ id: '', title: '', summary: '', content: '', image_url: '', is_dm_app: false })}
                className="w-full text-[9px] uppercase text-stone-500 hover:text-white mt-1"
              >
                Cancelar edición
              </button>
            )}
          </div>

          {/* LISTA DE NOTICIAS EXISTENTES */}
          <div className="space-y-2 pt-2">
            <p className="text-[10px] uppercase tracking-widest text-red-200/40 mb-2">Edictos publicados</p>
            {news.map(n => (
              <div key={n.id} className="flex justify-between items-center p-3 border border-red-900/10 bg-black/40 rounded shadow-inner">
                <div className="flex items-center gap-3">
                  {n.image_url && <img src={n.image_url} className="w-8 h-8 rounded-full object-cover grayscale" />}
                  <span className="truncate w-32 text-xs text-stone-300">{n.title}</span>
                </div>
                <div className="flex gap-3 text-[10px] font-bold uppercase tracking-tighter">
                  <button onClick={() => setForm(n)} className="text-yellow-700 hover:text-yellow-500">Editar</button>
                  <button onClick={() => deleteNews(n.id)} className="text-red-900 hover:text-red-500">Borrar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PanelDialog>
    </>
  )
}