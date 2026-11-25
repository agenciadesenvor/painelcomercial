import { createClient } from '@supabase/supabase-js'

/**
 * Cliente único do Supabase (Fase 1 · SaaS).
 *
 * Os valores abaixo são o PADRÃO do projeto e podem ficar no código: a anon key
 * é **pública por natureza** — ela já viaja no bundle do navegador de todo
 * visitante. Quem protege os dados é o RLS no banco (cada empresa só enxerga o
 * que é dela). ⚠️ NUNCA colocar aqui a `service_role` nem a senha do banco.
 *
 * As variáveis de ambiente (.env local ou Vercel) têm precedência, então dá
 * para apontar para outro projeto sem mexer no código.
 */
const URL_PADRAO = 'https://uhzikiuqjzympgxksdhr.supabase.co'
const ANON_PADRAO = 'sb_publishable_NNMh8HFWeuFHvlLvojmdaA_ImGggOPe'

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || URL_PADRAO
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || ANON_PADRAO

/** Com o padrão embutido isto é sempre true; fica como guarda se alguém limpar os valores. */
export const supabaseConfigurado = Boolean(url && anonKey)

if (!supabaseConfigurado) {
  console.warn('[supabase] sem URL/anon key — rodando sem backend (dados só no navegador).')
}

export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: { persistSession: true, autoRefreshToken: true },
})
