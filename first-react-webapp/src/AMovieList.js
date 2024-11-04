import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Styles/AMovieList.css';
import Config from './Config'
import axios from 'axios';
import OptionBar from './OptionBar';
import plexIcon  from './Icons/plex.svg'
import webIcon from './Icons/web.svg'

const AMovieList = ({isAuthenticated,isNSFWContentBlured}) => {

    cosnt [isLoading,setIsLoading] = useState(false);
    const [movies, setMovies] = useState([]);
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


    useEffect(() => {
        const initialFilter = getInitialFilterCachedValue();
        fetchActors();
        fetchMovies('', initialFilter, 1, pageSize);
        setInitialFetch(true);

    }, []);

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
            const params = new URLSearchParams({
                serialNumber: query,
                ...filters,
                page,
                pageSize
            }).toString();
    
            const url = `${Config.apiUrl}/api/movies?${params}`
            const response = await fetch(url);
            const data = await response.json();
            if(data.length >0)
            {
                setMovies(prev => [...prev, ...data]); // 새 데이터 추가
                setHasMore(true);
                 
            }
            else
            {
                setHasMore(false);
                console.log("fetch Movie -> data is null");
            }
           
        } catch (error) {
            console.error('Error fetching movies:', error);
        }
        finally{
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
                const token = localStorage.getItem('token'); // 로컬 스토리지에서 토큰 가져오기
                const config = {
                    headers: {
                        'Authorization': `Bearer ${token}`, // Authorization 헤더에 JWT 토큰 포함
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
            if (owned === 'web') return movie.mainMovie!=='';
            if (owned === 'false') return movie.plexRegistered === false && movie.mainMovie==='';
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

    const ShowOwnedType=(plexRegistered, mainMovie)=>{
        return (<div>{plexRegistered? <img src = {plexIcon} className="icon-small"/>:<></>} {(mainMovie !=='') ? <img src = {webIcon} className="icon-small"/>: <></>}</div>)
       
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
                        <Link to={`/movies/${movie._id}`} className="movie-link">
                        <div className="movie-info">
                            <p>{movie.serialNumber}</p>
                        </div>
                            <div className={`${isNSFWContentBlured ? 'blur' : ''}`}>
                            <img src={`${Config.apiUrl}/${movie.image}`} alt={movie.title} className="movie-thumbnail" />
                            </div>
                            <div className="movie-info">
                                <h3>{movie.title}</h3>
                                <h4>보유여부: {(!movie.plexRegistered&&movie.mainMovie==='') ? 'X': (ShowOwnedType(movie.plexRegistered,movie.mainMovie)) }</h4>
                                <h4>자막유뮤: {movie.subscriptExist ? 'O':'X'}</h4>
                                <div className='release-date'>
                                    <h4>{GetReleaseDataStr(movie.releaseDate)} 출시</h4>
                                </div>
                              
                            </div>
                        </Link>
                        {
                            isAuthenticated? (<button onClick={() => deleteMovie(movie._id)} className="list-delete-button"> Delete</button>):(<></>)
                        }
                    </div>
                ))}
                {isLoading && <div className="loader"></div>}
            </div>
        </div>
    </div>

    );
};

export default AMovieList;