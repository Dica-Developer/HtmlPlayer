function getMusicFolders(error) {
  var result = new Array();
  error = null;
  var url = "https://streaming.one.ubuntu.com/rest/getMusicFolders.view?u=" + JSON.parse(localStorage["authentication.login"]) + "&p=" +JSON.parse(localStorage["authentication.password"])+ "&v=1.2.0&c=chrome";
  var req = new XMLHttpRequest();
  req.open("GET", url, false);
  req.send(null);
  if (200 === req.status) {
    var ssr = req.responseXML.getElementsByTagName("subsonic-response");
    if (null !== ssr && undefined !== ssr && ssr.length > 0 && "ok" === ssr[0].getAttribute("status")) {
      var musicFolders = req.responseXML.getElementsByTagName("musicFolder");
      for (var i = 0; i < musicFolders.length; i++) {
        result[i] = musicFolders[i];
      }
    } else {
      error = "/rest/getMusicFolders.view request failed with status '" +ssr.getAttribute("status")+ "'";
    }
  } else {
    error = "Request to ubuntu one failed with status '" +req.status+ "'.";
  }
  return result;
}

function getArtists(musicFolderId, collectArtists, collectErrors, collectProgress) {
  var url = "https://streaming.one.ubuntu.com/rest/getIndexes.view?u=" + JSON.parse(localStorage["authentication.login"]) + "&p=" +JSON.parse(localStorage["authentication.password"])+ "&v=1.2.0&c=chrome&musicfolderId=" +musicFolderId;
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
  var url = "https://streaming.one.ubuntu.com/rest/search.view?u=" +JSON.parse(localStorage["authentication.login"])+ "&p=" +JSON.parse(localStorage["authentication.password"])+ "&v=1.2.0&c=chrome&count=1000&any=" +query;
  var req = new XMLHttpRequest();
  req.open("GET", url, true);
  req.onload = collectSongs;
  req.onerror = collectErrors;
  req.onprogress = collectProgress;
  req.send(null);
}

function getMusicDirectory(id, collectChilds, collectErrors, collectProgress) {
  var url = "https://streaming.one.ubuntu.com/rest/getMusicDirectory.view?u=" +JSON.parse(localStorage["authentication.login"])+ "&p=" +JSON.parse(localStorage["authentication.password"])+ "&v=1.2.0&c=chrome&id=" +id;
  var req = new XMLHttpRequest();
  req.open("GET", url, true);
  req.onload = collectChilds;
  req.onerror = collectErrors;
  req.onprogress = collectProgress;
  req.send(null);
}


