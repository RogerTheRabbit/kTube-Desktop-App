        // 2. This code loads the IFrame Player API code asynchronously.
        var tag = document.createElement('script');
        var player;
        var curId = 'pHtxTSiPh5I'; //'ypsQuQnoZLY';
        var watchHist = [curId];
        var histPos = 0; //Pos from the right
        const MAXWATCHHIST = 20;

        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        // 3. This function creates an <iframe> (and YouTube player)
        //    after the API code downloads.
        function onYouTubeIframeAPIReady() {
            player = new YT.Player('player', {
                height: '390',
                width: '640',
                videoId: curId,
                events: {
                'onReady': onPlayerReady,
                'onStateChange': changeVideoOnEnd //onPlayerStateChange
                }
            });
        }

        // 4. The API will call this function when the video player is ready.
        function onPlayerReady(event) {
            player.playVideo();
        }

        // 5. The API calls this function when the player's state changes.
        //    The function indicates that when playing a video (state=1),
        //    the player should play for six seconds and then stop.
        // var done = false;
        function onPlayerStateChange(event) {
            // if (event.data == YT.PlayerState.PLAYING && !done) {
            //   setTimeout(stopVideo, 6000);
            //   done = true;
            // }
        }

        function stopVideo(event) {
            event.target.stopVideo();
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
                console.log(watchHist.length - 1 - histPos)
                changeVideo(watchHist[watchHist.length - 1 - histPos]);
            }
        }

        function playPrevious() {
            if (histPos < watchHist.length - 1) {
                histPos++;
                console.log(watchHist.length - 1 - histPos)
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
                url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&relatedToVideoId=' + curId + '&type=video&videoDuration=short&videoEmbeddable=true&fields=items%2Fid&key=' + key
                $.getJSON(url, function(data) {
                    curId = data.items[0].id.videoId;
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