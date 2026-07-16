export type StatusId =
  | 'novo'
  | 'sem_retorno'
  | 'recontato'
  | 'negociando'
  | 'ganho'
  | 'perdido'

export interface StatusMeta {
  id: StatusId
  label: string
  short: string
  /** ordem no funil */
  order: number
  /** hex do acento */
  color: string
  /** conta como oportunidade ativa no funil */
  ativo: boolean
}

export const STATUS: Record<StatusId, StatusMeta> = {
  novo: { id: 'novo', label: 'Novo', short: 'Novo', order: 0, color: '#38BDF8', ativo: true },
  sem_retorno: { id: 'sem_retorno', label: 'Sem retorno', short: 'Sem retorno', order: 1, color: '#8A8A93', ativo: true },
  recontato: { id: 'recontato', label: 'Recontatado', short: 'Recontato', order: 2, color: '#FBBF24', ativo: true },
  negociando: { id: 'negociando', label: 'Negociando', short: 'Negociando', order: 3, color: '#FF7A21', ativo: true },
  ganho: { id: 'ganho', label: 'Venda concluída', short: 'Venda concluída', order: 4, color: '#34D399', ativo: false },
  perdido: { id: 'perdido', label: 'Perdido', short: 'Perdido', order: 5, color: '#F5544F', ativo: false },
}

export const STATUS_ORDER: StatusId[] = [
  'novo',
  'sem_retorno',
  'recontato',
  'negociando',
  'ganho',
  'perdido',
]

/** Estágios que compõem o funil de conversão (exclui "perdido") */
export const FUNIL: StatusId[] = ['novo', 'sem_retorno', 'recontato', 'negociando', 'ganho']

export const VENDEDORES = ['Alessandra', 'Débora', 'André', 'Vitória', 'Waltinho'] as const
export type Vendedor = (typeof VENDEDORES)[number]

export const CAMPANHAS = [
  'Short duplo',
  'Short simples',
  'Reels demo',
  'VSL institucional',
  'Carrossel promo',
] as const

export const PRODUTOS = [
  'Linha Plus',
  'Linha Premium',
  'Kit Atacado',
  'Combo Varejo',
  'Linha Básica',
] as const

export interface EventoHistorico {
  data: string // ISO
  de: StatusId | null
  para: StatusId
  por: string
  nota?: string
}

export interface Lead {
  id: string
  numero: string
  cliente: string
  telefone: string
  cidade: string
  estado: string // UF
  campanha: string
  produto: string
  status: StatusId
  valor: number // valor estimado / fechado (R$)
  observacao: string
  responsavel: string
  proximoFollowUp: string | null // ISO date
  /** veio de anúncio pago — entra no cálculo de retorno do painel Tráfego.
      Opcional: leads persistidos antes do campo não o têm (= false). */
  origemTrafego?: boolean
  criadoEm: string // ISO
  atualizadoEm: string // ISO
  historico: EventoHistorico[]
}

export type NovoLead = Omit<
  Lead,
  'id' | 'criadoEm' | 'atualizadoEm' | 'historico'
>

/* ── Perfil / marca ── */
export interface Perfil {
  nome: string
  cargo: string
  foto: string | null // data URL
  empresa: string
  logo: string | null // data URL (sobrepõe a logo padrão)
}

/* ── Tráfego pago ──
   Só o gasto é manual (investido em mídia + honorários da agência, por mês).
   O retorno vem do CRM: leads marcados `origemTrafego` em "Venda concluída". */
export interface TrafegoLancamento {
  id: string
  /** mês de referência no formato 'YYYY-MM' */
  mes: string
  /** investido em mídia (R$) */
  investido: number
  /** honorários da agência (R$) */
  honorarios: number
  observacao?: string
}
