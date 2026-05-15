import { useCallback, useState } from 'react';

export function UploadForm({ currentUser, uploadFile, uploadDescription, uploadTags, onFileChange, onDescriptionChange, onTagsChange, onSubmit }) {
  const [preview, setPreview] = useState(null);
  const [fileType, setFileType] = useState(null);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    onFileChange(file);
    
    if (file) {
      const isVideo = file.type.startsWith('video/');
      setFileType(isVideo ? 'video' : 'image');
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
      setFileType(null);
    }
  }, [onFileChange]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    onSubmit();
  }, [onSubmit]);

  return (
    <div className="upload-form">
      <h2>Upload New Post</h2>
      {!currentUser && <p className="warning">⚠️ Please login first!</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          required
        />
        {preview && (
          <div style={{ marginTop: '1rem', maxWidth: '300px' }}>
            {fileType === 'video' ? (
              <video
                src={preview}
                controls
                style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
              />
            ) : (
              <img
                src={preview}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
              />
            )}
            <small style={{ display: 'block', marginTop: '0.5rem', color: '#666' }}>
              {fileType === 'video' ? '📹 Video selected' : '🖼️ Image selected'}
            </small>
          </div>
        )}
        <input
          type="text"
          placeholder="Description (optional)"
          value={uploadDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />
        <input
          type="text"
          placeholder="Tags (comma-separated)"
          value={uploadTags}
          onChange={(e) => onTagsChange(e.target.value)}
          required
        />
        <button type="submit" disabled={!currentUser}>Upload</button>
      </form>
    </div>
  );
}
