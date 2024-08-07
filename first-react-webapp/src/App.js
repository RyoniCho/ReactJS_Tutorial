import Button from "./Button";
import styles from "./App.module.css"
import { useState } from "react";
import TodoList from "./TodoList"
import CoinTracker from "./CoinTracker";
function App() {

 

  return (
    <div>
      {/* <TodoList/> */}
      <CoinTracker/>
    </div>
  )

}

export default App;
