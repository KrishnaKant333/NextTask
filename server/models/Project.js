import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        default: "",
        trim: true,
        maxlength: 500
    },
    color: {
        type: String,
        default: "#6366f1",
        match: [/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid hex color format"]
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    }
}, { timestamps: true });

projectSchema.index({ user: 1, name: 1 });
projectSchema.index({ user: 1, createdAt: -1 });

const Project = mongoose.model("Project", projectSchema);

export default Project;
