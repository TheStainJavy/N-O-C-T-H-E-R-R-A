'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import PanelDialog from './PanelDialog'

export default function AuthPanel({ currentProfile }: { currentProfile: any }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [adventurerName, setAdventurerName] = useState('')
  const [characterSheet, setCharacterSheet] = useState('')
  const [loading, setLoading] = useState(false)

  const [step, setStep] = useState<'auth' | 'sheet'>(
    currentProfile && !currentProfile.character_sheet_url ? 'sheet' : 'auth'
  );

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogTitle, setDialogTitle] = useState('')
  const [dialogMessage, setDialogMessage] = useState('')

  function showDialog(title: string, message: string) {
    setDialogTitle(title)
    setDialogMessage(message)
    setDialogOpen(true)
  }

  // --- FUNCIÓN REGISTRARSE ---
  async function signUp() {
    if (!email.trim() || !password.trim() || !adventurerName.trim()) {
      showDialog('Falta un dato', 'Debes completar todos los campos del juramento.')
      return
    }

    if (password.length < 6) {
      showDialog('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)

    // 1. Verificar si el nombre de aventurero ya existe en la tabla profiles
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('adventurer_name', adventurerName.trim())
      .maybeSingle()

    if (existingProfile) {
      showDialog('Nombre ocupado', 'Ese nombre de aventurero ya existe en las crónicas.')
      setLoading(false)
      return
    }

    // 2. Intentar crear el usuario en Auth
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    })

    if (error) {
      // Manejar si el correo ya existe
      if (error.message.includes('already registered')) {
        showDialog('Usuario existente', 'Este correo ya tiene un alma ligada. Intenta entrar en lugar de registrarte.')
      } else {
        showDialog('Error al registrar', error.message)
      }
      setLoading(false)
      return
    }

    const user = data.user
    if (!user) {
      showDialog('Error', 'No se pudo crear el usuario.')
      setLoading(false)
      return
    }

    // 3. Crear el perfil inicial
    const { error: profileError } = await supabase.from('profiles').insert({
      user_id: user.id,
      adventurer_name: adventurerName.trim(),
    })

    if (profileError) {
      showDialog('Error de perfil', 'Usuario creado, pero hubo un fallo al grabar tu nombre.')
      setLoading(false)
      return
    }

    setStep('sheet') // Pasamos al siguiente panel
    setLoading(false)
  }

  // --- FUNCIÓN ENTRAR ---
  async function signIn() {
    if (!email.trim() || !password.trim()) {
      showDialog('Faltan datos', 'Ingresa tus credenciales.')
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      showDialog('Acceso denegado', 'Credenciales incorrectas o usuario inexistente.')
      setLoading(false)
      return
    }

    // Buscamos su perfil para ver si tiene ficha y darle la bienvenida
    const { data: profile } = await supabase
      .from('profiles')
      .select('adventurer_name, character_sheet_url')
      .eq('user_id', data.user.id)
      .single()

    if (profile) {
      if (!profile.character_sheet_url) {
        // Si no tiene ficha, lo mandamos al panel de ficha aunque ya tenga cuenta
        setStep('sheet')
        showDialog('Ficha pendiente', `Bienvenido de vuelta, ${profile.adventurer_name}. Aún no has vinculado tu ficha de personaje.`)
        setLoading(false)
      } else {
        // Si tiene todo, mensaje de bienvenida y recargamos para entrar
        showDialog('Acceso concedido', `Bienvenido de vuelta, ${profile.adventurer_name}. Que la sombra te acompañe.`)
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      }
    } else {
      // Caso raro: tiene auth pero no profile
      setStep('sheet')
      setLoading(false)
    }
  }

  // --- FUNCIÓN GUARDAR FICHA ---
  async function saveCharacterSheet() {
    if (!characterSheet.trim()) {
      showDialog('Falta la ficha', 'Todo aventurero debe portar sus habilidades. Pega el link de tu ficha.')
      return
    }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      showDialog('Error de sesión', 'No se encontró tu sesión actual.')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({ character_sheet_url: characterSheet.trim() })
      .eq('user_id', user.id)

    if (error) {
      showDialog('Error', 'No se pudo vincular la ficha en el pergamino.')
      setLoading(false)
    } else {
      showDialog('Juramento Sellado', 'Tu ficha ha sido vinculada. Entrando en Noctherra...')
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    }
  }

  return (
    <div className="rounded-2xl border border-red-900/30 bg-black/60 p-8 shadow-[0_0_50px_rgba(220,38,38,0.15)] backdrop-blur-sm">
      {step === 'auth' ? (
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-widest text-[#f2ead8]/60">Inicia tu juramento</p>
          <input
            type="email"
            placeholder="Correo de alma"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-red-900/30 bg-black/40 p-3 text-white focus:border-red-600 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-red-900/30 bg-black/40 p-3 text-white focus:border-red-600 focus:outline-none"
          />
          
          {/* Solo pedimos nombre si no se ha logueado */}
          <input
            type="text"
            placeholder="Nombre de aventurero (para nuevos)"
            value={adventurerName}
            onChange={(e) => setAdventurerName(e.target.value)}
            className="w-full rounded-md border border-red-900/30 bg-black/40 p-3 text-white focus:border-red-600 focus:outline-none"
          />

          <div className="flex flex-col gap-3 pt-2">
            <button 
              onClick={signIn} 
              disabled={loading} 
              className="w-full rounded-md bg-red-950/40 border border-red-700/40 py-3 text-[#f2ead8] hover:bg-red-900/40 transition-all disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Entrar al Relicario'}
            </button>
            <button 
              onClick={signUp} 
              disabled={loading} 
              className="text-xs uppercase tracking-widest text-stone-500 hover:text-red-400 transition-colors"
            >
              Registrar nuevo nombre
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="text-center">
            <p className="text-sm font-serif text-red-200">Nombre aceptado...</p>
            <h3 className="mt-2 text-xl font-semibold text-[#f2ead8]">Vincula tu Ficha</h3>
            <p className="mt-2 text-xs text-stone-400">
              Pega el link de tu ficha de personaje (D&D Beyond, Drive, etc.) para terminar tu registro.
            </p>
          </div>
          <input
            type="text"
            placeholder="URL de tu ficha de personaje"
            value={characterSheet}
            onChange={(e) => setCharacterSheet(e.target.value)}
            className="w-full rounded-md border border-red-900/30 bg-black/40 p-3 text-white focus:border-red-600 focus:outline-none"
          />
          <button 
            onClick={saveCharacterSheet} 
            disabled={loading} 
            className="w-full rounded-md bg-red-950/60 border border-red-600/50 py-3 text-[#f2ead8] hover:shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all"
          >
            {loading ? 'Grabando...' : 'Sellar Juramento'}
          </button>
        </div>
      )}

      <PanelDialog
        open={dialogOpen}
        title={dialogTitle || 'Relicario'}
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
        <p className="text-sm text-[#e9e2d6]/80 whitespace-pre-line">
          {dialogMessage}
        </p>
      </PanelDialog>
    </div>
  )
}