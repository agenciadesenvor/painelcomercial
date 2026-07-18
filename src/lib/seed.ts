import type { Lead, StatusId, TrafegoLancamento, Interacao, CanalContato, DirecaoContato } from './types'

/* PRNG determinístico (mulberry32) — dados estáveis a cada geração */
function mulberry32(seed: number) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rng = mulberry32(20260703)

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

function weighted<T>(pairs: [T, number][]): T {
  const total = pairs.reduce((s, [, w]) => s + w, 0)
  let r = rng() * total
  for (const [item, w] of pairs) {
    r -= w
    if (r <= 0) return item
  }
  return pairs[0][0]
}

function between(min: number, max: number): number {
  return Math.floor(min + rng() * (max - min))
}

const DDD: Record<string, string> = {
  CE: '85', PE: '81', BA: '71', RN: '84', MA: '98', PB: '83', AL: '82',
  PI: '86', SE: '79', SP: '11', MG: '31', PR: '41', RR: '95', GO: '62',
  DF: '61', RJ: '21', PA: '91', AM: '92', RS: '51', SC: '48', ES: '27',
  MT: '65', MS: '67', RO: '69', TO: '63', AC: '68', AP: '96',
}

const CITIES: Record<string, string[]> = {
  CE: ['Fortaleza', 'Sobral', 'Juazeiro do Norte', 'Caucaia', 'Maracanaú'],
  PE: ['Recife', 'Jaboatão', 'Olinda', 'Caruaru', 'Petrolina'],
  BA: ['Salvador', 'Feira de Santana', 'V. da Conquista', 'Camaçari', 'Itabuna'],
  RN: ['Natal', 'Mossoró', 'Parnamirim'],
  MA: ['São Luís', 'Imperatriz', 'Caxias'],
  PB: ['João Pessoa', 'Campina Grande', 'Patos'],
  AL: ['Maceió', 'Arapiraca'],
  PI: ['Teresina', 'Parnaíba', 'Picos'],
  SE: ['Aracaju', 'N. Sra. do Socorro', 'Lagarto'],
  SP: ['São Paulo', 'Campinas', 'Guarulhos', 'Ribeirão Preto', 'Sorocaba'],
  MG: ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora'],
  PR: ['Curitiba', 'Londrina', 'Maringá'],
  RR: ['Boa Vista'],
}

const PREFIXO = [
  'Mercado', 'Supermercado', 'Mercadinho', 'Atacadão', 'Distribuidora',
  'Comercial', 'Empório', 'Depósito', 'Armazém', 'Loja', 'Farmácia', 'Padaria',
]
const NOME = [
  'Silva', 'Santos', 'Oliveira', 'Central', 'União', 'Popular', 'Boa Compra',
  'Preço Bom', 'São José', 'Nova Era', 'Progresso', 'do Vale', 'Bom Preço',
  'Aliança', 'Ideal', 'Real', 'Primavera', 'Costa', 'Horizonte', 'Estrela',
]

const OBS_POR_STATUS: Record<StatusId, string[]> = {
  novo: ['Aguardando primeiro contato', 'Lead da campanha', 'Pediu catálogo', ''],
  sem_retorno: ['Trocou de número', 'Não atende', 'Caixa postal 3x', 'WhatsApp não lido', ''],
  recontato: ['Próxima semana', 'Vai avaliar com o sócio', 'Retornar dia 20', 'Pediu amostra', 'Sem verba no momento'],
  negociando: ['Só compra Plus', 'Negociando prazo', 'Enviada proposta', 'Quer aumentar volume', 'Discutindo frete'],
  ganho: ['Primeiro pedido fechado', 'Recorrência mensal', 'Fechou combo', 'Cliente indicado'],
  perdido: ['Fechou concorrente', 'Achou caro', 'Não tem perfil', 'Sem interesse'],
}

const VALOR_FAIXA: Record<string, [number, number]> = {
  'Linha Plus': [1500, 6000],
  'Linha Premium': [3000, 12000],
  'Kit Atacado': [4000, 18000],
  'Combo Varejo': [2000, 9000],
  'Linha Básica': [800, 3500],
}

/* Conversas de demonstração — no formato de mensagem (canal + direção),
   pra abrir o lead já com um histórico de atendimento crível. */
const ABERTURAS = [
  'Oi, vi o anúncio de vocês. Vocês entregam pra minha cidade?',
  'Bom dia! Queria saber os preços da linha de vocês.',
  'Vi o vídeo no Instagram, como faço pra comprar?',
  'Olá, ainda tem o combo que apareceu na propaganda?',
  'Oi, um amigo indicou vocês. Como funciona o atacado?',
]
const RESPOSTAS = [
  'Oi! Que bom o contato 😊 Vou te mandar o catálogo com os valores.',
  'Bom dia! Entregamos sim. Posso te passar as condições?',
  'Claro! Temos ótimas opções pra você. Qual volume você costuma comprar?',
  'Oi! Tem sim. Vou montar uma proposta e te envio ainda hoje.',
]
const NOTAS_INTERNAS: [CanalContato, string][] = [
  ['ligacao', 'Liguei, pediu pra retornar na sexta'],
  ['ligacao', 'Não atendeu, vou tentar amanhã de manhã'],
  ['email', 'Enviei a proposta fechada por e-mail'],
  ['nota', 'Cliente comparando com concorrente, sensível a preço'],
  ['presencial', 'Passou na loja, levou amostra da Linha Plus'],
]

function buildInteracoes(
  status: StatusId,
  responsavel: string,
  criadoEm: string,
  atualizadoEm: string,
): Interacao[] {
  if (status === 'novo' && rng() < 0.7) return [] // recém-chegados costumam estar vazios
  const inicio = new Date(criadoEm).getTime()
  const fim = new Date(atualizadoEm).getTime()
  const span = Math.max(fim - inicio, 3_600_000)
  let t = inicio + span * 0.05
  const passo = () => {
    t += span * (0.15 + rng() * 0.3)
    return new Date(Math.min(t, fim)).toISOString()
  }
  const push = (arr: Interacao[], canal: CanalContato, direcao: DirecaoContato, texto: string) =>
    arr.push({ id: 'seed_i_' + arr.length + '_' + Math.floor(t).toString(36), data: passo(), autor: responsavel, canal, direcao, texto })

  const out: Interacao[] = []
  push(out, 'whatsapp', 'recebido', pick(ABERTURAS))
  push(out, 'whatsapp', 'enviado', pick(RESPOSTAS))
  const extras = status === 'ganho' || status === 'negociando' ? between(1, 3) : between(0, 2)
  for (let i = 0; i < extras; i++) {
    const [canal, texto] = pick(NOTAS_INTERNAS)
    push(out, canal, 'interno', texto)
  }
  if (status === 'ganho') push(out, 'whatsapp', 'recebido', 'Fechado! Pode mandar o pedido 🎉')
  return out
}

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(between(8, 18), between(0, 59), 0, 0)
  return d.toISOString()
}
function isoDaysAhead(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(10, 0, 0, 0)
  return d.toISOString()
}

export function buildSeed(): Lead[] {
  const leads: Lead[] = []
  const N = 138

  for (let i = 0; i < N; i++) {
    const estado = weighted<string>([
      ['CE', 22], ['PE', 15], ['BA', 14], ['RN', 9], ['MA', 8], ['PB', 8],
      ['AL', 7], ['PI', 7], ['SE', 6], ['SP', 9], ['MG', 7], ['PR', 5], ['RR', 3],
    ])
    const cidade = pick(CITIES[estado] ?? ['Capital'])
    const status = weighted<StatusId>([
      ['recontato', 34], ['sem_retorno', 20], ['novo', 12],
      ['negociando', 14], ['ganho', 12], ['perdido', 8],
    ])
    const responsavel = weighted<string>([
      ['Alessandra', 58], ['Débora', 18], ['André', 8], ['Vitória', 9], ['Waltinho', 7],
    ])
    const campanha = weighted<string>([
      ['Short duplo', 62], ['Short simples', 14], ['Reels demo', 10],
      ['VSL institucional', 8], ['Carrossel promo', 6],
    ])
    const produto = weighted<string>([
      ['Linha Plus', 34], ['Kit Atacado', 20], ['Combo Varejo', 18],
      ['Linha Premium', 14], ['Linha Básica', 14],
    ])
    const [vmin, vmax] = VALOR_FAIXA[produto]
    const valor = Math.round(between(vmin, vmax) / 50) * 50

    const criadoDays = between(2, 92)
    const criadoEm = isoDaysAgo(criadoDays)
    // Fechamentos (ganho/perdido) espalhados ao longo da vida do lead;
    // demais status: toque recente.
    const atualizadoEm =
      status === 'ganho' || status === 'perdido'
        ? isoDaysAgo(between(0, criadoDays))
        : isoDaysAgo(between(0, Math.min(criadoDays, 14)))

    let proximoFollowUp: string | null = null
    if (status === 'recontato' || status === 'negociando' || status === 'novo') {
      const roll = rng()
      if (roll < 0.28) proximoFollowUp = isoDaysAgo(between(1, 6)) // atrasado
      else if (roll < 0.75) proximoFollowUp = isoDaysAhead(between(0, 9))
    }

    const observacao = pick(OBS_POR_STATUS[status])
    const cliente = `${pick(PREFIXO)} ${pick(NOME)}`
    const telefone = `(${DDD[estado] ?? '85'}) 9${between(4000, 9999)}-${between(1000, 9999)}`
    // A operação é puxada por anúncio: ~2/3 dos leads vêm de tráfego pago
    const origemTrafego = rng() < 0.66

    leads.push({
      id: 'seed_' + i.toString(36).padStart(3, '0'),
      numero: String(1000 + i),
      cliente,
      telefone,
      cidade,
      estado,
      campanha,
      produto,
      status,
      valor,
      observacao,
      responsavel,
      proximoFollowUp,
      origemTrafego,
      interacoes: buildInteracoes(status, responsavel, criadoEm, atualizadoEm),
      criadoEm,
      atualizadoEm,
      historico: [
        { data: criadoEm, de: null, para: 'novo', por: responsavel, nota: 'Lead criado' },
        ...(status !== 'novo'
          ? [{ data: atualizadoEm, de: 'novo' as StatusId, para: status, por: responsavel }]
          : []),
      ],
    })
  }

  return leads
}

/** Lançamentos de tráfego de demonstração: os 3 últimos meses (o atual incluso). */
export function buildSeedLancamentos(): TrafegoLancamento[] {
  const valores: [number, number][] = [
    [6200, 1500], // há 2 meses
    [6800, 1500], // mês passado
    [7400, 1500], // mês atual
  ]
  const hoje = new Date()
  return valores.map(([investido, honorarios], i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - (2 - i), 1)
    return {
      id: `seed_tf_${i}`,
      mes: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      investido,
      honorarios,
    }
  })
}
