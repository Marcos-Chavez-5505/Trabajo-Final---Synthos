// Piezas visuales del reproductor expandido. Solo presentación.

export function CoverDisc({ src, alt, spinning }) {
  return (
    <div className="[--disc:min(420px,calc(100vw_-_32px))] mx-auto h-[calc(var(--disc)/2_+_8px)] w-[var(--disc)] overflow-hidden">
      <div
        className="animate-spin relative -mt-[calc(var(--disc)/2_-_8px)] aspect-square w-full rounded-full bg-cover bg-center motion-reduce:[animation:none]"
        style={{
          backgroundImage: `url(${src})`,
          animationDuration: '18s',
          animationPlayState: spinning ? 'running' : 'paused',
        }}
        role="img"
        aria-label={alt}
      >
        <span className="Volume absolute left-1/2 top-1/2 aspect-square w-[14%] -translate-x-1/2 -translate-y-1/2 rounded-full" />
      </div>
    </div>
  )
}

export function TrackInfo({ title, artist }) {
  return (
    <div className="mt-[clamp(64px,1.5vh,128px)]">
      <h2 className="text-[clamp(var(--ds-size-header2),6vw,var(--ds-size-header1))] font-bold leading-[1.1]">
        {title}
      </h2>
      <p className="mt-1.5 text-[var(--ds-size-large)] leading-[var(--ds-lh-large)] text-muted-foreground">
        {artist}
      </p>
    </div>
  )
}

export function PlayingFrom({ label = 'Reproduciendo desde:', name }) {
  return (
    <p className="text-muted-foreground mt-auto pt-[clamp(12px,4vh,40px)] text-center text-[var(--ds-size-medium)] leading-[var(--ds-lh-medium)]">
      <span>{label}</span> <strong className="font-normal text-foreground">{name}</strong>
    </p>
  )
}