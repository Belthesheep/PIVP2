import { PostGrid } from '../components/Posts/PostGrid';
import { Pagination } from '../components/Common/Pagination';

export function PostsView({
  posts,
  currentUserId,
  currentPage,
  postsPerPage,
  onPostClick,
  onDelete,
  onPageChange,
  isAdmin,
  onAdminDelete,
  mostRelevant = true,
  onToggleMostRelevant,
}) {
  const paginatedPosts = posts.slice(currentPage * postsPerPage, (currentPage + 1) * postsPerPage);
  const totalPages = Math.ceil(posts.length / postsPerPage);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Publicaciones</h2>
        {onToggleMostRelevant && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => onToggleMostRelevant(true)}
              style={{
                background: mostRelevant ? '#ac6ec5' : '#ccc',
                color: mostRelevant ? 'white' : 'black',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Más Relevantes
            </button>
            <button 
              onClick={() => onToggleMostRelevant(false)}
              style={{
                background: !mostRelevant ? '#ac6ec5' : '#ccc',
                color: !mostRelevant ? 'white' : 'black',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Todas las Publicaciones
            </button>
          </div>
        )}
      </div>
      <PostGrid
        posts={paginatedPosts}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        onCardClick={onPostClick}
        onDelete={onDelete}
        onAdminDelete={onAdminDelete}
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
