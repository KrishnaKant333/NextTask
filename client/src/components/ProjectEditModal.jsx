import { useState, useEffect } from "react";
import { X, FolderEdit } from "lucide-react";

const PROJECT_PALETTE = [
  "#6366f1", // Indigo
  "#3b82f6", // Blue
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#f43f5e", // Rose
  "#8b5cf6"  // Purple
];

function ProjectEditModal({ project, isOpen, onClose, onSave }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PROJECT_PALETTE[0]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (project) {
      setName(project.name || "");
      setDescription(project.description || "");
      setColor(project.color || PROJECT_PALETTE[0]);
      setError("");
    }
  }, [project, isOpen]);

  if (!isOpen || !project) return null;

  function handleSubmit(e) {
    if (e) e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Project name is required");
      return;
    }

    onSave(project._id, {
      name: trimmed,
      description: description.trim(),
      color
    });

    onClose();
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose} onKeyDown={handleKeyDown}>
      <div
        className="modal-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-project-title"
      >
        <div className="modal-header">
          <div className="modal-header-brand">
            <FolderEdit size={16} strokeWidth={2} />
            <h2 id="edit-project-title" className="modal-title">Edit Project</h2>
          </div>
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
            <label htmlFor="edit-project-name">Project Name</label>
            <input
              id="edit-project-name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              placeholder="Project name"
              autoFocus
            />
          </div>

          <div className="form-field">
            <label htmlFor="edit-project-description">Description</label>
            <input
              id="edit-project-description"
              type="text"
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short summary of this project's goals"
            />
          </div>

          <div className="form-field">
            <label>Color Identifier</label>
            <div className="color-swatch-picker" role="radiogroup" aria-label="Project Color">
              {PROJECT_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch ${color === c ? "selected" : ""}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  aria-label={`Select color ${c}`}
                />
              ))}
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

export default ProjectEditModal;
