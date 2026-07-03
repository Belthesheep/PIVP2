import { useCallback } from 'react';
import { translations } from '../../translations';

export function PoolCard({ pool, poolPostCount, currentUserId, isAdmin, onCardClick, onDelete, onAdminDelete }) {
  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete(pool.id);
  }, [pool.id, onDelete]);

  const handleAdminDelete = useCallback((e) => {
    e.stopPropagation();
    if (onAdminDelete) {
      onAdminDelete(pool.id);
    }
  }, [pool.id, onAdminDelete]);

  const isDeleted = Boolean(pool.deleted_at);

  return (
    <div key={pool.id} className={`pool-card ${isAdmin && isDeleted ? 'deleted-admin-card' : ''}`} onClick={() => onCardClick(pool.id)}>
      {isAdmin && isDeleted && <div className="deleted-badge">Eliminada</div>}
      <h3>{pool.name}</h3>
      <p>{pool.description}</p>
      <div className="pool-meta">
        <small>por {pool.creator_username || pool.creator_id}</small>
        <small>{poolPostCount(pool)} publicaciones</small>
      </div>
      <div className="pool-actions">
        {currentUserId === pool.creator_id && onDelete && (
          <button
            className="pool-card-delete-btn"
            onClick={handleDelete}
          >
            {translations.delete}
          </button>
        )}
        {isAdmin && currentUserId !== pool.creator_id && onAdminDelete && (
          <button
            className="pool-card-delete-btn-admin"
            onClick={handleAdminDelete}
            title={`${translations.delete} (Admin)`}
          >
            {translations.delete} (Admin)
          </button>
        )}
      </div>
    </div>
  );
}
