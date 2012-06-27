function getArtists(musicFolderId, collectArtists, collectErrors, collectProgress) {
  var url = JSON.parse(localStorage["serverUrl"]) + "/rest/getIndexes.view?u=" + JSON.parse(localStorage["authentication.login"]) + "&p=" +JSON.parse(localStorage["authentication.password"])+ "&v=1.2.0&c=chrome&musicfolderId=" +musicFolderId;
  var req = new XMLHttpRequest();
  req.open("GET", url, true);
  req.onload = collectArtists;
  req.onerror = collectErrors;
  req.onprogress = collectProgress;
  req.send(null);
}

function getAlbums(id, collectAlbums, collectErrors, collectProgress) {
  getMusicDirectory(id, collectAlbums, collectErrors, collectProgress )
}

function getSongs(id, collectSongs, collectErrors, collectProgress) {
  getMusicDirectory(id, collectSongs, collectErrors, collectProgress )
}

function searchForSongs(query, collectSongs, collectErrors, collectProgress) {
  var url = JSON.parse(localStorage["serverUrl"]) + "/rest/search.view?u=" +JSON.parse(localStorage["authentication.login"])+ "&p=" +JSON.parse(localStorage["authentication.password"])+ "&v=1.2.0&c=chrome&count=100000&any=" +query;
  var req = new XMLHttpRequest();
  req.open("GET", url, true);
  req.onload = collectSongs;
  req.onerror = collectErrors;
  req.onprogress = collectProgress;
  req.send(null);
}

function getMusicDirectory(id, collectChilds, collectErrors, collectProgress) {
  var url = JSON.parse(localStorage["serverUrl"]) + "/rest/getMusicDirectory.view?u=" +JSON.parse(localStorage["authentication.login"])+ "&p=" +JSON.parse(localStorage["authentication.password"])+ "&v=1.2.0&c=chrome&id=" +id;
  var req = new XMLHttpRequest();
  req.open("GET", url, true);
  req.onload = collectChilds;
  req.onerror = collectErrors;
  req.onprogress = collectProgress;
  req.send(null);
}

