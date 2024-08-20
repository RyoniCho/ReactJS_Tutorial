import {  useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './Styles/RegistInfo.css';
import Config from './Config'
import axios from 'axios';
import ExtraImageSlider from "./ExtraImageSlider";

function RegistInfo()
{
    const [serialNumber, setSerialNumber] = useState('');
    const [title, setTitle] = useState('');
    const [image, setImage] = useState(null);
    const [urlImage,setUrlImage] =useState('');
    const [trailer, setTrailer] = useState(null);
    const [plexRegistered, setPlexRegistered] = useState(false);
    const [description, setDescription] = useState('');
    const [releaseDate,setReleaseDate] = useState(Date.now);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    //Actors
    const [actors, setActors] = useState([]);
    const [selectedActor, setSelectedActor] = useState('');
    const [newActor, setNewActor] = useState('');

    //Category
    const [selectedCategory,setSelectedCategory]=useState('');

    //Extra Image Urls
    const [urlsExtraImage, setUrlsExtraImage] = useState([]);

    //Trailer Url
    const [urlTrailer,setUrlTrailer] = useState('');

    const navigate = useNavigate();
    const [error, setError] = useState('');

    useEffect(() => {
        fetchActors(); // 초기화 시 배우 목록을 가져옵니다.
    }, []);

    const fetchActors = async () => {
        try {
            const response = await fetch(`${Config.apiUrl}/api/actors`);
            const data = await response.json();
            setActors(data);
        } catch (error) {
            console.error('Error fetching actors:', error);
        }
    };

    const handleAddActor = async () => {
        if (newActor) {
            try {
                const token = localStorage.getItem('token'); // 로컬 스토리지에서 토큰 가져오기
                const config = {
                    headers: {
                        'Authorization': `Bearer ${token}`, // Authorization 헤더에 JWT 토큰 포함
                         withCredentials: true
                    },
                };
                
                const response = await axios.post(`${Config.apiUrl}/api/actors`, {
                    name: newActor,
                },config);
                const actor = response.data;
                setActors([...actors, actor]); // 배우 목록에 추가
                setSelectedActor(actor.name); // 추가한 배우를 선택
                setNewActor(''); // 입력 필드를 초기화
            } catch (error) {
                console.error('Error adding actor:', error);
            }
        }
    };

   


    const checkSerialNumberExists = async (serialNumber) => {
        try {
            const response = await fetch(`${Config.apiUrl}/api/movies?serialNumber=${serialNumber}`);
            const data = await response.json();
            return data.length > 0; 
        } catch (error) {
            console.error('Error checking serial number:', error);
            return false;
        }
    };

    const FetchInformationsFromWeb =  ()=>{
        if(serialNumber==='')
        {
            setError('it need Serial number to try to fetch image!!');
            return;
        }
        const splitedSerialNumber= serialNumber.split("-");
        const revisedSerialNumber= `${splitedSerialNumber[0].toLowerCase()}00${splitedSerialNumber[1]}`;

        const url =`https://pics.dmm.co.jp/digital/video/${revisedSerialNumber}/${revisedSerialNumber}pl.jpg`

        for(let i=1; i<=10;i++)
        {
            let extraImgUrl=`https://pics.dmm.co.jp/digital/video/${revisedSerialNumber}/${revisedSerialNumber}jp-${i}.jpg`
            setUrlsExtraImage((currentArray) => [extraImgUrl, ...currentArray]);
            
        }
        
        setUrlImage(url);

        const trailerUrl = `https://cc3001.dmm.co.jp/litevideo/freepv/${revisedSerialNumber[0]}/${revisedSerialNumber.substring(0,3)}/${revisedSerialNumber}/${revisedSerialNumber}_mhb_w.mp4`
        
        setUrlTrailer(trailerUrl);
    }

    const OnSubmit = async (e) => {
        e.preventDefault();

        const serialExists = await checkSerialNumberExists(serialNumber);
        if (serialExists) {
            setError('This serial number already exists. Please choose another.');
            return;
        }



        const formData = new FormData();
        formData.append('title', title);
        formData.append('serialNumber', serialNumber);
        formData.append('actor', selectedActor);
        formData.append('plexRegistered', plexRegistered);
        formData.append('image', image);
        formData.append('trailer', trailer);
        formData.append('description', description);
        formData.append('releaseDate', releaseDate);
        formData.append('category',(selectedCategory==="")?"Unknown":selectedCategory);

        formData.append('urlImage',urlImage);
        formData.append('urlTrailer',urlTrailer);
        formData.append('urlsExtraImage',urlsExtraImage);

        setIsUploading(true);
        setUploadProgress(0);

        const token = localStorage.getItem('token'); // 로컬 스토리지에서 토큰 가져오기
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`, // Authorization 헤더에 JWT 토큰 포함
                 withCredentials: true
            },
            onUploadProgress : (progressEvent)=>{
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setUploadProgress(percentCompleted);
            }
        };
        try{
            const response = await axios.post(`${Config.apiUrl}/api/movies`, formData, config);
            // 성공적으로 제출한 후 폼을 초기화
            setTitle('');
            setImage(null);
            setTrailer(null);

            navigate('/'); // 메인 페이지로 이동
        }
        catch(error)
        {
            console.error('Upload failed:', error);
        }
        finally
        {
            setIsUploading(false);
        }
       
      };

    return (
        <div className="movie-form">
            <h2>Add New Movie</h2>
            <form onSubmit={OnSubmit}>
            {error && <div className="error-popup">{error}</div>}
                <div>
                <label>Category:</label>
                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                        <option value="">Select Category</option>
                        {Config.categories.map((cate,index) => (
                            <option key={index} value={cate}>
                                {cate}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>Serial Number:</label>
                    <input
                        type="text"
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        required
                    />
                    {(selectedCategory==="AdultVideo")?(<button type="button" onClick={FetchInformationsFromWeb}>Try to Infomations from web</button>):(<></>)}
                </div>
                <div>
                    <label>Title:</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="제목을 입력하세요."
                        required
                    />
                </div>
                <div>
                    <label>Actor:</label>
                    <select value={selectedActor} onChange={(e) => setSelectedActor(e.target.value)}>
                        <option value="">Select an actor</option>
                        {actors.map((actor) => (
                            <option key={actor._id} value={actor.name}>
                                {actor.name}
                            </option>
                        ))}
                    </select>
                    <div>
                        <input
                            type="text"
                            value={newActor}
                            placeholder="New actor name"
                            onChange={(e) => setNewActor(e.target.value)}
                        />
                        <button type="button" onClick={handleAddActor}>
                            Add Actor
                        </button>
                    </div>
                </div>
                <div>
                    <label>Description:</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    ></textarea>
                </div>
                <div>
                    <label>Plex Registered:</label>
                    <input
                        type="checkbox"
                        checked={plexRegistered}
                        onChange={(e) => setPlexRegistered(e.target.checked)}
                    />
                </div>
                <div>
                    <label>Image:</label>
                   
                    {
                        (urlImage!=='')?(<img class="movie-form-urlimage" src={urlImage}/>):
                        ( 
                        <input
                            type="file"
                            onChange={(e) => setImage(e.target.files[0])}
                            required
                        />)
                    }

                    {(urlsExtraImage.length>0) ? <ExtraImageSlider images={urlsExtraImage}/> : <></>}
                    
                </div>
                <div>
                    <label>Trailer:</label>
                    {
                        (urlTrailer !=='') ?
                        (
                            <video controls className="trailer-fetched">
                            <source src={urlTrailer} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        )
                        
                        :
                        
                        (
                        <input
                        type="file"
                        onChange={(e) => setTrailer(e.target.files[0])}
                        required
                    />
                        )
                    }
                    
                </div>
                <div>
                    <label>Release Date:</label>
                    <input
                        type="date"
                        onChange={(e) => setReleaseDate(e.target.value)}
                        required
                    />
                </div>
                <br></br>
                <div>
                 <button type="submit" disabled={isUploading}>{isUploading ? 'Uploading...' : 'Add Movie'}</button>
                </div>
                {isUploading && (
                <div className="progress-bar">
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${uploadProgress}%` }}
                    ></div>
                </div>
)}
                

              
            </form>
        </div>
        
    );

}


export default RegistInfo;
