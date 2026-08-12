import express from "express";

const app = express();

app.use(express.json());

app.get("/", (req,res)=>{
    res.send("Hello from NextTask Backend!");
});

app.get("/api/tasks", (req,res)=>{
    res.json([
        {
            id:1,
            title:'Learn React',
            completed:false
        },
        {
            id:2,
            title:'Complete Java Assignment',
            completed:false
        },
        {
            id:3,
            title:'Go to Gym',
            completed:false
        }
    ]);
});

app.post("/api/tasks", (req,res)=>{
    const { title } = req.body;

    if(!title || title.trim() === ""){
        return res.status(400).json({
            message:"Task Title is required"
        })
    }
    const task = {
        id : Date.now(),
        title: title.trim(),
        completed:false
    };
    res.status(201).json(task);
});

app.listen(5000, ()=>{
    console.log("Server running on http://localhost:5000");
});