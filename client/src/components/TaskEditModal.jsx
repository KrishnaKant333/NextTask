import { useState, useEffect } from "react";
import { X, Calendar, Flag, Folder, Tag, ListChecks, Check, Trash2, Plus, Timer } from "lucide-react";

function TaskEditModal({ task, isOpen, onClose, onSave, projects = [] }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [projectId, setProjectId] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setPriority(task.priority || "medium");
      setProjectId(task.projectId?._id || task.projectId || "");
      setTags(Array.isArray(task.tags) ? [...task.tags] : []);
      setTagInput("");
      setSubtasks(Array.isArray(task.subtasks) ? [...task.subtasks] : []);
      setNewSubtaskTitle("");
      setEstimatedPomodoros(task.estimatedPomodoros || 1);
      if (task.dueDate) {
        const d = new Date(task.dueDate);
        const isoStr = !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : "";
        setDueDate(isoStr);
      } else {
        setDueDate("");
      }
      setError("");
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  function handleAddTag() {
    const raw = tagInput.trim().replace(/^#/, "").toLowerCase();
    if (!raw) return;
    if (!tags.includes(raw)) {
      setTags([...tags, raw]);
    }
    setTagInput("");
  }

  function handleTagKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag();
    }
  }

  function handleRemoveTag(tagToRemove) {
    setTags(tags.filter((t) => t !== tagToRemove));
  }

  function handleAddSubtask() {
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;
    setSubtasks([...subtasks, { title: trimmed, completed: false }]);
    setNewSubtaskTitle("");
  }

  function handleToggleSubtaskCheck(index) {
    setSubtasks((prev) =>
      prev.map((s, i) => (i === index ? { ...s, completed: !s.completed } : s))
    );
  }

  function handleRemoveSubtask(index) {
    setSubtasks((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e) {
    if (e) e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Task title cannot be empty");
      return;
    }

    onSave(task._id, {
      title: trimmed,
      priority,
      dueDate: dueDate ? dueDate : null,
      projectId: projectId || null,
      tags,
      subtasks,
      estimatedPomodoros: Number(estimatedPomodoros) || 1
    });
    onClose();
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") {
      onClose();
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} onKeyDown={handleKeyDown}>
      <div 
        className="modal-panel" 
        onClick={(e) => e.stopPropagation()} 
        role="dialog" 
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">Edit Task</h2>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="modal-error-banner">{error}</div>}

          <div className="form-field">
            <label htmlFor="edit-task-title">Title</label>
            <input
              id="edit-task-title"
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError("");
              }}
              placeholder="Task title..."
              autoFocus
            />
          </div>

          <div className="form-field">
            <label htmlFor="edit-task-project">
              <Folder size={12} strokeWidth={2} /> Project
            </label>
            <select
              id="edit-task-project"
              className="form-select"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">No Project (Inbox)</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags Editor */}
          <div className="form-field">
            <label htmlFor="edit-task-tags">
              <Tag size={12} strokeWidth={2} /> Tags
            </label>
            <div className="tag-chips-wrap">
              {tags.map((tag) => (
                <span key={tag} className="tag-chip">
                  <span className="tag-hash">#</span>{tag}
                  <button
                    type="button"
                    className="tag-chip-remove"
                    onClick={() => handleRemoveTag(tag)}
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X size={11} strokeWidth={2.5} />
                  </button>
                </span>
              ))}
              <input
                id="edit-task-tags"
                type="text"
                className="tag-input-inline"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={handleAddTag}
                placeholder={tags.length === 0 ? "Type tag & press Enter (e.g. urgent, dev)" : "Add tag..."}
              />
            </div>
          </div>

          {/* Subtasks Checklist Editor */}
          <div className="form-field">
            <div className="subtasks-header-row">
              <label>
                <ListChecks size={12} strokeWidth={2} /> Subtasks
              </label>
              {subtasks.length > 0 && (
                <span className="subtasks-progress-label">
                  {subtasks.filter((s) => s.completed).length} of {subtasks.length} completed
                </span>
              )}
            </div>

            {subtasks.length > 0 && (
              <div className="modal-subtask-list">
                {subtasks.map((st, idx) => (
                  <div key={st._id || idx} className="modal-subtask-item">
                    <button
                      type="button"
                      className={`modal-subtask-check ${st.completed ? "checked" : ""}`}
                      onClick={() => handleToggleSubtaskCheck(idx)}
                      aria-label={st.completed ? "Mark subtask incomplete" : "Mark subtask complete"}
                    >
                      {st.completed && <Check size={11} strokeWidth={3} />}
                    </button>
                    <span className={`modal-subtask-title ${st.completed ? "completed" : ""}`}>
                      {st.title}
                    </span>
                    <button
                      type="button"
                      className="modal-subtask-delete"
                      onClick={() => handleRemoveSubtask(idx)}
                      title="Delete subtask"
                      aria-label="Delete subtask"
                    >
                      <Trash2 size={12} strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="subtask-add-bar">
              <input
                type="text"
                className="form-input subtask-add-input"
                placeholder="Add a step / checklist item... (press Enter)"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
              />
              <button
                type="button"
                className="subtask-add-btn"
                onClick={handleAddSubtask}
                title="Add subtask"
              >
                <Plus size={14} strokeWidth={2} />
              </button>
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-field">
              <label htmlFor="edit-task-priority">
                <Flag size={12} strokeWidth={2} /> Priority
              </label>
              <select
                id="edit-task-priority"
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="edit-task-duedate">
                <Calendar size={12} strokeWidth={2} /> Due Date
              </label>
              <input
                id="edit-task-duedate"
                type="date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="edit-task-pomodoros">
                <Timer size={12} strokeWidth={2} /> Target Pomodoros
              </label>
              <input
                id="edit-task-pomodoros"
                type="number"
                min="1"
                max="20"
                className="form-input font-tabular"
                value={estimatedPomodoros}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setEstimatedPomodoros(isNaN(val) ? 1 : Math.max(1, Math.min(20, val)));
                }}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskEditModal;
