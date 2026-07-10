export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

export const BRLc = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
})

export function money(v: number): string {
  return BRL.format(v)
}

/** Moeda com centavos: R$ 420.388,00 */
export function moneyCents(v: number): string {
  return BRLc.format(v)
}

/** Número com 2 casas: 22,53 */
export function dec2(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Compacto: R$ 1,2 mi / R$ 340 mil */
export function moneyShort(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
  if (Math.abs(v) >= 1_000) return `R$ ${(v / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil`
  return money(v)
}

export function num(v: number): string {
  return v.toLocaleString('pt-BR')
}

export function pct(v: number, digits = 0): string {
  return `${v.toLocaleString('pt-BR', { maximumFractionDigits: digits, minimumFractionDigits: digits })}%`
}

export function initials(name: string): string {
  const p = name.trim().split(/\s+/)
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase()
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function formatDateLong(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} h`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days} d`
  const months = Math.floor(days / 30)
  return `${months} mês${months > 1 ? 'es' : ''}`
}

/** Frase completa: "agora mesmo", "há 3 min", "há 2 h", "há 5 d" */
export function timeAgoFull(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return 'agora mesmo'
  return `há ${timeAgo(iso)}`
}

/** Dias até (positivo) ou desde (negativo) uma data */
export function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  const d = new Date(iso)
  d.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86_400_000)
}

/** Cores estáveis por vendedor (paleta da marca) */
export const VENDEDOR_COLOR: Record<string, string> = {
  Alessandra: '#FF4C24',
  Débora: '#FF2D7E',
  André: '#38BDF8',
  Vitória: '#8B5CF6',
  Waltinho: '#34D399',
}

const VENDEDOR_PALETTE = [
  '#FF4C24', '#FF2D7E', '#38BDF8', '#8B5CF6', '#34D399',
  '#FBBF24', '#12B8A6', '#F59E0B', '#EC4899', '#22D3EE',
]

/** Cor estável por vendedor: fixa para os originais, hash para novos */
export function vendedorColor(nome: string): string {
  if (VENDEDOR_COLOR[nome]) return VENDEDOR_COLOR[nome]
  let h = 0
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) >>> 0
  return VENDEDOR_PALETTE[h % VENDEDOR_PALETTE.length]
}

export interface UF {
  uf: string
  nome: string
  regiao: 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul'
}

export const UFS: UF[] = [
  { uf: 'AC', nome: 'Acre', regiao: 'Norte' },
  { uf: 'AL', nome: 'Alagoas', regiao: 'Nordeste' },
  { uf: 'AP', nome: 'Amapá', regiao: 'Norte' },
  { uf: 'AM', nome: 'Amazonas', regiao: 'Norte' },
  { uf: 'BA', nome: 'Bahia', regiao: 'Nordeste' },
  { uf: 'CE', nome: 'Ceará', regiao: 'Nordeste' },
  { uf: 'DF', nome: 'Distrito Federal', regiao: 'Centro-Oeste' },
  { uf: 'ES', nome: 'Espírito Santo', regiao: 'Sudeste' },
  { uf: 'GO', nome: 'Goiás', regiao: 'Centro-Oeste' },
  { uf: 'MA', nome: 'Maranhão', regiao: 'Nordeste' },
  { uf: 'MT', nome: 'Mato Grosso', regiao: 'Centro-Oeste' },
  { uf: 'MS', nome: 'Mato Grosso do Sul', regiao: 'Centro-Oeste' },
  { uf: 'MG', nome: 'Minas Gerais', regiao: 'Sudeste' },
  { uf: 'PA', nome: 'Pará', regiao: 'Norte' },
  { uf: 'PB', nome: 'Paraíba', regiao: 'Nordeste' },
  { uf: 'PR', nome: 'Paraná', regiao: 'Sul' },
  { uf: 'PE', nome: 'Pernambuco', regiao: 'Nordeste' },
  { uf: 'PI', nome: 'Piauí', regiao: 'Nordeste' },
  { uf: 'RJ', nome: 'Rio de Janeiro', regiao: 'Sudeste' },
  { uf: 'RN', nome: 'Rio Grande do Norte', regiao: 'Nordeste' },
  { uf: 'RS', nome: 'Rio Grande do Sul', regiao: 'Sul' },
  { uf: 'RO', nome: 'Rondônia', regiao: 'Norte' },
  { uf: 'RR', nome: 'Roraima', regiao: 'Norte' },
  { uf: 'SC', nome: 'Santa Catarina', regiao: 'Sul' },
  { uf: 'SP', nome: 'São Paulo', regiao: 'Sudeste' },
  { uf: 'SE', nome: 'Sergipe', regiao: 'Nordeste' },
  { uf: 'TO', nome: 'Tocantins', regiao: 'Norte' },
]

export const UF_NOME: Record<string, string> = Object.fromEntries(
  UFS.map((u) => [u.uf, u.nome]),
)

export function uid(): string {
  return 'l_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

/**
 * Lê um arquivo de imagem como data URL. Para imagens raster, redimensiona
 * para caber em `maxSize` (px) — mantém SVG intacto. Usado no perfil (foto/logo).
 */
export function readImageFile(file: File, maxSize?: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo'))
    reader.onload = () => {
      const dataUrl = reader.result as string
      if (!maxSize || file.type === 'image/svg+xml' || file.type === 'image/gif') {
        resolve(dataUrl)
        return
      }
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        if (scale >= 1) return resolve(dataUrl)
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(dataUrl)
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = () => resolve(dataUrl)
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  })
}
