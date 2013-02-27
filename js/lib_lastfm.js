/*global $, Audica, chrome, hex_md5, localStorage*/
(function (window, Audica) {
  "use strict";

var Scrobbler = function () {
    var _serviceUrl = "http://ws.audioscrobbler.com/2.0/";
    var _apiKey = "ac2f676e5b95231ac4706b3dcb5d379d";
    var _secret = "29d73236629ddab3d9688d5378756134";
    var _sessionKey;
    var _login;

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
      if (localStorage.audica_lastfm_sessionKey) {
        _sessionKey = localStorage.audica_lastfm_sessionKey;
        _login = localStorage.audica_lastfm_login;
      } else {
        Audica.trigger('ERROR', {message:'Last.fm Scrobbler is not configured so not initialised!'});
      }
      Audica.trigger('initReady');
    };
  };
  Audica.extend('scrobbler', new Scrobbler());
})(window, Audica);