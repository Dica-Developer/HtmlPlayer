function GoogleDrive() {
  var backendId = 'googleDrive';

  var googleAuth = new OAuth2('google', {
    client_id : '1063427035831-k99scrsm000891i5e5ao3fs2jh6pj0hr.apps.googleusercontent.com',
    client_secret : 'iMc4u5GP41LRkQsxIfewE_jv',
    api_scope : ' https://www.googleapis.com/auth/drive'
  });

  function _receiveList(timestamp) {
    googleAuth.authorize(function() {
      var handler = function() {
        if (this.readyState == this.DONE) {
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
        console.log('End receive file');
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

  this.setPlaySrc = function(src, player) {
    download(src, function(file) {
      var url = window.URL || window.webkitURL;
      player.src = url.createObjectURL(file);
    });
  }

  function buildList(response, timestamp) {
    console.log('Start building list');
    var songList = [];
    var fileList = JSON.parse(response);
    var items = fileList.items;
    for (var idx = 0, item; item = items[idx]; idx++) {
      if (item.mimeType === 'audio/mpeg') {
        song = {
          "artist" : 'Unknown',
          "album" : 'Unkown',
          "title" : item.title,
          "id" : item.id,
          "coverArt" : '',
          "contentType" : item.mimeType,
          "track" : 0,
          "cd" : 0,
          "duration" : 0,
          "genre" : '',
          "year" : 1900,
          "addedOn" : timestamp,
          "src" : item.downloadUrl,
          "backendId" : backendId
        };
        songList.push(song);
      }
    }
    Audica.trigger('readyCollectingSongs', {
      songList : songList,
      backendId : backendId,
      timestamp : timestamp
    });
  }

  this.setCoverArt = function(src, coverArt) {
  }

  this.init = function() {
    // nothing todo
  };
  Audica.on('updateSongList', function(args) {
    _receiveList(args.timestamp);
  });
}