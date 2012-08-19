/**
 * @class
 */
function SUBSONIC(){
  var that = this;
  /**
   * @type {String}
   */
  this.backendId = 'subsonic';
  /**
   * @type {String}
   * @private
   */
  var _login = JSON.parse(localStorage["authentication.login"]);
  /**
   * @type {String}
   * @private
   */
  var _password = JSON.parse(localStorage["authentication.password"]);
  /**
   * @type {String}
   * @private
   */
  var _serviceUrl = 'https://streaming.one.ubuntu.com/rest';

  /**
   * @param {Number} timestamp
   * @param {Function} collectErrors
   * @param {Function} collectProgress
   * @private
   */
  function _searchForSongs(timestamp, collectErrors, collectProgress) { //TODO collectErrors, collectProgress
    var url = JSON.parse(localStorage["serverUrl"]) + "/rest/search.view?u=" +JSON.parse(localStorage["authentication.login"])+ "&p=" +JSON.parse(localStorage["authentication.password"])+ "&v=1.2.0&c=chrome&count=100000&any=";
    var req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.onload = function(event) { _collect(event, timestamp)};
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
      var songs = req.responseXML.getElementsByTagName("match");
      var songList = [];
      for (var i = 0, song; song = songs[i]; i++) {
        var songObj = {
          "artist": song.getAttribute("artist"),
          "album": song.getAttribute("album"),
          "title": song.getAttribute("title"),
          "id": song.getAttribute("id"),
          "coverArt":_serviceUrl+'/getCoverArt.view?u=' + _login + '&p=' +_password+ "&v=1.2.0&c=chrome&id=" +song.getAttribute('coverArt'),
          "contentType": song.getAttribute("contentType"),
          "track": song.getAttribute("track") ? parseInt(song.getAttribute("track"), 0) : null,
          "duration": song.getAttribute("duration"),
          "genre": song.getAttribute("genre"),
          "year": song.getAttribute("year") ? parseInt(song.getAttribute("year"), 0) : null,
          "addedOn" : timestamp,
          "src" : _serviceUrl +'/stream.view?u=' +_login+ '&p=' +_password+ '&v=1.2.0&c=chrome&id=' + song.getAttribute("id"),
          "backendId": that.backendId
        };
        songList.push(songObj);
      }
      Audica.trigger('readyCollectingSongs', {songList:songList, backendId:that.backendId, timestamp:timestamp});
    } else {
      console.error("fetching songs failed with status '" +ssr.getAttribute("status")+ "'");
    }
  }

  /**
   *
   */
  Audica.on('updateSongList', function(args){
    _searchForSongs(args.timestamp, null, null);
  });
}

Audica.Subsonic = new SUBSONIC();
