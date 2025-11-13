export function PoolCard({ pool, poolPostCount, onCardClick }) {
  return (
    <div key={pool.id} className="pool-card" onClick={() => onCardClick(pool.id)}>
      <h3>{pool.name}</h3>
      <p>{pool.description}</p>
      <div className="pool-meta">
        <small>by {pool.creator_username || pool.creator_id}</small>
        <small>{poolPostCount(pool)} posts</small>
      </div>
    </div>
  );
}
