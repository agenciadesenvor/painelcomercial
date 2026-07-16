import { useMemo, useState } from 'react'
import {
  Search, X, ChevronDown, SlidersHorizontal, ArrowUpDown, Plus, Inbox, CalendarClock, Download, Megaphone,
} from 'lucide-react'
import { useData, useUI } from '../lib/store'
import { filterLeads } from '../lib/analytics'
import { STATUS, STATUS_ORDER, CAMPANHAS, type Lead } from '../lib/types'
import { money, moneyShort, num, cn, UF_NOME, UFS, daysUntil, formatDate } from '../lib/utils'
import { exportarLeads } from '../lib/export'
import { Avatar } from '../components/Avatar'
import { StatusBadge } from '../components/StatusBadge'
import { PageTitle } from '../components/Kit'

type SortKey = 'atualizadoEm' | 'valor' | 'cliente' | 'estado'

function FilterSelect({
  value, onChange, children, wide,
}: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn('input appearance-none py-2 pr-8 text-sm', wide ? 'min-w-[150px]' : 'min-w-[120px]')}
      >
        {children}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-mute" />
    </div>
  )
}

export function Leads() {
  const leads = useData((s) => s.leads)
  const vendedores = useData((s) => s.vendedores)
  const { filtros, setFiltro, clearFiltros, openDetail, openEditor, notify } = useUI()
  const [sortKey, setSortKey] = useState<SortKey>('atualizadoEm')
  const [dir, setDir] = useState<1 | -1>(-1)

  const estadosDisponiveis = useMemo(
    () => [...new Set(leads.map((l) => l.estado))].sort(),
    [leads],
  )

  const rows = useMemo(() => {
    const f = filterLeads(leads, filtros)
    const sorted = [...f].sort((a, b) => {
      let r = 0
      if (sortKey === 'valor') r = a.valor - b.valor
      else if (sortKey === 'cliente') r = a.cliente.localeCompare(b.cliente)
      else if (sortKey === 'estado') r = a.estado.localeCompare(b.estado)
      else r = +new Date(a.atualizadoEm) - +new Date(b.atualizadoEm)
      return r * dir
    })
    return sorted
  }, [leads, filtros, sortKey, dir])

  const totalValor = rows.reduce((a, l) => a + l.valor, 0)
  const activeFilters =
    (filtros.estado !== 'all' ? 1 : 0) +
    (filtros.vendedor !== 'all' ? 1 : 0) +
    (filtros.status !== 'all' ? 1 : 0) +
    (filtros.campanha !== 'all' ? 1 : 0) +
    (filtros.search ? 1 : 0)

  function toggleSort(k: SortKey) {
    if (sortKey === k) setDir((d) => (d === 1 ? -1 : 1))
    else {
      setSortKey(k)
      setDir(k === 'cliente' || k === 'estado' ? 1 : -1)
    }
  }

  const SortTh = ({ k, label, className }: { k: SortKey; label: string; className?: string }) => (
    <th className={cn('px-4 py-3 text-left', className)}>
      <button onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-ink-mute hover:text-ink">
        {label}
        <ArrowUpDown size={12} className={cn(sortKey === k ? 'text-ember' : 'opacity-40')} />
      </button>
    </th>
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle title="Clientes & Leads" sub={`${leads.length} cadastros na base comercial`} />
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              if (!rows.length) return notify('Nada para exportar com esses filtros', 'danger')
              const n = exportarLeads(rows)
              notify(
                activeFilters
                  ? `${num(n)} leads (filtrados) exportados para planilha`
                  : `${num(n)} leads exportados para planilha`,
              )
            }}
            className="btn-ghost"
            title="Baixar em CSV o que está na tela (abre no Excel / Google Sheets)"
          >
            <Download size={15} /> Exportar
          </button>
          <button onClick={() => openEditor(null)} className="btn-ember">
            <Plus size={16} strokeWidth={2.5} /> Nova venda
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="panel p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
            <input
              value={filtros.search}
              onChange={(e) => setFiltro({ search: e.target.value })}
              placeholder="Buscar por cliente, cidade, telefone…"
              className="input py-2 pl-9 text-sm"
            />
          </div>
          <FilterSelect value={filtros.estado} onChange={(v) => setFiltro({ estado: v })}>
            <option value="all">Todos estados</option>
            {estadosDisponiveis.map((uf) => (
              <option key={uf} value={uf}>{uf} · {UF_NOME[uf]}</option>
            ))}
          </FilterSelect>
          <FilterSelect value={filtros.vendedor} onChange={(v) => setFiltro({ vendedor: v })}>
            <option value="all">Todos vendedores</option>
            {vendedores.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </FilterSelect>
          <FilterSelect value={filtros.status} onChange={(v) => setFiltro({ status: v as any })}>
            <option value="all">Todos status</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{STATUS[s].label}</option>
            ))}
          </FilterSelect>
          <FilterSelect value={filtros.campanha} onChange={(v) => setFiltro({ campanha: v })} wide>
            <option value="all">Todas campanhas</option>
            {CAMPANHAS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </FilterSelect>
          {activeFilters > 0 && (
            <button onClick={clearFiltros} className="btn-ghost py-2 text-xs">
              <X size={14} /> Limpar ({activeFilters})
            </button>
          )}
        </div>
      </div>

      {/* Resultado */}
      {rows.length === 0 ? (
        <div className="panel grid place-items-center px-6 py-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-hair bg-overlay text-ink-mute">
            <Inbox size={24} />
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-ink">Nenhum lead encontrado</h3>
          <p className="mt-1 max-w-xs text-sm text-ink-mute">
            Ajuste os filtros de busca ou cadastre um novo cliente para começar.
          </p>
          <button onClick={clearFiltros} className="btn-ghost mt-4">
            <SlidersHorizontal size={14} /> Limpar filtros
          </button>
        </div>
      ) : (
        <>
          {/* Tabela desktop */}
          <div className="panel hidden overflow-hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-hair">
                    <SortTh k="cliente" label="Cliente" />
                    <SortTh k="estado" label="Local" />
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ink-mute">Campanha</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ink-mute">Status</th>
                    <SortTh k="valor" label="Valor" className="text-right" />
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ink-mute">Responsável</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-ink-mute">Follow-up</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((l) => (
                    <Row key={l.id} lead={l} onClick={() => openDetail(l.id)} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-hair px-4 py-3 text-xs text-ink-mute">
              <span>{rows.length} de {leads.length} leads</span>
              <span>Total em aberto · <span className="font-semibold text-ink tnum">{money(totalValor)}</span></span>
            </div>
          </div>

          {/* Cards mobile */}
          <div className="space-y-2.5 lg:hidden">
            {rows.map((l) => (
              <MobileCard key={l.id} lead={l} onClick={() => openDetail(l.id)} />
            ))}
            <div className="px-1 pt-1 text-center text-xs text-ink-mute">
              {rows.length} leads · {moneyShort(totalValor)} em aberto
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function FollowCell({ lead }: { lead: Lead }) {
  if (lead.status === 'ganho' || lead.status === 'perdido' || !lead.proximoFollowUp)
    return <span className="text-ink-mute">—</span>
  const d = daysUntil(lead.proximoFollowUp)
  const late = d !== null && d < 0
  const today = d === 0
  return (
    <span
      className={cn('inline-flex items-center gap-1 text-xs font-medium', late ? 'text-danger' : today ? 'text-warning' : 'text-ink-sub')}
    >
      <CalendarClock size={13} />
      {formatDate(lead.proximoFollowUp)}
      {late && <span className="text-[10px]">({-d!}d)</span>}
    </span>
  )
}

function Row({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  return (
    <tr onClick={onClick} className="cursor-pointer border-b border-hair/60 transition-colors last:border-0 hover:bg-overlay">
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 font-semibold text-ink">
          {lead.cliente}
          {lead.origemTrafego && (
            <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded bg-ember/15 text-ember" title="Cliente de tráfego">
              <Megaphone size={11} />
            </span>
          )}
        </div>
        <div className="text-[11px] text-ink-mute">#{lead.numero} · {lead.produto}</div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-7 place-items-center rounded-md border border-hair bg-overlay font-mono text-[10px] font-bold text-ember">
            {lead.estado}
          </span>
          <span className="text-ink-sub">{lead.cidade || UF_NOME[lead.estado]}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-ink-sub">{lead.campanha}</td>
      <td className="px-4 py-3"><StatusBadge status={lead.status} size="sm" /></td>
      <td className="px-4 py-3 text-right font-display font-bold text-ink tnum">{money(lead.valor)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Avatar name={lead.responsavel} size="xs" />
          <span className="text-ink-sub">{lead.responsavel}</span>
        </div>
      </td>
      <td className="px-4 py-3"><FollowCell lead={lead} /></td>
    </tr>
  )
}

function MobileCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  return (
    <button onClick={onClick} className="panel panel-hover flex w-full items-center gap-3 p-3.5 text-left">
      <Avatar name={lead.responsavel} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-semibold text-ink">{lead.cliente}</span>
          <span className="shrink-0 font-display text-sm font-bold text-ink tnum">{money(lead.valor)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="truncate text-[11px] text-ink-mute">
            {lead.cidade || UF_NOME[lead.estado]}/{lead.estado} · {lead.campanha}
          </span>
          <StatusBadge status={lead.status} size="sm" />
        </div>
      </div>
    </button>
  )
}
