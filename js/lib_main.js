$(function () {
  Audica.Dom.initDom();
  Audica.registerEvents();

  // TODO init plugins automatically and put them under Audica.Plugins
  var fileSystem = new Filesystem();
  fileSystem.init();
  var fileImporter = new FileImporter();
  fileImporter.init();
  var radioImporter = new RadioImporter();
  radioImporter.init();
  var googleDrive = new GoogleDrive();
  googleDrive.init();
  // TODO move this to FileImporter.init()
  // TODO add dropzone div also in FileImporter.init()
  document.querySelector('#fileImporter_dropZone').addEventListener('drop', function(event) {
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    // TODO use own dropzone for type
    if (event.dataTransfer.files.length >0) {
      fileImporter.writeFiles(event.dataTransfer.files);
    } else if (event.dataTransfer.items.length >0) {
      radioImporter.addUrls(event.dataTransfer.items);
    } else {
      console.error('Not handled drop item!');
    }
  }, false);
  Audica.Subsonic = new SUBSONIC();

//TODO should checked by plugin itself
  if (null === localStorage["serverUrl"] || undefined === localStorage["serverUrl"]) {
    //noinspection JSUnresolvedVariable,JSUnresolvedFunction
    document.location = chrome.extension.getURL("options/index.html");
  }
  // TODO fire it after all backend plugins are initialized
  Audica.on('initReady', Audica.updateSongList);
//  Audica.updateSongList();
  setInterval(Audica.backgroundTasks, 1000);
});
