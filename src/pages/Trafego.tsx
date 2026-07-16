import { useEffect, useMemo, useState } from 'react'
import {
  Plus, Pencil, Trash2, Megaphone, Wallet, TrendingUp, Target, X, Info, CalendarDays,
} from 'lucide-react'
import { useData, useUI } from '../lib/store'
import { computeTrafegoResumo, trafegoPorMes } from '../lib/analytics'
import type { TrafegoLancamento } from '../lib/types'
import { money, moneyShort, dec2, num, pct, cn } from '../lib/utils'
import { PageTitle, CardHead } from '../components/Kit'

/** 'YYYY-MM' → 'jul/2026' */
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
function mesLabel(mes: string): string {
  const [ano, m] = mes.split('-').map(Number)
  return `${MESES[(m ?? 1) - 1]}/${ano}`
}

function KpiBig({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'ember' | 'positive' | 'danger' }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mute">{label}</div>
      <div
        className={cn(
          'mt-1.5 font-display text-2xl font-bold tnum sm:text-[27px]',
          tone === 'ember' ? 'text-ember' : tone === 'positive' ? 'text-positive' : tone === 'danger' ? 'text-danger' : 'text-ink',
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-ink-mute">{sub}</div>}
    </div>
  )
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: 'positive' | 'danger' }) {
  return (
    <div className="rounded-xl border border-hair bg-overlay px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-mute">{label}</div>
      <div className={cn('mt-0.5 font-display text-lg font-bold text-ink tnum', tone === 'positive' && 'text-positive', tone === 'danger' && 'text-danger')}>
        {value}
      </div>
    </div>
  )
}

/** Cria/edita um lançamento mensal (investido em mídia + honorários). */
function LancamentoModal({ editando, onClose }: { editando: TrafegoLancamento | null; onClose: () => void }) {
  const addLancamento = useData((s) => s.addLancamento)
  const updateLancamento = useData((s) => s.updateLancamento)
  const notify = useUI((s) => s.notify)
  const [mes, setMes] = useState(editando?.mes ?? new Date().toISOString().slice(0, 7))
  const [investido, setInvestido] = useState(editando ? String(editando.investido) : '')
  const [honorarios, setHonorarios] = useState(editando ? String(editando.honorarios) : '')
  const [obs, setObs] = useState(editando?.observacao ?? '')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function save() {
    if (!mes) return notify('Informe o mês de referência', 'danger')
    const payload = {
      mes,
      investido: Number(investido.replace(/\D/g, '')) || 0,
      honorarios: Number(honorarios.replace(/\D/g, '')) || 0,
      observacao: obs.trim() || undefined,
    }
    const ok = editando ? updateLancamento(editando.id, payload) : addLancamento(payload)
    if (!ok) return notify(`Já existe lançamento para ${mesLabel(mes)} — edite o existente`, 'danger')
    notify(editando ? `Lançamento de ${mesLabel(mes)} atualizado` : `Lançamento de ${mesLabel(mes)} adicionado`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md animate-fade-up rounded-t-3xl border border-hair bg-surface p-6 shadow-lift sm:rounded-3xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ember/15 text-ember">
              <Megaphone size={19} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-ink">
                {editando ? 'Editar lançamento' : 'Novo lançamento'}
              </h2>
              <p className="text-xs text-ink-mute">Gasto do mês com tráfego pago</p>
            </div>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-hair text-ink-sub hover:text-ink" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="label">Mês de referência</span>
            <input type="month" className="input" value={mes} onChange={(e) => setMes(e.target.value)} autoFocus={!editando} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="label">Investido em mídia (R$)</span>
              <input className="input tnum" value={investido} onChange={(e) => setInvestido(e.target.value)} placeholder="0" inputMode="numeric" />
            </label>
            <label className="block">
              <span className="label">Honorários da agência (R$)</span>
              <input className="input tnum" value={honorarios} onChange={(e) => setHonorarios(e.target.value)} placeholder="0" inputMode="numeric" />
            </label>
          </div>
          <label className="block">
            <span className="label">Observação (opcional)</span>
            <input className="input" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex.: campanha de lançamento" />
          </label>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={save} className="btn-ember">{editando ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </div>
    </div>
  )
}

export function Trafego() {
  const leads = useData((s) => s.leads)
  const lancamentos = useData((s) => s.lancamentos)
  const deleteLancamento = useData((s) => s.deleteLancamento)
  const notify = useUI((s) => s.notify)

  const k = useMemo(() => computeTrafegoResumo(leads, lancamentos), [leads, lancamentos])
  const meses = useMemo(() => trafegoPorMes(leads, lancamentos), [leads, lancamentos])
  const semLeadsTrafego = useMemo(() => !leads.some((l) => l.origemTrafego), [leads])

  // undefined = fechado; null = novo; objeto = editando
  const [modal, setModal] = useState<TrafegoLancamento | null | undefined>(undefined)

  const maxMes = Math.max(...meses.map((m) => Math.max(m.investimento, m.retorno)), 1)

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle title="Tráfego pago" sub="Gasto lançado manualmente · retorno medido pelo funil" />
        <button onClick={() => setModal(null)} className="btn-ember self-start sm:self-auto">
          <Plus size={16} strokeWidth={2.5} /> Novo lançamento
        </button>
      </div>

      {/* Aviso quando nenhuma venda está marcada como tráfego */}
      {semLeadsTrafego && (
        <div className="flex items-start gap-3 rounded-2xl border border-ember/30 bg-ember/10 p-4">
          <Info size={17} className="mt-0.5 shrink-0 text-ember" />
          <p className="text-sm text-ink-sub">
            Nenhuma venda está marcada como <strong className="text-ink">Cliente de tráfego</strong> ainda.
            Ao cadastrar (ou editar) uma venda, ligue a chave "Cliente de tráfego" — é ela que alimenta o
            retorno, o ROAS e o CAC desta página.
          </p>
        </div>
      )}

      {/* ── Resultado geral ── */}
      <div className="glass-hero p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Resultado geral</h2>
            <p className="text-xs text-ink-sub">Investimento (mídia + honorários) × retorno em vendas concluídas</p>
          </div>
          <span className="chip">
            <CalendarDays size={13} className="text-ember" /> {num(lancamentos.length)}{' '}
            {lancamentos.length === 1 ? 'mês lançado' : 'meses lançados'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-4">
          <KpiBig
            label="Investimento total"
            value={money(k.investimentoTotal)}
            sub={`${money(k.investido)} mídia + ${money(k.honorarios)} honorários`}
          />
          <KpiBig label="Retorno (vendas)" value={money(k.retorno)} sub={`${num(k.vendas)} vendas concluídas`} />
          <KpiBig label="Lucro" value={money(k.lucro)} tone={k.lucro >= 0 ? 'positive' : 'danger'} sub="retorno − investimento" />
          <KpiBig label="ROAS" value={`${dec2(k.roas)}×`} tone="ember" sub="retorno / mídia" />
        </div>
      </div>

      {/* ── Indicadores ── */}
      <div className="panel p-5">
        <CardHead title="Indicadores" sub="Custo e eficiência dos leads vindos de anúncio" right={<Target size={16} className="text-ember" />} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label="ROI" value={pct(k.roi * 100)} tone={k.roi >= 0 ? 'positive' : 'danger'} />
          <MiniStat label="CAC" value={k.vendas ? money(Math.round(k.cac)) : '—'} />
          <MiniStat label="Custo por lead" value={k.leads ? money(Math.round(k.custoLead)) : '—'} />
          <MiniStat label="Ticket médio" value={k.vendas ? money(Math.round(k.ticket)) : '—'} />
          <MiniStat label="Leads de tráfego" value={num(k.leads)} />
          <MiniStat label="Vendas" value={num(k.vendas)} />
          <MiniStat label="Conversão" value={pct(k.conversao)} />
          <MiniStat label="Em aberto (potencial)" value={moneyShort(k.emAberto)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ── Investimento × retorno por mês ── */}
        <div className="panel p-5">
          <CardHead title="Investimento × retorno" sub="Comparativo mês a mês" right={<TrendingUp size={16} className="text-ink-mute" />} />
          {meses.length ? (
            <div className="space-y-4">
              {meses.map((m) => (
                <div key={m.mes}>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="text-sm font-semibold capitalize text-ink">{mesLabel(m.mes)}</span>
                    <span
                      className={cn(
                        'text-[11px] font-bold tnum',
                        m.retorno >= m.investimento ? 'text-positive' : 'text-danger',
                      )}
                    >
                      {m.investimento ? `${dec2(m.retorno / m.investimento)}×` : '—'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-overlay-2">
                        <div className="h-full rounded-full bg-ember transition-all duration-700" style={{ width: `${(m.investimento / maxMes) * 100}%` }} />
                      </div>
                      <span className="w-20 shrink-0 text-right text-[11px] font-semibold text-ink-sub tnum">{moneyShort(m.investimento)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-overlay-2">
                        <div className="h-full rounded-full bg-positive transition-all duration-700" style={{ width: `${(m.retorno / maxMes) * 100}%` }} />
                      </div>
                      <span className="w-20 shrink-0 text-right text-[11px] font-semibold text-ink-sub tnum">{moneyShort(m.retorno)}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-4 pt-1 text-[11px] text-ink-mute">
                <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-ember" /> Investimento</span>
                <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-positive" /> Retorno</span>
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-ink-mute">Sem dados ainda — adicione um lançamento.</p>
          )}
        </div>

        {/* ── Lançamentos mensais ── */}
        <div className="panel p-5">
          <CardHead title="Lançamentos mensais" sub="Investido em mídia + honorários da agência" right={<Wallet size={16} className="text-ink-mute" />} />
          {lancamentos.length ? (
            <div className="space-y-2.5">
              {[...lancamentos].reverse().map((l) => (
                <div key={l.id} className="rounded-xl border border-hair bg-overlay p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-display text-sm font-bold capitalize text-ink">{mesLabel(l.mes)}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setModal(l)}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-hair text-ink-sub hover:text-ink"
                        aria-label={`Editar ${mesLabel(l.mes)}`}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => {
                          deleteLancamento(l.id)
                          notify(`Lançamento de ${mesLabel(l.mes)} removido`, 'danger')
                        }}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-hair text-ink-sub hover:border-danger/40 hover:text-danger"
                        aria-label={`Remover ${mesLabel(l.mes)}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  {/* valores exatos — aqui o usuário confere o que digitou */}
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-overlay-2 px-2 py-1.5">
                      <div className="text-[9px] font-semibold uppercase tracking-wider text-ink-mute">Mídia</div>
                      <div className="text-xs font-bold text-ink tnum">{money(l.investido)}</div>
                    </div>
                    <div className="rounded-lg bg-overlay-2 px-2 py-1.5">
                      <div className="text-[9px] font-semibold uppercase tracking-wider text-ink-mute">Honorários</div>
                      <div className="text-xs font-bold text-ink tnum">{money(l.honorarios)}</div>
                    </div>
                    <div className="rounded-lg bg-ember/12 px-2 py-1.5">
                      <div className="text-[9px] font-semibold uppercase tracking-wider text-ink-mute">Total</div>
                      <div className="text-xs font-bold text-ember tnum">{money(l.investido + l.honorarios)}</div>
                    </div>
                  </div>
                  {l.observacao && <p className="mt-2 truncate text-[11px] text-ink-mute">{l.observacao}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid place-items-center px-6 py-10 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-hair bg-overlay text-ink-mute">
                <Megaphone size={20} />
              </div>
              <p className="mt-3 max-w-xs text-sm text-ink-mute">
                Nenhum gasto lançado. Adicione o investido e os honorários de cada mês para calcular ROAS, CAC e lucro.
              </p>
              <button onClick={() => setModal(null)} className="btn-ember mt-4 py-2 text-xs">
                <Plus size={14} strokeWidth={2.5} /> Lançar primeiro mês
              </button>
            </div>
          )}
        </div>
      </div>

      {modal !== undefined && <LancamentoModal editando={modal} onClose={() => setModal(undefined)} />}
    </div>
  )
}
