// axios 인터셉터로 accessToken 자동 부착 및 refreshToken 활용 자동화
import axios from 'axios';
import Config from './Config';
import RegistInfo from "./RegistInfo";
import AMovieList from './AMovieList';
import AMovieDetail from "./AMoiveDetail";
import Home from './Home';
import { BrowserRouter as Router, Route, Routes,Link } from 'react-router-dom';
import './Styles/App.css';
import EditMovie from "./EditMovie";
import LatestWatched from "./LatestWatched";
import Favorites from "./Favorites";
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
          if (typeof window.handleLogout === 'function') {
            alert('세션이 만료되었습니다. 다시 로그인 해주세요.');
            window.handleLogout();
          } else {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            alert('세션이 만료되었습니다. 다시 로그인 해주세요.');
            window.location.href = '/login';
          }
        }
      } else {
        if (typeof window.handleLogout === 'function') {
          alert('세션이 만료되었습니다. 다시 로그인 해주세요.');
          window.handleLogout();
        } else {
          localStorage.removeItem('accessToken');
          alert('세션이 만료되었습니다. 다시 로그인 해주세요.');
          window.location.href = '/login';
        }
      }
    }
       // 403 Forbidden: 세션 만료/권한 없음 등 사용자 안내
   if (error.response && error.response.status === 403) {
     alert('접근 권한이 없거나 세션이 만료되었습니다. 다시 로그인 해주세요.');
     if (typeof window.handleLogout === 'function') 
     {
        window.handleLogout();
     } 
     else 
    {
       localStorage.removeItem('accessToken');
       localStorage.removeItem('refreshToken');
       window.location.href = '/login';
     }
     return Promise.reject(error);
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
    const [theme, setTheme] = useState('dark'); // Default to dark
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    const handleThemeToggle = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

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

  // handleLogout을 window에 할당하여 인터셉터에서 접근 가능하게 함
  useEffect(() => {
    window.handleLogout = handleLogout;
    return () => {
    delete window.handleLogout;
    };
  }, []);

    const handleToggle = () =>{
        
        localStorage.setItem("nsfwtoggle",!isNSFWContentBlured);
        setIsNSFWContentBlured(current=>
            current=!current

        );

        
    }

    const getHeaderTitle = () => {
        if (location.pathname === '/list') {
            const searchParams = new URLSearchParams(location.search);
            const category = searchParams.get('category');
            
            if (category === 'AdultVideo') return 'Adult Video';
            if (category) return category;
            return 'All Movie';
        }
        return 'Control-Room';
    };

 

  return (
   
    // <Router>
            <div className="app">
                <header className="app-header">
                    <div className="header-left">
                        {(location.pathname === '/list' || location.pathname === '/latest-watched' || location.pathname === '/favorites') && (
                            <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="3" y1="12" x2="21" y2="12"></line>
                                    <line x1="3" y1="6" x2="21" y2="6"></line>
                                    <line x1="3" y1="18" x2="21" y2="18"></line>
                                </svg>
                            </button>
                        )}
                        <h1>{getHeaderTitle()}</h1>
                    </div>
                    
                    <nav className="header-nav">
                        <Link to="/">Home</Link>
                        <Link to="/latest-watched">Recent</Link>
                        <Link to="/favorites">Favorite</Link>
                        {isAuthenticated && loginRole === "admin" ? <Link to="/add">Add</Link> : <></>}
                        {isAuthenticated && loginRole === "admin" ? <Link to="/admin">Admin</Link> : <></>}
                        {isAuthenticated ? (<button className="nav-btn" onClick={handleLogout}>Logout</button>) : 
                        (<Link to="/login">Login</Link>)}
                    </nav>

                    <div className="header-toggles">
                        <label className="toggle-switch" title="Dark Mode">
                            <input type="checkbox" checked={theme === 'dark'} onChange={handleThemeToggle} />
                            <span className="slider round"></span>
                            <span className="toggle-icon">{theme === 'dark' ? '🌙' : '☀️'}</span>
                        </label>
                        <label className="toggle-switch" title="NSFW Safe">
                            <input type="checkbox" checked={isNSFWContentBlured} onChange={handleToggle} />
                            <span className="slider round"></span>
                            <span className="toggle-icon">{isNSFWContentBlured ? '🔒' : '🔓'}</span>
                        </label>
                    </div>
                </header>
                
                <div className="main-content">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/list" element={<AMovieList isAuthenticated={isAuthenticated} isNSFWContentBlured={isNSFWContentBlured} handleLogout={handleLogout} loginRole={loginRole} logoutTrigger={logoutTrigger} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}/>} />
                        <Route path="/latest-watched" element={<LatestWatched isNSFWContentBlured={isNSFWContentBlured} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} isAuthenticated={isAuthenticated} />} />
                        <Route path="/favorites" element={<Favorites isNSFWContentBlured={isNSFWContentBlured} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} isAuthenticated={isAuthenticated} />} />
                        <Route path="/movies/:id" element={<AMovieDetail isAuthenticated={isAuthenticated} isNSFWContentBlured={isNSFWContentBlured}/>} />
                        <Route path="/add" element={<RegistInfo/>} />
                        <Route path="edit/:id" element={<EditMovie/>}/>
                        <Route path="/login" element={<Login onLogin={handleLogin}/>}/>
                        <Route path="/admin" element={<AdminPage/>}/>
                    </Routes>
                </div>
            </div>
        // </Router>
  )

}

export default App;
