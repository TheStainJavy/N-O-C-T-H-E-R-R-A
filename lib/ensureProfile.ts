import { supabase } from './supabaseClient'

export async function ensureProfile(adventurerName: string) {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()

  if (userErr || !user) {
    throw userErr ?? new Error('No user')
  }

  const { error: insertErr } = await supabase
    .from('profiles')
    .insert({
      user_id: user.id,
      adventurer_name: adventurerName,
    })

  if (insertErr) {
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        adventurer_name: adventurerName,
      })
      .eq('user_id', user.id)

    if (updateErr) throw updateErr
  }
}