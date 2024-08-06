import Button from "./Button";
import styles from "./App.module.css"

function App() {
  return (
    <div>
      <h1 className={styles.title}>Start React!</h1>
      <Button text="react button"/>
    </div>
  );
}

export default App;
