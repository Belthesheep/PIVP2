import { PostGrid } from '../components/Posts/PostGrid';
import { Pagination } from '../components/Common/Pagination';

export function PostsView({
  posts,
  currentUserId,
  currentPage,
  postsPerPage,
  onPostClick,
  onDelete,
  onPageChange,
  isAdmin,
  onAdminDelete,
}) {
  const paginatedPosts = posts.slice(currentPage * postsPerPage, (currentPage + 1) * postsPerPage);
  const totalPages = Math.ceil(posts.length / postsPerPage);

  return (
    <div>
      <PostGrid
        posts={paginatedPosts}
        currentUserId={currentUserId}
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
