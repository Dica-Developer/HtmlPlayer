/*global $:true, Audica:true, AUDICA:true, Mousetrap, TAFFY:true, escape:true, unescape:true, alert:true, console:true, localStorage, bindKeyEvents*/
(function (window, document, Mousetrap) {
  "use strict";
  /**
   *
   * @constructor
   */
  window.Db = function() {
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
  };

  var bindKeyEvents = function(Audica){
    var bindKeysToView = {};
    var dom = Audica.Dom;
    var audio = dom.player[0];
    var songBox = dom.songBox;
    var playListBox = dom.playlistBox;
    var searchView = dom.searchView;
    var boxWidth = (dom.documentWidth / 2) - 22 - 2;
    var boxHeight = dom.documentHeight - 22;
    var playerView = dom.playerView;
    var playerControlView = dom.playerControlView;
    var coverArtBox = dom.coverArtBox;
    var filterBox = dom.filterBox;
    var descriptionBox = dom.descriptionBox;
    var filterBoxTimeout = null;

    Audica.on('viewStateChanged', function(args){
      Mousetrap.reset();
      bindKeysToView[args.to].call(this);
    });

    bindKeysToView.player = function(){
      Mousetrap.bind(['right'], function(){
        audio.currentTime = audio.currentTime + 10;
      });

      Mousetrap.bind(['left'], function(){
        audio.currentTime = audio.currentTime - 10;
      });

      Mousetrap.bind(['l'], function(){
        songBox.focus();
        songBox.width(boxWidth);
        songBox.height(boxHeight);
        playListBox.width(boxWidth);
        playListBox.height(boxHeight);
        searchView.height($(document).height());
        searchView.animate({ left: 0 });
        playerView.animate({ left: dom.documentWidth });
        playerControlView.animate({ left: dom.documentWidth });
        Audica.setViewState('search');
      });

      Mousetrap.bind(['n'], function(){
        Audica.nextSong();
        Audica.scrobbleNowPlaying();
        Audica.setNotScrobbled(true);
      });

      Mousetrap.bind(['p'], function(){
        Audica.previousSong();
        Audica.scrobbleNowPlaying();
        Audica.setNotScrobbled(true);
      });

      Mousetrap.bind(['space'], function(){
        return audio.paused ? audio.play() : audio.pause();
      });

    };

    bindKeysToView.search = function(){
      Mousetrap.bind(['right'], function(){
        var x = Audica.getSongBoxPositionX();
        if (3 === x) {
          Audica.setSongBoxPositionX(0);
        } else {
          Audica.setSongBoxPositionX(++x);
        }
        Audica.getSongBoxPositionY().find('span').eq(x).trigger('click');
        Audica.indicateSongBoxXPosition();
      });

      Mousetrap.bind(['left'], function(){
        var x = Audica.getSongBoxPositionX();
        if (0 === x) {
          Audica.setSongBoxPositionX(3);
        } else {
          Audica.setSongBoxPositionX(--x);
        }
        Audica.getSongBoxPositionY().find('span').eq(x).trigger('click');
        Audica.indicateSongBoxXPosition();
      });

      Mousetrap.bind(['up'], function(){
        var prev = null;
        if (!Audica.getSongBoxPositionY()) {
          Audica.setSongBoxPositionY(songBox.find('li').eq(0));
          prev = Audica.getSongBoxPositionY();
        } else {
          prev = findNextByPositionX('prev');
          Audica.getSongBoxPositionY().removeClass('active');
          if (prev.length === 0) {
            prev = dom.songBox.find('li').last();
          }
        }
        var halfWindowSize = window.innerHeight / 2;
        var scrollPos = Math.abs(songBox.parent().scrollTop() + prev.position().top) - halfWindowSize;
        songBox.parent().scrollTop(scrollPos);
        prev.addClass('active');
        Audica.setSongBoxPositionY(prev);
        prev.find('span').eq(Audica.getSongBoxPositionX()).trigger('click');
        Audica.indicateSongBoxXPosition();
      });

      Mousetrap.bind(['down'], function(){
        if(filterBox.data.open){
          filterBox.data("open", false);
          filterBox.blur();
          songBox.focus();
          filterBox.hide();
          filterBox.val("");
        }
        var next = null;
        if (!Audica.getSongBoxPositionY()) {
          Audica.setSongBoxPositionY(songBox.find('li').eq(0));
          next = Audica.getSongBoxPositionY();
        } else {
          next = findNextByPositionX('next');
          Audica.getSongBoxPositionY().removeClass('active');
          if (next.length === 0) {
            next = songBox.find('li').eq(0);
          }
        }
        var halfWindowSize = window.innerHeight / 2;
        var scrollPos = Math.abs(next.position().top + songBox.parent().scrollTop()) - halfWindowSize;
        songBox.parent().scrollTop(scrollPos);
        next.addClass('active');
        Audica.setSongBoxPositionY(next);
        next.find('span').eq(Audica.getSongBoxPositionX()).trigger('click');
        Audica.indicateSongBoxXPosition();
      });

      Mousetrap.bind(['escape'], function(){
        if (filterBox.data("open")) {
          filterBox.data("open", false);
          filterBox.blur();
          songBox.focus();
          filterBox.hide();
          filterBox.val("");
        } else {
          searchView.animate({ left: -1 * dom.documentWidth });
          playerView.animate({ left: "0" });
          playerControlView.animate({ left: "0" });
          if (audio.paused) {
            Audica.nextSong();
            Audica.scrobbleNowPlaying();
            Audica.setNotScrobbled(true);
          }
          Audica.setViewState('player');
          coverArtBox.css("padding-top", (dom.documentHeight - coverArtBox.height()) / 2);
          descriptionBox.css("padding-top", (dom.documentHeight - descriptionBox.height()) / 2);
        }
      });

      Mousetrap.bind(['enter'], function(){
        var elemsToMove = dom.songBox.find(".selected");
        var clones = elemsToMove.clone();
        clones.animate({opacity: 0}, function(){
          elemsToMove.removeClass('selected');
          clones.removeClass('selected');
          clones.css({opacity: 1});
        });
        elemsToMove.addClass('added');
        clones.appendTo(dom.playlistBox);
        dom.playlistBox.find('span').on('click', function () {
          var thisUL = $(this).closest('ul');
          var value = $(this).data("value");
          var elems = thisUL.find('[data-value="' + value + '"]');
          thisUL.find('.selected').removeClass('selected');
          elems.parent().addClass('selected');
        });
      });

      Mousetrap.bind(['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','ä','ö','ü','backspace'], function(){
        if (!filterBox.data("open")) {
          filterBox.data("open", true);
          filterBox.show();
          filterBox.focus();
        }
        if (null !== filterBoxTimeout) {
          window.clearTimeout(filterBoxTimeout);
        }
        filterBoxTimeout = window.setTimeout(function () {
          var currentSongList = [];
          var filterQuery = filterBox.val();
          if (null !== filterQuery && undefined !== filterQuery) {
            // TODO If album medium number is available sort by it first
            var dbQuery = [
              { artist: { likenocase: filterQuery } },
              { album: { likenocase: filterQuery } },
              { genre: { likenocase: filterQuery } },
              { title: { likenocase: filterQuery } }
            ];
            currentSongList = Audica.songDb.query(dbQuery).order('artist asec, album asec, year asec, track asec, title asec').get();
          } else {
            currentSongList = Audica.songDb.query().order('artist asec, album asec, year asec, track asec, title asec').get();
          }
          Audica.fillSongBox(currentSongList);
        }, 500);
      });

      Mousetrap.bind('tab', function(){
        Audica.setViewState('playList');
        return false;
      });
    };

    bindKeysToView.playList = function(){
      Mousetrap.bind(['del'], function(){
        var elems = dom.playlistBox.find(".selected");
        elems.each(function () {
          var song = dom.songBox.find('[data-song="' + $(this).data('song') + '"]');
          song.removeClass('added');
        });
        elems.remove();
      });

      Mousetrap.bind('tab', function(){
        Audica.setViewState('search');
        return false;
      });

      Mousetrap.bind('down', function(){ });
      Mousetrap.bind('up', function(){ });
    };

    bindKeysToView[Audica.getViewState()].call(Audica);

    var findNextByPositionX = function(dir){
      var currentXClass = Audica.positionXClassMap[Audica.getSongBoxPositionX()];
      var currentXValue = Audica.getSongBoxPositionY().find(currentXClass).data('value');
      var tmpNext = Audica.getSongBoxPositionY();
      //TODO maybe replace with for loop (secure)
      while(tmpNext.find(currentXClass).data('value') === currentXValue){
        tmpNext = tmpNext[dir]();
      }
      return tmpNext;
    };
  };

  function Audica() {
    this.plugins = {};
    this.songDb = new window.Db();
    this.historyDb = new window.Db();
    this.eventList = {};
    this.songHistory = [];
    this.song = null;
    this.closePlayerControlViewTimerId = null;
    this.resizeEventTimeoutId = null;
    this.pluginsToInitialize = 0;

    this.positionXClassMap = {
      0:'.artist',
      1:'.album',
      2:'.track',
      3:'.title'
    };

    var viewState = 'player';
    var notScrobbled = true;
    var songBoxPositionY = null;
    var songBoxPositionX = 0;

//  Getter & Setter
    this.getViewState = function () {
      return viewState;
    };
    this.setViewState = function (newViewState) {
      var oldState = viewState;
      viewState = newViewState;
      this.trigger('viewStateChanged', {from:oldState, to:viewState});
    };
    this.getSongBoxPositionX = function () {
      return songBoxPositionX;
    };
    this.setSongBoxPositionX = function (positionX) {
      songBoxPositionX = positionX;
    };
    this.getSongBoxPositionY = function () {
      return songBoxPositionY;
    };
    this.setSongBoxPositionY = function (positionY) {
      songBoxPositionY = positionY;
    };
    this.getNotScrobbled = function () {
      return notScrobbled;
    };
    this.setNotScrobbled = function (scrobbled) {
      notScrobbled = scrobbled;
    };
  }

  Audica.prototype.Dom = {
    searchView:null,
    searchViewPreview:null,
    playerView:null,
    playerViewPreview:null,
    playerControlView:null,
    coverArtBox:null,
    coverArt:null,
    descriptionBox:null,
    songBox:null,
    playlistBox:null,
    filterBox:null,
    player:null,
    title:null,
    album:null,
    artist:null,
    progress:null,
    timeField:null,
    documentHeight:null,
    documentWidth:null
  };

  Audica.prototype.firstPlayListElement = function () {
    return this.Dom.playlistBox.find("li :first");
  };

  Audica.prototype.initDom = function () {
    for (var selector in this.Dom) {
      if (this.Dom.hasOwnProperty(selector)) {
        this.Dom[selector] = $('#' + selector);
      }
    }
    this.updateDocumentDimensions();
    this.trigger('domElementsSet');
  };

  Audica.prototype.updateDocumentDimensions = function () {
    this.Dom.documentHeight = $(document).height();
    this.Dom.documentWidth = $(document).width();
    this.trigger('documentDimensionsUpdated');
  };

  Audica.prototype.setFirstPlaylistElement = function (song) {
    var li = $('<li data-song="' + escape(JSON.stringify(song)) + '"><span>' +
      song.artist + '</span>g / <span>' +
      song.album + '</span> / <span>' +
      song.track + '.</span> <span>' +
      song.title + '</span></li>');

    var firstPlayListElement = this.firstPlayListElement();
    if (firstPlayListElement.length > 0) {
      li.insertBefore(firstPlayListElement);
    } else {
      li.appendTo(this.Dom.playlistBox);
    }
  };

  Audica.prototype.clearPlaylist = function(){
    if(this.Dom.playlistBox){
      this.Dom.playlistBox.empty();
    }
  };


  Audica.prototype.playSong = function (song) {
    this.song = song;
    this.trigger('onStartPlayingSong', { song:song });
    var player = this.Dom.player[0];
    player.type = song.contentType;
    var plugin = this.plugins[song.backendId];

    if (plugin) {
      plugin.setPlaySrc(song.src, player);
      plugin.setCoverArt(song.coverArt, this.Dom.coverArt);
    } else {
      this.trigger('ERROR', { message:'Cannot handle songs from backend ' + song.backendId + '.' });
    }

    this.updateMainView(song.artist, song.album, song.title);
    this.trigger('playSong', {song:song});
  };

  Audica.prototype.nextSong = function () {
    var song = this.getFirstPlaylistElement();
    if (null !== song) {
      this.playSong(song);
      this.removeFirstPlaylistElement();
      this.historyAdd(song);
    } else {
      this.trigger('ERROR', { message:'No song found. Possible reason: Empty Playlist' });
    }
    this.trigger('nextSong');
  };

  Audica.prototype.previousSong = function () {
    if (this.songHistory.length > 0) {
      var history = this.songHistory.pop();
      var song = this.songDb.query({
        id:history.songId,
        backendId:history.backendId
      }).get()[0];

      if (null !== song && undefined !== song) {
        this.playSong(song);
        this.setFirstPlaylistElement(song);
      } else {
        this.trigger('ERROR', { message:'No song found. Possible reason: Empty Playlist' });
      }
    } else {
      this.trigger('ERROR', { message:'No song found. Possible reason: Empty History' });
    }
    this.trigger('previousSong');
  };

  Audica.prototype.getFirstPlaylistElement = function () {
    var elements = this.firstPlayListElement();
    if (elements.length > 0) {
      return JSON.parse(unescape(elements.data('song')));
    } else {
      return null;
    }
  };

  Audica.prototype.getLastSong = function () {
    return this.songHistory[this.songHistory.length - 1] || null;
  };

  Audica.prototype.removeFirstPlaylistElement = function () {
    this.firstPlayListElement().detach();
    this.trigger('firstPlayListElementRemoved');
  };

  Audica.prototype.updateMainView = function (artist, album, title) {
    this.Dom.title.text(title);
    this.Dom.album.text(album);
    this.Dom.artist.text(artist);
    this.trigger('updateMainView');
  };

  Audica.prototype.fillSongBox = function (songs) {
    var lis = "", i = 0, length = songs.length, song;
    for (i; i < length; ++i) {
      song = songs[i];
      var li = '<li ' +
        'data-song="' + escape(JSON.stringify(song)) + '">' +
        '<span class="artist" data-value="' + escape(JSON.stringify(song.artist)) + '">' + this.encodeHtml(song.artist) + '</span> / ' +
        '<span class="album" data-value="' + escape(JSON.stringify(song.album)) + '">' + this.encodeHtml(song.album) + '</span> / ' +
        '<span class="track" data-value="' + escape(JSON.stringify(song.track)) + '">' + this.encodeHtml(song.track) + '.</span> ' +
        '<span class="title" data-value="' + escape(JSON.stringify(song.title)) + '">' + this.encodeHtml(song.title) +
        '</span>' +
        '</li>';
      lis = lis + li;
    }
    this.Dom.songBox.html(lis);
    this.bindSongBoxEvents();
  };

  Audica.prototype.bindSongBoxEvents = function () {
    var self = this;
    this.Dom.songBox.find('span').on('click', function () {
      var value = $(this).data("value");
      var clazz = $(this).attr('class');
      var yIndex = $(this).closest('li');
      var ul = $(this).closest('ul');
      var elems = ul.find('.' + clazz + '[data-value="' + value + '"]');
      ul.find('.selected').removeClass('selected');
      elems.parent().addClass('selected');
      self.setSongBoxPositionY(yIndex);
      self.setSongBoxPositionX($(this).index());
      self.indicateSongBoxXPosition();
    });
  };

  Audica.prototype.closePlayerControlView = function () {
    this.Dom.playerControlView.data("open", false);
    this.closePlayerControlViewTimerId = null;
    this.Dom.playerControlView.animate({
      height:"4px"
    });
  };

  Audica.prototype.applyCoverArtStyle = function () {
    // Use original window elem to set height because reflect is need this
    this.Dom.coverArt[0].height = this.Dom.documentHeight * 0.6;
    this.Dom.coverArt[0].width = this.Dom.coverArt[0].height;
    this.Dom.coverArt.reflect({
      height:0.165,
      opacity:0.25
    });
    this.Dom.coverArtBox.css("padding-top", (this.Dom.documentHeight - this.Dom.coverArtBox.height()) / 2);
    this.Dom.descriptionBox.css("padding-top", (this.Dom.documentHeight - this.Dom.descriptionBox.height()) / 2);
  };

  Audica.prototype.updateProgress = function () {
    var player = this.Dom.player[0];
    if (!player.paused) {
      this.Dom.progress.val(Math.round((player.currentTime * 100) / player.duration));
    }
  };

  Audica.prototype.updateTimings = function () {
    if (this.Dom.playerControlView.data("open")) {
      var player = this.Dom.player[0];
      if (!player.paused) {
        this.Dom.timeField.text(Math.round(player.currentTime) + " / " + Math.round(player.duration));
      }
    }
  };

  Audica.prototype.indicateSongBoxXPosition = function () {
    var currentXClass = this.positionXClassMap[this.getSongBoxPositionX()];
    var songBox = this.Dom.songBox;
    var selectedElems = songBox.find('.selected');
    songBox.find('[positionX]').removeAttr('positionX');
    selectedElems.find(currentXClass).attr('positionX', true);
  };

  Audica.prototype.collectSongs = function (songList, backendId, timestamp) {
    var i = 0 , length = songList.length, song;
    for (i; i < length; i++) {
      song = songList[i];
      this.songDb.query.insert(song);
    }
    this.songDb.query({
      backendId:{ is:backendId },
      addedOn:{ '!is':timestamp }
    }).remove();

    this.trigger('fillSongBox');
    this.trigger('collectSongs');
  };

  Audica.prototype.updateSongList = function () {
    this.trigger('fillSongBox');
    this.trigger('updateSongList', { timestamp:$.now() });
    this.trigger('finished');
  };

  Audica.prototype.backgroundTasks = function () {
    this.updateProgress();
    this.updateTimings();
    this.scrobbleSong();
  };

  Audica.prototype.scrobbleNowPlaying = function () {
    if (this.plugins.scrobbler) {
      var history = this.getLastSong();
      if (null !== history) {
        var song = this.songDb.query({ id:history.songId, backendId:history.backendId }).get()[0];
        if (song) {
          this.plugins.scrobbler.setNowPlaying(song.artist, song.title, song.album, song.duration, function (data) {
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
  };

  Audica.prototype.scrobbleSong = function () {
    if (this.plugins.scrobbler) {
      var audio = this.Dom.player[0];
      var notScrobbled = this.getNotScrobbled();
      if (!audio.paused) {
        if (Math.round((audio.currentTime * 100) / audio.duration) > 50 && notScrobbled) {
          var history = this.getLastSong();
          if (null !== history) {
            var song = this.songDb.query({ id:history.songId, backendId:history.backendId }).get()[0];
            if (null !== song) {
              var timestamp = Number((new Date()).getTime() / 1000.0);
              this.plugins.scrobbler.scrobble(song.artist, song.title, song.album, song.duration, timestamp, function (data) {
                if (undefined !== data.error) {
                  switch (data.error) {
                    case 6:
                    case 13:
                      console.warn("Cannot scrobble the song there is a parameter missing/wrong!", data.message);
                      this.setNotScrobbled(true);
                      break;
                    default:
                      alert("Cannot scrobble track to last.fm. " + data.error + " - " + data.message);
                  }
                } else {
                  this.setNotScrobbled(false);
                }
              }, null);
            }
          }
        }
      }
    }
  };

  Audica.prototype.historyAdd = function () {
    var historyElem = { timestamp:$.now(), backendId:this.song.backendId, songId:this.song.id };
    this.songHistory.push(historyElem);
    this.historyDb.query.insert(historyElem);
  };

  Audica.prototype.historyShowByTime = function (direction) {
    return this.historyDb.query().order('timestamp ' + direction).get();
  };

  Audica.prototype.registerEvents = function () {
    var self = this;
    bindKeyEvents(this);
    $(document).mousemove(function () {
      var playerControlView = self.Dom.playerControlView;
      if ('player' === self.getViewState()) {
        if (null !== self.closePlayerControlViewTimerId) {
          window.clearTimeout(self.closePlayerControlViewTimerId);
        }
        if (!playerControlView.data("open")) {
          playerControlView.data("open", true);
          playerControlView.animate({ height:"50px" });
        }
        self.closePlayerControlViewTimerId = window.setTimeout(function () {
          self.closePlayerControlView();
        }, 3000);

      }
    });

    var handleRightZone = function (event) {
      if ('search' === self.getViewState()) {
        var searchView = self.Dom.searchView;
        var playerView = self.Dom.playerView;
        var playerControlView = self.Dom.playerControlView;
        var coverArtBox = self.Dom.coverArtBox;
        var descriptionBox = self.Dom.descriptionBox;
        var audio = self.Dom.player[0];
        if ("mouseenter" === event.type) {
          searchView.height(self.Dom.documentHeight);
          searchView.animate({ left:-1 * Math.round(self.Dom.documentWidth * 0.05) });
          playerView.animate({ left:Math.round(self.Dom.documentWidth * 0.95) });
          playerControlView.animate({ left:Math.round(self.Dom.documentWidth * 0.95) });
        } else if ("mouseleave" === event.type) {
          searchView.height(self.Dom.documentHeight);
          searchView.animate({ left:"0" });
          playerView.animate({ left:self.Dom.documentWidth });
          playerControlView.animate({ left:self.Dom.documentWidth });
        } else if ("click" === event.type) {
          searchView.animate({ left:-1 * self.Dom.documentWidth });
          playerView.animate({ left:0 });
          playerControlView.animate({ left:0 });
          if (audio.paused) {
            self.nextSong();
            self.scrobbleNowPlaying();
            self.setNotScrobbled(true);
          }
          self.setViewState('player');
          coverArtBox.css("padding-top", (self.Dom.documentHeight - coverArtBox.height()) / 2);
          descriptionBox.css("padding-top", (self.Dom.documentHeight - descriptionBox.height()) / 2);
        }
      }
    };

    var selectPlayList = function () {
      if ('playList' !== self.getViewState()) {
        self.setViewState('playList');
      }
    };

    var selectSongBox = function () {
      if ('search' !== self.getViewState()) {
        self.setViewState('search');
      }
    };

    this.Dom.playerViewPreview.on({
      hover:handleRightZone,
      click:handleRightZone
    });

    this.Dom.playlistBox.on({ click:selectPlayList });

    this.Dom.songBox.on({ click:selectSongBox });

    var handleLeftZone = function (event) {
      var searchView = self.Dom.searchView;
      var playerView = self.Dom.playerView;
      var playerControlView = self.Dom.playerControlView;
      var songBox = self.Dom.songBox;
      var playlistBox = self.Dom.playlistBox;
      var boxWidth = (self.Dom.documentWidth / 2) - 22 - 2;
      var boxHeight = self.Dom.documentHeight - 22;
      if ('player' === self.getViewState()) {
        if ('mouseenter' === event.type) {
          searchView.height(self.Dom.documentHeight);
          searchView.animate({ left:-1 * Math.round(self.Dom.documentWidth * 0.95) });
          playerView.animate({ left:Math.round(self.Dom.documentWidth * 0.05) });
          playerControlView.animate({ left:Math.round(self.Dom.documentWidth * 0.05) });
        } else if ("mouseleave" === event.type) {
          searchView.height(self.Dom.documentHeight);
          searchView.animate({ left:-1 * self.Dom.documentWidth });
          playerView.animate({ left:0 });
          playerControlView.animate({ left:0 });
        } else if ("click" === event.type) {
          songBox.focus();
          songBox.width(boxWidth);
          songBox.height(boxHeight);
          playlistBox.width(boxWidth);
          playlistBox.height(boxHeight);
          searchView.height(self.Dom.documentHeight);
          searchView.animate({ left:0 });
          playerView.animate({ left:self.Dom.documentWidth });
          playerControlView.animate({ left:self.Dom.documentWidth });
          self.setViewState('search');
        }
      }
    };

    this.Dom.searchViewPreview.on({
      hover:handleLeftZone,
      click:handleLeftZone
    });

    this.Dom.player.on("ended", function () {
      self.nextSong();
      self.scrobbleNowPlaying();
      self.setNotScrobbled(true);
    });

    this.Dom.player.on("error", function (event) {
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

    this.on('ERROR', function (args) {
      console.log(args.message);
    });

    this.on('fillSongBox', function () {
      var currentSongList = this.songDb.query().order('artist asec, album asec, year asec, track asec, title asec').get();
      this.fillSongBox(currentSongList);
    });

    this.on('domElementsSet', this.applyCoverArtStyle);
    this.songDb.init('song');
    this.historyDb.init('history');
    this.on('readyCollectingSongs', function (args) {
      self.collectSongs(args.songList, args.backendId, args.timestamp);
    });
    this.on('initReady', function(){
      console.log(this.pluginsToInitialize);
      if(this.pluginsToInitialize !== 0){
        this.pluginsToInitialize--;
      }else{
        this.updateSongList();
      }
    });

    $(window).on('beforeunload', function () {
      self.songDb.save();
      self.historyDb.save();
    });

    $(window).on('resize', function () {
      if (null !== self.resizeEventTimeoutId) {
        window.clearTimeout(self.resizeEventTimeoutId);
      }
      self.resizeEventTimeoutId = window.setTimeout(function () {
        console.log(self);
        self.updateDocumentDimensions();
        self.applyCoverArtStyle();
      }, 250);
    });

    this.trigger('registerEvents');
  };

  Audica.prototype.encodeHtml = function (string) {
    return $('<div />').text(string).html();
  };

  Audica.prototype.on = function (eventName, fn) {
    if (!this.eventList[eventName]) {
      this.eventList[eventName] = [];
    }
    this.eventList[eventName].push({
      context:this,
      callback:fn
    });
    return this;
  };

  Audica.prototype.trigger = function (eventName) {
    if (!this.eventList[eventName]) {
      return false;
    }
    var args = Array.prototype.slice.call(arguments, 1),
      events = this.eventList[eventName],
      i = 0, length = events.length, subscription;
    for (i; i < length; i++) {
      subscription = events[i];
      //noinspection JSValidateTypes
      subscription.callback.apply(subscription.context, args);
    }
    return this;
  };

  Audica.prototype.extend = function(name, fn){
    this.plugins[name] = fn;
  };

  Audica.prototype.initPlugins = function(){
    var plugins = [];
    for(var name in this.plugins){
      if(this.plugins.hasOwnProperty(name)){
        if(this.plugins[name].init instanceof Function){
          plugins[plugins.length] = name;
        }
      }
    }
    var length = plugins.length, plugin;
    this.pluginsToInitialize = length-1;
    if(length !== 0){
      for(var i = 0; i < length; ++i){
        plugin = plugins[i];
        this.plugins[plugin].init.call(this);
      }
    }else{
      this.updateSongList();
    }
  };

  Audica.prototype.start = function(){
    console.count('start');
    var self = this;
    this.initDom();
    this.registerEvents();
    this.initPlugins();
    window.setInterval(function(){
      self.backgroundTasks();
    }, 1000);
  };


  window.Audica = new Audica();

})(window, document, Mousetrap);