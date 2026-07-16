import { X, Pencil, Trash2, Phone, MapPin, Megaphone, Package, CalendarClock, ArrowRight } from 'lucide-react'
import { useData, useUI } from '../lib/store'
import { STATUS, STATUS_ORDER, type StatusId } from '../lib/types'
import { Avatar } from './Avatar'
import { StatusBadge } from './StatusBadge'
import { money, formatDateLong, timeAgoFull, UF_NOME, cn, daysUntil } from '../lib/utils'

function InfoRow({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-hair bg-overlay text-ink-mute">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-mute">{label}</div>
        <div className="truncate text-sm font-medium text-ink">{value}</div>
      </div>
    </div>
  )
}

export function LeadDetail() {
  const { detailId, closeDetail, openEditor, notify } = useUI()
  const { leads, moveStatus, deleteLead } = useData()
  const lead = detailId ? leads.find((l) => l.id === detailId) : null

  if (!lead) return null

  const waDigits = lead.telefone.replace(/\D/g, '')
  const followDays = daysUntil(lead.proximoFollowUp)

  return (
    <div className="fixed inset-0 z-[65] flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeDetail} />
      <div className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-hair bg-surface shadow-lift"
        style={{ animation: 'fade-up .35s cubic-bezier(.16,1,.3,1) both' }}
      >
        {/* header */}
        <div className="relative overflow-hidden border-b border-hair px-6 pb-5 pt-6">
          <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-ember/20 blur-3xl" />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={lead.responsavel} size="lg" />
              <div>
                <div className="font-display text-lg font-bold leading-tight text-ink">{lead.cliente}</div>
                <div className="mt-0.5 text-xs text-ink-mute">
                  #{lead.numero} · {lead.cidade || UF_NOME[lead.estado]}/{lead.estado}
                </div>
              </div>
            </div>
            <button onClick={closeDetail} className="grid h-9 w-9 place-items-center rounded-lg border border-hair text-ink-sub hover:text-ink" aria-label="Fechar">
              <X size={18} />
            </button>
          </div>
          <div className="relative mt-4 flex items-center gap-3">
            <StatusBadge status={lead.status} />
            {lead.origemTrafego && (
              <span className="inline-flex items-center gap-1 rounded-md bg-ember/15 px-1.5 py-0.5 text-[10px] font-bold text-ember">
                <Megaphone size={11} /> TRÁFEGO
              </span>
            )}
            <div className="ml-auto text-right">
              <div className="font-display text-xl font-bold text-ink tnum">{money(lead.valor)}</div>
              <div className="text-[10px] text-ink-mute">valor estimado</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Ações rápidas */}
          <div className="flex gap-2">
            <a
              href={waDigits ? `https://wa.me/55${waDigits}` : undefined}
              target="_blank"
              rel="noreferrer"
              className={cn('btn-ember flex-1', !waDigits && 'pointer-events-none opacity-40')}
            >
              <Phone size={15} /> WhatsApp
            </a>
            <button onClick={() => openEditor(lead.id)} className="btn-ghost" aria-label="Editar">
              <Pencil size={15} /> Editar
            </button>
            <button
              onClick={() => {
                deleteLead(lead.id)
                closeDetail()
                notify('Lead removido', 'danger')
              }}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-danger/30 text-danger transition-colors hover:bg-danger/10"
              aria-label="Excluir"
            >
              <Trash2 size={16} />
            </button>
          </div>

          {/* Mover estágio */}
          <div className="mt-5">
            <div className="label">Mover para estágio</div>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_ORDER.map((s) => {
                const active = s === lead.status
                const m = STATUS[s]
                return (
                  <button
                    key={s}
                    onClick={() => {
                      if (!active) {
                        moveStatus(lead.id, s)
                        notify(`Movido para "${m.short}"`, 'info')
                      }
                    }}
                    className={cn('rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all', active ? 'text-ink' : 'text-ink-sub hover:text-ink')}
                    style={{
                      borderColor: active ? m.color + '66' : 'var(--hair)',
                      background: active ? m.color + '22' : 'transparent',
                    }}
                  >
                    {m.short}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Dados */}
          <div className="mt-5 rounded-2xl border border-hair bg-overlay px-4">
            <InfoRow icon={Phone} label="Telefone" value={lead.telefone || '—'} />
            <div className="border-t border-hair" />
            <InfoRow icon={MapPin} label="Localização" value={`${lead.cidade || '—'} · ${UF_NOME[lead.estado]}`} />
            <div className="border-t border-hair" />
            <InfoRow icon={Megaphone} label="Campanha" value={lead.campanha} />
            <div className="border-t border-hair" />
            <InfoRow icon={Package} label="Produto" value={lead.produto} />
            <div className="border-t border-hair" />
            <InfoRow
              icon={CalendarClock}
              label="Próximo follow-up"
              value={
                lead.proximoFollowUp ? (
                  <span className={cn(followDays !== null && followDays < 0 && 'text-danger', followDays === 0 && 'text-warning')}>
                    {formatDateLong(lead.proximoFollowUp)}
                    {followDays !== null && (
                      <span className="ml-1 text-xs text-ink-mute">
                        ({followDays < 0 ? `${-followDays}d atrasado` : followDays === 0 ? 'hoje' : `em ${followDays}d`})
                      </span>
                    )}
                  </span>
                ) : (
                  '—'
                )
              }
            />
          </div>

          {lead.observacao && (
            <div className="mt-4 rounded-2xl border border-ember/20 bg-ember/[0.06] p-4">
              <div className="label !text-ember/80">Observação</div>
              <p className="text-sm text-ink">{lead.observacao}</p>
            </div>
          )}

          {/* Histórico */}
          <div className="mt-6">
            <div className="label">Histórico</div>
            <div className="relative space-y-3 pl-1">
              {[...lead.historico].reverse().map((e, i) => (
                <div key={i} className="relative flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full" style={{ background: STATUS[e.para].color }} />
                    {i < lead.historico.length - 1 && <span className="w-px flex-1 bg-hair" />}
                  </div>
                  <div className="-mt-0.5 pb-1">
                    <div className="flex items-center gap-1.5 text-sm text-ink">
                      {e.de ? (
                        <>
                          <span className="text-ink-mute">{STATUS[e.de].short}</span>
                          <ArrowRight size={12} className="text-ink-mute" />
                        </>
                      ) : null}
                      <span className="font-semibold">{e.nota ?? STATUS[e.para].short}</span>
                    </div>
                    <div className="text-[11px] text-ink-mute">
                      {e.por} · {timeAgoFull(e.data)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
