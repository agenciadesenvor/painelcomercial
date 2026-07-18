import { useMemo, useRef, useState, useEffect } from 'react'
import { MessageCircle, Phone, Mail, Store, StickyNote, Send, Trash2 } from 'lucide-react'
import { useData, useUI } from '../lib/store'
import { CANAL_META, type CanalContato, type DirecaoContato, type Interacao } from '../lib/types'
import { cn } from '../lib/utils'

const ICON: Record<CanalContato, typeof Phone> = {
  whatsapp: MessageCircle,
  ligacao: Phone,
  email: Mail,
  presencial: Store,
  nota: StickyNote,
}

/** Canais de dois lados (mensagem) pedem direção; os demais são registro interno. */
const DOIS_LADOS: CanalContato[] = ['whatsapp', 'email']

function horaLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function diaLabel(iso: string): string {
  const d = new Date(iso)
  d.setHours(0, 0, 0, 0)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const diff = Math.round((hoje.getTime() - d.getTime()) / 86_400_000)
  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Ontem'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
}

/** Balão de um lado só (mensagem enviada/recebida). */
function Bolha({ i, onDelete }: { i: Interacao; onDelete: () => void }) {
  const enviado = i.direcao === 'enviado'
  const Icon = ICON[i.canal]
  return (
    <div className={cn('group/msg flex', enviado ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'relative max-w-[82%] rounded-2xl px-3 py-2',
          enviado
            ? 'rounded-tr-md bg-ember/15 text-ink'
            : 'rounded-tl-md border border-hair bg-elevated text-ink',
        )}
      >
        <p className="whitespace-pre-wrap text-[13px] leading-snug">{i.texto}</p>
        <div className={cn('mt-1 flex items-center gap-1 text-[10px] text-ink-mute', enviado && 'justify-end')}>
          <Icon size={10} />
          <span>{enviado ? i.autor : 'cliente'} · {horaLabel(i.data)}</span>
        </div>
        <button
          onClick={onDelete}
          className="absolute -top-2 right-1 hidden rounded-md border border-hair bg-surface p-1 text-ink-mute hover:text-danger group-hover/msg:block"
          aria-label="Remover registro"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  )
}

/** Pílula central (ligação, nota, presencial). */
function Interno({ i, onDelete }: { i: Interacao; onDelete: () => void }) {
  const Icon = ICON[i.canal]
  return (
    <div className="group/msg flex justify-center">
      <div className="inline-flex max-w-[90%] items-center gap-1.5 rounded-full border border-hair bg-overlay px-3 py-1.5 text-[11px] text-ink-sub">
        <Icon size={12} className="shrink-0 text-ember" />
        <span className="truncate">
          {CANAL_META[i.canal].label} · {i.autor} · {i.texto}
        </span>
        <span className="shrink-0 text-ink-mute">· {horaLabel(i.data)}</span>
        <button onClick={onDelete} className="ml-0.5 hidden shrink-0 text-ink-mute hover:text-danger group-hover/msg:block" aria-label="Remover registro">
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  )
}

export function Conversa({ leadId }: { leadId: string }) {
  const lead = useData((s) => s.leads.find((l) => l.id === leadId))
  const addInteracao = useData((s) => s.addInteracao)
  const deleteInteracao = useData((s) => s.deleteInteracao)
  const perfilNome = useData((s) => s.perfil.nome)
  const notify = useUI((s) => s.notify)

  const [canal, setCanal] = useState<CanalContato>('whatsapp')
  const [doCliente, setDoCliente] = useState(false) // só p/ canais de dois lados
  const [texto, setTexto] = useState('')
  const fimRef = useRef<HTMLDivElement>(null)

  const itens = useMemo(
    () => [...(lead?.interacoes ?? [])].sort((a, b) => +new Date(a.data) - +new Date(b.data)),
    [lead?.interacoes],
  )

  // Rola pro fim quando a conversa muda
  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: 'nearest' })
  }, [itens.length])

  if (!lead) return null

  function registrar() {
    const t = texto.trim()
    if (!t) return
    const doisLados = DOIS_LADOS.includes(canal)
    const direcao: DirecaoContato = !doisLados ? 'interno' : doCliente ? 'recebido' : 'enviado'
    addInteracao(leadId, { canal, direcao, texto: t, autor: perfilNome.trim() || 'Você' })
    setTexto('')
    notify('Contato registrado')
  }

  const doisLados = DOIS_LADOS.includes(canal)

  return (
    <div>
      {/* Thread */}
      <div className="space-y-2.5 rounded-2xl border border-hair bg-base/40 p-3">
        {itens.length === 0 ? (
          <div className="grid place-items-center py-8 text-center">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-hair bg-overlay text-ink-mute">
              <MessageCircle size={19} />
            </div>
            <p className="mt-3 max-w-[220px] text-xs text-ink-mute">
              Nenhum contato registrado. Anote a primeira interação abaixo.
            </p>
          </div>
        ) : (
          itens.map((i, idx) => {
            const showDia = idx === 0 || diaLabel(i.data) !== diaLabel(itens[idx - 1].data)
            return (
              <div key={i.id} className="space-y-2.5">
                {showDia && (
                  <div className="flex justify-center">
                    <span className="rounded-full bg-overlay px-2.5 py-0.5 text-[10px] font-semibold text-ink-mute">
                      {diaLabel(i.data)}
                    </span>
                  </div>
                )}
                {i.direcao === 'interno' ? (
                  <Interno i={i} onDelete={() => deleteInteracao(lead.id, i.id)} />
                ) : (
                  <Bolha i={i} onDelete={() => deleteInteracao(lead.id, i.id)} />
                )}
              </div>
            )
          })
        )}
        <div ref={fimRef} />
      </div>

      {/* Composer */}
      <div className="mt-3 rounded-2xl border border-hair bg-overlay p-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {(Object.keys(CANAL_META) as CanalContato[]).map((c) => {
            const Icon = ICON[c]
            const on = canal === c
            return (
              <button
                key={c}
                onClick={() => setCanal(c)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition-colors',
                  on ? 'border-ember/40 bg-ember/15 text-ember' : 'border-hair text-ink-sub hover:text-ink',
                )}
              >
                <Icon size={12} /> {CANAL_META[c].label}
              </button>
            )
          })}
        </div>

        {/* Direção — só p/ WhatsApp/E-mail */}
        {doisLados && (
          <div className="mt-2 flex items-center gap-1 text-[11px]">
            <span className="text-ink-mute">Quem falou:</span>
            <button
              onClick={() => setDoCliente(false)}
              className={cn('rounded-md px-2 py-0.5 font-semibold transition-colors', !doCliente ? 'bg-ember/15 text-ember' : 'text-ink-sub hover:text-ink')}
            >
              Eu
            </button>
            <button
              onClick={() => setDoCliente(true)}
              className={cn('rounded-md px-2 py-0.5 font-semibold transition-colors', doCliente ? 'bg-ember/15 text-ember' : 'text-ink-sub hover:text-ink')}
            >
              Cliente
            </button>
          </div>
        )}

        <div className="mt-2 flex items-end gap-2">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                registrar()
              }
            }}
            rows={1}
            placeholder={doisLados ? 'Registrar mensagem…' : `Registrar ${CANAL_META[canal].label.toLowerCase()}…`}
            className="input max-h-28 min-h-[40px] flex-1 resize-none py-2.5"
          />
          <button
            onClick={registrar}
            disabled={!texto.trim()}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ember text-white transition-all hover:brightness-105 disabled:opacity-40"
            aria-label="Registrar contato"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-ink-mute">
          Registro interno — o cliente não recebe. Vira chat real quando o WhatsApp for conectado.
        </p>
      </div>
    </div>
  )
}
