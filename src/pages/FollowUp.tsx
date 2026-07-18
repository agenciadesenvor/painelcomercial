import { useMemo, useState } from 'react'
import { GripVertical, ChevronDown, Plus, CalendarClock, MessageCircle } from 'lucide-react'
import { useData, useUI } from '../lib/store'
import { STATUS, STATUS_ORDER, type StatusId, type Lead } from '../lib/types'
import { cn, UF_NOME, money, moneyShort, daysUntil, formatDate } from '../lib/utils'
import { Avatar } from '../components/Avatar'
import { PageTitle } from '../components/Kit'

function dateLabel(l: Lead): { text: string; color: string } | null {
  if (!l.proximoFollowUp) return null
  const d = daysUntil(l.proximoFollowUp)
  if (d === null) return null
  if (d < 0) return { text: `${-d}d atrasado`, color: '#F5544F' }
  if (d === 0) return { text: 'Hoje', color: '#FF7A21' }
  if (d === 1) return { text: 'Amanhã', color: '#FBBF24' }
  return { text: formatDate(l.proximoFollowUp), color: d <= 7 ? '#38BDF8' : '#8B5CF6' }
}

function FollowCard({
  lead,
  onOpen,
  onDragStart,
  dragging,
}: {
  lead: Lead
  onOpen: () => void
  onDragStart: (e: React.DragEvent) => void
  dragging: boolean
}) {
  const dl = dateLabel(lead)
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onOpen}
      className={cn(
        'group cursor-pointer rounded-xl border border-hair bg-elevated/80 p-3 transition-all duration-200 hover:border-hair-strong hover:shadow-lift',
        dragging && 'opacity-40',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold text-ink">{lead.cliente}</div>
          <div className="mt-0.5 text-[11px] text-ink-mute">
            {lead.cidade || UF_NOME[lead.estado]} · {lead.estado}
          </div>
        </div>
        <GripVertical size={14} className="mt-0.5 shrink-0 text-ink-mute opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className="rounded-md bg-overlay-2 px-1.5 py-0.5 text-[10px] font-medium text-ink-sub">
          {lead.campanha}
        </span>
        {dl && (
          <span
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ color: dl.color, background: dl.color + '18' }}
          >
            <CalendarClock size={10} />
            {dl.text}
          </span>
        )}
      </div>

      {lead.observacao && (
        <div className="mt-2 truncate text-[11px] text-ink-sub">{lead.observacao}</div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-hair pt-2.5">
        <span className="font-display text-sm font-bold text-ink tnum">{money(lead.valor)}</span>
        <div className="flex items-center gap-2">
          {!!lead.interacoes?.length && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-mute tnum" title={`${lead.interacoes.length} contato(s) registrado(s)`}>
              <MessageCircle size={12} /> {lead.interacoes.length}
            </span>
          )}
          <Avatar name={lead.responsavel} size="xs" />
        </div>
      </div>
    </div>
  )
}

export function FollowUp() {
  const leads = useData((s) => s.leads)
  const moveStatus = useData((s) => s.moveStatus)
  const vendedores = useData((s) => s.vendedores)
  const { openDetail, openEditor, notify } = useUI()
  const [dragId, setDragId] = useState<string | null>(null)
  const [overCol, setOverCol] = useState<StatusId | null>(null)
  const [fVend, setFVend] = useState('all')

  const byStatus = useMemo(() => {
    const filtered = fVend === 'all' ? leads : leads.filter((l) => l.responsavel === fVend)
    const map: Record<StatusId, Lead[]> = {
      novo: [], sem_retorno: [], recontato: [], negociando: [], ganho: [], perdido: [],
    }
    for (const l of filtered) map[l.status].push(l)
    return map
  }, [leads, fVend])

  function onDrop(col: StatusId) {
    if (dragId) {
      const lead = leads.find((l) => l.id === dragId)
      if (lead && lead.status !== col) {
        moveStatus(dragId, col)
        notify(`"${lead.cliente}" → ${STATUS[col].short}`, 'info')
      }
    }
    setDragId(null)
    setOverCol(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle title="Follow-up" sub="Arraste os cards para mover o lead entre os estágios" />
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={fVend}
              onChange={(e) => setFVend(e.target.value)}
              className="input appearance-none py-2 pr-9 text-sm"
            >
              <option value="all">Todos os vendedores</option>
              {vendedores.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute" />
          </div>
          <button onClick={() => openEditor(null)} className="btn-ember">
            <Plus size={16} strokeWidth={2.5} /> <span className="hidden sm:inline">Novo</span>
          </button>
        </div>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
        <div className="flex gap-3">
          {STATUS_ORDER.map((col) => {
            const items = byStatus[col]
            const total = items.reduce((a, l) => a + l.valor, 0)
            const m = STATUS[col]
            return (
              <div
                key={col}
                onDragOver={(e) => {
                  e.preventDefault()
                  setOverCol(col)
                }}
                onDragLeave={() => setOverCol((c) => (c === col ? null : c))}
                onDrop={() => onDrop(col)}
                className={cn(
                  'flex min-w-[248px] flex-1 flex-col rounded-2xl border bg-surface/50 transition-colors',
                  overCol === col ? 'border-ember/40 bg-ember/[0.04]' : 'border-hair',
                )}
              >
                {/* header coluna */}
                <div className="flex items-center gap-2 border-b border-hair px-3.5 py-3">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />
                  <span className="text-[13px] font-bold text-ink">{m.short}</span>
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-overlay-2 px-1.5 text-[11px] font-bold text-ink-sub tnum">
                    {items.length}
                  </span>
                  <span className="ml-auto text-[11px] font-semibold text-ink-mute tnum">{moneyShort(total)}</span>
                </div>

                {/* cards */}
                <div className="flex max-h-[calc(100vh-240px)] min-h-[120px] flex-col gap-2.5 overflow-y-auto p-2.5">
                  {items.length === 0 && (
                    <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-hair py-8 text-center text-[11px] text-ink-mute">
                      Solte um lead aqui
                    </div>
                  )}
                  {items.map((l) => (
                    <FollowCard
                      key={l.id}
                      lead={l}
                      dragging={dragId === l.id}
                      onOpen={() => openDetail(l.id)}
                      onDragStart={(e) => {
                        setDragId(l.id)
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
