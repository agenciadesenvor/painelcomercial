import { useRef } from 'react'
import { UserRound, Building2, ImageUp, Trash2, RotateCcw, CheckCircle2 } from 'lucide-react'
import { useData, useUI } from '../lib/store'
import { readImageFile } from '../lib/utils'
import { PageTitle, CardHead } from '../components/Kit'
import { Avatar } from '../components/Avatar'
import { Logo } from '../components/Logo'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  )
}

export function Perfil() {
  const perfil = useData((s) => s.perfil)
  const setPerfil = useData((s) => s.setPerfil)
  const resetPerfil = useData((s) => s.resetPerfil)
  const notify = useUI((s) => s.notify)
  const fotoRef = useRef<HTMLInputElement>(null)
  const logoRef = useRef<HTMLInputElement>(null)

  async function onFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const url = await readImageFile(file, 320)
      setPerfil({ foto: url })
      notify('Foto atualizada')
    } catch {
      notify('Não foi possível ler a imagem', 'danger')
    }
    e.target.value = ''
  }

  async function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const url = await readImageFile(file, 512)
      setPerfil({ logo: url })
      notify('Logo atualizada')
    } catch {
      notify('Não foi possível ler a imagem', 'danger')
    }
    e.target.value = ''
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageTitle title="Perfil" sub="Seus dados e a identidade da empresa no painel" />

      {/* Seu perfil */}
      <div className="panel p-5 sm:p-6">
        <CardHead title="Seu perfil" sub="Aparece no topo e na barra lateral" right={<UserRound size={16} className="text-ink-mute" />} />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Avatar name={perfil.nome} size="xl" src={perfil.foto} />
            <div className="flex flex-col items-start gap-1.5">
              <button onClick={() => fotoRef.current?.click()} className="btn-ghost py-2 text-xs">
                <ImageUp size={14} /> {perfil.foto ? 'Trocar foto' : 'Enviar foto'}
              </button>
              {perfil.foto && (
                <button onClick={() => setPerfil({ foto: null })} className="inline-flex items-center gap-1 px-1 text-[11px] text-ink-mute transition-colors hover:text-danger">
                  <Trash2 size={12} /> Remover
                </button>
              )}
              <input ref={fotoRef} type="file" accept="image/*" className="hidden" onChange={onFoto} />
            </div>
          </div>

          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <Field label="Nome">
              <input className="input" value={perfil.nome} onChange={(e) => setPerfil({ nome: e.target.value })} placeholder="Seu nome" />
            </Field>
            <Field label="Cargo">
              <input className="input" value={perfil.cargo} onChange={(e) => setPerfil({ cargo: e.target.value })} placeholder="Ex.: Gestor comercial" />
            </Field>
          </div>
        </div>
      </div>

      {/* Empresa */}
      <div className="panel p-5 sm:p-6">
        <CardHead title="Empresa" sub="Nome e logo exibidos na marca do painel" right={<Building2 size={16} className="text-ink-mute" />} />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl border border-hair bg-white/[0.02]">
              <Logo size={56} rounded="rounded-xl" />
            </div>
            <div className="flex flex-col items-start gap-1.5">
              <button onClick={() => logoRef.current?.click()} className="btn-ghost py-2 text-xs">
                <ImageUp size={14} /> {perfil.logo ? 'Trocar logo' : 'Enviar logo'}
              </button>
              {perfil.logo && (
                <button onClick={() => setPerfil({ logo: null })} className="inline-flex items-center gap-1 px-1 text-[11px] text-ink-mute transition-colors hover:text-danger">
                  <Trash2 size={12} /> Remover
                </button>
              )}
              <span className="px-1 text-[10px] text-ink-mute">PNG ou SVG</span>
              <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={onLogo} />
            </div>
          </div>

          <div className="flex-1">
            <Field label="Nome da empresa">
              <input className="input" value={perfil.empresa} onChange={(e) => setPerfil({ empresa: e.target.value })} placeholder="Nome da empresa" />
            </Field>
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-positive">
          <CheckCircle2 size={14} /> Alterações salvas automaticamente
        </span>
        <button
          onClick={() => {
            resetPerfil()
            notify('Perfil restaurado ao padrão', 'info')
          }}
          className="btn-ghost ml-auto py-2 text-xs"
        >
          <RotateCcw size={13} /> Restaurar padrão
        </button>
      </div>
    </div>
  )
}
