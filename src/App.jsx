import { useState } from "react";
import './App.css'

function App() {
  const [count, setCount] = useState(0);
  function increase(){
    setCount(count+1);
  }
  function decrease(){
    if (count>0) {
      setCount(count-1);    
    }
  }
  return (
    <div>
      <h1>{count}</h1>
      <button onClick={decrease}>-</button>
      {" "}
      <button onClick={increase}>+</button>
    </div>
  );
}

export default App;
