const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://beaconcallbell.onrender.com",
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: "https://beaconcallbell.onrender.com",
  methods: ["GET", "POST"]
}));

// Serve static files from /public
app.use(express.static(path.join(__dirname, "../public")));

// Serve admin.html at /admin
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/admin.html"));
});

// Serve display.html at /display
app.get("/display", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/display.html"));
});

// -------- Persistent Status Handling --------
const statusFile = path.join(__dirname, "statuses.json");

// Initialize or load status file
let areaStatuses;
try {
  const data = fs.readFileSync(statusFile, "utf-8");
  areaStatuses = JSON.parse(data);
} catch (err) {
  // If file doesn't exist, create default statuses
  areaStatuses = {
    orion: "--",
    pegasus: "--",
    phoenix: "--"
  };
  fs.writeFileSync(statusFile, JSON.stringify(areaStatuses, null, 2));
}

// Function to save to file
function saveStatuses() {
  fs.writeFileSync(statusFile, JSON.stringify(areaStatuses, null, 2));
}

// -------- Socket.IO Events --------
io.on("connection", (socket) => {
  console.log("A user connected");

  // Send current statuses to newly connected client
  socket.emit("statusSnapshot", areaStatuses);

  socket.on("callPatient", (data) => {
    io.emit("displayPatient", data);
  });

  socket.on("updateStatus", ({ area, status }) => {
    if (areaStatuses.hasOwnProperty(area)) {
      areaStatuses[area] = status;
      saveStatuses(); // Persist change to file
      io.emit("updateStatus", { area, status });
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Start server
server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
