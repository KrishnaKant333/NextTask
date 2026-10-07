import User from "../models/User.js";
import { generateToken } from "../middleware/authMiddleware.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please provide all required fields: name, email, and password",
      });
    }

    if (typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({
        message: "Name must be at least 2 characters",
      });
    }

    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Please provide a valid email address",
      });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({
        message: "User already exists with this email address",
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatarColor: user.avatarColor,
      preferences: user.preferences,
      token,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "User already exists with this email address",
      });
    }
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide email and password",
      });
    }

    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatarColor: user.avatarColor,
      preferences: user.preferences,
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private (Protected by JWT)
 */
export const getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized, user not found" });
    }

    return res.status(200).json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatarColor: req.user.avatarColor,
      preferences: req.user.preferences,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile & preferences
 * @route   PUT /api/auth/profile
 * @access  Private (Protected by JWT)
 */
export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, avatarColor, preferences } = req.body || {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 60) {
        return res.status(400).json({ message: "Name must be between 2 and 60 characters" });
      }
      user.name = name.trim();
    }

    if (avatarColor !== undefined) {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;
      if (typeof avatarColor !== "string" || !hexRegex.test(avatarColor)) {
        return res.status(400).json({ message: "Invalid avatar hex color format (e.g. #38bdf8)" });
      }
      user.avatarColor = avatarColor;
    }

    if (preferences !== undefined && typeof preferences === "object" && preferences !== null) {
      const { pomodoroMinutes, shortBreakMinutes, longBreakMinutes, soundEnabled } = preferences;

      if (pomodoroMinutes !== undefined) {
        const val = Number(pomodoroMinutes);
        if (isNaN(val) || val < 1 || val > 60) {
          return res.status(400).json({ message: "Pomodoro duration must be between 1 and 60 minutes" });
        }
        user.preferences.pomodoroMinutes = val;
      }

      if (shortBreakMinutes !== undefined) {
        const val = Number(shortBreakMinutes);
        if (isNaN(val) || val < 1 || val > 30) {
          return res.status(400).json({ message: "Short break must be between 1 and 30 minutes" });
        }
        user.preferences.shortBreakMinutes = val;
      }

      if (longBreakMinutes !== undefined) {
        const val = Number(longBreakMinutes);
        if (isNaN(val) || val < 1 || val > 45) {
          return res.status(400).json({ message: "Long break must be between 1 and 45 minutes" });
        }
        user.preferences.longBreakMinutes = val;
      }

      if (soundEnabled !== undefined) {
        user.preferences.soundEnabled = Boolean(soundEnabled);
      }
    }

    await user.save();

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatarColor: user.avatarColor,
      preferences: user.preferences,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change user password
 * @route   PUT /api/auth/password
 * @access  Private (Protected by JWT)
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Please provide both current password and new password",
      });
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "New password cannot be the same as current password",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    const token = generateToken(user._id);

    return res.status(200).json({
      message: "Password updated successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarColor: user.avatarColor,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    next(error);
  }
};
