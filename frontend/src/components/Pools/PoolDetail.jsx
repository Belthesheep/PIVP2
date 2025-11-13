import { PostCard } from '../Posts/PostCard';

export function PoolDetail({ pool, currentUser, onOpenCarousel, onOpenPost, onDelete, poolPostCount }) {
  return (
    <div>
      <div className="pool-header">
        <div>
          <h2>{pool.name}</h2>
          <p>{pool.description}</p>
          <small>by {pool.creator_username || pool.creator_id}</small>
        </div>
        <div className="pool-actions">
          <button onClick={() => onOpenCarousel(pool.posts || [], 0)} disabled={poolPostCount(pool) === 0}>
            Open Carousel
          </button>
        </div>
      </div>

      <div className="pools-grid" style={{ marginTop: 16 }}>
        {(pool.posts || []).map((p, idx) => (
          <PostCard
            key={p.id || p.post_id || idx}
            post={p}
            currentUserId={currentUser?.id}
            onCardClick={() => onOpenPost(p.id || p.post_id)}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
