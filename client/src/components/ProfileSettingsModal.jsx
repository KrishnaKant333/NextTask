import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  X,
  User,
  Sliders,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
  LogOut,
  Calendar,
  Volume2,
  VolumeX,
} from "lucide-react";

const AVATAR_PALETTE = [
  { name: "Sky", color: "#38bdf8" },
  { name: "Indigo", color: "#818cf8" },
  { name: "Purple", color: "#a855f7" },
  { name: "Rose", color: "#f43f5e" },
  { name: "Orange", color: "#f97316" },
  { name: "Emerald", color: "#10b981" },
  { name: "Amber", color: "#fbbf24" },
  { name: "Teal", color: "#2dd4bf" },
];

const FOCUS_DURATIONS = [15, 20, 25, 30, 45, 50, 60];
const SHORT_BREAKS = [3, 5, 10, 15];
const LONG_BREAKS = [10, 15, 20, 30];

function ProfileSettingsModal() {
  const {
    user,
    isProfileModalOpen,
    closeProfileModal,
    updateProfile,
    changePassword,
    logout,
  } = useAuth();

  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "preferences" | "security"

  // Profile Form State
  const [name, setName] = useState("");
  const [avatarColor, setAvatarColor] = useState("#38bdf8");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileStatus, setProfileStatus] = useState({ type: "", message: "" });

  // Preferences Form State
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [shortBreakMinutes, setShortBreakMinutes] = useState(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState(15);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsStatus, setPrefsStatus] = useState({ type: "", message: "" });

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setAvatarColor(user.avatarColor || "#38bdf8");
      if (user.preferences) {
        setPomodoroMinutes(user.preferences.pomodoroMinutes || 25);
        setShortBreakMinutes(user.preferences.shortBreakMinutes || 5);
        setLongBreakMinutes(user.preferences.longBreakMinutes || 15);
        setSoundEnabled(user.preferences.soundEnabled ?? true);
      }
    }
    setProfileStatus({ type: "", message: "" });
    setPrefsStatus({ type: "", message: "" });
    setPasswordStatus({ type: "", message: "" });
  }, [user, isProfileModalOpen]);

  if (!isProfileModalOpen) return null;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "NT";

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Active Member";

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileStatus({ type: "", message: "" });

    if (!name.trim() || name.trim().length < 2) {
      setProfileStatus({
        type: "error",
        message: "Name must be at least 2 characters.",
      });
      return;
    }

    setProfileSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        avatarColor,
      });
      setProfileStatus({
        type: "success",
        message: "Profile updated successfully.",
      });
    } catch (err) {
      setProfileStatus({
        type: "error",
        message: err.message || "Failed to update profile.",
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setPrefsStatus({ type: "", message: "" });
    setPrefsSaving(true);

    try {
      await updateProfile({
        preferences: {
          pomodoroMinutes: Number(pomodoroMinutes),
          shortBreakMinutes: Number(shortBreakMinutes),
          longBreakMinutes: Number(longBreakMinutes),
          soundEnabled: Boolean(soundEnabled),
        },
      });
      setPrefsStatus({
        type: "success",
        message: "Preferences updated and synchronized.",
      });
    } catch (err) {
      setPrefsStatus({
        type: "error",
        message: err.message || "Failed to update preferences.",
      });
    } finally {
      setPrefsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordStatus({ type: "", message: "" });

    if (!currentPassword || !newPassword) {
      setPasswordStatus({
        type: "error",
        message: "Please fill in all password fields.",
      });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStatus({
        type: "error",
        message: "New password must be at least 6 characters.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({
        type: "error",
        message: "New passwords do not match.",
      });
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordStatus({
        type: "error",
        message: "New password cannot be the same as current password.",
      });
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword({
        currentPassword,
        newPassword,
      });
      setPasswordStatus({
        type: "success",
        message: "Password changed successfully. New session token generated.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordStatus({
        type: "error",
        message: err.message || "Failed to change password.",
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="profile-modal-overlay" onClick={closeProfileModal}>
      <div
        className="profile-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="profile-modal-title"
      >
        {/* Modal Header */}
        <div className="profile-modal-header">
          <div className="profile-modal-title-group">
            <h2 id="profile-modal-title" className="profile-modal-title">
              Account Settings
            </h2>
            <span className="profile-modal-subtitle">
              Manage your profile, focus preferences, and credentials
            </span>
          </div>

          <button
            type="button"
            className="profile-modal-close"
            onClick={closeProfileModal}
            aria-label="Close settings"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="profile-modal-tabs" role="tablist">
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
            role="tab"
            aria-selected={activeTab === "profile"}
          >
            <User size={15} strokeWidth={2} />
            <span>Profile</span>
          </button>

          <button
            type="button"
            className={`profile-tab-btn ${activeTab === "preferences" ? "active" : ""}`}
            onClick={() => setActiveTab("preferences")}
            role="tab"
            aria-selected={activeTab === "preferences"}
          >
            <Sliders size={15} strokeWidth={2} />
            <span>Focus & Timer</span>
          </button>

          <button
            type="button"
            className={`profile-tab-btn ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
            role="tab"
            aria-selected={activeTab === "security"}
          >
            <Lock size={15} strokeWidth={2} />
            <span>Security</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="profile-modal-body">
          {/* TAB 1: PROFILE */}
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="settings-form">
              {profileStatus.message && (
                <div
                  className={`settings-alert-banner ${
                    profileStatus.type === "error" ? "is-error" : "is-success"
                  }`}
                >
                  {profileStatus.type === "error" ? (
                    <AlertCircle size={15} strokeWidth={2} />
                  ) : (
                    <Check size={15} strokeWidth={2.5} />
                  )}
                  <span>{profileStatus.message}</span>
                </div>
              )}

              {/* Avatar Preview & Palette */}
              <div className="avatar-section">
                <div
                  className="avatar-large-preview"
                  style={{ backgroundColor: avatarColor }}
                  title="Current avatar appearance"
                >
                  <span>{initials}</span>
                </div>

                <div className="avatar-palette-picker">
                  <label className="settings-label">Avatar Color</label>
                  <div className="palette-swatches">
                    {AVATAR_PALETTE.map((item) => (
                      <button
                        key={item.color}
                        type="button"
                        className={`palette-swatch ${
                          avatarColor === item.color ? "selected" : ""
                        }`}
                        style={{ backgroundColor: item.color }}
                        onClick={() => setAvatarColor(item.color)}
                        title={item.name}
                        aria-label={`Select ${item.name} avatar color`}
                      >
                        {avatarColor === item.color && (
                          <Check size={13} strokeWidth={3} className="swatch-check" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Display Name Input */}
              <div className="settings-form-group">
                <label htmlFor="settings-name-input" className="settings-label">
                  Display Name
                </label>
                <input
                  id="settings-name-input"
                  type="text"
                  className="settings-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your display name"
                  maxLength={60}
                  required
                />
              </div>

              {/* Primary Account Email (Read-only) */}
              <div className="settings-form-group">
                <label className="settings-label">Account Email</label>
                <div className="settings-readonly-field">
                  <span>{user?.email || "Unknown"}</span>
                  <span className="email-status-tag">Primary Email</span>
                </div>
                <span className="settings-field-hint">
                  Email addresses are permanently linked to your workspace documents.
                </span>
              </div>

              {/* Joined Date */}
              <div className="settings-form-group">
                <label className="settings-label">Workspace Membership</label>
                <div className="settings-meta-row">
                  <Calendar size={14} strokeWidth={2} className="meta-icon" />
                  <span>Member since {memberSince}</span>
                </div>
              </div>

              <div className="settings-form-footer">
                <button
                  type="submit"
                  className="settings-submit-btn"
                  disabled={profileSaving}
                >
                  {profileSaving ? (
                    <>
                      <Loader2 size={15} strokeWidth={2.5} className="spin-loader" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Profile Changes</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: PREFERENCES */}
          {activeTab === "preferences" && (
            <form onSubmit={handleSavePreferences} className="settings-form">
              {prefsStatus.message && (
                <div
                  className={`settings-alert-banner ${
                    prefsStatus.type === "error" ? "is-error" : "is-success"
                  }`}
                >
                  {prefsStatus.type === "error" ? (
                    <AlertCircle size={15} strokeWidth={2} />
                  ) : (
                    <Check size={15} strokeWidth={2.5} />
                  )}
                  <span>{prefsStatus.message}</span>
                </div>
              )}

              {/* Focus Duration Selection */}
              <div className="settings-form-group">
                <label className="settings-label">Focus Interval (Minutes)</label>
                <div className="duration-pill-group">
                  {FOCUS_DURATIONS.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      className={`duration-pill-btn ${
                        pomodoroMinutes === mins ? "active" : ""
                      }`}
                      onClick={() => setPomodoroMinutes(mins)}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
                <span className="settings-field-hint">
                  Standard work duration for dedicated focus sessions.
                </span>
              </div>

              {/* Short Break Selection */}
              <div className="settings-form-group">
                <label className="settings-label">Short Break (Minutes)</label>
                <div className="duration-pill-group">
                  {SHORT_BREAKS.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      className={`duration-pill-btn ${
                        shortBreakMinutes === mins ? "active" : ""
                      }`}
                      onClick={() => setShortBreakMinutes(mins)}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
                <span className="settings-field-hint">
                  Rest period between consecutive focus sessions.
                </span>
              </div>

              {/* Long Break Selection */}
              <div className="settings-form-group">
                <label className="settings-label">Long Break (Minutes)</label>
                <div className="duration-pill-group">
                  {LONG_BREAKS.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      className={`duration-pill-btn ${
                        longBreakMinutes === mins ? "active" : ""
                      }`}
                      onClick={() => setLongBreakMinutes(mins)}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
                <span className="settings-field-hint">
                  Extended recharge period triggered after every 4 completed focus sessions.
                </span>
              </div>

              {/* Sound Audio Chime Toggle */}
              <div className="settings-form-group">
                <div className="settings-toggle-row">
                  <div className="toggle-info">
                    <span className="toggle-title">Completion Harmonic Chime</span>
                    <span className="toggle-desc">
                      Play synthesized two-tone Web Audio chimes when sessions finish.
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`sound-toggle-btn ${soundEnabled ? "enabled" : "disabled"}`}
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    aria-label="Toggle sound effects"
                  >
                    {soundEnabled ? (
                      <>
                        <Volume2 size={15} strokeWidth={2} />
                        <span>Enabled</span>
                      </>
                    ) : (
                      <>
                        <VolumeX size={15} strokeWidth={2} />
                        <span>Muted</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="settings-form-footer">
                <button
                  type="submit"
                  className="settings-submit-btn"
                  disabled={prefsSaving}
                >
                  {prefsSaving ? (
                    <>
                      <Loader2 size={15} strokeWidth={2.5} className="spin-loader" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Apply Focus Preferences</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: SECURITY */}
          {activeTab === "security" && (
            <form onSubmit={handleChangePassword} className="settings-form">
              {passwordStatus.message && (
                <div
                  className={`settings-alert-banner ${
                    passwordStatus.type === "error" ? "is-error" : "is-success"
                  }`}
                >
                  {passwordStatus.type === "error" ? (
                    <AlertCircle size={15} strokeWidth={2} />
                  ) : (
                    <Check size={15} strokeWidth={2.5} />
                  )}
                  <span>{passwordStatus.message}</span>
                </div>
              )}

              {/* Current Password */}
              <div className="settings-form-group">
                <label
                  htmlFor="settings-current-pwd-input"
                  className="settings-label"
                >
                  Current Password
                </label>
                <div className="settings-input-wrapper">
                  <input
                    id="settings-current-pwd-input"
                    type={showCurrentPassword ? "text" : "password"}
                    className="settings-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    className="input-eye-btn"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={15} strokeWidth={2} />
                    ) : (
                      <Eye size={15} strokeWidth={2} />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="settings-form-group">
                <label htmlFor="settings-new-pwd-input" className="settings-label">
                  New Password
                </label>
                <div className="settings-input-wrapper">
                  <input
                    id="settings-new-pwd-input"
                    type={showNewPassword ? "text" : "password"}
                    className="settings-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className="input-eye-btn"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex={-1}
                  >
                    {showNewPassword ? (
                      <EyeOff size={15} strokeWidth={2} />
                    ) : (
                      <Eye size={15} strokeWidth={2} />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="settings-form-group">
                <label
                  htmlFor="settings-confirm-pwd-input"
                  className="settings-label"
                >
                  Confirm New Password
                </label>
                <input
                  id="settings-confirm-pwd-input"
                  type="password"
                  className="settings-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  minLength={6}
                  required
                />
              </div>

              <div className="security-notice-card">
                <Lock size={15} strokeWidth={2} className="notice-icon" />
                <div className="notice-text">
                  <span className="notice-title">Session Persistence</span>
                  <span className="notice-desc">
                    Updating your password will salt-hash your new credentials with bcrypt
                    and issue a fresh JWT token to keep your current workspace active.
                  </span>
                </div>
              </div>

              <div className="settings-form-footer">
                <button
                  type="submit"
                  className="settings-submit-btn"
                  disabled={passwordSaving}
                >
                  {passwordSaving ? (
                    <>
                      <Loader2 size={15} strokeWidth={2.5} className="spin-loader" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Bottom Footer / Sign Out Section */}
        <div className="profile-modal-footer">
          <button
            type="button"
            className="settings-logout-btn"
            onClick={logout}
            title="Sign out of the current workspace across all tabs"
          >
            <LogOut size={14} strokeWidth={2} />
            <span>Sign Out of Workspace (All Tabs)</span>
          </button>

          <button
            type="button"
            className="settings-close-btn"
            onClick={closeProfileModal}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileSettingsModal;
