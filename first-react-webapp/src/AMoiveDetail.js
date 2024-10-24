import React, { useEffect, useState } from 'react';
import { useParams,useNavigate } from 'react-router-dom';
import './Styles/AMovieDetail.css'
import Config from './Config'
import axios from 'axios';
import ExtraImageSlider from './ExtraImageSlider';
import HLSVideoPlayer from './HLSVideoPlayer';

const AMovieDetail = ({isAuthenticated,isNSFWContentBlured}) => {
    const { id } = useParams();
    const [movie, setMovie] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMovie = async () => {
            try {
                const url = `${Config.apiUrl}/api/movies/${id}`;
                console.log(url)
                const response = await fetch(url);
                console.log("AmovieDetail Response:"+response)
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
                navigate('/'); // 삭제 후 메인 페이지로 이동
            }
           
        } catch (error) {
            console.error('Error deleting movie:', error);
        }
    };

    const handleEdit = () => {
        navigate(`/edit/${movie._id}`);
    };
    
    const GetReleaseDataStr=(d)=>{
        const date = new Date(d);
        return `${date.getFullYear().toString().substr(-2)}년 ${date.getMonth()+1}월`
    }

    if (!movie) return <div>Loading...</div>;

    return (
        <div className="movie-detail">
            <h2>{movie.title}</h2>
            <div className={`${isNSFWContentBlured ? 'blur' : ''}`}>
            <img src={`${Config.apiUrl}/${movie.image}`} alt={movie.title} className="movie-detail-main-image" />
            </div>
            {(movie.extraImage.length>0) ? <ExtraImageSlider images={movie.extraImage.map((img)=>`${Config.apiUrl}/${img}`)} blur={isNSFWContentBlured}/> : <></>}
            
            <div className="movie-detail-content">
                <video controls className="movie-detail-trailer">
                    <source src={`${Config.apiUrl}/${movie.trailer}`} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
                
                
                <div className="movie-detail-info">
                    <p><strong>Category:</strong> {movie.category.toUpperCase()}</p>
                    <p><strong>Serial Number:</strong> {movie.serialNumber}</p>
                    <p><strong>Actor:</strong> {movie.actor}</p>
                    <p><strong>Plex Registered:</strong> {movie.plexRegistered ? 'Yes' : 'No'}</p>
                    <p><strong>Description:</strong> {movie.description}</p>
                    <p><strong>Release Date:</strong> {GetReleaseDataStr(movie.releaseDate)}</p>
                   
                   {
                    isAuthenticated ? (

                        <div className='button-container'>
                         {/* 편집 버튼 */}
                        <button className="edit-button" onClick={handleEdit}>Edit</button> 
                        <button className="delete-button" onClick={deleteMovie}>Delete</button>
                    </div>
                    ): (<></>)
                   }
                    
                    
                </div>
            </div>
            <div>
            
            {(movie.mainMovie!=='') ? <h4>Main Movie</h4> : <></>}
            {(movie.mainMovie!=='') ? <HLSVideoPlayer videoSrc={`${Config.apiUrl}/api/stream?file=${movie.mainMovie}&resolution=720p`} subSrc={`${Config.apiUrl}/api/${movie.mainMovieSub}`}/> : <></>}
            </div>
           
        </div>
    );
};

export default AMovieDetail;