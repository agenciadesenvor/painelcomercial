import { LayoutDashboard, CalendarCheck, Contact, Users, Megaphone, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useUI, useData, type Page } from '@/lib/store'
import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/brand'
import { Logo } from './Logo'
import { Avatar } from './Avatar'
import { Sidebar as SidebarRoot, DesktopSidebar, SidebarLink, useSidebar } from './ui/sidebar'

/** Larguras do rail recolhido e da sidebar expandida (px) */
export const RAIL = 68
export const EXPANDED = 268

const NAV: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'followup', label: 'Follow-up', icon: CalendarCheck },
  { id: 'leads', label: 'Clientes', icon: Contact },
  { id: 'trafego', label: 'Tráfego', icon: Megaphone },
  { id: 'equipe', label: 'Equipe', icon: Users },
]

/** Texto que some quando o rail está recolhido */
function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const { open } = useSidebar()
  return (
    <motion.div
      initial={false}
      animate={{ opacity: open ? 1 : 0, display: open ? 'block' : 'none' }}
      transition={{ duration: 0.15 }}
      className={cn('min-w-0 whitespace-pre', className)}
    >
      {children}
    </motion.div>
  )
}

function SidebarInner() {
  const { page, setPage } = useUI()
  const perfil = useData((s) => s.perfil)
  const empresa = useData((s) => s.perfil.empresa) || BRAND.name

  return (
    <>
      {/* Marca */}
      <div className="flex h-[68px] shrink-0 items-center gap-3">
        <Logo size={40} className="shrink-0" />
        <Reveal className="leading-tight">
          <div className="truncate font-display text-[15px] font-bold text-ink">{empresa}</div>
          <div className="text-[11px] font-medium text-ink-mute">{BRAND.tagline}</div>
        </Reveal>
      </div>

      {/* Navegação */}
      <nav className="flex flex-1 flex-col gap-1 py-3">
        <Reveal className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-mute">
          Operação
        </Reveal>
        {NAV.map((n) => {
          const active = page === n.id
          const Icon = n.icon
          return (
            <SidebarLink
              key={n.id}
              title={n.label}
              link={{
                label: n.label,
                onClick: () => setPage(n.id),
                icon: <Icon size={19} className={cn('shrink-0', active ? 'text-ember' : 'text-ink-mute')} />,
              }}
              className={cn(
                'relative rounded-xl px-3 transition-colors',
                active
                  ? 'bg-gradient-to-r from-ember/20 to-ember/5 font-semibold text-ink ring-1 ring-ember/30 before:absolute before:-left-3 before:top-1/2 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-ember before:shadow-[0_0_12px_2px_rgba(253,78,23,0.7)]'
                  : 'font-semibold text-ink-sub hover:bg-overlay-2 hover:text-ink',
              )}
            />
          )
        })}
      </nav>

      {/* Rodapé: perfil + meta */}
      <div className="shrink-0 space-y-2 border-t border-hair py-3">
        <SidebarLink
          title="Ver perfil"
          link={{
            label: perfil.nome,
            onClick: () => setPage('perfil'),
            icon: <Avatar name={perfil.nome} size="sm" src={perfil.foto} />,
          }}
          className={cn(
            'rounded-xl px-2 text-xs font-semibold',
            page === 'perfil'
              ? 'bg-overlay-2 text-ink ring-1 ring-ember/25'
              : 'text-ink-sub hover:bg-overlay-2 hover:text-ink',
          )}
        />

        <div className="flex items-center gap-2 rounded-xl bg-overlay px-2 py-2" title="Meta do mês">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-ember/25 to-transparent ring-1 ring-ember/25">
            <Sparkles size={15} className="text-ember" />
          </div>
          <Reveal className="leading-tight">
            <div className="truncate text-xs font-semibold text-ink">Meta do mês</div>
            <div className="text-[11px] text-ink-mute">Bata R$ 250 mil</div>
          </Reveal>
        </div>
      </div>
    </>
  )
}

export function Sidebar() {
  return (
    <SidebarRoot>
      <DesktopSidebar
        widthOpen={EXPANDED}
        widthClosed={RAIL}
        className="fixed inset-y-0 left-0 z-30 hidden overflow-hidden border-r border-hair bg-surface/70 !px-3 !py-0 backdrop-blur-xl lg:flex"
      >
        <SidebarInner />
      </DesktopSidebar>
    </SidebarRoot>
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
