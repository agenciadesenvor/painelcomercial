import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Lead, NovoLead, StatusId, TrafegoEntry, Perfil } from './types'
import { VENDEDORES } from './types'

const PERFIL_PADRAO: Perfil = {
  nome: 'Elison Melo',
  cargo: 'Gestor comercial',
  foto: null,
  empresa: 'Desenvor',
  logo: null,
}
import { buildSeed } from './seed'
import { uid } from './utils'

/* ────────────────────────────────────────────────────────────
   Camada de dados (persistida no navegador — trocável por API)
   ──────────────────────────────────────────────────────────── */
interface DataState {
  leads: Lead[]
  vendedores: string[]
  trafego: TrafegoEntry[]
  perfil: Perfil
  setPerfil: (patch: Partial<Perfil>) => void
  resetPerfil: () => void
  addLead: (input: NovoLead) => string
  updateLead: (id: string, patch: Partial<Lead>, autor?: string) => void
  moveStatus: (id: string, status: StatusId, autor?: string) => void
  deleteLead: (id: string) => void
  addVendedor: (nome: string) => boolean
  addTrafego: (input: Omit<TrafegoEntry, 'id'>) => void
  updateTrafego: (id: string, patch: Partial<TrafegoEntry>) => void
  deleteTrafego: (id: string) => void
  resetData: () => void
}

export const useData = create<DataState>()(
  persist(
    (set, get) => ({
      leads: buildSeed(),
      vendedores: [...VENDEDORES],
      trafego: [
        { id: 'tf_meta', canal: 'Meta Ads', investido: 12400, faturado: 268000, leads: 980, vendas: 190 },
        { id: 'tf_google', canal: 'Google Ads', investido: 6261.5, faturado: 152388, leads: 460, vendas: 112 },
      ],
      perfil: PERFIL_PADRAO,

      setPerfil: (patch) => set((s) => ({ perfil: { ...s.perfil, ...patch } })),
      resetPerfil: () => set({ perfil: PERFIL_PADRAO }),

      addTrafego: (input) =>
        set((s) => ({ trafego: [...s.trafego, { ...input, id: uid() }] })),
      updateTrafego: (id, patch) =>
        set((s) => ({ trafego: s.trafego.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      deleteTrafego: (id) => set((s) => ({ trafego: s.trafego.filter((t) => t.id !== id) })),

      addVendedor: (nome) => {
        const n = nome.trim()
        if (!n) return false
        if (get().vendedores.some((v) => v.toLowerCase() === n.toLowerCase())) return false
        set((s) => ({ vendedores: [...s.vendedores, n] }))
        return true
      },

      addLead: (input) => {
        const id = uid()
        const now = new Date().toISOString()
        const lead: Lead = {
          ...input,
          id,
          criadoEm: now,
          atualizadoEm: now,
          historico: [
            { data: now, de: null, para: input.status, por: input.responsavel, nota: 'Lead criado' },
          ],
        }
        set((s) => ({ leads: [lead, ...s.leads] }))
        return id
      },

      updateLead: (id, patch, autor = 'Você') =>
        set((s) => ({
          leads: s.leads.map((l) => {
            if (l.id !== id) return l
            const now = new Date().toISOString()
            const statusChanged = patch.status && patch.status !== l.status
            return {
              ...l,
              ...patch,
              atualizadoEm: now,
              historico: statusChanged
                ? [...l.historico, { data: now, de: l.status, para: patch.status!, por: autor }]
                : l.historico,
            }
          }),
        })),

      moveStatus: (id, status, autor = 'Você') =>
        set((s) => ({
          leads: s.leads.map((l) => {
            if (l.id !== id || l.status === status) return l
            const now = new Date().toISOString()
            return {
              ...l,
              status,
              atualizadoEm: now,
              historico: [...l.historico, { data: now, de: l.status, para: status, por: autor }],
            }
          }),
        })),

      deleteLead: (id) => set((s) => ({ leads: s.leads.filter((l) => l.id !== id) })),

      resetData: () => set({ leads: buildSeed() }),
    }),
    { name: 'clea-painel-v2' },
  ),
)

/* ────────────────────────────────────────────────────────────
   Estado de UI (não persistido)
   ──────────────────────────────────────────────────────────── */
export type Page = 'dashboard' | 'followup' | 'leads' | 'equipe' | 'trafego' | 'perfil'

export interface Filtros {
  search: string
  estado: string
  vendedor: string
  status: StatusId | 'all'
  campanha: string
}

const FILTROS_INIT: Filtros = {
  search: '',
  estado: 'all',
  vendedor: 'all',
  status: 'all',
  campanha: 'all',
}

interface UIState {
  page: Page
  setPage: (p: Page) => void

  editorOpen: boolean
  editingId: string | null
  openEditor: (id?: string | null) => void
  closeEditor: () => void

  detailId: string | null
  openDetail: (id: string) => void
  closeDetail: () => void

  filtros: Filtros
  setFiltro: (patch: Partial<Filtros>) => void
  clearFiltros: () => void

  toast: { id: number; msg: string; tone: 'ok' | 'info' | 'danger' } | null
  notify: (msg: string, tone?: 'ok' | 'info' | 'danger') => void
}

export const useUI = create<UIState>((set) => ({
  page: 'dashboard',
  setPage: (page) => set({ page }),

  editorOpen: false,
  editingId: null,
  openEditor: (id = null) => set({ editorOpen: true, editingId: id }),
  closeEditor: () => set({ editorOpen: false, editingId: null }),

  detailId: null,
  openDetail: (id) => set({ detailId: id }),
  closeDetail: () => set({ detailId: null }),

  filtros: FILTROS_INIT,
  setFiltro: (patch) => set((s) => ({ filtros: { ...s.filtros, ...patch } })),
  clearFiltros: () => set({ filtros: FILTROS_INIT }),

  toast: null,
  notify: (msg, tone = 'ok') => set({ toast: { id: Date.now(), msg, tone } }),
}))
