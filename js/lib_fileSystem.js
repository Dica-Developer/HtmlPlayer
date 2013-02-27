/*global $, FileError, console, Audica, PERSISTENT, window*/
(function (window) {
  "use strict";
  function Filesystem() {
    var backendId = 'filesystem';
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
          msg = 'Unknown Error: ' + e;
          break;
      }
      throw msg;
    }

    /**
     *
     * @param {Number} timestamp
     * @private
     */
    var _searchForSongs = function(timestamp) {
      var reader = fileSystem.root.createReader();
      reader.readEntries(function (results) {
        var songList = [];
        for (var i = 0; i < results.length; i++) {
          var song = readFile(results[i], timestamp);
          songList.push(song);
        }
        Audica.trigger('readyCollectingSongs', {songList:songList, backendId:backendId, timestamp:timestamp});
      }, function (e) {
        console.error(e);
      });
    };

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
          "artist":'Unknown',
          "album":'Unknown',
          "title":entry.name,
          "id":entry.name,
          "coverArt":'',
          "contentType":entry.type,
          "track":0,
          "cd":0,
          "duration":0,
          "genre":'',
          "year":1900,
          "addedOn":timestamp,
          "src":entry.toURL(),
          "backendId":backendId
        };
      } else {
        console.log('Cannot handle "' + entry.name + '". It is a file.');
      }
      return song;
    }

    this.setPlaySrc = function (src, player) {
      player.src = src;
    };

    this.setCoverArt = function () {
    };

    /**
     *
     * @param fs
     */
    function onInitFs(fs) {
      fileSystem = fs;
      Audica.on('updateSongList', function (args) {
        _searchForSongs(args.timestamp);
      });

      Audica.on('filesImported', function () {
        _searchForSongs($.now());
      });
      Audica.trigger('initReady');
    }

    this.init = function () {
      if(window.webkitStorageInfo){
        window.webkitStorageInfo.requestQuota(PERSISTENT, 1024 * 1024 * 1024, function (grantedBytes) {
          window.webkitRequestFileSystem(PERSISTENT, grantedBytes, onInitFs, errorHandler);
        }, function (e) {
          console.error('Error: ' + e);
        });
      }else{
        console.error('No webkitStorage available');
        Audica.trigger('initReady');
      }
    };
  }
  Audica.extend('fileSystem', new Filesystem());
})(window);