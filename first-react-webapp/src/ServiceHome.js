import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Config from './Config';
import RecentAdded from './RecentAdded';
import './Styles/ServiceHome.css';

const categories = [['', '전체 (성인 제외)'], ['Animation', 'Animation'], ['TV Show', 'TV Show'], ['Magic', 'Magic'], ['AdultVideo', 'Adult']];
export function historyLink(history, restart = false) {
  const query = new URLSearchParams();
  if (Number.isInteger(history.episodeIndex) && history.episodeIndex >= 0) query.set('episode', history.episodeIndex);
  if (restart) query.set('restart', '1');
  return `/movies/${history.movieId._id}${query.toString() ? '?' + query : ''}`;
}
function imageUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return Config.apiUrl + '/' + path.replace(/\\/g, '/').replace(/^\//, '');
}
function Shelf({ title, items, history = false, restart = false, blur, category }) {
  const safeItems = (items || []).filter(item => {
    const movie = history ? item.movieId : item;
    return movie && (category ? movie.category === category : movie.category !== 'AdultVideo');
  });
  return <section className="service-shelf" aria-label={title}>
    <h2>{title}</h2>
    {safeItems.length === 0 ? <p className="service-empty">아직 표시할 영상이 없어요.</p> :
      <div className="service-row">{safeItems.map(item => {
        const movie = history ? item.movieId : item;
        const progress = history && item.duration > 0 ? Math.min(100, Math.max(0, item.lastWatchedTime / item.duration * 100)) : null;
        return <article className="service-card" key={item._id || movie._id}>
          <Link to={history ? historyLink(item, restart) : `/movies/${movie._id}`}>
            <div className="service-art"><img loading="lazy" src={imageUrl(movie.image)} alt="" className={blur ? 'service-blurred' : ''} /></div>
            <h3>{movie.title}</h3>
            {history && item.episodeIndex >= 0 && <span>{item.episodeIndex + 1}화{movie.episodes?.[item.episodeIndex]?.title ? ' · ' + movie.episodes[item.episodeIndex].title : ''}</span>}
            {history && <span className="service-caption">{restart ? '처음부터 다시 보기' : item.completedAt ? '시청 완료' : `${Math.floor((item.lastWatchedTime || 0) / 60)}분 시청`}</span>}
            {progress !== null && <progress aria-label="시청 진행률" max="100" value={progress} />}
          </Link>
        </article>;
      })}</div>}
  </section>;
}
export default function ServiceHome({ isAuthenticated, isNSFWContentBlured }) {
  const [category, setCategory] = useState('');
  const [request, setRequest] = useState(null);
  const [retry, setRetry] = useState(0);
  const token = isAuthenticated ? localStorage.getItem('accessToken') : null;
  const key = token ? token + ':' + category : '';
  useEffect(() => {
    setRequest(null);
    if (!token) return undefined;
    const controller = new AbortController();
    let active = true;
    axios.get(`${Config.apiUrl}/api/users/me/service-home`, {
      params: { category }, headers: { Authorization: `Bearer ${token}` }, signal: controller.signal
    }).then(res => {
      if (active) setRequest({ key, data: res.data });
    }).catch(error => {
      if (active && !controller.signal.aborted) setRequest({ key, error: error.response?.status === 401 ? '로그인이 만료되었어요. 다시 로그인해 주세요.' : '홈을 불러오지 못했어요. 서버 업데이트 후 다시 시도해 주세요.' });
    });
    return () => { active = false; controller.abort(); };
  }, [token, category, key, retry]);
  if (!token) return <div className="service-home"><p>시청 기록과 서비스형 홈은 로그인 후 이용할 수 있어요.</p><Link to="/login">로그인</Link></div>;
  const current = request?.key === key ? request : null;
  return <div className="service-home">
    <header className="service-header"><div><p className="service-eyebrow">YOUR LIBRARY</p><h1>오늘은 어떤 이야기를 볼까요?</h1></div>
      <label>카테고리 <select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    </header>
    <nav className="service-links"><Link to={`/list?category=${encodeURIComponent(category)}`}>전체 영상 보기</Link><Link to={`/latest-watched?category=${encodeURIComponent(category)}`}>시청 기록 관리</Link></nav>
    {!current ? <p role="status">영상을 불러오는 중이에요…</p> : current.error ? <div role="alert"><p>{current.error}</p><button onClick={() => setRetry(v => v + 1)}>다시 시도</button></div> :
      <>
        <Shelf title="이어보기" items={current.data.continueWatching} history blur={isNSFWContentBlured} category={category} />
        <RecentAdded items={current.data.recentAdded} blur={isNSFWContentBlured} category={category} />
        <Shelf title="최근에 본 영상" items={current.data.recentWatched} history blur={isNSFWContentBlured} category={category} />
        <Shelf title="다시 보기" items={current.data.rewatch} history restart blur={isNSFWContentBlured} category={category} />
      </>}
  </div>;
}
