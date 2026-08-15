import { useEffect, useState } from "react";
import './App.css'
import TaskItem from "./components/TaskItem";
import { getTasks, createTask, deleteTask as deleteTaskAPI, updateTask } from "./services/taskService";


function App() {
  const heading = "NextTask";
  const [tasks, setTasks] = useState([]);

  const [newTask, setNewTask] = useState("");

  async function addTask() {
    const task = newTask.trim();
    if (task === "") return;
    if (
      tasks.some(
        t =>
          t.title.toLowerCase() === task.toLowerCase()
      )
    ) return;
    const createdTask = await createTask(task);
    setTasks([...tasks, createdTask]);
    setNewTask("");
  }

  async function deleteTask(id) {
    await deleteTaskAPI(id);
    setTasks(
      tasks.filter(task => task._id !== id)
    );
  }

  async function toggleComplete(id) {
    const task = tasks.find(task => task._id === id);
    if(!task) return;
    
    const updatedTask = await updateTask(id,{
      completed: !task.completed
    });

    setTasks(
      tasks.map(task=>
        task._id === id
        ? updatedTask
        : task
      )
    );      
  }
  
  useEffect(()=>{
    async function loadTasks(){
      const data = await getTasks();
      setTasks(data);
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
          key={task._id}
          task={task}
          deleteTask={deleteTask}
          toggleComplete={toggleComplete}
        />
      ))}
    </div>
  );
}

export default App;
