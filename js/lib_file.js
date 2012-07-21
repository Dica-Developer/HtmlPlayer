(function($, View , JDV, log, debug){
  var fileSystem = null;
  var player = null;
  var fileReader = null;
  var entries = [];
  var localFilesystem = {};
  var onFileSystemChanged = new Event();
  var onID3readEnd = new Event();

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
    console.log(e);
    throw msg;
  };

  var onInitFs = function(fs) {
    fileSystem = fs;
    fileReader = new FileReader();
    window.fileSystem = fileSystem;
    log('FileSystem initialized');
    $(function(){
      FileExplorer.onMessage.notify({func:'initFileList', param: fileSystem});
    });
  };

  var writeFile = function(file, folder, songData) {
    log('Write file');
    var name, dirEntry;
    if(typeof songData !== 'undefined'){
      name = songData.title;//+'.mp3'; TODO do we need an extension?
      folder = '/'+songData.artist+'/'+songData.album;
      fileSystem.root.getDirectory(folder, {create: true}, function(dirEntry){
        write(file, dirEntry, name);
      }, errorHandler);
    }else if(typeof folder == 'string'){
      fileSystem.root.getDirectory(folder, {create: true}, function(dirEntry){
        write(file, dirEntry, name);
      }, errorHandler);
    }else{
      folder = folder || fileSystem.root;
      write(file, folder, name);
    }

    function write(f, dirEntry, name){
      debug(file);
      var fileName = f.name || name;
      dirEntry.getFile(fileName, {create: true}, function(fileEntry) {
        fileEntry.createWriter(function(fileWriter) {
          fileWriter.write(f); // Note: write() can take a File or Blob object.
          fileWriter.onwriteend = function(a,b,c,d){
            console.log(a,b,c,d);
            log('Write end');
            addFileToFileList(f, dirEntry);
            onFileSystemChanged.notify();
          };
        }, errorHandler);
      }, errorHandler);
    }
  };

  var removeFile = function(file){
    fileSystem.root.getFile(file, {create: false}, function(fileEntry) {
      fileEntry.remove(function() {
        log('File removed.');
        onFileSystemChanged.notify();
      }, errorHandler);
    }, errorHandler);
  };

  var readID3Tags = function(file){
    var me = this;
    var reader = new FileReader();
    reader.onerror = function(e){
      errorHandler(e)
    };
    reader.onloadend = function(e) {
      var dv = new JDV(this.result);
      var title = '';
      var artist = '';
      var album = '';
      if (dv.getString(4, dv.byteLength - 227) == 'TAG+') {
        title = dv.getString(60, dv.tell());
        artist = dv.getString(60, dv.tell());
        album = dv.getString(60, dv.tell());
      }else if(dv.getString(3, dv.byteLength - 128) == 'TAG') {
        title = dv.getString(30, dv.tell());
        artist = dv.getString(30, dv.tell());
        album = dv.getString(30, dv.tell());
      }
      log(title);
      onID3readEnd.notify({
        artist: artist,
        album: album,
        name: title,
        file: file
      });

    };
    reader.readAsArrayBuffer(file);
  };

  var createFolder = function(folders, root){
    log(folders);
    root = root || fileSystem.root;
    folders = folders.split('/');
    if (folders[0] == '.' || folders[0] == '') {
      folders = folders.slice(1);
    }
    root.getDirectory(folders[0], {create: true}, function(dirEntry) {
      if (folders.length) {
        createFolder(folders.slice(1),dirEntry);
      }
      onFileSystemChanged.notify();
    }, errorHandler);
  };

  var removeFolder = function(folderName){
    log('Remove Folder -> '+ folderName);
    fileSystem.root.getDirectory(folderName, {}, function(dirEntry) {
      console.log(dirEntry);
      dirEntry.removeRecursively(function() {
        log('Directory removed.');
        onFileSystemChanged.notify();
      }, errorHandler);
    }, errorHandler);
  };

  var addSrcToObject = function(obj, dirEntry){
    log('addSrcToObject');
    log(obj.title);
    dirEntry.getFile(obj.title, {create:false}, function(fileEntry){
      obj.src = fileEntry.toURL();
      var songList = JSON.parse(localStorage["songs.list"]);
      songList.push(obj);
      localStorage["songs.list"] = JSON.stringify(songList);
      fillSongBox(songList, null);
    }, errorHandler);
  };

  var addFileToFileList = function(file, dirEntry){
    var song = {
      title: file.name,
      isFile: true,
      src:'',
      contentType: file.type
    };
    addSrcToObject(song, dirEntry);
  };

  function init(){
    player = View.elements.player;
    window.webkitStorageInfo.requestQuota(PERSISTENT, 1024*1024*1024, function(grantedBytes) {
      window.webkitRequestFileSystem(PERSISTENT, grantedBytes, onInitFs, errorHandler);
    }, function(e) {
      log('Error: '+ e);
    });
  }

  window.onViewRendered.subscribe(function(){
    init();
  });

  window.FileApi = {
    init:init,
    fileSystem : fileSystem,
    writeFile: writeFile,
    removeFile: removeFile,
    createFolder: createFolder,
    removeFolder: removeFolder,
    addFileToFileList: addFileToFileList,
    readID3Tags: readID3Tags,
    onID3readEnd: onID3readEnd,
    onFileSystemChanged: onFileSystemChanged
  };
})(jQuery,window.View, window.jDataView, window.log, window.debug);