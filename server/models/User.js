import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [60, "Name cannot exceed 60 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [emailRegex, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    avatarColor: {
      type: String,
      default: "#38bdf8",
      trim: true,
      match: [/^#[0-9A-Fa-f]{6}$/, "Invalid avatar hex color format"],
    },
    preferences: {
      pomodoroMinutes: {
        type: Number,
        default: 25,
        min: [1, "Pomodoro duration must be at least 1 minute"],
        max: [60, "Pomodoro duration cannot exceed 60 minutes"],
      },
      shortBreakMinutes: {
        type: Number,
        default: 5,
        min: [1, "Short break must be at least 1 minute"],
        max: [30, "Short break cannot exceed 30 minutes"],
      },
      longBreakMinutes: {
        type: Number,
        default: 15,
        min: [1, "Long break must be at least 1 minute"],
        max: [45, "Long break cannot exceed 45 minutes"],
      },
      soundEnabled: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

// Hash password before saving if modified
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
