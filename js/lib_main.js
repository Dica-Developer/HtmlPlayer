$(function () {
  Audica.Dom.initDom();
  Audica.registerEvents();

  // TODO init plugins automatically and put them under Audica.Plugins
  Audica.plugins.fileSystem = new Filesystem()
  Audica.plugins.fileSystem.init();
  Audica.plugins.fileImporter = new FileImporter();
  Audica.plugins.fileImporter.init();
  Audica.plugins.radioImporter = new RadioImporter();
  Audica.plugins.radioImporter.init();
  Audica.plugins.googleDrive = new GoogleDrive();
  Audica.plugins.googleDrive.init();
  Audica.plugins.subsonic = new Subsonic();
  Audica.plugins.scrobbler = new Scrobbler();
  Audica.plugins.scrobbler.init();
  // /TODO
  // TODO move this to FileImporter.init()
  // TODO add dropzone div also in FileImporter.init()
  document.querySelector('#fileImporter_dropZone').addEventListener('drop', function(event) {
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    // TODO use own dropzone for type
    if (event.dataTransfer.files.length >0) {
      Audica.plugins.fileImporter.writeFiles(event.dataTransfer.files);
    } else if (event.dataTransfer.items.length >0) {
      Audica.plugins.radioImporter.addUrls(event.dataTransfer.items);
    } else {
      console.error('Not handled drop item!');
    }
  }, false);
  // /TODO

//TODO should checked by plugin itself
  if (null === localStorage["serverUrl"] || undefined === localStorage["serverUrl"]) {
    //noinspection JSUnresolvedVariable,JSUnresolvedFunction
    document.location = chrome.extension.getURL("options/index.html");
  }

  Audica.on('initReady', Audica.updateSongList);
  setInterval(Audica.backgroundTasks, 1000);
});
