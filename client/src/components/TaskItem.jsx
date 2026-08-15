function TaskItem({
    task,
    deleteTask,
    toggleComplete
}) {
    return (
        <div>
            <span
                className="dlt-btn"
                onClick={() => toggleComplete(task._id)}
                style={{
                    textDecoration:
                        task.completed
                            ? "line-through"
                            : "none",
                    cursor: "pointer"
                }}
            >
                {task.completed ? "✅" : "⬜"}
                {task.title}
            </span>
            <button
                onClick={() => deleteTask(task._id)}
            >
                ❌
            </button>
        </div>
    );
}

export default TaskItem;