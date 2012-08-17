Audica.Subsonic = {
  _backendId : 'subsonic',
  login : JSON.parse(localStorage["authentication.login"]),
  _password : JSON.parse(localStorage["authentication.password"]),
  searchForSongs : function (timestamp, collectErrors, collectProgress) {
    var ego = this;
    var url = JSON.parse(localStorage["serverUrl"]) + "/rest/search.view?u=" +JSON.parse(localStorage["authentication.login"])+ "&p=" +JSON.parse(localStorage["authentication.password"])+ "&v=1.2.0&c=chrome&count=100000&any=";
    var req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.onload = function(event) { ego.collect(event, timestamp)};
    req.onerror = collectErrors;
    req.onprogress = collectProgress;
    req.send(null);
  },
  collect : function(event, timestamp) {
    var req = event.target;
    var ssr = req.responseXML.getElementsByTagName("subsonic-response");
    if (null !== ssr && undefined !== ssr && ssr.length > 0 && "ok" === ssr[0].getAttribute("status")) {
      var songs = req.responseXML.getElementsByTagName("match");
      var songList = [];
      for (var i = 0; i < songs.length; i++) {
        var song = {
          "artist": songs[i].getAttribute("artist"),
          "album": songs[i].getAttribute("album"),
          "title": songs[i].getAttribute("title"),
          "id": songs[i].getAttribute("id"),
          "coverArt": songs[i].getAttribute("coverArt"),
          "contentType": songs[i].getAttribute("contentType"),
          "track": songs[i].getAttribute("track") ? parseInt(songs[i].getAttribute("track")) : null,
          "duration": songs[i].getAttribute("duration"),
          "genre": songs[i].getAttribute("genre"),
          "year": songs[i].getAttribute("year") ? parseInt(songs[i].getAttribute("year")) : null,
          "addedOn" : timestamp,
          "src" : "https://streaming.one.ubuntu.com/rest/stream.view?u=" +this.login+ "&p=" +this._password+ "&v=1.2.0&c=chrome&id=" + this.id,
          "backendId": this._backendId
        };
        songList.push(song);
      }
      Audica.collectSongs(songList, this.backendId, timestamp);
    } else {
      console.error("fetching songs failed with status '" +ssr.getAttribute("status")+ "'");
    }
  }
//  updateSongListEvent.subscribe(function(event, args){
//    searchForSongs(args.timestamp, null, null);
//  });
};

