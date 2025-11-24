import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import './Styles/AMovieList.css';
import Config from './Config'
import axios from 'axios';
import OptionBar from './OptionBar';
import plexIcon  from './Icons/plex.svg'
import webIcon from './Icons/web.svg'
import fourKIcon from './Icons/4k.svg'
import fullhdIcon from './Icons/fullhd.svg'

const AMovieList = ({isAuthenticated,isNSFWContentBlured,handleLogout,loginRole,logoutTrigger}) => {

    const [isLoading,setIsLoading] = useState(false);
    const [movies, setMovies] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [actors, setActors] = useState([]);
    const [selectedActor, setSelectedActor] = useState('');
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc' for ascending, 'desc' for descending
    const [owned, setOwned] = useState('all'); // 'all', 'plex','web', 'false'
    const [selectedCategory, setSelectedCategory]= useState('');
    const [subscriptExist, setSubscriptExist] = useState('all');
    const [currentPage,setCurrentPage] =useState(1);
    const pageSize=10;

    let debounceTimer;
    const [hasMore,setHasMore] = useState(true);
    const [initialFetch,setInitialFetch] = useState(false);
    const navigate = useNavigate(); 



    useEffect(() => {
        const initialFilter = getInitialFilterCachedValue();
        fetchActors();
        fetchMovies('', initialFilter, 1, pageSize);
        setInitialFetch(true);
    }, []);

    // 로그아웃 트리거가 바뀌면 목록 초기화 및 재조회
    useEffect(() => {
        if (initialFetch) {
            setMovies([]);
            setCurrentPage(1);
            const initialFilter = getInitialFilterCachedValue();
            fetchMovies('', initialFilter, 1, pageSize);
        }
        // eslint-disable-next-line
    }, [logoutTrigger]);

    useEffect(() => {
        const handleScroll = () => {
            if(debounceTimer) clearTimeout(debounceTimer);

            debounceTimer = setTimeout(()=>{

                if (window.innerHeight + document.documentElement.scrollTop+1>= document.documentElement.offsetHeight&&!isLoading) {
                    if(hasMore)
                        setCurrentPage(prevPage => prevPage + 1);
                }

            },200)
          
        };
    
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [hasMore,isLoading]);


    
    useEffect(() => {

        if(!initialFetch)
            return;

        if(searchTerm!=='')
            return

        const newFilters = createFilters({ 
            actor: selectedActor, 
            owned:owned,
            subscriptExist:subscriptExist,
            category:selectedCategory,
            sortOrder:sortOrder
        });

       
        fetchMovies('', newFilters, currentPage, pageSize);
    }, [currentPage]);


    const getInitialFilterCachedValue = ()=>{
     
        const cachedSortOrder = localStorage.getItem("sortorder");
        const cachedSelectedActor = localStorage.getItem("selectedActor");
        const cachedOwned= localStorage.getItem("owned");
        const cachedSelectedCategory=localStorage.getItem("selectedCategory");
        const cachedSubscriptExist = localStorage.getItem("subscriptExist");

        if(cachedSortOrder)
        {
            setSortOrder(cachedSortOrder);
        }

        if(cachedSelectedActor)
        {
            
            setSelectedActor(cachedSelectedActor);
           
        }

        if(cachedOwned)
        {
            setOwned(cachedOwned);
        }

        if(cachedSelectedCategory)
        {
            setSelectedCategory(cachedSelectedCategory);
        }

        if(cachedSubscriptExist)
        {
            setSubscriptExist(cachedSubscriptExist);
        }

        const newFilters = createFilters({ 
            actor: cachedSelectedActor, 
            owned:cachedOwned,
            subscriptExist:cachedSubscriptExist,
            category:cachedSelectedCategory,
            sortOrder:cachedSortOrder
        });

        return newFilters;


    }

    const fetchMovies = async (query = '', filters = {}, page = 1, pageSize = 10) => {
        try {
            setIsLoading(true);
            const accessToken = localStorage.getItem('accessToken');
            const params = new URLSearchParams({
                serialNumber: query,
                ...filters,
                page,
                pageSize
            }).toString();
            const url = `${Config.apiUrl}/api/movies?${params}`;

            let response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            // accessToken 만료로 401이 오면 refreshToken으로 재발급 시도 후 재요청
            if (response.status === 401) {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    try {
                        const refreshRes = await fetch(`${Config.apiUrl}/api/auth/refresh`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ refreshToken })
                        });
                        if (refreshRes.ok) {
                            const { accessToken: newAccessToken } = await refreshRes.json();
                            localStorage.setItem('accessToken', newAccessToken);
                            // 재시도
                            response = await fetch(url, {
                                method: 'GET',
                                headers: {
                                    'Authorization': `Bearer ${newAccessToken}`,
                                    'Content-Type': 'application/json'
                                }
                            });
                        } else if (refreshRes.status === 403) {
                            alert('세션이 만료되었습니다. 다시 로그인 해주세요.');
                            if (typeof window.handleLogout === 'function') {
                                window.handleLogout();
                            } else {
                                localStorage.removeItem('accessToken');
                                localStorage.removeItem('refreshToken');
                                navigate('/login');
                            }
                            return;
                        } else {
                            handleUnauthorized();
                            return;
                        }
                    } catch {
                        handleUnauthorized();
                        return;
                    }
                } else {
                    handleUnauthorized();
                    return;
                }
            }

            if (!response.ok) {
                if (response.status === 403) {
                    alert('접근 권한이 없거나 세션이 만료되었습니다. 다시 로그인 해주세요.');
                    if (typeof window.handleLogout === 'function') {
                        window.handleLogout();
                    } else {
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('refreshToken');
                        navigate('/login');
                    }
                    return;
                }
                throw new Error('Failed to fetch movies');
            }

            const data = await response.json();
            // 서버에서 { movies, totalCount } 형태로 반환됨
            if (data.movies && data.movies.length > 0) {
                setMovies(prev => [...prev, ...data.movies]); // 새 데이터 추가
                setHasMore(true);
            } else {
                setHasMore(false);
                console.log("fetch Movie -> data is null");
            }
            setTotalCount(data.totalCount || 0);
        } catch (error) {
            // 401 등 에러 발생 시 목록 비우고 홈으로 이동
            if (error && error.message && error.message.includes('Failed to fetch movies')) {
                setMovies([]);
                setHasMore(false);
                setTotalCount(0);
                navigate('/');
            }
            console.error('Error fetching movies:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchActors = async () => {
        try {
            const response = await fetch(`${Config.apiUrl}/api/actors`);
            const data = await response.json();
            setActors(data);
            console.log(actors)
        } catch (error) {
            console.error('Error fetching actors:', error);
        }
    };

    const deleteMovie = async (id) => {
        try {

            const isConfirmed = window.confirm('Are you sure you want to delete?');
            if(isConfirmed)
            {
                const accessToken = localStorage.getItem('accessToken'); // 로컬 스토리지에서 토큰 가져오기
                const config = {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        withCredentials: true
                    },
                };

                await axios.delete(`${Config.apiUrl}/api/movies/${id}`, config);

                fetchMovies(); // 삭제 후 목록 갱신
            }

           
        } catch (error) {
            console.error('Error deleting movie:', error);
        }
    };

    const handleUnauthorized = () => {
        setMovies([]);
        setHasMore(false);
        navigate('/login'); // 홈이 아니라 로그인 페이지로 이동
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setMovies([]); //기존 영화 목록 초기화.
        fetchMovies(e.target.value); // 검색어가 입력될 때마다 fetchMovies 호출
    };

    const GetReleaseDataStr=(d)=>{
        const date = new Date(d);
        return `${date.getFullYear().toString().substr(-2)}년 ${date.getMonth()+1}월`
    }

    const createFilters = (updatedFilter) => {
        return {
            actor: updatedFilter.actor ?? selectedActor,
            owned: updatedFilter.owned ?? owned,
            subscriptExist: updatedFilter.subscriptExist ?? subscriptExist,
            category: updatedFilter.category ?? selectedCategory,
            sortOrder: updatedFilter.sortOrder ?? sortOrder,
        };
    };

    const handleFilterChange = (newFilters) => {
        setMovies([]); // 기존 영화 목록 초기화
        setSearchTerm('');
        fetchMovies('', newFilters, 1, pageSize); // 첫 페이지부터 다시 로드
    };

    const filteredMovies = movies
        .filter(movie => selectedActor ? movie.actor === selectedActor : true)
        .filter(movie => {
            if (owned === 'plex') return movie.plexRegistered === true;
            if (owned === 'web') {
                // mainMovie의 값이 하나라도 있으면 true
                return movie.mainMovie && typeof movie.mainMovie === 'object' && Object.values(movie.mainMovie).some(v => v);
            }
            if (owned === 'false') {
                // plexRegistered가 false이고 mainMovie의 모든 값이 비어있으면 미보유
                const isMainMovieEmpty = !movie.mainMovie || typeof movie.mainMovie !== 'object' || Object.keys(movie.mainMovie).length === 0 || Object.values(movie.mainMovie).every(v => !v);
                return movie.plexRegistered === false && isMainMovieEmpty;
            }
            return true;
        })
        .filter(movie => {
            if(subscriptExist==='all')
                return true;
            else
            {
                if(subscriptExist === 'true') 
                    return  movie.subscriptExist === true;
                else
                    return movie.subscriptExist === false;
            }

        })
        .filter(movie=> {
            if(selectedCategory)
            {
                if(selectedCategory === "all")
                {
                    if(movie.category === "AdultVideo")
                    {
                        if(isAuthenticated)
                            return true;
                        else
                        {
                            return false;
                        }
                        
                    }
                    return true;
                }
                    
                else if(selectedCategory === movie.category)
                {
                    if(movie.category ==="AdultVideo")
                    {
                        if(isAuthenticated)
                            return true;
                        else
                        {
                            return false;
                        }
                    }
                    return true;
                }

            }
            else{
                if(movie.category==="AdultVideo" && !isAuthenticated )
                    return false;

                return true;
            }

        })
            
        .sort((a, b) => {
            if (sortOrder === 'asc') {
                return new Date(a.releaseDate) - new Date(b.releaseDate);
            } else {
                return new Date(b.releaseDate) - new Date(a.releaseDate);
            }
        });

    const HandleSetSortOrder=(value)=>{

        localStorage.setItem("sortorder",value);
        setSortOrder(value);
        console.log("sort order :"+value);
        const newFilters = createFilters({ sortOrder: value });
        handleFilterChange(newFilters);
    }
    
    const HandleSetSelectedActor=(value)=>{

        localStorage.setItem("selectedActor",value);
        setSelectedActor(value);
        const newFilters = createFilters({ actor: value });
        handleFilterChange(newFilters);
    }

    const HandleSetOwned=(value)=>{

        localStorage.setItem("owned",value);
        setOwned(value);
        const newFilters = createFilters({ owned: value });
        handleFilterChange(newFilters);
    }

    const HandleSetSelectedCategory=(value)=>{

        localStorage.setItem("selectedCategory",value);
        setSelectedCategory(value);
        const newFilters = createFilters({ category: value });
        handleFilterChange(newFilters);
    }

    const HandleSetSubscriptExist = (value)=>{
        localStorage.setItem("subscriptExist",value);
        setSubscriptExist(value);
        const newFilters = createFilters({ subscriptExist: value });
        handleFilterChange(newFilters);
    }

    const ShowOwnedType = (plexRegistered, mainMovie) => {
        // mainMovie의 값이 모두 비어있으면 보유X로 간주
        const isAllEmpty = !mainMovie || typeof mainMovie !== 'object' || Object.keys(mainMovie).length === 0 || Object.values(mainMovie).every(v => !v);
        if (plexRegistered && isAllEmpty) {
            // plex만 보유, web 없음
            return <img src={plexIcon} className="icon-small plex-icon" />;
        }
        if (isAllEmpty) return null;
        const hasWeb = Object.values(mainMovie).some(v => v);
        const has4K = mainMovie['4k'] || mainMovie['2160p'];
        const hasFullHD = mainMovie['1080p'];
        return (
            <div>
                {plexRegistered ? <img src={plexIcon} className="icon-small plex-icon" /> : null}
                {hasWeb ? <img src={webIcon} className="icon-small" /> : null}
                {has4K ? <img src={fourKIcon} className="icon-small" title="4K" /> : null}
                {hasFullHD ? <img src={fullhdIcon} className="icon-small" title="FullHD" /> : null}
            </div>
        );
    }

    return (
    <div>    
        <OptionBar
            isAuthenticated={isAuthenticated}
            actors={actors}
            selectedActor={selectedActor}
            setSelectedActor={HandleSetSelectedActor}
            sortOrder={sortOrder}
            setSortOrder={HandleSetSortOrder}
            owned={owned}
            setOwned={HandleSetOwned}
            selectedCategory={selectedCategory}
            setSelectedCategory={HandleSetSelectedCategory}
            subscriptExist = {subscriptExist}
            setSubscriptExist={HandleSetSubscriptExist}

         />
        <div className="movie-list">
            <div className="movie-list-header">
                <span className="total-count-label">
                    <svg className="total-count-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="10" cy="10" r="10" fill="#1976d2"/>
                        <text x="10" y="15" textAnchor="middle" fontSize="12" fill="#fff" fontWeight="bold">#</text>
                    </svg>
                    <b>Totals</b> <span className="total-count-number">{totalCount}</span> Results
                </span>
            </div>
            <input
                type="text"
                value={searchTerm}
                placeholder="Search by serial number..."
                onChange={handleSearch}
                className="search-input"
            />
            <div className="movies">
                {movies.map((movie) => (
                    <div key={movie._id} className="movie-card">
                        {/* 1. 배경: 전체 블러 이미지 */}
                        <div 
                            className={`movie-card-blur-bg ${isNSFWContentBlured ? 'blur-strong' : ''}`}
                            style={{ backgroundImage: `url(${Config.apiUrl}/${movie.image})` }}
                        ></div>

                        {/* 2. 컨텐츠 래퍼: 포스터와 정보를 수직으로 배치 */}
                        <div className="movie-card-inner">
                            {/* 시리얼 넘버: 카드 맨 위로 이동 */}
                            <div className="movie-info-top">
                                <p>{movie.serialNumber}</p>
                            </div>

                            {/* 상단: 선명한 포스터 이미지 (링크 포함) */}
                            <Link to={`/movies/${movie._id}`} className="movie-poster-link">
                                <div 
                                    className="movie-poster-clear"
                                    style={{ backgroundImage: `url(${Config.apiUrl}/${movie.image})` }}
                                >
                                    {/* NSFW 필터가 켜져있을 때 포스터 자체도 가려야 한다면 여기에 추가 블러 처리 가능 */}
                                    {isNSFWContentBlured && <div className="nsfw-poster-cover"></div>}
                                </div>
                            </Link>

                            {/* 하단: 정보 영역 */}
                            <div className="movie-info-area">
                                <div className="movie-info-bottom">
                                    <Link to={`/movies/${movie._id}`} className="movie-title-link">
                                        <h3>{movie.title}</h3>
                                    </Link>
                                    <h4>보유여부: {
                                        (!movie.plexRegistered && (
                                            !movie.mainMovie || typeof movie.mainMovie !== 'object' || Object.keys(movie.mainMovie).length === 0 || Object.values(movie.mainMovie).every(v => !v)
                                        ))
                                            ? 'X'
                                            : ShowOwnedType(movie.plexRegistered, movie.mainMovie)
                                    }</h4>
                                    <h4>자막유뮤: {movie.subscriptExist ? 'O':'X'}</h4>
                                    <div className='release-date'>
                                        <h4>{GetReleaseDataStr(movie.releaseDate)} 출시</h4>
                                    </div>
                                </div>
                                {
                                    isAuthenticated && loginRole === "admin" ? (<button onClick={() => deleteMovie(movie._id)} className="list-delete-button"> Delete</button>) : (<></>)
                                }
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="loader-container">
                        <div className="loader"></div>
                    </div>
                )}
            </div>
        </div>
    </div>

    );
};

export default AMovieList;