var Scrobbler = function(sessionKey, login) {
  this._serviceUrl = "http://ws.audioscrobbler.com/2.0/";
  this._apiKey = "ac2f676e5b95231ac4706b3dcb5d379d";
  this._secret = "29d73236629ddab3d9688d5378756134";
  this.sessionKey = sessionKey;
  this.login = login;
  this.getTokenUrl = function() {
    return "http://www.last.fm/api/auth/?api_key=" + this._apiKey + "&cb=" + chrome.extension.getURL("options/authenticate_lastfm.html");
  };
  this.getSession = function(token, successCB, errorCB) {
    var signature = hex_md5("api_key" + this._apiKey + "methodauth.getSessiontoken" + token + this._secret);
    $.ajax(this._serviceUrl + "?format=json&method=auth.getSession&api_key="+this._apiKey+"&api_sig="+signature+"&token="+token, {type: "GET", success: successCB, error: errorCB});
  };
  this.setNowPlaying = function(artist, track, album, duration, successCB, errorCB) {
    if (this.isAuthenticated()) {
      var signature = hex_md5("album" + album + "api_key" + this._apiKey + "artist" + artist + "duration" + duration + "methodtrack.updateNowPlayingsk" + this.sessionKey + "track" + track + this._secret);
      $.ajax(this._serviceUrl + "?format=json&method=track.updateNowPlaying&api_key=" + this._apiKey + "&api_sig=" + signature + "&sk=" + this.sessionKey + "&artist=" + encodeURIComponent(artist) + "&track=" + encodeURIComponent(track) + "&album=" + encodeURIComponent(album) + "&duration=" + duration, {type: "POST", success: successCB, error: errorCB});
    }
  };
  this.scrobble = function(artist, track, album, duration, playStartTime, successCB, errorCB) {
    if (this.isAuthenticated()) {
      var signature = hex_md5("album" + album + "api_key" + this._apiKey + "artist" + artist + "duration" + duration + "methodtrack.scrobblesk" + this.sessionKey + "timestamp" + playStartTime + "track" + track + this._secret);
        $.ajax(this._serviceUrl + "?format=json&method=track.scrobble&api_key=" + this._apiKey + "&api_sig=" + signature + "&sk=" + this.sessionKey + "&artist=" + encodeURIComponent(artist) + "&track=" + encodeURIComponent(track) + "&album=" + encodeURIComponent(album) + "&duration=" + duration + "&timestamp=" + playStartTime, {type: "POST", success: successCB, error: errorCB});
    }
  };
  this.isAuthenticated = function() {
    return null !== this.sessionKey && null !== this.login && undefined !== this.sessionKey && undefined !== this.login;
  };
};