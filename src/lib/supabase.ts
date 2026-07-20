import { createClient } from '@supabase/supabase-js'

/**
 * Cliente único do Supabase (Fase 1 · SaaS).
 * URL + anon key vêm do .env (VITE_*). A anon key é pública por natureza —
 * quem protege os dados é o RLS no banco (cada empresa só vê o que é seu).
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** true quando o .env está preenchido — enquanto false, o app segue no localStorage. */
export const supabaseConfigurado = Boolean(url && anonKey)

if (!supabaseConfigurado) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não definidos — ' +
      'copie .env.example para .env. Rodando sem backend por enquanto.',
  )
}

export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: { persistSession: true, autoRefreshToken: true },
})
