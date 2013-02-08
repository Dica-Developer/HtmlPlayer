/*global $, PERSISTENT, Audica, FileError, console*/
(function (window, Audica) {
  "use strict";

  function FileImporter() {
    var idx = 0;
    var fileSystem = null;

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
      Audica.trigger('initReady');
    }


    function writeFile(file) {
      // TODO reset index per timestamp and check for file name exists
      var fileName = 'fileImporter_' + $.now() + '_' + (++idx);
      fileSystem.root.getFile(fileName, {create:true}, function (fileEntry) {
        fileEntry.createWriter(function (fileWriter) {
          fileWriter.write(file);
        }, errorHandler);
      }, errorHandler);
    }

    this.writeFiles = function (files) {
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        writeFile(file);
      }
      if (Audica) {
        Audica.trigger('filesImported');
      }
    };

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

  Audica.extend('fileImporter', new FileImporter());
})(window, Audica);
