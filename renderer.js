        // 2. This code loads the IFrame Player API code asynchronously.
        var tag = document.createElement('script');
        var player;
        var curId = 'J_CFBjAyPWE'; //'ypsQuQnoZLY';
        var watchHist = [curId];
        var histPos = 0; //Pos from the right
        const MAXWATCHHIST = 20;
        const MAXRESULTS = 10;

        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        // 3. This function creates an <iframe> (and YouTube player)
        //    after the API code downloads.
        function onYouTubeIframeAPIReady() {
            player = new YT.Player('player', {
                videoId: curId,
                events: {
                'onReady': onPlayerReady,
                'onStateChange': changeVideoOnEnd, //onPlayerStateChange
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
        }

        // 4. The API will call this function when the video player is ready.
        function onPlayerReady(event) {
            player.playVideo();
        }


        document.getElementById("search").onkeydown = function(event) {
            resetSearch(false)
            if(event.keyCode == 13) {
                search();
            }
        }

        function changeVideoWithId(id) {
            changeVideo(id);
            addHist(id);
            resetSearch()
        }

        function resetSearch(resetQ=true) {
            document.getElementById("queryResultContainer").innerHTML = "";
            if(resetQ)
                document.getElementById("search").value = "";
        }

        function search() {
            var q = document.getElementById("search").value;
            q = encodeURIComponent(q);
            // url = "https://www.googleapis.com/youtube/v3/search?part=snippet&videoSyndicated=true&videoEmbeddable=true&maxResults=" + MAXRESULTS + "&q=" + q +"&type=video&key=" + key
            url = "https://www.googleapis.com/youtube/v3/search?part=snippet&eventType=completed&maxResults=" + MAXRESULTS + "&q=" + q +"&type=video&videoEmbeddable=true&videoSyndicated=true&fields=items(id%2FvideoId%2Csnippet(channelTitle%2Cthumbnails%2Fdefault%2Furl%2Ctitle))&key=" + key
            $.getJSON(url, function(data) {
                console.log(data);
                for(x = 0; x< data.items.length; x++) {
                    var title = data.items[x].snippet.title;
                    if (title.length > 42)
                        title = title.substring(0,42) + "...";
                    (document.getElementById("queryResultContainer")).innerHTML += 
                        `
                        <div class="queryResult" onclick="changeVideoWithId('${data.items[x].id.videoId}')">
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

        function addHist(id) {
            if (watchHist.length >= MAXWATCHHIST)
                watchHist.shift();
            watchHist.push(id);
        }

        function playNext() {
            if (histPos <= 0) {
                changeVideoOnEnd({data: 0});
                histPos = 0;
            }
            else {
                histPos--;
                changeVideo(watchHist[watchHist.length - 1 - histPos]);
            }
        }

        function playPrevious() {
            if (histPos < watchHist.length - 1) {
                histPos++;
                changeVideo(watchHist[watchHist.length - 1 - histPos]);
            }
        }

        var key
        fetch('key.txt')
            .then(response => response.text())
            .then(text => {key = text;});
    

        function changeVideoOnEnd(event) {
            if (event.data === 0) {
                console.log("VIDEO ENDED")
                // url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&videoSyndicated=true&maxResults=' + MAXRESULTS + '&relatedToVideoId=' + curId + '&type=video&videoEmbeddable=true&fields=items%2Fid&key=' + key
                url = "https://www.googleapis.com/youtube/v3/search?part=snippet&eventType=completed&maxResults=" + MAXRESULTS + "&relatedToVideoId=" + curId + "&type=video&videoEmbeddable=true&videoSyndicated=true&fields=items(id%2FvideoId%2Csnippet(channelTitle%2Cthumbnails%2Fdefault%2Furl%2Ctitle))&key=" + key;
                $.getJSON(url, function(data) {
                    curId = data.items[Math.floor(Math.random() * data.items.length)].id.videoId;
                    player.loadVideoById(player.videoId = curId);
                    addHist(curId);
                })
            }
        }

        function changeVideo(id) {
            player.loadVideoById(player.videoId = id);
            curId = id;
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