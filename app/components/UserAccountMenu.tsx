'use client'

import { useState } from 'react'

import { supabase } from '@/lib/supabaseClient'
import type { Profile, User } from '@/lib/types'
import PanelDialog from './PanelDialog'

type UserAccountMenuProps = {
  user: User | null
  profile: Profile | null
  isAdmin: boolean
  menuOpen: boolean
  setMenuOpen: (open: boolean) => void
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
}

export default function UserAccountMenu({
  user,
  profile,
  isAdmin,
  menuOpen,
  setMenuOpen,
  setUser,
  setProfile,
}: UserAccountMenuProps) {
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameDraft, setRenameDraft] = useState('')

  const [infoOpen, setInfoOpen] = useState(false)
  const [infoTitle, setInfoTitle] = useState('')
  const [infoMessage, setInfoMessage] = useState('')

  function showInfo(title: string, message: string) {
    setInfoTitle(title)
    setInfoMessage(message)
    setInfoOpen(true)
  }

  const isActuallyDM = profile?.role === 'dm' || isAdmin;

  return (
    <div className="relative flex items-center gap-3">
      {!user ? (
        <div className="hidden rounded-full border border-red-800/40 px-3 py-1 text-xs text-red-100/70 shadow-[0_0_18px_rgba(220,38,38,0.20)] sm:block">
          Luz mínima. Fuego antiguo.
        </div>
      ) : (
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className={`flex items-center gap-3 rounded-full border px-4 py-2 text-sm transition-all shadow-lg ${
              isActuallyDM 
              ? "border-emerald-700/50 bg-emerald-950/20 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.15)]" 
              : "border-green-700/40 bg-green-950/20 text-green-100"
            }`}
          >
            <div className="flex items-center gap-2">
              {/* PUNTO VERDE INICIAL (Siempre presente) */}
              <span className={`h-2 w-2 rounded-full shadow-[0_0_10px_rgba(74,222,128,0.7)] ${
                isActuallyDM ? "bg-emerald-400" : "bg-green-400"
              }`} />
              
              {/* INDICADOR DE OWNER (Si aplica, un punto extra pequeño) */}
              {isAdmin && (
                <span
                  title="Portador de la Llama"
                  className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]"
                />
              )}
            </div>
  
            {/* NOMBRE DEL AVENTURERO CON PREFIJO DM SI CORRESPONDE */}
            <span className={`font-medium tracking-tight ${isActuallyDM ? "text-emerald-200" : ""}`}>
              {isActuallyDM ? `DM ${profile?.adventurer_name}` : profile?.adventurer_name}
            </span>
  
            {/* PUNTO VERDE FINAL (Solo si es DM o Owner) */}
            {isActuallyDM && (
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-50 mt-3 w-56 rounded-xl border border-[#e9e2d6]/10 bg-[#090909] p-2 shadow-2xl">
              <button
                type="button"
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-[#e9e2d6]/80 transition hover:bg-white/5"
                onClick={() => {
                  setRenameDraft('')
                  setRenameOpen(true)
                }}
              >
                Cambiar nombre
              </button>

              <button
                type="button"
                className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-red-300 transition hover:bg-red-950/30"
                onClick={async () => {
                  const { error } = await supabase.auth.signOut()

                  if (error) {
                    console.error(JSON.stringify(error, null, 2))
                    showInfo(
                      'No se pudo cerrar sesión',
                      'Ocurrió un error al intentar salir.'
                    )
                    return
                  }

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

      <PanelDialog
        open={renameOpen}
        title="Cambiar nombre"
        onClose={() => setRenameOpen(false)}
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRenameOpen(false)}
              className="w-1/2 rounded-xl border border-[#e9e2d6]/15 bg-black/20 px-4 py-3 text-sm text-[#e9e2d6]/70 transition hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!renameDraft.trim()) {
                  showInfo('Falta un nombre', 'Ingresa un nuevo nombre de aventurero.')
                  return
                }

                if (renameDraft.trim().length < 3) {
                  showInfo('Nombre demasiado corto', 'El nombre debe tener al menos 3 caracteres.')
                  return
                }

                const { data: existingProfile } = await supabase
                  .from('profiles')
                  .select('id')
                  .eq('adventurer_name', renameDraft.trim())
                  .maybeSingle()

                if (existingProfile) {
                  showInfo('Nombre ocupado', 'Ese nombre ya está en uso por otra cuenta.')
                  return
                }

                const { error } = await supabase
                  .from('profiles')
                  .update({ adventurer_name: renameDraft.trim() })
                  .eq('user_id', user!.id)

                if (error) {
                  console.error(JSON.stringify(error, null, 2))
                  showInfo('No se pudo cambiar', 'Ocurrió un error al guardar el nuevo nombre.')
                  return
                }

                setProfile({
                  ...profile!,
                  adventurer_name: renameDraft.trim(),
                })
                setRenameOpen(false)
                setMenuOpen(false)
                showInfo('Nombre cambiado', 'Tu nombre se actualizó en el relicario.')
              }}
              className="w-1/2 rounded-xl border border-red-700/40 bg-red-950/30 px-4 py-3 text-sm text-[#f2ead8] transition hover:bg-red-900/20"
            >
              Guardar
            </button>
          </div>
        }
      >
        <div className="space-y-2">
          <p className="text-sm text-[#e9e2d6]/70">
            Este nombre será mostrado en tus misiones y crónicas.
          </p>
          <input
            type="text"
            value={renameDraft}
            onChange={(e) => setRenameDraft(e.target.value)}
            placeholder="Nuevo nombre de aventurero"
            className="w-full rounded-md border border-red-900/30 bg-black/40 p-3 text-white"
          />
        </div>
      </PanelDialog>

      <PanelDialog
        open={infoOpen}
        title={infoTitle || 'Relicario'}
        onClose={() => setInfoOpen(false)}
        footer={
          <button
            type="button"
            onClick={() => setInfoOpen(false)}
            className="w-full rounded-xl border border-red-700/40 bg-red-950/20 px-4 py-3 text-sm text-[#f2ead8] transition hover:bg-red-900/20"
          >
            Aceptar
          </button>
        }
      >
        <p className="text-sm text-[#e9e2d6]/80">{infoMessage}</p>
      </PanelDialog>
    </div>
  )
}
