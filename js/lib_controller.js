function collectSongs(songList, backendId, timestamp) {
  for (var i = 0; i < songList.length; i++) {
    var song = songList[i];
    songDb.query.insert(song);
  }
  songDb.query({backendId:{is:backendId}, addedOn:{lt:timestamp}}).remove();
  // TODO persisting the db should be done on closing the app
  songDb.save();
  // TODO fire event to fill songbox
  var currentSongList = songDb.query().order('artist asec, album asec, year asec, track asec, title asec').get();
  fillSongBox(currentSongList);
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

function fillSongBox(songs) {
  var options = "";
  for (var i = 0; i < songs.length; i++) {
    var song = songs[i];
    var option = "<option ";
    option = option + "value='" + escape(JSON.stringify(song)) + "'>";
    option = option + song.artist + " / " + song.album + " / " + song.track + ". " + song.title;
    option = option + "</option>";
    options = options + option;
  }
  $("#songBox").html(options);
}

