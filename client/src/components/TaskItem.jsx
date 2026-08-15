import { useState } from "react";

function TaskItem({
    task,
    deleteTask,
    toggleComplete,
    editTask
}) {
    const [editing, setEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);

    function startEditing() {
        setEditing(true);
        setEditTitle(task.title);
    }

    function cancelEditing() {
        setEditing(false);
        setEditTitle(task.title);
    }

    async function saveEdit() {
        const title = editTitle.trim();

        if (title === "") return;

        await editTask(task._id, title);
        setEditing(false);
    }

    if (editing) {
        return (
            <div className="task-item editing">
                <input
                    className="edit-input"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            saveEdit();
                        }
                        if (e.key === "Escape") {
                            cancelEditing();
                        }
                    }}
                    autoFocus
                />
                <button className="save-btn" onClick={saveEdit}>💾</button>
                <button className="cancel-btn" onClick={cancelEditing}>❌</button>
            </div>
        );
    }
    return (
        <div className="task-item">
            <span
                className={`task-title ${task.completed ? "completed" : ""}`}
                onClick={() => toggleComplete(task._id)}
            >
                <span className="checkbox">
                    {task.completed ? "✓" : ""}
                </span>

                {task.title}
            </span>
            <div className="task-actions">
                <button
                    className="edit-btn"
                    onClick={startEditing}>
                    ✏️
                </button>
                <button
                    className="delete-btn"
                    onClick={() => deleteTask(task._id)}
                >
                    ❌
                </button>
            </div>
        </div>
    );
}

export default TaskItem;