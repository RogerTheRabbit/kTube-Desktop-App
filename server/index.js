var express = require("express");
var socket = require("socket.io");

const PORT = 4000;
const CREATE_ROOM = 000;
const JOIN_ROOM = 100;
const STATE_CHANGE = 101;
const NEW_USER = 102;
const ERROR = 103;
const INVALID_CREDS = 104;
const ADD_SONG = 105;
const SYNC = 106;
var rooms = {};

// App setup
var app = express();
var server = app.listen(PORT, function() {
  console.log("Listening on port " + PORT);
});

// Socket setup
var io = socket(server);

io.on("connection", function(socket) {
  console.log("Client connected to server with id:", socket.id);
  var room;

  socket.on(JOIN_ROOM, function(data) {
    if (data.name in rooms && rooms[data.name].password == data.password) {
      socket.join(data.name);
      room = data.name;
      io.to(room).emit(STATE_CHANGE, {
        type: NEW_USER,
        msg: "${socket.id} has joined the room!"
      });
      io.to(room).emit(SYNC, rooms[room].state);
    } else {
      socket.emit(ERROR, { type: INVALID_CREDS });
    }
    socket.on(ADD_SONG, function(song) {
      io.to(room).emit(ADD_SONG, song);
      rooms[room].state.queue.push(song);
    });
  });

  socket.on(CREATE_ROOM, function(room) {
    if (!(room.name in rooms)) {
      rooms[room.name] = {
        password: room.password,
        users: 1,
        state: {
          queue: [],
          cur_playing: "" // TODO: Convert to using usernames instead of just a count of users.
        }
      };
    } else {
      // TODO: Handel room already existing or make it so that rooms can have the same name.
    }
  });

  // Log client disconnecting
  socket.on("disconnect", function(reason) {
    console.log(
      "Client disconnected from server with id:'",
      socket.id,
      "' for reason:",
      reason
    );
    rooms[room].users -= 1;
    if (rooms[room].users < 1) {
      delete rooms[room];
      console.log(`[EMPTY ROOM] \"${room}\" has been deleted.`);
    }
  });
});
