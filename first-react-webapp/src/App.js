
import RegistInfo from "./RegistInfo";
import AMovieList from './AMovieList';
import AMovieDetail from "./AMoiveDetail";
import { BrowserRouter as Router, Route, Routes,Link } from 'react-router-dom';
import './Styles/App.css';

function App() {

 

  return (
   
    <Router>
            <div className="app">
                <h1>Movie App</h1>
                <nav>
                    <Link to="/">Home</Link>
                    <Link to="/add">Add Movie</Link>
                </nav>
               
                
                <Routes>
                    <Route path="/" element={<AMovieList/>} />
                    <Route path="/movies/:id" element={<AMovieDetail/>} />
                    <Route path="/add" element={<RegistInfo/>} />
                </Routes>
            </div>
        </Router>
  )

}

export default App;
