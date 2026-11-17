import { Link } from "react-router-dom";
import Avatar from "@/components/ui/Avatar.jsx";
import { withRoomMock } from "@synthos/shared"; // TODO: quitar al integrar con el backend
import crownIcon from "@synthos/shared/assets/icons/crown.svg";
import emptyHeartIcon from "@synthos/shared/assets/icons/empty_heart.svg";
import fullHeartIcon from "@synthos/shared/assets/icons/full_heart.svg";
import userGroupIcon from "@synthos/shared/assets/icons/user_group.svg";

/**
 * Tarjeta de una sala (v1, rediseño según Objetivo.png).
 *
 * Estructura:
 *   [LIVE] [géneros]                         [action]
 *   Nombre de la sala
 *   Descripción (2 líneas)
 *   [bandeja de asistentes]            anfitriona + corazones
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

export default function RoomCard({ room: rawRoom, action }) {
  const room = withRoomMock(rawRoom);
  const hostId = room.hostId || room.hostUserId || room.ownerId;
  const genres = Array.isArray(room.genres) ? room.genres.slice(0, MAX_GENRES) : [];

  return (
    <article className="SurfaceLight flex h-full flex-col gap-3 rounded-3xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-nowrap items-center gap-2">
          <LiveChip isLive={Boolean(room.isLive)} />

          {genres.length > 0 && (
            <span className="Surface TextFucsia TextTiny font-bold flex min-w-0 items-center gap-2 rounded-xl px-3 py-1.5 h-8">
              <MaskIcon src={userGroupIcon} className="h-5 w-5 shrink-0" />
              <span className="truncate">{genres.join(" · ")}</span>
            </span>
          )}

          {room.isPrivate && (
            <span className="Surface text-muted-foreground TextMedium shrink-0 rounded-xl px-3 py-1.5">
              Privada
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

      <div className="mt-auto flex flex-nowrap items-center justify-between gap-3 pt-1">
        <MembersTray room={room} />

        {room.hostUsername && (
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative shrink-0">
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
            </div>

            <div className="flex min-w-0 flex-col">
              {hostId ? (
                <Link
                  to={`/profile/${hostId}`}
                  className="text-foreground TextMedium truncate hover:underline"
                >
                  {room.hostUsername}
                </Link>
              ) : (
                <span className="text-foreground TextMedium truncate">
                  {room.hostUsername}
                </span>
              )}
              <Hearts rating={room.hostRating} count={room.ratingsCount} />
            </div>
          </div>
        )}
      </div>
    </article>
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
  const members = room.members.slice(0, slots);
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

const HEARTS_ROW_VARS = {
  "--size": "clamp(10px, calc((100cqw - 8px) / 5), 14px)",
  "--overlap": "calc(max(0px, 5 * var(--size) + 8px - 100cqw) / 4)",
};

function Hearts({ rating, count }) {
  const rounded = Math.max(0, Math.min(HEARTS, Math.round(Number(rating) || 0)));
  const label = count
    ? `${Number(rating).toFixed(2)} de 5, ${count} ${
        count === 1 ? "persona calificó" : "personas calificaron"
      }`
    : "Sin calificaciones";

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="@container text-(--ds-salmon) mt-0.5 block w-19.5 max-w-full"
    >
      <span className="flex h-3.5 items-center" style={HEARTS_ROW_VARS}>
        {Array.from({ length: HEARTS }, (_, index) => (
          <HeartIcon
            key={index}
            filled={count > 0 && index < rounded}
            first={index === 0}
          />
        ))}
      </span>
    </span>
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

function HeartIcon({ filled, first }) {
  return (
    <MaskIcon
      src={filled ? fullHeartIcon : emptyHeartIcon}
      className="aspect-square shrink-0"
      style={{
        width: "var(--size)",
        marginLeft: first ? 0 : "calc(2px - var(--overlap))",
      }}
    />
  );
}