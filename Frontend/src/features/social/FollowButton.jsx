/**
 * Botón seguir / dejar de seguir (TS-10).
 *
 * Solo presentación: el estado y el click se los pasa `useFollow`, que lo usa
 * una sola vez por pantalla. Que el botón sea presentacional es lo que permite
 * que el contador y el botón nunca se contradigan.
 *
 * Devuelve `null` cuando no corresponde mostrarlo (sin sesión, o el perfil es
 * el propio), así que la pantalla no tiene que decidir nada.
 */
export default function FollowButton({ canFollow, isFollowing, onToggle, pending }) {
  if (!canFollow) return null

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={onToggle}
        disabled={pending}
        aria-pressed={isFollowing}
        aria-busy={pending}
        className={
          // Seguido y no seguido no se distinguen por el color del texto sino
          // por el fondo: los íconos del set de diseño vienen con `#F4F0F9`
          // hardcodeado y no se recolorean (regla 10 de AGENTS.md).
          isFollowing
            ? 'Volume Button rounded px-4 py-2 disabled:opacity-60'
            : 'Fucsia Button rounded px-4 py-2 disabled:opacity-60'
        }
      >
        {isFollowing ? 'Siguiendo' : 'Seguir'}
      </button>
    </div>
  )
}
