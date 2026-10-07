import {
  Inbox,
  Calendar,
  CalendarDays,
  CheckSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Pencil,
  Trash2,
  Folder,
  BarChart2,
  LogOut,
  LogIn
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Sidebar({
  projects,
  selectedView,
  onSelectView,
  taskCounts,
  isCollapsed,
  onToggleCollapse,
  onOpenNewProject,
  onEditProject,
  onDeleteProject
}) {
  const { user, isAuthenticated, logout, openAuthModal, openProfileModal } = useAuth();

  return (
    <aside className={`workspace-sidebar ${isCollapsed ? "collapsed" : ""}`}>
      {/* 1. Sidebar Header */}
      <div className="sidebar-header">
        {!isCollapsed && (
          <div className="sidebar-brand">
            <div className="brand-badge-sm">
              <CheckSquare size={14} strokeWidth={2.5} />
            </div>
            <span className="sidebar-brand-title">NextTask</span>
          </div>
        )}
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen size={16} strokeWidth={2} />
          ) : (
            <PanelLeftClose size={16} strokeWidth={2} />
          )}
        </button>
      </div>

      {/* 2. System Views Navigation */}
      <nav className="sidebar-nav" aria-label="Main Navigation">
        <div className="nav-group">
          {!isCollapsed && <span className="nav-group-label">Focus</span>}


          <button
            type="button"
            className={`nav-item ${selectedView === "inbox" ? "active" : ""}`}
            onClick={() => onSelectView("inbox")}
            title="Inbox"
          >
            <span className="nav-item-content">
              <Inbox size={15} strokeWidth={2} className="nav-icon" />
              {!isCollapsed && <span className="nav-label">Inbox</span>}
            </span>
            {!isCollapsed && taskCounts.inbox > 0 && (
              <span className="nav-badge">{taskCounts.inbox}</span>
            )}
          </button>

          <button
            type="button"
            className={`nav-item ${selectedView === "all" ? "active" : ""}`}
            onClick={() => onSelectView("all")}
            title="All Tasks"
          >
            <span className="nav-item-content">
              <CheckSquare size={15} strokeWidth={2} className="nav-icon" />
              {!isCollapsed && <span className="nav-label">All Tasks</span>}
            </span>
            {!isCollapsed && taskCounts.all > 0 && (
              <span className="nav-badge">{taskCounts.all}</span>
            )}
          </button>

          <button
            type="button"
            className={`nav-item ${selectedView === "today" ? "active" : ""}`}
            onClick={() => onSelectView("today")}
            title="Today"
          >
            <span className="nav-item-content">
              <Calendar size={15} strokeWidth={2} className="nav-icon" />
              {!isCollapsed && <span className="nav-label">Today</span>}
            </span>
            {!isCollapsed && taskCounts.today > 0 && (
              <span className="nav-badge highlight">{taskCounts.today}</span>
            )}
          </button>

          <button
            type="button"
            className={`nav-item ${selectedView === "upcoming" ? "active" : ""}`}
            onClick={() => onSelectView("upcoming")}
            title="Upcoming"
          >
            <span className="nav-item-content">
              <CalendarDays size={15} strokeWidth={2} className="nav-icon" />
              {!isCollapsed && <span className="nav-label">Upcoming</span>}
            </span>
            {!isCollapsed && taskCounts.upcoming > 0 && (
              <span className="nav-badge">{taskCounts.upcoming}</span>
            )}
          </button>

          <button
            type="button"
            className={`nav-item ${selectedView === "analytics" ? "active" : ""}`}
            onClick={() => onSelectView("analytics")}
            title="Analytics & Reporting"
          >
            <span className="nav-item-content">
              <BarChart2 size={15} strokeWidth={2} className="nav-icon" />
              {!isCollapsed && <span className="nav-label">Analytics</span>}
            </span>
          </button>
        </div>

        {/* 3. Projects Section */}
        <div className="nav-group projects-group">
          {!isCollapsed ? (
            <div className="projects-header">
              <span className="nav-group-label">Projects</span>
              <button
                type="button"
                className="add-project-btn"
                onClick={onOpenNewProject}
                title="Create new project"
                aria-label="Create new project"
              >
                <Plus size={13} strokeWidth={2.2} />
              </button>
            </div>
          ) : (
            <div className="collapsed-project-divider" title="Projects">
              <Folder size={15} strokeWidth={2} className="nav-icon" />
            </div>
          )}

          <div className="projects-list">
            {projects.length === 0 && !isCollapsed ? (
              <div className="empty-projects-hint">
                <span>No projects yet</span>
              </div>
            ) : (
              projects.map((project) => {
                const count = taskCounts.projects[project._id] || 0;
                const isActive = selectedView === project._id;

                return (
                  <div
                    key={project._id}
                    className={`nav-item project-nav-item ${isActive ? "active" : ""}`}
                    onClick={() => onSelectView(project._id)}
                    title={project.name}
                  >
                    <span className="nav-item-content">
                      <span
                        className="project-dot"
                        style={{ backgroundColor: project.color || "#6366f1" }}
                      />
                      {!isCollapsed && (
                        <span className="nav-label project-name">
                          {project.name}
                        </span>
                      )}
                    </span>

                    {!isCollapsed && (
                      <div className="project-item-tail">
                        {count > 0 && (
                          <span className="nav-badge project-count">{count}</span>
                        )}
                        <div className="project-actions">
                          <button
                            type="button"
                            className="project-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditProject(project);
                            }}
                            title={`Edit ${project.name}`}
                            aria-label={`Edit ${project.name}`}
                          >
                            <Pencil size={12} strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            className="project-action-btn danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteProject(project._id, project.name);
                            }}
                            title={`Delete ${project.name}`}
                            aria-label={`Delete ${project.name}`}
                          >
                            <Trash2 size={12} strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </nav>

      {/* 4. Sidebar User Profile Footer */}
      <div className="sidebar-profile-footer">
        {isAuthenticated && user ? (
          <div
            className="sidebar-user-card"
            onClick={openProfileModal}
            title={`${user.name} (${user.email}) — Click for Account Settings`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openProfileModal();
              }
            }}
          >
            <div
              className="user-avatar-badge"
              style={{ backgroundColor: user.avatarColor || "#38bdf8" }}
            >
              {user.name
                ? user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "U"}
            </div>
            {!isCollapsed && (
              <div className="user-details">
                <span className="user-display-name">{user.name}</span>
                <span className="user-display-email">{user.email}</span>
              </div>
            )}
            <button
              type="button"
              className="user-logout-btn"
              onClick={(e) => {
                e.stopPropagation();
                logout();
              }}
              title="Sign out of workspace"
              aria-label="Sign out of workspace"
            >
              <LogOut size={14} strokeWidth={2} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="sidebar-signin-btn"
            onClick={() => openAuthModal("login")}
            title="Sign in"
          >
            <LogIn size={15} strokeWidth={2} />
            {!isCollapsed && <span>Sign In</span>}
          </button>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
