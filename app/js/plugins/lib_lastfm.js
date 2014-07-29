/*global $, Audica, chrome, hex_md5, localStorage, window*/
(function (window, Audica) {
  "use strict";

    function PluginLastFMError(message) {
        this.message = (message || '');
    }
    PluginLastFMError.prototype = new Error();

  var Scrobbler = function () {
    var _serviceUrl = "http://ws.audioscrobbler.com/2.0/";
    var _apiKey = "ac2f676e5b95231ac4706b3dcb5d379d";
    var _secret = "29d73236629ddab3d9688d5378756134";
    var _sessionKey;
    var _login;

    this.notScrobbled = true;

    this.getTokenUrl = function () {
      return "http://www.last.fm/api/auth/?api_key=" + _apiKey + "&cb=" + chrome.extension.getURL("options/authenticate_lastfm.html");
    };
    this.getSession = function (token, successCB, errorCB) {
      var signature = hex_md5("api_key" + _apiKey + "methodauth.getSessiontoken" + token + _secret);
      $.ajax(_serviceUrl + "?format=json&method=auth.getSession&api_key=" + _apiKey + "&api_sig=" + signature + "&token=" + token, {
        type: "GET",
        success: successCB,
        error: errorCB
      });
    };
    this.setNowPlaying = function (artist, track, album, duration, successCB, errorCB) {
      if (this.isAuthenticated()) {
        var signature = hex_md5("album" + album + "api_key" + _apiKey + "artist" + artist + "duration" + duration + "methodtrack.updateNowPlayingsk" + _sessionKey + "track" + track + _secret);
        $.ajax(_serviceUrl + "?format=json&method=track.updateNowPlaying&api_key=" + _apiKey + "&api_sig=" + signature + "&sk=" + _sessionKey + "&artist=" + encodeURIComponent(artist) + "&track=" + encodeURIComponent(track) + "&album=" + encodeURIComponent(album) + "&duration=" + duration, {
          type: "POST",
          success: successCB,
          error: errorCB
        });
      }
    };
    this.scrobble = function (artist, track, album, duration, playStartTime, successCB, errorCB) {
      if (this.isAuthenticated()) {
        var signature = hex_md5("album" + album + "api_key" + _apiKey + "artist" + artist + "duration" + duration + "methodtrack.scrobblesk" + _sessionKey + "timestamp" + playStartTime + "track" + track + _secret);
        $.ajax(_serviceUrl + "?format=json&method=track.scrobble&api_key=" + _apiKey + "&api_sig=" + signature + "&sk=" + _sessionKey + "&artist=" + encodeURIComponent(artist) + "&track=" + encodeURIComponent(track) + "&album=" + encodeURIComponent(album) + "&duration=" + duration + "&timestamp=" + playStartTime, {
          type: "POST",
          success: successCB,
          error: errorCB
        });
      }
    };

    this.isAuthenticated = function () {
      return null !== _sessionKey && null !== _login && undefined !== _sessionKey && undefined !== _login;
    };

    this.init = function () {
      chrome.storage.local.get('audica_lastfm_sessionKey', function (items) {
        if(items) {
          _sessionKey = items.audica_lastfm_sessionKey;
          _login = items.audica_lastfm_login;
        } else {
          Audica.trigger('ERROR', new PluginLastFMError('Last.fm Scrobbler is not configured so not initialised!'));
        }
        Audica.trigger('initReady');
      });
    };
  };

    Scrobbler.prototype.scrobbleNowPlaying = function() {
        this.notScrobbled = true;
        var history = Audica.getLastSong();
        if (null !== history) {
            var song = Audica.songDb.query({
                id: history.songId,
                backendId: history.backendId
            }).get()[0];
            if (song) {
                this.setNowPlaying(song.artist, song.title, song.album, song.duration, function (data) {
                    if (undefined !== data.error) {
                        switch (data.error) {
                            case 6:
                            case 13:
                                console.warn('Cannot set now playing there is a parameter missing/wrong!', data.message);
                                break;
                            default:
                                Audica.trigger('Error', new PluginLastFMError('Cannot set last.fm now playing track. ' + data.error + ' - ' + data.message));
                        }
                    }
                }, null);
            }
        }
    };

    Scrobbler.prototype.scrobbleSong = function() {
            if (!Audica.plugins.player.paused) {
                if (Math.round((Audica.plugins.player.getCurrentTime() * 100) / Audica.plugins.player.getDuration()) > 50 && this.notScrobbled) {
                    var history = Audica.getLastSong();
                    if (null !== history) {
                        var song = Audica.songDb.query({
                            id: history.songId,
                            backendId: history.backendId
                        }).get()[0];
                        if (null !== song) {
                            var timestamp = Math.round((new Date()).getTime() / 1000);
                            this.scrobble(song.artist, song.title, song.album, song.duration, timestamp, function(data) {
                                if (undefined !== data.error) {
                                    switch (data.error) {
                                        case 6:
                                        case 13:
                                            Audica.trigger('WARN', {
                                                message: 'Cannot scrobble the song there is a parameter missing/wrong! - ' + data.message
                                            });
                                            this.notScrobbled = true;
                                            break;
                                        default:
                                            Audica.trigger('ERROR', new PluginLastFMError('Cannot scrobble track to last.fm. ' + data.error + ' - ' + data.message));
                                    }
                                } else {
                                    this.notScrobbled = false;
                                }
                            }, null);
                        }
                    }
                }
            }
    };

  Audica.extend('scrobbler', new Scrobbler());
}(window, Audica));
