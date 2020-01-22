var io = require("socket.io-client");
const { remote, ipcRenderer } = require('electron')

const PORT = 4000;
const MAXRESULTS = 10;

// TODO: For testing purposes -- Remove later.
const fs = require('fs');
var ip = fs.readFileSync('ip.txt');

// 100 = communications between client and server
const CREATE_ROOM = 110;
const JOIN_ROOM = 100;
const STATE_CHANGE = 101;
const NEW_USER = 102;
const ERROR = 103;
const INVALID_CREDS = 104;
const ADD_SONG = 105;
const SYNC = 106;
const VIDEO_ENDED = 107;
const VIDEO_INVALID = 108
const SUCCESS = 109;
const USER_DISCONNECTED = 109;
const TIME_CHECK = 110;
const TIME_CORRECT = 111;

// 200 = communications between render and main
// const ROOMNAME = 201

// Refers to YouTube player states
const PLAY = 0;
const PAUSE = 1;
const STOP = 2;
const PREVIOUS = 3;
const NEXT = 4;
const WAITING = 5;

//Make connection
// var socket = io.connect("http://localhost:4000");
var socket = io.connect("http://" + ip + ":" + PORT);
console.log("Trying to connect to:", "http://" + ip + ":" + PORT);

// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement("script");
var player;
var watchHist = [];
var histPos = 0;
var key;
fetch("key_YouTube.txt")
  .then(response => response.text())
  .then(text => {
    key = text;
  });


/* particlesJS.load(@dom-id, @path-json, @callback (optional)); */
particlesJS.load('particles-js', 'resources/particles.json', function () {
  console.log('callback - particles.js config loaded');
});

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    // videoId: 'Huggdy7ohb4',
    playerVars: {
      'autoplay': 0,  // ?? to enable autoplay, ?? to disable autoplay.
      'controls': 1,  // 0 to hide, 1 to show player controls. 
      'fs': 0,        // 0 to disable fullscreen, 1 to enable fullscreen button.
      'disablekb': 1  // 0 to enable keyboard controls, 1 to disable keyboard controls
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: videoEnded, //onPlayerStateChange
      onError: onError
    }
  });
}

// Gets called by player when player's state changes
function videoEnded() {

  // Possible state change values:
  // -1 – unstarted
  //  0 – ended
  //  1 – playing
  //  2 – paused
  //  3 – buffering
  //  5 – video cued

  console.log("videoEnded event=", event);
  let data = JSON.parse(event.data)
  if (data.info === 0) {
    console.log('Video Ended');
    socket.emit(VIDEO_ENDED);
  }
}

// The YouTube player API will call this function when the video player is ready.
function onPlayerReady(event) {
  document.getElementById("volumeSlider").value = player.getVolume();
}

// Gets called by player when an Error occurs
function onError(event) {

  // Possible error values:
  // 2 – The request contains an invalid parameter value. For example, this error occurs if you specify a video ID that does not have 11 characters, or if the video ID contains invalid characters, such as exclamation points or asterisks.
  // 5 – The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred.
  // 100 – The video requested was not found. This error occurs when a video has been removed (for any reason) or has been marked as private.
  // 101 – The owner of the requested video does not allow it to be played in embedded players.
  // 150 – This error is the same as 101. It's just a 101 error in disguise!

  console.log("Player error:", event);
  let data = JSON.parse(event.data);
  if (data.info === 150 || data.info === 101) {
    document.getElementById('current').title = "Song not playable."
    socket.emit(VIDEO_INVALID);
  }
}

// Adds functionality to search bar so that hitting enter when typing search, submits the search.
document.getElementById("search").onkeydown = function (event) {
  // If enter pressed
  if (event.keyCode === 13) {
    search();
  }
};

// Sends command to server to create room with username and password.
function createRoom(name, password) {
  socket.emit(CREATE_ROOM, {
    name: name,
    password: password
  });
}

// Sends command to server join room with name and password as username.
function joinRoom(roomName, password, username) {
  socket.emit(JOIN_ROOM, {
    name: roomName,
    password: password,
    username: username
  });
  socket.on(SUCCESS, function () {
    console.log("Successfully joined room!", roomName)
    // document.getElementById("login").style.display = "none";
    window.pJSDom[0].pJS.fn.vendors.destroypJS();
    var elem = document.getElementById("login");
    elem.parentNode.removeChild(elem);
    changeWindowName(roomName);
  });
}

function login() {
  console.log("LOGING IN");
  var roomName = document.getElementById("roomName").value;
  var pass = document.getElementById("password").value;
  createRoom(roomName, pass);
  joinRoom(roomName, pass, document.getElementById("username").value);
}

// Handel any errors that the server sends.
socket.on(ERROR, function (reason) {
  switch (reason.type) {
    case INVALID_CREDS:
      // TODO Handle invalid login creds.
      console.log("Either invalid room name or invalid password when connecting to room.");
      break;
    default:
      console.log("Unknown error:", reason);
  }
});

// Handel SYNC command from server.  Sets current state of client to state held by the server.
socket.on(SYNC, function (state) {
  console.log("RECEIVED SYNC: state =", state);
  watchHist = state.queue;
  histPos = state.histPos;
  refreshConnected(state.users);
  // TODO: Set player to current song at current time.
  if (watchHist.length > 0 && histPos <= watchHist.length) {
    updateQueue();
    changeVideo(watchHist[watchHist.length - histPos]);
    // Start timer to update song progress periodically.
    setInterval(function () {
      updateProgress();
    }, 1000);
  }

  switch (state.playerState) {
    case PLAY:
      player.playVideo();
      break;
    case PAUSE:
      player.pauseVideo();
      break;
    case STOP:
      player.stopVideo();
    default:
      console.log("RECEIVED INVALID PLAYER STATE DURING SYNC GOT:", state.playerState);
  }
});

socket.on(TIME_CORRECT, function(correction) {
  console.log('Correcting to', correction)
  player.seekTo(correction.time);
});

socket.on(STATE_CHANGE, function (change) {
  console.log("STATE_CHANGE, change =", change);
  switch (change.type) {
    case NEW_USER:
      addConnected(change);
      break;
    case USER_DISCONNECTED:
      removeUser(change.id);
      break;
  }
})

// Send server song to add to queue
function addSong(id, thumbnail, title, channelTitle) {
  socket.emit(ADD_SONG, { id: id, thumbnail: thumbnail, title: title.toString(), channelTitle: channelTitle });
}

// Handle song being added to queue. 
socket.on(ADD_SONG, function (song) {
  watchHist.push(song);
  histPos++;
  // If player does not have a song currently selected, change the player to the song added.
  if (player.videoId == null) {
    changeVideo(song);
    // player.pauseVideo();
    // TODO: See if interval can be paused when video not playing to reduce cpu usage when not playing.
    setInterval(function () {
      updateProgress();
    }, 1000);
  }
  updateQueue();
});

// Handle PLAY command from server
socket.on(PLAY, function () {
  console.log("Received PLAY: watchHist=", watchHist);
  player.playVideo();
});

// Handle PAUSE command from server
socket.on(PAUSE, function () {
  console.log("Received PAUSE: watchHist=", watchHist);
  player.pauseVideo();
});

// Handle STOP command from server
socket.on(STOP, function () {
  console.log("Received STOP: watchHist=", watchHist);
  player.stopVideo();
});

// Handle NEXT command from server
socket.on(NEXT, function () {
  histPos--;
  console.log("Received NEXT: watchHist=", watchHist);
  changeVideo(watchHist[watchHist.length - histPos]);
});

// Handel PREVIOUS command from server
socket.on(PREVIOUS, function () {
  playPreviousSong();
  console.log("Received PREVIOUS: watchHist=", watchHist);
});

// Clear the search results
// If resetS is true, the search field will also be cleared.
function resetSearch(resetS = true) {
  document.getElementById("queryResultContainer").innerHTML = "";
  if (resetS) document.getElementById("search").value = "";
}

// Adds functionality to the search feature to be more intuitive.
function focusNav() {
  document.getElementsByClassName("nav")[0].focus();
  document.getElementById("queryResultContainer").hidden = false;
}

// Adds functionality to the search feature to be more intuitive. (Used by div.nav in index.html)
function blurNav() {
  document.getElementById("queryResultContainer").hidden = true;
}

// Handles fetching query results when a search is made.
var lastSearch = "";
function search() {
  focusNav();
  var q = document.getElementById("search").value.trim();
  // If search is same as previous or empty, do not change search results.
  if (lastSearch === q || q === "") { return; }
  lastSearch = q;
  resetSearch(false);
  q = encodeURIComponent(q);
  url = "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=" + MAXRESULTS + "&q=" + q + "&regionCode=us&type=video&videoEmbeddable=true&fields=items(id%2FvideoId%2Csnippet(channelTitle%2Cthumbnails%2Fdefault%2Furl%2Ctitle))&key=" + key;
  $.getJSON(url, function (data) {
    console.log(data);
    for (x = 0; x < data.items.length; x++) {
      var title = data.items[x].snippet.title;
      // Truncate the song title if it's too long.
      if (title.length > 42) title = title.substring(0, 42) + "...";
      // TODO: If there is a single quote in the title, it will break the string and is also an opening for XSS attack.
      // 
      // console.log(typeoftypeof data.items[x].snippet.title, data.items[x].snippet.title);
      document.getElementById("queryResultContainer").innerHTML += `
      <div class="queryResult" onclick="addSong('${(data.items[x].id.videoId)}', '${(data.items[x].snippet.thumbnails.default.url)}', '${(data.items[x].snippet.title)}', '${(data.items[x].snippet.channelTitle)}')">
          <img src="${String(data.items[x].snippet.thumbnails.default.url)}" alt=""/>
          <div class="queryResultText">
              <h4>${title}</h4>
              <h6>${data.items[x].snippet.channelTitle} - 5:06</h6>
          </div>
      </div>
      `;
    }
  });
}

function parseString(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

// Update the --progress property of the current playing song with a value of the current percentage through song.
// CSS for #current reads the --progress property to show progress
function updateProgress() {
  socket.emit(TIME_CHECK, {curTime: player.getCurrentTime()})
  document.getElementById("current").style.setProperty("--progress", (100 * player.getCurrentTime() / player.getDuration()) + "%");
}

// Changes the volume of the player.
function updateVolume(newVolume) {
  player.setVolume(newVolume);
}

// Changes what song (video) the player is playing.
function changeVideo(song) {
  player.loadVideoById((player.videoId = song.id));
  document.getElementById("thumbnail").src = song.thumbnail;
  updateQueue();
}

// This is probably a dumb way of doing this and should be made more efficient
// But I needed something quick for testing.
// Deletes all divs in the queueContainer and then rebuilds them from the local queue.
function updateQueue() {

  console.log("UPDATING QUEUE");

  document.getElementById("queueContainer").innerHTML = "";
  for (var x = 0; x < watchHist.length; x++) {
    document.getElementById("queueContainer").innerHTML +=
      `<div class="queryResult" id="${x === watchHist.length - histPos ? "current" : ""}">
        <img src="${ watchHist[x].thumbnail}" alt="THUMBNAIL NOT AVAILABLE"/>
          <div class="queryResultText">
              <h4>${watchHist[x].title}</h4>
              <h6>${watchHist[x].channelTitle} - 5:06</h6>
          </div>
          <button type="button" class="btn-floating btn-lg purple-gradient btn-rounded float-right fas fa-times"></button>
      </div>`;
  }
}

// References to html elem for each connected user.
var connected = {}

function refreshConnected(users) {
  console.log("Updated users:", users);
  for (var user in users) {
    if (!(user in connected)) {
      console.log("New user has connected with username", users[user].username)
      var userHTML = createUserHTML(user, users[user].username);
      connected[user] = { HTML: userHTML, username: users[user].username };
      document.getElementById("connected").innerHTML += (userHTML);
    }
  }
}

// When user connects, add them to connected and add them to the GUI.
function addConnected(user) {
  console.log("User joined:", user.username);
  var userHTML = createUserHTML(user.id, user.username);
  connected[user.id] = { HTML: userHTML, username: user.username };
  document.getElementById("connected").innerHTML += (userHTML);
}

// When user disconnects, this function is called to remove them from the GUI
function removeUser(userID) {
  console.log("User left:", connected[userID]);
  document.getElementById(userID).classList.add("slide-out-blurred-top")
  setTimeout(deleteUserHTML, 160, userID);
}

// Deletes HTML for user in the connected panel.  Also deletes
// their reference in the connected object.
function deleteUserHTML(userID) {
  document.getElementById(userID).remove();
  delete connected[userID];
}

// Create HTML "node" to be added to GUI that represents user connected.
function createUserHTML(socketID, username) {
  return `
  <div id="${socketID}" class="user slide-in-blurred-top z-depth-1">
    <i class="fas fa-user-circle avatar"></i>
    <br>
    <h5>${username}</h5>
  </div>
  `;
}

// Used for communication between the render thread (this code / renderer.js) and the main thread (main.js)
var ipc = require("electron").ipcRenderer;

function changeWindowName(roomName) {
  document.getElementById('windowTitle').innerText = 'kTube - ' + roomName;
}

// Upon receiving MediaPlayPause command from main, toggle player between play/pause.
ipc.on("MediaPlayPause", function (event, response) {
  if (player.getPlayerState() != YT.PlayerState.PLAYING) playVideo();
  else pauseVideo();
});

// Upon receiving MediaStop command from main, stop player.
ipc.on("MediaStop", function (event, response) {
  stopVideo();
});

// Upon receiving MediaNextTrack command from main, play next song.
ipc.on("MediaNextTrack", function (event, response) {
  playNext();
});

// Upon receiving MediaPreviousTrack command from main, play previous song.
ipc.on("MediaPreviousTrack", function (event, response) {
  playPrevious();
});

// Makes sure PLAY is a valid command to send and then sends PLAY command to server.
function playVideo() {  
  // TODO: Make client not send PLAY command if next is not available.
  //       Want to make sure server can handle invalid PLAY commands first.
  socket.emit(PLAY);
}

// Makes sure PAUSE is a valid command to send and then sends PAUSE command to server.
function pauseVideo() { 
  // TODO: Make client not send PAUSE command if next is not available.
  //       Want to make sure server can handle invalid PAUSE commands first.
  socket.emit(PAUSE);
}

// Makes sure STOP is a valid command to send and then sends STOP command to server.
function stopVideo() {  
  // TODO: Make client not send STOP command if next is not available.
  //       Want to make sure server can handle invalid STOP commands first.
  socket.emit(STOP);
}

// Makes sure NEXT is a valid command to send and then sends NEXT command to server.
function playNext() { 
  // TODO: Make client not send NEXT command if next is not available.
  //       Want to make sure server can handle invalid NEXT commands first.
  socket.emit(NEXT);
}

// Makes sure PREVIOUS is a valid command to send and then sends PREVIOUS command to server.
function playPrevious() { 
  // TODO: Make client not send PREVIOUS command if next is not available.
  //       Want to make sure server can handle invalid PREVIOUS commands first.
  socket.emit(PREVIOUS);
}

// Plays the previous song in the queue.
function playPreviousSong(event) {
  console.log("PLAYING PREVIOUS SONG", event);
  histPos++;
  changeVideo(watchHist[watchHist.length - histPos]);
}

document.getElementById('minimize-button').addEventListener('click', () => {
  remote.getCurrentWindow().minimize()
})

document.getElementById('min-max-button').addEventListener('click', () => {
  const currentWindow = remote.getCurrentWindow()
  if(currentWindow.isMaximized()) {
    currentWindow.unmaximize()
  } else {
    currentWindow.maximize()
  }
})

document.getElementById('close-button').addEventListener('click', () => {
  remote.app.quit()
})
