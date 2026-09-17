import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import cors from "cors";

import taskRoutes from "./routes/taskRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/tasks", taskRoutes);
app.use("/api/projects", projectRoutes);

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected!");
    })
    .catch((error) => {
        console.log("MongoDB connection failed:", error);
    });


const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
    res.json({
        status: "online",
        message: "NextTask REST API is running",
        version: "0.1.0"
    });
});

app.listen(PORT, () => {
    console.log(`NextTask Server running on http://localhost:${PORT}`);
});