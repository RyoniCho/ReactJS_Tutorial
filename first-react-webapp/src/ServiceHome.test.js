import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import ServiceHome, { historyLink } from './ServiceHome';
import Home from './Home';
jest.mock('axios', () => ({ __esModule: true, default: { get: jest.fn() } }));
const movie = { _id: 'm1', title: 'Visible film', category: 'Animation', image: 'cover.jpg' };
const data = { recentAdded: [movie], continueWatching: [], recentWatched: [], rewatch: [] };
const wrap = (component) => <MemoryRouter>{component}</MemoryRouter>;
beforeEach(() => { localStorage.clear(); jest.clearAllMocks(); });
test('series links preserve episode and explicit restart', () => {
  expect(historyLink({ movieId: movie, episodeIndex: 2 }, true)).toBe('/movies/m1?episode=2&restart=1');
  expect(historyLink({ movieId: movie, episodeIndex: -1 })).toBe('/movies/m1');
});
test('legacy home is default and service preference persists', () => {
  render(wrap(<Home isAuthenticated={false} />));
  expect(screen.getByText('ALL Movie')).toBeTruthy();
  fireEvent.click(screen.getByText('서비스 보기'));
  expect(localStorage.getItem('media-home-view')).toBe('service');
  expect(screen.getByText('로그인')).toBeTruthy();
  expect(axios.get).not.toHaveBeenCalled();
});
test('default excludes adult items defensively and logout removes data', async () => {
  localStorage.setItem('accessToken', 'test');
  axios.get.mockResolvedValue({ data: { ...data, recentAdded: [movie, { ...movie, _id: 'adult', title: 'Hidden film', category: 'AdultVideo' }] } });
  const view = render(wrap(<ServiceHome isAuthenticated isNSFWContentBlured />));
  await screen.findAllByText('Visible film');
  expect(screen.queryByText('Hidden film')).toBeNull();
  expect(view.container.querySelector('img').className).toBe('service-blurred');
  view.rerender(wrap(<ServiceHome isAuthenticated={false} />));
  expect(screen.queryByText('Visible film')).toBeNull();
  expect(screen.getByText('로그인')).toBeTruthy();
});
test('category changes clear previous data while request is pending', async () => {
  localStorage.setItem('accessToken', 'test');
  axios.get.mockResolvedValueOnce({ data }).mockImplementationOnce(() => new Promise(() => {}));
  render(wrap(<ServiceHome isAuthenticated />));
  await screen.findAllByText('Visible film');
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'TV Show' } });
  expect(screen.queryByText('Visible film')).toBeNull();
  expect(screen.getByRole('status')).toBeTruthy();
  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
});
test('failed request offers retry', async () => {
  localStorage.setItem('accessToken', 'test');
  axios.get.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ data });
  render(wrap(<ServiceHome isAuthenticated />));
  await screen.findByRole('alert');
  fireEvent.click(screen.getByText('다시 시도'));
  await screen.findAllByText('Visible film');
});