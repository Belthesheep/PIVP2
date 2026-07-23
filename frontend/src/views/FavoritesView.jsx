import { PostGrid } from '../components/Posts/PostGrid';
import { Pagination } from '../components/Common/Pagination';

export function FavoritesView({
  favorites,
  currentUser,
  currentPage,
  postsPerPage,
  onPostClick,
  onDelete,
  onPageChange,
  isAdmin,
  onAdminDelete,
}) {
  const paginatedFavorites = favorites.slice(currentPage * postsPerPage, (currentPage + 1) * postsPerPage);
  const totalPages = Math.ceil(favorites.length / postsPerPage);

  if (!currentUser) {
    return <p>Por favor, inicia sesión para ver tus favoritos</p>;
  }

  if (favorites.length === 0) {
    return <p>Aún no has agregado publicaciones a favoritos</p>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Mis Favoritos</h2>
      <PostGrid
        posts={paginatedFavorites}
        currentUserId={currentUser.id}
        isAdmin={isAdmin}
        onCardClick={onPostClick}
        onDelete={onDelete}
        onAdminDelete={onAdminDelete}
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
