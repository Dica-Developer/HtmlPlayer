/*global $:true, Audica:true, console:true*/
(function (window) {
  "use strict";
  /**
   * @class
   */
  window.Subsonic = function () {
    /**
     * @type {String}
     */
    var backendId = 'subsonic';
    /**
     * @type {String}
     * @private
     */
    var _login = JSON.parse(localStorage.authentication_login);
    /**
     * @type {String}
     * @private
     */
    var _password = JSON.parse(localStorage.authentication_password);
    /**
     * @type {String}
     * @private
     */
    var _serverUrl = JSON.parse(localStorage.serverUrl);

    /**
     *
     * @type {String}
     * @private
     */
    var _streamingUrl = 'https://streaming.one.ubuntu.com/rest';

    /**
     * @param {Number} timestamp
     * @param {Function} collectErrors
     * @param {Function} collectProgress
     * @private
     */
    function _searchForSongs(timestamp, collectErrors, collectProgress) { //TODO collectErrors, collectProgress
      var url = _serverUrl + "/search.view?u=" + _login + "&p=" + _password + "&v=1.2.0&c=chrome&count=100000&any=";
      var req = new XMLHttpRequest();
      req.open("GET", url, true);
      req.onload = function (event) {
        _collect(event, timestamp);
      };
      req.onerror = collectErrors;
      req.onprogress = collectProgress;
      req.send(null);
    }

    /**
     * @param {Event} event
     * @param {Number} timestamp
     * @private
     */
    function _collect(event, timestamp) {
      var req = event.target;
      var ssr = req.responseXML.getElementsByTagName("subsonic-response");
      if (null !== ssr && undefined !== ssr && ssr.length > 0 && "ok" === ssr[0].getAttribute("status")) {
        var songs = req.responseXML.getElementsByTagName("match"),
          songList = [],
          song, i = 0,
          length = songs.length;
        for (i; i < length; i++) {
          song = songs[i];
          var songObj = {
            "artist":song.getAttribute("artist"),
            "album":song.getAttribute("album"),
            "title":song.getAttribute("title"),
            "id":song.getAttribute("id"),
            "coverArt":_serverUrl + '/getCoverArt.view?u=' + _login + '&p=' + _password + "&v=1.2.0&c=chrome&id=" + song.getAttribute('coverArt'),
            "contentType":song.getAttribute("contentType"),
            "track":song.getAttribute("track") ? parseInt(song.getAttribute("track"), 0) : null,
            "cd":0,
            "duration":song.getAttribute("duration"),
            "genre":song.getAttribute("genre"),
            "year":song.getAttribute("year") ? parseInt(song.getAttribute("year"), 0) : null,
            "addedOn":timestamp,
            "src":_streamingUrl + '/stream.view?u=' + _login + '&p=' + _password + '&v=1.2.0&c=chrome&id=' + song.getAttribute("id"),
            "backendId":backendId
          };
          songList.push(songObj);
        }
        Audica.trigger('readyCollectingSongs', {songList:songList, backendId:backendId, timestamp:timestamp});
      } else {
        console.error("fetching songs failed with status '" + ssr.getAttribute("status") + "'");
      }
    }

    this.setPlaySrc = function (src, player) {
      player.src = src;
    };

    this.setCoverArt = function (src, coverArt) {
      coverArt.attr("src", src);
    };

    Audica.on('updateSongList', function (args) {
      _searchForSongs(args.timestamp, null, null);
    });
  };
})(window);