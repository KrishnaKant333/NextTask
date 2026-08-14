import { useEffect, useState } from "react";
import './App.css'
import TaskItem from "./components/TaskItem";
import { getTasks } from "./services/taskService";
function App() {
  const heading = "NextTask";
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Learn React",
      completed: false
    },

    {
      id: 2,
      title: "Complete Java Assignment",
      completed: false
    },

    {
      id: 3,
      title: "Go to Gym",
      completed: false
    },
  ]);

  const [newTask, setNewTask] = useState("");

  function addTask() {
    const task = newTask.trim();
    if (task === "") return;
    if (
      tasks.some(
        t =>
          t.title.toLowerCase() === task.toLowerCase()
      )
    ) return;
    setTasks([
      ...tasks,
      {
        id: Date.now(),
        title: task,
        completed: false
      }
    ]);
    setNewTask("");
  }

  function deleteTask(id) {
    setTasks(
      tasks.filter(task => task.id !== id)
    );
  }

  function toggleComplete(id) {
    setTasks(
      tasks.map(task => {
        if (task.id === id) {
          return {
            ...task,
            completed: !task.completed
          };
        }
        return task;
      })
    );
  }
  
  useEffect(()=>{
    async function loadTasks(){
      const data = await getTasks();
      console.log(data);      
    }
    loadTasks();
  }, []);

  let total = tasks.length;
  let completed = tasks.filter(task => task.completed).length;
  let remaining = total - completed;

  return (
    <div>
      <h1 className="nexttask">{heading}</h1>
      <div className="task-count">
        <p>Total : {total}</p>
        <p>Completed : {completed}</p>
        <p>Remaining : {remaining}</p>
      </div>

      <div className="input-field">
        <input
        className="input-box"
          type="text"
          id="form"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addTask();
            }
          }}
        />

        <button className="add-btn" onClick={addTask}>+</button>
      </div>

      {tasks.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          deleteTask={deleteTask}
          toggleComplete={toggleComplete}
        />
      ))}
    </div>
  );
}

export default App;
