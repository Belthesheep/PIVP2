import { useCallback } from 'react';
import { isVideo, getMediaUrl } from '../../utils/mediaUtils';

export function Carousel({ items, currentIndex, isOpen, onPrev, onNext, onClose }) {
  const getItemFilename = useCallback((item) => {
    return item.image_filename || item.filename;
  }, []);

  if (!isOpen || items.length === 0) return null;

  const currentItem = items[currentIndex];
  const filename = getItemFilename(currentItem);
  const mediaUrl = getMediaUrl(filename);
  const mediaIsVideo = isVideo(filename);

  return (
    <div className="carousel" style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button className="carousel-btn" onClick={onPrev} style={{ background: '#fff', color: '#000' }}>◀</button>
      <div className="carousel-content" style={{ maxWidth: '80%', textAlign: 'center' }}>
        {currentItem && (
          <>
            {mediaIsVideo ? (
              <video
                src={mediaUrl}
                controls
                autoPlay={false}
                style={{ maxHeight: '70vh', objectFit: 'contain', maxWidth: '100%' }}
              />
            ) : (
              <img
                src={mediaUrl}
                alt="carousel"
                style={{ maxHeight: '70vh', objectFit: 'contain' }}
              />
            )}
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
