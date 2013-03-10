/*global $:true, Audica:true, AUDICA:true, Mousetrap, TAFFY:true, console:true, unescape, escape, window, jQuery, Audica*/
(function (window, $, Audica) {
  "use strict";

  function NavigationWheel() {
    var scrollStep = 0,
      playlistLength = 0,
      trackInFront = -1;

    var scrollToCurrentTrack = function () {
      var scrollPosition = trackInFront * scrollStep;
      Audica.Dom.ring.find('.activeTrack').removeClass('activeTrack');
      Audica.Dom.ring.find('div').eq(trackInFront).addClass('activeTrack');
      Audica.Dom.ring.css('-webkit-transform', 'rotateX(' + scrollPosition + 'deg)');
    };

    var updateView = function (list) {
      var radius = $(window).height() / 2;
      var circumference = Math.PI * $(window).height();
      Audica.Dom.ring.empty();
      playlistLength = list.length;
      var trackHeight = (circumference / playlistLength) - 26;
      scrollStep = 360 / playlistLength;
      var i = 0;
      for (i = 0; i < playlistLength; i++) {
        var track = list[i];
        var clazz = '';
        if (i === 0) {
          clazz = 'activeTrack';
        }
        var trackDiv = $('<div class="' + clazz + '">' +
          '<p>' + track.title + '</p>' +
          '<p><span class="small">by:</span> ' + track.artist + '</p>' +
          '<p><span class="small">from:</span> ' + track.album + '</p>' +
          '</div>');
        trackDiv.css({
          '-webkit-transform': 'rotateX(' + -(scrollStep * i) + 'deg) translateZ(' + radius + 'px)'
        });
        trackDiv.data('song', escape(JSON.stringify(track)));
        trackDiv.height(trackHeight);
        trackDiv.appendTo(Audica.Dom.ring);
      }
    };

    function scrollTracklist() {
      if (trackInFront < 0) {
        trackInFront = 0;
      } else if (trackInFront >= playlistLength) {
        trackInFront = (playlistLength - 1);
      } else {
        scrollToCurrentTrack();
      }
    }

    function scrollUp() {
      trackInFront--;
      scrollTracklist();
    }

    function scrollDown() {
      trackInFront++;
      scrollTracklist();
    }

    function getTracks() {
      // TODO include history too
      var list = [];
      var i = 0;
      var history = Audica.songHistory;
      for (i = 0; i < history.length; i++) {
        var song = Audica.songDb.query({
          id: history[i].songId,
          backendId: history[i].backendId
        }).get()[0];
        if (song) {
          list.push(song);
        }
      }
      var li = Audica.Dom.playlistBox.find('li');
      li.each(function () {
        list.push(JSON.parse(unescape($(this).data('song'))));
      });
      updateView(list);
    }

    var bindEvents = function () {
      Audica.on('tracklistChanged', getTracks);
      Audica.on('nextSong', scrollDown);
      Audica.on('previousSong', scrollUp);
    };

    function initUI() {
      var dom = Audica.Dom;
      dom.descriptionBox.remove();
      dom.descriptionBox = $('<div id="navigationWheel"></div>');
      dom.descriptionBox.height($(window).height());
      dom.descriptionBox.insertBefore(dom.player);
      var ring = $('<div id="ring"></div>');
      ring.appendTo(dom.descriptionBox);
      Audica.Dom.ring = ring;
      Audica.Dom.ring.css({
        '-webkit-transform': 'rotateX(0deg)',
        'top': (($(window).height() / 2) - 50)
      });
    }

    this.init = function () {
      initUI();
      bindEvents();
      Audica.trigger('initReady');
    };
  }

  window.Audica.extend('navigationWheel', new NavigationWheel());
}(window, jQuery, Audica));