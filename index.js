const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "../public")));

// --- Store area statuses persistently in memory ---
const areaStatuses = {
  orion: "--",
  pegasus: "--",
  phoenix: "--"
};

io.on("connection", (socket) => {
  console.log("A user connected");

  // Send current area statuses snapshot on new connection
  socket.emit("statusSnapshot", areaStatuses);

  socket.on("callPatient", (data) => {
    io.emit("displayPatient", data);
  });

  socket.on("updateStatus", ({ area, status }) => {
    // Update stored status if valid area
    if (areaStatuses.hasOwnProperty(area)) {
      areaStatuses[area] = status;
      // Broadcast updated status to all clients
      io.emit("updateStatus", { area, status });
    }
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});