
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Config from './Config';
import { Link } from 'react-router-dom';
import './Styles/AMovieList.css';
import Sidebar from './Sidebar';

const Favorites = ({ isNSFWContentBlured, isSidebarOpen, setIsSidebarOpen, isAuthenticated }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [actors, setActors] = useState([]);
  const [selectedActor, setSelectedActor] = useState(localStorage.getItem("favSelectedActor") || '');
  const [sortOrder, setSortOrder] = useState(localStorage.getItem("favSortOrder") || 'addedDesc');
  const [owned, setOwned] = useState(localStorage.getItem("favOwned") || 'all');
  const [selectedCategory, setSelectedCategory]= useState(localStorage.getItem("favSelectedCategory") || '');
  const [subscriptExist, setSubscriptExist] = useState(localStorage.getItem("favSubscriptExist") || 'all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchFavorites = () => {
    const accessToken = localStorage.getItem('accessToken');
    axios.get(`${Config.apiUrl}/api/favorites`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => setFavorites(res.data))
      .catch(() => setFavorites([]))
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
    fetchFavorites();
    fetchActors();
  }, []);

  // Handlers to update state and localStorage
  const handleSetSortOrder = (value) => {
      localStorage.setItem("favSortOrder", value);
      setSortOrder(value);
  };

  const handleSetSelectedActor = (value) => {
      localStorage.setItem("favSelectedActor", value);
      setSelectedActor(value);
  };

  const handleSetOwned = (value) => {
      localStorage.setItem("favOwned", value);
      setOwned(value);
  };

  const handleSetSelectedCategory = (value) => {
      localStorage.setItem("favSelectedCategory", value);
      setSelectedCategory(value);
  };

  const handleSetSubscriptExist = (value) => {
      localStorage.setItem("favSubscriptExist", value);
      setSubscriptExist(value);
  };

  const handleRemoveFavorite = async (movieId) => {
    if (!window.confirm('즐겨찾기에서 제거하시겠습니까?')) return;
    const accessToken = localStorage.getItem('accessToken');
    try {
      // Toggle API를 사용하여 제거 (이미 존재하므로 제거됨)
      await axios.post(`${Config.apiUrl}/api/favorites`, { movieId }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setFavorites(favorites.filter(f => f.movieId._id !== movieId));
    } catch (err) {
      alert('제거 실패');
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    const normalizedPath = imagePath.replace(/\\/g, '/');
    return `${Config.apiUrl}${normalizedPath.startsWith('/') ? '' : '/'}${normalizedPath}`;
  }

  // Filtering Logic
  const filteredFavorites = favorites
    .filter(f => {
        if (!f.movieId) return false;
        const movie = f.movieId;
        
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
        const dateA = new Date(a.movieId?.releaseDate || 0);
        const dateB = new Date(b.movieId?.releaseDate || 0);
        
        if (sortOrder === 'asc') return dateA - dateB;
        if (sortOrder === 'desc') return dateB - dateA;
        
        const addedA = new Date(a.createdAt || 0);
        const addedB = new Date(b.createdAt || 0);

        if (sortOrder === 'addedAsc') return addedA - addedB;
        if (sortOrder === 'addedDesc') return addedB - addedA;

        return 0;
    });


  if (loading) return <div>Loading...</div>;

  const sortOptions = [
      { value: "addedDesc", label: "최근 추가 순" },
      { value: "addedAsc", label: "오래된 추가 순" },
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
            sortOptions={sortOptions}
            owned={owned}
            setOwned={handleSetOwned}
            selectedCategory={selectedCategory}
            setSelectedCategory={handleSetSelectedCategory}
            subscriptExist = {subscriptExist}
            setSubscriptExist={handleSetSubscriptExist}
            searchTerm={searchTerm}
            onSearchChange={(e) => setSearchTerm(e.target.value)}
            totalCount={filteredFavorites.length}
      />
      <div className="movie-list">
        <div className="movies">
            {filteredFavorites.length === 0 && !loading && (
                <div style={{width: '100%', textAlign: 'center', padding: '50px', color: 'var(--text-secondary)'}}>
                    {favorites.length === 0 ? "즐겨찾기한 영화가 없습니다." : "검색 결과가 없습니다."}
                </div>
            )}
            {filteredFavorites.map(f => (
            <div key={f._id} className="movie-card">
                <div 
                    className={`movie-card-blur-bg ${isNSFWContentBlured ? 'blur-strong' : ''}`}
                    style={{ backgroundImage: `url(${getImageUrl(f.movieId?.image)})` }}
                ></div>

                <div className="movie-card-inner">
                    <div className="movie-info-top">
                        <p>{f.movieId?.serialNumber}</p>
                    </div>

                    <Link to={`/movies/${f.movieId?._id}`} className="movie-poster-link">
                        <div 
                            className="movie-poster-clear"
                            style={{ backgroundImage: `url(${getImageUrl(f.movieId?.image)})` }}
                        >
                            {isNSFWContentBlured && <div className="nsfw-poster-cover"></div>}
                        </div>
                    </Link>

                    <div className="movie-info-area">
                        <div className="movie-info-bottom">
                            <Link to={`/movies/${f.movieId?._id}`} className="movie-title-link">
                                <h3>{f.movieId?.title}</h3>
                            </Link>
                            <div className='release-date'>
                                <h4>{new Date(f.createdAt).toLocaleDateString()} 추가됨</h4>
                            </div>
                        </div>
                        <button className="list-delete-button" onClick={() => handleRemoveFavorite(f.movieId._id)}>즐겨찾기 해제</button>
                    </div>
                </div>
            </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Favorites;
