import { useMemo, useState } from 'react'
import {
  Target, Activity, Flame, Users2, ArrowUpRight, ArrowDownRight, MapPin,
  ArrowRight, Download, Plus, Star, MoreHorizontal, ExternalLink, CalendarClock, ChevronRight,
} from 'lucide-react'
import { useData, useUI } from '../lib/store'
import {
  computeKpis, porStatus, porEstado, porVendedor, atividadeRecente, funil,
  serieReceitaDiaria, serieCriacao, movingAvg, valorEmRisco,
} from '../lib/analytics'
import { STATUS, FUNIL } from '../lib/types'
import { money, moneyShort, num, pct, cn, UF_NOME, timeAgoFull, vendedorColor } from '../lib/utils'
import { CardHead, BarStat } from '../components/Kit'
import { AreaLine } from '../components/charts/AreaLine'
import { Donut } from '../components/charts/Donut'
import { Avatar } from '../components/Avatar'
import { StatusBadge } from '../components/StatusBadge'
import { BrazilMap } from '../components/charts/BrazilMap'
import { Logo } from '../components/Logo'
import { BRAND } from '../lib/brand'

function dayLabels(n: number): string[] {
  const out: string[] = []
  const base = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(base.getDate() - i)
    out.push(d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }))
  }
  return out
}

function Delta({ up, children }: { up: boolean; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs font-bold', up ? 'text-positive' : 'text-danger')}>
      {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
      {children}
    </span>
  )
}

const PERIODS = [
  { k: '7D', n: 7 },
  { k: '30D', n: 30 },
  { k: '90D', n: 90 },
  { k: 'MAX', n: 90 },
] as const

export function Dashboard() {
  const leads = useData((s) => s.leads)
  const empresa = useData((s) => s.perfil.empresa) || BRAND.name
  const { openEditor, openDetail, setFiltro, setPage } = useUI()
  const [period, setPeriod] = useState<string>('30D')

  const k = useMemo(() => computeKpis(leads), [leads])
  const risco = useMemo(() => valorEmRisco(leads), [leads])
  const status = useMemo(() => porStatus(leads), [leads])
  const estados = useMemo(() => porEstado(leads), [leads])
  const vendedores = useMemo(() => porVendedor(leads), [leads])
  const atividade = useMemo(() => atividadeRecente(leads, 6), [leads])
  const fun = useMemo(() => funil(leads), [leads])
  const top = vendedores[0]

  const nDays = PERIODS.find((p) => p.k === period)!.n
  const daily = useMemo(() => serieReceitaDiaria(leads, nDays), [leads, nDays])
  const ghost = useMemo(() => movingAvg(daily, 6), [daily])
  const labels = useMemo(() => dayLabels(nDays), [nDays])
  const sparkSeed = useMemo(() => serieCriacao(leads, 14), [leads])

  const maxEstado = Math.max(...estados.map((e) => e.total), 1)
  const estadoCounts = Object.fromEntries(estados.map((e) => [e.uf, e.total]))
  const maxVend = Math.max(...vendedores.map((v) => v.receita), 1)
  const totalFunil = FUNIL.reduce((a, id) => a + (fun.find((f) => f.id === id)?.count ?? 0), 0) || 1

  const portfolio = [
    { label: 'Receita Ganha', value: money(k.receitaGanha), delta: '+22%', up: true },
    { label: 'Em aberto', value: money(k.valorEmAberto), delta: '+28%', up: true },
    { label: 'Ticket Médio', value: money(k.ticketMedio), delta: '+14%', up: true },
    { label: 'Em Risco', value: money(risco), delta: '-12%', up: false },
  ]

  // range label do card lateral
  const range = (() => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 9)
    const f = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    return `${f(start)} – ${f(end)}`
  })()

  return (
    <div className="space-y-5">
      {/* ───────── HERO ───────── */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.95fr_1fr]">
          {/* Coluna esquerda */}
          <div className="space-y-4">
            {/* Overall Portfolio */}
            <div className="glass-hero p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-bold text-ink">Carteira Comercial</h2>
                  <p className="text-xs text-ink-sub">Desempenho consolidado · vs. mês anterior</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-ghost !border-white/15 !bg-white/5 py-2 text-xs backdrop-blur">
                    <Download size={14} /> Exportar
                  </button>
                  <button onClick={() => openEditor(null)} className="btn-ember py-2 text-xs">
                    <Plus size={15} strokeWidth={2.5} /> Novo lead
                  </button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
                {portfolio.map((m, i) => (
                  <div key={m.label} className={cn('relative', i > 0 && 'sm:pl-4 sm:before:absolute sm:before:left-0 sm:before:top-1 sm:before:h-[80%] sm:before:w-px sm:before:bg-white/10')}>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-ink-sub">{m.label}</span>
                      <Delta up={m.up}>{m.delta}</Delta>
                    </div>
                    <div className="mt-1.5 font-display text-xl font-bold text-ink tnum sm:text-[22px]">{m.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Overview Statistic */}
            <div className="glass p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Logo size={44} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-[15px] font-bold text-ink">{empresa}</span>
                      <span className="text-xs font-medium text-ink-mute">({BRAND.short})</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="font-display text-xl font-bold text-ink tnum">{moneyShort(k.receitaGanha)}</span>
                      <Delta up>+26%</Delta>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="flex rounded-xl border border-hair bg-white/[0.02] p-0.5">
                    {PERIODS.map((p) => (
                      <button
                        key={p.k}
                        onClick={() => setPeriod(p.k)}
                        className={cn(
                          'rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors tnum',
                          period === p.k ? 'bg-ember text-white shadow-[0_4px_12px_-4px_rgba(255,76,36,0.8)]' : 'text-ink-mute hover:text-ink',
                        )}
                      >
                        {p.k}
                      </button>
                    ))}
                  </div>
                  <button className="grid h-8 w-8 place-items-center rounded-lg border border-hair text-ink-mute hover:text-ink"><Star size={15} /></button>
                  <button className="grid h-8 w-8 place-items-center rounded-lg border border-hair text-ink-mute hover:text-ink"><MoreHorizontal size={15} /></button>
                </div>
              </div>

              <div className="mt-4">
                <AreaLine data={daily} ghost={ghost} labels={labels} format={(v) => moneyShort(v)} height={280} />
              </div>
              <div className="mt-1 flex items-center gap-4 text-[11px] text-ink-mute">
                <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-ember" /> Receita diária</span>
                <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-violet" /> Média móvel</span>
              </div>
            </div>
          </div>

          {/* ── Coluna direita: destaque ── */}
          <div className="glass flex flex-col p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={top.nome} size="md" />
                <div>
                  <div className="font-display text-[15px] font-bold text-ink">{top.nome}</div>
                  <div className="text-xs text-ink-mute">Top vendedora · {BRAND.short}</div>
                </div>
              </div>
              <button
                onClick={() => setPage('equipe')}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-ember hover:underline"
              >
                Ver equipe <ExternalLink size={11} />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-hair bg-white/[0.03] px-4 py-3 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-mute">Receita da vendedora</div>
              <div className="font-display text-2xl font-bold text-ink tnum">{money(top.receita)}</div>
            </div>

            <div className="mt-5 grid place-items-center">
              <Donut
                size={188}
                thickness={18}
                segments={[
                  { value: top.ativos, color: '#FF6A3D', label: 'Ativos' },
                  { value: top.ganhos, color: '#34D399', label: 'Ganhos' },
                  { value: top.perdidos, color: '#F5544F', label: 'Perdidos' },
                ]}
                centerTop="Conversão"
                centerMain={pct(top.conversao)}
                centerSub="taxa de fechamento"
              />
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-hair bg-white/[0.02] py-1.5 text-xs text-ink-sub">
              <CalendarClock size={13} className="text-ink-mute" /> {range}
            </div>

            <div className="mt-4 space-y-2.5">
              {[
                { l: 'Em aberto', v: moneyShort(top.emAberto) },
                { l: 'Conversão', v: pct(top.conversao), pos: true },
                { l: 'Ticket médio', v: top.ganhos ? moneyShort(Math.round(top.receita / top.ganhos)) : '—' },
                { l: 'Leads ativos', v: num(top.ativos) },
              ].map((r) => (
                <div key={r.l} className="flex items-center justify-between text-sm">
                  <span className="text-ink-mute">{r.l}</span>
                  <span className={cn('font-semibold tnum', r.pos ? 'text-positive' : 'text-ink')}>{r.v}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setFiltro({ vendedor: top.nome, search: '', estado: 'all', status: 'all', campanha: 'all' })
                  setPage('leads')
                }}
                className="btn-ghost justify-center py-2.5 text-sm"
              >
                Ver leads
              </button>
              <button onClick={() => openEditor(null)} className="btn-ember justify-center py-2.5 text-sm">
                Novo lead
              </button>
            </div>
          </div>
        </div>

      {/* ───────── Funil ───────── */}
      <div className="panel p-5">
        <CardHead
          title="Funil de conversão"
          sub="Composição do funil por estágio"
          right={<span className="chip"><Target size={13} className="text-ember" /> {pct(k.taxaConversao)} de conversão</span>}
        />
        <div className="flex h-3 w-full overflow-hidden rounded-full">
          {FUNIL.map((id) => {
            const c = fun.find((f) => f.id === id)?.count ?? 0
            const w = (c / totalFunil) * 100
            if (w <= 0) return null
            return <div key={id} className="h-full transition-all duration-700" style={{ width: `${w}%`, background: STATUS[id].color }} title={`${STATUS[id].label}: ${c}`} />
          })}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {FUNIL.map((id, i) => {
            const c = fun.find((f) => f.id === id)?.count ?? 0
            return (
              <div key={id} className="rounded-xl border border-hair bg-white/[0.02] p-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: STATUS[id].color }} />
                  <span className="text-[11px] font-semibold text-ink-sub">{STATUS[id].short}</span>
                  {i < FUNIL.length - 1 && <ArrowRight size={11} className="ml-auto text-ink-mute" />}
                </div>
                <div className="mt-1.5 font-display text-xl font-bold text-ink tnum">{num(c)}</div>
                <div className="text-[10px] text-ink-mute">{pct((c / totalFunil) * 100)} do funil</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ───────── Mapa de clientes por estado ───────── */}
      <div className="panel p-5">
        <CardHead
          title="Clientes por estado"
          sub="Distribuição geográfica · clique num estado para filtrar"
          right={<MapPin size={16} className="text-ember" />}
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <BrazilMap
              counts={estadoCounts}
              max={maxEstado}
              onSelect={(uf) => {
                setFiltro({ estado: uf, search: '', vendedor: 'all', status: 'all', campanha: 'all' })
                setPage('leads')
              }}
            />
            <div className="mt-4 flex items-center gap-2 text-[11px] text-ink-mute">
              <span>Menos</span>
              <div className="h-2 flex-1 rounded-full" style={{ background: 'linear-gradient(90deg, rgba(255,76,36,0.16), rgba(255,76,36,0.92))' }} />
              <span>Mais</span>
              <span className="ml-2 chip">{estados.length} UFs ativas</span>
            </div>
          </div>
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Flame size={15} className="text-ember" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">Top estados</span>
            </div>
            <div className="space-y-3">
              {estados.slice(0, 7).map((e) => (
                <BarStat
                  key={e.uf}
                  label={`${e.uf} · ${UF_NOME[e.uf]}`}
                  value={e.total}
                  max={maxEstado}
                  color="#FF4C24"
                  leading={
                    <span className="grid h-8 w-9 shrink-0 place-items-center rounded-lg border border-hair bg-white/[0.02] font-display text-xs font-bold text-ember">
                      {e.uf}
                    </span>
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ───────── Vendedores + Atividade ───────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <CardHead title="Ranking de vendedores" sub="Por receita ganha" right={<Users2 size={16} className="text-ink-mute" />} />
          <div className="space-y-3.5">
            {vendedores.map((v, i) => (
              <div key={v.nome} className="flex items-center gap-3">
                <span className="w-4 text-center font-display text-sm font-bold text-ink-mute tnum">{i + 1}</span>
                <Avatar name={v.nome} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate font-semibold text-ink">{v.nome}</span>
                    <span className="ml-2 shrink-0 font-semibold text-ink-sub tnum">{moneyShort(v.receita)}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max((v.receita / maxVend) * 100, 3)}%`, background: vendedorColor(v.nome) }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-5">
          <CardHead title="Atividade recente" sub="Movimentações no funil" right={<Activity size={16} className="text-ink-mute" />} />
          <div className="space-y-1">
            {atividade.map((a, i) => (
              <button key={i} onClick={() => openDetail(a.leadId)} className="flex w-full items-center gap-3 rounded-lg px-1.5 py-2 text-left transition-colors hover:bg-white/[0.03]">
                <Avatar name={a.por} size="xs" ring={false} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] text-ink">
                    <span className="font-semibold">{a.por}</span>
                    <span className="text-ink-sub"> moveu </span>
                    <span className="font-medium">{a.cliente}</span>
                  </div>
                  <div className="text-[11px] text-ink-mute">{timeAgoFull(a.data)}</div>
                </div>
                <StatusBadge status={a.para} size="sm" />
              </button>
            ))}
            <button onClick={() => setPage('leads')} className="mt-1 flex w-full items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold text-ink-sub hover:text-ink">
              Ver todos os leads <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
