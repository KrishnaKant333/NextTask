import { useState } from "react";
import './App.css'

function App() {
  const heading = "NextTask";
  const [tasks, setTasks] = useState([
  "Learn React",
  "Complete Java Assignment",
  "Go to Gym"
]);

const [newTask, setNewTask] = useState("");

return(
  <div>
    <h1>{heading}</h1>
    <input type="text"></input>
    <button>Add</button>
    {tasks.map((task, index)=>{
      return <p key={index}>{task}</p>
    })}
  </div>
);

}


export default App;
