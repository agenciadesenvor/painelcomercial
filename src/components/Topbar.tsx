import { Search, Plus, Bell, Command } from 'lucide-react'
import { useUI, useData } from '../lib/store'
import { Avatar } from './Avatar'
import { Logo } from './Logo'

const HOJE = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
})

export function Topbar() {
  const { openEditor, setPage, setFiltro, filtros } = useUI()
  const perfil = useData((s) => s.perfil)
  const primeiroNome = perfil.nome.trim().split(/\s+/)[0] || 'você'

  return (
    <header className="sticky top-0 z-20 border-b border-hair bg-base/70 backdrop-blur-xl">
      <div className="flex h-[68px] items-center gap-3 px-4 sm:px-6">
        {/* Marca mobile */}
        <div className="flex items-center gap-2 lg:hidden">
          <Logo size={36} rounded="rounded-lg" />
        </div>

        {/* Saudação */}
        <div className="hidden min-w-0 md:block">
          <div className="truncate font-display text-[15px] font-bold text-ink">
            Olá, {primeiroNome} <span className="text-ember">·</span> vamos vender hoje
          </div>
          <div className="text-xs capitalize text-ink-mute">{HOJE}</div>
        </div>

        {/* Busca */}
        <div className="relative ml-auto w-full max-w-md">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" />
          <input
            value={filtros.search}
            onChange={(e) => {
              setFiltro({ search: e.target.value })
              setPage('leads')
            }}
            placeholder="Buscar cliente, cidade, telefone…"
            className="input pl-10 pr-16"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-hair px-1.5 py-0.5 text-[10px] text-ink-mute sm:flex">
            <Command size={10} /> K
          </span>
        </div>

        {/* Ações */}
        <button
          className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-hair bg-white/[0.02] text-ink-sub transition-colors hover:text-ink"
          aria-label="Notificações"
        >
          <Bell size={18} />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-ember shadow-[0_0_8px_2px_rgba(255,76,36,0.8)]" />
        </button>

        <button onClick={() => openEditor(null)} className="btn-ember shrink-0 whitespace-nowrap">
          <Plus size={17} strokeWidth={2.5} />
          <span className="hidden sm:inline">Novo lead</span>
        </button>

        <button
          onClick={() => setPage('perfil')}
          title="Perfil"
          className="flex shrink-0 items-center gap-2.5 rounded-xl border border-hair bg-white/[0.02] p-1.5 transition-colors hover:border-white/20 sm:pr-3"
        >
          <Avatar name={perfil.nome} size="sm" src={perfil.foto} />
          <div className="hidden text-left leading-tight sm:block">
            <div className="text-xs font-semibold text-ink">{perfil.nome}</div>
            <div className="text-[10px] text-ink-mute">{perfil.cargo}</div>
          </div>
        </button>
      </div>
    </header>
  )
}
