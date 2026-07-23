export function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      {Array.from({ length: totalPages }).map((_, i) => (
        <button
          key={i}
          className={`page-btn ${currentPage === i ? 'active' : ''}`}
          onClick={() => {
            onPageChange(i);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
}
