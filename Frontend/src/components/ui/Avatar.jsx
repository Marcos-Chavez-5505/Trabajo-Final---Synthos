export default function Avatar({ src, name, className = '' }) {
  const classes = `shrink-0 rounded-full ${className}`

  if (src) {
    return <img src={src} alt={name ?? 'avatar'} className={`object-cover ${classes}`} />
  }

  const initial = name ? name.charAt(0).toUpperCase() : '?'
  return (
    <div className={`flex items-center justify-center Fucsia ${classes}`}>
      <span className="Button">{initial}</span>
    </div>
  )
}