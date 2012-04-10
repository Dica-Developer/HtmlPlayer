function collectAlbums(event) {
  var req = event.target;
  var ssr = req.responseXML.getElementsByTagName("subsonic-response");
  if (null !== ssr && undefined !== ssr && ssr.length > 0 && "ok" === ssr[0].getAttribute("status")) {
    var container = document.getElementById("albumsBox");
    var albums = req.responseXML.getElementsByTagName("child");
    for (var i = 0; i < albums.length; i++) {
      var option = document.createElement("option");
      var optionText = document.createTextNode(albums[i].getAttribute("title") +" ("+ albums[i].getAttribute("id") +")");
      option.appendChild(optionText);
      container.appendChild(option);

      var image = document.getElementById('coverArt');
      image.src = "https://streaming.one.ubuntu.com/rest/getCoverArt.view?u=" + JSON.parse(localStorage["authentication.login"]) + "&p=" +JSON.parse(localStorage["authentication.password"])+ "&v=1.2.0&c=chrome&id=" +albums[i].getAttribute("coverArt");
    }
  } else {
    error = "fetching albums failed with status '" +ssr.getAttribute("status")+ "'";
  }
}

function collectArtists(event) {
	var req = event.target;
  var ssr = req.responseXML.getElementsByTagName("subsonic-response");
  if (null !== ssr && undefined !== ssr && ssr.length > 0 && "ok" === ssr[0].getAttribute("status")) {
    var container = document.getElementById("artistsBox");
    var artists = req.responseXML.getElementsByTagName("artist");
    for (var i = 0; i < artists.length; i++) {
      var option = document.createElement("option");
      var optionText = document.createTextNode(artists[i].getAttribute("name") +" ("+ artists[i].getAttribute("id") +")");
      option.appendChild(optionText);
      container.appendChild(option);
    }
  } else {
    error = "fetching artists failed with status '" +ssr.getAttribute("status")+ "'";
  }
}

function collectSongs(event) {
  var req = event.target;
  var ssr = req.responseXML.getElementsByTagName("subsonic-response");
  if (null !== ssr && undefined !== ssr && ssr.length > 0 && "ok" === ssr[0].getAttribute("status")) {
    var container = document.getElementById("songBox");
    var songs = req.responseXML.getElementsByTagName("match");
    for (var i = 0; i < songs.length; i++) {
      var song = {
        "artist": songs[i].getAttribute("artist"),
        "album": songs[i].getAttribute("album"),
        "title": songs[i].getAttribute("title"),
        "id": songs[i].getAttribute("id"),
        "coverArt": songs[i].getAttribute("coverArt"),
        "contentType": songs[i].getAttribute("contentType"),
        "track": songs[i].getAttribute("track"),
        "duration": songs[i].getAttribute("duration"),
        "genre": songs[i].getAttribute("genre"),
        "year": songs[i].getAttribute("year")
      };
      var option = document.createElement("option");
      option.value = JSON.stringify(song);
      var optionText = document.createTextNode(song.artist + " / " + song.album + " / " + song.title);
      option.appendChild(optionText);
      container.appendChild(option);
    }
  } else {
    error = "fetching artists failed with status '" +ssr.getAttribute("status")+ "'";
  }
}

