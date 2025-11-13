import { useCallback } from 'react';

export function PostCard({ post, currentUserId, onCardClick, onDelete }) {
  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete(post.id);
  }, [post.id, onDelete]);

  return (
    <div className="post-card" onClick={() => onCardClick(post)}>
      <img
        src={`http://localhost:8000/uploads/${post.image_filename}`}
        alt={post.description || 'Post'}
      />
      <div className="post-info">
        <p className="post-desc">{post.description || 'No description'}</p>
        <div className="post-tags">
          {(post.tags || []).map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
        <div className="post-meta">
          <small>by {post.uploader_username}</small>
          <div>
            <small style={{ marginRight: 8 }}>{post.favorite_count ?? 0} ★</small>
            {currentUserId === post.uploader_id && (
              <button
                className="delete-btn"
                onClick={handleDelete}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
