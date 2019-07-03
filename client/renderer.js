var io = require("socket.io-client");


// TODO: For testing purposes -- Remove later.
const fs = require('fs');
var ip = fs.readFileSync('ip.txt');

//Make connection
// var socket = io.connect("http://localhost:4000");
var socket = io.connect("http://" + ip + ":4000");
console.log("Trying to connect to:", "http://" + ip + ":4000");

// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement("script");
var player;
// var curId = 'J_CFBjAyPWE'; //'ypsQuQnoZLY';
var watchHist = []; // {id:'Huggdy7ohb4', thumbnail:''}
var histPos = 0;
// var histPos = 0; //Pos from the right
var key;
fetch("key_YouTube.txt")
  .then(response => response.text())
  .then(text => {
    key = text;
  });

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
const MAXRESULTS = 10;
const PLAY = 0;
const PAUSE = 1;
const STOP = 2;
const PREVIOUS = 3;
const NEXT = 4;
const WAITING = 5;

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    // videoId: 'Huggdy7ohb4',
    playerVars: {
      'autoplay': 1, // ?? to enable autoplay, ?? to disable autoplay.
      'controls': 0, // 0 to hide, 1 to show player controls. 
      'fs': 0, // 0 to disable fullscreen, 1 to enable fullscreen button.
      'disablekb': 1 // 0 to enable keyboard controls, 1 to disable keyboard controls
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: videoEnded, //onPlayerStateChange
      onError: onError
    }
  });
}

function videoEnded(event = { data: 0 }) {

  // -1 – unstarted
  //  0 – ended
  //  1 – playing
  //  2 – paused
  //  3 – buffering
  //  5 – video cued

  console.log("videoEnded event=", event);
  if (event.data === 0) {
    socket.emit(VIDEO_ENDED);
  }

  // For some reason only the player emitting PLAY command plays when it receives
  // the PLAY command back.  All other players get set to -1 (Unstarted).
  // if (event.data === 5) {
  //   console.log("VIDEO BUFFERING, PLAYING VIDEO")
  //   event.target.playVideo();
  //   // player.playVideo();
  //   console.log("Video playing:", player.getPlayerState())
  // }
  // if (event.data === -1) {
  //   console.log("VIDEO UNSTARTED, PLAYING VIDEO")
  //   // player.playVideo();
  //   event.target.playVideo();
  //   console.log("Video playing:", player.getPlayerState())
  // }

}

// The player API will call this function when the video player is ready.
function onPlayerReady(event) {
  document.getElementById("volumeSlider").value = player.getVolume();
  socket.emit(SYNC);
}

function onError(event) {
  // 2 – The request contains an invalid parameter value. For example, this error occurs if you specify a video ID that does not have 11 characters, or if the video ID contains invalid characters, such as exclamation points or asterisks.
  // 5 – The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred.
  // 100 – The video requested was not found. This error occurs when a video has been removed (for any reason) or has been marked as private.
  // 101 – The owner of the requested video does not allow it to be played in embedded players.
  // 150 – This error is the same as 101. It's just a 101 error in disguise!

  console.log(event);

  // if (event.data === 150 || event.data === 101) {
  //     console.log("Failed to load video: Video not embeddable...picking next related song");
  //     changeVideoOnEnd({data:0});
  // }
  // else {
  //     console.log("Failed to laod video: see onError(event) in renderer.js for more details.");
  //     console.log(event.data);
  // }
}

document.getElementById("search").onkeydown = function (event) {
  // // If backspace pressed
  // if (event.keyCode === 8) {
  //   resetSearch(true);
  //   lastSearch = "";
  // }
  // If enter pressed
  if (event.keyCode === 13) {
    search();
  }
};

function createRoom(name, password) {
  socket.emit(CREATE_ROOM, {
    name: name,
    password: password
  });
}

function joinRoom(name, password, username) {
  socket.emit(JOIN_ROOM, {
    name: name,
    password: password,
    username: username
  });
  socket.on(SUCCESS, function () {
    // TODO: Handle successful joinRoom.
  });
}

createRoom("This is a room name dab dab dab", "Password123");
joinRoom("This is a room name dab dab dab", "Password123");

// Handel any errors that occur.
socket.on(ERROR, function (reason) {
  switch (reason.type) {
    case INVALID_CREDS:
      // TODO Handle invalid creds.
      console.log(
        "Either invalid room name or invalid password when connecting to room."
      );
      break;
    default:
      console.log("Unknown error:", reason);
  }
});

socket.on(SYNC, function (state) {
  console.log("RECEIVED SYNC");
  console.log("state", state);
  watchHist = state.queue;
  histPos = state.histPos;
  // TODO: Set player to current song at current time.
  if (watchHist.length > 0) {
    updateQueue();
    changeVideo(watchHist[watchHist.length - histPos]);
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

// Tell server what song to add to queue
function addSong(id, thumbnail, title, channelTitle) {
  socket.emit(ADD_SONG, { id: id, thumbnail: thumbnail, title: String(title), channelTitle: channelTitle });
}

socket.on(ADD_SONG, function (song) {
  console.log("Received ADD_SONG:", song);
  watchHist.push({ song });
  histPos++;
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

socket.on(PLAY, function () {
  console.log("Received PLAY: watchHist=", watchHist);
  console.log("histPos:", histPos);
  player.playVideo();
  console.log("PlayerState:", player.getPlayerState());
});

socket.on(PAUSE, function () {
  console.log("Received PAUSE: watchHist=", watchHist);
  player.pauseVideo();
});

socket.on(STOP, function () {
  console.log("Received STOP: watchHist=", watchHist);
  player.stopVideo();
});

socket.on(NEXT, function () {
  histPos--;
  console.log("Received NEXT: watchHist=", watchHist);
  changeVideo(watchHist[watchHist.length - histPos]);
});

socket.on(PREVIOUS, function () {
  playPreviousSong();
  console.log("Received PREVIOUS: watchHist=", watchHist);
});

function resetSearch(resetQ = true) {
  document.getElementById("queryResultContainer").innerHTML = "";
  if (resetQ) document.getElementById("search").value = "";
}

function focusNav() {
  document.getElementsByClassName("nav")[0].focus();
  document.getElementById("queryResultContainer").hidden = false;
}

function blurNav() {
  document.getElementById("queryResultContainer").hidden = true;
}

var lastSearch = "";
function search() {
  focusNav();
  var q = document.getElementById("search").value.trim();
  if (lastSearch === q || q === "") {
    return;
  }
  lastSearch = q;
  resetSearch(false);
  q = encodeURIComponent(q);
  // url = "https://www.googleapis.com/youtube/v3/search?part=snippet&videoSyndicated=true&videoEmbeddable=true&maxResults=" + MAXRESULTS + "&q=" + q +"&type=video&fields=items(id%2FvideoId%2Csnippet(channelTitle%2Cthumbnails%2Fdefault%2Furl%2Ctitle))&key=" + key
  // url = "https://www.googleapis.com/youtube/v3/search?part=snippet&eventType=completed&maxResults=" + MAXRESULTS + "&q=" + q +"&type=video&videoEmbeddable=true&videoSyndicated=true&fields=items(id%2FvideoId%2Csnippet(channelTitle%2Cthumbnails%2Fdefault%2Furl%2Ctitle))&key=" + key
  url =
    "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=" +
    MAXRESULTS +
    "&q=" +
    q +
    "&regionCode=us&type=video&videoEmbeddable=true&fields=items(id%2FvideoId%2Csnippet(channelTitle%2Cthumbnails%2Fdefault%2Furl%2Ctitle))&key=" +
    key;
  $.getJSON(url, function (data) {
    console.log(data);
    for (x = 0; x < data.items.length; x++) {
      var title = data.items[x].snippet.title;
      if (title.length > 42) title = title.substring(0, 42) + "...";
      //TODO: If there is a single quote in the title, it will break the string and is also an opening for XSS attack.
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

// Update the --progress property of the current playing song with a value of the current percentage through song.
// CSS for #current reads --progress property to show progress
function updateProgress() {
  document.getElementById("current").style.setProperty("--progress", (100 * player.getCurrentTime() / player.getDuration()) + "%");
}

function updateVolume(newVolume) {
  player.setVolume(newVolume);
}

function changeVideo(video) {
  console.log("video", video);
  player.loadVideoById((player.videoId = video.id));
  // player.cueVideoById((player.videoId = id));
  document.getElementById("thumbnail").src = video.thumbnail;
  updateQueue();
}

// This is a dumb way of doing this and should be made more efficient
// But I needed something quick for testing.
function updateQueue() {

  console.log("UPDATING QUEUE");

  document.getElementById("queueContainer").innerHTML = "";
  var data;
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

var ipc = require("electron").ipcRenderer;
ipc.on("MediaPlayPause", function (event, response) {
  if (player.getPlayerState() != YT.PlayerState.PLAYING) playVideo();
  else pauseVideo();
});

ipc.on("MediaStop", function (event, response) {
  stopVideo();
});

ipc.on("MediaNextTrack", function (event, response) {
  playNext();
});

ipc.on("MediaPreviousTrack", function (event, response) {
  playPrevious();
});

function playVideo() {
  // TODO: Make client not send PLAY command if next is not available.
  //       Want to make sure server can handle invalid PLAY commands first.
  socket.emit(PLAY);
}

function pauseVideo() {
  // TODO: Make client not send PAUSE command if next is not available.
  //       Want to make sure server can handle invalid PAUSE commands first.
  console.log("pauseVideo() called!");
  socket.emit(PAUSE);
}

function stopVideo() {
  // TODO: Make client not send STOP command if next is not available.
  //       Want to make sure server can handle invalid STOP commands first.
  console.log("stopVideo() called!");
  socket.emit(STOP);
}

function playNext() {
  // TODO: Make client not send NEXT command if next is not available.
  //       Want to make sure server can handle invalid NEXT commands first.
  console.log("playNext() called!");
  socket.emit(NEXT);
}

function playPrevious() {
  // TODO: Make client not send PREVIOUS command if next is not available.
  //       Want to make sure server can handle invalid PREVIOUS commands first.
  console.log("playPrevious() called!");
  socket.emit(PREVIOUS);
}

function playPreviousSong(event) {
  console.log("PLAYING PREVIOUS SONG", event);
  // if (histPos < watchHist.length - 1) {
  histPos++;
  changeVideo(watchHist[watchHist.length - histPos]);
  // } else console.log("No previous videos in queue");
}
