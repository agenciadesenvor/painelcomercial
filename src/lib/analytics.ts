import type { Lead, StatusId, TrafegoLancamento } from './types'
import { FUNIL, STATUS_ORDER, STATUS } from './types'
import type { Filtros } from './store'
import { daysUntil } from './utils'

export function filterLeads(leads: Lead[], f: Filtros): Lead[] {
  const q = f.search.trim().toLowerCase()
  return leads.filter((l) => {
    if (f.estado !== 'all' && l.estado !== f.estado) return false
    if (f.vendedor !== 'all' && l.responsavel !== f.vendedor) return false
    if (f.status !== 'all' && l.status !== f.status) return false
    if (f.campanha !== 'all' && l.campanha !== f.campanha) return false
    if (q) {
      const hay = `${l.cliente} ${l.cidade} ${l.estado} ${l.telefone} ${l.observacao} ${l.numero} ${l.responsavel}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}

export interface Kpis {
  total: number
  ativos: number
  ganhos: number
  perdidos: number
  receitaGanha: number
  valorEmAberto: number
  ticketMedio: number
  taxaConversao: number // ganhos / decididos
  novosSemana: number
  followupHoje: number
  followupAtrasado: number
}

export function computeKpis(leads: Lead[]): Kpis {
  let ativos = 0,
    ganhos = 0,
    perdidos = 0,
    receitaGanha = 0,
    valorEmAberto = 0,
    novosSemana = 0,
    followupHoje = 0,
    followupAtrasado = 0

  for (const l of leads) {
    const meta = STATUS[l.status]
    if (l.status === 'ganho') {
      ganhos++
      receitaGanha += l.valor
    } else if (l.status === 'perdido') {
      perdidos++
    } else if (meta.ativo) {
      ativos++
      valorEmAberto += l.valor
    }
    if (daysUntil(l.criadoEm) !== null && (daysUntil(l.criadoEm) ?? -99) >= -7) novosSemana++
    if (l.status !== 'ganho' && l.status !== 'perdido' && l.proximoFollowUp) {
      const d = daysUntil(l.proximoFollowUp)
      if (d === 0) followupHoje++
      else if (d !== null && d < 0) followupAtrasado++
    }
  }

  const decididos = ganhos + perdidos
  return {
    total: leads.length,
    ativos,
    ganhos,
    perdidos,
    receitaGanha,
    valorEmAberto,
    ticketMedio: ganhos ? Math.round(receitaGanha / ganhos) : 0,
    taxaConversao: decididos ? (ganhos / decididos) * 100 : 0,
    novosSemana,
    followupHoje,
    followupAtrasado,
  }
}

export interface StatusAgg {
  id: StatusId
  count: number
  valor: number
}
export function porStatus(leads: Lead[]): StatusAgg[] {
  const map = new Map<StatusId, StatusAgg>()
  for (const id of STATUS_ORDER) map.set(id, { id, count: 0, valor: 0 })
  for (const l of leads) {
    const a = map.get(l.status)!
    a.count++
    a.valor += l.valor
  }
  return STATUS_ORDER.map((id) => map.get(id)!)
}

export function funil(leads: Lead[]): { id: StatusId; count: number }[] {
  return FUNIL.map((id) => ({
    id,
    count: leads.filter((l) => l.status === id).length,
  }))
}

export interface VendedorAgg {
  nome: string
  total: number
  ativos: number
  ganhos: number
  perdidos: number
  receita: number
  emAberto: number
  conversao: number
}
export function porVendedor(leads: Lead[], todos?: string[]): VendedorAgg[] {
  const blank = (nome: string): VendedorAgg => ({
    nome, total: 0, ativos: 0, ganhos: 0, perdidos: 0, receita: 0, emAberto: 0, conversao: 0,
  })
  const map = new Map<string, VendedorAgg>()
  if (todos) for (const v of todos) map.set(v, blank(v))
  for (const l of leads) {
    if (!map.has(l.responsavel)) map.set(l.responsavel, blank(l.responsavel))
    const a = map.get(l.responsavel)!
    a.total++
    if (l.status === 'ganho') {
      a.ganhos++
      a.receita += l.valor
    } else if (l.status === 'perdido') a.perdidos++
    else if (STATUS[l.status].ativo) {
      a.ativos++
      a.emAberto += l.valor
    }
  }
  const arr = [...map.values()]
  for (const a of arr) {
    const dec = a.ganhos + a.perdidos
    a.conversao = dec ? (a.ganhos / dec) * 100 : 0
  }
  return arr.sort((a, b) => b.receita - a.receita || b.total - a.total)
}

export interface EstadoAgg {
  uf: string
  total: number
  ganhos: number
  receita: number
  emAberto: number
}
export function porEstado(leads: Lead[]): EstadoAgg[] {
  const map = new Map<string, EstadoAgg>()
  for (const l of leads) {
    if (!map.has(l.estado))
      map.set(l.estado, { uf: l.estado, total: 0, ganhos: 0, receita: 0, emAberto: 0 })
    const a = map.get(l.estado)!
    a.total++
    if (l.status === 'ganho') {
      a.ganhos++
      a.receita += l.valor
    } else if (STATUS[l.status].ativo) a.emAberto += l.valor
  }
  return [...map.values()].sort((a, b) => b.total - a.total)
}

export interface CampanhaAgg {
  nome: string
  total: number
  ganhos: number
  receita: number
  conversao: number
}
export function porCampanha(leads: Lead[]): CampanhaAgg[] {
  const map = new Map<string, CampanhaAgg>()
  for (const l of leads) {
    if (!map.has(l.campanha))
      map.set(l.campanha, { nome: l.campanha, total: 0, ganhos: 0, receita: 0, conversao: 0 })
    const a = map.get(l.campanha)!
    a.total++
    if (l.status === 'ganho') {
      a.ganhos++
      a.receita += l.valor
    }
  }
  const arr = [...map.values()]
  for (const a of arr) a.conversao = a.total ? (a.ganhos / a.total) * 100 : 0
  return arr.sort((a, b) => b.total - a.total)
}

export interface Atividade {
  leadId: string
  cliente: string
  data: string
  de: StatusId | null
  para: StatusId
  por: string
  nota?: string
}
export function atividadeRecente(leads: Lead[], limit = 8): Atividade[] {
  const all: Atividade[] = []
  for (const l of leads) {
    for (const e of l.historico) {
      all.push({ leadId: l.id, cliente: l.cliente, ...e })
    }
  }
  return all.sort((a, b) => +new Date(b.data) - +new Date(a.data)).slice(0, limit)
}

/* ── Alertas (sino da Topbar) ── */
export type AlertaTipo = 'atrasado' | 'hoje' | 'parado'

export interface Alerta {
  tipo: AlertaTipo
  leadId: string
  cliente: string
  responsavel: string
  valor: number
  /** dias de atraso (atrasado) ou dias parado (parado); 0 em "hoje" */
  dias: number
}

/** Nº de dias sem mexer no lead para ele contar como "parado" */
const DIAS_PARADO = 14

/**
 * Alertas acionáveis a partir dos leads: follow-up atrasado, follow-up de hoje
 * e negociações ativas esquecidas (sem follow-up marcado e paradas há tempo).
 * Ordena por urgência — o mais atrasado primeiro.
 */
export function alertas(leads: Lead[]): Alerta[] {
  const out: Alerta[] = []
  for (const l of leads) {
    if (l.status === 'ganho' || l.status === 'perdido') continue
    const base = { leadId: l.id, cliente: l.cliente, responsavel: l.responsavel, valor: l.valor }
    const d = daysUntil(l.proximoFollowUp)
    if (d !== null && d < 0) {
      out.push({ ...base, tipo: 'atrasado', dias: -d })
    } else if (d === 0) {
      out.push({ ...base, tipo: 'hoje', dias: 0 })
    } else if (d === null) {
      const parado = -(daysUntil(l.atualizadoEm) ?? 0)
      if (parado >= DIAS_PARADO) out.push({ ...base, tipo: 'parado', dias: parado })
    }
  }
  const peso: Record<AlertaTipo, number> = { atrasado: 0, hoje: 1, parado: 2 }
  return out.sort((a, b) => peso[a.tipo] - peso[b.tipo] || b.dias - a.dias || b.valor - a.valor)
}

/** Série temporal: leads criados por dia nos últimos N dias */
export function serieCriacao(leads: Lead[], dias = 30): number[] {
  const buckets = new Array(dias).fill(0)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  for (const l of leads) {
    const d = new Date(l.criadoEm)
    d.setHours(0, 0, 0, 0)
    const diff = Math.round((now.getTime() - d.getTime()) / 86_400_000)
    if (diff >= 0 && diff < dias) buckets[dias - 1 - diff]++
  }
  return buckets
}

/** Receita ganha por dia (não acumulada) */
export function serieReceitaDiaria(leads: Lead[], dias = 30): number[] {
  const daily = new Array(dias).fill(0)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  for (const l of leads) {
    if (l.status !== 'ganho') continue
    const d = new Date(l.atualizadoEm)
    d.setHours(0, 0, 0, 0)
    const diff = Math.round((now.getTime() - d.getTime()) / 86_400_000)
    if (diff >= 0 && diff < dias) daily[dias - 1 - diff] += l.valor
  }
  return daily
}

/** Média móvel simples (janela w) */
export function movingAvg(arr: number[], w = 5): number[] {
  return arr.map((_, i) => {
    const start = Math.max(0, i - w + 1)
    const slice = arr.slice(start, i + 1)
    return slice.reduce((a, b) => a + b, 0) / slice.length
  })
}

/** Valor em risco: negociações ativas com follow-up atrasado */
export function valorEmRisco(leads: Lead[]): number {
  let v = 0
  for (const l of leads) {
    if (l.status === 'ganho' || l.status === 'perdido') continue
    const d = daysUntil(l.proximoFollowUp)
    if (d !== null && d < 0) v += l.valor
  }
  return v
}

/** Série de receita ganha acumulada por dia (últimos N dias) */
export function serieReceita(leads: Lead[], dias = 30): number[] {
  const daily = new Array(dias).fill(0)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  for (const l of leads) {
    if (l.status !== 'ganho') continue
    const d = new Date(l.atualizadoEm)
    d.setHours(0, 0, 0, 0)
    const diff = Math.round((now.getTime() - d.getTime()) / 86_400_000)
    if (diff >= 0 && diff < dias) daily[dias - 1 - diff] += l.valor
  }
  // acumulado
  let acc = 0
  return daily.map((v) => (acc += v))
}

/* ── Tráfego pago ──
   Gasto manual (lançamentos mensais: mídia + honorários) × retorno real do
   funil (leads marcados `origemTrafego`). Convenções de mercado:
   ROAS considera só a mídia; ROI e CAC consideram o investimento total. */
export interface TrafegoResumo {
  investido: number // mídia
  honorarios: number // agência
  investimentoTotal: number
  retorno: number // receita dos clientes de tráfego em "Venda concluída"
  lucro: number // retorno − investimento total
  roas: number // retorno / mídia
  roi: number // lucro / investimento total
  cac: number // investimento total / vendas
  custoLead: number // investimento total / leads
  ticket: number
  leads: number // leads vindos de tráfego
  vendas: number
  conversao: number
  emAberto: number // valor dos leads de tráfego ainda ativos no funil
}

export function computeTrafegoResumo(
  leads: Lead[],
  lancamentos: TrafegoLancamento[],
): TrafegoResumo {
  const investido = lancamentos.reduce((a, l) => a + l.investido, 0)
  const honorarios = lancamentos.reduce((a, l) => a + l.honorarios, 0)
  const investimentoTotal = investido + honorarios

  let nLeads = 0,
    vendas = 0,
    retorno = 0,
    emAberto = 0
  for (const l of leads) {
    if (!l.origemTrafego) continue
    nLeads++
    if (l.status === 'ganho') {
      vendas++
      retorno += l.valor
    } else if (STATUS[l.status].ativo) {
      emAberto += l.valor
    }
  }

  const lucro = retorno - investimentoTotal
  return {
    investido,
    honorarios,
    investimentoTotal,
    retorno,
    lucro,
    roas: investido ? retorno / investido : 0,
    roi: investimentoTotal ? lucro / investimentoTotal : 0,
    cac: vendas ? investimentoTotal / vendas : 0,
    custoLead: nLeads ? investimentoTotal / nLeads : 0,
    ticket: vendas ? retorno / vendas : 0,
    leads: nLeads,
    vendas,
    conversao: nLeads ? (vendas / nLeads) * 100 : 0,
    emAberto,
  }
}

export interface TrafegoMes {
  mes: string // 'YYYY-MM'
  investimento: number // mídia + honorários lançados no mês
  retorno: number // vendas concluídas de tráfego no mês (por atualizadoEm)
}

/** Série mensal investimento × retorno (união dos meses com gasto ou venda). */
export function trafegoPorMes(leads: Lead[], lancamentos: TrafegoLancamento[]): TrafegoMes[] {
  const map = new Map<string, TrafegoMes>()
  const bucket = (mes: string) => {
    if (!map.has(mes)) map.set(mes, { mes, investimento: 0, retorno: 0 })
    return map.get(mes)!
  }
  for (const l of lancamentos) bucket(l.mes).investimento += l.investido + l.honorarios
  for (const l of leads) {
    if (!l.origemTrafego || l.status !== 'ganho') continue
    bucket(l.atualizadoEm.slice(0, 7)).retorno += l.valor
  }
  return [...map.values()].sort((a, b) => a.mes.localeCompare(b.mes))
}
