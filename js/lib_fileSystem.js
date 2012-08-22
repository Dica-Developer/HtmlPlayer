function Filesystem () {
  var backendId = 'filesystem';
  var reader = null;
  var fileSystem = null;

  /**
   *
   * @param {Event} e
   */
  function errorHandler(e) {
    var msg = '';
    switch (e.code) {
      case FileError.QUOTA_EXCEEDED_ERR:
        msg = 'QUOTA_EXCEEDED_ERR';
        break;
      case FileError.NOT_FOUND_ERR:
        msg = 'NOT_FOUND_ERR';
        break;
      case FileError.SECURITY_ERR:
        msg = 'SECURITY_ERR';
        break;
      case FileError.INVALID_MODIFICATION_ERR:
        msg = 'INVALID_MODIFICATION_ERR';
        break;
      case FileError.INVALID_STATE_ERR:
        msg = 'INVALID_STATE_ERR';
        break;
      default:
        msg = 'Unknown Error: '+e;
        break;
    }
    throw msg;
  }

  /**
   *
   * @param {Number} timestamp
   * @private
   */
  function _searchForSongs(timestamp) {
    reader.readEntries(function (results) {
      var songList = [];
      for (var i = 0; i < results.length; i++) {
        var song = readFile(results[i], timestamp);
        songList.push(song);
      }
      Audica.trigger('readyCollectingSongs', {songList:songList, backendId:'filesystem', timestamp:timestamp});
    }, function (e) {
      console.error(e);
    });
  }

  /**
   *
   * @param entry
   * @param {Number} timestamp
   * @return {Object|Null}
   */
  function readFile(entry, timestamp) {
    var song = null;
    if (entry.isFile) {
        song = {
          "artist": 'Unknown',
          "album": 'Unkown',
          "title": entry.name,
          "id": entry.name,
          "coverArt": '',
          "contentType": entry.type,
          "track": 0,
          "duration": 0,
          "genre": '',
          "year": 1900,
          "addedOn" : timestamp,
          "src" : entry.toURL(),
          "backendId": 'filesystem'
        };
    } else {
      console.log('Cannot handle "' + entry.name + '". It is a file.');
    }
    return song;
  }

  /**
   *
   * @param fs
   */
  function onInitFs(fs) {
    fileSystem = fs;
    reader = fileSystem.root.createReader();
    Audica.trigger('initReady');
  }

  this.init = function(){
    window.webkitStorageInfo.requestQuota(PERSISTENT, 1024*1024*1024, function(grantedBytes) {
      window.webkitRequestFileSystem(PERSISTENT, grantedBytes, onInitFs, errorHandler);
    }, function(e) {
      console.error('Error: '+ e);
    });
  };

  Audica.on('updateSongList', function(args){
    _searchForSongs(args.timestamp);
  });
}
