import { Button } from './button'
import { cn } from '@/lib/utils'
import leftArrow from '@/assets/left_arrow.svg'
import rightArrow from '@/assets/right_arrow.svg'
import threeDots from '@/assets/three_dots.svg'

/**
 * Paginación adapted del registry de shadcn (style base-nova) al proyecto:
 * íconos del set propio (`src/assets`) en vez de la librería, y navegación con
 * `render` de Base UI en vez de `<a>`, para que quien la use enchufe un <Link>
 * de React Router y la navegación sea de verdad.
 *
 * La página activa se marca con `variant="default"` (Fucsia) y el resto con
 * "ghost"; los colores salen del puente semántico de `index.css`, no de
 * literales.
 */

function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      role="navigation"
      aria-label="Paginación"
      data-slot="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  )
}

function PaginationContent({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn('flex flex-wrap items-center gap-1', className)}
      {...props}
    />
  )
}

function PaginationItem(props: React.ComponentProps<'li'>) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & React.ComponentProps<typeof Button>

function PaginationLink({
  className,
  isActive = false,
  render,
  variant,
  size = 'icon',
  children,
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      render={render}
      nativeButton={false}
      size={size}
      variant={variant ?? (isActive ? 'default' : 'ghost')}
      data-slot="pagination-link"
      data-active={isActive || undefined}
      aria-current={isActive ? 'page' : undefined}
      className={cn('rounded-md', className)}
      {...props}
    >
      {children}
    </Button>
  )
}

type PaginationArrowProps = PaginationLinkProps

function PaginationPrevious({ className, ...props }: PaginationArrowProps) {
  return (
    <PaginationLink
      aria-label="Ir a la página anterior"
      size="default"
      className={cn('gap-1.5 px-3', className)}
      {...props}
    >
      <img src={leftArrow} alt="" aria-hidden="true" className="h-4 w-4" />
      Anterior
    </PaginationLink>
  )
}

function PaginationNext({ className, ...props }: PaginationArrowProps) {
  return (
    <PaginationLink
      aria-label="Ir a la página siguiente"
      size="default"
      className={cn('gap-1.5 px-3', className)}
      {...props}
    >
      Siguiente
      <img src={rightArrow} alt="" aria-hidden="true" className="h-4 w-4" />
    </PaginationLink>
  )
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn('Volume flex size-8 items-center justify-center rounded-md', className)}
      {...props}
    >
      <img src={threeDots} alt="" aria-hidden="true" className="h-4 w-4" />
      <span className="sr-only">Más páginas</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}