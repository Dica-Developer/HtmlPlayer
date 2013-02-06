/*global $:true, AUDICA:true, Filesystem:true, FileImporter:true, RadioImporter:true, GoogleDrive:true, GoogleMusic:true,
 Subsonic:true, Scrobbler:true, Gracenote:true, window:true, Audica:true, console:true, chrome:true, document:true, localStorage:true*/
(function (window, document) {
  "use strict";
  $(function () {

    //TODO should this be window.AUDICA? jslint gives readonly warning
    window.Audica = new AUDICA();
    window.onerror = function (error, src, row) {
      //    window.event.preventDefault();
      console.log('Error: %s in %s row %s', error, src, row);
    };
    //TODO define an init method which initiates db, dom objects, options, events, etc.
    Audica.on('domElementsSet', Audica.View.applyCoverArtStyle);
    Audica.songDb.init('song');
    Audica.historyDb.init('history');
    Audica.on('readyCollectingSongs', function (args) {
      //maybe 'new Audica.collectSongs()' depends on performance and how many times this event is triggered at the same time
      Audica.collectSongs(args.songList, args.backendId, args.timestamp);
    });

    Audica.Dom.initDom();
    Audica.registerEvents();

    // TODO init plugins automatically and put them under Audica.Plugins
    Audica.plugins.fileSystem = new Filesystem();
    Audica.plugins.fileSystem.init();
    Audica.plugins.fileImporter = new FileImporter();
    Audica.plugins.fileImporter.init();
    Audica.plugins.radioImporter = new RadioImporter();
    Audica.plugins.radioImporter.init();
    Audica.plugins.googleDrive = new GoogleDrive();
    Audica.plugins.googleDrive.init();
    Audica.plugins.googleMusic = new GoogleMusic();
    Audica.plugins.googleMusic.init();
    Audica.plugins.subsonic = new Subsonic();
    Audica.plugins.scrobbler = new Scrobbler();
    Audica.plugins.scrobbler.init();


    var gracenoteClient_ID = localStorage.gracenoteClient_ID;
    var gracenoteWepAPI_ID = localStorage.gracenoteWepAPI_ID;

    if (gracenoteWepAPI_ID && gracenoteClient_ID) {
      Audica.plugins.gracenote = new Gracenote();
      Audica.plugins.gracenote.init();
    }
    // /TODO
    // TODO move this to FileImporter.init()
    // TODO add dropzone div also in FileImporter.init()
    document.querySelector('#fileImporter_dropZone').addEventListener('drop', function (event) {
      event.stopPropagation();
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      // TODO use own dropzone for type
      if (event.dataTransfer.files.length > 0) {
        Audica.plugins.fileImporter.writeFiles(event.dataTransfer.files);
      } else if (event.dataTransfer.items.length > 0) {
        Audica.plugins.radioImporter.addUrls(event.dataTransfer.items);
      } else {
        console.error('Not handled drop item!');
      }
    }, false);
    // /TODO
    //TODO should checked by plugin itself
    if (null === localStorage.serverUrl || undefined === localStorage.serverUrl) {
      //noinspection JSUnresolvedVariable,JSUnresolvedFunction
      document.location = chrome.extension.getURL("options/index.html");
    }

    Audica.on('initReady', Audica.updateSongList);
    window.setInterval(Audica.backgroundTasks, 1000);
  });
})(window, document);
