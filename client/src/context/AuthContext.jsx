/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  loginUser,
  registerUser,
  getCurrentUser,
  updateUserProfile,
  changeUserPassword,
} from "../services/authService";
import { TOKEN_STORAGE_KEY } from "../services/apiClient";

const USER_STORAGE_KEY = "nexttask_user";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(USER_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("login"); // "login" | "register"
  const [sessionNotice, setSessionNotice] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const openAuthModal = useCallback((mode = "login", notice = null) => {
    setAuthModalMode(mode);
    setSessionNotice(notice);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setSessionNotice(null);
  }, []);

  const openProfileModal = useCallback(() => {
    setIsProfileModalOpen(true);
  }, []);

  const closeProfileModal = useCallback(() => {
    setIsProfileModalOpen(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
    setIsProfileModalOpen(false);
    openAuthModal("login", "You have signed out.");
  }, [openAuthModal]);

  // Reconcile user session on initial boot
  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!storedToken) {
        if (isMounted) {
          setLoading(false);
          setIsAuthModalOpen(true);
        }
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        if (isMounted) {
          const profile = {
            _id: currentUser._id,
            name: currentUser.name,
            email: currentUser.email,
            avatarColor: currentUser.avatarColor || "#38bdf8",
            preferences: currentUser.preferences || {
              pomodoroMinutes: 25,
              shortBreakMinutes: 5,
              longBreakMinutes: 15,
              soundEnabled: true,
            },
            createdAt: currentUser.createdAt,
            updatedAt: currentUser.updatedAt,
          };
          setUser(profile);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
        }
      } catch (err) {
        console.warn("Session verification failed:", err.message);
        if (isMounted) {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem(USER_STORAGE_KEY);
          setToken(null);
          setUser(null);
          openAuthModal("login", "Your session has expired. Please sign in again.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [openAuthModal]);

  // Listen for 401 unauthorized events emitted from apiClient
  useEffect(() => {
    const handleUnauthorized = (e) => {
      console.warn("Unauthorized API call caught:", e.detail);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      setToken(null);
      setUser(null);
      setIsProfileModalOpen(false);
      openAuthModal("login", "Session expired. Please sign in to continue.");
    };

    window.addEventListener("nexttask:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("nexttask:unauthorized", handleUnauthorized);
    };
  }, [openAuthModal]);

  // Multi-Tab Session Synchronization via browser storage events
  useEffect(() => {
    const handleStorageChange = (e) => {
      // 1. If token removed in another tab -> logout immediately
      if (e.key === TOKEN_STORAGE_KEY) {
        if (!e.newValue) {
          setToken(null);
          setUser(null);
          setIsProfileModalOpen(false);
          openAuthModal("login", "Session ended in another tab.");
        } else if (e.newValue !== token) {
          // Token updated or user logged in from another tab
          setToken(e.newValue);
          getCurrentUser()
            .then((currentUser) => {
              const profile = {
                _id: currentUser._id,
                name: currentUser.name,
                email: currentUser.email,
                avatarColor: currentUser.avatarColor || "#38bdf8",
                preferences: currentUser.preferences || {
                  pomodoroMinutes: 25,
                  shortBreakMinutes: 5,
                  longBreakMinutes: 15,
                  soundEnabled: true,
                },
                createdAt: currentUser.createdAt,
              };
              setUser(profile);
              localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
              closeAuthModal();
            })
            .catch(() => {
              setToken(null);
              setUser(null);
            });
        }
      }

      // 2. If user profile updated in another tab -> sync local state
      if (e.key === USER_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setUser(parsed);
        } catch {
          // Ignore parsing errors
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [token, openAuthModal, closeAuthModal]);

  const login = async (email, password) => {
    const data = await loginUser({ email, password });
    const userProfile = {
      _id: data._id,
      name: data.name,
      email: data.email,
      avatarColor: data.avatarColor || "#38bdf8",
      preferences: data.preferences || {
        pomodoroMinutes: 25,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
        soundEnabled: true,
      },
    };
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userProfile));
    setToken(data.token);
    setUser(userProfile);
    closeAuthModal();
    return data;
  };

  const register = async (name, email, password) => {
    const data = await registerUser({ name, email, password });
    const userProfile = {
      _id: data._id,
      name: data.name,
      email: data.email,
      avatarColor: data.avatarColor || "#38bdf8",
      preferences: data.preferences || {
        pomodoroMinutes: 25,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
        soundEnabled: true,
      },
    };
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userProfile));
    setToken(data.token);
    setUser(userProfile);
    closeAuthModal();
    return data;
  };

  const updateProfile = async (profileData) => {
    const updated = await updateUserProfile(profileData);
    const updatedProfile = {
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      avatarColor: updated.avatarColor || "#38bdf8",
      preferences: updated.preferences || {
        pomodoroMinutes: 25,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
        soundEnabled: true,
      },
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
    setUser(updatedProfile);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedProfile));
    return updatedProfile;
  };

  const changePassword = async ({ currentPassword, newPassword }) => {
    const res = await changeUserPassword({ currentPassword, newPassword });
    if (res.token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, res.token);
      setToken(res.token);
    }
    if (res.user) {
      const updatedProfile = {
        _id: res.user._id,
        name: res.user.name,
        email: res.user.email,
        avatarColor: res.user.avatarColor || "#38bdf8",
        preferences: res.user.preferences,
      };
      setUser(updatedProfile);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedProfile));
    }
    return res;
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    loading,
    isAuthModalOpen,
    authModalMode,
    sessionNotice,
    isProfileModalOpen,
    openAuthModal,
    closeAuthModal,
    openProfileModal,
    closeProfileModal,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
