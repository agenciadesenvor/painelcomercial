import { useEffect, useState } from 'react'
import { X, ChevronDown, Megaphone } from 'lucide-react'
import { useData, useUI } from '../lib/store'
import { CAMPANHAS, PRODUTOS, STATUS_ORDER, STATUS, type StatusId } from '../lib/types'
import { UFS, cn } from '../lib/utils'

interface Form {
  cliente: string
  telefone: string
  numero: string
  estado: string
  cidade: string
  campanha: string
  produto: string
  status: StatusId
  valor: string
  responsavel: string
  proximoFollowUp: string
  observacao: string
  origemTrafego: boolean
}

const EMPTY: Form = {
  cliente: '',
  telefone: '',
  numero: '',
  estado: 'CE',
  cidade: '',
  campanha: CAMPANHAS[0],
  produto: '',
  status: 'novo',
  valor: '',
  responsavel: '',
  proximoFollowUp: '',
  observacao: '',
  origemTrafego: false,
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="label">
        {label}
        {required && <span className="text-ember"> *</span>}
      </span>
      {children}
    </label>
  )
}

function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input appearance-none pr-9">
        {children}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute" />
    </div>
  )
}

export function LeadEditor() {
  const { editorOpen, editingId, closeEditor, notify } = useUI()
  const { leads, addLead, updateLead, vendedores } = useData()
  const [f, setF] = useState<Form>(EMPTY)
  const editing = editingId ? leads.find((l) => l.id === editingId) : null

  useEffect(() => {
    if (!editorOpen) return
    if (editing) {
      setF({
        cliente: editing.cliente,
        telefone: editing.telefone,
        numero: editing.numero,
        estado: editing.estado,
        cidade: editing.cidade,
        campanha: editing.campanha,
        produto: editing.produto,
        status: editing.status,
        valor: String(editing.valor || ''),
        responsavel: editing.responsavel,
        proximoFollowUp: editing.proximoFollowUp ? editing.proximoFollowUp.slice(0, 10) : '',
        observacao: editing.observacao,
        origemTrafego: !!editing.origemTrafego,
      })
    } else {
      setF({ ...EMPTY, numero: String(1000 + leads.length + 1), responsavel: vendedores[0] ?? '' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorOpen, editingId])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeEditor()
    }
    if (editorOpen) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editorOpen, closeEditor])

  if (!editorOpen) return null

  const set = (patch: Partial<Form>) => setF((p) => ({ ...p, ...patch }))

  function save() {
    if (!f.cliente.trim()) {
      notify('Informe o nome do cliente', 'danger')
      return
    }
    const payload = {
      cliente: f.cliente.trim(),
      telefone: f.telefone.trim(),
      numero: f.numero.trim(),
      estado: f.estado,
      cidade: f.cidade.trim(),
      campanha: f.campanha,
      produto: f.produto,
      status: f.status,
      valor: Number(f.valor.replace(/\D/g, '')) || 0,
      responsavel: f.responsavel,
      proximoFollowUp: f.proximoFollowUp ? new Date(f.proximoFollowUp + 'T10:00:00').toISOString() : null,
      observacao: f.observacao.trim(),
      origemTrafego: f.origemTrafego,
    }
    if (editing) {
      updateLead(editing.id, payload)
      notify('Cliente atualizado')
    } else {
      addLead(payload)
      notify('Nova venda adicionada ao funil')
    }
    closeEditor()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeEditor} />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl animate-fade-up flex-col overflow-hidden rounded-t-3xl border border-hair bg-surface shadow-lift sm:rounded-3xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-hair px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">
              {editing ? 'Editar cliente' : 'Nova venda'}
            </h2>
            <p className="text-xs text-ink-mute">
              {editing ? 'Atualize os dados e o estágio do funil' : 'Cadastre e já posicione no funil'}
            </p>
          </div>
          <button onClick={closeEditor} className="grid h-9 w-9 place-items-center rounded-lg border border-hair text-ink-sub hover:text-ink" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        {/* body */}
        <div className="grid grid-cols-1 gap-4 overflow-y-auto px-6 py-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Nome do cliente" required>
              <input className="input" value={f.cliente} onChange={(e) => set({ cliente: e.target.value })} placeholder="Ex.: Supermercado Boa Compra" autoFocus />
            </Field>
          </div>

          <Field label="WhatsApp / Telefone">
            <input className="input" value={f.telefone} onChange={(e) => set({ telefone: e.target.value })} placeholder="(85) 9 9999-9999" inputMode="tel" />
          </Field>
          <Field label="Nº / Código">
            <input className="input" value={f.numero} onChange={(e) => set({ numero: e.target.value })} placeholder="1001" />
          </Field>

          <Field label="Estado (UF)">
            <Select value={f.estado} onChange={(v) => set({ estado: v })}>
              {UFS.map((u) => (
                <option key={u.uf} value={u.uf}>
                  {u.uf} · {u.nome}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Cidade">
            <input className="input" value={f.cidade} onChange={(e) => set({ cidade: e.target.value })} placeholder="Fortaleza" />
          </Field>

          <Field label="Campanha / Vídeo">
            <Select value={f.campanha} onChange={(v) => set({ campanha: v })}>
              {CAMPANHAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Produto de interesse">
            <input
              className="input"
              value={f.produto}
              onChange={(e) => set({ produto: e.target.value })}
              placeholder="Digite o produto"
              list="produtos-sugestoes"
            />
            <datalist id="produtos-sugestoes">
              {PRODUTOS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </Field>

          <Field label="Estágio do funil">
            <Select value={f.status} onChange={(v) => set({ status: v as StatusId })}>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>{STATUS[s].label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Valor estimado (R$)">
            <input className="input tnum" value={f.valor} onChange={(e) => set({ valor: e.target.value })} placeholder="0" inputMode="numeric" />
          </Field>

          <Field label="Vendedor">
            <Select value={f.responsavel} onChange={(v) => set({ responsavel: v })}>
              {vendedores.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </Select>
          </Field>
          <Field label="Próximo follow-up">
            <input type="date" className="input" value={f.proximoFollowUp} onChange={(e) => set({ proximoFollowUp: e.target.value })} />
          </Field>

          {/* Origem: cliente de tráfego pago */}
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={() => set({ origemTrafego: !f.origemTrafego })}
              aria-pressed={f.origemTrafego}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors',
                f.origemTrafego
                  ? 'border-ember/45 bg-ember/10'
                  : 'border-hair bg-overlay hover:border-hair-strong',
              )}
            >
              <span
                className={cn(
                  'grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors',
                  f.origemTrafego ? 'bg-ember/20 text-ember' : 'bg-overlay-2 text-ink-mute',
                )}
              >
                <Megaphone size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink">Cliente de tráfego</span>
                <span className="block text-xs text-ink-mute">
                  Veio de anúncio pago — entra no cálculo de retorno do painel de Tráfego
                </span>
              </span>
              <span
                className={cn(
                  'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                  f.origemTrafego ? 'bg-ember' : 'border border-hair bg-overlay-2',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
                    f.origemTrafego ? 'left-[22px]' : 'left-0.5',
                  )}
                />
              </span>
            </button>
          </div>

          <div className="sm:col-span-2">
            <Field label="Observação">
              <textarea className="input min-h-[76px] resize-none" value={f.observacao} onChange={(e) => set({ observacao: e.target.value })} placeholder="Ex.: Só compra Plus · retornar próxima semana" />
            </Field>
          </div>
        </div>

        {/* footer */}
        <div className="flex items-center justify-end gap-3 border-t border-hair px-6 py-4">
          <button onClick={closeEditor} className="btn-ghost">Cancelar</button>
          <button onClick={save} className="btn-ember">{editing ? 'Salvar alterações' : 'Adicionar venda'}</button>
        </div>
      </div>
    </div>
  )
}
