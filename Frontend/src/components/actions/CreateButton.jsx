import closeIcon from '@synthos/shared/assets/icons/close.svg'

export default function CreateButton({
  as: Component = 'button',
  active = false,
  className = '',
  children,
  ...props
}) {
  return (
    <Component
      type={Component === 'button' ? 'button' : undefined}
      className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-accent pr-4 pl-3 text-lighter transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${className}`}
      {...props}
    >
      <span
        aria-hidden="true"
        className={`Header3 font-light leading-none transition-transform duration-200 ${active ? '' : 'rotate-45'}`}
      >
        <img src={closeIcon} alt="" aria-hidden="true" className="h-5 w-5" />
      </span>
      <span className="TextLarge">{children}</span>
    </Component>
  )
}