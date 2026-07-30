import { useState } from "react";
import './App.css'

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

  let total = tasks.length;
  let completed = tasks.filter(task => task.completed).length;
  let remaining = total - completed;

  return (
    <div>
      <h1>{heading}</h1>
      <div>
        <p>Total : {total}</p>
        <p>Completed : {completed}</p>
        <p>Remaining : {remaining}</p>
      </div>
      <input
        type="text"
        value={newTask}
        onChange={(e) => setNewTask(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            addTask();
          }
        }}
      />

      <button onClick={addTask}>Add</button>

      {tasks.map(task => {
        return <div key={task.id}>
          <span
            onClick={() => toggleComplete(task.id)}
            style={{
              textDecoration: task.completed
                ? "line-through"
                : "none",
              cursor: "pointer"
            }}
          >
            {task.completed ? "✅" : "⬜"}
            {task.title}
          </span>
          <button
            onClick={() => {
              deleteTask(task.id)
            }}
            style={{ cursor: "pointer" }}
          >
            ❌</button>
        </div>
      })}
    </div>
  );

}

export default App;
