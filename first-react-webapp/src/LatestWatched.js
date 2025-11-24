
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Config from './Config';
import { Link } from 'react-router-dom';
import './Styles/AMovieList.css';

// 초를 시:분:초로 변환
function formatSeconds(sec) {
  if (typeof sec !== 'number' || isNaN(sec)) return '-';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [
    h > 0 ? String(h).padStart(2, '0') : null,
    String(m).padStart(2, '0'),
    String(s).padStart(2, '0')
  ].filter(Boolean).join(':');
}
const LatestWatched = ({ isNSFWContentBlured }) => {
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);


  const fetchHistories = () => {
    const accessToken = localStorage.getItem('accessToken');
    axios.get(`${Config.apiUrl}/api/users/me/watch-histories`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => setHistories(res.data))
      .catch(() => setHistories([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistories();
  }, []);

  const handleDelete = async (historyId) => {
    if (!window.confirm('정말 이 시청 기록을 삭제하시겠습니까?')) return;
    const accessToken = localStorage.getItem('accessToken');
    try {
      await axios.delete(`${Config.apiUrl}/api/users/me/watch-histories/${historyId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setHistories(histories.filter(h => h._id !== historyId));
    } catch (err) {
      alert('삭제 실패');
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    const normalizedPath = imagePath.replace(/\\/g, '/');
    return `${Config.apiUrl}${normalizedPath.startsWith('/') ? '' : '/'}${normalizedPath}`;
  }

  if (loading) return <div>Loading...</div>;
  if (!histories.length) return <div>최근 시청 기록이 없습니다.</div>;

  return (
    <div className="movie-list">
      <div className="movie-list-header">
        <span className="total-count-label">
          <svg className="total-count-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="10" fill="#1976d2"/>
            <text x="10" y="15" textAnchor="middle" fontSize="12" fill="#fff" fontWeight="bold">#</text>
          </svg>
          <b>최근 시청</b> <span className="total-count-number">{histories.length}</span> Results
        </span>
      </div>
      <div className="movies">
        {histories.map(h => (
          <div key={h._id} className="movie-card">
            {/* 1. 배경: 전체 블러 이미지 */}
            <div 
                className={`movie-card-blur-bg ${isNSFWContentBlured ? 'blur-strong' : ''}`}
                style={{ backgroundImage: `url(${getImageUrl(h.movieId?.image)})` }}
            ></div>

            {/* 2. 컨텐츠 래퍼: 포스터와 정보를 수직으로 배치 */}
            <div className="movie-card-inner">
                {/* 시리얼 넘버: 카드 맨 위로 이동 */}
                <div className="movie-info-top">
                    <p>{h.movieId?.serialNumber}</p>
                </div>

                {/* 상단: 선명한 포스터 이미지 (링크 포함) */}
                <Link to={`/movies/${h.movieId?._id}`} className="movie-poster-link">
                    <div 
                        className="movie-poster-clear"
                        style={{ backgroundImage: `url(${getImageUrl(h.movieId?.image)})` }}
                    >
                        {/* NSFW 필터가 켜져있을 때 포스터 자체도 가려야 한다면 여기에 추가 블러 처리 가능 */}
                        {isNSFWContentBlured && <div className="nsfw-poster-cover"></div>}
                    </div>
                </Link>

                {/* 하단: 정보 영역 */}
                <div className="movie-info-area">
                    <div className="movie-info-bottom">
                        <Link to={`/movies/${h.movieId?._id}`} className="movie-title-link">
                            <h3>{h.movieId?.title}</h3>
                        </Link>
                        <h4>마지막 시청: {formatSeconds(h.lastWatchedTime)}</h4>
                        <div className='release-date'>
                             <h4>{new Date(h.updatedAt).toLocaleString()} 시청함</h4>
                        </div>
                    </div>
                    <button className="list-delete-button" onClick={() => handleDelete(h._id)}>기록 삭제</button>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LatestWatched;
