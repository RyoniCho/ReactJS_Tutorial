import React, { useEffect, useState } from 'react';
import { useParams,useNavigate } from 'react-router-dom';
import './Styles/AMovieDetail.css'
import Config from './Config'
import axios from 'axios';
import ExtraImageSlider from './ExtraImageSlider';
import HLSVideoPlayer from './HLSVideoPlayer';
import {jwtDecode} from "jwt-decode";

const AMovieDetail = ({isAuthenticated,isNSFWContentBlured}) => {
    const { id } = useParams();
    const [movie, setMovie] = useState(null);
    const [loginRole, setLoginRole] = useState(null);
    const navigate = useNavigate();

    const [selectedQuality, setSelectedQuality] = useState('');
    // availableQualities의 첫 번째 값으로 selectedQuality 자동 설정
    useEffect(() => {
        if (movie && movie.mainMovie) {
            const qualities = Object.keys(movie.mainMovie).filter(q => movie.mainMovie[q]);
            if (qualities.length > 0 && !qualities.includes(selectedQuality)) {
                setSelectedQuality(qualities[0]);
            }
        }
    }, [movie]);

    useEffect(() => {

        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            const { role } = jwtDecode(accessToken);
            setLoginRole(role);
        }

        const fetchMovie = async () => {
            try {
                const url = `${Config.apiUrl}/api/movies/${id}`;
                console.log(url)
                const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                }
                });
                console.log("AmovieDetail Response:"+response)
                if (!response.ok) 
                {
                     throw new Error('Failed to fetch movie');
                }
                const data = await response.json();
                setMovie(data);
            } catch (error) {
                console.error('Error fetching movie:', error);
                alert('정보를 불러오지 못하였습니다. 홈으로 돌아갑니다.');
                setMovie(null);
                navigate('/');
            }
        };

        fetchMovie();
    }, [id]);

    const deleteMovie = async () => {
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

    const getImageUrl = (imagePath) => {
        if (!imagePath) return '';
        const normalizedPath = imagePath.replace(/\\/g, '/');
        return `${Config.apiUrl}${normalizedPath.startsWith('/') ? '' : '/'}${normalizedPath}`;
    }

    if (!movie) return <div>Loading...</div>;
    
    const availableQualities = movie.mainMovie ? Object.keys(movie.mainMovie).filter(q => movie.mainMovie[q]) : [];
   

    return (
        <div className="movie-detail">
            <h2>{movie.title}</h2>
            <div className={`${isNSFWContentBlured ? 'blur' : ''}`}>
            <img src={getImageUrl(movie.image)} alt={movie.title} className="movie-detail-main-image" />
            </div>
            {(movie.extraImage && movie.extraImage.length>0) ? <ExtraImageSlider images={movie.extraImage.map((img)=>getImageUrl(img))} blur={isNSFWContentBlured}/> : <></>}
            
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
                    <p><strong>Subscription:</strong> {movie.subscriptExist ? 'Yes' : 'No'}</p>
                    <p><strong>Description:</strong> {movie.description}</p>
                    <p><strong>Release Date:</strong> {GetReleaseDataStr(movie.releaseDate)}</p>
                   
                   {
                    (isAuthenticated&& loginRole === "admin")  ? (

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
            
            {/* {(movie.mainMovie!=='') ? <h4>Main Movie</h4> : <></>}
            {(movie.mainMovie!=='') ? <HLSVideoPlayer videoSrc={`${Config.apiUrl}/api/stream?file=${movie.mainMovie}&resolution=720p`} subSrc={`${Config.apiUrl}/api/${movie.mainMovieSub}`} movieId={`${id}`}/> : <></>} */}
            {availableQualities.length > 0 && (
                <>
                    <h4>Main Movie</h4>
                    <div style={{ marginBottom: 8 }}>
                        <label>화질 선택: </label>
                        <select value={selectedQuality} onChange={e => setSelectedQuality(e.target.value)}>
                            {availableQualities.map(q => (
                                <option key={q} value={q}>{q}</option>
                            ))}
                        </select>
                    </div>
                    <HLSVideoPlayer
                        videoSrc={`${Config.apiUrl}/api/stream?file=${movie.mainMovie[selectedQuality]}&resolution=${selectedQuality}`}
                        subSrc={movie.mainMovieSub ? `${Config.apiUrl}/api/${movie.mainMovieSub}` : ''}
                        movieId={`${id}`}
                    />
                </>
            )}
            </div>
           
        </div>
    );
};

export default AMovieDetail;