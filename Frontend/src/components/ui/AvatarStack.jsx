import Avatar from "./Avatar";

const MAX_VISIBLE = 3;

// El primero queda por encima del segundo, y el segundo por encima del tercero.
// (Tailwind necesita clases estáticas, por eso no se arma el nombre dinámicamente.)
const Z_INDEX = ["z-30", "z-20", "z-10"];

/**
 * Grupo de avatares.
 *
 * - Muestra hasta 3 avatares y, si hay más, el contador "+N".
 * - Con `onClick` se renderiza como botón (para abrir participantes/invitar).
 * - Sin `onClick` es solo presentacional: sin cursor pointer ni botón.
 *
 * Props:
 *  - members: Array<{ id?: string|number, username: string, avatarUrl?: string }>
 *  - onClick: (event) => void   (opcional)
 *  - label: string              (aria-label cuando es botón)
 */
export default function AvatarStack({
  members = [],
  onClick,
  label = "Ver participantes e invitar",
}) {
  if (members.length === 0) return null;

  const visibleMembers = members.slice(0, MAX_VISIBLE);
  const remaining = members.length - visibleMembers.length;

  const group = (
    <div className="flex items-center -space-x-5">
      {visibleMembers.map((member, index) => (
        <Avatar
          key={member.id ?? member.username}
          src={member.avatarUrl}
          name={member.username}
          className={`relative h-9 w-9 ${Z_INDEX[index] ?? "z-0"}`}
        />
      ))}

      {remaining > 0 && (
        <span className="bg-(--ds-wall)/60 TextTiny text-lighter font-bold relative z-0 flex h-6 w-6 items-center justify-center rounded-full ml-5.5">
          +{remaining}
        </span>
      )}
    </div>
  );

  if (!onClick) {
    return (
      <div role="group" aria-label="Participantes" className="inline-flex">
        {group}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-haspopup="dialog"
      className="inline-flex cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
    >
      {group}
    </button>
  );
}
