/**
 * @namespace
 * @class
 */

function AUDICA() {
  "use strict";

  this.plugins = {};
  /**
   * @description The current song object
   * @type {Object|Null}
   * @private
   */
  var _song = null;
  /**
   * @description Options object
   * @type {Object}
   * @privateT
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
    searchView: null,
    searchViewPreview: null,
    playerView: null,
    playerViewPreview: null,
    playerControlView: null,
    coverArtBox: null,
    coverArt: null,
    descriptionBox: null,
    songBox: null,
    playListBox: null,
    filterBox: null,
    player: null,
    title: null,
    album: null,
    artist: null,
    progress: null,
    timeField: null,
    documentHeight: null,
    documentWidth: null,
    /**
     * @return {Array}
     */
    firstPlayListElement: function () {
      return this.playListBox.find("li :first");
    },
    /**
     * set all dom elements once
     */
    initDom: function () {
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
    updateDocumentDimensions: function () {
      this.documentHeight = $(document).height();
      this.documentWidth = $(document).width();
      Audica.trigger('documentDimensionsUpdated');
    },
    /**
     * @description Sets the first play list element
     * @param song
     */
    setFirstPlaylistElement: function (song) {
      var li = $('<li data-song="' + escape(JSON.stringify(song)) + '"><span>' + song.artist + '</span>g / <span>' + song.album + '</span> / <span>' + song.track + '.</span> <span>' + song.title + '</span></li>');
      var firstPlayListElement = Audica.Dom.firstPlayListElement();
      if (firstPlayListElement.length > 0) {
        li.insertBefore(firstPlayListElement);
      } else {
        li.appendTo(Audica.Dom.playListBox);
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
    play: function (song) {
      _song = song;
      Audica.trigger('onStartPlayingSong', {
        song: song
      });
      var player = Audica.Dom.player;
      player.type = song.contentType;
      var plugin = Audica.plugins[song.backendId];
      if (plugin) {
        plugin.setPlaySrc(song.src, player);
        plugin.setCoverArt(song.coverArt, Audica.Dom.coverArt);
      } else {
        Audica.trigger('ERROR', {
          message: 'Cannot handle songs from backend ' + song.backendId + '.'
        });
      }

      Audica.View.updateMain(song.artist, song.album, song.title);
      Audica.trigger('playSong');
    },
    /**
     * @description Plays next song
     */
    next: function () {
      var song = Audica.Playlist.getFirstElement();
      if (null !== song) {
        this.play(song);
        Audica.Playlist.removeFirstElement();
        Audica.History.add(song);
      } else {
        Audica.trigger('ERROR', {
          message: 'No song found. Possible reason: Empty Playlist'
        });
      }
      Audica.trigger('nextSong');
    },
    /**
     * @description Plays previous song
     */
    previous: function () {
      if (_songHistory.length > 0) {
        var history = _songHistory.pop();
        var song = Audica.songDb.query({
          id: history.songId,
          backendId: history.backendId
        }).get()[0];
        if (null !== song && undefined !== song) {
          this.play(song);
          Audica.Dom.setFirstPlaylistElement(song);
        } else {
          Audica.trigger('ERROR', {
            message: 'No song found. Possible reason: Empty Playlist'
          });
        }
      } else {
        Audica.trigger('ERROR', {
          message: 'No song found. Possible reason: Empty History'
        });
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
    getFirstElement: function () {
      var elements = Audica.Dom.firstPlayListElement();
      if (elements.length > 0) {
        return JSON.parse(unescape(elements.data('song')));
      } else {
        return null;
      }
    },
    /**
     * @return {Object|Null}
     */
    getLastSong: function () {
      return _songHistory[_songHistory.length - 1] || null;
    },
    /**
     *
     */
    removeFirstElement: function () {
      Audica.Dom.firstPlayListElement().detach();
      Audica.trigger('firstPlayListElementRemoved');
    }
  };
  /**
   * @namespace
   * @type {Object}
   */
  this.View = {
    songBoxPositionY:null,
    songBoxPositionX:0,
    /**
     * @param {String} artist
     * @param {String} album
     * @param {String} title
     */
    updateMain: function (artist, album, title) {
      Audica.Dom.title.text(title);
      Audica.Dom.album.text(album);
      Audica.Dom.artist.text(artist);
      Audica.trigger('updateMainView');
    },
    encodeHtml: function (string) {
      return $('<div/>').text(string).html();
    },
    /**
     * @param {Array}songs
     */
    fillSongBox: function (songs) {
      var lis = "";
      for (var i = 0; i < songs.length; i++) {
        var song = songs[i];
        var li = "<li";
        li = li + ' data-song="' + escape(JSON.stringify(song)) + '">';
        li = li + '<span class="artist" data-value="' + escape(JSON.stringify(song.artist)) + '">' + Audica.View.encodeHtml(song.artist) +
         '</span> / ' + '<span class="album" data-value="' + escape(JSON.stringify(song.album)) + '">' +
         Audica.View.encodeHtml(song.album) + '</span> / ' + '<span class="track" data-value="' +
         escape(JSON.stringify(song.track)) + '">' + Audica.View.encodeHtml(song.track) + '.</span> ' +
         '<span class="title" data-value="' + escape(JSON.stringify(song.title)) + '">' + Audica.View.encodeHtml(song.title) +
         '</span>';
        li = li + "</li>";
        lis = lis + li;
      }
      Audica.Dom.songBox.html(lis);
      Audica.View.bindSongBoxEvents();
    },
    bindSongBoxEvents: function () {
      Audica.Dom.songBox.find('span').on('click', function () {
        var value = $(this).data("value");
        var ul = $(this).closest('ul');
        var elems = ul.find('[data-value="' + value + '"]');
        ul.find('.selected').removeClass('selected');
        elems.parent().addClass('selected');
      });
    },
    closePlayerControlView: function () {
      Audica.Dom.playerControlView.data("open", false);
      _closePlayerControlViewTimerId = null;
      Audica.Dom.playerControlView.animate({
        height: "4px"
      });
    },
    applyCoverArtStyle: function () {
      // Use original window elem to set height because reflect is need this
      Audica.Dom.coverArt[0].height = Audica.Dom.documentHeight * 0.6;
      Audica.Dom.coverArt[0].width = Audica.Dom.coverArt[0].height;
      Audica.Dom.coverArt.reflect({
        height: 0.165,
        opacity: 0.25
      });
      Audica.Dom.coverArtBox.css("padding-top", (Audica.Dom.documentHeight - Audica.Dom.coverArtBox.height()) / 2);
      Audica.Dom.descriptionBox.css("padding-top", (Audica.Dom.documentHeight - Audica.Dom.descriptionBox.height()) / 2);
    },
    updateProgress: function () {
      if (!Audica.Dom.player.paused) {
        Audica.Dom.progress.val(Math.round((Audica.Dom.player.currentTime * 100) / Audica.Dom.player.duration));
      }
    },
    updateTimings: function () {
      if (Audica.Dom.playerControlView.data("open")) {
        if (!Audica.Dom.player.paused) {
          Audica.Dom.timeField.text(Math.round(Audica.Dom.player.currentTime) + " / " + Math.round(Audica.Dom.player.duration));
        }
      }
    },
    indicateSongBoxXPosition: function(){
      var positionXClassMap = {
        0: '.artist',
        1: '.album',
        2: '.track',
        3: '.title'
      };
      var currentXClass = positionXClassMap[Audica.View.songBoxPositionX];
      var songBox = Audica.Dom.songBox;
      var selectedElems = songBox.find('.selected');
      songBox.find('[positionX]').removeAttr('positionX');
      selectedElems.find(currentXClass).attr('positionX',true);
    },
    getViewState: function(){
      return _viewState;
    },
    setViewState: function(viewState){
      Audica.trigger('viewStateChanged', {from: _viewState, to: viewState});
      _viewState = viewState;
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
    Audica.songDb.query({
      backendId: {
        is: backendId
      },
      addedOn: {
        '!is': timestamp
      }
    }).remove();
    Audica.trigger('fillSongBox');
    Audica.trigger('collectSongs');
  };
  /**
   *
   */
  this.updateSongList = function () {
    Audica.trigger('fillSongBox');
    Audica.trigger('updateSongList', {
      timestamp: $.now()
    });
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
    setNowPlaying: function () {
      if (Audica.plugins.scrobbler) {
        var history = Audica.Playlist.getLastSong();
        if (null !== history) {
          var song = Audica.songDb.query({
            id: history.songId,
            backendId: history.backendId
          }).get()[0];
          if (song) {
            Audica.plugins.scrobbler.setNowPlaying(song.artist, song.title, song.album, song.duration, function (data) {
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
      }
    },
    scrobble: function () {
      if (Audica.plugins.scrobbler) {
        var audio = Audica.Dom.player;
        if (!audio.paused) {
          if (Math.round((audio.currentTime * 100) / audio.duration) > 50 && _notScrobbled) {
            var history = Audica.Playlist.getLastSong();
            if (null !== history) {
              var song = Audica.songDb.query({
                id: history.songId,
                backendId: history.backendId
              }).get()[0];
              if (null !== song) {
                var timestamp = parseInt((new Date()).getTime() / 1000.0);
                Audica.plugins.scrobbler.scrobble(song.artist, song.title, song.album, song.duration, timestamp, function (data) {
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
    },
    getNotScrobbled: function(){
      return _notScrobbled;
    },
    setNotScrobbled: function(notScrobbled){
      _notScrobbled = notScrobbled;
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
    add: function () {
      var historyElem = {
        timestamp: $.now(),
        backendId: _song.backendId,
        songId: _song.id
      };
      _songHistory.push(historyElem);
      Audica.historyDb.query.insert(historyElem);
    },
    showByTime: function (dir) {
      return Audica.historyDb.query().order('timestamp ' + dir).get();
    }
  };

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
    };
  }

  /**
   * @function
   * @private
   */
  this.registerEvents = function () {
      window.bindKeyEvents(Audica);

      $(document).mousemove(function () {
        var playerControlView = Audica.Dom.playerControlView;
        if ('player' === _viewState) {
          if (null !== _closePlayerControlViewTimerId) {
            clearTimeout(_closePlayerControlViewTimerId);
          }
          if (!playerControlView.data("open")) {
            playerControlView.data("open", true);
            playerControlView.animate({
              height: "50px"
            });
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
            searchView.animate({
              left: -1 * Math.round(Audica.Dom.documentWidth * 0.05)
            });
            playerView.animate({
              left: Math.round(Audica.Dom.documentWidth * 0.95)
            });
            playerControlView.animate({
              left: Math.round(Audica.Dom.documentWidth * 0.95)
            });
          } else if ("mouseleave" === event.type) {
            searchView.height(Audica.Dom.documentHeight);
            searchView.animate({
              left: "0"
            });
            playerView.animate({
              left: Audica.Dom.documentWidth
            });
            playerControlView.animate({
              left: Audica.Dom.documentWidth
            });
          } else if ("click" === event.type) {
            searchView.animate({
              left: -1 * Audica.Dom.documentWidth
            });
            playerView.animate({
              left: 0
            });
            playerControlView.animate({
              left: 0
            });
            if (audio.paused) {
              Audica.PlayerControl.next();
              Audica.Scrobbling.setNowPlaying();
              _notScrobbled = true;
            }
            Audica.View.setViewState('player');
            coverArtBox.css("padding-top", (Audica.Dom.documentHeight - coverArtBox.height()) / 2);
            descriptionBox.css("padding-top", (Audica.Dom.documentHeight - descriptionBox.height()) / 2);
          }
        }
      }

      function selectPlayList() {
        Audica.View.setViewState('playList');
      }

      function selectSongBox() {
        Audica.View.setViewState('search');
      }

      Audica.Dom.playerViewPreview.on({
        hover: handleRightZone,
        click: handleRightZone
      });

      Audica.Dom.playListBox.on({
        click: selectPlayList
      });
      Audica.Dom.songBox.on({
        click: selectSongBox
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
            searchView.animate({
              left: -1 * Math.round(Audica.Dom.documentWidth * 0.95)
            });
            playerView.animate({
              left: Math.round(Audica.Dom.documentWidth * 0.05)
            });
            playerControlView.animate({
              left: Math.round(Audica.Dom.documentWidth * 0.05)
            });
          } else if ("mouseleave" === event.type) {
            searchView.height(Audica.Dom.documentHeight);
            searchView.animate({
              left: -1 * Audica.Dom.documentWidth
            });
            playerView.animate({
              left: 0
            });
            playerControlView.animate({
              left: 0
            });
          } else if ("click" === event.type) {
            songBox.focus();
            songBox.width(boxWidth);
            songBox.height(boxHeight);
            playlistBox.width(boxWidth);
            playlistBox.height(boxHeight);
            searchView.height(Audica.Dom.documentHeight);
            searchView.animate({
              left: 0
            });
            playerView.animate({
              left: Audica.Dom.documentWidth
            });
            playerControlView.animate({
              left: Audica.Dom.documentWidth
            });
            Audica.View.setViewState('search');
          }
        }
      }

      Audica.Dom.searchViewPreview.on({
        hover: handleLeftZone,
        click: handleLeftZone
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
          errorMsg += "Unknown error with code '" + event.currentTarget.error.code + "' happened.";
        }
        alert(errorMsg);
      });

      Audica.on('ERROR', function (args) {
        console.log(args.message);
      });

      Audica.on('fillSongBox', function () {
        var currentSongList = Audica.songDb.query().order('artist asec, album asec, year asec, track asec, title asec').get();
        Audica.View.fillSongBox(currentSongList);
      });

      $(window).on('beforeunload', function (e) {
        Audica.songDb.save();
        Audica.historyDb.save();
      });

      $(window).on('resize', function () {
        if (null !== resizeEventTimeoutId) {
          clearTimeout(resizeEventTimeoutId);
        }
        resizeEventTimeoutId = setTimeout(function () {
          Audica.Dom.updateDocumentDimensions();
          Audica.View.applyCoverArtStyle();
        }, 250);
      });

      Audica.trigger('registerEvents');
    };

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
  eventList: {},
  /**
   * @param {String} eventName
   * @param {Function} fn
   * @return {*}
   */
  on: function (eventName, fn) {
    if (!this.eventList[eventName]) this.eventList[eventName] = [];
    this.eventList[eventName].push({
      context: this,
      callback: fn
    });
    return this;
  },
  /**
   * @param {String} eventName
   * @return {*}
   */
  trigger: function (eventName) {
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
  applyEventTo: function (obj) {
    obj.on = this.on;
    obj.trigger = this.trigger;
    obj.eventList = {};
  }
};