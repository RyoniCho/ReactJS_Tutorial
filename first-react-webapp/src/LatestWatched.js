
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Config from './Config';
import { Link } from 'react-router-dom';
import './Styles/AMovieList.css';
import Sidebar from './Sidebar';

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
const LatestWatched = ({ isNSFWContentBlured, isSidebarOpen, setIsSidebarOpen, isAuthenticated }) => {
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [actors, setActors] = useState([]);
  const [selectedActor, setSelectedActor] = useState(localStorage.getItem("selectedActor") || '');
  const [sortOrder, setSortOrder] = useState(localStorage.getItem("historySortOrder") || 'watchedDesc');
  const [owned, setOwned] = useState(localStorage.getItem("owned") || 'all');
  const [selectedCategory, setSelectedCategory]= useState(localStorage.getItem("selectedCategory") || '');
  const [subscriptExist, setSubscriptExist] = useState(localStorage.getItem("subscriptExist") || 'all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchHistories = () => {
    const accessToken = localStorage.getItem('accessToken');
    axios.get(`${Config.apiUrl}/api/users/me/watch-histories`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => setHistories(res.data))
      .catch(() => setHistories([]))
      .finally(() => setLoading(false));
  };

  const fetchActors = async () => {
    try {
        const response = await fetch(`${Config.apiUrl}/api/actors`);
        const data = await response.json();
        setActors(data);
    } catch (error) {
        console.error('Error fetching actors:', error);
    }
  };

  useEffect(() => {
    fetchHistories();
    fetchActors();
  }, []);

  // Handlers to update state and localStorage
  const handleSetSortOrder = (value) => {
      localStorage.setItem("historySortOrder", value);
      setSortOrder(value);
  };

  const handleSetSelectedActor = (value) => {
      localStorage.setItem("selectedActor", value);
      setSelectedActor(value);
  };

  const handleSetOwned = (value) => {
      localStorage.setItem("owned", value);
      setOwned(value);
  };

  const handleSetSelectedCategory = (value) => {
      localStorage.setItem("selectedCategory", value);
      setSelectedCategory(value);
  };

  const handleSetSubscriptExist = (value) => {
      localStorage.setItem("subscriptExist", value);
      setSubscriptExist(value);
  };

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

  // Filtering Logic
  const filteredHistories = histories
    .filter(h => {
        if (!h.movieId) return false;
        const movie = h.movieId;
        
        // Search Term
        if (searchTerm && !movie.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }

        // Actor
        if (selectedActor && movie.actor !== selectedActor) return false;

        // Category
        if (selectedCategory) {
            if (selectedCategory === "all") {
                if (movie.category === "AdultVideo" && !isAuthenticated) return false;
            } else if (movie.category !== selectedCategory) {
                return false;
            }
        } else {
            if (movie.category === "AdultVideo" && !isAuthenticated) return false;
        }

        // Subscription
        if (subscriptExist !== 'all') {
            if (subscriptExist === 'true' && !movie.subscriptExist) return false;
            if (subscriptExist === 'false' && movie.subscriptExist) return false;
        }

        // Owned
        if (owned !== 'all') {
            if (owned === 'plex' && !movie.plexRegistered) return false;
            if (owned === 'web') {
                const hasWeb = movie.mainMovie && typeof movie.mainMovie === 'object' && Object.values(movie.mainMovie).some(v => v);
                if (!hasWeb) return false;
            }
            if (owned === 'web4k') {
                const has4K = movie.mainMovie && typeof movie.mainMovie === 'object' && (movie.mainMovie['4k'] || movie.mainMovie['2160p']);
                if (!has4K) return false;
            }
            if (owned === 'web1080p') {
                const hasFullHD = movie.mainMovie && typeof movie.mainMovie === 'object' && movie.mainMovie['1080p'];
                if (!hasFullHD) return false;
            }
            if (owned === 'false') {
                const isMainMovieEmpty = !movie.mainMovie || typeof movie.mainMovie !== 'object' || Object.keys(movie.mainMovie).length === 0 || Object.values(movie.mainMovie).every(v => !v);
                if (movie.plexRegistered || !isMainMovieEmpty) return false;
            }
        }

        return true;
    })
    .sort((a, b) => {
        // Sort logic
        // Note: 'createdAsc'/'createdDesc' in Sidebar usually refer to movie creation, 
        // but for history, maybe we want to sort by watched time?
        // Let's stick to the Sidebar options but apply them to the movie or history appropriately.
        // If the user selects "Release Date", we sort by movie release date.
        
        const dateA = new Date(a.movieId?.releaseDate || 0);
        const dateB = new Date(b.movieId?.releaseDate || 0);
        
        if (sortOrder === 'asc') return dateA - dateB;
        if (sortOrder === 'desc') return dateB - dateA;
        
        const watchedA = new Date(a.updatedAt || 0);
        const watchedB = new Date(b.updatedAt || 0);

        if (sortOrder === 'watchedAsc') return watchedA - watchedB;
        if (sortOrder === 'watchedDesc') return watchedB - watchedA;

        return 0;
    });


  if (loading) return <div>Loading...</div>;
  // if (!histories.length) return <div>최근 시청 기록이 없습니다.</div>; // Don't return early, show empty list with sidebar

  const historySortOptions = [
      { value: "watchedDesc", label: "최근 시청 순" },
      { value: "watchedAsc", label: "오래된 시청 순" },
      { value: "desc", label: "최신 개봉일 순" },
      { value: "asc", label: "오래된 개봉일 순" },
  ];

  return (
    <div>
      <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            isAuthenticated={isAuthenticated}
            actors={actors}
            selectedActor={selectedActor}
            setSelectedActor={handleSetSelectedActor}
            sortOrder={sortOrder}
            setSortOrder={handleSetSortOrder}
            sortOptions={historySortOptions}
            owned={owned}
            setOwned={handleSetOwned}
            selectedCategory={selectedCategory}
            setSelectedCategory={handleSetSelectedCategory}
            subscriptExist = {subscriptExist}
            setSubscriptExist={handleSetSubscriptExist}
            searchTerm={searchTerm}
            onSearchChange={(e) => setSearchTerm(e.target.value)}
            totalCount={filteredHistories.length}
      />
      <div className="movie-list">
        <div className="movies">
            {filteredHistories.length === 0 && !loading && (
                <div style={{width: '100%', textAlign: 'center', padding: '50px', color: 'var(--text-secondary)'}}>
                    {histories.length === 0 ? "최근 시청 기록이 없습니다." : "검색 결과가 없습니다."}
                </div>
            )}
            {filteredHistories.map(h => (
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
    </div>
  );
};

export default LatestWatched;
