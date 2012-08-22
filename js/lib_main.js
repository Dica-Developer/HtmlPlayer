$(function () {
  Audica.Dom.initDom();
  Audica.registerEvents();

  // TODO init plugins automatically and put them under Audica.Plugins
  var fileSystem = new Filesystem();
  fileSystem.init();
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