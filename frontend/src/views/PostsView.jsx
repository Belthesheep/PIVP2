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
}) {
  const paginatedPosts = posts.slice(currentPage * postsPerPage, (currentPage + 1) * postsPerPage);
  const totalPages = Math.ceil(posts.length / postsPerPage);

  return (
    <div>
      <PostGrid
        posts={paginatedPosts}
        currentUserId={currentUserId}
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
