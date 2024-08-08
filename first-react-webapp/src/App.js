import Button from "./Button";
import styles from "./App.module.css"
import { useState } from "react";
import TodoList from "./TodoList"
import CoinTracker from "./CoinTracker";
import MovieList from "./MovieList";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

function App() {

 

  return (
    <div>
      {/* <TodoList/> */}
      {/* <CoinTracker/> */}
      <Router>
      <div>
        <h1>Movie App</h1>
        <Routes>
        
          <Route path="/" element={<MovieList/>} />
         
        </Routes>
      </div>
    </Router>
    </div>
  )

}

export default App;
