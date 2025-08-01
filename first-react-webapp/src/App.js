// axios 인터셉터로 accessToken 자동 부착 및 refreshToken 활용 자동화
import axios from 'axios';
import Config from './Config';
import RegistInfo from "./RegistInfo";
import AMovieList from './AMovieList';
import AMovieDetail from "./AMoiveDetail";
import { BrowserRouter as Router, Route, Routes,Link } from 'react-router-dom';
import './Styles/App.css';
import EditMovie from "./EditMovie";
import { useState,useEffect } from "react";
import Login from "./Login";
import { useLocation } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import AdminPage from './AdminPage';
import { useNavigate } from 'react-router-dom';

// 요청 인터셉터: accessToken 자동 부착
axios.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터: 401 발생 시 refreshToken으로 재발급 시도
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const res = await axios.post(`${Config.apiUrl}/api/auth/refresh`, { refreshToken });
          const { accessToken } = res.data;
          localStorage.setItem('accessToken', accessToken);
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
          return axios(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isNSFWContentBlured, setIsNSFWContentBlured] = useState(true);
  const location = useLocation();
  const [scrollPositions, setScrollPositions] = useState({});
  const [loginRole, setLoginRole] = useState(null);
  const [logoutTrigger, setLogoutTrigger] = useState(0); // 로그아웃 트리거
  const navigate = useNavigate();

    useEffect(() => {
        const accessToken = localStorage.getItem('accessToken');
        const nsfwToggle= localStorage.getItem("nsfwtoggle");
        if (accessToken) {
            setIsAuthenticated(true);
            const { role } = jwtDecode(accessToken);
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
        setLoginRole(_loginRole);
    };


    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setLoginRole(null);
        setIsAuthenticated(false);
        setLogoutTrigger(prev => prev + 1); // 트리거 증가
        navigate('/'); // 홈으로 이동
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
                <h1>Control-Room Collection</h1>
                 {/* 토글 버튼 */}
                 <fieldset>
                    <label>
                            <input role="switch" type="checkbox" checked={isNSFWContentBlured} onChange={handleToggle} />
                            <span>NSFW SAFE</span>
                    </label>
                </fieldset>
                <nav>
                    <Link to="/">Home</Link>
                    {isAuthenticated && loginRole === "admin" ? <Link to="/add">Add Movie</Link> : <></>}
                    {isAuthenticated && loginRole === "admin" ? <Link to="/admin">AdminPage</Link> : <></>}
                    {isAuthenticated ? (<button onClick={handleLogout}>Logout</button>) : 
                    (<Link to="/login">Login</Link>)}
                </nav>
                
                
                <Routes>
                    <Route path="/" element={<AMovieList isAuthenticated={isAuthenticated} isNSFWContentBlured={isNSFWContentBlured} handleLogout={handleLogout} loginRole={loginRole} logoutTrigger={logoutTrigger}/>} />
                    <Route path="/movies/:id" element={<AMovieDetail isAuthenticated={isAuthenticated} isNSFWContentBlured={isNSFWContentBlured}/>} />
                    <Route path="/add" element={<RegistInfo/>} />
                    <Route path="edit/:id" element={<EditMovie/>}/>
                    <Route path="/login" element={<Login onLogin={handleLogin}/>}/>
                    <Route path="/admin" element={<AdminPage/>}/>
                </Routes>
            </div>
        // </Router>
  )

}

export default App;
