import { PostCard } from '../Posts/PostCard';

export function PoolDetail({ pool, currentUser, onOpenCarousel, onOpenPost, onDelete, poolPostCount }) {
  const createdAtText = pool.created_at
    ? new Date(pool.created_at).toLocaleString('es-ES')
    : 'Fecha no disponible';
  const isDeletedForAdmin = currentUser?.is_admin && Boolean(pool.deleted_at);

  return (
    <div className="pool-detail">
      <div className="pool-header">
        <div>
          <div className="detail-top-meta">
            {isDeletedForAdmin && <span className="deleted-badge">Eliminada</span>}
            <span className="detail-created-at">Creada: {createdAtText}</span>
          </div>
          <h2>{pool.name}</h2>
          <p>{pool.description}</p>
          <small>por {pool.creator_username || pool.creator_id}</small>
        </div>
        <div className="pool-actions">
          <button className="pool-carousel-btn" onClick={() => onOpenCarousel(pool.posts || [], 0)} disabled={poolPostCount(pool) === 0}>
            Abrir Carrusel
          </button>
        </div>
      </div>

      <div className="pools-grid" style={{ marginTop: 16 }}>
        {(pool.posts || []).map((p, idx) => (
          <PostCard
            key={p.id || p.post_id || idx}
            post={p}
            currentUserId={currentUser?.id}
            isAdmin={currentUser?.is_admin}
            onCardClick={() => onOpenPost(p.id || p.post_id)}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
