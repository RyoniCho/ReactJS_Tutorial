import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Styles/AMovieList.css';

const AMovieList = () => {
    const [movies, setMovies] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchMovies();
    }, []);

    const fetchMovies = async (query = '') => {
        try {
            console.log("fetch movies");
            const response = await fetch(`http://localhost:3001/api/movies?serialNumber=${query}`);
            const data = await response.json();
            setMovies(data);
        } catch (error) {
            console.error('Error fetching movies:', error);
        }
    };

    const deleteMovie = async (id) => {
        try {
            await fetch(`http://localhost:3001/api/movies/${id}`, {
                method: 'DELETE',
            });
            fetchMovies(); // 삭제 후 목록 갱신
        } catch (error) {
            console.error('Error deleting movie:', error);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        fetchMovies(e.target.value); // 검색어가 입력될 때마다 fetchMovies 호출
    };

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
                            <img src={`http://localhost:3001/${movie.image}`} alt={movie.title} className="movie-thumbnail" />
                            <div className="movie-info">
                                <h3>{movie.title}</h3>
                                <p>Serial: {movie.serialNumber}</p>
                            </div>
                        </Link>
                        <button onClick={() => deleteMovie(movie._id)} className="delete-button">
                            Delete
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AMovieList;