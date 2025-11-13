import { PoolCard } from './PoolCard';

export function PoolGrid({ pools, poolPostCount, onCardClick }) {
  return (
    <div className="pools-grid">
      {pools.map(pool => (
        <PoolCard
          key={pool.id}
          pool={pool}
          poolPostCount={poolPostCount}
          onCardClick={onCardClick}
        />
      ))}
    </div>
  );
}
