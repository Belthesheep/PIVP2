import { PoolGrid } from '../components/Pools/PoolGrid';
import { CreatePoolForm } from '../components/Pools/CreatePoolForm';
import { Pagination } from '../components/Common/Pagination';

export function PoolsView({
  pools,
  currentPage,
  poolsPerPage,
  onCreatePool,
  onCardClick,
  onPageChange,
  poolPostCount,
}) {
  const paginatedPools = pools.slice(currentPage * poolsPerPage, (currentPage + 1) * poolsPerPage);
  const totalPages = Math.ceil(pools.length / poolsPerPage);

  return (
    <div className="pools-view">
      <div className="pools-header">
        <h2>Pools</h2>
        <CreatePoolForm onCreate={onCreatePool} />
      </div>

      <PoolGrid
        pools={paginatedPools}
        poolPostCount={poolPostCount}
        onCardClick={onCardClick}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
