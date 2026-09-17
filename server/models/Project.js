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
    }
}, { timestamps: true });

const Project = mongoose.model("Project", projectSchema);

export default Project;
