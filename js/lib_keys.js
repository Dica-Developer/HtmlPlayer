(function(window, Mousetrap){
  window.bindKeyEvents = function(Audica){
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
    var viewState = function(){
      return view.getViewState();
    };

    //Arrow right
    Mousetrap.bind(['right'], function(){
      if('player' === viewState()){
        audio.currentTime = audio.currentTime + 10;
      }else if('search' === viewState()){
        if (3 === view.songBoxPositionY) {
          view.songBoxPositionY = 0;
        } else {
          view.songBoxPositionY++;
        }
        view.songBoxPositionX.find('span').eq(view.songBoxPositionY).trigger('click');
      }
    });

    //Arrow left
    Mousetrap.bind(['left'], function(){
      if('player' === viewState()){
        audio.currentTime = audio.currentTime - 10;
      }else if('search' === viewState()){
        if (0 === view.songBoxPositionY) {
          view.songBoxPositionY = 3;
        } else {
          view.songBoxPositionY--;
        }
        view.songBoxPositionX.find('span').eq(view.songBoxPositionY).trigger('click');
      }
    });

    //Arrow up
    Mousetrap.bind(['up'], function(){
      if('search' === viewState()){
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
        songBox.parent().scrollTop(Math.abs(songBox.parent().scrollTop() + prev.position().top));
        prev.addClass('active');
        view.songBoxPositionX = prev;
        prev.find('span').eq(view.songBoxPositionY).trigger('click');
      }
    });

    //Arrow down
    Mousetrap.bind(['down'], function(){
      if('search' === viewState()){
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
        songBox.parent().scrollTop(Math.abs(next.position().top + songBox.parent().scrollTop()));
        next.addClass('active');
        view.songBoxPositionX = next;
        next.find('span').eq(view.songBoxPositionY).trigger('click');
      }
    });


    //l
    Mousetrap.bind(['l'], function(){
      if('player' === viewState()){
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
      }
    });

    //n
    Mousetrap.bind(['n'], function(){
      if('player' === viewState()){
        Audica.PlayerControl.next();
        Audica.Scrobbling.setNowPlaying();
        Audica.Scrobbling.setNotScrobbled(true);
      }
    });

    //p
    Mousetrap.bind(['p'], function(){
      if('player' === viewState()){
        Audica.PlayerControl.previous();
        Audica.Scrobbling.setNowPlaying();
        Audica.Scrobbling.setNotScrobbled(true);
      }
    });

    //space
    Mousetrap.bind(['space'], function(){
      if('player' === viewState()){
        audio.paused ? audio.play() : audio.pause();
      }
    });

    //escape
    Mousetrap.bind(['escape'], function(){
      if('search' === viewState()){
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
      }
    });

    //enter
    Mousetrap.bind(['enter'], function(){
      if('search' === viewState()){
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
      }
    });

    //delete
    Mousetrap.bind(['del'], function(){
      if('playlist' === viewState()){
        var elems = dom.playListBox.find(".selected");
        elems.each(function () {
          var song = dom.songBox.find('[data-song="' + $(this).data('song') + '"]');
          song.removeClass('added');
        });
        elems.remove();
      }
    });

    Mousetrap.bind(['s'], function(){
      if('search' === viewState()){
        if (!filterBox.data("open")) {
          filterBox.data("open", true);
          // todo the first key should be filled in the filterBox
          // but with keyup we only get a normal key and not chars that are created with two keys like !
          // this works only with keypress
          // $('#filterBox').val(String.fromCharCode(event.which));
          filterBox.show();
        }
        filterBox.focus();
      }
    });

    filterBox.on('keyup', function(e){
      if(e.which === 27 || e.which === 37 || e.which === 38 || e.which === 39 || e.which === 40){
        return false;
      }
      console.log(e.which);
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
})(window, Mousetrap);