// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');
var player;
// var curId = 'J_CFBjAyPWE'; //'ypsQuQnoZLY';
var watchHist = []; // {id:'Huggdy7ohb4', thumbnail:''}
var histPos = 0;
// var histPos = 0; //Pos from the right
const MAXWATCHHIST = 20;
const MAXRESULTS = 10;
const SONG = 1;
const STOP = 0;
const PLAY = 1;
const PAUSE = 2;
const NEXT = 3;
const PREVIOUS = 4;

// Initalize client
var syncClient;
$.ajax({
    async: false,
    url: "https://bubbles-kangaroo-6898.twil.io/sync-token",
    success: function(data) {
        var token = data.token;
        syncClient = new Twilio.Sync.Client(token, { 
            // logLevel: 'debug', 
            id: 'MyId3'
        });
    }
})

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        // videoId: 'Huggdy7ohb4',
        events: {
        'onReady': onPlayerReady,
        'onStateChange': videoEnded, //onPlayerStateChange
        'onError': onError
        }
    });
}

function onError(event) {
    // 2 – The request contains an invalid parameter value. For example, this error occurs if you specify a video ID that does not have 11 characters, or if the video ID contains invalid characters, such as exclamation points or asterisks.
    // 5 – The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred.
    // 100 – The video requested was not found. This error occurs when a video has been removed (for any reason) or has been marked as private.
    // 101 – The owner of the requested video does not allow it to be played in embedded players.
    // 150 – This error is the same as 101. It's just a 101 error in disguise!

    console.log(event);

    // if (event.data==150 || event.data == 101) {
    //     console.log("Failed to load video: Video not embeddable...picking next related song");
    //     changeVideoOnEnd({data:0});
    // }
    // else {
    //     console.log("Failed to laod video: see onError(event) in renderer.js for more details.");
    //     console.log(event.data);
    // }
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
    document.getElementById("volumeSlider").value = player.getVolume();
}


document.getElementById("search").onkeydown = function(event) {
    if(event.keyCode == 8) {
        resetSearch(true);
    }
    if(event.keyCode == 13) {
        search();
    }
}

// async function hide() {
//     setInterval(function(){document.getElementById("queryResultContainer").hidden = true;}, 500);
// }

// document.getElementById("search").focusout = function(event) {
//     console.log("FOCUSED OUT");
//     hide();
// }

// document.getElementById("search").focusin = function(event) {
//     console.log("FOCUSED IN");
//     document.getElementById("queryResultContainer").hidden = false;
// }

function updateCloud(id, thumbnail) {
    console.log("UPDATING CLOUDDD");
    syncClient.list('queue')
        .then(function(list) {
            list.push({
                type: SONG,
                id: id,
                thumbnail: thumbnail
            }).then(function(item) {
                console.log('Added: ', item.index);
            }).catch(function(err) {
                console.error("updateCloud(): Error could not update list", err);
            });
    })
    .catch(function(error) {
        console.log('Unexpected error', error);
    });
}

function resetSearch(resetQ=true) {
    document.getElementById("queryResultContainer").innerHTML = "";
    if(resetQ)
        document.getElementById("search").value = "";
}

var lastSearch = "";
function search() {
    var q = document.getElementById("search").value.trim();
    if(lastSearch == q || q == "") {
        return;
    }
    lastSearch = q;
    resetSearch(false);
    q = encodeURIComponent(q);
    // url = "https://www.googleapis.com/youtube/v3/search?part=snippet&videoSyndicated=true&videoEmbeddable=true&maxResults=" + MAXRESULTS + "&q=" + q +"&type=video&fields=items(id%2FvideoId%2Csnippet(channelTitle%2Cthumbnails%2Fdefault%2Furl%2Ctitle))&key=" + key
    // url = "https://www.googleapis.com/youtube/v3/search?part=snippet&eventType=completed&maxResults=" + MAXRESULTS + "&q=" + q +"&type=video&videoEmbeddable=true&videoSyndicated=true&fields=items(id%2FvideoId%2Csnippet(channelTitle%2Cthumbnails%2Fdefault%2Furl%2Ctitle))&key=" + key
    url = "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=" + MAXRESULTS + "&q=" + q + "&regionCode=us&type=video&videoEmbeddable=true&fields=items(id%2FvideoId%2Csnippet(channelTitle%2Cthumbnails%2Fdefault%2Furl%2Ctitle))&key=" + key;
    $.getJSON(url, function(data) {
        console.log(data);
        for(x = 0; x< data.items.length; x++) {
            var title = data.items[x].snippet.title;
            if (title.length > 42)
                title = title.substring(0,42) + "...";
            (document.getElementById("queryResultContainer")).innerHTML += 
                `
                <div class="queryResult" onclick="updateCloud('${data.items[x].id.videoId}', '${data.items[x].snippet.thumbnails.default.url}')">
                    <img src="${data.items[x].snippet.thumbnails.default.url}" alt="">
                    <div class="queryResultText">
                        <h4>${title}</h4>
                        <h6>${data.items[x].snippet.channelTitle} - 5:06</h6>
                    </div>
                </div>
                `;
        }
    })
}

function updateVolume(newVolume) {
    player.setVolume(newVolume);
}

var key;
fetch('key_YouTube.txt')
    .then(response => response.text())
    .then(text => {key = text;});

function videoEnded(event={data: 0}) {
    console.log(event);
    if(event.data == 0) {
        console.log("VIDEO ENDEDEDEDEDED");
        if (histPos > 0) {
            histPos--;
            changeVideo(watchHist[watchHist.length - histPos - 1].id, watchHist[watchHist.length - histPos - 1].thumbnail);
        }
        else
            console.log("Video Ended but no more videos in queue");
    }
    // else{
    //     console.log("videoEnded() called but event.data did not say video ended");
    // }
}

function playPreviousSong(event) {
    console.log("PLAYING PREVIOUS SONG", event);
    if (histPos < watchHist.length - 1) {
        histPos++;
        changeVideo(watchHist[watchHist.length - histPos - 1].id, watchHist[watchHist.length - histPos - 1].thumbnail);
    }
    else
        console.log("No previous videos in queue");
}

function changeVideo(id, thumbnail) {
    player.loadVideoById(player.videoId = id);
    document.getElementById("thumbnail").src = thumbnail;
    updateQueue();
}

// This is a dumb way of doing this and should be made more efficient 
// But I needed something quick for testing.
function updateQueue() {
    document.getElementById("queueContainer").innerHTML = "";
    var data;
    var title = "DEFINITLY THE REAL TITLE OF THIS VIDEO";
    var channelTitle = "THE BEST CHANNEL TITLE EVER"
    for(var x = 0; x < watchHist.length; x++) {
        (x == watchHist.length - histPos - 1)
        document.getElementById("queueContainer").innerHTML +=(
            `
            <div class="queryResult" id="${(x == watchHist.length - histPos - 1) ? "current" : ""}">
                <img src="${watchHist[x].thumbnail}" alt="THUMBNAIL NOT AVALIABLE">
                <div class="queryResultText">
                    <h4>${title}</h4>
                    <h6>${channelTitle} - 5:06</h6>
                </div>
            </div>
            `
        );
    }
}


var ipc = require('electron').ipcRenderer
ipc.on('MediaPlayPause', function(event, response) {
    if (player.getPlayerState() != YT.PlayerState.PLAYING) 
        playVideo();
    else
        pauseVideo();
})

ipc.on('MediaStop', function(event, response) {
    stopVideo();
})

ipc.on('MediaNextTrack', function(event, response) {
    playNext();
})

ipc.on('MediaPreviousTrack', function(event, response) {
    playPrevious();
})

function playVideo() {
    console.log("playVideo() called!");
    syncClient.map('clientState')
        .then(function(state) {
            state.update('playerState', {'STATE': PLAY});
        }).catch(function(error) {
            console.log("playerState not preiviously set: setting to PLAY");
            state.set('playerState', {'STATE': PLAY});
        })
}

function pauseVideo() {
    console.log("pauseVideo() called!");
    syncClient.map('clientState')
        .then(function(state) {
            state.update('playerState', {'STATE': PAUSE});
        }).catch(function(error) {
            console.log("playerState not preiviously set: setting to PAUSE");
            state.set('playerState', {'STATE': PAUSE});
        })
}

function stopVideo() {
    console.log("stopVideo() called!");
    syncClient.map('clientState')
        .then(function(state) {
            state.update('playerState', {'STATE': STOP});
        }).catch(function(error) {
            console.log("playerState not preiviously set: setting to STOP");
            state.set('playerState', {'STATE': STOP});
        })
}

function playNext() {
    console.log("playNext() called!");
    syncClient.map('clientState')
        .then(function(state) {
            state.update('playerState', {'STATE': NEXT});
        }).catch(function(error) {
            console.log("playerState not preiviously set: setting to NEXT");
            state.set('playerState', {'STATE': NEXT});
        })
}

function playPrevious() {
    console.log("playPrevious() called!");
    syncClient.map('clientState')
        .then(function(state) {
            state.update('playerState', {'STATE': PREVIOUS});
        }).catch(function(error) {
            console.log("playerState not preiviously set: setting to PREVIOUS");
            state.set('playerState', {'STATE': PREVIOUS});
        })
}


function handleMapUpdate(item) {
    var key = item.item.descriptor.key;
    var data = item.item.descriptor.data
    if(key == 'playerState') {
        if(data.STATE == PLAY) {
            console.log(player.videoId);
            if((player.videoId == null || player.getPlayerState() == YT.PlayerState.ENDED) && watchHist.length > 0) {
                histPos--;
                changeVideo(watchHist[watchHist.length - histPos - 1].id, watchHist[watchHist.length - histPos - 1].thumbnail);
            }
            else if (watchHist.length > 0) {
                player.playVideo();
            }
        }
        else if(data.STATE == PAUSE) {
            player.pauseVideo();
        }
        else if(data.STATE == STOP) {
            player.stopVideo();
        }
        else if(data.STATE == NEXT) {
            videoEnded();
        }
        else if(data.STATE == PREVIOUS) {
            playPreviousSong();
        }
    }
}

syncClient.map('clientState')
        .then(function(state) {
            state.on('itemUpdated', function(item) {
                console.log(item);
                handleMapUpdate(item);
            })
            state.on('itemAdded', function(item) {
                console.log(item);
                handleMapUpdate(item);
            })
        }).catch(function(error) {
            console.log("playerState not preiviously set in subscription: setting to PLAY");
            state.set('playerState', {'STATE': PLAY});
        })

syncClient.list('queue')
    .then(function(list) {

        // list.removeList();

        console.log('Successfully opened a List. SID: ' + list.sid);
        list.on('itemAdded', function(event) {
            console.log('Received itemAdded event: ', event);
            if (event.item.data.value.type == SONG) {
                watchHist.push({id:event.item.data.value.id, thumbnail:event.item.data.value.thumbnail});
                histPos++;
                updateQueue();
            }
                
            list.getItems().then(function(items) {
                if(items.length > MAXWATCHHIST) {
                    list.remove(0).then(function() {
                        console.log('deleted first item');
                      });
                }
            })
        });


        list.getItems().then(function(page) {
            console.log('Items in list', page.items);
        });

    })
    .catch(function(error) {
    console.log('Unexpected error', error);
});

syncClient.map('clientState').then(function(map) {
    map.getItems().then(function(page) {
        console.log('clientState map: ', page.items);
    });
    // map.removeMap();
  });

// Used for clearing queues
function resetCloud() {
    syncClient.map('clientState')
        .then(function(map) {
            map.removeMap();
        });

    syncClient.list('queue')
        .then(function(list) {
            list.removeList();
        });
}
