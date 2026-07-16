import type { Lead } from './types'
import { STATUS } from './types'
import { UF_NOME } from './utils'

/**
 * Exportação para planilha (CSV).
 *
 * Usa ";" como separador e prefixa BOM porque o Excel em pt-BR assume o
 * separador do locale e, sem o BOM, come os acentos ao abrir como UTF-8.
 */
const SEP = ';'

function escapeCell(v: string | number | null | undefined): string {
  const s = v == null ? '' : String(v)
  // Aspas duplas viram duas; qualquer célula com separador/aspas/quebra vai entre aspas.
  return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCSV(rows: Array<Array<string | number | null>>): string {
  return rows.map((r) => r.map(escapeCell).join(SEP)).join('\r\n')
}

/** Dispara o download de um CSV no navegador. */
export function downloadCSV(filename: string, rows: Array<Array<string | number | null>>) {
  const blob = new Blob(['﻿' + toCSV(rows)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function dataBR(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString('pt-BR') : ''
}

/** Nº decimal no padrão pt-BR (vírgula), para o Excel entender como número. */
function numBR(v: number): string {
  return String(v).replace('.', ',')
}

const COLUNAS = [
  'Nº', 'Cliente', 'Telefone', 'Cidade', 'UF', 'Estado', 'Campanha', 'Produto',
  'Origem', 'Estágio', 'Valor (R$)', 'Vendedor', 'Próximo follow-up', 'Observação',
  'Criado em', 'Atualizado em',
]

export function leadsParaLinhas(leads: Lead[]): Array<Array<string | number | null>> {
  return [
    COLUNAS,
    ...leads.map((l) => [
      l.numero,
      l.cliente,
      l.telefone,
      l.cidade,
      l.estado,
      UF_NOME[l.estado] ?? l.estado,
      l.campanha,
      l.produto,
      l.origemTrafego ? 'Tráfego' : 'Orgânico',
      STATUS[l.status].label,
      numBR(l.valor),
      l.responsavel,
      dataBR(l.proximoFollowUp),
      l.observacao,
      dataBR(l.criadoEm),
      dataBR(l.atualizadoEm),
    ]),
  ]
}

/** Nome de arquivo com a data de hoje: clientes-desenvor-2026-07-15.csv */
export function nomeArquivo(prefixo: string): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${prefixo}-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.csv`
}

/** Exporta os leads recebidos para CSV. Retorna quantos foram exportados. */
export function exportarLeads(leads: Lead[], prefixo = 'clientes-desenvor'): number {
  downloadCSV(nomeArquivo(prefixo), leadsParaLinhas(leads))
  return leads.length
}
