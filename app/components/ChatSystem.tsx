'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Mission, Profile } from '@/lib/types'

// ID Especial para el Chat Global (El Nexo)
const GLOBAL_CHAT_ID = '00000000-0000-0000-0000-000000000000'

// Función para formatear el tiempo de forma relativa
function formatTimeAgo(dateString: string) {
  const now = new Date();
  const msgDate = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - msgDate.getTime()) / 1000);

  if (diffInSeconds < 10) return 'ahora';
  if (diffInSeconds < 60) return `hace ${diffInSeconds}s`;
  if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)}h`;
  return msgDate.toLocaleDateString();
}



export default function ChatSystem({ user, profile, missions, isAdmin }: { user: any, profile: Profile | null, missions: Mission[], isAdmin: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<{ id: string, title: string, type: string } | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  
  const myChats = [
    { id: GLOBAL_CHAT_ID, title: 'El Nexo de Almas', type: 'global' },
    
    { id: user?.id, title: 'Maestro de las Llamas', type: 'system' },
    ...missions
      .filter(m =>
        m.adventurers?.includes(profile?.adventurer_name || '') ||
        m.applicants?.includes(profile?.adventurer_name || '') ||
        m.creator_id === user?.id
      )
      .map(m => ({ id: m.id, title: m.title, type: 'mission' }))
  ]

  const fetchMessages = useCallback(async (chatId: string) => {
    const { data, error } = await supabase
      .from('mission_messages')
      .select('*')
      .eq('mission_id', chatId)
      .order('created_at', { ascending: true })
      .limit(50)

    if (!error && data) setMessages(data)
  }, [])

  useEffect(() => {
    if (!activeTab) return;

    fetchMessages(activeTab.id);

    const channelId = `chat_room_${activeTab.id}`;
    const channel = supabase.channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          table: 'mission_messages',
          schema: 'public',
          filter: `mission_id=eq.${activeTab.id}`
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab, fetchMessages]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeTab || activeTab.type === 'system') return

    const msg = newMessage.trim()
    setNewMessage('')

    await supabase.from('mission_messages').insert({
      mission_id: activeTab.id,
      user_id: user.id,
      adventurer_name: profile?.adventurer_name || 'Desconocido',
      content: msg
    })
  }

  if (!user) return null

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[350px] sm:w-[450px] h-[600px] bg-[#050505] border-2 border-red-900/40 rounded-t-3xl rounded-bl-3xl shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-10 duration-500 backdrop-blur-xl">

          {/* CABECERA */}
          <div className="relative bg-gradient-to-b from-red-950/30 to-transparent p-5 border-b border-red-900/20">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-serif text-xl text-[#f2ead8] tracking-widest uppercase truncate max-w-[200px]">
                  {activeTab ? activeTab.title : 'Los Susurros'}
                </h3>
                <p className="text-[10px] text-red-500/60 uppercase tracking-[0.3em]">
                  {activeTab ? 'Canal Establecido' : 'Selecciona un destino'}
                </p>
              </div>
              <button
                onClick={() => activeTab ? setActiveTab(null) : setIsOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-full border border-red-900/40 text-red-500 hover:bg-red-900/20 transition-all"
              >
                {activeTab ? '↩' : '×'}
              </button>
            </div>
          </div>

          {/* CUERPO DEL CHAT */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/black-linen.png')]">
            {!activeTab ? (
              <div className="space-y-3">
                {myChats.map(chat => (
                  <button
                    key={chat.id}
                    onClick={() => setActiveTab(chat)}
                    className={`w-full p-4 text-left rounded-lg border transition-all duration-300 group flex items-center justify-between ${chat.type === 'global'
                        ? 'border-amber-900/30 bg-amber-950/10 hover:border-amber-500/50'
                        : chat.type === 'system'
                          ? 'border-emerald-900/30 bg-emerald-950/10 hover:border-emerald-500/50'
                          : 'border-white/5 bg-white/[0.02] hover:border-red-900/40'
                      }`}
                  >
                    <div>
                      <p className={`text-sm font-serif ${chat.type === 'global' ? 'text-amber-200' : chat.type === 'system' ? 'text-emerald-200' : 'text-[#e9e2d6]'}`}>
                        {chat.type === 'global' && '✨ '}{chat.type === 'system' && '📜 '}{chat.title}
                      </p>
                      <p className="text-[9px] uppercase text-stone-500 mt-1 tracking-widest">
                        {chat.type === 'global' ? 'Fuego Mundial' : chat.type === 'system' ? 'Mensajes de Sistema' : 'Contrato de Almas'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg, i) => {
                  const isMe = msg.user_id === user.id
                  return (
                    <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                      <div className={`flex items-baseline gap-2 mb-1 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className={`text-[10px] uppercase font-bold tracking-widest ${isMe ? 'text-red-400' : 'text-stone-400'}`}>
                          {msg.adventurer_name}
                        </span>
                        <span className="text-[8px] text-stone-600 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                          {formatTimeAgo(msg.created_at)}
                        </span>
                      </div>

                      <div className={`relative px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed font-serif max-w-[85%] shadow-md border ${isMe
                          ? 'bg-red-950/20 border-red-800/40 text-red-50'
                          : 'bg-stone-900/50 border-stone-800 text-stone-200'
                        }`}>
                        {msg.content}
                      </div>
                    </div>
                  )
                })}
                <div ref={scrollRef} />
              </div>
            )}
          </div>

          {/* INPUT O AVISO DE SISTEMA */}
          {/* INPUT O AVISO DE SISTEMA */}
{activeTab && (
  <div className="p-4 bg-black/80 border-t border-red-900/20">
    {/* REGLA: Si no es sistema O si eres el Owner, puedes escribir */}
    {activeTab.type !== 'system' || isAdmin ? (
      <form onSubmit={sendMessage} className="flex items-center gap-3 bg-white/5 rounded-2xl border border-white/10 px-4 py-1 focus-within:border-red-900/60 transition-all">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={activeTab.type === 'system' ? "Dicta una sentencia..." : "Susurra al nexo..."}
          className="flex-1 bg-transparent py-3 text-sm text-[#f2ead8] outline-none placeholder:text-stone-600"
        />
        <button type="submit" className="text-red-600 hover:text-red-400 transition-colors">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.519 0 003.478 2.405z" /></svg>
        </button>
      </form>
    ) : (
      // El jugador normal ve esto en el buzón
      <div className="py-2 text-center">
        <p className="text-[10px] uppercase tracking-widest text-red-500/60 italic">
          Este decreto es inmutable. No puedes responder al sistema.
        </p>
      </div>
    )}
  </div>
)}


        </div>
      )}

      {/* BURBUJA FLOTANTE */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative h-16 w-16 rounded-full flex items-center justify-center border-2 transition-all duration-700 ${isOpen
            ? 'bg-red-950 border-red-500 scale-90 rotate-[360deg]'
            : 'bg-black border-red-900 hover:border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.3)]'
          }`}
      >
        <span className={`text-2xl transition-all duration-500 ${isOpen ? 'rotate-180' : ''}`}>
          {isOpen ? '✕' : '💠'}
        </span>
      </button>
    </div>
  )
}