import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RecentAdded from './RecentAdded';
const a = { _id: 'a', title: 'Alpha', category: 'Animation', image: 'a.jpg', trailer: 'a.mp4', description: 'First description' };
const b = { _id: 'b', title: 'Bravo', category: 'Animation', image: 'b.jpg', description: 'Second description' };
let intersection;
let reduced;
beforeEach(() => {
  reduced = false;
  window.matchMedia = jest.fn(() => ({ matches: reduced, addEventListener: jest.fn(), removeEventListener: jest.fn() }));
  global.IntersectionObserver = jest.fn(callback => { intersection = callback; return { observe: jest.fn(), disconnect: jest.fn() }; });
  jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());
const show = (props = {}) => render(<MemoryRouter><RecentAdded items={[a, b]} category="" {...props} /></MemoryRouter>);
test('plays muted preview only in viewport and removes it offscreen', () => {
  const { container } = show();
  expect(container.querySelector('video')).toBeNull();
  act(() => intersection([{ isIntersecting: true, intersectionRatio: 1 }]));
  const video = container.querySelector('video');
  expect(video.muted).toBe(true);
  expect(video.hasAttribute('playsinline')).toBe(true);
  expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
  act(() => intersection([{ isIntersecting: false, intersectionRatio: 0 }]));
  expect(container.querySelector('video')).toBeNull();
  expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
});
test('focus and hover select info and missing trailer fallback', () => {
  show();
  fireEvent.focus(screen.getByRole('button', { name: 'Bravo' }));
  expect(screen.getByText('Second description')).toBeTruthy();
  expect(screen.getByText('예고편 대신 포스터를 표시해요.')).toBeTruthy();
  fireEvent.mouseEnter(screen.getByRole('button', { name: 'Alpha' }));
  expect(screen.getByText('First description')).toBeTruthy();
});
test('leading visible card on scroll selects preview', () => {
  const { container } = show();
  const row = container.querySelector('.service-row');
  row.getBoundingClientRect = () => ({ left: 0 });
  row.children[0].getBoundingClientRect = () => ({ right: -10 });
  row.children[1].getBoundingClientRect = () => ({ right: 200 });
  fireEvent.scroll(row);
  expect(screen.getByText('Second description')).toBeTruthy();
});
test('blur never mounts video or play action', () => {
  const { container } = show({ blur: true });
  act(() => intersection([{ isIntersecting: true, intersectionRatio: 1 }]));
  expect(container.querySelector('video')).toBeNull();
  expect(screen.queryByText('예고편 재생')).toBeNull();
});
test('reduced motion requires manual play and failed video returns to poster', () => {
  reduced = true;
  const { container } = show();
  act(() => intersection([{ isIntersecting: true, intersectionRatio: 1 }]));
  expect(container.querySelector('video')).toBeNull();
  fireEvent.click(screen.getByText('예고편 재생'));
  expect(container.querySelector('video')).toBeTruthy();
  fireEvent.error(container.querySelector('video'));
  expect(container.querySelector('video')).toBeNull();
  expect(screen.getByText('예고편 대신 포스터를 표시해요.')).toBeTruthy();
});
test('known historical placeholder is not a trailer', () => {
  const { container } = show({ items: [{ ...a, trailer: 'uploads/SSNI-289_1723546895296.mp4' }] });
  act(() => intersection([{ isIntersecting: true, intersectionRatio: 1 }]));
  expect(container.querySelector('video')).toBeNull();
  expect(screen.getByText('예고편 대신 포스터를 표시해요.')).toBeTruthy();
});
test('hidden page pauses and removes preview, visible page restores it', () => {
  let visibility = 'visible';
  const spy = jest.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility);
  const { container } = show();
  act(() => intersection([{ isIntersecting: true, intersectionRatio: 1 }]));
  expect(container.querySelector('video')).toBeTruthy();
  act(() => { visibility = 'hidden'; document.dispatchEvent(new Event('visibilitychange')); });
  expect(container.querySelector('video')).toBeNull();
  expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  act(() => { visibility = 'visible'; document.dispatchEvent(new Event('visibilitychange')); });
  expect(container.querySelector('video')).toBeTruthy();
  expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2);
  spy.mockRestore();
});
test('autoplay rejection offers manual retry and handles the rejected promise', async () => {
  HTMLMediaElement.prototype.play.mockRejectedValueOnce(new Error('autoplay denied')).mockResolvedValue();
  show();
  await act(async () => { intersection([{ isIntersecting: true, intersectionRatio: 1 }]); });
  const retry = await screen.findByText('예고편 재생');
  await act(async () => { fireEvent.click(retry); });
  expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2);
  expect(screen.getByText('미리보기 일시정지')).toBeTruthy();
});