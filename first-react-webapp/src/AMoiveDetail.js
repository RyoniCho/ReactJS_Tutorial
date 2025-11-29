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
    const [isFavorite, setIsFavorite] = useState(false);

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

        const checkFavorite = async () => {
            if (!accessToken) return;
            try {
                const res = await axios.get(`${Config.apiUrl}/api/favorites/ids`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                if (res.data.includes(id)) {
                    setIsFavorite(true);
                } else {
                    setIsFavorite(false);
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchMovie();
        checkFavorite();
    }, [id]);

    const toggleFavorite = async () => {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            alert('로그인이 필요합니다.');
            return;
        }
        try {
            const res = await axios.post(`${Config.apiUrl}/api/favorites`, { movieId: id }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setIsFavorite(res.data.favorited);
        } catch (err) {
            console.error(err);
            alert('즐겨찾기 변경 실패');
        }
    };

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

    const handleDownload = async () => {
        if (!selectedQuality) return;
        const moviePath = movie.mainMovie[selectedQuality];
        if (!moviePath) return;

        const accessToken = localStorage.getItem('accessToken');
        
        if(!window.confirm(`${selectedQuality} 화질로 다운로드를 시작하시겠습니까? (파일 크기에 따라 시간이 소요될 수 있습니다)`)) return;

        // 브라우저 직접 다운로드 방식으로 변경 (메모리 부족 방지)
        const downloadUrl = `${Config.apiUrl}/api/download?file=${encodeURIComponent(moviePath)}&resolution=${selectedQuality}&token=${accessToken}`;
        
        // a 태그를 사용하여 다운로드 트리거 (가장 안정적인 방법)
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', `${movie.serialNumber}_${selectedQuality}.mp4`); // 파일명 힌트
        document.body.appendChild(link);
        link.click();
        
        // 클릭 후 바로 제거해도 다운로드 매니저로 이관되었으므로 안전함
        document.body.removeChild(link);
    };

    if (!movie) return <div>Loading...</div>;
    
    const availableQualities = movie.mainMovie ? Object.keys(movie.mainMovie).filter(q => movie.mainMovie[q]) : [];
   

    return (
        <div className="movie-detail">
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <h2>{movie.title}</h2>
                {isAuthenticated && (
                    <button 
                        onClick={toggleFavorite}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '2rem',
                            cursor: 'pointer',
                            color: isFavorite ? '#ff4081' : '#ccc',
                            padding: '0 10px'
                        }}
                        title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                    >
                        {isFavorite ? '♥' : '♡'}
                    </button>
                )}
            </div>
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
                    <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                        <label style={{marginRight: '5px'}}>화질 선택: </label>
                        <select value={selectedQuality} onChange={e => setSelectedQuality(e.target.value)} style={{marginRight: '10px'}}>
                            {availableQualities.map(q => (
                                <option key={q} value={q}>{q}</option>
                            ))}
                        </select>
                        <button onClick={handleDownload} style={{padding: '4px 10px', cursor: 'pointer', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px'}}>
                            Download
                        </button>
                    </div>
                    <HLSVideoPlayer
                        videoSrc={`${Config.apiUrl}/api/stream?file=${movie.mainMovie[selectedQuality]}&resolution=${selectedQuality}`}
                        subSrc={movie.mainMovieSub ? `${Config.apiUrl}/api/${movie.mainMovieSub}` : ''}
                        movieId={`${id}`}
                    />
                </>
            )}
            </div>
            <div className="favorite-container">
                <button onClick={toggleFavorite} className={`favorite-button ${isFavorite ? 'favorited' : ''}`}>
                    {isFavorite ? '★' : '☆'} 즐겨찾기
                </button>
            </div>
        </div>
    );
};

export default AMovieDetail;