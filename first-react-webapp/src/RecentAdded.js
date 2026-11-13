import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Config from './Config';

export function mediaUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return Config.apiUrl + '/' + path.replace(/\\/g, '/').replace(/^\//, '');
}
function TrailerPreview({ movie, blur }) {
  const panel = useRef(null);
  const video = useRef(null);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(document.visibilityState !== 'hidden');
  const [manual, setManual] = useState(false);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [restricted, setRestricted] = useState(() => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || navigator.connection?.saveData));
  useEffect(() => {
    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const update = () => setRestricted(Boolean(motion?.matches || navigator.connection?.saveData));
    const visibility = () => setPageVisible(document.visibilityState !== 'hidden');
    motion?.addEventListener?.('change', update);
    navigator.connection?.addEventListener?.('change', update);
    document.addEventListener('visibilitychange', visibility);
    const observer = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(entries => {
      setVisible(entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.35));
    }, { threshold: [0, 0.35] }) : null;
    if (observer && panel.current) observer.observe(panel.current);
    return () => {
      observer?.disconnect();
      motion?.removeEventListener?.('change', update);
      navigator.connection?.removeEventListener?.('change', update);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  const trailer = movie.trailer && !movie.trailer.replace(/\\\\/g, '/').includes('SSNI-289_1723546895296.mp4') ? movie.trailer : '';
  const mayPlay = !blur && !failed && trailer && pageVisible && !paused && (visible || (manual && typeof IntersectionObserver === 'undefined')) && (manual || !restricted);
  useEffect(() => {
    const element = video.current;
    if (!element) return undefined;
    if (mayPlay) {
      const promise = element.play();
      promise?.catch(() => setBlocked(true));
    } else element.pause();
    return () => element.pause();
  }, [mayPlay]);
  const date = movie.releaseDate && new Date(movie.releaseDate);
  return <div className="service-preview" ref={panel}>
    <div className="service-preview-art">
      <img src={mediaUrl(movie.image)} alt="" className={blur ? 'service-blurred' : ''} />
      {!blur && !failed && trailer && mayPlay && <video ref={video} src={mediaUrl(trailer)} poster={mediaUrl(movie.image)} muted playsInline loop preload="none" onError={() => setFailed(true)} aria-label={movie.title + ' 예고편'} />}
      {!blur && !failed && trailer && <button className="service-preview-control" onClick={() => {
        if (mayPlay && !blocked) setPaused(true);
        else { setPaused(false); setManual(true); setBlocked(false); video.current?.play()?.catch(() => setBlocked(true)); }
      }}>{mayPlay && !blocked ? '미리보기 일시정지' : '예고편 재생'}</button>}
    </div>
    <div className="service-preview-info">
      <p className="service-eyebrow">RECENTLY ADDED</p><h3>{movie.title}</h3>
      <p className="service-preview-meta">{[movie.category, date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('ko-KR') : '', movie.actor].filter(Boolean).join(' · ')}</p>
      {movie.description && <p className="service-preview-description">{movie.description}</p>}
      {blur ? <p>블러 보호가 켜져 있어 예고편을 재생하지 않아요.</p> : (!trailer || failed) ? <p>예고편 대신 포스터를 표시해요.</p> : restricted && !manual ? <p>데이터 절약 또는 모션 줄이기 설정에 따라 자동 재생을 껐어요.</p> : null}
      <Link to={'/movies/' + movie._id}>상세 정보 · 영상 보기</Link>
    </div>
  </div>;
}
export default function RecentAdded({ items, blur, category }) {
  const movies = (items || []).filter(movie => movie && (category ? movie.category === category : movie.category !== 'AdultVideo'));
  const [selectedId, setSelectedId] = useState(null);
  const row = useRef(null);
  const selected = movies.find(movie => movie._id === selectedId) || movies[0];
  const selectLeading = () => {
    if (!row.current) return;
    const left = row.current.getBoundingClientRect().left;
    const cards = Array.from(row.current.children);
    const leading = cards.find(card => card.getBoundingClientRect().right > left + 24);
    if (leading) setSelectedId(leading.dataset.movieId);
  };
  return <section className="service-shelf service-recent" aria-label="최근 추가된 영상">
    <h2>최근 추가된 영상</h2>
    {!selected ? <p className="service-empty">아직 표시할 영상이 없어요.</p> : <>
      <TrailerPreview key={selected._id + ':' + Boolean(blur)} movie={selected} blur={blur} />
      <div className="service-row" ref={row} onScroll={selectLeading}>
        {movies.map(movie => <article className="service-card" key={movie._id} data-movie-id={movie._id}>
          <button className="service-select-card" aria-pressed={selected._id === movie._id} onMouseEnter={() => setSelectedId(movie._id)} onFocus={() => setSelectedId(movie._id)} onClick={() => setSelectedId(movie._id)}>
            <div className="service-art"><img loading="lazy" src={mediaUrl(movie.image)} alt="" className={blur ? 'service-blurred' : ''} /></div>
            <span>{movie.title}</span>
          </button>
        </article>)}
      </div>
    </>}
  </section>;
}