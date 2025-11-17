
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
            <Link to={`/movies/${h.movieId?._id}`} className="movie-link">
              <div className="movie-info">
                <p>{h.movieId?.serialNumber}</p>
              </div>
              <div className={isNSFWContentBlured ? 'blur' : ''}>
                <img src={`${Config.apiUrl}/${h.movieId?.image}`} alt={h.movieId?.title} className="movie-thumbnail" />
              </div>
              <div className="movie-info">
                <h3>{h.movieId?.title}</h3>
                <p>마지막 시청 위치: {formatSeconds(h.lastWatchedTime)}</p>
                <p>업데이트: {new Date(h.updatedAt).toLocaleString()}</p>
              </div>
            </Link>
            <button className="list-delete-button" onClick={() => handleDelete(h._id)} style={{marginTop:'8px'}}>기록 삭제</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LatestWatched;
