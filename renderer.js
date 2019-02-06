        // 2. This code loads the IFrame Player API code asynchronously.
        var tag = document.createElement('script');
        var player;
        var curId = 'J_CFBjAyPWE'; //'ypsQuQnoZLY';
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


        document.getElementById("search").onkeydown = function(event) {
            if(event.keyCode == 13) {
                search();    
            }
        }


        function search() {
            var q = document.getElementById("search").value;
            q = encodeURIComponent(q);
            url = "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=" + q +"&type=video&key=" + key
            $.getJSON(url, function(data) {
                curId = data.items[0].id.videoId;
                player.loadVideoById(player.videoId = curId);
                addHist(curId);
            })
            document.getElementById("search").value = "";
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
                url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&relatedToVideoId=' + curId + '&type=video&videoEmbeddable=true&fields=items%2Fid&key=' + key
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