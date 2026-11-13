import axios from 'axios';
import Config from './Config';

const pending = new Map();

// Separate records may save concurrently, but an older write must never finish last.
export function queueHistorySave(token, data) {
  const key = `${token}:${data.movieId}:${data.episodeIndex}`;
  const previous = pending.get(key) || Promise.resolve();
  const next = previous.catch(() => {}).then(() => axios.post(
    `${Config.apiUrl}/api/watch-history`, data,
    { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
  )).catch(() => {});
  pending.set(key, next);
  next.then(() => { if (pending.get(key) === next) pending.delete(key); });
  return next;
}

export function playbackSnapshot(video, movieId, episodeIndex) {
  if (!Number.isFinite(video.currentTime) || video.currentTime < 0) return null;
  const hasDuration = Number.isFinite(video.duration) && video.duration > 0;
  const snapshot = {
    movieId, episodeIndex,
    lastWatchedTime: Math.floor(hasDuration ? Math.min(video.currentTime, video.duration) : video.currentTime)
  };
  // EVENT/live playlists can report Infinity until encoding finishes. Preserve resume
  // positions, but never infer completion until a finite duration is available.
  if (hasDuration) {
    snapshot.duration = video.duration;
    snapshot.ended = Boolean(video.ended);
  }
  return snapshot;
}
