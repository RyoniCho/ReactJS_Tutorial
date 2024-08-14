
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

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = () => {
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
    };

 

  return (
   
    <Router>
            <div className="app">
                <h1>Movie App</h1>
                <nav>
                    <Link to="/">Home</Link>
                    {isAuthenticated? <Link to="/add">Add Movie</Link>:<></>}
                    {isAuthenticated ? (<button onClick={handleLogout}>Logout</button>) : 
                    (<Link to="/login">Login</Link>)}
                </nav>
               
                
                <Routes>
                    <Route path="/" element={<AMovieList isAuthenticated={isAuthenticated}/>} />
                    <Route path="/movies/:id" element={<AMovieDetail isAuthenticated={isAuthenticated}/>} />
                    <Route path="/add" element={<RegistInfo/>} />
                    <Route path="edit/:id" element={<EditMovie/>}/>
                    <Route path="/login" element={<Login onLogin={handleLogin}/>}/>
                </Routes>
            </div>
        </Router>
  )

}

export default App;
