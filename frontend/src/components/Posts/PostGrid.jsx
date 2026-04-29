import { PostCard } from './PostCard';

export function PostGrid({ posts, currentUserId, isAdmin, onCardClick, onDelete, onAdminDelete }) {
  if (posts.length === 0) {
    return <p>No posts match the selected tags or search.</p>;
  }

  return (
    <div className="posts-grid">
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onCardClick={onCardClick}
          onDelete={onDelete}
          onAdminDelete={onAdminDelete}
        />
      ))}
    </div>
  );
}
