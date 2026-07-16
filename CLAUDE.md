# CLAUDE.md

Contexto e regras do **Painel Comercial · Desenvor** — CRM de vendas (leads por
estado, campanha, estágio do funil e vendedor).

## Stack e comandos

React 18 + Vite + TypeScript + Tailwind 3 + Zustand + framer-motion + lucide-react.

```bash
npm run dev      # dev server em http://localhost:5178
npm run build    # tsc -b && vite build  (rodar antes de commitar)
```

**Deploy:** `git push origin main` → a Vercel publica sozinha (CI/CD já ligado,
projeto `agencia-desenvor/painelcomercial`). Não precisa rodar a CLI da Vercel.

> ⚠️ Depois de mexer em `tailwind.config.js`, **reinicie o dev server**. Ele
> mantém o config em cache e passa a acusar "class does not exist" em tokens
> novos — mesmo com o `build` passando.

## Identidade visual — NÃO inventar cores

Paleta oficial (Figma `p8xmQU55vRBti33oUztOsO`, node 36-127):

| Papel | Hex | Nome / Pantone |
|---|---|---|
| Laranja Primário | `#FD4E17` | 172 C |
| Laranja Secundário | `#FF7A21` | 1575 C |
| Gelo | `#F5F6FA` | 656 C |
| Marinho | `#011E40` | 282 C |
| Azul Profundo | `#00101F` | Black 6 C |

- Gradiente da marca = `#FF7A21 → #FD4E17` (é o do próprio logo).
- Logos reais em `public/`: `logo.svg` + `favicon.svg` (o "D") e `wordmark.svg`.
- **Fonte: Manrope em tudo.** As chaves `display`/`sans`/`mono` do Tailwind todas
  resolvem para Manrope — as classes `font-display`/`font-mono` seguem válidas.
  Números alinham com a classe `.tnum`.

## Tema claro/escuro — leia antes de estilizar

A paleta vive em **CSS variables** no `src/index.css`: `:root` = claro,
`.dark` = escuro. O Tailwind está em `darkMode: 'class'`; a classe `dark` é
aplicada no `<html>` por um effect no `App.tsx` a partir de `useData.tema`
(persistido, padrão `'dark'`).

**Use sempre os tokens** — eles tematizam sozinhos:

| Use | Nunca use |
|---|---|
| `bg-base` `bg-surface` `bg-elevated` `bg-card` | cor de fundo fixa |
| `text-ink` `text-ink-sub` `text-ink-mute` | `text-white` (salvo sobre laranja) |
| `bg-overlay` `bg-overlay-2` | `bg-white/[0.02]`, `bg-white/5` |
| `border-hair` `border-hair-strong` | `border-white/10`, `border-white/20` |

Em SVG/inline, use as vars: `var(--grid)`, `var(--map-empty)`, `var(--hair)`,
`rgb(var(--ink-mute))`.

> ⚠️ **Nunca coloque `transition` de cor no `body`.** Com a cor vindo de CSS
> variable, o Chrome congela no valor do tema anterior e o fundo fica invertido.

> ⚠️ Em `motion.div`/`motion.span` que dependem de estado na montagem, use
> `initial={false}` — senão o framer-motion anima a partir do valor natural
> (a sidebar abria em 117px e os labels vazavam no rail).

## Arquitetura

```
src/
  lib/store.ts       Zustand + persist (chave 'clea-painel-v2'):
                     leads, vendedores, lancamentos, perfil, tema → useData
                     page, filtros, modais, toast                 → useUI
  lib/types.ts       Lead, STATUS (estágios), Perfil, TrafegoLancamento
  lib/analytics.ts   KPIs e agregações (puras, recebem leads[])
  lib/seed.ts        Dados de demonstração (PRNG determinístico)
  lib/brazil-geo.ts  Gerado: paths dos 27 estados (não editar à mão)
  components/ui/     Primitivos estilo shadcn (sidebar, toggle)
  pages/             Dashboard, FollowUp, Leads, Equipe, Perfil, Trafego
```

- **Alias `@/` → `src/`** (tsconfig + vite). Pode usar `@/lib/utils`.
- **Navegação é por estado**, não por rota: `useUI.setPage(...)`. Não há router —
  componentes com `href`/`next/link` não navegam aqui.
- **shadcn NÃO está instalado.** Tokens como `bg-muted`, `text-accent-foreground`,
  `ring-ring`, `border-input` **não existem** — ao trazer um componente shadcn/
  Aceternity, mapeie para os nossos tokens (ver `components/ui/toggle.tsx`).
- Componentes de terceiros costumam vir para Next.js: troque `next/link` e
  `next/image` antes de usar.

## Convenções de produto

- Estágios (`STATUS` em `types.ts`): Novo · Sem retorno · Recontato ·
  Negociando · **Venda concluída** · Perdido.
- **O CTA de criação é "Nova venda"**, não "Novo lead" (Topbar, Dashboard,
  Clientes + título/botão do `LeadEditor`). O estágio `novo` continua sendo só
  **"Novo"** — chamá-lo de "Nova venda" conflitaria com "Venda concluída".
- **A palavra "pipeline" foi banida da UI.** Valor de oportunidades abertas =
  **"Em aberto"** (`Kpis.valorEmAberto`, `VendedorAgg.emAberto`); estrutura/etapa
  = **"funil"**.
- **Aba Tráfego (reativada em jul/2026, modelo novo):** só o GASTO é manual —
  lançamentos mensais (`TrafegoLancamento`: mês `YYYY-MM`, investido em mídia,
  honorários da agência; 1 por mês, `addLancamento` bloqueia duplicata). O
  RETORNO vem do funil: leads com `origemTrafego: true` (chave "Cliente de
  tráfego" no `LeadEditor`). ROAS = retorno/mídia; ROI e CAC usam o
  investimento total (mídia + honorários). Cálculos em
  `computeTrafegoResumo`/`trafegoPorMes` (analytics).
- `MeshBanner.tsx` existe mas está sem uso (imagem de fundo removida a pedido).

## Estado atual / próximo passo

Os dados vivem em **localStorage** — cada navegador tem a própria cópia do seed.
O objetivo é entregar ao cliente com **login e dados por cliente**, o que exige
**Supabase** (banco + Auth + RLS). Essa é a próxima etapa e destrava o resto
(metas por vendedor, importar a planilha real, dados reais de tráfego).
