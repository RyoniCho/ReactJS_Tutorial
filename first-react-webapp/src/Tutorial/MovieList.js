import { useEffect, useState } from "react";
import './Styles/MovieList.css';


function MovieList()
{
    const [loading,setLoading] = useState(true);
    const [movies, setMovies] = useState([]);
    const getMovies = async () => {
     const json = await (
       await fetch(
         `https://yts.mx/api/v2/list_movies.json?minimum_rating=8.8&sort_by=year`
       )
     ).json();
     setMovies(json.data.movies);
     setLoading(false);
   };

   useEffect(()=>{
    getMovies();
   },[]);

    return (

        <div>
             {loading? (<h2>Loading...</h2>) :(
            <div className="movie-list">
                <h1>Movie List</h1><br/>
                {
                    movies.map(movie=>(
                    
                        <div key={movie.id} className="movie-item">
                        <img src={movie.medium_cover_image} />
                        <h3>{movie.title}</h3>
                        <p>{movie.summary}</p>
                        <ul>
                          {movie.genres.map((g) => (
                            <li key={g}>{g}</li>
                          ))}
                        </ul>
                      </div>
                    ))
                }
             </div>


        )
        }

        </div>
       
    );
       

}


export default MovieList;