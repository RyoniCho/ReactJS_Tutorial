import axios from 'axios';
import { playbackSnapshot, queueHistorySave } from './playbackHistory';
jest.mock('axios', () => ({ __esModule: true, default: { post: jest.fn() } }));

test('snapshots finite duration and final completion', () => {
  expect(playbackSnapshot({ currentTime: 99.8, duration: 100, ended: true }, 'a', 2))
    .toEqual({ movieId: 'a', episodeIndex: 2, lastWatchedTime: 99, duration: 100, ended: true });
  expect(playbackSnapshot({ currentTime: 2.7, duration: Infinity, ended: true }, 'a', 0))
    .toEqual({ movieId: 'a', episodeIndex: 0, lastWatchedTime: 2 });
  expect(playbackSnapshot({ currentTime: 4, duration: NaN }, 'a', 0))
    .toEqual({ movieId: 'a', episodeIndex: 0, lastWatchedTime: 4 });
  expect(playbackSnapshot({ currentTime: NaN, duration: 100 }, 'a', 0)).toBeNull();
});
test('serializes same episode saves and recovers after rejection', async () => {
  let finish;
  axios.post.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }))
    .mockRejectedValueOnce(new Error('offline')).mockResolvedValue({});
  const a = queueHistorySave('t', { movieId: 'm', episodeIndex: 1, lastWatchedTime: 10 });
  const b = queueHistorySave('t', { movieId: 'm', episodeIndex: 1, lastWatchedTime: 20 });
  await Promise.resolve(); await Promise.resolve();
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(axios.post.mock.calls[0][2].timeout).toBe(15000);
  finish({}); await a; await b;
  await queueHistorySave('t', { movieId: 'm', episodeIndex: 1, lastWatchedTime: 30 });
  expect(axios.post.mock.calls.map(c => c[1].lastWatchedTime)).toEqual([10, 20, 30]);
});
