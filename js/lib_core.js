/**
 * @namespace
 * @class
 */
function AUDICA() {
  /**
   * @description The current song object
   * @type {Object|Null}
   * @private
   */
  var _song = null;
  /**
   * @description Options object
   * @type {Object}
   * @private
   */
  var _options = {};
  /**
   * @description Current view state possible states are: player, search
   * @type {String|Null}
   * @private
   */
  var _viewState = 'player';
  /**
   * @description Flag if a song is scrobbled
   * @type {Boolean}
   * @private
   */
  var _notScrobbled = true;
  /**
   * description
   * @type {Number|Null}
   * @private
   */
  var _closePlayerControlViewTimerId = null;

  var resizeEventTimeoutId = null;

  /**
   * @description Local song history for prev song handling
   * TODO find a better solution by using the {@link this.historyDb}
   * @type {Array}
   * @private
   */
  var _songHistory = [];
  /**
   * @description New instance of {@link _Db}
   * @type {Function}
   */
  this.songDb = new _Db();
  /**
   * @type {Function}
   */
  this.historyDb = new _Db();
  /**
   * @namespace
   * @type {Object}
   */
  this.Dom = {
    searchView:null,
    searchViewPreview:null,
    playerView:null,
    playerViewPreview:null,
    playerControlView:null,
    coverArtBox:null,
    coverArt:null,
    descriptionBox:null,
    songBox:null,
    playListBox:null,
    filterBox:null,
    player:null,
    title:null,
    album:null,
    artist:null,
    progress:null,
    timeField:null,
    documentHeight:null,
    documentWidth:null,
    /**
     * @return {Array}
     */
    firstPlayListElement:function () {
      return this.playListBox.find("option :first");
    },
    /**
     * set all dom elements once
     */
    initDom:function () {
      this.player = document.getElementById('player');
      this.playListBox = $("#playlistBox");
      this.songBox = $("#songBox");
      this.descriptionBox = $("#descriptionBox");
      this.coverArtBox = $("#coverArtBox");
      this.coverArt = $('#coverArt');
      this.filterBox = $("#filterBox");
      this.searchView = $("#searchView");
      this.searchViewPreview = $("#searchViewPreview");
      this.playerView = $("#playerView");
      this.playerViewPreview = $("#playerViewPreview");
      this.playerControlView = $("#playerControlView");
      this.title = $('#title');
      this.album = $('#album');
      this.artist = $('#artist');
      this.progress = $('#progressBar');
      this.timeField = $('#timeField');
      this.updateDocumentDimensions();
      Audica.trigger('domElementsSet');
    },
    /**
     *
     */
    updateDocumentDimensions:function () {
      this.documentHeight = $(document).height();
      this.documentWidth = $(document).width();
      Audica.trigger('documentDimensionsUpdated');
    },
    /**
     * @description Sets the first play list element
     * @param song
     */
    setFirstPlaylistElement:function (song) {
      var option = $('<option value="' + escape(JSON.stringify(song)) + '">' + song.artist + ' / ' + song.album + ' / ' + song.track + '. ' + song.title + '</option>');
      var firstPlayListElement = Audica.Dom.firstPlayListElement();
      if (firstPlayListElement.length > 0) {
        option.insertBefore(firstPlayListElement);
      } else {
        option.appendTo(Audica.Dom.playListBox);
      }
    }
  };
  /**
   * @description Holds all player methods
   * @namespace
   * @type {Object}
   */
  this.PlayerControl = {
    /**
     * @param {Object} song
     */
    play:function (song) {
      _song = song;
      Audica.trigger('onStartPlayingSong', {song:song});
      Audica.Dom.player.type = song.contentType;
      Audica.Dom.player.src = song.src;
      Audica.View.updateMain(song.artist, song.album, song.title);
      Audica.Dom.coverArt.attr("src", song.coverArt);
      Audica.trigger('playSong');
    },
    /**
     * @description Plays next song
     */
    next:function () {
      var song = Audica.Playlist.getFirstElement();
      if (null !== song) {
        this.play(song);
        Audica.Playlist.removeFirstElement();
        Audica.History.add(song);
      } else {
        Audica.trigger('ERROR', {message:'No song found. Possible reason: Empty Playlist'});
      }
      Audica.trigger('nextSong');
    },
    /**
     * @description Plays previous song
     */
    previous:function () {
      if (_songHistory.length > 0) {
        var history = _songHistory.pop();
        var song = Audica.songDb.query({id:history.songId, backendId:history.backendId}).get()[0];
        if (null !== song) {
          this.play(song);
          Audica.Dom.setFirstPlaylistElement(song);
        } else {
          Audica.trigger('ERROR', {message:'No song found. Possible reason: Empty Playlist'});
        }
      }
      Audica.trigger('previousSong');
    }
  };
  /**
   * @description Holds all playlist methods
   * @namespace
   * @type {Object}
   */
  this.Playlist = {
    /**
     * @return {String|Null}
     */
    getFirstElement:function () {
      var elements = Audica.Dom.firstPlayListElement();
      if (elements.length > 0) {
        return JSON.parse(unescape(elements.val()));
      } else {
        return null;
      }
    },
    /**
     * @return {Object|Null}
     */
    getLastSong:function () {
      return _songHistory[_songHistory.length - 1] || null;
    },
    /**
     *
     */
    removeFirstElement:function () {
      Audica.Dom.firstPlayListElement().detach();
      Audica.trigger('firstPlayListElementRemoved');
    }
  };
  /**
   * @namespace
   * @type {Object}
   */
  this.View = {
    /**
     * @param {String} artist
     * @param {String} album
     * @param {String} title
     */
    updateMain:function (artist, album, title) {
      Audica.Dom.title.text(title);
      Audica.Dom.album.text(album);
      Audica.Dom.artist.text(artist);
      Audica.trigger('updateMainView');
    },
    /**
     * @param {Array}songs
     */
    fillSongBox:function (songs) {
      var options = "";
      for (var i = 0, song; song = songs[i]; i++) {
        var option = "<option ";
        option = option + "value='" + escape(JSON.stringify(song)) + "'>";
        option = option + song.artist + " / " + song.album + " / " + song.track + ". " + song.title;
        option = option + "</option>";
        options = options + option;
      }
      Audica.Dom.songBox.html(options);
    },
    closePlayerControlView:function () {
      Audica.Dom.playerControlView.data("open", false);
      _closePlayerControlViewTimerId = null;
      Audica.Dom.playerControlView.animate({height:"4px"});
    },
    applyCoverArtStyle:function () {
      // Use original window elem to set height because reflect is need this
      Audica.Dom.coverArt[0].height = Audica.Dom.documentHeight * 0.6;
      Audica.Dom.coverArt[0].width = Audica.Dom.coverArt[0].height;
      Audica.Dom.coverArt.reflect({height:0.165, opacity:0.25});
      Audica.Dom.coverArtBox.css("padding-top", (Audica.Dom.documentHeight - Audica.Dom.coverArtBox.height()) / 2);
      Audica.Dom.descriptionBox.css("padding-top", (Audica.Dom.documentHeight - Audica.Dom.descriptionBox.height()) / 2);
    },
    updateProgress:function () {
      if (!Audica.Dom.player.paused) {
        Audica.Dom.progress.val(Math.round((Audica.Dom.player.currentTime * 100) / Audica.Dom.player.duration));
      }
    },
    updateTimings:function () {
      if (Audica.Dom.playerControlView.data("open")) {
        if (!Audica.Dom.player.paused) {
          Audica.Dom.timeField.text(Math.round(Audica.Dom.player.currentTime) + " / " + Math.round(Audica.Dom.player.duration));
        }
      }
    }
  };
  /**
   *
   * @param songList
   * @param backendId
   * @param timestamp
   */
  this.collectSongs = function (songList, backendId, timestamp) {
    for (var i = 0, song; song = songList[i]; i++) {
      Audica.songDb.query.insert(song);
    }
    Audica.songDb.query({backendId:{is:backendId}, addedOn:{'!is':timestamp}}).remove();
    Audica.trigger('fillSongBox');
    Audica.trigger('collectSongs');
  };
  /**
   *
   */
  this.updateSongList = function () {
    Audica.trigger('fillSongBox');
    Audica.trigger('updateSongList', {timestamp:$.now()});
  };
  /**
   *
   */
  this.backgroundTasks = function () {
    Audica.View.updateProgress();
    Audica.View.updateTimings();
    Audica.Scrobbling.scrobble();
  };
  /**
   * @namespace
   * @type {Object}
   */
  this.Scrobbling = {
    setNowPlaying:function () {
      if (Audica.Scrobbler === null) {
        return false;
      }
      var history = Audica.Playlist.getLastSong();
      if (null !== song) {
        var song = Audica.songDb.query({id:history.songId, backendId:history.backendId}).get()[0];
        if (null !== song) {
          Audica.Scrobbler.setNowPlaying(song.artist, song.title, song.album, song.duration, function (data) {
            if (undefined !== data.error) {
              switch (data.error) {
                case 6:
                case 13:
                  console.warn("Cannot set now playing there is a parameter missing/wrong!", data.message);
                  break;
                default:
                  console.error("Cannot set last.fm now playing track. " + data.error + " - " + data.message);
              }
            }
          }, null);
        }
      }
    },
    scrobble:function () {
      var audio = Audica.Dom.player;
      if (!audio.paused) {
        if (Math.round((audio.currentTime * 100) / audio.duration) > 50 && _notScrobbled) {
          var history = Audica.Playlist.getLastSong();
          if (null !== history) {
            var song = Audica.songDb.query({id:history.songId, backendId:history.backendId}).get()[0];
            if (null !== song) {
              var timestamp = parseInt((new Date()).getTime() / 1000.0);
              Audica.Scrobbler.scrobble(song.artist, song.title, song.album, song.duration, timestamp, function (data) {
                if (undefined !== data.error) {
                  switch (data.error) {
                    case 6:
                    case 13:
                      console.warn("Cannot scrobble the song there is a parameter missing/wrong!", data.message);
                      _notScrobbled = true;
                      break;
                   default:
                      alert("Cannot scrobble track to last.fm. " + data.error + " - " + data.message);
                  }
                } else {
                _notScrobbled = false;
                }
              }, null);
            }
          }
        }
      }
    }
  };
  /**
   * @namespace
   * @type {Object}
   */
  this.History = {
    /**
     * @function
     */
    add:function () {
      var historyElem = {
        timestamp: $.now(),
        backendId: _song.backendId,
        songId: _song.id
      };
      _songHistory.push(historyElem);
      Audica.historyDb.query.insert(historyElem);
    },
    showByTime:function(dir){
      return Audica.historyDb.query().order('timestamp '+dir).get();
    }
  };
  /**
   * @namespace
   * @type {*}
   */
  this.Scrobbler = null;
  //Private
  /**
   * @name _Db
   * @private
   * @class
   */
  function _Db() {
    /**
     * @type {String|Null}
     * @private
     */
    var _dbName = null;

    /**
     * @type {Function|Null}
     */
    this.query = null;

    /**
     * @param {String} dbName
     */
    this.init = function (dbName) {
      _dbName = "db." + dbName;
      var dbContent = localStorage[_dbName];
      if (null !== dbContent && undefined !== dbContent) {
        this.query = TAFFY(JSON.parse(dbContent));
      } else {
        this.query = TAFFY();
      }
    };
    this.save = function () {
      localStorage[_dbName] = JSON.stringify(this.query().get());
    }
  }

  /**
   * @param {String} sessionKey
   * @param {String} login
   * @class
   * @private
   */
  var _SCROBBLER = function(sessionKey, login) {
    /**
     * @type {String}
     * @private
     */
    var _serviceUrl = "http://ws.audioscrobbler.com/2.0/";
    /**
     * @type {String}
     * @private
     */
    var _apiKey = "ac2f676e5b95231ac4706b3dcb5d379d";
    /**
     * @type {String}
     * @private
     */
    var _secret = "29d73236629ddab3d9688d5378756134";
    /**
     * @private
     */
    var _successCB = function (data, textStatus, jqXHR) {
      console.log(data, textStatus, jqXHR);
    };
    /**
     * @private
     */
    var _errorCB = function (data, textStatus, jqXHR) {
      console.error(data, textStatus, jqXHR);
    };
    /**
     * @type {String}
     */
    this.sessionKey = sessionKey;
    /**
     * @type {String}
     */
    this.login = login;
    /**
     * @return {String}
     */
    this.getTokenUrl = function () {
      //noinspection JSUnresolvedVariable,JSUnresolvedFunction
      return "http://www.last.fm/api/auth/?api_key=" + _apiKey + "&cb=" + chrome.extension.getURL("options/authenticate_lastfm.html");
    };
    /**
     * @param {String} token
     * @param successCB
     * @param errorCB
     */
    this.getSession = function (token, successCB, errorCB) {
      successCB = successCB || _successCB;
      errorCB = errorCB || _errorCB;
      var signature = hex_md5("api_key" + _apiKey + "methodauth.getSessiontoken" + token + _secret);
      $.ajax(_serviceUrl + "?format=json&method=auth.getSession&api_key=" + _apiKey + "&api_sig=" + signature + "&token=" + token, {type:"GET", success:successCB, error:errorCB});
    };
    /**
     * @param {String} artist
     * @param {String} track
     * @param {String} album
     * @param {String} duration
     * @param successCB
     * @param errorCB
     */
    this.setNowPlaying = function (artist, track, album, duration, successCB, errorCB) {
      if (this.isAuthenticated()) {
        var signature = hex_md5("album" + album + "api_key" + _apiKey + "artist" + artist + "duration" + duration + "methodtrack.updateNowPlayingsk" + this.sessionKey + "track" + track + _secret);
        $.ajax(_serviceUrl + "?format=json&method=track.updateNowPlaying&api_key=" + _apiKey + "&api_sig=" + signature + "&sk=" + this.sessionKey + "&artist=" + encodeURIComponent(artist) + "&track=" + encodeURIComponent(track) + "&album=" + encodeURIComponent(album) + "&duration=" + duration, {type:"POST", success:successCB, error:errorCB});
      }
    };
    /**
     * @param {String} artist
     * @param {String} track
     * @param {String} album
     * @param {String} duration
     * @param {String} playStartTime
     * @param successCB
     * @param errorCB
     */
    this.scrobble = function (artist, track, album, duration, playStartTime, successCB, errorCB) {
      if (this.isAuthenticated()) {
        var signature = hex_md5("album" + album + "api_key" + _apiKey + "artist" + artist + "duration" + duration + "methodtrack.scrobblesk" + this.sessionKey + "timestamp" + playStartTime + "track" + track + _secret);
        $.ajax(_serviceUrl + "?format=json&method=track.scrobble&api_key=" + _apiKey + "&api_sig=" + signature + "&sk=" + this.sessionKey + "&artist=" + encodeURIComponent(artist) + "&track=" + encodeURIComponent(track) + "&album=" + encodeURIComponent(album) + "&duration=" + duration + "&timestamp=" + playStartTime, {type:"POST", success:successCB, error:errorCB});
      }
    };
    /**
     * @return {Boolean}
     */
    this.isAuthenticated = function () {
      return null !== this.sessionKey && null !== this.login && undefined !== this.sessionKey && undefined !== this.login;
    };
  };

  /**
   * @function
   * @private
   */
  var _registerEvents = function() {
    var filterBoxTimeout = null;
    $(document).on("keyup", function (event) {
      var audio = Audica.Dom.player;
      var songBox = Audica.Dom.songBox;
      var playListBox = Audica.Dom.playListBox;
      var searchView = Audica.Dom.searchView;
      var boxWidth = (Audica.Dom.documentWidth / 2) - 22 - 2;
      var boxHeight = Audica.Dom.documentHeight - 22;
      var playerView = Audica.Dom.playerView;
      var playerControlView = Audica.Dom.playerControlView;
      var coverArtBox = Audica.Dom.coverArtBox;
      var filterBox = Audica.Dom.filterBox;
      var descriptionBox = Audica.Dom.descriptionBox;
      if ('player' === _viewState) {
        switch (event.which) {
          case 39:
            audio.currentTime = audio.currentTime + 10;
            break;
          case 37:
            audio.currentTime = audio.currentTime - 10;
            break;
          case 187:
            audio.playbackRate = audio.playbackRate + 0.05;
            break;
          case 189:
            audio.playbackRate = audio.playbackRate - 0.05;
            break;
          case 76:
            songBox.focus();
            songBox.width(boxWidth);
            songBox.height(boxHeight);
            playListBox.width(boxWidth);
            playListBox.height(boxHeight);
            searchView.height($(document).height());
            searchView.animate({left:0});
            playerView.animate({left:Audica.Dom.documentWidth});
            playerControlView.animate({left:Audica.Dom.documentWidth});
            _viewState = 'search';
            break;
          case 80:
            Audica.PlayerControl.previous();
            Audica.Scrobbling.setNowPlaying();
            _notScrobbled = true;
            break;
          case 78:
            Audica.PlayerControl.next();
            Audica.Scrobbling.setNowPlaying();
            _notScrobbled = true;
            break;
          case 32:
            audio.paused ? audio.play() : audio.pause();
            break;
        }
      } else if ('search' === _viewState) {
        switch (event.which) {
          case 27:
            if (filterBox.data("open")) {
              filterBox.data("open", false);
              songBox.focus();
              filterBox.hide();
              filterBox.val("");
            } else {
              searchView.animate({left:-1 * Audica.Dom.documentWidth});
              playerView.animate({
                left:"0"
              });
              playerControlView.animate({
                left:"0"
              });
              if (audio.paused) {
                Audica.PlayerControl.next();
                Audica.Scrobbling.setNowPlaying();
                _notScrobbled = true;
              }
              _viewState = 'player';
              coverArtBox.css("padding-top", (Audica.Dom.documentHeight - coverArtBox.height()) / 2);
              descriptionBox.css("padding-top", (Audica.Dom.documentHeight - descriptionBox.height()) / 2);
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
            if (!filterBox.data("open")) {
              filterBox.data("open", true);
              // todo the first key should be filled in the filterBox
              // but with keyup we only get a normal key and not chars that are created with two keys like !
              // this works only with keypress
              // $('#filterBox').val(String.fromCharCode(event.which));
              filterBox.show();
            }
            filterBox.focus();
            if (null !== filterBoxTimeout) {
              clearTimeout(filterBoxTimeout);
            }
            filterBoxTimeout = setTimeout(function () {
              var currentSongList = [];
              var filterQuery = filterBox.val();
              if (null !== filterQuery && undefined !== filterQuery) {
                // TODO If album medium number is available sort by it first
                var dbQuery = [
                  {artist:{likenocase:filterQuery}},
                  {album:{likenocase:filterQuery}},
                  {genre:{likenocase:filterQuery}},
                  {title:{likenocase:filterQuery}}
                ];
                currentSongList = Audica.songDb.query(dbQuery).order('artist asec, album asec, year asec, track asec, title asec').get();
              } else {
                currentSongList = Audica.songDb.query().order('artist asec, album asec, year asec, track asec, title asec').get();
              }
              Audica.View.fillSongBox(currentSongList);
            }, 500);
            break;
        }
      } else {
        console.log("Unknown view state '" + _viewState + "'.");
      }
    });

    $(document).mousemove(function () {
      var playerControlView = Audica.Dom.playerControlView;
      if ('player' === _viewState) {
        if (null !== _closePlayerControlViewTimerId) {
          clearTimeout(_closePlayerControlViewTimerId);
        }
        if (!playerControlView.data("open")) {
          playerControlView.data("open", true);
          playerControlView.animate({height:"50px"});
        }
        _closePlayerControlViewTimerId = setTimeout(function () {
          Audica.View.closePlayerControlView();
        }, 3000);

      }
    });

    function handleRightZone(event) {
      if ('search' === _viewState) {
        var searchView = Audica.Dom.searchView;
        var playerView = Audica.Dom.playerView;
        var playerControlView = Audica.Dom.playerControlView;
        var coverArtBox = Audica.Dom.coverArtBox;
        var descriptionBox = Audica.Dom.descriptionBox;
        var audio = Audica.Dom.player;
        if ("mouseenter" === event.type) {
          searchView.height(Audica.Dom.documentHeight);
          searchView.animate({left:-1 * Math.round(Audica.Dom.documentWidth * 0.05)});
          playerView.animate({left:Math.round(Audica.Dom.documentWidth * 0.95)});
          playerControlView.animate({left:Math.round(Audica.Dom.documentWidth * 0.95)});
        } else if ("mouseleave" === event.type) {
          searchView.height(Audica.Dom.documentHeight);
          searchView.animate({left:"0"});
          playerView.animate({left:Audica.Dom.documentWidth});
          playerControlView.animate({left:Audica.Dom.documentWidth});
        } else if ("click" === event.type) {
          searchView.animate({left:-1 * Audica.Dom.documentWidth});
          playerView.animate({left:0});
          playerControlView.animate({left:0});
          if (audio.paused) {
            Audica.PlayerControll.next();
            Audica.Scrobbling.setNowPlaying();
            _notScrobbled = true;
          }
          _viewState = 'player';
          coverArtBox.css("padding-top", (Audica.Dom.documentHeight - coverArtBox.height()) / 2);
          descriptionBox.css("padding-top", (Audica.Dom.documentHeight - descriptionBox.height()) / 2);
        }
      }
    }


    Audica.Dom.playerViewPreview.on({
      hover:handleRightZone,
      click:handleRightZone
    });

    function handleLeftZone(event) {
      var searchView = Audica.Dom.searchView;
      var playerView = Audica.Dom.playerView;
      var playerControlView = Audica.Dom.playerControlView;
      var songBox = Audica.Dom.songBox;
      var playlistBox = Audica.Dom.playListBox;
      var boxWidth = (Audica.Dom.documentWidth / 2) - 22 - 2;
      var boxHeight = Audica.Dom.documentHeight - 22;
      if ('player' === _viewState) {
        if ("mouseenter" === event.type) {
          searchView.height(Audica.Dom.documentHeight);
          searchView.animate({left:-1 * Math.round(Audica.Dom.documentWidth * 0.95)});
          playerView.animate({left:Math.round(Audica.Dom.documentWidth * 0.05)});
          playerControlView.animate({left:Math.round(Audica.Dom.documentWidth * 0.05)});
        } else if ("mouseleave" === event.type) {
          searchView.height(Audica.Dom.documentHeight);
          searchView.animate({left:-1 * Audica.Dom.documentWidth});
          playerView.animate({left:0});
          playerControlView.animate({left:0});
        } else if ("click" === event.type) {
          songBox.focus();
          songBox.width(boxWidth);
          songBox.height(boxHeight);
          playlistBox.width(boxWidth);
          playlistBox.height(boxHeight);
          searchView.height(Audica.Dom.documentHeight);
          searchView.animate({left:0});
          playerView.animate({left:Audica.Dom.documentWidth});
          playerControlView.animate({left:Audica.Dom.documentWidth});
          _viewState = 'search';
        }
      }
    }

    Audica.Dom.searchViewPreview.on({
      hover:handleLeftZone,
      click:handleLeftZone
    });

    $(Audica.Dom.player).on("ended", function () {
      Audica.PlayerControl.next();
      Audica.Scrobbling.setNowPlaying();
      _notScrobbled = true;
    });

    $(Audica.Dom.player).on("error", function (event) {
      var audio = $(this);
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

    Audica.on('ERROR', function (args) {
      console.log(args.message);
    });

    Audica.on('fillSongBox', function(){
      var currentSongList = Audica.songDb.query().order('artist asec, album asec, year asec, track asec, title asec').get();
      Audica.View.fillSongBox(currentSongList);
    });

    Audica.Dom.songBox.on("keyup", function (event) {
      if (39 === event.which) {
        $(this).find(":selected").clone().appendTo(Audica.Dom.playListBox);
      }
    });

    Audica.Dom.playListBox.on("keyup", function (event) {
      if (37 === event.which) {
        $(this).find(":selected").detach();
      }
    });

    $(window).on('beforeunload',function(e){
      Audica.songDb.save();
      Audica.historyDb.save();
    });

    $(window).on('resize', function(){
      if (null !== resizeEventTimeoutId) {
        clearTimeout(resizeEventTimeoutId);
      }
      resizeEventTimeoutId = setTimeout(function() {
        Audica.Dom.updateDocumentDimensions();
        Audica.View.applyCoverArtStyle();
      } , 250);
    });

    Audica.trigger('registerEvents');
  };

  /**
   * TODO make private if init method is ready
   */
  this.setScrobble = function () {
    if (localStorage["audica.lastfm.sessionKey"]) {
      Audica.Scrobbler = new _SCROBBLER(localStorage["audica.lastfm.sessionKey"], localStorage["audica.lastfm.login"]);
      Audica.trigger('scrobblerInitiated');
    } else {
      Audica.Scrobbler = null;
    }
  };
  this.registerEvents = _registerEvents;

  //TODO remove debug helper
  this.getOptions = function () {
    return _options;
  };
  this.getDom = function () {
    return Audica.Dom;
  };
}

/**
 * @namespace AUDICA
 * @type {Object}
 */
AUDICA.prototype = {
  /**
   * @description Holds all events assigned to Audica
   * @type {Object}
   */
  eventList:{},
  /**
   * @param {String} eventName
   * @param {Function} fn
   * @return {*}
   */
  on:function (eventName, fn) {
    if (!this.eventList[eventName]) this.eventList[eventName] = [];
    this.eventList[eventName].push({ context:this, callback:fn });
    return this;
  },
  /**
   * @param {String} eventName
   * @return {*}
   */
  trigger:function (eventName) {
    if (!this.eventList[eventName]) return false;
    var args = Array.prototype.slice.call(arguments, 1);
    var events = this.eventList[eventName];
    for (var i = 0, subscription; subscription = events[i]; i++) {
      //noinspection JSValidateTypes
      subscription.callback.apply(subscription.context, args);
    }
    return this;
  },
  /**
   * @param {Object} obj
   */
  applyEventTo:function (obj) {
    obj.on = this.on;
    obj.trigger = this.trigger;
    obj.eventList = {};
  }
};

Audica = new AUDICA();
window.onerror = function (error, src, row) {
//    window.event.preventDefault();
  console.log('Error: %s in %s row %s', error, src, row);
};
//TODO define an init method which initiates db, dom objects, options, events, etc.
Audica.on('domElementsSet', Audica.View.applyCoverArtStyle);
Audica.songDb.init('song');
Audica.historyDb.init('history');
Audica.setScrobble();
Audica.on('readyCollectingSongs', function (args) {
  //maybe 'new Audica.collectSongs()' depends on performance and how many times this event is triggered at the same time
  Audica.collectSongs(args.songList, args.backendId, args.timestamp);
});
