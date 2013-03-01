/*global $:true, Audica:true, AUDICA:true, Mousetrap, TAFFY:true, console:true, unescape, escape*/
(function(window, $, Audica){
  "use strict";

  function NavigationWheel(){
    var scrollPosition = 0,
      scrollStep = 0,
      playlistLength = 0,
      trackInFront = 0,
      halfWindow = $(window).height() / 2,
      currentState = 'stopping',
      currentTrackID = null;


    var scrollToCurrentTrack = function () {
      Audica.Dom.ring.find('.activeTrack').removeClass('activeTrack');
      Audica.Dom.ring.find('div').eq(trackInFront).addClass('activeTrack');
      Audica.Dom.ring.css('-webkit-transform','rotateX(' + scrollPosition + 'deg)');
    };

    var updateView = function(list){
      Audica.Dom.ring.empty();
      var length = list.length;
      var angle = 360 / length;
      //110 = single track div height
      var radius = ((110 * length) / 2) / Math.PI;
      playlistLength = length;
      scrollStep = angle;
      for (var i = 0; i < length; i++) {
        var track = list[i];
        var clazz = '';
        if(i === 0){
          clazz = 'activeTrack';
        }
        var trackDiv = $('<div class="'+ clazz +'"><p>' + track.title+ '</p><p>by: '+ track.artist +'</p><p>from: '+ track.album +'</p></div>');
        trackDiv.css({'-webkit-transform':'rotateX(' + (angle * i) + 'deg) translateZ(' + radius + 'px)'});
        trackDiv.data('song', escape(JSON.stringify(track)));

        //80 plus 15 padding top/bottom = 110
        trackDiv.height(80);
        trackDiv.appendTo(Audica.Dom.ring);
      }
      scrollPosition = -(trackInFront * scrollStep);
      scrollToCurrentTrack();
    };

    var scrollTracklist = function(args){
      if(args.dir === 'up'){
        scrollPosition = scrollPosition - scrollStep;
        trackInFront++;
      } else{
        scrollPosition = scrollPosition + scrollStep;
        trackInFront--;
      }

      if(trackInFront < 0){
        trackInFront = playlistLength - 1;
      }else if(trackInFront >= playlistLength){
        trackInFront = 0;
      }
      scrollToCurrentTrack();
    };


    function getTracks(){
      var list = [];
      var li = Audica.Dom.songBox.find('li');
      li.each(function(){
        list.push(JSON.parse(unescape($(this).data('song'))));
      });
      updateView(list);
    }

    function playCurrentSong(){
      var song = Audica.Dom.descriptionBox.find('.activeTrack').data('song');
      var songObj = JSON.parse(unescape(song));
      Audica.playSong(songObj);
    }

    var bindEvents = function(){

//      Audica.on('scroll', scrollTracklist);
      Audica.on('tracklistChanged', getTracks);
      Audica.on('scroll', scrollTracklist);
      Audica.on('playCurrentSong', playCurrentSong);
    };

    function initUI(){
      var dom = Audica.Dom;
      dom.descriptionBox.remove();
      dom.descriptionBox = $('<div id="navigationWheel"></div>');
      dom.descriptionBox.height($(window).height());
      dom.descriptionBox.insertBefore(dom.player);
      var ring = $('<div id="ring"></div>');
      ring.appendTo(dom.descriptionBox);
      Audica.Dom.ring = ring;
      Audica.Dom.ring.css({'-webkit-transform':'rotateX(' + scrollPosition + 'deg)', 'top': (halfWindow - 50)});
    }

    this.init = function(){
      initUI();
      bindEvents();
      Audica.trigger('initReady');
    };
  }

  window.Audica.extend('navigationWheel', new NavigationWheel());
})(window, jQuery, Audica);