import { useCallback } from 'react';

export function UploadForm({ currentUser, uploadFile, uploadDescription, uploadTags, onFileChange, onDescriptionChange, onTagsChange, onSubmit }) {
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
          accept="image/*"
          onChange={(e) => onFileChange(e.target.files[0])}
          required
        />
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
