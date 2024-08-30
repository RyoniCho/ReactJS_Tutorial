import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Styles/AMovieList.css';
import Config from './Config'
import axios from 'axios';
import OptionBar from './OptionBar';

const AMovieList = ({isAuthenticated,isNSFWContentBlured}) => {
    const [movies, setMovies] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [actors, setActors] = useState([]);
    const [selectedActor, setSelectedActor] = useState('');
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc' for ascending, 'desc' for descending
    const [owned, setOwned] = useState('all'); // 'all', 'true', 'false'
    const [selectedCategory, setSelectedCategory]= useState('');
   


    useEffect(() => {
        fetchMovies();
        fetchActors();
       

    }, []);

    const fetchMovies = async (query = '') => {
        try {
            console.log("fetch movies");
            const url = `${Config.apiUrl}/api/movies?serialNumber=${query}`
            const response = await fetch(url);
            const data = await response.json();
            setMovies(data);
        } catch (error) {
            console.error('Error fetching movies:', error);
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
        fetchMovies(e.target.value); // 검색어가 입력될 때마다 fetchMovies 호출
    };

    const GetReleaseDataStr=(d)=>{
        const date = new Date(d);
        return `${date.getFullYear().toString().substr(-2)}년 ${date.getMonth()+1}월`
    }

    const filteredMovies = movies
        .filter(movie => selectedActor ? movie.actor === selectedActor : true)
        .filter(movie => {
            if (owned === 'true') return movie.plexRegistered === true;
            if (owned === 'false') return movie.plexRegistered === false;
            return true;
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

    return (
    <div>    
        <OptionBar
            isAuthenticated={isAuthenticated}
            actors={actors}
            selectedActor={selectedActor}
            setSelectedActor={setSelectedActor}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            owned={owned}
            setOwned={setOwned}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}

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
                {filteredMovies.map((movie) => (
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
                                <h4>보유여부: {movie.plexRegistered ? 'O' : 'X'}</h4>
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
            </div>
        </div>
    </div>

    );
};

export default AMovieList;