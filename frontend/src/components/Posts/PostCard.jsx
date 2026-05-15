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
        <div style={{ position: 'relative', width: '100%', paddingBottom: '100%' }}>
          <video
            src={mediaUrl}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '8px 8px 0 0'
            }}
          />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '2rem',
            opacity: 0.7
          }}>
            🎬
          </div>
        </div>
      ) : (
        <img
          src={mediaUrl}
          alt={post.description || 'Post'}
        />
      )}
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
            {isAdmin && currentUserId !== post.uploader_id && (
              <button
                className="delete-btn-admin"
                onClick={handleAdminDelete}
                title="Delete as admin"
              >
                Delete (Admin)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
