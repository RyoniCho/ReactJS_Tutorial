
import RegistInfo from "./RegistInfo";
import AMovieList from './AMovieList';
import AMovieDetail from "./AMoiveDetail";
import { BrowserRouter as Router, Route, Routes,Link } from 'react-router-dom';
import './Styles/App.css';
import EditMovie from "./EditMovie";
import { useState,useEffect } from "react";
import Login from "./Login";
import { useLocation } from 'react-router-dom';
import jwt_decode from "jwt-decode";


function App() {

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isNSFWContentBlured,setIsNSFWContentBlured] = useState(true);
  const location = useLocation();
  const [scrollPositions, setScrollPositions] = useState({});
  const [loginRole, setLoginRole] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const nsfwToggle= localStorage.getItem("nsfwtoggle");
        if (token) {
            setIsAuthenticated(true);
            const { role } = jwt_decode(token);
            setLoginRole(role);
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

    useEffect(() => {
        // 페이지를 떠날 때 스크롤 위치를 저장
        return () => {
          setScrollPositions((prev) => ({
            ...prev,
            [location.pathname]: window.scrollY,
          }));
        };
      }, [location.pathname]);
    
      useEffect(() => {
        // 새 경로로 이동 시 저장된 위치로 스크롤 복원
        const savedPosition = scrollPositions[location.pathname];
        if (savedPosition !== undefined) {
          window.scrollTo(0, savedPosition);
        }
      }, [location.pathname, scrollPositions]);

      

    const handleLogin = (_loginRole) => {
        setIsAuthenticated(true);
        setRole(_loginRole);
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
   
    // <Router>
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
                    {isAuthenticated&&role==="admin" ? <Link to="/add">Add Movie</Link>:<></>}
                    {isAuthenticated ? (<button onClick={handleLogout}>Logout</button>) : 
                    (<Link to="/login">Login</Link>)}
                     
                    
                    
                </nav>
                
                
                <Routes>
                    <Route path="/" element={<AMovieList isAuthenticated={isAuthenticated} isNSFWContentBlured={isNSFWContentBlured} handleLogout={handleLogout} loginRole={loginRole}/>} />
                    <Route path="/movies/:id" element={<AMovieDetail isAuthenticated={isAuthenticated} isNSFWContentBlured={isNSFWContentBlured}/>} />
                    <Route path="/add" element={<RegistInfo/>} />
                    <Route path="edit/:id" element={<EditMovie/>}/>
                    <Route path="/login" element={<Login onLogin={handleLogin}/>}/>
                </Routes>
            </div>
        // </Router>
  )

}

export default App;
