import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import cors from "cors";

import taskRoutes from "./routes/taskRoutes.js"

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/tasks", taskRoutes);

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected!");
    })
    .catch((error) => {
        console.log("MongoDB connection failed:", error);
    });


app.get("/", (req, res) => {
    res.send("NextTask API is Running!");
});

app.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});