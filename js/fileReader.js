(function($, window, log, debug) {

  var lock = false;
  var reader = null;
  var fileSystemType = window.PERSISTENT;
  var fileSystemCopy = null;

  var errorHandler = function(e) {
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
  };

  function fileSystemError(e) {
    log('Error');
    errorHandler(e);
  }

  function fileSystemErrorAndFinishRequest(e) {
    log('Error');
    errorHandler(e);
    finishRequest();
  }

  function readFileSystem(callBack) {
    if (!lock) throw 'fs_list is called without lock.';
    reader.readEntries(function (results) {
      if (results.length == 0) {
        finishRequest();
        return;
      }
      currentPendingEntries = results.length;
      for (var i = 0; i < results.length; i++) {
        if (callBack)
          callBack(results[i]);
      }
      readFileSystem(callBack);
    }, function (e) {
      fileSystemErrorAndFinishRequest(e);
    });
  }

  function initFileList(fileSystem) {
    if (!startRequest()) return;
    fileSystemCopy = fileSystem;
    reader = fileSystemCopy.root.createReader();
    debug('createReader: created for root');
    displayUsage(window.PERSISTENT);
    readFileSystem(listEntry);
  }

  function updateFileList(){
    debug('File reader: Update List');
    if (!startRequest()) return;
    reader = fileSystemCopy.root.createReader();
    displayUsage(window.PERSISTENT);
    readFileSystem(listEntry);
  }

  function changeDirectory(dir) {
    debug('Change Directory to : ' + dir);
    if (!startRequest()) return;

    fileSystemCopy.root.getDirectory(
      dir,
      {create:false},
      function (entry) {
        reader = entry.createReader();
        readFileSystem(listEntry);
      }, function (e) {
        fileSystemErrorAndFinishRequest(e);
      });
  }

  function listEntry(entry) {
    var request = {};
    if (entry.isFile) {
      entry.file(function (newFile,b,c,d) {
        request = {
          'type':'file',
          'name':entry.name,
          'size':newFile.size,
          'path':entry.fullPath,
          'url':entry.toURL()
        };
        console.log(newFile, entry,b,c,d);
        if(entry.gID)request.gID = entry.gId;
        debug('currentPendingEntries = ' + currentPendingEntries);
        debug('Send: ');
        debug(request);
        View.onMessage.notify(request);
        check_send_all(entry);
      }.bind(this));
    } else {
      request = {
        'type':'dir',
        'name':entry.name,
        'path':entry.fullPath,
        'url':entry.toURL()
      };
      debug('currentPendingEntries = ' + currentPendingEntries);
      debug('Send: ');
      debug(request);
      View.onMessage.notify(request);
      check_send_all(entry);
    }
  }

  function check_send_all(entry) {
    if (--currentPendingEntries == 0) {
      View.onMessage.notify({
        'path' : entry.fullPath,
        'type' : 'show'
      });
    }
  }

  function deleteAll() {
    debug('Delete all init');
    if (!startRequest()) return;

    reader = fileSystemCopy.root.createReader();

    readFileSystem(removeEntry);
  }

// Called only from delete_all.
  function removeEntry(entry) {
    if (!lock) throw 'remove_file is called without lock.';
    debug('remove entry');
    if (entry.isFile) {
      entry.remove(function () {
        debug('File successfully removed');
      }, fileSystemError);
    } else {
      entry.removeRecursively(function () {
        debug('Directory successfully removed');
      }, fileSystemError);
    }
  }

  function displayUsage(type) {
    fileSystemType = type;
    debug('fileSystemType: ' + fileSystemType);
    webkitStorageInfo.queryUsageAndQuota(
      fileSystemType,
      function (usage, quota) {
        View.onMessage.notify({
          'type' : 'usage',
          'usage': usage,
          'quota': quota
        });
      }, fileSystemError);
  }

  function startRequest() {
    if (lock)
      throw 'Got request while handling another one';
    lock = true;
    return true;
  }

  function finishRequest() {
    lock = false;
    View.onMessage.notify({
      'type' : 'finished'
    });
  }

  var onMessage = new Event();
  onMessage.subscribe(function(e,request) {
      debug(request);
      if (request.func == 'initFileList') {
        initFileList(request.param);
      } else if (request.func == 'changeDirectory') {
        changeDirectory(request.param);
      } else if (request.func == 'deleteAll') {
        deleteAll();
      }else if (request.func == 'updateFileList') {
        updateFileList();
      } else {
        debug("Got unknown request " + request);
      }
      return false;
  });

  window.FileExplorer = {
    onMessage:onMessage
  };
})(jQuery, window, window.log, window.debug);