import { initials, vendedorColor, cn } from '../lib/utils'

const DIM: Record<string, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-[13px]',
  lg: 'h-12 w-12 text-base',
  xl: 'h-20 w-20 text-2xl',
}

export function Avatar({
  name,
  size = 'md',
  ring = true,
  src,
}: {
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  ring?: boolean
  src?: string | null
}) {
  const c = vendedorColor(name)
  const dim = DIM[size]

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        title={name}
        className={cn('shrink-0 rounded-full object-cover', dim)}
        style={{ boxShadow: ring ? `0 0 0 2px ${c}33` : undefined }}
      />
    )
  }

  return (
    <span
      className={cn('inline-grid place-items-center rounded-full font-bold text-white shrink-0', dim)}
      style={{
        background: `linear-gradient(150deg, ${c}, ${c}bb)`,
        boxShadow: ring ? `0 0 0 2px ${c}33` : undefined,
      }}
      title={name}
    >
      {initials(name)}
    </span>
  )
}
