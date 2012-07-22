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
  var song = window.Controller.getFirstPlaylistElement();
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
      window.Controller.startPlay(song);
      window.Controller.setFirstPlaylistElement(song);
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
    window.Controller.fillSongBox(JSON.parse(currentSongList), null);
  }
  searchForSongs("", window.Controller.collectSongs, null, null);
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

  var filterBoxTimeout = null;
  $(document).on("keyup", function(event) {
    var audio;
    if ('player' === window.viewState) {
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
            left: "0"
          });
          $("#playerView").animate({
            left: $(document).width()
          });
          $("#playerControlView").animate({
            left: $(document).width()
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
          audio = document.getElementById('player');
          if (audio.paused) {
            audio.play();
          } else {
            audio.pause();
          }
          break;
      }
    } else if ('search' === window.viewState) {
      switch (event.which) {
        case 27:
          if ($("#filterBox").data("open")) {
            $("#filterBox").data("open", false);
            $("#filterBox").hide();
            $('#filterBox').val("");
          } else {
            $("#searchView").animate({
              left: -1 * $(document).width()
            });
            $("#playerView").animate({
              left: "0"
            });
            $("#playerControlView").animate({
              left: "0"
            });
            audio = document.getElementById('player');
            if (audio.paused) {
              next();
              setNowPlaying();
              notScrobbled = true;
            }
            viewState = 'player';
            $("#coverArtBox").css("padding-top", ($(document).height() - $("#coverArtBox").height()) / 2);
            $("#descriptionBox").css("padding-top", ($(document).height() - $("#descriptionBox").height()) / 2);
          }
          break;
        default:
          if (!$("#filterBox").data("open")) {
            $("#filterBox").data("open", true);
            // todo the first key should be fille in the filterBox
            // but with keyup we only get one normal keys and not chars that are created with two keys like !
            // this works only with keypress
            // $('#filterBox').val(String.fromCharCode(event.which));
            $("#filterBox").show();
          }
          $('#filterBox').focus();
          if (null !== filterBoxTimeout) {
            clearTimeout(filterBoxTimeout);
          }
          filterBoxTimeout = setTimeout(function() {
            var songList = JSON.parse(localStorage["songs.list"]);
            window.Controller.fillSongBox(songList, $('#filterBox').val());
          }, 500);
          break;
      }
    } else {
      console.log("Unknown view state '" + viewState + "'.");
    }
  });

  $("#player").on("ended", function () {
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
  var song = window.Controller.getFirstPlaylistElement();
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