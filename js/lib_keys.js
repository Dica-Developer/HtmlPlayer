/*global $:true, Audica:true, document:true,  Mousetrap:true */
(function(window, Mousetrap, Audica){
  "use strict";
  window.bindKeyEvents = function (Audica) {
    var bindKeysToView = {};
    var dom = Audica.Dom;
    var audio = dom.player[0];
    var songBox = dom.songBox;
    var playListBox = dom.playlistBox;
    var searchView = dom.searchView;
    var boxWidth = ($(document).width() / 2) - 22 - 2;
    var boxHeight = $(document).height() - 22;
    var playerView = dom.playerView;
    var playerControlView = dom.playerControlView;
    var coverArtBox = dom.coverArtBox;
    var filterBox = dom.filterBox;
    var descriptionBox = dom.descriptionBox;
    var filterBoxTimeout = null;

    Audica.on('viewStateChanged', function (args) {
      Mousetrap.reset();
      bindKeysToView[args.to].call(this);
      if (args.to === 'search' && dom.songBox.find('li').length === 0) {
        var currentSongList = Audica.songDb.query().order('artist asec, album asec, year asec, track asec, title asec').get();
        Audica.fillSongBox(currentSongList);
      }
    });

    bindKeysToView.player = function () {
      Mousetrap.bind(['right'], function () {
        audio.currentTime = audio.currentTime + 10;
      });

      Mousetrap.bind(['left'], function () {
        audio.currentTime = audio.currentTime - 10;
      });

      Mousetrap.bind(['shift+up'], function () {
        var currentVolume = Audica.getVolume();
        var volume = currentVolume + 0.02;
        if (volume > 1) {
          return false;
        }
        Audica.setVolume(volume);
      });

      Mousetrap.bind(['shift+down'], function () {
        var currentVolume = Audica.getVolume();
        var volume = currentVolume - 0.02;
        if (volume < 0) {
          return false;
        }
        Audica.setVolume(volume);
      });

      Mousetrap.bind(['s'], function () {
        Audica.shuffle();
      });

      Mousetrap.bind(['l'], function () {
        songBox.focus();
        songBox.width(boxWidth);
        songBox.height(boxHeight);
        playListBox.width(boxWidth);
        playListBox.height(boxHeight);
        searchView.height($(document).height());
        searchView.animate({
          left: 0
        });
        Audica.setViewState('search');
        dom.searchViewPreview.hide();
      });

      Mousetrap.bind(['n'], function () {
        Audica.nextSong();
        Audica.scrobbleNowPlaying();
        Audica.setNotScrobbled(true);
      });

      Mousetrap.bind(['p'], function () {
        Audica.trigger('scroll', {
          dir: 'up'
        });
        Audica.previousSong();
        Audica.scrobbleNowPlaying();
        Audica.setNotScrobbled(true);
      });

      Mousetrap.bind(['space'], function () {
        return audio.paused ? audio.play() : audio.pause();
      });

    };

    bindKeysToView.search = function () {
      function findNextByPositionX(dir) {
        var currentXClass = Audica.positionXClassMap[Audica.getSongBoxPositionX()];
        var currentXValue = Audica.getSongBoxPositionY().find(currentXClass).data('value');
        var tmpNext = Audica.getSongBoxPositionY();
        //TODO maybe replace with for loop (secure)
        while (tmpNext.find(currentXClass).data('value') === currentXValue) {
          tmpNext = tmpNext[dir]();
        }
        return tmpNext;
      }

      Mousetrap.bind(['right'], function () {
        var x = Audica.getSongBoxPositionX();
        if (3 === x) {
          Audica.setSongBoxPositionX(0);
        } else {
          Audica.setSongBoxPositionX(++x);
        }
        Audica.getSongBoxPositionY().find('span').eq(x).trigger('click');
        Audica.indicateSongBoxXPosition();
      });

      Mousetrap.bind(['left'], function () {
        var x = Audica.getSongBoxPositionX();
        if (0 === x) {
          Audica.setSongBoxPositionX(3);
        } else {
          Audica.setSongBoxPositionX(--x);
        }
        Audica.getSongBoxPositionY().find('span').eq(x).trigger('click');
        Audica.indicateSongBoxXPosition();
      });

      Mousetrap.bind(['up'], function () {
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

      Mousetrap.bind(['down'], function () {
        if (filterBox.data.open) {
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

      Mousetrap.bind(['escape'], function () {
        if (filterBox.data("open")) {
          filterBox.data("open", false);
          filterBox.blur();
          songBox.focus();
          filterBox.hide();
          filterBox.val("");
        } else {
          searchView.animate({
            left: -1 * $(document).width()
          });
          if (audio.paused) {
            Audica.nextSong();
            Audica.scrobbleNowPlaying();
            Audica.setNotScrobbled(true);
          }
          Audica.setViewState('player');
          coverArtBox.css("padding-top", ($(document).height() - coverArtBox.height()) / 2);
          descriptionBox.css("padding-top", ($(document).height() - descriptionBox.height()) / 2);
          dom.searchViewPreview.show();
        }
      });

      Mousetrap.bind(['enter'], function () {
        var elemsToMove = dom.songBox.find(".selected");
        var clones = elemsToMove.clone();
        clones.animate({
          opacity: 0
        }, function () {
          elemsToMove.removeClass('selected');
          clones.removeClass('selected');
          clones.css({
            opacity: 1
          });
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
        Audica.trigger('tracklistChanged');
      });

      Mousetrap.bind(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'ä', 'ö', 'ü', 'backspace'], function () {
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
            var dbQuery = [{
              artist: {
                likenocase: filterQuery
              }
            }, {
              album: {
                likenocase: filterQuery
              }
            }, {
              genre: {
                likenocase: filterQuery
              }
            }, {
              title: {
                likenocase: filterQuery
              }
            }];
            currentSongList = Audica.songDb.query(dbQuery).order('artist asec, album asec, year asec, track asec, title asec').get();
          } else {
            currentSongList = Audica.songDb.query().order('artist asec, album asec, year asec, track asec, title asec').get();
          }
          Audica.fillSongBox(currentSongList);
        }, 500);
      });

      Mousetrap.bind('tab', function () {
        Audica.setViewState('playList');
        return false;
      });
    };

    bindKeysToView.playList = function () {
      Mousetrap.bind(['del'], function () {
        var elems = dom.playlistBox.find(".selected");
        elems.each(function () {
          var song = dom.songBox.find('[data-song="' + $(this).data('song') + '"]');
          song.removeClass('added');
        });
        elems.remove();
        Audica.trigger('tracklistChanged');
      });

      Mousetrap.bind('tab', function () {
        Audica.setViewState('search');
        return false;
      });

      Mousetrap.bind('down', function () {});
      Mousetrap.bind('up', function () {});
    };

    bindKeysToView[Audica.getViewState()].call(Audica);
  };
})(window, Mousetrap, Audica);