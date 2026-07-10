import { LayoutDashboard, CalendarCheck, Contact, Users, Sparkles, Settings } from 'lucide-react'
import { useUI, useData, type Page } from '../lib/store'
import { cn } from '../lib/utils'
import { BRAND } from '../lib/brand'
import { Logo } from './Logo'
import { Avatar } from './Avatar'

const NAV: { id: Page; label: string; icon: typeof LayoutDashboard; hint: string }[] = [
  { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard, hint: 'KPIs e desempenho' },
  { id: 'followup', label: 'Follow-up', icon: CalendarCheck, hint: 'Contatos agendados' },
  { id: 'leads', label: 'Clientes', icon: Contact, hint: 'Base de leads' },
  { id: 'equipe', label: 'Equipe', icon: Users, hint: 'Vendedores' },
]

function Brand() {
  const empresa = useData((s) => s.perfil.empresa) || BRAND.name
  return (
    <div className="flex items-center gap-3 px-3">
      <Logo size={40} />
      <div className="min-w-0 leading-tight">
        <div className="truncate font-display text-[15px] font-bold text-ink">{empresa}</div>
        <div className="text-[11px] font-medium text-ink-mute">{BRAND.tagline}</div>
      </div>
    </div>
  )
}

export function Sidebar() {
  const { page, setPage } = useUI()
  const perfil = useData((s) => s.perfil)
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-hair bg-surface/70 backdrop-blur-xl lg:flex">
      <div className="flex h-[68px] items-center">
        <Brand />
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-3">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-mute">
          Operação
        </div>
        {NAV.map((n) => {
          const active = page === n.id
          const Icon = n.icon
          return (
            <button
              key={n.id}
              onClick={() => setPage(n.id)}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200',
                active ? 'text-white' : 'text-ink-sub hover:text-ink hover:bg-white/[0.04]',
              )}
            >
              {active && (
                <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-ember/20 to-ember/5 ring-1 ring-ember/30" />
              )}
              {active && (
                <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-ember shadow-[0_0_12px_2px_rgba(255,76,36,0.7)]" />
              )}
              <Icon
                size={19}
                className={cn('relative shrink-0', active ? 'text-ember' : 'text-ink-mute group-hover:text-ink-sub')}
              />
              <span className="relative flex-1 text-left">{n.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="space-y-2 border-t border-hair p-3">
        <button
          onClick={() => setPage('perfil')}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors',
            page === 'perfil' ? 'bg-white/[0.06] ring-1 ring-ember/25' : 'bg-white/[0.02] hover:bg-white/[0.05]',
          )}
        >
          <Avatar name={perfil.nome} size="sm" src={perfil.foto} />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-xs font-semibold text-ink">{perfil.nome}</div>
            <div className="text-[10px] text-ink-mute">Ver perfil</div>
          </div>
          <Settings size={15} className={cn('shrink-0', page === 'perfil' ? 'text-ember' : 'text-ink-mute')} />
        </button>

        <div className="flex items-center gap-3 rounded-xl bg-white/[0.02] p-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-ember/25 to-transparent ring-1 ring-ember/25">
            <Sparkles size={16} className="text-ember" />
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-xs font-semibold text-ink">Meta do mês</div>
            <div className="text-[11px] text-ink-mute">Bata R$ 250 mil</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export function BottomNav() {
  const { page, setPage } = useUI()
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-hair bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      aria-label="Navegação principal"
    >
      {NAV.map((n) => {
        const active = page === n.id
        const Icon = n.icon
        return (
          <button
            key={n.id}
            onClick={() => setPage(n.id)}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors',
              active ? 'text-ember' : 'text-ink-mute',
            )}
          >
            <Icon size={20} />
            {n.label}
          </button>
        )
      })}
    </nav>
  )
}
