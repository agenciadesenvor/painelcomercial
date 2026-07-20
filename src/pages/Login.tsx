import { useState } from 'react'
import { Mail, Lock, User, Building2, ArrowRight, MailCheck, Loader2 } from 'lucide-react'
import { Logo } from '../components/Logo'
import { entrar, cadastrar } from '../lib/auth'
import { BRAND } from '../lib/brand'
import { cn } from '../lib/utils'

type Modo = 'entrar' | 'cadastrar'

/** Traduz as mensagens de erro mais comuns do Supabase. */
function traduzErro(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'E-mail ou senha incorretos.'
  if (m.includes('already registered') || m.includes('already been registered')) return 'Esse e-mail já tem conta. Faça login.'
  if (m.includes('password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar (veja sua caixa de entrada).'
  if (m.includes('unable to validate email')) return 'E-mail inválido.'
  return msg
}

function Campo({
  icon: Icon, ...props
}: { icon: typeof Mail } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Icon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" />
      <input {...props} className="input pl-10" />
    </div>
  )
}

export function Login() {
  const [modo, setModo] = useState<Modo>('entrar')
  const [nome, setNome] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [confirmar, setConfirmar] = useState(false) // signup pediu confirmação de e-mail

  const cadastro = modo === 'cadastrar'

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    if (cadastro && !empresa.trim()) return setErro('Informe o nome da empresa.')
    setCarregando(true)
    try {
      if (cadastro) {
        const { data, error } = await cadastrar(email, senha, empresa, nome)
        if (error) return setErro(traduzErro(error.message))
        // Sem sessão = precisa confirmar e-mail. Com sessão = já entra (onAuthStateChange assume).
        if (!data.session) setConfirmar(true)
      } else {
        const { error } = await entrar(email, senha)
        if (error) return setErro(traduzErro(error.message))
        // Sucesso: o onAuthStateChange no App troca para o painel sozinho.
      }
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center text-center">
          <Logo size={52} />
          <h1 className="mt-4 font-display text-2xl font-bold text-ink">{BRAND.tagline}</h1>
          <p className="mt-1 text-sm text-ink-mute">
            {cadastro ? 'Crie a conta da sua empresa' : 'Entre para acessar seu painel'}
          </p>
        </div>

        {confirmar ? (
          <div className="panel p-6 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-ember/15 text-ember">
              <MailCheck size={24} />
            </div>
            <h2 className="mt-4 font-display text-lg font-bold text-ink">Confirme seu e-mail</h2>
            <p className="mt-1.5 text-sm text-ink-sub">
              Enviamos um link para <span className="font-semibold text-ink">{email}</span>. Abra-o para
              ativar a conta e depois volte aqui para entrar.
            </p>
            <button
              onClick={() => { setConfirmar(false); setModo('entrar') }}
              className="btn-ghost mt-5 w-full justify-center"
            >
              Voltar para o login
            </button>
          </div>
        ) : (
          <form onSubmit={enviar} className="panel space-y-3 p-6">
            {cadastro && (
              <>
                <Campo icon={User} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" autoComplete="name" />
                <Campo icon={Building2} value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Nome da empresa" />
              </>
            )}
            <Campo icon={Mail} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" autoComplete="email" />
            <Campo icon={Lock} type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Senha" autoComplete={cadastro ? 'new-password' : 'current-password'} />

            {erro && (
              <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">{erro}</p>
            )}

            <button type="submit" disabled={carregando} className="btn-ember w-full justify-center disabled:opacity-60">
              {carregando ? <Loader2 size={17} className="animate-spin" /> : <>
                {cadastro ? 'Criar conta' : 'Entrar'} <ArrowRight size={16} />
              </>}
            </button>
          </form>
        )}

        {!confirmar && (
          <p className="mt-5 text-center text-sm text-ink-mute">
            {cadastro ? 'Já tem conta?' : 'Ainda não tem conta?'}{' '}
            <button
              onClick={() => { setModo(cadastro ? 'entrar' : 'cadastrar'); setErro(null) }}
              className={cn('font-semibold text-ember hover:underline')}
            >
              {cadastro ? 'Entrar' : 'Criar conta'}
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
