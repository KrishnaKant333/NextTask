import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
    title:{
        type:String,
        required: true
    },
    completed:{
        type:Boolean,
        default: false
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium"
    },
    dueDate: {
        type: Date,
        default: null
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        default: null
    },
    tags: [{
        type: String,
        trim: true
    }],
    subtasks: [{
        title: {
            type: String,
            required: true,
            trim: true
        },
        completed: {
            type: Boolean,
            default: false
        }
    }],
    estimatedPomodoros: {
        type: Number,
        default: 1,
        min: 1,
        max: 20
    },
    pomodorosCompleted: {
        type: Number,
        default: 0,
        min: 0
    }
}, { timestamps: true });

const Task = mongoose.model("Task", taskSchema);

export default Task;