function descending(songA, songB) {
  var result = 0;
  if (songA.artist === null && songB.artist !== null) {
    result = 1
  } else if (songA.artist !== null && songB.artist === null) {
    result = -1;
  } else if (songA.artist !== null && songB.artist !== null) {
    if (songA.artist.toLowerCase() < songB.artist.toLowerCase()) {
      result = -1;
    } else if (songA.artist.toLowerCase() > songB.artist.toLowerCase()) {
      result = 1;
    }
  }

  if (0 === result) {
    if (songA.year !== null && songB.year !== null) {
      if (songA.year < songB.year) {
        result = -1;
      } else if (songA.year > songB.year) {
        result = 1;
      }
    } 

    if (0 === result) {
      if (songA.album === null && songB.album !== null) {
        result = 1
      } else if (songA.album !== null && songB.album === null) {
        result = -1;
      } else if (songA.album !== null && songB.album !== null) {
        if (songA.album.toLowerCase() < songB.album.toLowerCase()) {
          result = -1;
        } else if (songA.album.toLowerCase() > songB.album.toLowerCase()) {
          result = 1;
        }
      } 

      if (0 === result) {
        if (songA.track === null && songB.track !== null) {
          result = 1
        } else if (songA.track !== null && songB.track === null) {
          result = -1;
        } else if (songA.track !== null && songB.track !== null) {
          if (songA.track < songB.track) {
            result = -1;
          } else if (songA.track > songB.track) {
            result = 1;
          }
        } 
      }
    }
  }
  
  return result;
}

function collectSongs(event) {
  // TODO this should be moved out to a music backend specific code
  // collectSongs should get from all backends a list of songs
  var backend = "SUBSONIC";
  var timestamp = (new Date()).getTime();
  var req = event.target;
  var ssr = req.responseXML.getElementsByTagName("subsonic-response");
  if (null !== ssr && undefined !== ssr && ssr.length > 0 && "ok" === ssr[0].getAttribute("status")) {
    var songs = req.responseXML.getElementsByTagName("match");
    var songList = new Array();
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
        "backendId": backend
      };
      songList.push(song);
      songDb.query.insert(song);
    }
    songDb.query({backendId:{is:backend}, addedOn:{lt:timestamp}}).remove();
    // TODO persisting the db should be done on closing the app
    songDb.save();
    // TODO fire event to fill songbox
    songList.sort(descending);
    fillSongBox(songList, null);
  } else {
    error = "fetching songs failed with status '" +ssr.getAttribute("status")+ "'";
  }
}

function startPlay(song) {
  var audio = document.getElementById('player');
  audio.type = song.contentType;
  audio.src = "https://streaming.one.ubuntu.com/rest/stream.view?u=" +JSON.parse(localStorage["authentication.login"])+ "&p=" +JSON.parse(localStorage["authentication.password"])+ "&v=1.2.0&c=chrome&id=" + song.id;

  $('#coverArt').attr("src", "https://streaming.one.ubuntu.com/rest/getCoverArt.view?u=" + JSON.parse(localStorage["authentication.login"]) + "&p=" +JSON.parse(localStorage["authentication.password"])+ "&v=1.2.0&c=chrome&id=" +song.coverArt);
  $('#title').text(song.title);
  $('#album').text(song.album);
  $('#artist').text(song.artist);
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
  var elements = $("#playlistBox option :first");
  if (elements.length > 0) {
    return JSON.parse(unescape(elements[0].value));
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
  var elements = $("#playlistBox option :first");
  if (elements.length > 0) {
    container.insertBefore(option, elements[0]);
  } else {
    container.appendChild(option)
  }
}

function removeFirstPlaylistElement() {
  $("#playlistBox option :first").detach();
}

function fillSongBox(songs, query) {
  var options = "";
  for (var i = 0; i < songs.length; i++) {
    var song = songs[i];
    var patt = new RegExp(query, "i");
    if (null === query || (null != song.artist && -1 !== song.artist.search(patt)) || (null != song.title && -1 !== song.title.search(patt))
        || (null != song.album && -1 !== song.album.search(patt)) || (null != song.genre && -1 !== song.genre.search(patt))) {
      var option = "<option ";
      option = option + "value='" + escape(JSON.stringify(song)) + "'>";
      option = option + song.artist + " / " + song.album + " / " + song.track + ". " + song.title;
      option = option + "</option>";
      options = options + option;
    } 
  }
  $("#songBox").html(options);
}

