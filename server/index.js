var express = require("express");
var socket = require("socket.io");

const PORT = 4000;

// App setup
var app = express();
var server = app.listen(PORT, function() {
  console.log("Listening on port " + 4000);
});

// Socket setup
var io = socket(server);

io.on("connection", function(socket) {
  console.log("Client connected to server socket", socket.id);
});
