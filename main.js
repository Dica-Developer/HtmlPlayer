var songHistory = [];
var notScrobbled = true;

function addToHistory(song) {
  songHistory.push(song);
  if (songHistory.length > 1000) {
    songHistory.shift();
  }
}

function applyCoverArtStyle() {
  document.getElementById("coverArt").height = $(document).height() * 0.6;
  $("#coverArt").reflect({height:0.165, opacity:0.25});
}

function next() {
  var song = getFirstPlaylistElement();
  if (null !== song) {
    startPlay(song);
    removeFirstPlaylistElement();
    addToHistory(song);
    applyCoverArtStyle();
  }
}

function previous() {
  if (songHistory.length > 0) {
    var song = songHistory.pop();
    if (null !== song) {
      startPlay(song);
      setFirstPlaylistElement(song);
      applyCoverArtStyle();
    }
  }
}

function getLastSong() {
  var song = null;
  if (songHistory.length > 0) {
    song = songHistory[songHistory.length - 1];
  }
  return song;
}

function updateProgress() {
  var audio = document.getElementById('player');
  if (!audio.paused) {
    var progress = document.getElementById('progressBar');
    progress.value = Math.round((audio.currentTime * 100) / audio.duration);
  }
}

function setNowPlaying() {
  var song = getLastSong();
  if (null !== song) {
    (new Scrobbler(localStorage["audica.lastfm.sessionKey"], localStorage["audica.lastfm.login"])).setNowPlaying(song.artist, song.title, song.album, song.duration,
      function (data) {
        if (undefined !== data.error) {
          switch (data.error) {
            case 6:
            case 13:
              console.warn("Cannot set now playing there is a parameter missing/wrong!", data.message);
              break;
            default:
              alert("Cannot set last.fm now playing track. " + data.error + " - " + data.message);
          }
        }
      }, null);
  }
}

function updateTimings() {
  if ($("#playerControlView").data("open")) {
    var audio = document.getElementById('player');
    if (!audio.paused) {
      var field = document.getElementById('timeField');
      field.innerHTML = Math.round(audio.currentTime) + " / " + Math.round(audio.duration);
    }
  }
}

function scrobble() {
  var audio = document.getElementById('player');
  if (!audio.paused) {
    if (Math.round((audio.currentTime * 100) / audio.duration) > 50 && notScrobbled) {
      var song = getLastSong();
      if (null !== song) {
        var timestamp = parseInt((new Date()).getTime() / 1000.0);
        (new Scrobbler(localStorage["audica.lastfm.sessionKey"], localStorage["audica.lastfm.login"])).scrobble(song.artist, song.title, song.album, song.duration,
          timestamp,
          function (data) {
            if (undefined !== data.error) {
              switch (data.error) {
                case 6:
                case 13:
                  console.warn("Cannot scrobble the song there is a parameter missing/wrong!", data.message);
                  notScrobbled = true;
                  break;
                default:
                  alert("Cannot scrobble track to last.fm. " + data.error + " - " + data.message);
              }
            } else {
              notScrobbled = false;
            }
          }, null);
      }
    }
  }
}

function backgroundTasks() {
  updateProgress();
  updateTimings();
  scrobble();
}

function updateSongList() {
  var currentSongList = localStorage["songs.list"];
  if (null !== currentSongList && undefined !== currentSongList) {
    fillSongBox(JSON.parse(currentSongList), null);
  }
  searchForSongs("", collectSongs, null, null);
}

$(function () {
//  if (null === localStorage["serverUrl"] || undefined === localStorage["serverUrl"]) {
//    if (window.File && window.FileReader && window.FileList && window.Blob) {
//      View.showNoSongsMessage();
//    } else {
//      console.log('no');
//    }
//  } else {
//    updateSongList();
//  }

  $("#songBox").on("keyup", function (event) {
    if (39 === event.which) {
      $("#songBox :selected").clone().appendTo("#playlistBox");
    }
  });
  $("#playlistBox").on("keyup", function (event) {
    if (37 === event.which) {
      $("#playlistBox :selected").detach();
    }
  });

  $(document).on("keyup", function (event) {
    if ('player' === viewState) {
      switch (event.which) {
        case 76:
          $("#songBox").focus();
          var boxWidth = ($(document).width() / 2) - 20 - 2;
          var boxHeight = $(document).height() - 22;
          $("#songBox").width(boxWidth);
          $("#songBox").height(boxHeight);
          $("#playlistBox").width(boxWidth);
          $("#playlistBox").height(boxHeight);
          $("#searchView").height($(document).height());
          $("#searchView").animate({
            left:"0"
          });
          $("#playerView").animate({
            left:$(document).width()
          });
          $("#playerControlView").animate({
            left:$(document).width()
          });
          viewState = 'search';
          break;
        case 80:
          previous();
          setNowPlaying();
          notScrobbled = true;
          break;
        case 78:
          next();
          setNowPlaying();
          notScrobbled = true;
          break;
        case 32:
          var audio = document.getElementById('player');
          if (audio.paused) {
            audio.play();
          } else {
            audio.pause();
          }
          break;
      }
    } else if ('search' === viewState) {
      switch (event.which) {
        case 27:
          $("#searchView").animate({
            left:-1 * $(document).width()
          });
          $("#playerView").animate({
            left:"0"
          });
          $("#playerControlView").animate({
            left:"0"
          });
          var audio = document.getElementById('player');
          if (audio.paused) {
            next();
            setNowPlaying();
            notScrobbled = true;
          }
          viewState = 'player';
          $("#coverArtBox").css("padding-top", ($(document).height() - $("#coverArtBox").height()) / 2);
          $("#descriptionBox").css("padding-top", ($(document).height() - $("#descriptionBox").height()) / 2);
          break;
        default:
          var songList = JSON.parse(localStorage["songs.list"]);
          // open a input field (like in gtk list views)
          // fillSongBox(songList, String.fromCharCode(event.which));
          break;
      }
    } else {
      console.log("Unknown view state '" + viewState + "'.");
    }
  });

  $("#player").on("ended", function (event) {
    next();
    setNowPlaying();
    notScrobbled = true;
  });

  $("#player").on("error", function (event) {
    var audio = document.getElementById('player');
    var errorMsg = "The file '" + audio.src + "' cannot be played. The possible reasons is: ";
    switch (event.currentTarget.error.code) {
      case 4:
        errorMsg += "The current media type '" + audio.type + "' isn't supported.";
        break;
      case 1:
        errorMsg += "The user agent stopped fetching the media data.";
        break;
      case 2:
        errorMsg += "A network error stopped the user agent fetching the media data.";
        break;
      case 3:
        errorMsg += "Error on decoding the media data.";
        break;
      default:
        errorMsg += "Unknown error with code '" + event.currentTarget.error.code + "' happened."
    }
    alert(errorMsg);
  });
  setInterval("backgroundTasks()", 1000);


  $('#searchView, #playerView, #fileView').width($(window).width());
  $('#searchView, #playerView, #fileView').height($(window).height());
  $('#playerControlView').css('left', $(window).width());
});

function test(){
  var song = Controller.getFirstPlaylistElement();
  var src = "https://streaming.one.ubuntu.com/rest/stream.view?u=" +JSON.parse(localStorage["authentication.login"])+ "&p=" +JSON.parse(localStorage["authentication.password"])+ "&v=1.2.0&c=chrome&id=" + song.id;
  function handler() {
    if(this.readyState == this.DONE) {
      FileApi.createFolder(song.artist+'/'+song.album);
      FileApi.writeFile(this.response, null, song);
    }
  }

  var client = new XMLHttpRequest();
  client.onreadystatechange = handler;
  client.responseType = 'blob';
  client.open("GET", src);
  client.send(null);
}

function testGoogle(){
  googleAuth.authorize(function() {
    // Ready for action
    var handler = function(){
      if(this.readyState == this.DONE) {
        var fileList = JSON.parse(this.response);
        console.log(fileList);
        var items = fileList.items;
        var folder = {};
        var files = {};
        console.log(items[0]);
        console.log(items[1]);
        for (var idx = 0, item; item =  items[idx]; idx++) {
          if(item.mimeType === 'application/vnd.google-apps.folder'){
            if(typeof folder[item.id] == 'undefined'){
              folder[item.id] = {};
            }
              folder[item.id].title = item.title;
              folder[item.id].parentID = item.parents[0].id;
          }else{
            var file = {
              id: item.id,
              title: item.title,
              parentID: item.parents[0].id,
              url: item.downloadUrl
            };
            if(typeof folder[item.parents[0].id] == 'undefined'){
              folder[item.parents[0].id] = {files: []};
            }else if(typeof folder[item.parents[0].id].files == 'undefined'){
              folder[item.parents[0].id].files = [];
            }
            folder[item.parents[0].id].files.push(file);
            }
          }
        console.log(folder);

//        var testUrl= item.downloadUrl;
//        var song = {
//          title: item.title,
//          album: 'Test',
//          artist: 'AAAAAAAAAAA'
//        };
//        var audio = audio = document.getElementById('player');
//        console.log(audio);
//        audio.type = 'audio/mpeg';
//        audio.src = testUrl+'?access_token='+ googleAuth.getAccessToken();
//        var audioHandler = function(){
//          if(this.readyState == this.DONE) {
//            console.log(typeof  this.response);
//            console.log(this.response);
//            FileApi.createFolder(song.artist+'/'+song.album);
//            FileApi.writeFile(this.response, null, song);
//          }
//        };
//
//        var client = new XMLHttpRequest();
//        client.onreadystatechange = audioHandler;
//        client.open("GET", testUrl);
//        client.setRequestHeader('Authorization', 'OAuth ' + googleAuth.getAccessToken());
//        client.send(null);
      }
    };
    var client = new XMLHttpRequest();
    client.onreadystatechange = handler;
    client.open("GET", 'https://www.googleapis.com/drive/v2/files');
    client.setRequestHeader('Authorization', 'OAuth ' + googleAuth.getAccessToken());
    client.send(null);
  });
}