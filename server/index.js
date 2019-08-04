var express = require("express");
var socket = require("socket.io");

const PORT = 4000;
const CREATE_ROOM = 110;
const JOIN_ROOM = 100;
const STATE_CHANGE = 101;
const NEW_USER = 102;
const ERROR = 103;
const INVALID_CREDS = 104;
const ADD_SONG = 105;
const SYNC = 106;
const VIDEO_ENDED = 107;
const SUCCESS = 108;
const USER_DISCONNECTED = 109;
const PLAY = 0;
const PAUSE = 1;
const STOP = 2;
const PREVIOUS = 3;
const NEXT = 4;
const WAITING = 5;
var rooms = {};

// App setup
var app = express();

// TODO: For testing purposes -- Remove later.
const fs = require('fs')
var ip = fs.readFileSync('ip.txt');

var server = app.listen(PORT, ip, function () {
  console.log("Listening on " + ip + ":" + PORT);
});

// Socket setup
var io = socket(server);

function updateUsersState(room, newState) {
  Object.keys(rooms[room].state.users).forEach(function (key) {
    rooms[room].state.users[key].state = newState;
  });
}

io.on("connection", function (socket) {
  console.log("Client connected to server with id:", socket.id);
  var room;

  socket.on(JOIN_ROOM, function (data) {
    if (data.name in rooms && rooms[data.name].password == data.password) {
      socket.join(data.name);
      room = data.name;
      rooms[room].state.users[socket.id] = { state: WAITING, username: data.username }
      io.to(room).emit(STATE_CHANGE, {
        type: NEW_USER,
        id: socket.id,
        username: data.username
      });
      socket.emit(SUCCESS);
      socket.emit(SYNC, rooms[room].state);
    } else {
      socket.emit(ERROR, { type: INVALID_CREDS });
    }

    socket.on(ADD_SONG, function (song) {
      io.to(room).emit(ADD_SONG, song);
      rooms[room].state.queue.push(song);
      rooms[room].state.histPos++;
    });

    socket.on(WAITING, function () {
      rooms[room].state.users[socket.id].state = WAITING;
    });

    socket.on(VIDEO_ENDED, function () {
      // Set socket status to WAITING
      rooms[room].state.users[socket.id].state = WAITING;
      // If next song is available
      if (rooms[room].state.histPos > 0) {
        // Check if all connected clients have ended their songs as well
        allWaiting = true;
        Object.keys(rooms[room].state.users).every(function (key) {
          if (rooms[room].state.users[key].state != WAITING) {
            allWaiting = false;
            return false;
          }
        });
        // if all connected clients have ended their song play next song
        if (allWaiting) {
          io.to(room).emit(NEXT);
          rooms[room].state.histPos--;
          updateUsersState(room, PLAY);
        }
      }
    });

    socket.on(SYNC, function () {
      io.to(room).emit(SYNC, rooms[room].state);
    });

    socket.on(PLAY, function () {
      rooms[room].state.playerState = PLAY;
      io.to(room).emit(PLAY);
    });

    socket.on(PAUSE, function () {
      rooms[room].state.playerState = PAUSE;
      io.to(room).emit(PAUSE);
    });

    socket.on(STOP, function () {
      rooms[room].state.playerState = STOP;
      io.to(room).emit(STOP);
    });

    socket.on(PREVIOUS, function () {
      if (rooms[room].state.histPos < rooms[room].state.queue.length) {
        io.to(room).emit(PREVIOUS);
        rooms[room].state.histPos++;
      }
    });

    socket.on(NEXT, function () {
      // If next song is available, send play next command.
      if (rooms[room].state.histPos > 1) {
        io.to(room).emit(NEXT);
        rooms[room].state.histPos--;
      }
    });
  });

  socket.on(CREATE_ROOM, function (room) {
    if (!(room.name in rooms)) {
      rooms[room.name] = {
        password: room.password,
        state: {
          queue: [],
          cur_playing: "",
          histPos: 0,
          playerState: null,
          users: {}  // TODO: Convert to using usernames instead of just a count of users.
        }
      };
    } else {
      // TODO: Handel room already existing or make it so that rooms can have the same name.
    }
  });

  // Log client disconnecting
  socket.on("disconnect", function (reason) {
    io.to(room).emit(STATE_CHANGE, {
      type: USER_DISCONNECTED,
      id: socket.id
    });
    console.log("Client disconnected from server with id:'", socket.id, "' for reason:", reason);
    delete rooms[room].state.users[socket.id];
    if (Object.keys(rooms[room].state.users).length < 1) {
      delete rooms[room];
      console.log(`[${room}] Room is empty and has been deleted.`);
    }
  });
});
