import { useCallback } from 'react';

export function PostDetail({
  post,
  currentUser,
  pools,
  onToggleFavorite,
  onDelete,
  onOpenPool,
  onAddToPool,
  onPoolSearchChange,
  poolSearch,
  poolPostCount,
}) {
  const handleToggleFavorite = useCallback(async () => {
    await onToggleFavorite(post.id);
  }, [post.id, onToggleFavorite]);

  const handleDelete = useCallback(() => {
    onDelete(post.id);
  }, [post.id, onDelete]);

  const handleAddToPool = useCallback((poolId) => {
    onAddToPool(poolId, post.id);
  }, [post.id, onAddToPool]);

  const poolsContainingPost = post._containingPools || [];
  const userPools = pools.filter(p => currentUser && p.creator_id === currentUser.id);
  const matchingPools = userPools.filter(p => p.name.toLowerCase().includes(poolSearch.toLowerCase()));

  return (
    <div className="post-detail">
      <div className="detail-content">
        <div className="detail-image">
          <img src={`http://localhost:8000/uploads/${post.image_filename}`} alt={post.description || 'Post'} />
        </div>
        <div className="detail-info">
          {/* Description + Favorite Button */}
          <div className="detail-header">
            <h2>{post.description || 'No description'}</h2>
            <button
              className={post._favorited ? 'btn-favorited' : 'btn-favorite'}
              onClick={handleToggleFavorite}
            >
              {post._favorited ? 'Favorited' : 'Favorite'} • {post.favorite_count ?? 0}
            </button>
          </div>

          {/* Tags */}
          <div className="detail-section">
            <h3>Tags</h3>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(post.tags || []).map(t => <span key={t} className="tag">{t}</span>)}
            </div>
          </div>

          {/* Pools and Add to Pool */}
          <div className="detail-pools-row">
            <div className="pools-column">
              <h3>Pools</h3>
              <div className="pool-links">
                {poolsContainingPost.length === 0 ? (
                  <div>No pools contain this post</div>
                ) : (
                  poolsContainingPost.map(pool => (
                    <button key={pool.id} className="pool-link" onClick={() => onOpenPool(pool.id)}>
                      {pool.name}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="add-to-pool-column">
              <h3>Add to pool</h3>
              <input
                placeholder="Search pools by name"
                value={poolSearch}
                onChange={(e) => onPoolSearchChange(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(20,40,80,0.06)', marginBottom: 8 }}
              />
              {poolSearch && (
                <div className="suggestion-list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {matchingPools.length === 0 ? (
                    <div style={{ color: '#666' }}>No matching pools</div>
                  ) : (
                    matchingPools.map(pool => (
                      <button
                        key={pool.id}
                        className="suggestion-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToPool(pool.id);
                          onPoolSearchChange('');
                        }}
                      >
                        {pool.name} <small style={{ marginLeft: 8, color: '#fff', opacity: 0.9 }}>{poolPostCount(pool)} posts</small>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Uploader */}
          <div className="detail-section detail-footer">
            <h3>Uploader</h3>
            <small>{post.uploader_username}</small>
            {currentUser?.id === post.uploader_id && (
              <button
                className="delete-btn"
                onClick={handleDelete}
                style={{ marginLeft: 8 }}
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
