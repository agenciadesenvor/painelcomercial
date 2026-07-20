import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, supabaseConfigurado } from './supabase'

/** Sessão atual do Supabase. `carregando` evita piscar o login antes de checar. */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [carregando, setCarregando] = useState(supabaseConfigurado)

  useEffect(() => {
    if (!supabaseConfigurado) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCarregando(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  return { session, carregando }
}

export function entrar(email: string, senha: string) {
  return supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
}

/** Cadastro: nome + empresa vão no metadata; o trigger no banco cria empresa+perfil. */
export function cadastrar(email: string, senha: string, empresa: string, nome: string) {
  return supabase.auth.signUp({
    email: email.trim(),
    password: senha,
    options: { data: { empresa: empresa.trim(), nome: nome.trim() } },
  })
}

export function sair() {
  return supabase.auth.signOut()
}
