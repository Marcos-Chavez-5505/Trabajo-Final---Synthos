import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import Avatar from "../../components/ui/Avatar.jsx";
import RecommendationsSection from "../../components/RecommendationSection/RecommendationSection.jsx";
import RecommendSongModal from "../../components/RecommendSongModal/RecommendSongModal.jsx";
import { useAuth, useFollow, useProfilePublic } from '@synthos/shared';
import FollowButton from "../social/FollowButton.jsx";
import FollowStats from "../social/FollowStats.jsx";
import HostRatingBadge from "../social/HostRatingBadge.jsx";
import { RecommendationProvider } from '@synthos/shared';

export default function ProfilePublic() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const { isCurrent, person, hasError } = useProfilePublic(id);

  const [recOpen, setRecOpen] = useState(false);
  const [recToast, setRecToast] = useState(null);

  const follow = useFollow(person?.id ?? null);

  if (!id) {
    return (
      <div className="px-6 py-4 md:px-10">
        <p className="text-muted-foreground TextRegluar">
          No encontramos esa persona.
        </p>
        <Link
          to="/buscar?tipo=personas"
          className="text-accent TextRegluar mt-4 inline-block"
        >
          Volver a buscar
        </Link>
      </div>
    );
  }

  if (!isCurrent) {
    return (
      <div className="px-6 py-4 md:px-10">
        <p className="text-muted-foreground TextRegluar">Cargando perfil…</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="px-6 py-4 md:px-10">
        <p className="text-muted-foreground TextRegluar">
          No pudimos cargar el perfil.
        </p>
        <Link
          to="/buscar?tipo=personas"
          className="text-accent TextRegluar mt-4 inline-block"
        >
          Volver a buscar
        </Link>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="px-6 py-4 md:px-10">
        <p className="text-muted-foreground TextRegluar">
          No encontramos esa persona.
        </p>
        <Link
          to="/buscar?tipo=personas"
          className="text-accent TextRegluar mt-4 inline-block"
        >
          Volver a buscar
        </Link>
      </div>
    );
  }

  const isSelf = currentUser?.id === person.id;

  return (
    <RecommendationProvider userId={person.id}>
      <div className="px-6 py-4 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-start">
          <section className="SurfaceLight CardRadius w-full p-6 md:max-w-md md:shrink-0">
            <div className="flex items-center gap-4">
              <Avatar
                src={person.avatarUrl}
                name={person.username}
                className="h-24 w-24"
              />
              <div className="min-w-0">
                <h2 className="Header3 truncate">{person.username}</h2>
                {isSelf && (
                  <Link
                    to="/perfil"
                    className="text-accent TextMedium mt-0.5 inline-block"
                  >
                    Es tu perfil — editar
                  </Link>
                )}
              </div>
            </div>

            <p className="TextRegluar mt-4">
              {person.bio || "Sin bio todavía."}
            </p>

            <FollowStats
              basePath={`/profile/${person.id}`}
              followerCount={follow.followerCount}
              followingCount={follow.followingCount}
            />

            <HostRatingBadge
              hostRating={person.hostRating}
              hostRatingsCount={person.hostRatingsCount}
              alwaysShow
            />

            <FollowButton
              canFollow={follow.canFollow}
              isFollowing={follow.isFollowing}
              onToggle={follow.toggle}
              pending={follow.pending}
            />

            {follow.error && (
              <p className="text-muted-foreground TextTiny mt-2">
                {follow.error}
              </p>
            )}

            {!isSelf && (
              <div className="mt-4">
                {follow.loading ? (
                  <button
                    type="button"
                    disabled
                    className="TextRegluar Volume rounded px-4 py-2 opacity-50"
                  >
                    Cargando…
                  </button>
                ) : follow.isMutual ? (
                  <button
                    type="button"
                    onClick={() => {
                      setRecToast(null);
                      setRecOpen(true);
                    }}
                    className="TextRegluar Volume rounded px-4 py-2"
                  >
                    Recomendar canción
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled
                      title="Solo podés recomendar a personas con follow mutuo"
                      className="TextRegluar Volume rounded px-4 py-2 opacity-50"
                    >
                      Recomendar canción
                    </button>
                    <p className="TextTiny text-muted-foreground mt-2">
                      Necesitás seguirse mutuamente para recomendarle una
                      canción.
                    </p>
                  </>
                )}

                {recToast && (
                  <p className="TextTiny text-accent mt-2">{recToast}</p>
                )}
              </div>
            )}

            <Link
              to="/buscar?tipo=personas"
              className="TextRegluar Volume mt-6 inline-block rounded px-4 py-2"
            >
              Volver a buscar
            </Link>
          </section>

          <section className="w-full md:min-w-0 md:flex-1">
            <h3 className="Header3 mb-3">Recomendaciones</h3>
            <div className="md:max-h-[calc(100vh-8rem)] md:overflow-y-auto md:pr-2">
              <RecommendationsSection
                emptyMessage={
                  isSelf
                    ? "Todavía no te recomendaron ninguna canción."
                    : "Todavía no hay recomendaciones de esta persona."
                }
              />
            </div>
          </section>
        </div>

        {recOpen && (
          <RecommendSongModal
            onClose={() => setRecOpen(false)}
            onSent={() => setRecToast("¡Recomendación enviada!")}
          />
        )}
      </div>
    </RecommendationProvider>
  );
}