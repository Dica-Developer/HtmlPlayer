(function(window, Mousetrap){
  window.bindKeyEvents = function(Audica){
    var bindKeysToView = {};
    var dom = Audica.Dom;
    var audio = dom.player;
    var songBox = dom.songBox;
    var playListBox = dom.playListBox;
    var searchView = dom.searchView;
    var boxWidth = (dom.documentWidth / 2) - 22 - 2;
    var boxHeight = dom.documentHeight - 22;
    var playerView = dom.playerView;
    var playerControlView = dom.playerControlView;
    var coverArtBox = dom.coverArtBox;
    var filterBox = dom.filterBox;
    var descriptionBox = dom.descriptionBox;
    var view = Audica.View;
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
        view.setViewState('search');
      });

      Mousetrap.bind(['n'], function(){
        Audica.PlayerControl.next();
        Audica.Scrobbling.setNowPlaying();
        Audica.Scrobbling.setNotScrobbled(true);
      });

      Mousetrap.bind(['p'], function(){
        Audica.PlayerControl.previous();
        Audica.Scrobbling.setNowPlaying();
        Audica.Scrobbling.setNotScrobbled(true);
      });

      Mousetrap.bind(['space'], function(){
        audio.paused ? audio.play() : audio.pause();
      });

    };

    bindKeysToView.search = function(){
      Mousetrap.bind(['right'], function(){
        if (3 === view.songBoxPositionY) {
          view.songBoxPositionY = 0;
        } else {
          view.songBoxPositionY++;
        }
        view.songBoxPositionX.find('span').eq(view.songBoxPositionY).trigger('click');
      });

      Mousetrap.bind(['left'], function(){
        if (0 === view.songBoxPositionY) {
          view.songBoxPositionY = 3;
        } else {
          view.songBoxPositionY--;
        }
        view.songBoxPositionX.find('span').eq(view.songBoxPositionY).trigger('click');
      });

      Mousetrap.bind(['up'], function(){
        var prev = null;
        if (!view.songBoxPositionX) {
          view.songBoxPositionX = songBox.find('li').eq(0);
          prev = view.songBoxPositionX;
        } else {
          prev = view.songBoxPositionX.prev();
          view.songBoxPositionX.removeClass('active');
          if (prev.length === 0) {
            prev = Audica.Dom.songBox.find('li').last();
          }
        }
        var halfWindowSize = window.innerHeight / 2;
        var scrollPos = Math.abs(songBox.parent().scrollTop() + prev.position().top) - halfWindowSize;
        songBox.parent().scrollTop(scrollPos);
        prev.addClass('active');
        view.songBoxPositionX = prev;
        prev.find('span').eq(view.songBoxPositionY).trigger('click');
      });

      Mousetrap.bind(['down'], function(){
        if(filterBox.data['open']){
          filterBox.data("open", false);
          filterBox.blur();
          songBox.focus();
          filterBox.hide();
          filterBox.val("");
        }
        var next = null;
        if (!view.songBoxPositionX) {
          view.songBoxPositionX = songBox.find('li').eq(0);
          next = view.songBoxPositionX;
        } else {
          next = view.songBoxPositionX.next();
          view.songBoxPositionX.removeClass('active');
          if (next.length === 0) {
            next = songBox.find('li').eq(0);
          }
        }
        var halfWindowSize = window.innerHeight / 2;
        var scrollPos = Math.abs(next.position().top + songBox.parent().scrollTop()) - halfWindowSize;
        songBox.parent().scrollTop(scrollPos);
        next.addClass('active');
        view.songBoxPositionX = next;
        next.find('span').eq(view.songBoxPositionY).trigger('click');
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
            Audica.PlayerControl.next();
            Audica.Scrobbling.setNowPlaying();
            Audica.Scrobbling.setNotScrobbled(true);
          }
          Audica.View.setViewState('player');
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
        clones.appendTo(dom.playListBox);
        dom.playListBox.find('span').on('click', function () {
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
          clearTimeout(filterBoxTimeout);
        }
        filterBoxTimeout = setTimeout(function () {
          var currentSongList = [];
          var filterQuery = filterBox.val();
          if (null !== filterQuery && undefined !== filterQuery) {
            // TODO If album medium number is available sort by it first
            var dbQuery = [{
              artist: { likenocase: filterQuery }
            }, {
              album: { likenocase: filterQuery }
            }, {
              genre: { likenocase: filterQuery }
            }, {
              title: { likenocase: filterQuery }
            }];
            currentSongList = Audica.songDb.query(dbQuery).order('artist asec, album asec, year asec, track asec, title asec').get();
          } else {
            currentSongList = Audica.songDb.query().order('artist asec, album asec, year asec, track asec, title asec').get();
          }
          view.fillSongBox(currentSongList);
        }, 500);
      });
    };

    bindKeysToView.playList = function(){
      Mousetrap.bind(['del'], function(){
        var elems = dom.playListBox.find(".selected");
        elems.each(function () {
          var song = dom.songBox.find('[data-song="' + $(this).data('song') + '"]');
          song.removeClass('added');
        });
        elems.remove();
      });
    };

    bindKeysToView[view.getViewState()].call(Audica);
  };
})(window, Mousetrap);