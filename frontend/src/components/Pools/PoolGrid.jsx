import { PoolCard } from './PoolCard';

export function PoolGrid({ pools, poolPostCount, currentUserId, isAdmin, onCardClick, onDelete, onAdminDelete }) {
  return (
    <div className="pools-grid">
      {pools.map(pool => (
        <PoolCard
          key={pool.id}
          pool={pool}
          poolPostCount={poolPostCount}
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
