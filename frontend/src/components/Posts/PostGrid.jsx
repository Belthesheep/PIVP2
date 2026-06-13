import { PostCard } from './PostCard';

export function PostGrid({ posts, currentUserId, isAdmin, onCardClick, onDelete, onAdminDelete }) {
  if (posts.length === 0) {
    return <p>No hay publicaciones que coincidan con las etiquetas o búsqueda seleccionadas.</p>;
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
