var songHistory = new Array();
var viewState = 'player';
var notScrobbled = true;
var songDb = new Db();
function EventData() {
  var isPropagationStopped = false;
  var isImmediatePropagationStopped = false;
  this.stopPropagation = function () {isPropagationStopped = true;};
  this.isPropagationStopped = function () {return isPropagationStopped;};
  this.stopImmediatePropagation = function () {isImmediatePropagationStopped = true;};
  this.isImmediatePropagationStopped = function () {return isImmediatePropagationStopped;}
}

function Event() {
  var handlers = [];
  this.subscribe = function (fn) {handlers.push(fn);};
  this.unsubscribe = function (fn) {
    for (var i = handlers.length - 1; i >= 0; i--) {
      if (handlers[i] === fn) {
        handlers.splice(i, 1);
      }
    }
  };
  this.notify = function (args, e, scope) {
    e = e || new EventData();
    scope = scope || this;

    var returnValue;
    for (var i = 0; i < handlers.length && !(e.isPropagationStopped() || e.isImmediatePropagationStopped()); i++) {
      returnValue = handlers[i].call(scope, e, args);
    }

    return returnValue;
  };
}
var updateSongListEvent = new Event();
function addToHistory(song) {
  songHistory.push(song);
  if (songHistory.length > 1000) {
    songHistory.shift();
  }
}

function applyCoverArtStyle() {
  document.getElementById("coverArt").height = $(document).height() * 0.6;
  $("#coverArt").reflect({
    height : 0.165,
    opacity : 0.25
  });
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
    (new Scrobbler(localStorage["audica.lastfm.sessionKey"], localStorage["audica.lastfm.login"])).setNowPlaying(song.artist, song.title, song.album, song.duration, function(data) {
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
        (new Scrobbler(localStorage["audica.lastfm.sessionKey"], localStorage["audica.lastfm.login"])).scrobble(song.artist, song.title, song.album, song.duration, timestamp, function(data) {
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

var closePlayerControlViewTimerId = null;

function closePlayerControlView() {
  $("#playerControlView").data("open", false);
  closePlayerControlViewTimerId = null;
  $("#playerControlView").animate({
    height : "4px"
  });
}

function updateSongList() {
  var currentSongList = songDb.query().order('artist asec, album asec, year asec, track asec, title asec').get();
  fillSongBox(currentSongList);
  updateSongListEvent.notify({timestamp:$.now()});
}

$(function() {
  songDb.init('songs');
  if (null === localStorage["serverUrl"] || undefined === localStorage["serverUrl"]) {
    //noinspection JSUnresolvedVariable,JSUnresolvedFunction
    document.location = chrome.extension.getURL("options/index.html");
  }
  updateSongList();
  $("#searchView").css("left", -1 * $(document).width());
  $("#coverArtBox").css("padding-top", ($(document).height() - $("#coverArtBox").height()) / 2);
  $("#descriptionBox").css("padding-top", ($(document).height() - $("#descriptionBox").height()) / 2);

  $("#songBox").on("keyup", function(event) {
    if (39 === event.which) {
      $("#songBox :selected").clone().appendTo("#playlistBox");
    }
  });
  $("#playlistBox").on("keyup", function(event) {
    if (37 === event.which) {
      $("#playlistBox :selected").detach();
    }
  });

  function handleRightZone(event) {
    if ('search' === viewState) {
      if ("mouseenter" === event.type) {
        $("#searchView").height($(document).height());
        $("#searchView").animate({
          left : -1 * $(document).width() * 0.05
        });
        $("#playerView").animate({
          left : $(document).width() * 0.95
        });
        $("#playerControlView").animate({
          left : $(document).width() * 0.95
        });
      } else if ("mouseleave" === event.type) {
        $("#searchView").height($(document).height());
        $("#searchView").animate({
          left : "0"
        });
        $("#playerView").animate({
          left : $(document).width()
        });
        $("#playerControlView").animate({
          left : $(document).width()
        });
      } else if ("click" === event.type) {
        $("#searchView").animate({
          width : -1 * $(document).width()
        });
        $("#playerView").animate({
          left : "0"
        });
        $("#playerControlView").animate({
          left : "0"
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
      }
    }
  }


  $("#playerViewPreview").on({
    hover : handleRightZone,
    click : handleRightZone
  });

  function handleLeftZone(event) {
    if ('player' === viewState) {
      if ("mouseenter" === event.type) {
        $("#searchView").height($(document).height());
        $("#searchView").animate({
          left : -1 * $(document).width() * 0.95
        });
        $("#playerView").animate({
          left : $(document).width() * 0.05
        });
        $("#playerControlView").animate({
          left : $(document).width() * 0.05
        });
      } else if ("mouseleave" === event.type) {
        $("#searchView").height($(document).height());
        $("#searchView").animate({
          left : -1 * $(document).width()
        });
        $("#playerView").animate({
          left : "0"
        });
        $("#playerControlView").animate({
          left : "0"
        });
      } else if ("click" === event.type) {
        $("#songBox").focus();
        var boxWidth = ($(document).width() / 2) - 22 - 2;
        var boxHeight = $(document).height() - 22;
        $("#songBox").width(boxWidth);
        $("#songBox").height(boxHeight);
        $("#playlistBox").width(boxWidth);
        $("#playlistBox").height(boxHeight);
        $("#searchView").height($(document).height());
        $("#searchView").animate({
          left : "0"
        });
        $("#playerView").animate({
          left : $(document).width()
        });
        $("#playerControlView").animate({
          left : $(document).width()
        });
        viewState = 'search';
      }
    }
  }


  $("#searchViewPreview").on({
    hover : handleLeftZone,
    click : handleLeftZone
  });

  $(document).mousemove(function() {
    if ('player' === viewState) {
      if (null !== closePlayerControlViewTimerId) {
        clearTimeout(closePlayerControlViewTimerId);
      }
      if (!$("#playerControlView").data("open")) {
        $("#playerControlView").data("open", true);
        $("#playerControlView").animate({
          height : "50px"
        });
      }
      closePlayerControlViewTimerId = setTimeout(closePlayerControlView, 3000);
    }
  });

  var filterBoxTimeout = null;
  $(document).on("keyup", function(event) {
    var audio =null;
    if ('player' === viewState) {
      switch (event.which) {
        case 39:
          audio = document.getElementById('player');
          audio.currentTime = audio.currentTime + 10;
          break;
        case 37:
          audio = document.getElementById('player');
          audio.currentTime = audio.currentTime - 10;
          break;
        case 187:
          audio = document.getElementById('player');
          audio.playbackRate = audio.playbackRate + 0.05;
          break;
        case 189:
          audio = document.getElementById('player');
          audio.playbackRate = audio.playbackRate - 0.05;
          break;
        case 76:
          $("#songBox").focus();
          var boxWidth = ($(document).width() / 2) - 22 - 2;
          var boxHeight = $(document).height() - 22;
          $("#songBox").width(boxWidth);
          $("#songBox").height(boxHeight);
          $("#playlistBox").width(boxWidth);
          $("#playlistBox").height(boxHeight);
          $("#searchView").height($(document).height());
          $("#searchView").animate({
            left : "0"
          });
          $("#playerView").animate({
            left : $(document).width()
          });
          $("#playerControlView").animate({
            left : $(document).width()
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
    } else if ('search' === viewState) {
      switch (event.which) {
        case 27:
          if ($("#filterBox").data("open")) {
            $("#filterBox").data("open", false);
            $("#songBox").focus();
            $("#filterBox").hide();
            $('#filterBox').val("");
          } else {
            $("#searchView").animate({
              left : -1 * $(document).width()
            });
            $("#playerView").animate({
              left : "0"
            });
            $("#playerControlView").animate({
              left : "0"
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
        case 37:
        case 38:
        case 39:
        case 40:
        case 9:
        case 16:
        case 18:
        case 17:
          break;
        default:
          if (!$("#filterBox").data("open")) {
            $("#filterBox").data("open", true);
            // todo the first key should be filled in the filterBox
            // but with keyup we only get a normal key and not chars that are created with two keys like !
            // this works only with keypress
            // $('#filterBox').val(String.fromCharCode(event.which));
            $("#filterBox").show();
          }
          $('#filterBox').focus();
          if (null !== filterBoxTimeout) {
            clearTimeout(filterBoxTimeout);
          }
          filterBoxTimeout = setTimeout(function() {
            var currentSongList = [];
            var filterQuery = $('#filterBox').val();
            if (null !== filterQuery && undefined !== filterQuery) {
              // TODO If album medium number is available sort by it first
              var dbQuery = [{artist:{likenocase:filterQuery}}, {album:{likenocase:filterQuery}}, {genre:{likenocase:filterQuery}}, {title:{likenocase:filterQuery}}];
              currentSongList = songDb.query(dbQuery).order('artist asec, album asec, year asec, track asec, title asec').get();
            } else {
              currentSongList = songDb.query().order('artist asec, album asec, year asec, track asec, title asec').get();
            }
            fillSongBox(currentSongList);
          }, 500);
          break;
      }
    } else {
      console.log("Unknown view state '" + viewState + "'.");
    }
  });

  $("#player").on("ended", function() {
    next();
    setNowPlaying();
    notScrobbled = true;
  });

  $("#player").on("error", function(event) {
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
  setInterval(backgroundTasks, 1000);
});
