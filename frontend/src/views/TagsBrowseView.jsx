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
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading tags...</div>;
  }

  if (tags.length === 0) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>No tags available yet</div>;
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Browse Tags</h1>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '1rem'
      }}>
        {tags.map(tag => (
          <div
            key={tag.id}
            onClick={() => handleTagClick(tag.tag_name)}
            style={{
              cursor: 'pointer',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#f5f5f5',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              ':hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
          >
            {tag.thumbnail_image ? (
              <div style={{ position: 'relative', paddingBottom: '100%', overflow: 'hidden' }}>
                {isVideo(tag.thumbnail_image) ? (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#222',
                    fontSize: '2rem'
                  }}>
                    🎬
                  </div>
                ) : (
                  <img
                    src={getMediaUrl(tag.thumbnail_image)}
                    alt={tag.tag_name}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                )}
              </div>
            ) : (
              <div style={{
                paddingBottom: '100%',
                backgroundColor: '#ddd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '150px',
                fontSize: '2rem',
                color: '#999'
              }}>
                🏷️
              </div>
            )}
            <div style={{ padding: '0.75rem' }}>
              <h3 style={{
                margin: '0 0 0.5rem 0',
                fontSize: '0.9rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {tag.tag_name}
              </h3>
              <small style={{ color: '#666' }}>
                {tag.post_count} {tag.post_count === 1 ? 'post' : 'posts'}
              </small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
