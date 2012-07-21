var googleAuth = new OAuth2('google', {
  client_id: '1063427035831-k99scrsm000891i5e5ao3fs2jh6pj0hr.apps.googleusercontent.com',
  client_secret: 'iMc4u5GP41LRkQsxIfewE_jv',
  api_scope: ' https://www.googleapis.com/auth/drive'
});

//googleAuth.authorize(function() {
//  // Ready for action, can now make requests with
//
//});

//Scrobbler.prototype.getTokenUrl = function() {
//  return "http://www.last.fm/api/auth/?api_key=" + this._apiKey + "&cb=" + chrome.extension.getURL("options/authenticate_lastfm.html");
//};
//
//Scrobbler.prototype.getSession = function(token, successCB, errorCB) {
//  var signature = hex_md5("api_key" + this._apiKey + "methodauth.getSessiontoken" + token + this._secret);
//  $.ajax(this._serviceUrl + "?format=json&method=auth.getSession&api_key="+this._apiKey+"&api_sig="+signature+"&token="+token, {type: "GET", success: successCB, error: errorCB});
//};
//
//Scrobbler.prototype.setNowPlaying = function(artist, track, album, duration, successCB, errorCB) {
//  if (this.isAuthenticated()) {
//    var signature = hex_md5("album" + album + "api_key" + this._apiKey + "artist" + artist + "duration" + duration + "methodtrack.updateNowPlayingsk" + this._sessionKey + "track" + track + this._secret);
//    $.ajax(this._serviceUrl + "?format=json&method=track.updateNowPlaying&api_key=" + this._apiKey + "&api_sig=" + signature + "&sk=" + this._sessionKey + "&artist=" + encodeURIComponent(artist) + "&track=" + encodeURIComponent(track) + "&album=" + encodeURIComponent(album) + "&duration=" + duration, {type: "POST", success: successCB, error: errorCB});
//  }
//};
//
//Scrobbler.prototype.scrobble = function(artist, track, album, duration, playStartTime, successCB, errorCB) {
//  if (this.isAuthenticated()) {
//    var signature = hex_md5("album" + album + "api_key" + this._apiKey + "artist" + artist + "duration" + duration + "methodtrack.scrobblesk" + this._sessionKey + "timestamp" + playStartTime + "track" + track + this._secret);
//      $.ajax(this._serviceUrl + "?format=json&method=track.scrobble&api_key=" + this._apiKey + "&api_sig=" + signature + "&sk=" + this._sessionKey + "&artist=" + encodeURIComponent(artist) + "&track=" + encodeURIComponent(track) + "&album=" + encodeURIComponent(album) + "&duration=" + duration + "&timestamp=" + playStartTime, {type: "POST", success: successCB, error: errorCB});
//  }
//};
//
//Scrobbler.prototype.isAuthenticated = function() {
//  return null !== this._sessionKey && null !== this._login && undefined !== this._sessionKey && undefined !== this._login;
//};

