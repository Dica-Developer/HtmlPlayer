/*global TAFFY:true, escape:true, unescape:true, console:true, Mousetrap*/
(function(window, document) {
  'use strict';

  /*global window, document*/

  function Audica() {
    this.plugins = {};
    this.songDb = new window.Db();
    this.historyDb = new window.Db();
    this.eventList = {};
    this.songHistory = [];
    this.song = null;
    this.closePlayerControlViewTimerId = null;
    this.resizeEventTimeoutId = null;

    this.positionXClassMap = {
      0: '.artist',
      1: '.album',
      2: '.track',
      3: '.title'
    };

    var viewState = 'player';
    var notScrobbled = true;
    var songBoxPositionY = null;
    var songBoxPositionX = 0;

    //  Getter & Setter
    this.getViewState = function() {
      return viewState;
    };
    this.setViewState = function(newViewState) {
      var oldState = viewState;
      viewState = newViewState;
      this.trigger('viewStateChanged', {
        from: oldState,
        to: viewState
      });
    };
    this.getSongBoxPositionX = function() {
      return songBoxPositionX;
    };
    this.setSongBoxPositionX = function(positionX) {
      songBoxPositionX = positionX;
    };
    this.getSongBoxPositionY = function() {
      return songBoxPositionY;
    };
    this.setSongBoxPositionY = function(positionY) {
      songBoxPositionY = positionY;
    };
    this.getNotScrobbled = function() {
      return notScrobbled;
    };
    this.setNotScrobbled = function(scrobbled) {
      notScrobbled = scrobbled;
    };
  }

  Audica.prototype.Dom = {
    searchView: null,
    searchViewPreview: null,
    playerView: null,
    playerViewPreview: null,
    playerControlView: null,
    coverArtBox: null,
    coverArt: null,
    descriptionBox: null,
    songBox: null,
    playlistBox: null,
    filterBox: null,
    title: null,
    album: null,
    artist: null,
    progressBar: null,
    timeField: null,
    preferencesView: null
  };

  Audica.prototype.firstPlayListElement = function() {
    return this.Dom.playlistBox.find('li :first');
  };

  Audica.prototype.getNthPlayListElement = function(pos) {
    return this.Dom.playlistBox.find('li :nth(' + pos + ')');
  };

  function checkDomElements(dom) {
    var selector = null;
    for (selector in dom) {
      if (dom.hasOwnProperty(selector)) {
        if (null === dom[selector] || undefined === dom[selector]) {
          throw new Error('"' + selector + '" does not exist in DOM!');
        }
      }
    }
  }

  Audica.prototype.initDom = function() {
    var selector = null;
    for (selector in this.Dom) {
      if (this.Dom.hasOwnProperty(selector)) {
        this.Dom[selector] = $('#' + selector);
      }
    }
    checkDomElements(this.Dom);
    this.trigger('domElementsSet');
    this.applyCoverArtStyle();
    this.Dom.searchView.css('left', -1 * $(document).width());
  };

  Audica.prototype.setFirstPlaylistElement = function(li) {
    var firstPlayListElement = this.firstPlayListElement();
    if (firstPlayListElement.length > 0) {
      li.insertBefore(firstPlayListElement);
    } else {
      li.appendTo(this.Dom.playlistBox);
    }
  };

  Audica.prototype.setSongAsFirstPlaylistElement = function(song) {
    var li = $('<li data-song="' + escape(JSON.stringify(song)) + '"><span>' + song.artist + '</span>g / <span>' + song.album + '</span> / <span>' + song.track + '.</span> <span>' + song.title + '</span></li>');
    this.setFirstPlaylistElement(li);
  };

  Audica.prototype.clearPlaylist = function() {
    if (this.Dom.playlistBox) {
      this.Dom.playlistBox.empty();
    }
  };

  Audica.prototype.playSong = function(song) {
    this.song = song;
    this.trigger('onStartPlayingSong', {
      song: song
    });

    this.plugins.player.type = song.contentType;
    var plugin = this.plugins[song.backendId];

    if (plugin) {
      // todo handle again asynchronous src retreive
      var src = plugin.getPlaySrc(song.src, this.plugins.player);
      plugin.setCoverArt(song.coverArt, this.Dom.coverArt);
      // TODO move this to a plugin
      this.plugins.player.play(src);
    } else {
      this.trigger('ERROR', {
        message: 'Cannot handle songs from backend ' + song.backendId + '.'
      });
    }

    this.updateMainView(song.artist, song.album, song.title);
    this.trigger('playSong', {
      song: song
    });
  };

  Audica.prototype.nextSong = function() {
    var song = this.getFirstPlaylistElement();
    if (null !== song) {
      this.playSong(song);
      this.removeFirstPlaylistElement();
      this.historyAdd(song);
      this.trigger('nextSong');
    } else {
      this.trigger('ERROR', {
        message: 'No song found. Possible reason: Empty Playlist'
      });
    }
  };

  Audica.prototype.previousSong = function() {
    if (this.songHistory.length > 0) {
      var history = this.songHistory.pop();
      var song = this.songDb.query({
        id: history.songId,
        backendId: history.backendId
      }).get()[0];

      if (null !== song && undefined !== song) {
        this.playSong(song);
        this.setSongAsFirstPlaylistElement(song);
        this.trigger('previousSong');
      } else {
        this.trigger('ERROR', {
          message: 'No song found. Possible reason: Empty Playlist'
        });
      }
    } else {
      this.trigger('ERROR', {
        message: 'No song found. Possible reason: Empty History'
      });
    }
  };

  Audica.prototype.getFirstPlaylistElement = function() {
    var result = null;
    var elements = this.firstPlayListElement();
    if (elements.length > 0) {
      result = JSON.parse(unescape(elements.data('song')));
    }
    return result;
  };

  Audica.prototype.shuffle = function() {
    var max = this.Dom.playlistBox.find('li').length;
    var pickedSong = Math.floor((Math.random() * max) + 1);
    var elem = this.getNthPlayListElement(pickedSong);
    elem.detach();
    this.setFirstPlaylistElement(elem);
    this.trigger('tracklistChanged');
  };

  Audica.prototype.getLastSong = function() {
    return this.songHistory[this.songHistory.length - 1] || null;
  };

  Audica.prototype.removeFirstPlaylistElement = function() {
    this.firstPlayListElement().detach();
    this.trigger('firstPlayListElementRemoved');
  };

  Audica.prototype.updateMainView = function(artist, album, title) {
    this.Dom.title.text(title);
    this.Dom.album.text(album);
    this.Dom.artist.text(artist);
    this.trigger('updateMainView');
  };

  Audica.prototype.fillSongBox = function(songs) {
    var lis = '',
      i = 0,
      length = songs.length,
      song;
    for (i; i < length; i++) {
      song = songs[i];
      var li = '<li data-song="' + escape(JSON.stringify(song)) + '"><span class="artist" data-value="' + escape(song.artist) + '">' + this.encodeHtml(song.artist) + '</span> / <span class="album" data-value="' + escape(song.album) + '">' + this.encodeHtml(song.album) + '</span> / <span class="track" data-value="' + escape(song.track) + '">' + this.encodeHtml(song.track) + '.</span><span class="title" data-value="' + escape(song.title) + '">' + this.encodeHtml(song.title) + '</span></li>';
      lis = lis + li;
    }
    this.Dom.songBox.html(lis);
    this.bindSongBoxEvents();
  };

  Audica.prototype.bindSongBoxEvents = function() {
    var self = this;
    this.Dom.songBox.on('click', 'span', function() {
      var value = $(this).data('value');
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

  Audica.prototype.closePlayerControlView = function() {
    this.Dom.playerControlView.data('open', false);
    this.closePlayerControlViewTimerId = null;
    this.Dom.playerControlView.animate({
      height: '4px'
    });
  };

  function applyCoverArtStyleToOneView() {
    // Use original window elem to set height because reflect needs this
    window.Audica.Dom.coverArt[0].height = window.innerHeight / 2;
    window.Audica.Dom.coverArt[0].width = window.innerWidth / 2;
    window.Audica.Dom.coverArt.reflect({
      height: 0.165,
      opacity: 0.25
    });
    window.Audica.Dom.coverArtBox.css('padding-top', (window.innerHeight - window.Audica.Dom.coverArtBox.height()) / 2);
    window.Audica.Dom.descriptionBox.css('padding-top', (window.innerHeight - window.Audica.Dom.descriptionBox.height()) / 2);
  }

  Audica.prototype.applyCoverArtStyle = function() {
    this.Dom.playerView.height(window.innerHeight);
    this.Dom.playerView.width(window.innerWidth);
    applyCoverArtStyleToOneView();
    this.Dom.searchView.height(window.innerHeight);
    this.Dom.searchView.width(window.innerWidth);
    this.Dom.preferencesView.height(window.innerHeight);
    this.Dom.preferencesView.width(window.innerWidth);
  };

  Audica.prototype.updateProgress = function() {
    if (!this.plugins.player.paused && this.plugins.player.getDuration() > 0) {
      this.Dom.progressBar.val(Math.round((this.plugins.player.getCurrentTime() * 100) / this.plugins.player.getDuration()));
    }
  };

  Audica.prototype.updateTimings = function() {
    if (this.Dom.playerControlView.data('open')) {
      if (!this.plugins.player.paused) {
        var duration = 0;
        if (this.plugins.player.getDuration() > 0) {
          duration = Math.round(this.plugins.player.getDuration());
        }
        this.Dom.timeField.text(Math.round(this.plugins.player.getCurrentTime()) + ' / ' + duration);
      }
    }
  };

  Audica.prototype.indicateSongBoxXPosition = function() {
    var currentXClass = this.positionXClassMap[this.getSongBoxPositionX()];
    var songBox = this.Dom.songBox;
    var selectedElems = songBox.find('.selected');
    songBox.find('[positionX]').removeAttr('positionX');
    selectedElems.find(currentXClass).attr('positionX', true);
  };

  Audica.prototype.collectSongs = function(songList, backendId, timestamp) {
    this.songDb.query.insert(songList);
    this.songDb.query({
      backendId: {
        is: backendId
      },
      addedOn: {
        '!is': timestamp
      }
    }).remove();

    this.trigger('collectSongs');
  };

  Audica.prototype.updateSongList = function() {
    window.Audica.trigger('updateSongList', {
      timestamp: $.now()
    });
    window.Audica.trigger('finished');
  };

  Audica.prototype.backgroundTasks = function() {
    this.updateProgress();
    this.updateTimings();
    this.scrobbleSong();
  };

  Audica.prototype.scrobbleNowPlaying = function() {
    if (this.plugins.scrobbler) {
      var history = this.getLastSong();
      if (null !== history) {
        var song = this.songDb.query({
          id: history.songId,
          backendId: history.backendId
        }).get()[0];
        if (song) {
          this.plugins.scrobbler.setNowPlaying(song.artist, song.title, song.album, song.duration, function(data) {
            if (undefined !== data.error) {
              switch (data.error) {
                case 6:
                case 13:
                  console.warn('Cannot set now playing there is a parameter missing/wrong!', data.message);
                  break;
                default:
                  console.error('Cannot set last.fm now playing track. ' + data.error + ' - ' + data.message);
              }
            }
          }, null);
        }
      }
    }
  };

  Audica.prototype.scrobbleSong = function() {
    if (this.plugins.scrobbler) {
      var notScrobbled = this.getNotScrobbled();
      if (!this.plugins.player.paused) {
        if (Math.round((this.plugins.player.getCurrentTime() * 100) / this.plugins.player.getDuration()) > 50 && notScrobbled) {
          var history = this.getLastSong();
          if (null !== history) {
            var song = this.songDb.query({
              id: history.songId,
              backendId: history.backendId
            }).get()[0];
            if (null !== song) {
              var timestamp = Math.round((new Date()).getTime() / 1000);
              this.plugins.scrobbler.scrobble(song.artist, song.title, song.album, song.duration, timestamp, function(data) {
                if (undefined !== data.error) {
                  switch (data.error) {
                    case 6:
                    case 13:
                      window.Audica.trigger('WARN', {
                        message: 'Cannot scrobble the song there is a parameter missing/wrong! - ' + data.message
                      });
                      window.Audica.setNotScrobbled(true);
                      break;
                    default:
                      window.Audica.trigger('ERROR', {
                        message: 'Cannot scrobble track to last.fm. ' + data.error + ' - ' + data.message
                      });
                  }
                } else {
                  window.Audica.setNotScrobbled(false);
                }
              }, null);
            }
          }
        }
      }
    }
  };

  Audica.prototype.historyAdd = function() {
    var historyElem = {
      timestamp: $.now(),
      backendId: this.song.backendId,
      songId: this.song.id
    };
    this.songHistory.push(historyElem);
    this.historyDb.query.insert(historyElem);
  };

  Audica.prototype.historyShowByTime = function(direction) {
    return this.historyDb.query().order('timestamp ' + direction).get();
  };

  Audica.prototype.registerEvents = function() {
    var self = this;
    window.bindKeyEvents(this);
    $(document).mousemove(function() {
      var playerControlView = self.Dom.playerControlView;
      if ('player' === self.getViewState()) {
        if (null !== self.closePlayerControlViewTimerId) {
          window.clearTimeout(self.closePlayerControlViewTimerId);
        }
        if (!playerControlView.data('open')) {
          playerControlView.data('open', true);
          playerControlView.animate({
            height: '50px'
          });
        }
        self.closePlayerControlViewTimerId = window.setTimeout(function() {
          self.closePlayerControlView();
        }, 3000);

      }
    });

    this.Dom.coverArt.on('error', function() {
      self.Dom.coverArt.attr('src', 'images/wholeNote.svg');
    });

    var handleRightZone = function(event) {
      if ('search' === self.getViewState()) {
        var searchView = self.Dom.searchView;
        var coverArtBox = self.Dom.coverArtBox;
        var descriptionBox = self.Dom.descriptionBox;
        if ('mouseenter' === event.type) {
          searchView.animate({
            left: -1 * Math.round($(document).width() * 0.05)
          });
        } else if ('mouseleave' === event.type) {
          searchView.animate({
            left: '0'
          });
        } else if ('click' === event.type) {
          searchView.animate({
            left: -1 * $(document).width()
          });
          if (self.plugins.player.paused) {
            self.nextSong();
            self.scrobbleNowPlaying();
            self.setNotScrobbled(true);
          }
          self.setViewState('player');
          coverArtBox.css('padding-top', ($(document).height() - coverArtBox.height()) / 2);
          descriptionBox.css('padding-top', ($(document).height() - descriptionBox.height()) / 2);
          self.Dom.searchViewPreview.show();
        }
      } else if ('player' === self.getViewState()) {
        if ('mouseenter' === event.type) {
          self.Dom.playerView.animate({
            left: -1 * Math.round($(document).width() * 0.05)
          });
        } else if ('mouseleave' === event.type) {
          self.Dom.playerView.animate({
            left: 0
          });
        } else if ('click' === event.type) {
          self.Dom.playerView.animate({
            left: -1 * $(document).width()
          });
          self.setViewState('preferences');
        }
      }
    };

    var selectPlayList = function() {
      if ('playList' !== self.getViewState()) {
        self.setViewState('playList');
      }
    };

    var selectSongBox = function() {
      if ('search' !== self.getViewState()) {
        self.setViewState('search');
      }
    };

    this.Dom.playerViewPreview.on({
      hover: handleRightZone,
      click: handleRightZone
    });

    this.Dom.playlistBox.on({
      click: selectPlayList
    });

    this.Dom.songBox.on({
      click: selectSongBox
    });

    var handleLeftZone = function(event) {
      var searchView = self.Dom.searchView;
      var songBox = self.Dom.songBox;
      var playlistBox = self.Dom.playlistBox;
      var boxWidth = ($(document).width() / 2) - 22 - 2;
      var boxHeight = $(document).height() - 22;
      if ('player' === self.getViewState()) {
        if ('mouseenter' === event.type) {
          searchView.animate({
            left: -1 * Math.round($(document).width() * 0.95)
          });
        } else if ('mouseleave' === event.type) {
          searchView.animate({
            left: -1 * $(document).width()
          });
        } else if ('click' === event.type) {
          self.Dom.searchViewPreview.hide();
          songBox.focus();
          songBox.width(boxWidth);
          songBox.height(boxHeight);
          playlistBox.width(boxWidth);
          playlistBox.height(boxHeight);
          searchView.height($(document).height());
          searchView.animate({
            left: 0
          });
          self.setViewState('search');
        }
      } else if ('preferences' === self.getViewState()) {
        if ('mouseenter' === event.type) {
          self.Dom.playerView.animate({
            left: -1 * Math.round($(document).width() * 0.95)
          });
        } else if ('mouseleave' === event.type) {
          self.Dom.playerView.animate({
            left: -1 * $(document).width()
          });
        } else if ('click' === event.type) {
          self.Dom.playerView.animate({
            left: 0
          });
          self.setViewState('player');
        }
      }
    };

    this.Dom.searchViewPreview.on({
      hover: handleLeftZone,
      click: handleLeftZone
    });

    this.on('INFO', function(args) {
      console.log(args.message);
    });

    this.on('ERROR', function(args) {
      console.error(args.message);
    });

    this.on('WARN', function(args) {
      console.warn(args.message);
    });

    this.on('fillSongBox', function() {
      var currentSongList = this.songDb.query().order('artist logical, album logical, year logical, track logical, title logical').limit(15).get();
      this.fillSongBox(currentSongList);
    });

    this.on('domElementsSet', this.applyCoverArtStyle);
    this.on('nextSong', this.applyCoverArtStyle);
    this.on('previousSong', this.applyCoverArtStyle);
    this.on('readyCollectingSongs', function(args) {
      self.collectSongs(args.songList, args.backendId, args.timestamp);
    });
    this.on('initReady', function() {});
    this.on('fileSystemInitReady', function() {
      this.songDb.init('song');
      this.historyDb.init('history');
    });

    Audica.prototype.cleanup = function() {
      var plugin = null;
      for (plugin in self.plugins) {
        if (self.plugins.hasOwnProperty(plugin)) {
          if (self.plugins[plugin].db instanceof Function) {
            self.plugins[plugin].db.save.call();
          }
        }
      }
    };

    $(window).on('resize', function() {
      if (null !== self.resizeEventTimeoutId) {
        window.clearTimeout(self.resizeEventTimeoutId);
      }
      self.resizeEventTimeoutId = window.setTimeout(function() {
        self.applyCoverArtStyle();
      }, 250);
    });

    this.trigger('registerEvents');
  };

  var encodeDecodeElement = $('<div />');
  Audica.prototype.encodeHtml = function(string) {
        if (typeof string === 'string') {
            return string.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        } else {
          return string;
        }
  };

  Audica.prototype.decodeHtml = function(string) {
    if (string !== undefined && string !== null) {
      return encodeDecodeElement.html(string).text();
    } else {
      return string;
    }
  };

  Audica.prototype.on = function(eventName, fn) {
    if (!this.eventList[eventName]) {
      this.eventList[eventName] = [];
    }
    this.eventList[eventName].push({
      context: this,
      callback: fn
    });
    return this;
  };

  Audica.prototype.trigger = function(eventName) {
    if (!this.eventList[eventName]) {
      return false;
    }
    var args = Array.prototype.slice.call(arguments, 1),
      events = this.eventList[eventName],
      i = 0,
      length = events.length,
      subscription;
    for (i; i < length; i++) {
      subscription = events[i];
      subscription.callback.apply(subscription.context, args);
    }
    return this;
  };

  Audica.prototype.extend = function(name, fn) {
    this.plugins[name] = fn;
  };

  Audica.prototype.initPlugins = function() {
    var name = null;
    for (name in this.plugins) {
      if (this.plugins.hasOwnProperty(name)) {
        if (this.plugins[name].init instanceof Function) {
          this.plugins[name].init.call(this);
        }
      }
    }
  };

  Audica.prototype.start = function() {
    var self = this;
    this.initDom();
    this.registerEvents();
    this.initPlugins();
    window.setInterval(function() {
      self.backgroundTasks();
    }, 1000);
  };

  window.Audica = new Audica();

}(window, document, Mousetrap));
