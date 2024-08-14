import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Styles/AMovieList.css';
import Config from './Config'
import axios from 'axios';

const AMovieList = ({isAuthenticated}) => {
    const [movies, setMovies] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchMovies();
    }, []);

    const fetchMovies = async (query = '') => {
        try {
            console.log("fetch movies");
            const response = await fetch(`${Config.apiUrl}/api/movies?serialNumber=${query}`);
            const data = await response.json();
            setMovies(data);
        } catch (error) {
            console.error('Error fetching movies:', error);
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

    return (
    
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
                            <img src={`${Config.apiUrl}/${movie.image}`} alt={movie.title} className="movie-thumbnail" />
                            <div className="movie-info">
                                <h3>{movie.title}</h3>
                                <h4>보유여부: {movie.plexRegistered ? 'O' : 'X'}</h4>
                                <div className='release-date'>
                                    <h4>{GetReleaseDataStr(movie.releaseDate)} 출시</h4>
                                </div>
                              
                            </div>
                        </Link>
                        {
                            isAuthenticated? (<button onClick={() => deleteMovie(movie._id)} className="delete-button"> Delete</button>):(<></>)
                        }
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AMovieList;