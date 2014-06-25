/*global Audica:true, XMLHttpRequest:true, console:true, window, chrome*/
(function(window, Audica) {
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

    var _maxResultsPerRequest = 500;

    var _dayInMilliseconds = 24 * 60 * 60 * 1000;

    /**
     * @param {Event} event
     * @param {Number} timestamp
     * @private
     */

    function _collect(response, timestamp) {
      var songList = [];
      var ssr = response["subsonic-response"];
      if ("ok" === ssr.status) {
        if (ssr.songsByGenre.hasOwnProperty('song')) {
          var songs = ssr.songsByGenre.song;
          var i = 0,
            length = songs.length;
          for (i; i < length; i++) {
            var song = songs[i];
            var songObj = {
              "artist": Audica.decodeHtml(song.artist),
              "album": Audica.decodeHtml(song.album),
              "title": Audica.decodeHtml(song.title),
              "id": song.id,
              "coverArt": song.coverArt ? _serverUrl + '/getCoverArt.view?u=' + _login + '&p=' + _password + "&v=1.10.2&c=chrome&size=1024&id=" + song.coverArt : null,
              "contentType": song.contentType,
              "track": song.track ? song.track : null,
              "cd": 0,
              "duration": song.duration,
              "genre": Audica.decodeHtml(song.genre),
              "year": song.year ? song.year : null,
              "addedOn": timestamp,
              "src": _serverUrl + '/stream.view?u=' + _login + '&p=' + _password + '&v=1.10.2&c=chrome&id=' + song.id,
              "backendId": backendId
            };
            songList.push(songObj);
          }
        }
      } else {
        console.error("fetching songs failed with status '" + ssr.status + "'");
      }
      return songList;
    }

    function getSongsByGenre(timestamp, genre, offset, maxResultsPerRequest) {
      var url = _serverUrl + '/getSongsByGenre.view?u=' + _login + '&p=' + _password + '&v=1.10.2&c=chrome&f=json&count=' + maxResultsPerRequest + '&offset=' + offset + '&genre=' + encodeURIComponent(genre);
      var req = new XMLHttpRequest();
      req.open('GET', url, true);
      req.onload = function() {
        var response = JSON.parse(req.response);
        var collectedSongs = _collect(response, timestamp);
        if (collectedSongs.length > 0) {
          Audica.trigger('readyCollectingSongs', {
            songList: collectedSongs,
            backendId: backendId,
            timestamp: timestamp
          });
          if (collectedSongs.length === maxResultsPerRequest) {
            getSongsByGenre(timestamp, genre, (offset + maxResultsPerRequest), maxResultsPerRequest);
          }
        }
      };
      req.send();
    }

    /**
     * @param {Number} timestamp
     * @param {Function} collectErrors
     * @param {Function} collectProgress
     * @private
     */
    function _searchForSongs(timestamp, collectErrors, collectProgress) {
      if (_serverUrl && _login && _password) {
        var url = _serverUrl + '/getGenres.view?u=' + _login + '&p=' + _password + '&v=1.10.2&c=chrome&f=json';
        var req = new XMLHttpRequest();
        req.open('GET', url, true);
        req.onload = function(event) {
          var response = JSON.parse(event.currentTarget.response);
          if (response.hasOwnProperty('subsonic-response')) {
            var subSonicResponse = response['subsonic-response'];
            if (subSonicResponse.status === 'ok') {
              var genres = subSonicResponse.genres.genre;
              for (var i = 0; i < 1 /*genres.length*/ ; i++) {
                getSongsByGenre(timestamp, Audica.decodeHtml(genres[i].value), 0, _maxResultsPerRequest);
              }
            } else {
              // TODO error
            }
          } else {
            // todo error
          }
        };
        req.onerror = collectErrors;
        req.onprogress = collectProgress;
        req.send(null);
      } else {
        // log error
      }
    }

    this.getPlaySrc = function(src) {
      return src;
    };

    this.setCoverArt = function(src, coverArt) {
      coverArt.attr('src', src);
    };

    Audica.on('updateSongList', function(args) {
      var lastSongUpdate = Audica.songDb.query({
        backendId: {
          is: this.backendid
        }
      }).max('addedOn');
      if (null === lastSongUpdate || undefined === lastSongUpdate || (args.timestamp - lastSongUpdate > _dayInMilliseconds)) {
        _searchForSongs(args.timestamp, null, null);
      }
    });

    this.init = function() {
      chrome.storage.local.get(['authentication_login', 'authentication_password', 'serverUrl'], function(items) {
        var password = items.authentication_password;
        var serverUrl = items.serverUrl;
        var login = items.authentication_login;
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
      });
    };
  }

  Audica.extend('subsonic', new Subsonic());
}(window, Audica));
