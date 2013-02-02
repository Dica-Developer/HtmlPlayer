function GoogleDrive() {

  "use strict";

  /*global OAuth2, console, Audica, ID3, XMLHttpRequest, window*/

  var backendId = 'googleDrive';

  var googleAuth = new OAuth2('google', {
    client_id: '1063427035831-k99scrsm000891i5e5ao3fs2jh6pj0hr.apps.googleusercontent.com',
    client_secret: 'iMc4u5GP41LRkQsxIfewE_jv',
    api_scope: ' https://www.googleapis.com/auth/drive'
  });

  function getSongData(item, resultHandler) {
    googleAuth.authorize(function () {
      var handler = function (evt) {
          //console.log('End receive part of file');
          resultHandler(this, evt, item);
        };

      //console.log('Start receive part of file');
      var client = new XMLHttpRequest();
      client.onprogress = handler;
      client.open("GET", item.downloadUrl);
      client.setRequestHeader('Authorization', 'OAuth ' + googleAuth.getAccessToken());
      client.send(null);
    });
  }

  function buildList(response, timestamp) {
    console.log('Start building list');
    var songList = [];
    var fileList = JSON.parse(response);
    var items = fileList.items;
    var idx, item;
    for (idx = 0; idx < items.length; idx++) {
      item = items[idx];
      if (item.mimeType === 'audio/mpeg') {
        var song = {
          "artist": 'Unknown',
          "album": 'Unkown',
          "title": item.title,
          "id": item.id,
          "coverArt": '',
          "contentType": item.mimeType,
          "track": 0,
          "cd": 0,
          "duration": 0,
          "genre": '',
          "year": 1900,
          "addedOn": timestamp,
          "src": item.downloadUrl,
          "backendId": backendId
        };
        songList.push(song);
      }
    }
    Audica.trigger('readyCollectingSongs', {
      songList: songList,
      backendId: backendId,
      timestamp: timestamp
    });
    // TODO this can fail because it isn't guaranteed that the songs are in the db after we triggered the previous event.
    // we should: 1. some how synchronize, 2. trottle the requests to avoid killing the device
    for (idx = 0; idx < items.length; idx++) {
      item = items[idx];
      if (item.mimeType === 'audio/mpeg') {
        // TODO define this function outside of the loop
        getSongData(item, function (req, evt, item) {
          if (evt.loaded >= 10000) {
            var str = req.response;
            var reader = ID3.getTagReader(str);
            // TODO define the tags that should be read title, album, artist, year, cd number, track number, duration, year and genre
            var tags = ID3.getTags(reader, str, null);
            req.abort();
            Audica.songDb.query({
              id: item.id,
              backendId: backendId
            }).update({
              artist: tags.artist,
              title: tags.title,
              album: tags.album
            });
          }
        });
      }
    }
  }

  function _receiveList(timestamp) {
    googleAuth.authorize(function () {
      var handler = function () {
          if (this.readyState === this.DONE) {
            console.log('Finished receive google drive information');
            buildList(this.response, timestamp);
          }
        };

      console.log('Start receive google drive information');
      var client = new XMLHttpRequest();
      client.onreadystatechange = handler;
      client.open("GET", 'https://www.googleapis.com/drive/v2/files');
      client.setRequestHeader('Authorization', 'OAuth ' + googleAuth.getAccessToken());
      client.send(null);
    });
  }

  function download(downloadUrl, resultHandler) {
    googleAuth.authorize(function () {
      var handler = function () {
          var file = this.response;
          //console.log('End receive file');
          resultHandler(file);
        };

      console.log('Start receive file');
      var client = new XMLHttpRequest();
      client.onload = handler;
      client.responseType = 'blob';
      client.open("GET", downloadUrl);
      client.setRequestHeader('Authorization', 'OAuth ' + googleAuth.getAccessToken());
      client.send(null);
    });
  }

  this.setPlaySrc = function (src, player) {
    download(src, function (file) {
      var url = window.URL || window.webkitURL;
      player.src = url.createObjectURL(file);
    });
  };

  this.setCoverArt = function (src, coverArt) {};

  this.init = function () {
    // nothing todo
  };
  Audica.on('updateSongList', function (args) {
    _receiveList(args.timestamp);
  });
}