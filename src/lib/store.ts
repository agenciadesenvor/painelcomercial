import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Lead, NovoLead, StatusId, TrafegoLancamento, Perfil, Interacao } from './types'
import { VENDEDORES } from './types'

const PERFIL_PADRAO: Perfil = {
  nome: 'Elison Melo',
  cargo: 'Gestor comercial',
  foto: null,
  empresa: 'Desenvor',
  logo: null,
}
import { buildSeed, buildSeedLancamentos } from './seed'
import { uid } from './utils'

/* ────────────────────────────────────────────────────────────
   Camada de dados (persistida no navegador — trocável por API)
   ──────────────────────────────────────────────────────────── */
export type Tema = 'light' | 'dark'

interface DataState {
  leads: Lead[]
  vendedores: string[]
  /** gasto mensal com tráfego (mídia + honorários) — entrada manual */
  lancamentos: TrafegoLancamento[]
  perfil: Perfil
  tema: Tema
  setTema: (t: Tema) => void
  toggleTema: () => void
  setPerfil: (patch: Partial<Perfil>) => void
  resetPerfil: () => void
  addLead: (input: NovoLead) => string
  updateLead: (id: string, patch: Partial<Lead>, autor?: string) => void
  moveStatus: (id: string, status: StatusId, autor?: string) => void
  deleteLead: (id: string) => void
  addInteracao: (leadId: string, input: Omit<Interacao, 'id' | 'data'>) => void
  deleteInteracao: (leadId: string, interacaoId: string) => void
  addVendedor: (nome: string) => boolean
  renameVendedor: (antigo: string, novo: string) => boolean
  deleteVendedor: (nome: string, reatribuirPara?: string) => boolean
  /** false se já existe lançamento para aquele mês */
  addLancamento: (input: Omit<TrafegoLancamento, 'id'>) => boolean
  updateLancamento: (id: string, patch: Partial<TrafegoLancamento>) => boolean
  deleteLancamento: (id: string) => void
  resetData: () => void
}

export const useData = create<DataState>()(
  persist(
    (set, get) => ({
      leads: buildSeed(),
      vendedores: [...VENDEDORES],
      lancamentos: buildSeedLancamentos(),
      perfil: PERFIL_PADRAO,
      tema: 'dark',

      setTema: (tema) => set({ tema }),
      toggleTema: () => set((s) => ({ tema: s.tema === 'dark' ? 'light' : 'dark' })),

      setPerfil: (patch) => set((s) => ({ perfil: { ...s.perfil, ...patch } })),
      resetPerfil: () => set({ perfil: PERFIL_PADRAO }),

      // Um lançamento por mês de referência — duplicar seria contar o gasto 2x.
      addLancamento: (input) => {
        if (get().lancamentos.some((l) => l.mes === input.mes)) return false
        set((s) => ({
          lancamentos: [...s.lancamentos, { ...input, id: uid() }].sort((a, b) =>
            a.mes.localeCompare(b.mes),
          ),
        }))
        return true
      },
      updateLancamento: (id, patch) => {
        const s = get()
        if (patch.mes && s.lancamentos.some((l) => l.id !== id && l.mes === patch.mes)) return false
        set((st) => ({
          lancamentos: st.lancamentos
            .map((l) => (l.id === id ? { ...l, ...patch } : l))
            .sort((a, b) => a.mes.localeCompare(b.mes)),
        }))
        return true
      },
      deleteLancamento: (id) =>
        set((s) => ({ lancamentos: s.lancamentos.filter((l) => l.id !== id) })),

      addVendedor: (nome) => {
        const n = nome.trim()
        if (!n) return false
        if (get().vendedores.some((v) => v.toLowerCase() === n.toLowerCase())) return false
        set((s) => ({ vendedores: [...s.vendedores, n] }))
        return true
      },

      // Os leads referenciam o vendedor pelo NOME (l.responsavel), então
      // renomear tem de arrastar junto os leads e o histórico.
      renameVendedor: (antigo, novo) => {
        const n = novo.trim()
        const s = get()
        if (!n || !s.vendedores.includes(antigo)) return false
        if (n === antigo) return true
        if (s.vendedores.some((v) => v.toLowerCase() === n.toLowerCase())) return false
        set((st) => ({
          vendedores: st.vendedores.map((v) => (v === antigo ? n : v)),
          leads: st.leads.map((l) =>
            l.responsavel === antigo || l.historico.some((h) => h.por === antigo)
              ? {
                  ...l,
                  responsavel: l.responsavel === antigo ? n : l.responsavel,
                  historico: l.historico.map((h) => (h.por === antigo ? { ...h, por: n } : h)),
                }
              : l,
          ),
        }))
        return true
      },

      // Remover deixaria leads órfãos: quem tem leads só sai reatribuindo.
      deleteVendedor: (nome, reatribuirPara) => {
        const s = get()
        if (!s.vendedores.includes(nome)) return false
        const temLeads = s.leads.some((l) => l.responsavel === nome)
        if (temLeads && (!reatribuirPara || reatribuirPara === nome)) return false
        set((st) => ({
          vendedores: st.vendedores.filter((v) => v !== nome),
          leads: reatribuirPara
            ? st.leads.map((l) => (l.responsavel === nome ? { ...l, responsavel: reatribuirPara } : l))
            : st.leads,
        }))
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

      // Registrar um contato move o lead pro topo do "atendido recentemente"
      // via atualizadoEm — mesma semântica que uma mensagem nova teria.
      addInteracao: (leadId, input) =>
        set((s) => ({
          leads: s.leads.map((l) => {
            if (l.id !== leadId) return l
            const now = new Date().toISOString()
            const nova: Interacao = { ...input, id: uid(), data: now }
            return { ...l, interacoes: [...(l.interacoes ?? []), nova], atualizadoEm: now }
          }),
        })),

      deleteInteracao: (leadId, interacaoId) =>
        set((s) => ({
          leads: s.leads.map((l) =>
            l.id === leadId
              ? { ...l, interacoes: (l.interacoes ?? []).filter((i) => i.id !== interacaoId) }
              : l,
          ),
        })),

      resetData: () => set({ leads: buildSeed(), lancamentos: buildSeedLancamentos() }),
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
