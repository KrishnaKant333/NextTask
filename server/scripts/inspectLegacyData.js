import mongoose from "mongoose";
import "dotenv/config";

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const tasks = await db.collection("tasks").countDocuments();
  const unownedTasks = await db.collection("tasks").countDocuments({ user: { $exists: false } });
  const projects = await db.collection("projects").countDocuments();
  const unownedProjects = await db.collection("projects").countDocuments({ user: { $exists: false } });
  const sessions = await db.collection("focussessions").countDocuments();
  const unownedSessions = await db.collection("focussessions").countDocuments({ user: { $exists: false } });
  const users = await db.collection("users").countDocuments();

  console.log(JSON.stringify({ tasks, unownedTasks, projects, unownedProjects, sessions, unownedSessions, users }, null, 2));
  await mongoose.disconnect();
}

check().catch(console.error);
