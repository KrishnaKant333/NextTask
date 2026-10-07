import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  CheckSquare,
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";

function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    sessionNotice,
    login,
    register,
    isAuthenticated,
  } = useAuth();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (authModalMode) {
      setMode(authModalMode);
    }
    setErrorMessage("");
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    if (mode === "register") {
      if (!name.trim() || name.trim().length < 2) {
        setErrorMessage("Please enter a name of at least 2 characters.");
        return;
      }
      if (password.length < 6) {
        setErrorMessage("Password must be at least 6 characters long.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password);
      }
    } catch (err) {
      setErrorMessage(err.message || "Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDevLogin = async () => {
    setErrorMessage("");
    setIsSubmitting(true);
    try {
      await login("dev@nexttask.local", "DevPassword#2026");
    } catch (err) {
      setErrorMessage(
        err.message || "Failed to login with development account. Run migration script first."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal-card">
        {/* Header */}
        <div className="auth-modal-header">
          <div className="auth-modal-brand">
            <div className="brand-badge-sm">
              <CheckSquare size={16} strokeWidth={2.5} />
            </div>
            <span className="auth-brand-title">NextTask</span>
          </div>

          {isAuthenticated && (
            <button
              type="button"
              className="auth-modal-close"
              onClick={closeAuthModal}
              title="Close modal"
              aria-label="Close modal"
            >
              <X size={16} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Modal Title & Subtitle */}
        <div className="auth-modal-intro">
          <h2 className="auth-modal-title">
            {mode === "login" ? "Sign in to your workspace" : "Create your account"}
          </h2>
          <p className="auth-modal-subtitle">
            {mode === "login"
              ? "Focus, organize, and execute your tasks with multi-tenant privacy."
              : "Start organizing your projects, tasks, and pomodoro focus logs."}
          </p>
        </div>

        {/* Session Notice */}
        {sessionNotice && (
          <div className="auth-notice-banner">
            <span>{sessionNotice}</span>
          </div>
        )}

        {/* Mode Switcher */}
        <div className="auth-mode-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            className={`auth-mode-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => {
              setMode("login");
              setErrorMessage("");
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            className={`auth-mode-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => {
              setMode("register");
              setErrorMessage("");
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="auth-error-banner" role="alert">
            <AlertCircle size={15} strokeWidth={2} className="auth-error-icon" />
            <span className="auth-error-text">{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "register" && (
            <div className="auth-field">
              <label htmlFor="auth-name" className="auth-label">
                Full Name
              </label>
              <div className="auth-input-wrapper">
                <User size={15} strokeWidth={2} className="auth-input-icon" />
                <input
                  id="auth-name"
                  type="text"
                  className="auth-input"
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="name"
                  required
                />
              </div>
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email" className="auth-label">
              Email Address
            </label>
            <div className="auth-input-wrapper">
              <Mail size={15} strokeWidth={2} className="auth-input-icon" />
              <input
                id="auth-email"
                type="email"
                className="auth-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password" className="auth-label">
              Password
            </label>
            <div className="auth-input-wrapper">
              <Lock size={15} strokeWidth={2} className="auth-input-icon" />
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                className="auth-input"
                placeholder={mode === "register" ? "Min. 6 characters" : "Enter password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff size={15} strokeWidth={2} />
                ) : (
                  <Eye size={15} strokeWidth={2} />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} strokeWidth={2.5} className="spin-loader" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{mode === "login" ? "Sign In" : "Create Account"}</span>
                <ArrowRight size={15} strokeWidth={2} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Access Divider & Action */}
        <div className="auth-demo-divider">
          <span>Quick Demo Access</span>
        </div>

        <button
          type="button"
          className="auth-demo-btn"
          onClick={handleQuickDevLogin}
          disabled={isSubmitting}
        >
          <div className="demo-btn-content">
            <Sparkles size={15} strokeWidth={2.2} className="demo-icon" />
            <div className="demo-btn-text">
              <span className="demo-btn-title">1-Click Development Workspace</span>
              <span className="demo-btn-desc">Sign in as dev@nexttask.local (8 tasks, 3 projects)</span>
            </div>
          </div>
          <ArrowRight size={14} strokeWidth={2} className="demo-arrow" />
        </button>
      </div>
    </div>
  );
}

export default AuthModal;
