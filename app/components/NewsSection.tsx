'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import PanelDialog from './PanelDialog'

export default function NewsSection() {
  const [news, setNews] = useState<any[]>([])
  const [selectedNews, setSelectedNews] = useState<any | null>(null)

  // Memorizamos la función para que el Realtime no cree bucles
  const fetchNews = useCallback(async () => {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setNews(data)
  }, [])

  useEffect(() => {
    fetchNews()

    // ESCUCHA ACTIVA DE TODO EL TABLÓN
    const channel = supabase
      .channel('news_realtime')
      .on(
        'postgres_changes', 
        { event: '*', table: 'news', schema: 'public' }, 
        (payload) => {
          console.log('Cambio detectado en Edictos:', payload)
          fetchNews() // Recarga instantánea al detectar insert/update/delete
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchNews])

  return (
    <div className="lg:col-span-5">
      <div className="relative rounded-2xl border border-red-800/35 bg-gradient-to-b from-red-950/20 to-black/40 p-6 shadow-[0_0_70px_rgba(220,38,38,0.10)]">
        <p className="text-xs uppercase tracking-[0.28em] text-red-200/75 mb-4 font-serif">Noticias del Continente</p>
        
        <div className="space-y-4">
          {news.map(item => (
            <div key={item.id} className="group rounded-xl border border-red-800/25 bg-[#0b0b0b]/35 p-4 transition hover:border-red-600/50">
              <div className="flex gap-4">
                {item.image_url && (
                  <img 
                    src={item.image_url} 
                    alt=""
                    className="h-16 w-16 min-w-[64px] rounded border border-red-900/40 object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 shadow-md"
                  />
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-sm font-medium text-[#f2ead8] font-serif truncate group-hover:text-red-400">{item.title}</h4>
                    {item.is_dm_app && (
                      <span className="text-[8px] text-red-500 bg-red-950/50 px-1 border border-red-900/50 uppercase whitespace-nowrap">Urgente</span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-[#e9e2d6]/60 leading-relaxed italic line-clamp-2">
                    {item.summary}
                  </p>
                  
                  <button 
                    onClick={() => {
                      if (item.is_dm_app) {
                        window.dispatchEvent(new CustomEvent('open-dm-app'))
                      } else {
                        setSelectedNews(item)
                      }
                    }}
                    className="mt-2 text-[9px] uppercase tracking-[0.2em] text-red-500 hover:text-red-300 transition-colors inline-block"
                  >
                    {item.is_dm_app ? '[ Postularse ]' : '[ Leer más ]'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <PanelDialog 
        open={!!selectedNews} 
        title={selectedNews?.title || 'Edicto'} 
        onClose={() => setSelectedNews(null)}
      >
        <div className="space-y-5">
          {selectedNews?.image_url && (
            <div className="relative w-full overflow-hidden rounded-lg border border-red-900/20 bg-black/40">
              <img 
                src={selectedNews.image_url} 
                className="w-full h-auto max-h-[500px] object-contain grayscale hover:grayscale-0 transition-all duration-1000" 
                alt="Imagen del Edicto"
              />
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.7)]" />
            </div>
          )}
          <p className="text-sm leading-relaxed text-[#e9e2d6]/90 whitespace-pre-wrap font-serif first-letter:text-2xl first-letter:text-red-600">
            {selectedNews?.content}
          </p>
        </div>
      </PanelDialog>
    </div>
  )
}