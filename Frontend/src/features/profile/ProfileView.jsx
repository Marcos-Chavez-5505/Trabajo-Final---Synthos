
import Avatar from "../../components/ui/Avatar.jsx";
import RecommendationSection from "../../components/RecommendationSection/RecommendationSection.jsx";
import { useAuth, useFollow, useProfileView } from '@synthos/shared';
import FollowStats from "../social/FollowStats.jsx";
import HostRatingBadge from "../social/HostRatingBadge.jsx";
import ProfileEdit from "./ProfileEdit.jsx";
import { RecommendationProvider } from '@synthos/shared';

export default function ProfileView() {
  const { user, loading } = useAuth();
  const { editing, setEditing } = useProfileView();
  const follow = useFollow(user?.id ?? null);

  if (loading) return null;

  if (!user) {
    return (
      <div className="p-6 md:p-10">
        <p className="TextRegluar">Iniciá sesión para ver tu perfil.</p>
      </div>
    );
  }

  if (editing) {
    return <ProfileEdit onDone={() => setEditing(false)} />;
  }

  return (
    <RecommendationProvider userId={user.id}>
      <div className="p-6 md:p-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-start">
          <section className="w-full max-w-md rounded-lg p-6 SurfaceLight md:shrink-0">
            <div className="flex items-center gap-4">
              <Avatar
                src={user.avatarUrl}
                name={user.username}
                className="h-24 w-24"
              />
              <div className="min-w-0">
                <h2 className="Header3 truncate">{user.username}</h2>
                <p className="truncate TextMedium opacity-70">{user.email}</p>
              </div>
            </div>

            <p className="mt-4 TextRegluar">{user.bio || "Sin bio todavía."}</p>

            <FollowStats
              basePath="/perfil"
              followerCount={follow.followerCount}
              followingCount={follow.followingCount}
            />

            <HostRatingBadge
              hostRating={user.hostRating}
              hostRatingsCount={user.hostRatingsCount}
              alwaysShow
            />

            <button
              onClick={() => setEditing(true)}
              className="mt-6 rounded px-4 py-2 Fucsia Button hover:brightness-110"
            >
              Editar perfil
            </button>
          </section>

          <section className="w-full md:min-w-0 md:flex-1">
            <h3 className="Header3 mb-3">Recomendaciones</h3>
            <div className="md:max-h-[calc(100vh-8rem)] md:overflow-y-auto md:pr-2">
              <RecommendationSection emptyMessage="Todavía no te recomendaron ninguna canción." />
            </div>
          </section>
        </div>
      </div>
    </RecommendationProvider>
  );
}