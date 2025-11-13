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
}) {
  const paginatedFavorites = favorites.slice(currentPage * postsPerPage, (currentPage + 1) * postsPerPage);
  const totalPages = Math.ceil(favorites.length / postsPerPage);

  if (!currentUser) {
    return <p>Please login to see your favorites</p>;
  }

  if (favorites.length === 0) {
    return <p>You haven't favorited any posts yet</p>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>My Favorites</h2>
      <PostGrid
        posts={paginatedFavorites}
        currentUserId={currentUser.id}
        onCardClick={onPostClick}
        onDelete={onDelete}
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
