import mongoose from "mongoose";

const focusSessionSchema = new mongoose.Schema({
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
        default: null
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        default: null
    },
    durationMinutes: {
        type: Number,
        required: true,
        default: 25,
        min: 1
    },
    mode: {
        type: String,
        enum: ["work", "short_break", "long_break"],
        default: "work"
    },
    completedAt: {
        type: Date,
        default: Date.now
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    }
}, { timestamps: true });

// Indexes for efficient scoped date range querying and aggregations
focusSessionSchema.index({ user: 1, completedAt: -1 });
focusSessionSchema.index({ user: 1, taskId: 1 });
focusSessionSchema.index({ user: 1, projectId: 1 });

const FocusSession = mongoose.model("FocusSession", focusSessionSchema);

export default FocusSession;
