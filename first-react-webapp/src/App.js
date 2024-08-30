
import RegistInfo from "./RegistInfo";
import AMovieList from './AMovieList';
import AMovieDetail from "./AMoiveDetail";
import { BrowserRouter as Router, Route, Routes,Link } from 'react-router-dom';
import './Styles/App.css';
import EditMovie from "./EditMovie";
import { useState,useEffect } from "react";
import Login from "./Login";


function App() {

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isNSFWContentBlured,setIsNSFWContentBlured] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const nsfwToggle= localStorage.getItem("nsfwtoggle");
        if (token) {
            setIsAuthenticated(true);
        }
        if(nsfwToggle)
        {
            console.log("nsfw localstorage:"+nsfwToggle)
            setIsNSFWContentBlured(nsfwToggle==="true")
        }
        else{
            console.log("nsfw localstoragedddddd")
        }
    }, []);

    const handleLogin = () => {
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
    };

    const handleToggle = () =>{
        
        localStorage.setItem("nsfwtoggle",!isNSFWContentBlured);
        setIsNSFWContentBlured(current=>
            current=!current

        );

        
    }

 

  return (
   
    <Router>
            <div className="app">
                <h1>Movie App</h1>
                 {/* 토글 버튼 */}
                 <fieldset>
                    <label>
                            <input role="switch" type="checkbox" checked={isNSFWContentBlured} onChange={handleToggle} />
                            <span>NSFW SAFE</span>
                    </label>
                </fieldset>
                <nav>
                    <Link to="/">Home</Link>
                    {isAuthenticated? <Link to="/add">Add Movie</Link>:<></>}
                    {isAuthenticated ? (<button onClick={handleLogout}>Logout</button>) : 
                    (<Link to="/login">Login</Link>)}
                     
                    
                    
                </nav>
                
                
                <Routes>
                    <Route path="/" element={<AMovieList isAuthenticated={isAuthenticated} isNSFWContentBlured={isNSFWContentBlured}/>} />
                    <Route path="/movies/:id" element={<AMovieDetail isAuthenticated={isAuthenticated} isNSFWContentBlured={isNSFWContentBlured}/>} />
                    <Route path="/add" element={<RegistInfo/>} />
                    <Route path="edit/:id" element={<EditMovie/>}/>
                    <Route path="/login" element={<Login onLogin={handleLogin}/>}/>
                </Routes>
            </div>
        </Router>
  )

}

export default App;
