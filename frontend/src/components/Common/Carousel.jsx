import { useCallback } from 'react';

export function Carousel({ items, currentIndex, isOpen, onPrev, onNext, onClose }) {
  const getItemFilename = useCallback((item) => {
    return item.image_filename || item.filename;
  }, []);

  if (!isOpen || items.length === 0) return null;

  const currentItem = items[currentIndex];

  return (
    <div className="carousel" style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button className="carousel-btn" onClick={onPrev} style={{ background: '#fff', color: '#000' }}>◀</button>
      <div className="carousel-content" style={{ maxWidth: '80%', textAlign: 'center' }}>
        {currentItem && (
          <>
            <img
              src={`http://localhost:8000/uploads/${getItemFilename(currentItem)}`}
              alt="carousel"
              style={{ maxHeight: '70vh', objectFit: 'contain' }}
            />
            <div className="carousel-info" style={{ marginTop: 8 }}>
              <p>{currentItem.description}</p>
              <small>by {currentItem.uploader_username}</small>
            </div>
          </>
        )}
      </div>
      <button className="carousel-btn" onClick={onNext} style={{ background: '#fff', color: '#000' }}>▶</button>
      <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, padding: 8 }}>Close</button>
    </div>
  );
}
