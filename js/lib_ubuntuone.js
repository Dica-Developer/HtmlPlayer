/*global Audica:true, localStorage: true, XMLHttpRequest:true, console:true, window*/
(function (window, Audica) {
  "use strict";

  /**
   * @class
   */

  function Subsonic() {
    /**
     * @type {String}
     */
    var backendId = 'subsonic';

    /**
     * @type {String}
     * @private
     */
    var _login = null;

    /**
     * @type {String}
     * @private
     */
    var _password = null;

    var _serverUrl = null;

    /**
     * @param {Event} event
     * @param {Number} timestamp
     * @private
     */

    function _collect(event, timestamp) {
      var req = event.target;
      var ssr = req.responseXML.getElementsByTagName("subsonic-response");
      if (null !== ssr && undefined !== ssr && ssr.length > 0 && "ok" === ssr[0].getAttribute("status")) {
        var songs = req.responseXML.getElementsByTagName("song");
        var songList = [],
          i = 0,
          length = songs.length,
          song;
        for (i; i < length; i++) {
          song = songs[i];
          var songObj = {
            "artist": song.getAttribute("artist"),
            "album": song.getAttribute("album"),
            "title": song.getAttribute("title"),
            "id": song.getAttribute("id"),
            "coverArt": song.getAttribute('coverArt') ? _serverUrl + '/getCoverArt.view?u=' + _login + '&p=' + _password + "&v=1.10.2&c=chrome&size=1024&id=" + song.getAttribute('coverArt') : null,
            "contentType": song.getAttribute("contentType"),
            "track": song.getAttribute("track") ? parseInt(song.getAttribute("track"), 0) : null,
            "cd": 0,
            "duration": song.getAttribute("duration"),
            "genre": song.getAttribute("genre"),
            "year": song.getAttribute("year") ? parseInt(song.getAttribute("year"), 0) : null,
            "addedOn": timestamp,
            "src": _serverUrl + '/stream.view?u=' + _login + '&p=' + _password + '&v=1.10.5&c=chrome&id=' + song.getAttribute("id"),
            "backendId": backendId
          };
          songList.push(songObj);
        }
        Audica.trigger('readyCollectingSongs', {
          songList: songList,
          backendId: backendId,
          timestamp: timestamp
        });
      } else {
        console.error("fetching songs failed with status '" + ssr.getAttribute("status") + "'");
      }
    }

    /**
     * @param {Number} timestamp
     * @param {Function} collectErrors
     * @param {Function} collectProgress
     * @private
     */

    function _searchForSongs(timestamp, collectErrors, collectProgress) { //TODO collectErrors, collectProgress
      if (_serverUrl && _login && _password) {
        var url = _serverUrl + "/search3.view?u=" + _login + "&p=" + _password + "&v=1.10.5&c=chrome&query=*";
        var req = new XMLHttpRequest();
        req.open("GET", url, true);
        req.onload = function (event) {
          _collect(event, timestamp);
        };
        req.onerror = collectErrors;
        req.onprogress = collectProgress;
        req.send(null);
      } else {
        // log error
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

    this.init = function () {
      var login = localStorage.authentication_login;
      var password = localStorage.authentication_password;
      var serverUrl = localStorage.serverUrl;
      if (login) {
        _login = JSON.parse(login);
      }
      if (password) {
        _password = JSON.parse(password);
      }
      if (serverUrl) {
        _serverUrl = JSON.parse(serverUrl);
      }
      Audica.trigger('initReady');
    };
  }

  Audica.extend('subsonic', new Subsonic());
}(window, Audica));
