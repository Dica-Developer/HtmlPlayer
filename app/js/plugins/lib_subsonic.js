/*global Audica:true, XMLHttpRequest:true, console:true, window, chrome*/
(function(window, Audica) {
  'use strict';

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

    /**
     * @param {Event} event
     * @param {Number} timestamp
     * @private
     */
    function _collect(response, timestamp) {
      var songList = [];
      var ssr = response['subsonic-response'];
      if ('ok' === ssr.status) {
        if (ssr.album.hasOwnProperty('song')) {
          var songs = ssr.album.song;
          var i = 0,
            length = songs.length;
          for (i; i < length; i++) {
            var song = songs[i];
            var songObj = {
              'artist': Audica.view.decodeHtml(song.artist),
              'album': Audica.view.decodeHtml(song.album),
              'title': Audica.view.decodeHtml(song.title),
              'id': song.id,
              'coverArt': song.coverArt ? _serverUrl + '/getCoverArt.view?u=' + _login + '&p=' + _password + '&v=1.10.2&c=audica&size=1024&id=' + song.coverArt : null,
              'contentType': song.contentType,
              'track': song.track ? song.track : null,
              'cd': 0,
              'created': song.created ? song.created : null,
              'duration': song.duration,
              'genre': Audica.view.decodeHtml(song.genre),
              'year': song.year ? song.year : null,
              'addedOn': timestamp,
              'src': _serverUrl + '/stream.view?u=' + _login + '&p=' + _password + '&v=1.10.2&c=audica&id=' + song.id,
              'backendId': backendId
            };
            songList.push(songObj);
          }
        }
      } else {
        console.error('fetching songs failed with status "' + ssr.status + '"');
      }
      return songList;
    }

    function getSongsByAlbum(timestamp, albumId) {
      var url = _serverUrl + '/getAlbum.view?u=' + _login + '&p=' + _password + '&v=1.10.2&c=audica&f=json&id=' + albumId;
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
    function _searchForSongs(timestamp, offset, maxResultsPerRequest, collectErrors, collectProgress) {
      if (_serverUrl && _login && _password) {
        var url = _serverUrl + '/getAlbumList2.view?u=' + _login + '&p=' + _password + '&v=1.10.2&c=audica&f=json&size=' + maxResultsPerRequest + '&type=alphabeticalByName&offset=' + offset;
        var req = new XMLHttpRequest();
        req.open('GET', url, true);
        req.onload = function(event) {
          var response = JSON.parse(event.currentTarget.response);
          if (response.hasOwnProperty('subsonic-response')) {
            var subSonicResponse = response['subsonic-response'];
            if (subSonicResponse.status === 'ok') {
              var albums = subSonicResponse.albumList2.album;
              for (var i = 0; i < albums.length; i++) {
                getSongsByAlbum(timestamp, albums[i].id);
              }
              if (albums.length === maxResultsPerRequest) {
                _searchForSongs(timestamp, (offset + maxResultsPerRequest), maxResultsPerRequest, collectErrors, collectProgress);
              }
            } else {
              console.error(subSonicResponse.message);
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
      _searchForSongs(args.timestamp, 0, _maxResultsPerRequest, null, null);
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
