import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "@/components/ui/Avatar.jsx";
import crownIcon from "@synthos/shared/assets/icons/crown.svg";
import emptyHeartIcon from "@synthos/shared/assets/icons/empty_heart.svg";
import fullHeartIcon from "@synthos/shared/assets/icons/full_heart.svg";
import userGroupIcon from "@synthos/shared/assets/icons/user_group.svg";

/**
 * Tarjeta de una sala (v1, rediseño según Objetivo.png).
 *
 * Estructura (ancho):
 *   [LIVE] [géneros | separados | por barra]         [action]
 *   Nombre de la sala
 *   Descripción (2 líneas)
 *   [bandeja de asistentes]            anfitrion + corazones
 *
 * Los géneros se separan con "|" y, si no entran en el ancho disponible,
 * se muestran en un carrusel automático (marquee).
 *
 * Campos opcionales que la tarjeta lee si existen (ver preguntas abiertas):
 *   - room.isLive          boolean (LIVE si true, OFF si false)
 *   - room.genres          string[]
 *   - room.members         Array<{ id, username, avatarUrl }> (invitados, sin la anfitriona)
 *   - room.hostAvatarUrl   string
 *
 * `action` sigue siendo un slot: la pantalla decide qué botón ofrecer.
 */

const DEFAULT_CAPACITY = 10;
const MAX_GUEST_SLOTS = 9;
const MAX_GENRES = 3;
const HEARTS = 5;
const TICKER_SPEED = 30; // px por segundo
const TICKER_PAUSE = 1500; // ms de espera en cada extremo

export default function RoomCard({ room, action }) {
  const hostId = room.hostId || room.hostUserId || room.ownerId;
  const genres = Array.isArray(room.genres) ? room.genres.slice(0, MAX_GENRES) : [];

  return (
    <article className="@container SurfaceLight flex h-full flex-col gap-3 rounded-3xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col items-start gap-2 @min-[360px]:flex-row @min-[360px]:items-center">
          <div className="flex shrink-0 items-center gap-2">
            <LiveChip isLive={Boolean(room.isLive)} />

            {room.isPrivate && (
              <span className="Surface text-muted-foreground TextMedium shrink-0 rounded-xl px-3 py-1.5">
                Privada
              </span>
            )}
          </div>

          {genres.length > 0 && (
            <span className="Surface TextFucsia TextTiny font-bold flex max-w-full min-w-0 items-center gap-2 rounded-xl px-3 py-1.5 h-8">
              <MaskIcon src={userGroupIcon} className="h-5 w-5 shrink-0" />
              <GenresTicker genres={genres} />
            </span>
          )}
        </div>

        {action && <div className="flex shrink-0">{action}</div>}
      </div>

      <div className="min-w-0">
        <h3 className="text-foreground Header3 truncate">{room.name}</h3>
        <p className="text-muted-foreground TextRegluar mt-1 line-clamp-2 min-h-12">
          {room.description}
        </p>
      </div>

      <div className="mt-auto flex flex-col items-start gap-3 pt-1 @min-[270px]:flex-row @min-[270px]:items-center @min-[270px]:justify-between">
        <MembersTray room={room} />

        {room.hostUsername && (
          <div className="flex max-w-full min-w-0 items-center gap-3">
            <HostAvatar room={room} hostId={hostId} />

            <div className="flex min-w-0 flex-col">
              {hostId ? (
                <Link
                  to={`/profile/${hostId}`}
                  className={`${HOST_NAME_CLASS} hover:underline`}
                >
                  {room.hostUsername}
                </Link>
              ) : (
                <span className={HOST_NAME_CLASS}>{room.hostUsername}</span>
              )}
              <Hearts rating={room.hostRating} count={room.ratingsCount} />
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function GenresList({ genres }) {
  return (
    <span className="flex shrink-0 items-center gap-2 whitespace-nowrap">
      {genres.map((genre, index) => (
        <span key={`${genre}-${index}`} className="flex items-center gap-2">
          {index > 0 && (
            <span aria-hidden="true" className="font-extrabold TextLarge">
              ·
            </span>
          )}
          <span>{genre}</span>
        </span>
      ))}
    </span>
  );
}

function GenresTicker({ genres }) {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const contentRef = useRef(null);
  const animationRef = useRef(null);
  const [overflow, setOverflow] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Respeta prefers-reduced-motion: en ese caso se usa scroll horizontal manual.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Detecta si los géneros no entran en el ancho disponible.
  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const measure = () => {
      setOverflow(content.offsetWidth > container.clientWidth + 1);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(content);
    return () => observer.disconnect();
  }, [genres]);

  // Anima el carrusel (ida y vuelta) solo cuando hay overflow:
  // espera al inicio -> avanza hasta el final -> espera -> vuelve suavemente.
  useEffect(() => {
    const track = trackRef.current;
    const container = containerRef.current;
    const content = contentRef.current;
    if (!track || !container || !content || !overflow || reducedMotion) return;

    const distance = Math.max(0, content.offsetWidth - container.clientWidth);
    if (distance === 0) return;

    const travel = (distance / TICKER_SPEED) * 1000;
    const total = 2 * travel + 2 * TICKER_PAUSE;
    const a = TICKER_PAUSE / total; // fin de la espera inicial
    const b = (TICKER_PAUSE + travel) / total; // llegada al final
    const c = (2 * TICKER_PAUSE + travel) / total; // fin de la espera final

    const animation = track.animate(
      [
        { transform: "translateX(0)", offset: 0 },
        { transform: "translateX(0)", offset: a, easing: "ease-in-out" },
        { transform: `translateX(-${distance}px)`, offset: b },
        { transform: `translateX(-${distance}px)`, offset: c, easing: "ease-in-out" },
        { transform: "translateX(0)", offset: 1 },
      ],
      {
        duration: total,
        iterations: Infinity,
        easing: "linear",
      },
    );
    animationRef.current = animation;

    return () => {
      animation.cancel();
      animationRef.current = null;
    };
  }, [overflow, reducedMotion, genres]);

  const pause = () => animationRef.current?.pause();
  const play = () => animationRef.current?.play();

  return (
    <div
      ref={containerRef}
      aria-label={genres.join(", ")}
      title={genres.join(" | ")}
      onMouseEnter={pause}
      onMouseLeave={play}
      onFocus={pause}
      onBlur={play}
      className={`min-w-0 ${
        reducedMotion && overflow
          ? "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "overflow-hidden"
      }`}
    >
      <div
        ref={trackRef}
        className="flex w-max items-center will-change-transform"
      >
        <span ref={contentRef} className="flex">
          <GenresList genres={genres} />
        </span>
      </div>
    </div>
  );
}

function HostAvatar({ room, hostId }) {
  const content = (
    <>
      <Avatar
        src={room.hostAvatarUrl}
        name={room.hostUsername}
        className="h-10 w-10"
      />
      <span
        aria-hidden="true"
        className="Salmon border-(--ds-surface-light) absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2"
      >
        <img src={crownIcon} alt="" aria-hidden="true" className="h-3 w-3" />
      </span>
    </>
  );

  if (!hostId) {
    return <div className="relative shrink-0">{content}</div>;
  }

  return (
    <Link
      to={`/profile/${hostId}`}
      aria-label={`Ir al perfil de ${room.hostUsername}`}
      className="relative block shrink-0 rounded-full"
    >
      {content}
    </Link>
  );
}

function LiveChip({ isLive }) {
  return (
    <span className="Surface TextFucsia TextTiny font-bold flex shrink-0 items-center gap-2 rounded-xl px-3 py-1.5 h-8">
      <span
        aria-hidden="true"
        className={`border-accent h-3.5 w-3.5 rounded-full border-2 ${
          isLive ? "Fucsia" : ""
        }`}
      />
      {isLive ? "LIVE" : "OFF"}
    </span>
  );
}

function MembersTray({ room }) {
  const capacity = room.maxCapacity ?? DEFAULT_CAPACITY;
  const slots = Math.min(Math.max(0, capacity - 1), MAX_GUEST_SLOTS);
  const members = (Array.isArray(room.members) ? room.members : []).slice(0, slots);
  const empty = slots - members.length;
  const label = `${room.membersCount} de ${capacity} personas en la sala`;

  if (slots === 0) return null;

  return (
    <div
      role="group"
      aria-label={label}
      className="Volume flex shrink-0 items-center rounded-full p-2 -space-x-3"
    >
      {members.map((member, index) => (
        <span
          key={member.id ?? member.username}
          style={{ zIndex: slots - index }}
          className="relative flex"
        >
          <Avatar
            src={member.avatarUrl}
            name={member.username}
            className="border-(--ds-volume) h-7 w-7 border-2"
          />
        </span>
      ))}

      {Array.from({ length: empty }, (_, index) => (
        <span
          key={`empty-${index}`}
          aria-hidden="true"
          style={{ zIndex: empty - index }}
          className={`Wall border-(--ds-volume) relative h-7 w-7 rounded-full border-2 ${
            index === 0 && members.length > 0 ? "ml-1" : ""
          }`}
        />
      ))}
    </div>
  );
}

const HOST_NAME_CLASS = "text-foreground TextMedium truncate @min-[270px]:hidden @min-[298px]:block";

const HEARTS_ROW_VARS = {"--wide-size": "clamp(10px, calc((100cqw - 248px) / 5), 14px)",};

function Hearts({ rating, count }) {
  const hasRating = count > 0;
  const rounded = hasRating
    ? Math.max(0, Math.min(HEARTS, Math.round(Number(rating) || 0)))
    : 0;
  const label = hasRating
    ? `${Number(rating).toFixed(2)} de 5, ${count} ${
        count === 1 ? "persona calificó" : "personas calificaron"
      }`
    : "Sin calificaciones";

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="text-(--ds-salmon) mt-0.5 block"
    >
      <span
        aria-hidden="true"
        className="flex h-3.5 items-center gap-0.5 [--size:14px] @min-[270px]:hidden @min-[298px]:flex @min-[298px]:[--size:var(--wide-size)]"
        style={HEARTS_ROW_VARS}
      >
        {Array.from({ length: HEARTS }, (_, index) => (
          <HeartIcon key={index} filled={index < rounded} />
        ))}
      </span>

      <span
        aria-hidden="true"
        className="TextMedium hidden h-3.5 items-center gap-1 leading-none font-bold @min-[270px]:flex @min-[298px]:hidden"
      >
        {rounded}
        <MaskIcon
          src={rounded > 0 ? fullHeartIcon : emptyHeartIcon}
          className="h-3.5 w-3.5 shrink-0"
        />
      </span>
    </span>
  );
}

function HeartIcon({ filled }) {
  return (
    <MaskIcon
      src={filled ? fullHeartIcon : emptyHeartIcon}
      className="aspect-square shrink-0"
      style={{ width: "var(--size)" }}
    />
  );
}

function MaskIcon({ src, className = "", style }) {
  const url = `url(${JSON.stringify(src)})`;
  const mask = {
    WebkitMaskImage: url,
    maskImage: url,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    WebkitMaskSize: "contain",
    maskSize: "contain",
    ...style,
  };

  return (
    <span
      aria-hidden="true"
      style={mask}
      className={`inline-block bg-current ${className}`}
    />
  );
}