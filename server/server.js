import http from "http";

const server = http.createServer((req,res)=>{
    if(req.method === "GET" && req.url === "/"){
        res.end("Here are your tasks");
    }
    else if(req.method === "POST" && req.url === "/tasks"){
        res.end("New Task created");
    }
    else if(req.method === "DELETE" && req.url === "/tasks"){
        res.end("Task Deleted");
    }
    else{
        res.statusCode = 404;
        res.end("Page not found");
    }
});

server.listen(5000, ()=>{
    console.log("Server running on http://localhost:5000");
});