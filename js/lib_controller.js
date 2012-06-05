function collectSongs(event) {
  var req = event.target;
  var ssr = req.responseXML.getElementsByTagName("subsonic-response");
  if (null !== ssr && undefined !== ssr && ssr.length > 0 && "ok" === ssr[0].getAttribute("status")) {
    var songs = req.responseXML.getElementsByTagName("match");
    for (var i = 0; i < songs.length; i++) {
      var option = $('<option>');
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
      option.data('song',song);
      option.text(song.artist + " / " + song.album + " / " + song.track + ". " + song.title);
      option.attr('song-id',song.id);
      option.appendTo("#songBox");
    }
  } else {
    error = "fetching artists failed with status '" +ssr.getAttribute("status")+ "'";
  }
}

function setDetails(args) {
  var currentSong = args.current;
  var nextSong = args.next;
  var prevSong = args.prev;
  $('#title').text(currentSong.title);
  $('#album').text(currentSong.album);
  $('#artist').text(currentSong.artist);
  $('#prevTitle').text(prevSong.title);
  $('#prevAlbum').text(prevSong.album);
  $('#prevArtist').text(prevSong.artist);
  $('#nextTitle').text(nextSong.title);
  $('#nextAlbum').text(nextSong.album);
  $('#nextAlbum').text(nextSong.artist);
}

function startPlay(song) {
//  var audio = document.getElementById('player');
//  audio.type = song.contentType;
//  audio.src = "https://streaming.one.ubuntu.com/rest/stream.view?u=" +JSON.parse(localStorage["authentication.login"])+ "&p=" +JSON.parse(localStorage["authentication.password"])+ "&v=1.2.0&c=chrome&id=" + song.id;

  $('#coverArt').attr("src", "https://streaming.one.ubuntu.com/rest/getCoverArt.view?u=" + JSON.parse(localStorage["authentication.login"]) + "&p=" +JSON.parse(localStorage["authentication.password"])+ "&v=1.2.0&c=chrome&id=" +song.coverArt);
  $('#title').text(song.title);
  $('#album').text(song.album);
  $('#artist').text(song.artist);
  localStorage["nowPlaying"] = song.id;
  setDetails({current: song, next: navigation.getNextSong(), prev: navigation.getPrevSong()});
}

function startSearch(event) {
  searchForSongs(event.target.value, collectSongs, null, null);
}

function handleFileSelect(evt) {
  var files = evt.target.files;
  for (var i = 0, f; f = files[i]; i++) {
    var reader = new FileReader();
    reader.onload = function(evt) {
      var audio = document.getElementById('player');
      audio.src = evt.target.result;
    };
    reader.readAsDataURL(f);
  }
}

function getFirstPlaylistElement() {
  var elements = $("#playlistBox :first");
  if (elements.length > 0) {
    return elements.data('song');
  } else {
    return null;
  }
}

function setFirstPlaylistElement(song) {
  var option = document.createElement("option");
  option.value = escape(JSON.stringify(song));
  var optionText = document.createTextNode(song.artist + " / " + song.album + " / " + song.track + ". " + song.title);
  option.appendChild(optionText);
  var container = document.getElementById("playlistBox");
  var elements = $("#playlistBox :first");
  if (elements.length > 0) {
    container.insertBefore(option, elements[0]);
  } else {
    container.appendChild(option)
  }
}

function removeFirstPlaylistElement() {
  $("#playlistBox :first").detach();
}

