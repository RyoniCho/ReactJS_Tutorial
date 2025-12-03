import React, { useState, useEffect } from 'react';
import EditableImage from './EditableImage';
import { useParams, useNavigate } from 'react-router-dom';
import Config from './Config';
import axios from 'axios';
import "./Styles/EditMovie.css"


function EditMovie() {
    const { id } = useParams();
    const navigate = useNavigate();
    const url = `${Config.apiUrl}/api/movies/${id}`;
    const [actors, setActors] = useState([]);

    // mainMoviePaths: { '720p': '', '1080p': '', '4k': '' }
    const [mainMoviePaths, setMainMoviePaths] = useState({ '720p': '', '1080p': '', '4k': '' });
    
    // Series Support
    const [isSeries, setIsSeries] = useState(false);
    const [episodes, setEpisodes] = useState([]); // [{ title: '', video: { '720p': '', '1080p': '', '4k': '' }, sub: '' }]

    // 이미지/추가이미지 상태
    const [imageUrl, setImageUrl] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [extraImages, setExtraImages] = useState([]); // [{ url, file }]

    const [movie, setMovie] = useState({
        title: '',
        description: '',
        actor: '',
        serialNumber: '',
        subscriptExist: false,
        plexRegistered: false,
        releaseDate: Date.now(),
        category: 'Unknown',
        mainMovie: {},
        mainMovieSub: '',
        trailer: ''
    });

    useEffect(() => {
        // 서버에서 기존 영화 정보를 가져와서 상태를 업데이트
        const accessToken = localStorage.getItem('accessToken');
        fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            }
        })
            .then(response => response.json())
            .then(data => {
                setMovie(data);
                // mainMovie가 객체(Map)라면 상태로 변환
                if (data.mainMovie && typeof data.mainMovie === 'object') {
                    setMainMoviePaths({
                        '720p': data.mainMovie['720p'] || '',
                        '1080p': data.mainMovie['1080p'] || '',
                        '4k': data.mainMovie['4k'] || ''
                    });
                }
                
                // Series Data
                setIsSeries(!!data.isSeries);
                if (data.episodes && Array.isArray(data.episodes)) {
                    setEpisodes(data.episodes.map(ep => ({
                        title: ep.title || '',
                        description: ep.description || '',
                        video: ep.video || {},
                        sub: ep.sub || ''
                    })));
                }

                // image/extraImage 상태 초기화 (uploads/로 시작하면 서버 URL 붙이기)
                setImageUrl(data.image ? (data.image.startsWith('uploads/') ? `${Config.apiUrl}/${data.image}` : data.image) : '');
                setImageFile(null);
                setExtraImages(
                    (data.extraImage || []).map(url => ({ url: url.startsWith('uploads/') ? `${Config.apiUrl}/${url}` : url, file: null }))
                );
            })
            .catch(err => console.error(err));
        fetchActors();
    }, [id]);

    const fetchActors = async () => {
        try {
            const response = await fetch(`${Config.apiUrl}/api/actors`);
            const data = await response.json();
            setActors(data);
        } catch (error) {
            console.error('Error fetching actors:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setMovie(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        setMovie(prevState => ({
            ...prevState,
            [name]: checked
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('accessToken');
        const formData = new FormData();
        formData.append('title', movie.title);
        formData.append('description', movie.description);
        formData.append('actor', movie.actor);
        formData.append('serialNumber', movie.serialNumber);
        formData.append('subscriptExist', movie.subscriptExist);
        formData.append('plexRegistered', movie.plexRegistered);
        formData.append('releaseDate', movie.releaseDate);
        formData.append('category', movie.category);
        formData.append('mainMovie', JSON.stringify(mainMoviePaths));
        formData.append('mainMovieSub', movie.mainMovieSub || '');
        formData.append('trailer', movie.trailer);

        // Series Data
        formData.append('isSeries', isSeries);
        formData.append('episodes', JSON.stringify(episodes));

        // 이미지 처리
        if (imageFile) {
            formData.append('image', imageFile);
        } else if (imageUrl) {
            formData.append('urlImage', imageUrl);
        }

        // extraImage 처리
        const urlExtraImages = extraImages.filter(img => img.url && !img.file).map(img => img.url);
        if (urlExtraImages.length > 0) {
            formData.append('urlsExtraImage', urlExtraImages.join(','));
        }
        extraImages.forEach(img => {
            if (img.file) formData.append('extraImage', img.file);
        });

        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`,
                withCredentials: true
            },
        };

        try {
            await axios.put(url, formData, config);
            navigate(`/movies/${id}`);
        } catch (err) {
            console.log(err);
            alert('Edit Info Failed');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <label>Category</label>
            <select name="category" value={movie.category} onChange={handleChange}>
                <option value="">Select Category</option>
                {Config.categories.map((cate,index) => (
                    <option key={index} value={cate}>{cate}</option>
                ))}
            </select>
            <label>Title:
                <input type="text" name="title" value={movie.title} onChange={handleChange} />
            </label>
            <label>Description:
                <textarea name="description" value={movie.description} onChange={handleChange}></textarea>
            </label>
            <label>Actor:</label>
            <select name="actor" value={movie.actor} onChange={handleChange}>
                <option value="">Select an actor</option>
                {actors.map((actor) => (
                    <option key={actor._id} value={actor.name}>{actor.name}</option>
                ))}
            </select>
            <label>Serial Number:
                <input type="text" name="serialNumber" value={movie.serialNumber} onChange={handleChange} />
            </label>
            <label>Plex Registered:
                <input type="checkbox" name="plexRegistered" checked={movie.plexRegistered} onChange={handleCheckboxChange} />
            </label>
            <label>Subscription:
                <input type="checkbox" name="subscriptExist" checked={movie.subscriptExist} onChange={handleCheckboxChange} />
            </label>
            <label>Release Date:
                <input type="date" name="releaseDate" value={movie.releaseDate} onChange={handleChange} />
            </label>
            <label>Trailer Movie Path:
                <input type="text" name="trailer" value={movie.trailer} onChange={handleChange} />
            </label>

            <label>대표 이미지 (URL 또는 업로드)</label>
            <EditableImage
                src={imageUrl}
                onChange={(url, file) => { setImageUrl(url); setImageFile(file); }}
                label="대표 이미지"
            />

            <label>추가 이미지 (URL 또는 업로드, 여러개)</label>
            {extraImages.map((img, idx) => (
                <EditableImage
                    key={idx}
                    src={img.url}
                    onChange={(url, file) => {
                        setExtraImages(prev => prev.map((item, i) => i === idx ? { url, file } : item));
                    }}
                    onRemove={() => setExtraImages(prev => prev.filter((_, i) => i !== idx))}
                    label={`추가 이미지 ${idx + 1}`}
                />
            ))}
            <button type="button" onClick={() => setExtraImages(prev => [...prev, { url: '', file: null }])}>추가 이미지 추가</button>

            <div style={{marginTop: '20px', marginBottom: '20px'}}>
                <div style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}>
                    <label className="switch" style={{marginRight: '10px', display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                        <input
                            type="checkbox"
                            checked={isSeries}
                            onChange={(e) => setIsSeries(e.target.checked)}
                            style={{marginRight: '8px', transform: 'scale(1.2)'}}
                        />
                        <span style={{fontSize: '1.1em', fontWeight: 'bold'}}>Series Mode</span>
                    </label>
                </div>

                {isSeries ? (
                    <div style={{marginTop: '10px', borderLeft: '3px solid #1976d2', paddingLeft: '15px'}}>
                        {episodes.map((ep, idx) => (
                            <div key={idx} style={{marginBottom: '20px', padding: '15px', backgroundColor: '#2a2a2a', borderRadius: '8px'}}>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                                    <h4 style={{margin: 0}}>Episode {idx + 1}</h4>
                                    <button type="button" onClick={() => setEpisodes(prev => prev.filter((_, i) => i !== idx))} style={{backgroundColor: '#d32f2f', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer'}}>Remove</button>
                                </div>
                                
                                <div style={{marginBottom: '10px'}}>
                                    <label style={{display: 'block', marginBottom: '4px', fontSize: '0.9em', color: '#aaa'}}>Title</label>
                                    <input 
                                        type="text" 
                                        placeholder="Episode Title" 
                                        value={ep.title} 
                                        onChange={e => {
                                            const newEps = [...episodes];
                                            newEps[idx].title = e.target.value;
                                            setEpisodes(newEps);
                                        }}
                                        style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white'}}
                                    />
                                </div>

                                <div style={{marginBottom: '10px'}}>
                                    <label style={{display: 'block', marginBottom: '4px', fontSize: '0.9em', color: '#aaa'}}>Description (Optional)</label>
                                    <textarea 
                                        placeholder="Episode Description" 
                                        value={ep.description || ''} 
                                        onChange={e => {
                                            const newEps = [...episodes];
                                            newEps[idx].description = e.target.value;
                                            setEpisodes(newEps);
                                        }}
                                        style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white', minHeight: '60px', resize: 'vertical'}}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <label style={{fontSize: '0.9em', color: '#aaa'}}>Video Paths</label>
                                    <input type="text" placeholder="720p Path" value={ep.video['720p'] || ''} onChange={e => {
                                        const newEps = [...episodes];
                                        newEps[idx].video = { ...newEps[idx].video, '720p': e.target.value };
                                        setEpisodes(newEps);
                                    }} style={{width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white'}} />
                                    <input type="text" placeholder="1080p Path" value={ep.video['1080p'] || ''} onChange={e => {
                                        const newEps = [...episodes];
                                        newEps[idx].video = { ...newEps[idx].video, '1080p': e.target.value };
                                        setEpisodes(newEps);
                                    }} style={{width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white'}} />
                                    <input type="text" placeholder="4K Path" value={ep.video['4k'] || ''} onChange={e => {
                                        const newEps = [...episodes];
                                        newEps[idx].video = { ...newEps[idx].video, '4k': e.target.value };
                                        setEpisodes(newEps);
                                    }} style={{width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: 'white'}} />
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={() => setEpisodes(prev => [...prev, { title: `Episode ${prev.length + 1}`, description: '', video: {} }])} style={{width: '100%', padding: '10px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}>+ Add Episode</button>
                    </div>
                ) : (
                    <div>
                        <label>Main Movie (화질별 경로)</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                            <input type="text" placeholder="720p 경로" value={mainMoviePaths['720p']} onChange={e => setMainMoviePaths(prev => ({ ...prev, '720p': e.target.value }))} />
                            <input type="text" placeholder="1080p 경로" value={mainMoviePaths['1080p']} onChange={e => setMainMoviePaths(prev => ({ ...prev, '1080p': e.target.value }))} />
                            <input type="text" placeholder="4K 경로" value={mainMoviePaths['4k']} onChange={e => setMainMoviePaths(prev => ({ ...prev, '4k': e.target.value }))} />
                        </div>
                    </div>
                )}
            </div>
            <button type="submit">Save Changes</button>
        </form>
    );
}

export default EditMovie;