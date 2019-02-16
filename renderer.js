// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');
var player;
// var curId = 'J_CFBjAyPWE'; //'ypsQuQnoZLY';
var watchHist = [{id:'J_CFBjAyPWE', thumbnail:''}];
var histPos = 0;
// var histPos = 0; //Pos from the right
const MAXWATCHHIST = 20;
const MAXRESULTS = 10;
const SONG = 1;

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        videoId: 'J_CFBjAyPWE',
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
    player.playVideo();
}


document.getElementById("search").onkeydown = function(event) {
    if(event.keyCode == 13) {
        search();
    }
}

async function hide() {
    setInterval(function(){document.getElementById("queryResultContainer").hidden = true;}, 500);
}

document.getElementById("search").focusout = function(event) {
    console.log("FOCUSED OUT");
    hide();
}

document.getElementById("search").focusin = function(event) {
    console.log("FOCUSED IN");
    document.getElementById("queryResultContainer").hidden = false;
}

function updateCloud(id, thumbnail) {
    console.log("UPDATING CLOUDDD");
    syncClient.list('MyList')
    .then(function(list) {
        list.push({
            type: SONG,
            id: id,
            thumbnail: thumbnail
        }).then(function(item) {
            console.log('Added: ', item.index);
        }).catch(function(err) {
            console.error(err);
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

function playNext() {
    console.log("playNext() not currently working atm")
//     if (histPos <= 0) {
//         //changeVideoOnEnd({data: 0});
//         console.log("No more vidoes in queue, add videos to watch more");
//         histPos = 0;
//     }
//     else {
//         histPos--;
//         changeVideoWithId(watchHist[watchHist.length - 1 - histPos]);
//     }
}

function playPrevious() {
    console.log("playPrevious() not currently working atm")
//     if (histPos < watchHist.length - 1) {
//         histPos++;
//         changeVideoWithId(watchHist[watchHist.length - 1 - histPos]);
//     }
}

function updateVolume(newVolume) {
    player.setVolume(newVolume);
}

var key;
fetch('key_YouTube.txt')
    .then(response => response.text())
    .then(text => {key = text;});


// function changeVideoOnEnd(event) {
    // if (event.data === 0) {
    //     console.log("VIDEO ENDED");
    //     // url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&videoSyndicated=true&maxResults=' + MAXRESULTS + '&relatedToVideoId=' + curId + '&type=video&videoEmbeddable=true&fields=items(id%2FvideoId%2Csnippet(channelTitle%2Cthumbnails%2Fdefault%2Furl%2Ctitle))&key=' + key
    //     // url = "https://www.googleapis.com/youtube/v3/search?part=snippet&eventType=completed&maxResults=" + MAXRESULTS + "&relatedToVideoId=" + curId + "&type=video&videoEmbeddable=true&videoSyndicated=true&fields=items(id%2FvideoId%2Csnippet(channelTitle%2Cthumbnails%2Fdefault%2Furl%2Ctitle))&key=" + key;
    //     url = "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=" + MAXRESULTS +"&regionCode=us&relatedToVideoId=" + curId + "&type=video&videoEmbeddable=true&fields=items(id%2FvideoId%2Csnippet%2Fthumbnails%2Fdefault%2Furl)&key=" + key;
    //     $.getJSON(url, function(data) {
    //         var x = Math.floor(Math.random() * data.items.length);
    //         curId = data.items[x].id.videoId;
    //         player.loadVideoById(player.videoId = curId);
    //         document.getElementById("thumbnail").src = data.items[x].snippet.thumbnails.default.url;
    //         addHist(curId);
    //     })
    // }
// }

function videoEnded(event) {
    console.log(event);
    if(event.data == 0) {
        console.log("VIDEO ENDEDEDEDEDED");
        console.log(watchHist[histPos]);
        if (histPos > 0)
            changeVideo(watchHist[histPos].id, watchHist[histPos].thumbnail);
        else
            console.log("Video Ended but no more videos in queue");
    }
    // syncClient.map('clientState')
    //     .then(function(state) {
    //         state.update('pos', state.get('pos') + 1);
    //     }).catch(function(error) {
    //         console.log(error);
    //     })
}

function changeVideo(id, thumbnail) {
    player.loadVideoById(player.videoId = id);
    document.getElementById("thumbnail").src = thumbnail;
}

var ipc = require('electron').ipcRenderer
ipc.on('MediaPlayPause', function(event, response) {
    if (player.getPlayerState() != YT.PlayerState.PLAYING) 
        player.playVideo();
    else
        player.pauseVideo();
})

ipc.on('MediaStop', function(event, response) {
    player.stopVideo();
})

ipc.on('MediaNextTrack', function(event, response) {
    playNext();
})

ipc.on('MediaPreviousTrack', function(event, response) {
    playPrevious();
})



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

syncClient.list('MyList')
    .then(function(list) {

        // list.push({
        //     video: '{VIDEO_ID}',
        //     thumb: '{THUMBNAIL.PNG}'
        // }).then(function(item) {
        //     console.log('Added: ', item.index);
        // }).catch(function(err) {
        //     console.error(err);
        // });

        // list.removeList();

        console.log('Successfully opened a List. SID: ' + list.sid);
        list.on('itemAdded', function(event) {
            console.log('Received itemAdded event: ', event);
            if (event.item.data.value.type == SONG) {
                watchHist.push({id:event.item.data.value.id, thumbnail:event.item.data.value.thumbnail});
                histPos++;
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
