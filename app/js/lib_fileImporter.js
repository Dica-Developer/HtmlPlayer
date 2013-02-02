/*global $:true, Audica:true, FileError:true, PERSISTENT:true, console:true*/
(function (window) {
  "use strict";
  window.FileImporter = function() {
    var idx = 0, fileSystem = null;

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

    function onInitFs(fs) {
      fileSystem = fs;
    }

    this.init = function () {
      /** @namespace window.webkitStorageInfo */
      /** @namespace window.webkitStorageInfo.requestQuota */
      /** @namespace PERSISTENT */
      window.webkitStorageInfo.requestQuota(PERSISTENT, 1024 * 1024 * 1024, function (grantedBytes) {
        window.webkitRequestFileSystem(PERSISTENT, grantedBytes, onInitFs, errorHandler);
      }, function (e) {
        console.error('Error: ' + e);
      });
    };

    function writeFile(file) {
      //TODO reset index per timestamp and check for file name exists
      var fileName = 'fileImporter_' + $.now() + '_' + (++idx);
      fileSystem.root.getFile(fileName, {create:true}, function (fileEntry) {
        fileEntry.createWriter(function (fileWriter) {
          fileWriter.write(file);
        }, errorHandler);
      }, errorHandler);
    }

    this.writeFiles = function (files) {
      var _i = 0;
      for (_i; _i < files.length; ++_i) {
        var file = files[_i];
        writeFile(file);
      }
      if (Audica) {
        Audica.trigger('filesImported');
      }
    };
  };
})(window);
