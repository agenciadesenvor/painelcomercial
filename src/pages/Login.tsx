import { useState } from 'react'
import { Mail, Lock, User, Building2, ArrowRight, MailCheck, Loader2, Eye, EyeOff } from 'lucide-react'
import { Logo } from '../components/Logo'
import { entrar, cadastrar } from '../lib/auth'
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

/** Campo "glass" — borda sutil, blur, e destaque ember ao focar. */
function GlassField({
  icon: Icon,
  right,
  className,
  ...props
}: { icon: typeof Mail; right?: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="group rounded-2xl border border-hair bg-overlay backdrop-blur-sm transition-colors focus-within:border-ember/55 focus-within:bg-ember/[0.05]">
      <div className="relative flex items-center">
        <Icon
          size={16}
          className="pointer-events-none absolute left-4 text-ink-mute transition-colors group-focus-within:text-ember"
        />
        <input
          {...props}
          className={cn(
            // rounded-2xl no próprio input: sem isso o autofill do Chrome pinta
            // um retângulo de cantos retos que "vaza" nas pontas da borda.
            'w-full rounded-2xl bg-transparent py-3.5 pl-11 pr-4 text-sm text-ink placeholder:text-ink-mute focus:outline-none',
            className,
          )}
        />
        {right}
      </div>
    </div>
  )
}

export function Login() {
  const [modo, setModo] = useState<Modo>('entrar')
  const [nome, setNome] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [confirmar, setConfirmar] = useState(false)

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
        if (!data.session) setConfirmar(true)
      } else {
        const { error } = await entrar(email, senha)
        if (error) return setErro(traduzErro(error.message))
      }
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      {/* Fundo ambiente da marca */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute right-[-8%] top-[-10%] h-[420px] w-[520px] rounded-full bg-ember/[0.12] blur-[120px] animate-aurora" />
        <div className="absolute bottom-[-12%] left-[-6%] h-[380px] w-[420px] rounded-full bg-ember-soft/[0.08] blur-[130px]" />
      </div>

      <div className="w-full max-w-sm">
        {/* Marca */}
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="animate-fade-up">
            <Logo size={52} />
          </div>
          <h1
            className="mt-4 animate-fade-up font-display text-3xl font-bold tracking-tight text-ink"
            style={{ animationDelay: '60ms' }}
          >
            {cadastro ? 'Crie sua conta' : 'Bem-vindo de volta'}
          </h1>
          <p className="mt-1.5 animate-fade-up text-sm text-ink-mute" style={{ animationDelay: '120ms' }}>
            {cadastro ? 'Comece a organizar suas vendas em minutos' : 'Entre para acessar seu painel comercial'}
          </p>
        </div>

        {confirmar ? (
          <div
            className="animate-fade-up rounded-3xl border border-hair-strong bg-surface/60 p-6 text-center backdrop-blur-xl"
            style={{ animationDelay: '160ms' }}
          >
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-ember/15 text-ember">
              <MailCheck size={24} />
            </div>
            <h2 className="mt-4 font-display text-lg font-bold text-ink">Confirme seu e-mail</h2>
            <p className="mt-1.5 text-sm text-ink-sub">
              Enviamos um link para <span className="font-semibold text-ink">{email}</span>. Abra-o para
              ativar a conta e depois volte aqui para entrar.
            </p>
            <button
              type="button"
              onClick={() => { setConfirmar(false); setModo('entrar') }}
              className="btn-ghost mt-5 w-full justify-center"
            >
              Voltar para o login
            </button>
          </div>
        ) : (
          <form
            onSubmit={enviar}
            className="animate-fade-up space-y-3.5 rounded-3xl border border-hair-strong bg-surface/60 p-6 backdrop-blur-xl"
            style={{ animationDelay: '160ms' }}
          >
            {cadastro && (
              <>
                <GlassField icon={User} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" autoComplete="name" />
                <GlassField icon={Building2} value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Nome da empresa" />
              </>
            )}
            <GlassField icon={Mail} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" autoComplete="email" />
            <GlassField
              icon={Lock}
              type={verSenha ? 'text' : 'password'}
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha"
              autoComplete={cadastro ? 'new-password' : 'current-password'}
              className="pr-12"
              right={
                <button
                  type="button"
                  onClick={() => setVerSenha((v) => !v)}
                  className="absolute right-3 text-ink-mute transition-colors hover:text-ink"
                  aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {verSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            {erro && (
              <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">{erro}</p>
            )}

            <button type="submit" disabled={carregando} className="btn-ember w-full justify-center !py-3.5 disabled:opacity-60">
              {carregando ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <>
                  {cadastro ? 'Criar conta' : 'Entrar'} <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {!confirmar && (
          <p className="mt-5 animate-fade-up text-center text-sm text-ink-mute" style={{ animationDelay: '220ms' }}>
            {cadastro ? 'Já tem conta?' : 'Ainda não tem conta?'}{' '}
            <button
              type="button"
              onClick={() => { setModo(cadastro ? 'entrar' : 'cadastrar'); setErro(null) }}
              className="font-semibold text-ember hover:underline"
            >
              {cadastro ? 'Entrar' : 'Criar conta'}
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
