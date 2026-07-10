import { useEffect, useState } from 'react'
import { BRAND } from '../lib/brand'
import { cn } from '../lib/utils'
import { useData } from '../lib/store'

/**
 * Logo da marca. Ordem: logo do perfil (upload) → SVG → PNG → monograma.
 */
export function Logo({
  size = 40,
  rounded = 'rounded-xl',
  className,
}: {
  size?: number
  rounded?: string
  className?: string
}) {
  const perfilLogo = useData((s) => s.perfil.logo)
  const empresa = useData((s) => s.perfil.empresa) || BRAND.name
  const sources = [perfilLogo, BRAND.logo, BRAND.logoFallback].filter(Boolean) as string[]
  const [idx, setIdx] = useState(0)
  useEffect(() => setIdx(0), [perfilLogo])
  const src = sources[idx]

  if (src) {
    return (
      <img
        src={src}
        alt={empresa}
        onError={() => setIdx((i) => i + 1)}
        className={cn('object-contain', rounded, className)}
        style={{ width: size, height: size }}
      />
    )
  }

  // Fallback: monograma com gradiente da marca
  return (
    <span
      className={cn('grid shrink-0 place-items-center bg-gradient-to-br from-ember-glow to-ember-deep shadow-glow', rounded, className)}
      style={{ width: size, height: size }}
    >
      <span className="font-display font-bold leading-none text-white" style={{ fontSize: size * 0.46 }}>
        {(empresa || 'D').charAt(0).toUpperCase()}
      </span>
    </span>
  )
}
