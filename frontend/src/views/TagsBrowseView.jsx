import { useEffect, useState } from 'react';
import { listTagsWithThumbnails } from '../api';
import { getMediaUrl, isVideo } from '../utils/mediaUtils';

export function TagsBrowseView({ onTagSelect }) {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTags = async () => {
      try {
        const tagsData = await listTagsWithThumbnails();
        setTags(tagsData);
      } catch (err) {
        console.error('Error loading tags:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTags();
  }, []);

  const handleTagClick = (tagName) => {
    if (onTagSelect) {
      onTagSelect(tagName);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</div>;
  }

  if (tags.length === 0) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>No se encontraron etiquetas</div>;
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Explorar Etiquetas</h1>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '1rem'
      }}>
        {tags.map(tag => (
          <div
            key={tag.id}
            className="tag-card"
            onClick={() => handleTagClick(tag.tag_name)}
          >
            {tag.thumbnail_image ? (
              <div className="tag-thumbnail-container">
                {isVideo(tag.thumbnail_image) ? (
                  <div className="tag-thumbnail-video">
                    🎬
                  </div>
                ) : (
                  <img
                    src={getMediaUrl(tag.thumbnail_image)}
                    alt={tag.tag_name}
                    className="tag-thumbnail-image"
                  />
                )}
              </div>
            ) : (
              <div className="tag-thumbnail-placeholder">
                🏷️
              </div>
            )}
            <div className="tag-info">
              <h3>{tag.tag_name}</h3>
              <small>
                {tag.post_count} {tag.post_count === 1 ? 'post' : 'posts'}
              </small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
