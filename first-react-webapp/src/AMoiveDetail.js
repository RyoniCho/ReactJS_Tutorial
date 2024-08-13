import React, { useEffect, useState } from 'react';
import { useParams,useNavigate } from 'react-router-dom';
import './Styles/AMovieDetail.css';

const AMovieDetail = () => {
    const { id } = useParams();
    const [movie, setMovie] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMovie = async () => {
            try {
                const response = await fetch(`http://localhost:3001/api/movies/${id}`);
                const data = await response.json();
                setMovie(data);
            } catch (error) {
                console.error('Error fetching movie:', error);
            }
        };

        fetchMovie();
    }, [id]);

    const deleteMovie = async () => {
        try {
            await fetch(`http://localhost:3001/api/movies/${id}`, {
                method: 'DELETE',
            });
            navigate('/'); // 삭제 후 메인 페이지로 이동
        } catch (error) {
            console.error('Error deleting movie:', error);
        }
    };

    if (!movie) return <div>Loading...</div>;

    return (
        <div className="movie-detail">
            <h2>{movie.title}</h2>
            <img src={`http://localhost:3001/${movie.image}`} alt={movie.title} className="movie-detail-main-image" />
            <div className="movie-detail-content">
                <video controls className="movie-detail-trailer">
                    <source src={`http://localhost:3001/${movie.trailer}`} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
                <div className="movie-detail-info">
                    <p><strong>Serial Number:</strong> {movie.serialNumber}</p>
                    <p><strong>Actor:</strong> {movie.actors}</p>
                    <p><strong>Plex Registered:</strong> {movie.plexRegistered ? 'Yes' : 'No'}</p>
                    <p><strong>Description:</strong> {movie.description}</p>
                    <button onClick={deleteMovie} className="delete-button">Delete Movie</button>
                </div>
            </div>
        </div>
    );
};

export default AMovieDetail;