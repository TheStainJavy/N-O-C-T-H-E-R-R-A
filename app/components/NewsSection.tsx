'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import PanelDialog from './PanelDialog'

export default function NewsSection() {
  const [news, setNews] = useState<any[]>([])
  const [selectedNews, setSelectedNews] = useState<any | null>(null)

  const fetchNews = useCallback(async () => {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setNews(data)
  }, [])

  useEffect(() => {
    fetchNews()
    const channel = supabase.channel('news_realtime')
      .on('postgres_changes', { event: '*', table: 'news', schema: 'public' }, () => fetchNews())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchNews])

  return (
    <div className="lg:col-span-5">
      <div className="relative rounded-2xl border border-red-800/35 bg-gradient-to-b from-red-950/20 to-black/40 p-6 shadow-[0_0_70px_rgba(220,38,38,0.10)]">
        <p className="text-xs uppercase tracking-[0.28em] text-red-200/75 mb-4 font-serif">Noticias del Continente</p>
        
        <div className="space-y-4">
          {news.map(item => (
            <div 
              key={item.id} 
              onClick={() => setSelectedNews(item)}
              className="group cursor-pointer rounded-xl border border-red-800/25 bg-[#0b0b0b]/35 p-4 transition hover:border-red-600/50 hover:bg-red-900/5"
            >
              <div className="flex gap-4">
                {item.image_url && (
                  <img src={item.image_url} alt="" className="h-16 w-16 min-w-[64px] rounded border border-red-900/40 object-cover grayscale opacity-60 group-hover:grayscale-0 transition-all duration-500 shadow-md" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-sm font-medium text-[#f2ead8] font-serif truncate group-hover:text-red-400">{item.title}</h4>
                    {item.is_dm_app && <span className="text-[8px] text-red-500 bg-red-950/50 px-1 border border-red-900/50 uppercase whitespace-nowrap font-bold tracking-tighter">Llamado</span>}
                  </div>
                  <p className="mt-1 text-[11px] text-[#e9e2d6]/60 leading-relaxed italic line-clamp-2">{item.summary}</p>
                  <span className="mt-2 text-[9px] uppercase tracking-[0.2em] text-red-500/60 group-hover:text-red-400 transition-colors inline-block">[ Abrir Ejemplar ]</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- EL PERIÓDICO (DIÁLOGO MEJORADO PARA NO CORTARSE) --- */}
      <PanelDialog open={!!selectedNews} title="" onClose={() => setSelectedNews(null)}>
        {/* Contenedor principal con altura máxima y scroll interno */}
        <div className="bg-[#e8e4d9] text-[#1a1a1a] shadow-2xl rounded-sm ring-1 ring-black/20 max-h-[80vh] overflow-y-auto custom-scrollbar-light mx-auto w-full">
          <div className="border-[3px] border-[#1a1a1a] m-1 p-4 sm:p-8">
            
            {/* Cabecera del Periódico */}
            <div className="text-center border-b-4 border-[#1a1a1a] pb-4 mb-6">
              <h2 className="font-serif text-3xl sm:text-5xl font-black uppercase tracking-tighter mb-2 leading-none">NOCTHERRA TIMES</h2>
              <div className="flex justify-between border-t border-[#1a1a1a] pt-1 text-[9px] font-bold uppercase tracking-widest">
                <span>Año {new Date().getFullYear()}</span>
                <span>Edición Extraordinaria</span>
                <span>{selectedNews ? new Date(selectedNews.created_at).toLocaleDateString() : ''}</span>
              </div>
            </div>

            {/* Titular Principal */}
            <h3 className="font-serif text-2xl sm:text-5xl font-black uppercase leading-tight tracking-tighter mb-4 text-center break-words italic">
              {selectedNews?.title}
            </h3>

            {/* Subtítulo / Destacado */}
            {selectedNews?.subtitle && (
              <div className="bg-red-700 text-white py-2 px-4 mb-6 text-center">
                <p className="font-serif text-xs sm:text-sm font-bold uppercase tracking-widest">
                  {selectedNews.subtitle}
                </p>
              </div>
            )}

            {/* Imagen Adaptable */}
            <div className="space-y-6">
              {selectedNews?.image_url && (
                <div className="w-full">
                  <img 
                    src={selectedNews.image_url} 
                    className="w-full h-auto  object-cover grayscale contrast-125 border-2 border-[#1a1a1a]" 
                    alt="Evidencia"
                  />
                  <p className="mt-1 text-[8px] uppercase font-bold text-center border-b border-[#1a1a1a] pb-1">Imagen recuperada de los archivos del Relicario</p>
                </div>
              )}

              {/* Texto en Columnas (Se adapta a móvil/escritorio) */}
              <div className="columns-1 md:columns-2 gap-8 font-serif text-[13px] sm:text-[14px] leading-[1.3] text-justify antialiased first-letter:text-6xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:mt-1 border-b border-[#1a1a1a]/10 pb-6">
                <p className="whitespace-pre-wrap">
                  {selectedNews?.content}
                </p>
              </div>

              {/* Botón de Postulación */}
              {selectedNews?.is_dm_app && (
                <div className="py-6 my-4 text-center border-2 border-dashed border-[#1a1a1a]/40 bg-white/30 rounded-lg">
                  <h4 className="font-serif text-lg font-bold uppercase mb-4 tracking-tighter">¿Deseas sellar tu juramento como Narrador?</h4>
                  <button 
                    onClick={() => {
                      setSelectedNews(null);
                      window.dispatchEvent(new CustomEvent('open-dm-app'));
                    }}
                    className="px-6 py-3 bg-[#1a1a1a] text-[#e8e4d9] font-black uppercase tracking-[0.2em] hover:bg-red-800 transition-all shadow-xl text-xs active:scale-95"
                  >
                    Postularse Ahora
                  </button>
                </div>
              )}
            </div>

            {/* Pie de página */}
            <div className="mt-8 pt-4 border-t-2 border-[#1a1a1a] text-center opacity-70">
              <p className="text-[8px] font-bold uppercase tracking-[0.4em]">Propiedad del Gremio de Noctherra — Prohibida su copia</p>
            </div>
          </div>
        </div>
      </PanelDialog>
    </div>
  )
}