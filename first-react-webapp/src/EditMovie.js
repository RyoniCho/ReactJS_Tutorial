import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Config from './Config';
import axios from 'axios';
import "./Styles/EditMovie.css"

function EditMovie() {
    const { id } = useParams();  // URL에서 영화 ID를 가져옴
    const navigate = useNavigate();
    const url = `${Config.apiUrl}/api/movies/${id}`;
    const [actors, setActors] = useState([]);
    

    const [movie, setMovie] = useState({
        title: '',
        description: '',
        actor: '',
        serialNumber: '',
        subscriptExist:false,
        plexRegistered: false,
        releaseDate: Date.now(),
        category:'Unknown',
        mainMovie:'',
        mainMovieSub:'',
        trailer:''
        
    });

    useEffect(() => {
        // 서버에서 기존 영화 정보를 가져와서 상태를 업데이트
        const accessToken = localStorage.getItem('accessToken');
        fetch(url,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                }
            })
            .then(response => response.json())
            .then(data => setMovie(data))
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

        const token = localStorage.getItem('accessToken'); // 로컬 스토리지에서 토큰 가져오기
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`, // Authorization 헤더에 JWT 토큰 포함
                withCredentials: true
            },
        };
        
        try{
            const res = await axios.put(url,movie,config);
            navigate(`/movies/${id}`);  // 업데이트 후 상세 페이지로 이동
        }

        catch (err) {
          
            console.log(err)
            alert('Edit Info Failed');
        }

    };

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Category
            </label>
                    <select name="category" value={movie.category} onChange={handleChange}>
                        <option value="">Select Category</option>
                        {Config.categories.map((cate,index) => (
                            <option key={index} value={cate}>
                                {cate}
                            </option>
                        ))}
                    </select>
            <label>
                Title:
                <input type="text" name="title" value={movie.title} onChange={handleChange} />
            </label>
            <label>
                Description:
                <textarea name="description" value={movie.description} onChange={handleChange}></textarea>
            </label>
            <label>
                Actor:
                {/* <input type="text" name="actor" value={movie.actor} onChange={handleChange} /> */}
            </label>
                    <select name="actor" value={movie.actor} onChange={handleChange}>
                        <option value="">Select an actor</option>
                        {actors.map((actor) => (
                            <option key={actor._id} value={actor.name}>
                                {actor.name}
                            </option>
                        ))}
                    </select>
            <label>
                Serial Number:
                <input type="text" name="serialNumber" value={movie.serialNumber} onChange={handleChange} />
            </label>
            <label>
                Plex Registered:
                <input type="checkbox" name="plexRegistered" checked={movie.plexRegistered} onChange={handleCheckboxChange} />
            </label>
            <label>
                Subscription:
                <input type="checkbox" name="subscriptExist" checked={movie.subscriptExist} onChange={handleCheckboxChange} />
            </label>
            <label>
                Release Date:
                <input type="date" name="releaseDate" value={movie.releaseDate} onChange={handleChange} />
            </label>
            <label>
                Trailer Movie Path:
                <input type="text" name="trailer" value={movie.trailer} onChange={handleChange} />
            </label>
            <label>
                Main Movie Path:
                <input type="text" name="mainMovie" value={movie.mainMovie} onChange={handleChange} />
            </label>
            
            <button type="submit">Save Changes</button>
        </form>
    );
}

export default EditMovie;