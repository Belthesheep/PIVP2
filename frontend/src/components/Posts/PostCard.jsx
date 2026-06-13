import { useCallback } from 'react';
import { isVideo, getMediaUrl } from '../../utils/mediaUtils';

export function PostCard({ post, currentUserId, isAdmin, onCardClick, onDelete, onAdminDelete }) {
  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete(post.id);
  }, [post.id, onDelete]);

  const handleAdminDelete = useCallback((e) => {
    e.stopPropagation();
    if (onAdminDelete) {
      onAdminDelete(post.id);
    }
  }, [post.id, onAdminDelete]);

  const mediaIsVideo = isVideo(post.image_filename);
  const mediaUrl = getMediaUrl(post.image_filename);

  return (
    <div className="post-card" onClick={() => onCardClick(post.id)}>
      {mediaIsVideo ? (
        <img
          src="/vidplaceholder.png"
          alt="Video placeholder"
          style={{
              width: '100%',
          }}
        />
      ) : (
        <img
          src={mediaUrl}
          alt={post.description || 'Post'}
        />
      )}
      <div className="post-info">
        <p className="post-desc">{post.description || 'Sin descripción'}</p>
        <div className="post-tags">
          {(post.tags || []).map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
        <div className="post-meta">
          <small>por {post.uploader_username}</small>
          <div>
            <small style={{ marginRight: 8 }}>{post.favorite_count ?? 0} ★</small>
            {currentUserId === post.uploader_id && (
              <button
                className="delete-btn"
                onClick={handleDelete}
              >
                Eliminar
              </button>
            )}
            {isAdmin && currentUserId !== post.uploader_id && (
              <button
                className="delete-btn-admin"
                onClick={handleAdminDelete}
                title="Eliminar (Admin)"
              >
                Eliminar (Admin)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
