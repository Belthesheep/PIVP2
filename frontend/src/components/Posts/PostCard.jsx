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
        <div style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '100%',
          backgroundColor: '#1a1a1a',
          borderRadius: '8px 8px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            fontSize: '3rem',
            opacity: 0.8,
            cursor: 'pointer'
          }}>
            ▶️
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
