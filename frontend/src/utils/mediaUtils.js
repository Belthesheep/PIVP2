/**
 * Utility functions for media (image/video) handling
 */

export function isVideo(filename) {
  if (!filename) return false;
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi'];
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return videoExtensions.includes(ext);
}

export function getMediaUrl(filename) {
  return `http://localhost:8000/uploads/${filename}`;
}
