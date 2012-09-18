function GoogleDrive() {
  var googleAuth = new OAuth2('google', {
    client_id : '1063427035831-k99scrsm000891i5e5ao3fs2jh6pj0hr.apps.googleusercontent.com',
    client_secret : 'iMc4u5GP41LRkQsxIfewE_jv',
    api_scope : ' https://www.googleapis.com/auth/drive'
  });

  function _receiveList(timestamp) {
    googleAuth.authorize(function() {
      var handler = function() {
        if (this.readyState == this.DONE) {
          console.log('Finished receive google drive information', true);
          buildList(this.response, timestamp);
        }
      };

      console.log('Start receive google drive information', true);
      var client = new XMLHttpRequest();
      client.onreadystatechange = handler;
      client.open("GET", 'https://www.googleapis.com/drive/v2/files');
      client.setRequestHeader('Authorization', 'OAuth ' + googleAuth.getAccessToken());
      client.send(null);
    });
  }

  function buildList(response, timestamp) {
    console.log('Start building list', true);
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
          "backendId" : 'googledrive',
          "stream" : 'false'
        };
        songList.push(song);
      }
    }
    Audica.trigger('readyCollectingSongs', {
      songList : songList,
      backendId : 'googledrive',
      timestamp : timestamp
    }); 

  }


  this.init = function() {
    // nothing todo
  };
  Audica.on('updateSongList', function(args) {
    _receiveList(args.timestamp);
  });
}
