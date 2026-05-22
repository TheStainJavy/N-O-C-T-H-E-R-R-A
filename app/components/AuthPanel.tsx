'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AuthPanel() {

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [adventurerName, setAdventurerName] = useState('')
  const [loading, setLoading] = useState(false)

  async function signUp() {

    // validaciones frontend
  
    if (!email.trim()) {
      alert('Debes ingresar un correo.')
      return
    }
  
    if (!password.trim()) {
      alert('Debes ingresar una contraseña.')
      return
    }
  
    if (password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres.')
      return
    }
  
    if (!adventurerName.trim()) {
      alert('Debes ingresar un nombre de aventurero.')
      return
    }
  
    if (adventurerName.trim().length < 3) {
      alert('El nombre es demasiado corto.')
      return
    }
  
    setLoading(true)
  
    // verificar nombre duplicado
  
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('adventurer_name', adventurerName.trim())
      .maybeSingle()
  
    if (existingProfile) {
      alert('Ese nombre de aventurero ya existe.')
      setLoading(false)
      return
    }
  
    // crear auth user
  
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    })
  
    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }
  
    const user = data.user
  
    if (!user) {
      alert('No se pudo crear el usuario.')
      setLoading(false)
      return
    }
  
    // crear perfil
  
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        adventurer_name: adventurerName.trim(),
      })
  
    if (profileError) {
      console.error(profileError)
  
      if (profileError.message.includes('duplicate')) {
        alert('Ese nombre de aventurero ya está ocupado.')
      } else {
        alert('Usuario creado, pero falló el perfil.')
      }
  
      setLoading(false)
      return
    }
  
    alert('Cuenta creada correctamente.')
  
    setEmail('')
    setPassword('')
    setAdventurerName('')
  
    setLoading(false)
  }

  async function signIn() {

    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      alert('Bienvenido.')
    }

    setLoading(false)
  }



  return (
    <div className="rounded-xl border border-red-800/30 bg-black/30 p-5">

      <h2 className="mb-4 text-lg font-semibold text-[#f2ead8]">
        Acceso al Relicario
      </h2>

      <div className="space-y-3">

        <input
          type="email"
          placeholder="correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md bg-black/40 border border-red-900/30 p-3 text-white"
        />

        <input
          type="password"
          placeholder="contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md bg-black/40 border border-red-900/30 p-3 text-white"
        />

<input
  type="text"
  placeholder="nombre de aventurero"
  value={adventurerName}
  onChange={(e) => setAdventurerName(e.target.value)}
  className="w-full rounded-md bg-black/40 border border-red-900/30 p-3 text-white"
/>

        <div className="flex gap-3">

          <button
            onClick={signUp}
            disabled={loading}
            className="rounded-md bg-red-950/40 border border-red-700/40 px-4 py-2"
          >
            Registrarse
          </button>

          <button
            onClick={signIn}
            disabled={loading}
            className="rounded-md bg-red-950/40 border border-red-700/40 px-4 py-2"
          >
            Entrar
          </button>

          

        </div>
      </div>
    </div>
  )
}