import { useState } from "react";
import { CheckCircle2, Circle, Folder, Trash2, X, Tag } from "lucide-react";

function BulkActionBar({
  selectedCount,
  projects = [],
  onClearSelection,
  onBulkComplete,
  onBulkMoveProject,
  onBulkDelete,
  onBulkAddTag
}) {
  const [tagInputOpen, setTagInputOpen] = useState(false);
  const [tagText, setTagText] = useState("");

  if (selectedCount === 0) return null;

  function handleTagSubmit(e) {
    if (e) e.preventDefault();
    const clean = tagText.trim().replace(/^#/, "").toLowerCase();
    if (clean) {
      onBulkAddTag(clean);
      setTagText("");
      setTagInputOpen(false);
    }
  }

  return (
    <div className="bulk-action-bar" role="toolbar" aria-label="Bulk actions">
      <div className="bulk-count-badge">
        <span>{selectedCount} selected</span>
      </div>

      <div className="bulk-actions-group">
        {/* Mark Complete */}
        <button
          type="button"
          className="bulk-action-btn"
          onClick={() => onBulkComplete(true)}
          title="Mark selected as complete"
        >
          <CheckCircle2 size={14} strokeWidth={2} />
          <span>Complete</span>
        </button>

        {/* Mark Active */}
        <button
          type="button"
          className="bulk-action-btn"
          onClick={() => onBulkComplete(false)}
          title="Mark selected as incomplete"
        >
          <Circle size={14} strokeWidth={2} />
          <span>Active</span>
        </button>

        {/* Move to Project */}
        <div className="bulk-select-wrap" title="Move selected to project">
          <Folder size={13} strokeWidth={2} className="bulk-select-icon" />
          <select
            className="bulk-project-select"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value !== "") {
                onBulkMoveProject(e.target.value === "inbox" ? null : e.target.value);
                e.target.value = "";
              }
            }}
            aria-label="Move selected tasks to project"
          >
            <option value="" disabled>
              Move to...
            </option>
            <option value="inbox">Inbox (No project)</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Add Tag */}
        {tagInputOpen ? (
          <form onSubmit={handleTagSubmit} className="bulk-tag-inline-form">
            <input
              type="text"
              className="bulk-tag-input"
              placeholder="Tag name..."
              value={tagText}
              onChange={(e) => setTagText(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Escape") setTagInputOpen(false);
              }}
            />
            <button type="submit" className="bulk-tag-submit-btn">
              Add
            </button>
            <button
              type="button"
              className="bulk-tag-cancel-btn"
              onClick={() => setTagInputOpen(false)}
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          </form>
        ) : (
          <button
            type="button"
            className="bulk-action-btn"
            onClick={() => setTagInputOpen(true)}
            title="Add tag to selected"
          >
            <Tag size={13} strokeWidth={2} />
            <span>Tag</span>
          </button>
        )}

        {/* Delete */}
        <button
          type="button"
          className="bulk-action-btn danger"
          onClick={onBulkDelete}
          title="Delete selected tasks"
        >
          <Trash2 size={14} strokeWidth={2} />
          <span>Delete</span>
        </button>
      </div>

      {/* Clear Selection */}
      <button
        type="button"
        className="bulk-close-btn"
        onClick={onClearSelection}
        title="Deselect all"
        aria-label="Deselect all"
      >
        <X size={14} strokeWidth={2} />
      </button>
    </div>
  );
}

export default BulkActionBar;
